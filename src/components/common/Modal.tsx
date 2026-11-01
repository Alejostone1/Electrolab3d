import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, type ReactNode } from 'react';
import { Icono } from './Icono';
import './comunes.css';

interface PropiedadesModal {
  abierto: boolean;
  titulo: string;
  alCerrar: () => void;
  children: ReactNode;
}

export function Modal({ abierto, titulo, alCerrar, children }: PropiedadesModal) {
  useEffect(() => {
    if (!abierto) return;
    const alPresionar = (evento: KeyboardEvent) => evento.key === 'Escape' && alCerrar();
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [abierto, alCerrar]);

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div className="modal__fondo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={alCerrar}>
          <motion.div
            className="modal panel"
            role="dialog"
            aria-modal="true"
            aria-label={titulo}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            onClick={(evento) => evento.stopPropagation()}
          >
            <header className="modal__cabecera">
              <h3>{titulo}</h3>
              <button className="boton boton--fantasma boton--icono" onClick={alCerrar} aria-label="Cerrar">
                <Icono nombre="cerrar" />
              </button>
            </header>
            <div className="modal__cuerpo">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
