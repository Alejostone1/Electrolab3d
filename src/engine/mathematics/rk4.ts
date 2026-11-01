/**
 * Método de Runge-Kutta de cuarto orden para sistemas de dos ecuaciones
 * de primer orden:
 *   x₁' = f₁(t, x₁, x₂)
 *   x₂' = f₂(t, x₁, x₂)
 *
 * En ELECTROLAB 3D: x₁ = q, x₂ = i, con
 *   x₁' = x₂
 *   x₂' = [E(t) − R x₂ − x₁/C] / L
 */
export type SistemaPrimerOrden = (t: number, x1: number, x2: number) => [number, number];

export interface ResultadoIntegracion {
  t: number[];
  x1: number[];
  x2: number[];
}

/** Un paso de RK4 desde (t, x1, x2) con tamaño h. */
export function pasoRK4(sistema: SistemaPrimerOrden, t: number, x1: number, x2: number, h: number): [number, number] {
  const [k1a, k1b] = sistema(t, x1, x2);
  const [k2a, k2b] = sistema(t + h / 2, x1 + (h / 2) * k1a, x2 + (h / 2) * k1b);
  const [k3a, k3b] = sistema(t + h / 2, x1 + (h / 2) * k2a, x2 + (h / 2) * k2b);
  const [k4a, k4b] = sistema(t + h, x1 + h * k3a, x2 + h * k3b);
  return [x1 + (h / 6) * (k1a + 2 * k2a + 2 * k3a + k4a), x2 + (h / 6) * (k1b + 2 * k2b + 2 * k3b + k4b)];
}

/**
 * Integra el sistema desde t = 0 hasta `pasosMuestreo · pasosPorMuestra · h`,
 * guardando una muestra cada `pasosPorMuestra` pasos (malla de salida uniforme).
 */
export function integrarRK4(
  sistema: SistemaPrimerOrden,
  condicion: [number, number],
  h: number,
  numeroMuestras: number,
  pasosPorMuestra = 1,
): ResultadoIntegracion {
  const t: number[] = new Array(numeroMuestras + 1);
  const x1: number[] = new Array(numeroMuestras + 1);
  const x2: number[] = new Array(numeroMuestras + 1);
  let estado1 = condicion[0];
  let estado2 = condicion[1];
  let tiempo = 0;
  t[0] = 0;
  x1[0] = estado1;
  x2[0] = estado2;

  for (let muestra = 1; muestra <= numeroMuestras; muestra++) {
    for (let paso = 0; paso < pasosPorMuestra; paso++) {
      [estado1, estado2] = pasoRK4(sistema, tiempo, estado1, estado2, h);
      tiempo += h;
    }
    // Se reconstruye el tiempo a partir del índice para evitar acumulación de error.
    tiempo = muestra * pasosPorMuestra * h;
    t[muestra] = tiempo;
    x1[muestra] = estado1;
    x2[muestra] = estado2;
  }
  return { t, x1, x2 };
}

/** Límite de estabilidad absoluta de RK4 sobre el eje real negativo (|λ·h| < 2.785). */
export const LIMITE_ESTABILIDAD_RK4 = 2.785;
