import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Formula } from '@/components/common/Formula';
import { BLOQUES } from '@/data/exposicion';
import { ENLACES, EQUIPO } from '@/data/navegacion';
import { listarExperimentos, listarHistorialDesafios } from '@/services/almacenamiento';
import { useLaboratorio } from '@/store/useLaboratorio';
import { CircuitoRLC } from '../laboratorio/scenes/CircuitoRLC';
import { Escena3D } from '../laboratorio/scenes/Escena3D';
import './inicio.css';

const CAPACIDADES: Array<{ titulo: string; texto: string }> = [
  { titulo: 'Circuito 3D por dentro', texto: 'Rota, acerca y despieza cada componente: película de carbón, devanado, núcleo, placas y dieléctrico.' },
  { titulo: 'Motor matemático verificado', texto: 'Soluciones analíticas de los tres casos y Runge-Kutta 4, con 55 pruebas automáticas de exactitud.' },
  { titulo: 'Protoboard real', texto: 'Arma el circuito pieza por pieza: la topología se analiza y se simula con los valores que eliges.' },
  { titulo: 'Todo sincronizado', texto: 'Un slider cambia a la vez el cálculo, la clasificación, las gráficas y la animación 3D.' },
  { titulo: 'Fórmulas que responden', texto: 'Toca cualquier variable de una ecuación para ver qué significa, su unidad y su papel.' },
  { titulo: 'Presentación cinematográfica', texto: 'Recorrido 3D en tres capítulos para la sustentación, con la simulación en vivo.' },
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

const aparecer = (retraso: number) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: retraso, duration: 0.8, ease: [0.2, 0.7, 0.2, 1] as const },
});

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
          <Escena3D encuadre={{ posicion: [9.2, 6.4, 10.4], objetivo: [-1.4, 0.4, 0] }} autoRotar velocidadGiro={0.0008} interactiva={false}>
            {(paleta) => <CircuitoRLC paleta={paleta} seleccionado={null} explotados={false} rayosX={false} mostrarCampos mostrarEtiquetas={false} />}
          </Escena3D>
        </div>
        <div className="portada__contenido">
          <motion.p className="portada__antetitulo" {...aparecer(0)}>
            Laboratorio virtual · Matemáticas IV
          </motion.p>
          <motion.h1 className="portada__titulo" {...aparecer(0.08)}>
            ELECTROLAB<span>3D</span>
          </motion.h1>
          <motion.p className="portada__texto" {...aparecer(0.2)}>
            Un circuito <b>RLC en serie</b> que puedes abrir, medir y reconstruir, y la ecuación diferencial que explica cada electrón que se mueve, cada
            oscilación y cada gota de calor.
          </motion.p>
          <motion.div className="portada__ecuacion" {...aparecer(0.32)}>
            <Formula latex="L\,q''(t) + R\,q'(t) + \frac{1}{C}\,q(t) = E(t)" />
            <span>Toca una variable</span>
          </motion.div>
          <motion.div className="portada__acciones" {...aparecer(0.44)}>
            <Link to="/laboratorio" className="boton boton--primario boton--grande">
              Entrar al laboratorio
            </Link>
            <Link to="/presentacion" className="enlace-flecha">
              Ver la presentación <span aria-hidden="true">→</span>
            </Link>
          </motion.div>
          <motion.dl className="cifras" {...aparecer(0.6)}>
            <div>
              <dt className="mono">
                <Contador valor={3} />
              </dt>
              <dd>regímenes de amortiguamiento</dd>
            </div>
            <div>
              <dt className="mono">
                <Contador valor={4} />
              </dt>
              <dd>señales de fuente</dd>
            </div>
            <div>
              <dt className="mono">
                <Contador valor={experimentos} />
              </dt>
              <dd>experimentos guardados</dd>
            </div>
            <div>
              <dt className="mono">
                <Contador valor={mejorPuntaje} sufijo="%" />
              </dt>
              <dd>mejor puntaje en desafíos</dd>
            </div>
          </motion.dl>
        </div>
      </section>

      <section className="pagina">
        <header className="seccion-editorial">
          <span className="etiqueta-seccion">Capacidades</span>
          <h2>Ingeniería, matemáticas y diseño en un mismo laboratorio</h2>
        </header>
        <div className="capacidades">
          {CAPACIDADES.map((c, k) => (
            <motion.article
              key={c.titulo}
              className="capacidad"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: (k % 3) * 0.08, duration: 0.6 }}
            >
              <span className="capacidad__numero mono">{String(k + 1).padStart(2, '0')}</span>
              <h3>{c.titulo}</h3>
              <p>{c.texto}</p>
            </motion.article>
          ))}
        </div>

        <header className="seccion-editorial">
          <span className="etiqueta-seccion">Índice</span>
          <h2>Elige por dónde empezar</h2>
        </header>
        <nav className="indice" aria-label="Módulos">
          {ENLACES.slice(1).map((enlace, k) => (
            <Link key={enlace.ruta} to={enlace.ruta} className="indice__fila">
              <span className="indice__numero mono">{String(k + 1).padStart(2, '0')}</span>
              <span className="indice__nombre">{enlace.nombre}</span>
              <span className="indice__descripcion">{enlace.descripcion}</span>
              <span className="indice__flecha" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </nav>

        <section className="equipo-editorial">
          <div className="equipo-editorial__cabecera">
            <span className="etiqueta-seccion">Equipo</span>
            <h2>
              {EQUIPO.tipo} de {EQUIPO.asignatura}
            </h2>
            <p>
              {EQUIPO.programa} · {EQUIPO.semestre}
              <br />
              Profesor <b>{EQUIPO.profesor}</b>
            </p>
          </div>
          <ol className="equipo-editorial__lista">
            {BLOQUES.map((b) => (
              <li key={b.integrante}>
                <span className="mono">{b.numero}</span>
                <strong>{b.integrante}</strong>
                <em>{b.titulo}</em>
              </li>
            ))}
          </ol>
        </section>
      </section>
    </div>
  );
}
