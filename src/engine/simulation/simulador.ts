import { voltajeFuente } from '../electrical/fuentes';
import { CONDICIONES_INICIALES_REPOSO } from '../electrical/parametros';
import type { CondicionesIniciales, ParametrosCircuito, TipoAmortiguamiento } from '../electrical/tipos';
import { clasificarAmortiguamiento, TOLERANCIA_CRITICA_POR_DEFECTO } from '../mathematics/clasificacion';
import { calcularParametrosDerivados, type ParametrosDerivados } from '../mathematics/parametrosDerivados';
import { calcularRaicesCaracteristicas, type RaicesCaracteristicas } from '../mathematics/raices';
import { integrarRK4, LIMITE_ESTABILIDAD_RK4, type SistemaPrimerOrden } from '../mathematics/rk4';
import { resolverAnaliticamente, type SolucionAnalitica } from '../mathematics/solucionAnalitica';
import { validarSimulacion, type ValidacionModelo } from './validaciones';

export interface OpcionesSimulacion {
  condiciones?: CondicionesIniciales;
  /** Tolerancia sobre |ζ − 1| para clasificar como crítico. */
  toleranciaCritica?: number;
  /** Paso de integración RK4 en s. Si se omite se calcula automáticamente. */
  pasoIntegracion?: number;
  /** Duración de la simulación en s. Si se omite se calcula a partir de τ y ω₀. */
  duracion?: number;
  /** Número de muestras de la malla de salida (uniforme). */
  muestras?: number;
}

export interface SerieTemporal {
  t: number[];
  /** Carga q(t) [C] obtenida por RK4. */
  q: number[];
  /** Corriente i(t) = dq/dt [A] obtenida por RK4. */
  i: number[];
  /** di/dt [A/s] evaluada con la ecuación diferencial. */
  didt: number[];
  E: number[];
  vL: number[];
  vR: number[];
  vC: number[];
  /** Potencia disipada P_R = R i² [W]. */
  potenciaR: number[];
  /** Energía magnética ½ L i² [J]. */
  energiaL: number[];
  /** Energía eléctrica q²/(2C) [J]. */
  energiaC: number[];
  /** Energía disipada acumulada ∫ R i² dt [J]. */
  energiaDisipada: number[];
  /** Energía entregada por la fuente ∫ E i dt [J]. */
  energiaFuente: number[];
}

export interface ResultadoSimulacion {
  parametros: ParametrosCircuito;
  condiciones: CondicionesIniciales;
  derivados: ParametrosDerivados;
  raices: RaicesCaracteristicas;
  clasificacion: TipoAmortiguamiento;
  duracion: number;
  pasoIntegracion: number;
  pasoMuestreo: number;
  serie: SerieTemporal;
  /** Solución analítica muestreada en la misma malla (solo fuente constante). */
  analitica: { q: number[]; i: number[] } | null;
  solucionAnalitica: SolucionAnalitica | null;
  /** Errores máximos absolutos RK4 vs. analítica. */
  errorNumerico: { carga: number; corriente: number } | null;
  /** Carga de referencia para normalizar la visualización (C·E₀). */
  cargaReferencia: number;
  corrienteMaxima: number;
  potenciaMaxima: number;
  /** Tiempo a partir del cual |q − q∞| < 2 % de q∞ (solo fuente constante). */
  tiempoEstabilizacion: number | null;
  /** Sobrepaso máximo de la carga sobre C·E₀, en %. */
  sobrepaso: number | null;
  /** |λ_max|·h dividido por el límite de estabilidad de RK4 (2.785); debe ser ≪ 1. */
  indiceEstabilidad: number;
  validaciones: ValidacionModelo[];
}

