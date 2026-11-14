import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { IdComponente } from '@/engine';
import { Icono } from '@/components/common/Icono';
import { BotonTema, Logotipo } from '@/components/layout/Cabecera';
import { useLaboratorio } from '@/store/useLaboratorio';
import { BLOQUES } from '@/data/exposicion';
import { POSICIONES } from '../laboratorio/components-3d/geometria';
import { Escena3D } from '../laboratorio/scenes/Escena3D';
import { DIAPOSITIVAS } from './diapositivas';
import { EscenaPresentacion } from './escenas/EscenasPresentacion';
import './presentacion.css';

const INTERVALO_AUTOMATICO = 15000;

/**
 * Modo presentación: recorrido educativo guiado sobre la misma escena 3D y el
 * mismo motor matemático del laboratorio. Teclado: ← → espacio, Esc para salir.
 */
export default function PaginaPresentacion() {
  const [indice, setIndice] = useState(0);
  const [automatico, setAutomatico] = useState(false);
  const [despiezado, setDespiezado] = useState<IdComponente[]>([]);
  const [panelOculto, setPanelOculto] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);
  const navegar = useNavigate();
  const diapositiva = DIAPOSITIVAS[indice];
  const total = DIAPOSITIVAS.length;

  const ir = useCallback((destino: number) => setIndice(Math.max(0, Math.min(total - 1, destino))), [total]);

  // Al entrar a cada diapositiva se configura el circuito con el motor real.
  useEffect(() => {
    const laboratorio = useLaboratorio.getState();
    if (laboratorio.componenteSeleccionado) laboratorio.seleccionarComponente(null);
    if (diapositiva.preset && (laboratorio.presetActivo !== diapositiva.preset || diapositiva.ejecutar)) laboratorio.aplicarPreset(diapositiva.preset);
    if (diapositiva.ejecutar) {
      useLaboratorio.setState({ tiempo: 0 });
      laboratorio.reproducir();
    } else if (diapositiva.conectar) {
      useLaboratorio.setState({ conectado: false, reproduciendo: false, tiempo: 0 });
      const temporizador = setTimeout(() => useLaboratorio.setState({ conectado: true }), 1400);
      return () => clearTimeout(temporizador);
    }
  }, [diapositiva]);

  // En las diapositivas en vivo la simulación se repite para que la escena nunca quede quieta.
  useEffect(() => {
    if (!diapositiva.ejecutar) return;
    const intervalo = setInterval(() => {
      const estado = useLaboratorio.getState();
      if (!estado.reproduciendo) {
        estado.reiniciar();
        estado.reproducir();
      }
    }, 2200);
    return () => clearInterval(intervalo);
  }, [diapositiva]);

  // Despiece escalonado: primero el acercamiento, luego se abren las piezas.
  useEffect(() => {
    setDespiezado([]);
    if (!diapositiva.despiece) return;
    const temporizador = setTimeout(() => setDespiezado(diapositiva.despiece!), diapositiva.retrasoDespiece ?? 1500);
    return () => clearTimeout(temporizador);
  }, [diapositiva]);

  // Avance automático (modo exposición).
  useEffect(() => {
    if (!automatico) return;
    const temporizador = setTimeout(() => ir(indice + 1 >= total ? 0 : indice + 1), INTERVALO_AUTOMATICO);
    return () => clearTimeout(temporizador);
  }, [automatico, indice, ir, total]);

  useEffect(() => {
    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === 'ArrowRight' || evento.key === ' ' || evento.key === 'PageDown') {
        evento.preventDefault();
        ir(indice + 1);
      } else if (evento.key === 'ArrowLeft' || evento.key === 'PageUp') ir(indice - 1);
      else if (evento.key === 'Escape') navegar('/');
      else if (evento.key.toLowerCase() === 'h') setPanelOculto((v) => !v);
    };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [indice, ir, navegar]);

  // Animación GSAP del título letra por letra.
  useLayoutEffect(() => {
    if (!titulo.current) return;
    const letras = titulo.current.querySelectorAll('.diapositiva__letra');
    const animacion = gsap.fromTo(letras, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.018, ease: 'power3.out' });
    return () => {
      animacion.kill();
    };
  }, [indice]);

  const alternarPantallaCompleta = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => undefined);
  };

  const hayDespiece = Boolean(diapositiva.despiece?.length);
  const esEscritorio = typeof window !== 'undefined' && window.innerWidth > 900;
  // Escritorio: panel a la izquierda ⇒ escena desplazada a la derecha. Móvil: panel abajo ⇒ escena arriba.

  return (
    <div className="presentacion">
      <div className="presentacion__escena">
        <Escena3D
          encuadre={diapositiva.encuadre}
          claveEncuadre={indice}
          autoRotar={diapositiva.autoRotar}
          velocidadGiro={diapositiva.velocidadGiro}
          foco={diapositiva.foco ? [POSICIONES[diapositiva.foco][0], 0.8, POSICIONES[diapositiva.foco][2]] : null}
          desplazamiento={panelOculto ? [0, 0] : esEscritorio ? [0.2, 0] : [0, 0.22]}
        >
          {(paleta) => (
            <EscenaPresentacion
              tipo={diapositiva.escena ?? 'circuito'}
              paleta={paleta}
              foco={diapositiva.foco ?? null}
              despiezados={despiezado}
              rayosX={diapositiva.rayosX ?? false}
              mostrarEtiquetas={esEscritorio && !diapositiva.foco && !diapositiva.capitulo}
            />
          )}
        </Escena3D>
      </div>

      <header className="presentacion__barra">
        <Link to="/" aria-label="Salir al inicio">
          <Logotipo />
        </Link>
        <div className="presentacion__acciones">
          <button className={`boton boton--pequeno ${automatico ? 'boton--activo' : ''}`} onClick={() => setAutomatico((v) => !v)} title="Avance automático">
            <Icono nombre={automatico ? 'pausa' : 'reproducir'} tamano={14} /> Auto
          </button>
          <button className="boton boton--pequeno solo-escritorio" onClick={alternarPantallaCompleta} title="Pantalla completa">
            <Icono nombre="pantallaCompleta" tamano={15} />
          </button>
          <BotonTema />
          <button className="boton boton--fantasma boton--icono" onClick={() => navegar('/')} aria-label="Salir de la presentación">
            <Icono nombre="cerrar" />
          </button>
        </div>
      </header>

      <div className="presentacion__progreso" aria-hidden="true">
        <span style={{ width: `${((indice + 1) / total) * 100}%` }} />
      </div>

      <AnimatePresence mode="wait">
        {!panelOculto && (
          <motion.article
            key={diapositiva.id}
            className={`diapositiva panel ${diapositiva.capitulo ? 'diapositiva--capitulo' : ''}`}
            initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(6px)' }}
            transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
            aria-live="polite"
          >
            <div className="diapositiva__meta">
              <span className="etiqueta-seccion">{diapositiva.seccion}</span>
              <span className="diapositiva__expositor">
                {diapositiva.bloque === null ? 'Expone: todo el equipo' : `Expone: ${BLOQUES[diapositiva.bloque].integrante}`}
              </span>
            </div>
            {diapositiva.capitulo && diapositiva.bloque !== null && (
              <span className="diapositiva__numeral" aria-hidden="true">
                {BLOQUES[diapositiva.bloque].numero}
              </span>
            )}
            <h1 ref={titulo} className={`diapositiva__titulo ${indice === 0 ? 'diapositiva__titulo--portada' : ''}`} aria-label={diapositiva.titulo}>
              {diapositiva.titulo.split(' ').map((palabra, p) => (
                <Fragment key={p}>
                  {p > 0 && ' '}
                  <span className="diapositiva__palabra" aria-hidden="true">
                    {Array.from(palabra).map((letra, k) => (
                      <span key={k} className="diapositiva__letra">
                        {letra}
                      </span>
                    ))}
                  </span>
                </Fragment>
              ))}
            </h1>
            <div className="diapositiva__contenido">{diapositiva.contenido}</div>
            {hayDespiece && (
              <button
                className={`boton boton--pequeno diapositiva__despiece ${despiezado.length ? 'boton--activo' : ''}`}
                onClick={() => setDespiezado(despiezado.length ? [] : diapositiva.despiece!)}
              >
                <Icono nombre="capas" tamano={15} /> {despiezado.length ? 'Ensamblar componente' : 'Ver por dentro'}
              </button>
            )}
          </motion.article>
        )}
      </AnimatePresence>

      <nav className="presentacion__navegacion" aria-label="Navegación de diapositivas">
        <button className="boton boton--icono" onClick={() => ir(indice - 1)} disabled={indice === 0} aria-label="Anterior">
          <Icono nombre="flechaIzq" />
        </button>
        <div className="presentacion__puntos">
          {DIAPOSITIVAS.map((d, k) => (
            <button
              key={d.id}
              className={`presentacion__punto ${k === indice ? 'presentacion__punto--activo' : ''} ${
                k > 0 && DIAPOSITIVAS[k - 1].bloque !== d.bloque ? 'presentacion__punto--bloque' : ''
              }`}
              onClick={() => ir(k)}
              aria-label={`Ir a ${d.titulo}`}
            />
          ))}
        </div>
        <span className="presentacion__contador mono">
          {indice + 1}/{total}
        </span>
        <button className="boton boton--icono" onClick={() => setPanelOculto((v) => !v)} aria-label={panelOculto ? 'Mostrar texto' : 'Ocultar texto para ver la escena'} title="Mostrar/ocultar texto (H)">
          <Icono nombre={panelOculto ? 'libro' : 'cubo'} />
        </button>
        <button className="boton boton--primario boton--icono" onClick={() => ir(indice + 1)} disabled={indice === total - 1} aria-label="Siguiente">
          <Icono nombre="flecha" />
        </button>
      </nav>
    </div>
  );
}
