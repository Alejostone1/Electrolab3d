import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Icono } from '@/components/common/Icono';
import { ENLACES } from '@/data/navegacion';
import { usePreferencias } from '@/store/usePreferencias';
import './layout.css';

export function Logotipo({ compacto = false }: { compacto?: boolean }) {
  return (
    <span className="logotipo">
      <svg viewBox="0 0 64 64" width="30" height="30" aria-hidden="true">
        <rect width="64" height="64" rx="14" className="logotipo__fondo" />
        <path
          d="M10 32h8l4-10 6 20 6-20 6 20 4-10h10"
          stroke="var(--cian)"
          strokeWidth="3.4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="54" cy="32" r="3" fill="var(--verde)" />
        <circle cx="10" cy="32" r="3" fill="var(--naranja)" />
      </svg>
      {!compacto && (
        <span className="logotipo__texto">
          ELECTROLAB <b>3D</b>
        </span>
      )}
    </span>
  );
}

export function BotonTema() {
  const tema = usePreferencias((s) => s.tema);
  const alternarTema = usePreferencias((s) => s.alternarTema);
  return (
    <button
      className="boton boton--fantasma boton--icono"
      onClick={alternarTema}
      aria-label={tema === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
      title={tema === 'dark' ? 'Modo claro' : 'Modo oscuro'}
    >
      <Icono nombre={tema === 'dark' ? 'sol' : 'luna'} />
    </button>
  );
}

export function Cabecera() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const ubicacion = useLocation();

  useEffect(() => {
    setMenuAbierto(false);
  }, [ubicacion.pathname]);
  useEffect(() => {
    document.body.style.overflow = menuAbierto ? 'hidden' : '';
  }, [menuAbierto]);

  return (
    <header className="cabecera">
      <div className="cabecera__contenido">
        <Link to="/" aria-label="Ir al inicio">
          <Logotipo />
        </Link>
        <nav className="cabecera__nav solo-escritorio" aria-label="Navegación principal">
          {ENLACES.slice(1, 8).map((enlace) => (
            <NavLink key={enlace.ruta} to={enlace.ruta} className="cabecera__enlace">
              {enlace.corto}
            </NavLink>
          ))}
        </nav>
        <div className="cabecera__acciones">
          <Link to="/presentacion" className="boton boton--primario cabecera__presentar">
            <Icono nombre="presentacion" tamano={18} />
            <span className="solo-escritorio">Presentación</span>
          </Link>
          <BotonTema />
          <button
            className="boton boton--fantasma boton--icono"
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
            aria-expanded={menuAbierto}
          >
            <Icono nombre="menu" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuAbierto && (
          <>
            <motion.div
              className="cajon__fondo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuAbierto(false)}
            />
            <motion.nav
              className="cajon"
              aria-label="Menú"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            >
              <div className="cajon__cabecera">
                <Logotipo />
                <button className="boton boton--fantasma boton--icono" onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú">
                  <Icono nombre="cerrar" />
                </button>
              </div>
              <Link to="/presentacion" className="boton boton--primario boton--grande cajon__presentar">
                <Icono nombre="presentacion" /> Modo presentación
              </Link>
              <ul className="cajon__lista">
                {ENLACES.map((enlace, indice) => (
                  <motion.li
                    key={enlace.ruta}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * indice }}
                  >
                    <NavLink to={enlace.ruta} end={enlace.ruta === '/'} className="cajon__enlace">
                      <Icono nombre={enlace.icono} />
                      <span>
                        <b>{enlace.nombre}</b>
                        <small>{enlace.descripcion}</small>
                      </span>
                    </NavLink>
                  </motion.li>
                ))}
              </ul>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
