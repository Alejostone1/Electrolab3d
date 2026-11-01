import type { CondicionesIniciales, ParametrosCircuito } from '../electrical/tipos';
import { calcularRaicesCaracteristicas, type TipoRaices } from './raices';

/**
 * Solución analítica de  L q'' + R q' + q/C = E₀  (fuente constante).
 *
 * Se escribe q(t) = q_p + u(t) con la solución particular q_p = C·E₀ y
 * u(t) solución de la ecuación homogénea con
 *   u(0) = q(0) − C·E₀,   u'(0) = i(0).
 *
 * Según las raíces de L r² + R r + 1/C = 0:
 *  - complejas  r = −α ± iωd:  u = e^{−αt}(A cos ωd t + B sen ωd t)
 *  - repetida   r = −α:        u = (A + B t) e^{−αt}
 *  - distintas  r₁, r₂:        u = A e^{r₁t} + B e^{r₂t}
 */
export interface SolucionAnalitica {
  tipoRaices: TipoRaices;
  cargaParticular: number;
  /** Constantes A y B obtenidas de las condiciones iniciales. */
  constantes: { A: number; B: number };
  /** Exponentes/frecuencias usados por la forma de la solución. */
  forma:
    | { tipo: 'complejas-conjugadas'; alfa: number; omegaD: number }
    | { tipo: 'reales-repetidas'; alfa: number }
    | { tipo: 'reales-distintas'; r1: number; r2: number };
  carga: (t: number) => number;
  corriente: (t: number) => number;
}

export function resolverAnaliticamente(
  parametros: ParametrosCircuito,
  condiciones: CondicionesIniciales,
): SolucionAnalitica | null {
  if (parametros.fuente.tipo !== 'constante') return null;

  const { inductancia: L, resistencia: R, capacitancia: C } = parametros;
  const E0 = parametros.fuente.amplitud;
  const raices = calcularRaicesCaracteristicas(L, R, C);
  const cargaParticular = C * E0;
  const u0 = condiciones.cargaInicial - cargaParticular;
  const v0 = condiciones.corrienteInicial;
  const alfa = R / (2 * L);

  if (raices.tipo === 'complejas-conjugadas') {
    const omegaD = raices.r1.im;
    const A = u0;
    const B = (v0 + alfa * u0) / omegaD;
    return {
      tipoRaices: raices.tipo,
      cargaParticular,
      constantes: { A, B },
      forma: { tipo: 'complejas-conjugadas', alfa, omegaD },
      carga: (t) => cargaParticular + Math.exp(-alfa * t) * (A * Math.cos(omegaD * t) + B * Math.sin(omegaD * t)),
      corriente: (t) =>
        Math.exp(-alfa * t) *
        ((B * omegaD - alfa * A) * Math.cos(omegaD * t) - (A * omegaD + alfa * B) * Math.sin(omegaD * t)),
    };
  }

  if (raices.tipo === 'reales-repetidas') {
    const A = u0;
    const B = v0 + alfa * u0;
    return {
      tipoRaices: raices.tipo,
      cargaParticular,
      constantes: { A, B },
      forma: { tipo: 'reales-repetidas', alfa },
      carga: (t) => cargaParticular + (A + B * t) * Math.exp(-alfa * t),
      corriente: (t) => (B - alfa * (A + B * t)) * Math.exp(-alfa * t),
    };
  }

  const r1 = raices.r1.re;
  const r2 = raices.r2.re;
  const A = (v0 - r2 * u0) / (r1 - r2);
  const B = u0 - A;
  return {
    tipoRaices: raices.tipo,
    cargaParticular,
    constantes: { A, B },
    forma: { tipo: 'reales-distintas', r1, r2 },
    carga: (t) => cargaParticular + A * Math.exp(r1 * t) + B * Math.exp(r2 * t),
    corriente: (t) => A * r1 * Math.exp(r1 * t) + B * r2 * Math.exp(r2 * t),
  };
}
