import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Formula } from '@/components/common/Formula';
import { Icono, type NombreIcono } from '@/components/common/Icono';
import { ENLACES, EQUIPO } from '@/data/navegacion';
import { listarExperimentos, listarHistorialDesafios } from '@/services/almacenamiento';
import { useLaboratorio } from '@/store/useLaboratorio';
import { CircuitoRLC } from '../laboratorio/scenes/CircuitoRLC';
import { Escena3D } from '../laboratorio/scenes/Escena3D';
import './inicio.css';

const FUNCIONALIDADES: Array<{ icono: NombreIcono; titulo: string; texto: string }> = [
  { icono: 'cubo', titulo: 'Circuito 3D por dentro', texto: 'Rota, acerca y despieza cada componente: película de carbón, devanado, núcleo, placas y dieléctrico.' },
  { icono: 'matematicas', titulo: 'Motor matemático real', texto: 'Soluciones analíticas para los tres casos y Runge-Kutta 4, verificados con pruebas automáticas.' },
  { icono: 'graficas', titulo: 'Observatorio científico', texto: 'Carga, corriente, voltajes y energía en gráficas interactivas exportables a CSV.' },
  { icono: 'rayo', titulo: 'Todo sincronizado', texto: 'Mover un slider cambia cálculos, clasificación, gráficas y animación 3D al mismo tiempo.' },
  { icono: 'desafios', titulo: 'Predice y comprueba', texto: 'Desafíos con puntuación: predice el amortiguamiento antes de encender el circuito.' },
  { icono: 'presentacion', titulo: 'Modo presentación', texto: 'Recorrido guiado en 3D para la sustentación, con animaciones y la simulación en vivo.' },
];

function Contador({ valor, sufijo = '' }: { valor: number; sufijo?: string }) {
  const nodo = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const objeto = { v: 0 };
    const animacion = gsap.to(objeto, {
      v: valor,
      duration: 1.6,
      ease: 'power2.out',
      onUpdate: () => {
        if (nodo.current) nodo.current.textContent = `${Math.round(objeto.v)}${sufijo}`;
      },
    });
    return () => {
      animacion.kill();
    };
  }, [valor, sufijo]);
  return <span ref={nodo}>0</span>;
}

export default function PaginaInicio() {
  const experimentos = listarExperimentos().length;
  const desafios = listarHistorialDesafios();
  const mejorPuntaje = desafios.length ? Math.max(...desafios.map((d) => Math.round((d.puntaje / d.total) * 100))) : 0;

  // La escena de portada muestra el circuito en funcionamiento, repitiendo la simulación.
  useEffect(() => {
    const laboratorio = useLaboratorio.getState();
    if (!laboratorio.reproduciendo) laboratorio.reproducir();
    const intervalo = setInterval(() => {
      const estado = useLaboratorio.getState();
      if (!estado.reproduciendo) {
        estado.reiniciar();
        estado.reproducir();
      }
    }, 2500);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <div className="inicio">
      <section className="portada">
        <div className="portada__escena" aria-hidden="true">
          <Escena3D encuadre={{ posicion: [11, 7, 9], objetivo: [1.5, 0, 0] }} autoRotar interactiva={false}>
            {(paleta) => (
              <CircuitoRLC paleta={paleta} seleccionado={null} explotados={false} rayosX={false} mostrarCampos mostrarEtiquetas={false} />
            )}
          </Escena3D>
        </div>
        <div className="portada__velo" />
        <div className="portada__contenido">
          <motion.span className="etiqueta-seccion" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            Laboratorio virtual · Matemáticas IV
          </motion.span>
          <motion.h1 className="portada__titulo" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7 }}>
            ELECTROLAB <span>3D</span>
          </motion.h1>
          <motion.p className="portada__texto" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.7 }}>
            Experimenta con circuitos <b>RLC en serie</b> y descubre cómo una ecuación diferencial de segundo orden describe cada electrón que se mueve,
            cada oscilación y cada gota de calor.
          </motion.p>
          <motion.div className="portada__acciones" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7 }}>
            <Link to="/laboratorio" className="boton boton--primario boton--grande">
              <Icono nombre="laboratorio" /> Entrar al laboratorio
            </Link>
            <Link to="/presentacion" className="boton boton--grande">
              <Icono nombre="presentacion" /> Ver presentación
            </Link>
          </motion.div>
          <motion.div className="portada__ecuacion panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
            <Formula latex="L\,q''(t) + R\,q'(t) + \frac{1}{C}\,q(t) = E(t)" />
          </motion.div>
        </div>
      </section>

      <section className="pagina">
        <div className="indicadores-inicio">
          <div className="tarjeta">
            <strong className="mono">
              <Contador valor={3} />
            </strong>
            <span>tipos de amortiguamiento</span>
          </div>
          <div className="tarjeta">
            <strong className="mono">
              <Contador valor={4} />
            </strong>
            <span>señales de fuente</span>
          </div>
          <div className="tarjeta">
            <strong className="mono">
              <Contador valor={experimentos} />
            </strong>
            <span>experimentos guardados</span>
          </div>
          <div className="tarjeta">
            <strong className="mono">
              <Contador valor={mejorPuntaje} sufijo="%" />
            </strong>
            <span>mejor puntaje en desafíos</span>
          </div>
        </div>

        <header className="encabezado-pagina">
          <span className="etiqueta-seccion">Qué puedes hacer</span>
          <h2>Ingeniería, matemáticas y diseño en un mismo laboratorio</h2>
          <p>Cada animación proviene del motor matemático: no hay curvas inventadas ni resultados precalculados.</p>
        </header>
        <div className="rejilla">
          {FUNCIONALIDADES.map((f, k) => (
            <motion.article
              key={f.titulo}
              className="tarjeta tarjeta--interactiva funcionalidad"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: k * 0.06 }}
            >
              <span className="funcionalidad__icono">
                <Icono nombre={f.icono} tamano={22} />
              </span>
              <h3>{f.titulo}</h3>
              <p className="texto-2">{f.texto}</p>
            </motion.article>
          ))}
        </div>

        <header className="encabezado-pagina encabezado-pagina--separado">
          <span className="etiqueta-seccion">Módulos</span>
          <h2>Elige por dónde empezar</h2>
        </header>
        <div className="rejilla modulos">
          {ENLACES.slice(1).map((enlace) => (
            <Link key={enlace.ruta} to={enlace.ruta} className="tarjeta tarjeta--interactiva modulo">
              <Icono nombre={enlace.icono} tamano={26} />
              <div>
                <h3>{enlace.nombre}</h3>
                <p className="texto-2 texto-s">{enlace.descripcion}</p>
              </div>
              <Icono nombre="flecha" tamano={18} className="modulo__flecha" />
            </Link>
          ))}
        </div>

        <section className="equipo-inicio tarjeta">
          <div>
            <span className="etiqueta-seccion">Equipo</span>
            <h2>
              {EQUIPO.tipo} · {EQUIPO.asignatura}
            </h2>
            <p className="texto-2">
              {EQUIPO.programa} · {EQUIPO.semestre}. Profesor: <b>{EQUIPO.profesor}</b>.
            </p>
          </div>
          <ul>
            {EQUIPO.integrantes.map((nombre) => (
              <li key={nombre}>
                <span className="equipo-inicio__avatar">{nombre.split(' ').map((p) => p[0]).join('')}</span>
                {nombre}
              </li>
            ))}
          </ul>
        </section>
      </section>
    </div>
  );
}
