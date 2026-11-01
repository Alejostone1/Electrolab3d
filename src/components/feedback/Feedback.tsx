import { AnimatePresence, motion } from 'framer-motion';
import { Icono } from '@/components/common/Icono';
import { useNotificaciones } from '@/store/useNotificaciones';
import '@/components/common/comunes.css';

export function Cargando({ texto = 'Cargando módulo…' }: { texto?: string }) {
  return (
    <div className="cargando" role="status">
      <svg className="cargando__onda" viewBox="0 0 120 40" fill="none">
        <path d="M2 20 C 17 -4, 27 44, 42 20 S 67 -4, 82 20 S 107 44, 118 20" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span>{texto}</span>
    </div>
  );
}

export function Notificaciones() {
  const notificaciones = useNotificaciones((s) => s.notificaciones);
  const descartar = useNotificaciones((s) => s.descartar);
  return (
    <div className="notificaciones" aria-live="polite">
      <AnimatePresence>
        {notificaciones.map((n) => (
          <motion.div
            key={n.id}
            layout
            className={`notificacion notificacion--${n.tipo}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            onClick={() => descartar(n.id)}
          >
            <Icono nombre={n.tipo === 'error' ? 'x' : n.tipo === 'exito' ? 'check' : 'info'} tamano={18} />
            <span>{n.mensaje}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
