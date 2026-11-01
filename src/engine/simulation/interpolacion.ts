import type { ResultadoSimulacion } from './simulador';

/** Valores instantáneos del circuito en un tiempo t. */
export interface MuestraInstantanea {
  t: number;
  q: number;
  i: number;
  didt: number;
  E: number;
  vL: number;
  vR: number;
  vC: number;
  potenciaR: number;
  energiaL: number;
  energiaC: number;
  energiaDisipada: number;
  /** q / q_ref en [-1, 1] aprox. para la escena 3D. */
  cargaNormalizada: number;
  /** i / i_max en [-1, 1] para la escena 3D. */
  corrienteNormalizada: number;
  /** P_R / P_max en [0, 1] para la escena 3D. */
  potenciaNormalizada: number;
}

const CAMPOS = ['q', 'i', 'didt', 'E', 'vL', 'vR', 'vC', 'potenciaR', 'energiaL', 'energiaC', 'energiaDisipada'] as const;

/** Interpolación lineal sobre la malla uniforme de salida de la simulación. */
export function muestrearEn(resultado: ResultadoSimulacion, t: number): MuestraInstantanea {
  const { serie, pasoMuestreo } = resultado;
  const ultimo = serie.t.length - 1;
  const posicion = Math.min(Math.max(t / pasoMuestreo, 0), ultimo);
  const k = Math.min(Math.floor(posicion), ultimo - 1);
  const fraccion = posicion - k;
  const valores = {} as Record<(typeof CAMPOS)[number], number>;
  for (const campo of CAMPOS) {
    const arreglo = serie[campo];
    valores[campo] = arreglo[k] + (arreglo[k + 1] - arreglo[k]) * fraccion;
  }
  return {
    t: Math.min(Math.max(t, 0), resultado.duracion),
    ...valores,
    cargaNormalizada: valores.q / resultado.cargaReferencia,
    corrienteNormalizada: resultado.corrienteMaxima > 0 ? valores.i / resultado.corrienteMaxima : 0,
    potenciaNormalizada: resultado.potenciaMaxima > 0 ? valores.potenciaR / resultado.potenciaMaxima : 0,
  };
}
