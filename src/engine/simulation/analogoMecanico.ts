import { FUENTE_POR_DEFECTO } from '../electrical/parametros';
import type { ParametrosCircuito } from '../electrical/tipos';

/**
 * Analogía fuerza-voltaje: m x'' + b x' + k x = F(t)  ⇔  L q'' + R q' + q/C = E(t)
 * con m ↔ L, b ↔ R, k ↔ 1/C, F ↔ E, x ↔ q.
 *
 * Construye los parámetros equivalentes para un sistema de segundo orden con
 * relación de amortiguamiento ζ y frecuencia natural ω₀ (rad/s), normalizando m = L = 1.
 * La respuesta al escalón resultante, q/(C·E₀), es la respuesta x/x∞ del sistema mecánico.
 */
export function parametrosSegundoOrden(zeta: number, omega0: number): ParametrosCircuito {
  const inductancia = 1;
  return {
    inductancia,
    capacitancia: 1 / (omega0 * omega0 * inductancia),
    resistencia: 2 * zeta * omega0 * inductancia,
    fuente: { ...FUENTE_POR_DEFECTO, tipo: 'constante', amplitud: 1 },
  };
}

/** Respuesta en frecuencia normalizada |H(jω)| de un sistema de segundo orden. */
export function amplitudResonancia(omega: number, omega0: number, factorCalidad: number): number {
  const u = omega / omega0;
  return 1 / Math.sqrt((1 - u * u) ** 2 + (u / factorCalidad) ** 2);
}
