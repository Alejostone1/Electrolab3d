import type { ParametrosCircuito } from '../electrical/tipos';

/**
 * Parámetros derivados de la ecuación  L q'' + R q' + q/C = E(t).
 */
export interface ParametrosDerivados {
  /** ω₀ = 1/√(LC) en rad/s. */
  frecuenciaNatural: number;
  /** f₀ = ω₀ / 2π en Hz. */
  frecuenciaNaturalHz: number;
  /** α = R / 2L en s⁻¹. */
  coeficienteAmortiguamiento: number;
  /** ζ = α / ω₀ (adimensional). */
  relacionAmortiguamiento: number;
  /** R crítica = 2√(L/C) en Ω. */
  resistenciaCritica: number;
  /** ωd = √(ω₀² − α²) en rad/s; solo existe cuando ζ < 1. */
  frecuenciaAmortiguada: number | null;
  /** Periodo de la oscilación amortiguada 2π/ωd en s. */
  periodoAmortiguado: number | null;
  /** Factor de calidad Q = 1/(2ζ) = (1/R)√(L/C). */
  factorCalidad: number;
  /** Constante de tiempo de la raíz más lenta (dominante) en s. */
  constanteTiempoDominante: number;
}

export function calcularFrecuenciaNatural(inductancia: number, capacitancia: number): number {
  return 1 / Math.sqrt(inductancia * capacitancia);
}

export function calcularCoeficienteAmortiguamiento(resistencia: number, inductancia: number): number {
  return resistencia / (2 * inductancia);
}

export function calcularResistenciaCritica(inductancia: number, capacitancia: number): number {
  return 2 * Math.sqrt(inductancia / capacitancia);
}

export function calcularParametrosDerivados(parametros: ParametrosCircuito): ParametrosDerivados {
  const { inductancia: L, resistencia: R, capacitancia: C } = parametros;
  const omega0 = calcularFrecuenciaNatural(L, C);
  const alfa = calcularCoeficienteAmortiguamiento(R, L);
  const zeta = alfa / omega0;
  const diferencia = omega0 * omega0 - alfa * alfa;
  const omegaD = diferencia > 0 ? Math.sqrt(diferencia) : null;

  // Raíz dominante: para ζ ≤ 1 la envolvente decae con e^{-αt};
  // para ζ > 1 domina la raíz más próxima a cero: r = −α + √(α² − ω₀²).
  const raizLenta = diferencia >= 0 ? -alfa : -alfa + Math.sqrt(-diferencia);
  const constanteTiempo = 1 / Math.abs(raizLenta);

  return {
    frecuenciaNatural: omega0,
    frecuenciaNaturalHz: omega0 / (2 * Math.PI),
    coeficienteAmortiguamiento: alfa,
    relacionAmortiguamiento: zeta,
    resistenciaCritica: calcularResistenciaCritica(L, C),
    frecuenciaAmortiguada: omegaD,
    periodoAmortiguado: omegaD ? (2 * Math.PI) / omegaD : null,
    factorCalidad: 1 / (2 * zeta),
    constanteTiempoDominante: constanteTiempo,
  };
}
