import { useEffect, useMemo } from 'react';
import { determinarEstadoCircuito, muestrearEn, type EstadoCircuito, type MuestraInstantanea } from '@/engine';
import { useLaboratorio } from '@/store/useLaboratorio';

/** Reloj global: avanza el tiempo de simulación con requestAnimationFrame. */
export function useRelojSimulacion(): void {
  useEffect(() => {
    let anterior = performance.now();
    let id = 0;
    const ciclo = (ahora: number) => {
      const delta = Math.min(0.1, (ahora - anterior) / 1000);
      anterior = ahora;
      useLaboratorio.getState().avanzarReloj(delta);
      id = requestAnimationFrame(ciclo);
    };
    id = requestAnimationFrame(ciclo);
    return () => cancelAnimationFrame(id);
  }, []);
}

/** Muestra instantánea del motor en el tiempo actual (para indicadores de la interfaz). */
export function useMuestraActual(): MuestraInstantanea {
  const resultado = useLaboratorio((s) => s.resultado);
  const tiempo = useLaboratorio((s) => s.tiempo);
  return useMemo(() => muestrearEn(resultado, tiempo), [resultado, tiempo]);
}

export function useEstadoCircuito(): EstadoCircuito {
  const resultado = useLaboratorio((s) => s.resultado);
  const tiempo = useLaboratorio((s) => s.tiempo);
  const conectado = useLaboratorio((s) => s.conectado);
  return determinarEstadoCircuito(resultado, tiempo, conectado);
}

/** Lectura no reactiva para bucles de animación (useFrame) sin re-renderizar React. */
export function leerMuestraActual(): MuestraInstantanea & { conectado: boolean } {
  const { resultado, tiempo, conectado } = useLaboratorio.getState();
  return { ...muestrearEn(resultado, tiempo), conectado };
}
