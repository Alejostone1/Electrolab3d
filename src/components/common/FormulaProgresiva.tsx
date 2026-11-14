import { motion } from 'framer-motion';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animarLetras } from '@/utils/animacionFormulas';
import { Formula } from './Formula';

interface Paso {
  latex: string;
  /** Qué se hizo para llegar a esta expresión, en palabras sencillas. */
  operacion?: string;
}

interface PropiedadesFormulaProgresiva {
  pasos: Paso[];
  /** Milisegundos entre cada transformación en el avance automático. */
  intervalo?: number;
  /** Paso visible controlado desde fuera. Si se omite, avanza solo y con el botón. */
  pasoControlado?: number;
}

/** Un paso de la derivación: al aparecer, sus símbolos caen y se acomodan. */
function PasoAnimado({ paso, actual }: { paso: Paso; actual: boolean }) {
  const nodo = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!nodo.current) return;
    const animacion = animarLetras(nodo.current);
    return () => {
      animacion?.kill();
    };
  }, [paso.latex]);
  return (
    <motion.div
      className={`derivacion__paso ${actual ? 'derivacion__paso--actual' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: actual ? 1 : 0.55 }}
      transition={{ duration: 0.5 }}
    >
      {paso.operacion && (
        <motion.span className="derivacion__operacion" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          {paso.operacion}
        </motion.span>
      )}
      <div ref={nodo}>
        <Formula latex={paso.latex} bloque />
      </div>
    </motion.div>
  );
}

/**
 * Derivación que se construye paso a paso: cada expresión aparece con la operación
 * que la produjo y sus símbolos caen uno a uno. Avanza sola, despacio, y también
 * con el botón para que el expositor marque su propio ritmo.
 */
export function FormulaProgresiva({ pasos, intervalo = 6000, pasoControlado }: PropiedadesFormulaProgresiva) {
  const [interno, setInterno] = useState(0);
  // Cambia al repetir para volver a montar (y animar) todos los pasos.
  const [ronda, setRonda] = useState(0);
  const visible = pasoControlado ?? interno;
  const completo = visible >= pasos.length - 1;

  useEffect(() => {
    if (pasoControlado !== undefined) return;
    setInterno(0);
  }, [pasos, pasoControlado]);

  useEffect(() => {
    if (pasoControlado !== undefined || completo) return;
    const id = setTimeout(() => setInterno((v) => Math.min(v + 1, pasos.length - 1)), intervalo);
    return () => clearTimeout(id);
  }, [interno, intervalo, pasoControlado, completo, pasos.length]);

  return (
    <div className="derivacion">
      {pasos.slice(0, visible + 1).map((paso, k) => (
        <PasoAnimado key={`${ronda}-${k}`} paso={paso} actual={k === visible} />
      ))}
      {pasoControlado === undefined && (
        <div className="derivacion__control">
          <span className="mono">
            {visible + 1}/{pasos.length}
          </span>
          {!completo ? (
            <button className="boton boton--pequeno" onClick={() => setInterno((v) => Math.min(v + 1, pasos.length - 1))}>
              Siguiente paso ▸
            </button>
          ) : (
            <button
              className="boton boton--pequeno"
              onClick={() => {
                setInterno(0);
                setRonda((r) => r + 1);
              }}
            >
              Repetir ↺
            </button>
          )}
        </div>
      )}
    </div>
  );
}
