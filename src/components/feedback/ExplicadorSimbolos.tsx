import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Formula } from '@/components/common/Formula';
import { LATEX_SIMBOLO, SIMBOLOS } from '@/data/simbolos';
import './explicador.css';

interface Estado {
  clave: string;
  ancla: DOMRect;
  fijo: boolean;
}

const MARGEN = 10;

/**
 * Explicador contextual global: al señalar (escritorio) o tocar (móvil) una
 * variable marcada con `data-simbolo`, muestra su nombre, unidad y significado.
 * El panel se reubica para no salir de la pantalla y se cierra con Esc o tocando fuera.
 */
export function ExplicadorSimbolos() {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [posicion, setPosicion] = useState({ x: 0, y: 0, arriba: true });
  const panel = useRef<HTMLDivElement>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout>>();

  const cerrar = useCallback(() => setEstado(null), []);

  useEffect(() => {
    const objetivoDe = (evento: Event) => (evento.target as HTMLElement | null)?.closest<HTMLElement>('[data-simbolo]');

    const alSeñalar = (evento: PointerEvent) => {
      if (evento.pointerType === 'touch') return;
      const objetivo = objetivoDe(evento);
      if (objetivo) {
        clearTimeout(temporizador.current);
        setEstado((actual) => (actual?.fijo ? actual : { clave: objetivo.dataset.simbolo!, ancla: objetivo.getBoundingClientRect(), fijo: false }));
      } else if (!(evento.target as HTMLElement).closest('.explicador')) {
        temporizador.current = setTimeout(() => setEstado((actual) => (actual?.fijo ? actual : null)), 180);
      }
    };

    const alTocar = (evento: MouseEvent) => {
      const objetivo = objetivoDe(evento);
      if (objetivo) {
        evento.preventDefault();
        evento.stopPropagation();
        const clave = objetivo.dataset.simbolo!;
        setEstado((actual) => (actual?.fijo && actual.clave === clave ? null : { clave, ancla: objetivo.getBoundingClientRect(), fijo: true }));
      } else if (!(evento.target as HTMLElement).closest('.explicador')) {
        setEstado(null);
      }
    };

    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setEstado(null);
      const objetivo = objetivoDe(evento);
      if (objetivo && (evento.key === 'Enter' || evento.key === ' ')) {
        evento.preventDefault();
        setEstado({ clave: objetivo.dataset.simbolo!, ancla: objetivo.getBoundingClientRect(), fijo: true });
      }
    };

    const alDesplazar = () => setEstado((actual) => (actual && !actual.fijo ? null : actual));

    document.addEventListener('pointerover', alSeñalar);
    document.addEventListener('click', alTocar, true);
    document.addEventListener('keydown', alTeclear);
    window.addEventListener('scroll', alDesplazar, true);
    return () => {
      document.removeEventListener('pointerover', alSeñalar);
      document.removeEventListener('click', alTocar, true);
      document.removeEventListener('keydown', alTeclear);
      window.removeEventListener('scroll', alDesplazar, true);
    };
  }, []);

  // Colocación: encima del símbolo si cabe, si no debajo; siempre dentro de la ventana.
  useLayoutEffect(() => {
    if (!estado || !panel.current) return;
    const { ancla } = estado;
    const ancho = panel.current.offsetWidth;
    const alto = panel.current.offsetHeight;
    const centro = ancla.left + ancla.width / 2;
    const x = Math.min(Math.max(MARGEN, centro - ancho / 2), window.innerWidth - ancho - MARGEN);
    const arriba = ancla.top - alto - 10 > MARGEN;
    const y = arriba ? ancla.top - alto - 10 : Math.min(ancla.bottom + 10, window.innerHeight - alto - MARGEN);
    setPosicion({ x, y, arriba });
  }, [estado]);

  const definicion = estado ? SIMBOLOS[estado.clave] : null;

  return (
    <AnimatePresence>
      {estado && definicion && (
        <motion.div
          ref={panel}
          key={estado.clave + estado.ancla.left}
          className="explicador"
          role="tooltip"
          style={{ left: posicion.x, top: posicion.y }}
          initial={{ opacity: 0, y: posicion.arriba ? 6 : -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onPointerLeave={() => !estado.fijo && cerrar()}
        >
          <div className="explicador__cabecera">
            <span className="explicador__simbolo">
              <Formula latex={LATEX_SIMBOLO[estado.clave] ?? definicion.simbolo} interactiva={false} />
            </span>
            <span className="explicador__nombre">{definicion.nombre}</span>
            {estado.fijo && (
              <button className="explicador__cerrar" onClick={cerrar} aria-label="Cerrar explicación">
                ×
              </button>
            )}
          </div>
          {definicion.unidad && <p className="explicador__unidad">Unidad: {definicion.unidad}</p>}
          <ul>
            {definicion.descripcion.map((linea) => (
              <li key={linea}>{linea}</li>
            ))}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
