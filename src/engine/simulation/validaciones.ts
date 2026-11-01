import { esFuenteDiscontinua } from '../electrical/fuentes';
import type { ResultadoSimulacion } from './simulador';

/**
 * Validaciones físicas y numéricas que se ejecutan sobre cada simulación.
 * Si alguna falla, la interfaz lo advierte en lugar de presentar el resultado
 * como físicamente correcto.
 */
export interface ValidacionModelo {
  id: string;
  nombre: string;
  descripcion: string;
  /** Error relativo medido. */
  valor: number;
  tolerancia: number;
  aprobada: boolean;
}

function crear(id: string, nombre: string, descripcion: string, valor: number, tolerancia: number): ValidacionModelo {
  return { id, nombre, descripcion, valor, tolerancia, aprobada: Number.isFinite(valor) && valor <= tolerancia };
}

export function validarSimulacion(resultado: ResultadoSimulacion): ValidacionModelo[] {
  const { serie, parametros, condiciones } = resultado;
  const { inductancia: L, resistencia: R, capacitancia: C } = parametros;
  const n = serie.t.length;
  const escalaCarga = Math.max(resultado.cargaReferencia, 1e-12);
  const escalaCorriente = Math.max(resultado.corrienteMaxima, 1e-12);
  const escalaVoltaje = Math.max(parametros.fuente.amplitud, 1e-12);
  const discontinua = esFuenteDiscontinua(parametros.fuente.tipo);

  const validaciones: ValidacionModelo[] = [];

  // 1. Condiciones iniciales.
  const errorInicial = Math.max(
    Math.abs(serie.q[0] - condiciones.cargaInicial) / escalaCarga,
    Math.abs(serie.i[0] - condiciones.corrienteInicial) / escalaCorriente,
  );
  validaciones.push(
    crear('condiciones', 'Condiciones iniciales', 'q(0) y i(0) coinciden con los valores impuestos.', errorInicial, 1e-12),
  );

  // 2. Relación carga-corriente: dq/dt (diferencias centrales) ≈ i.
  // 3. Segunda ley de Kirchhoff: E − (L di/dt + R i + q/C) ≈ 0, con di/dt por diferencias centrales.
  let errorRelacion = 0;
  let errorKirchhoff = 0;
  for (let k = 1; k < n - 1; k++) {
    const dt = serie.t[k + 1] - serie.t[k - 1];
    if (discontinua && serie.E[k + 1] !== serie.E[k - 1]) continue;
    const dqdt = (serie.q[k + 1] - serie.q[k - 1]) / dt;
    const didt = (serie.i[k + 1] - serie.i[k - 1]) / dt;
    errorRelacion = Math.max(errorRelacion, Math.abs(dqdt - serie.i[k]) / escalaCorriente);
    const residuo = serie.E[k] - (L * didt + R * serie.i[k] + serie.q[k] / C);
    errorKirchhoff = Math.max(errorKirchhoff, Math.abs(residuo) / escalaVoltaje);
  }
  validaciones.push(
    crear('carga-corriente', 'Relación i = dq/dt', 'La derivada numérica de q(t) reproduce la corriente i(t).', errorRelacion, 1e-2),
  );
  validaciones.push(
    crear(
      'kirchhoff',
      'Segunda ley de Kirchhoff',
      'E(t) = V_L + V_R + V_C en cada instante (V_L con di/dt por diferencias finitas).',
      errorKirchhoff,
      2e-2,
    ),
  );

  // 4. Suma de voltajes usando la ecuación del modelo (debe ser exacta a precisión de máquina).
  let errorSuma = 0;
  for (let k = 0; k < n; k++) {
    errorSuma = Math.max(errorSuma, Math.abs(serie.E[k] - (serie.vL[k] + serie.vR[k] + serie.vC[k])) / escalaVoltaje);
  }
  validaciones.push(crear('suma-voltajes', 'Suma de voltajes', 'V_L + V_R + V_C = E(t) en la malla de salida.', errorSuma, 1e-9));

  // 5. Balance energético: W_fuente = E_L + E_C + E_disipada − E_inicial.
  const energiaInicial = serie.energiaL[0] + serie.energiaC[0];
  let errorEnergia = 0;
  let escalaEnergia = 1e-15;
  for (let k = 0; k < n; k++) escalaEnergia = Math.max(escalaEnergia, Math.abs(serie.energiaFuente[k]), serie.energiaC[k]);
  for (let k = 0; k < n; k++) {
    const almacenada = serie.energiaL[k] + serie.energiaC[k] - energiaInicial + serie.energiaDisipada[k];
    errorEnergia = Math.max(errorEnergia, Math.abs(almacenada - serie.energiaFuente[k]) / escalaEnergia);
  }
  validaciones.push(
    crear(
      'energia',
      'Balance energético',
      'La energía entregada por la fuente = energía en L + energía en C + energía disipada en R.',
      errorEnergia,
      2e-2,
    ),
  );

  // 6. Estabilidad numérica de RK4.
  validaciones.push(
    crear(
      'estabilidad',
      'Estabilidad de RK4',
      '|λ_max|·h como fracción del límite de estabilidad 2.785 de RK4.',
      resultado.indiceEstabilidad,
      0.5,
    ),
  );

  // 7. Concordancia con la solución analítica (fuente constante).
  if (resultado.errorNumerico) {
    const errorRelativo = Math.max(
      resultado.errorNumerico.carga / escalaCarga,
      resultado.errorNumerico.corriente / escalaCorriente,
    );
    validaciones.push(
      crear('analitica', 'RK4 vs. solución analítica', 'Error relativo máximo entre la integración numérica y la solución cerrada.', errorRelativo, 1e-6),
    );
  }

  return validaciones;
}