/** Duración que cubre el transitorio (≈ 6τ) y varios periodos, acotada a [0.05, 20] s. */
export function calcularDuracionRecomendada(parametros: ParametrosCircuito, derivados: ParametrosDerivados): number {
  const transitorio = 6 * derivados.constanteTiempoDominante;
  const periodos = (3 * 2 * Math.PI) / derivados.frecuenciaNatural;
  let duracion = Math.max(transitorio, periodos);
  const { fuente } = parametros;
  if (fuente.tipo === 'sinusoidal' || fuente.tipo === 'cuadrada') {
    duracion = Math.max(duracion, 4 / fuente.frecuencia);
  }
  if (fuente.tipo === 'pulso') duracion = Math.max(duracion, fuente.anchoPulso + transitorio);
  return Math.min(20, Math.max(0.05, duracion));
}

export function crearSistemaRLC(parametros: ParametrosCircuito): SistemaPrimerOrden {
  const { inductancia: L, resistencia: R, capacitancia: C, fuente } = parametros;
  return (t, q, i) => [i, (voltajeFuente(fuente, t) - R * i - q / C) / L];
}

export function simularCircuito(parametros: ParametrosCircuito, opciones: OpcionesSimulacion = {}): ResultadoSimulacion {
  const condiciones = opciones.condiciones ?? CONDICIONES_INICIALES_REPOSO;
  const { inductancia: L, resistencia: R, capacitancia: C, fuente } = parametros;

  const derivados = calcularParametrosDerivados(parametros);
  const raices = calcularRaicesCaracteristicas(L, R, C);
  const clasificacion = clasificarAmortiguamiento(
    derivados.relacionAmortiguamiento,
    opciones.toleranciaCritica ?? TOLERANCIA_CRITICA_POR_DEFECTO,
  );

  const duracion = opciones.duracion ?? calcularDuracionRecomendada(parametros, derivados);
  const raizRapida = Math.max(Math.hypot(raices.r1.re, raices.r1.im), Math.hypot(raices.r2.re, raices.r2.im));
  // La malla de salida debe resolver también la raíz rápida (|λ|·Δt ≤ 0.15) para que las
  // curvas y las validaciones por diferencias finitas sean fieles en casos rígidos.
  const muestras =
    opciones.muestras ?? Math.min(20000, Math.max(2000, Math.ceil((duracion * raizRapida) / 0.15)));
  const pasoMuestreo = duracion / muestras;

  // Paso automático: resuelve la oscilación (≥ 200 pasos por periodo), la raíz rápida
  // (|λ|·h ≤ 0.05) y los cambios de la fuente.
  let pasoObjetivo = Math.min(pasoMuestreo, (2 * Math.PI) / derivados.frecuenciaNatural / 200, 0.05 / raizRapida);
  if (fuente.tipo === 'sinusoidal' || fuente.tipo === 'cuadrada') pasoObjetivo = Math.min(pasoObjetivo, 1 / fuente.frecuencia / 200);
  if (opciones.pasoIntegracion) pasoObjetivo = Math.min(opciones.pasoIntegracion, pasoMuestreo);
  const pasosPorMuestra = Math.max(1, Math.ceil(pasoMuestreo / pasoObjetivo));
  const h = pasoMuestreo / pasosPorMuestra;

  const integracion = integrarRK4(
    crearSistemaRLC(parametros),
    [condiciones.cargaInicial, condiciones.corrienteInicial],
    h,
    muestras,
    pasosPorMuestra,
  );

  const n = integracion.t.length;
  const serie: SerieTemporal = {
    t: integracion.t,
    q: integracion.x1,
    i: integracion.x2,
    didt: new Array(n),
    E: new Array(n),
    vL: new Array(n),
    vR: new Array(n),
    vC: new Array(n),
    potenciaR: new Array(n),
    energiaL: new Array(n),
    energiaC: new Array(n),
    energiaDisipada: new Array(n),
    energiaFuente: new Array(n),
  };

  let corrienteMaxima = 0;
  let potenciaMaxima = 0;
  for (let k = 0; k < n; k++) {
    const t = serie.t[k];
    const q = serie.q[k];
    const i = serie.i[k];
    const E = voltajeFuente(fuente, t);
    const vR = R * i;
    const vC = q / C;
    const didt = (E - vR - vC) / L;
    serie.E[k] = E;
    serie.vR[k] = vR;
    serie.vC[k] = vC;
    serie.didt[k] = didt;
    serie.vL[k] = L * didt;
    serie.potenciaR[k] = R * i * i;
    serie.energiaL[k] = 0.5 * L * i * i;
    serie.energiaC[k] = (q * q) / (2 * C);
    if (k === 0) {
      serie.energiaDisipada[k] = 0;
      serie.energiaFuente[k] = 0;
    } else {
      // Regla del trapecio sobre la malla de salida.
      const dt = t - serie.t[k - 1];
      serie.energiaDisipada[k] = serie.energiaDisipada[k - 1] + 0.5 * dt * (serie.potenciaR[k] + serie.potenciaR[k - 1]);
      serie.energiaFuente[k] = serie.energiaFuente[k - 1] + 0.5 * dt * (E * i + serie.E[k - 1] * serie.i[k - 1]);
    }
    corrienteMaxima = Math.max(corrienteMaxima, Math.abs(i));
    potenciaMaxima = Math.max(potenciaMaxima, serie.potenciaR[k]);
  }

  const solucionAnalitica = resolverAnaliticamente(parametros, condiciones);
  let analitica: ResultadoSimulacion['analitica'] = null;
  let errorNumerico: ResultadoSimulacion['errorNumerico'] = null;
  if (solucionAnalitica) {
    const qa = serie.t.map(solucionAnalitica.carga);
    const ia = serie.t.map(solucionAnalitica.corriente);
    analitica = { q: qa, i: ia };
    let errorCarga = 0;
    let errorCorriente = 0;
    for (let k = 0; k < n; k++) {
      errorCarga = Math.max(errorCarga, Math.abs(qa[k] - serie.q[k]));
      errorCorriente = Math.max(errorCorriente, Math.abs(ia[k] - serie.i[k]));
    }
    errorNumerico = { carga: errorCarga, corriente: errorCorriente };
  }

  const cargaFinal = fuente.tipo === 'constante' ? C * fuente.amplitud : null;
  let cargaMaximaAbs = 0;
  for (const q of serie.q) cargaMaximaAbs = Math.max(cargaMaximaAbs, Math.abs(q));
  const cargaReferencia = Math.max(C * fuente.amplitud, cargaMaximaAbs, 1e-12);

  let tiempoEstabilizacion: number | null = null;
  let sobrepaso: number | null = null;
  if (cargaFinal !== null) {
    const banda = 0.02 * Math.abs(cargaFinal);
    let ultimoFuera = -1;
    for (let k = n - 1; k >= 0; k--) {
      if (Math.abs(serie.q[k] - cargaFinal) > banda) {
        ultimoFuera = k;
        break;
      }
    }
    tiempoEstabilizacion = ultimoFuera < n - 1 ? serie.t[Math.min(ultimoFuera + 1, n - 1)] : null;
    const maximo = Math.max(...serie.q);
    sobrepaso = Math.max(0, ((maximo - cargaFinal) / cargaFinal) * 100);
  }

  const resultado: ResultadoSimulacion = {
    parametros,
    condiciones,
    derivados,
    raices,
    clasificacion,
    duracion,
    pasoIntegracion: h,
    pasoMuestreo,
    serie,
    analitica,
    solucionAnalitica,
    errorNumerico,
    cargaReferencia,
    corrienteMaxima,
    potenciaMaxima,
    tiempoEstabilizacion,
    sobrepaso,
    indiceEstabilidad: (raizRapida * h) / LIMITE_ESTABILIDAD_RK4,
    validaciones: [],
  };
  resultado.validaciones = validarSimulacion(resultado);
  return resultado;
}
