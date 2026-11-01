import { complex, sqrt, type Complex } from 'mathjs';

export type TipoRaices = 'reales-distintas' | 'reales-repetidas' | 'complejas-conjugadas';

export interface NumeroComplejo {
  re: number;
  im: number;
}

export interface RaicesCaracteristicas {
  /** Coeficientes de a r² + b r + c = 0 → a = L, b = R, c = 1/C. */
  coeficientes: { a: number; b: number; c: number };
  /** Δ = R² − 4L/C. */
  discriminante: number;
  tipo: TipoRaices;
  r1: NumeroComplejo;
  r2: NumeroComplejo;
}

/** Umbral relativo para considerar el discriminante nulo (raíz doble exacta). */
const UMBRAL_DISCRIMINANTE = 1e-10;

/**
 * Resuelve la ecuación característica  L r² + R r + 1/C = 0
 * asociada a la ecuación homogénea  L q'' + R q' + q/C = 0.
 * Se usa Math.js para tratar uniformemente la raíz cuadrada de Δ < 0.
 */
export function calcularRaicesCaracteristicas(
  inductancia: number,
  resistencia: number,
  capacitancia: number,
): RaicesCaracteristicas {
  const a = inductancia;
  const b = resistencia;
  const c = 1 / capacitancia;
  const discriminante = b * b - 4 * a * c;
  const escala = Math.max(b * b, 4 * a * c);

  let tipo: TipoRaices;
  if (Math.abs(discriminante) <= UMBRAL_DISCRIMINANTE * escala) tipo = 'reales-repetidas';
  else tipo = discriminante > 0 ? 'reales-distintas' : 'complejas-conjugadas';

  const raizDiscriminante: Complex =
    tipo === 'reales-repetidas' ? complex(0, 0) : (sqrt(complex(discriminante, 0)) as Complex);
  const r1 = complex((-b + raizDiscriminante.re) / (2 * a), raizDiscriminante.im / (2 * a));
  const r2 = complex((-b - raizDiscriminante.re) / (2 * a), -raizDiscriminante.im / (2 * a));

  return {
    coeficientes: { a, b, c },
    discriminante,
    tipo,
    r1: { re: r1.re, im: r1.im },
    r2: { re: r2.re, im: r2.im },
  };
}

/** Evalúa a r² + b r + c en una raíz compleja (residuo, debe ser ≈ 0). */
export function residuoEcuacionCaracteristica(raices: RaicesCaracteristicas, raiz: NumeroComplejo): number {
  const { a, b, c } = raices.coeficientes;
  const cuadradoRe = raiz.re * raiz.re - raiz.im * raiz.im;
  const cuadradoIm = 2 * raiz.re * raiz.im;
  const re = a * cuadradoRe + b * raiz.re + c;
  const im = a * cuadradoIm + b * raiz.im;
  return Math.hypot(re, im);
}
