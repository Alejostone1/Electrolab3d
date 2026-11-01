import { useEffect, useState } from 'react';
import { useLaboratorio } from '@/store/useLaboratorio';

/**
 * Tiempo de simulación actualizado como máximo cada `intervalo` ms.
 * Evita re-renderizar componentes costosos (gráficas) en cada cuadro.
 */
export function useTiempoEspaciado(intervalo = 120): number {
  const [tiempo, setTiempo] = useState(() => useLaboratorio.getState().tiempo);
  useEffect(() => {
    let ultimo = 0;
    let pendiente: ReturnType<typeof setTimeout> | null = null;
    const cancelar = useLaboratorio.subscribe((estado) => {
      const ahora = performance.now();
      if (ahora - ultimo >= intervalo) {
        ultimo = ahora;
        setTiempo(estado.tiempo);
      } else if (!pendiente) {
        pendiente = setTimeout(() => {
          pendiente = null;
          ultimo = performance.now();
          setTiempo(useLaboratorio.getState().tiempo);
        }, intervalo);
      }
    });
    return () => {
      cancelar();
      if (pendiente) clearTimeout(pendiente);
    };
  }, [intervalo]);
  return tiempo;
}
