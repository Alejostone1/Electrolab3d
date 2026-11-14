import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Formula } from './Formula';

interface Paso {
  latex: string;
  /** Operación que transforma la expresión anterior en esta. */
  operacion?: string;
}

interface PropiedadesFormulaProgresiva {
  pasos: Paso[];
  /** Milisegundos entre cada transformación. */
  intervalo?: number;
  /** Paso visible controlado desde fuera (reproductor). Si se omite, avanza solo. */
  pasoControlado?: number;
}

/**
 * Muestra una derivación que se construye paso a paso: cada expresión aparece
 * con la operación que la produjo, y la más reciente queda resaltada unos instantes.
 */
export function FormulaProgresiva({ pasos, intervalo = 1600, pasoControlado }: PropiedadesFormulaProgresiva) {
  const [interno, setInterno] = useState(0);
  const visible = pasoControlado ?? interno;

  useEffect(() => {
    if (pasoControlado !== undefined) return;
    setInterno(0);
    const id = setInterval(() => setInterno((v) => (v + 1 < pasos.length ? v + 1 : v)), intervalo);
    return () => clearInterval(id);
  }, [pasos, intervalo, pasoControlado]);

  return (
    <div className="derivacion">
      {pasos.slice(0, visible + 1).map((paso, k) => (
        <motion.div
          key={k}
          className={`derivacion__paso ${k === visible ? 'derivacion__paso--actual' : ''}`}
          initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
          animate={{ opacity: k === visible ? 1 : 0.62, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.45 }}
        >
          {paso.operacion && <span className="derivacion__operacion">{paso.operacion}</span>}
          <Formula latex={paso.latex} bloque />
        </motion.div>
      ))}
    </div>
  );
}
