import { Link } from 'react-router-dom';
import { Icono } from '@/components/common/Icono';
import { EQUIPO } from '@/data/navegacion';
import './acerca.css';

const CAPAS = [
  ['Presentación', 'React · Framer Motion · GSAP', 'Páginas, paneles, navegación y transiciones.'],
  ['Visualización 3D', 'Three.js · React Three Fiber · Drei', 'Escena, cámara, componentes y efectos ilustrativos.'],
  ['Estado global', 'Zustand', 'Sincroniza parámetros, resultado de simulación y reproducción.'],
  ['Simulación', 'engine/simulation', 'Reloj, interpolación, estados del circuito, validaciones y CSV.'],
  ['Motor matemático', 'engine/mathematics · Math.js', 'Raíces, clasificación, soluciones analíticas, RK4 y procedimiento.'],
  ['Dominio eléctrico', 'engine/electrical · Zod', 'Parámetros, rangos, presets, fuentes y código de colores.'],
  ['Persistencia', 'localStorage', 'Experimentos, preferencias, último circuito e historial de desafíos.'],
];

const OBJETIVOS = [
  'Representar en 3D los componentes de un circuito RLC en serie y su estructura interna.',
  'Resolver la EDO de segundo orden analíticamente (tres casos) y con Runge-Kutta 4.',
  'Permitir modificar L, R, C y la fuente con validación y actualización en tiempo real.',
  'Clasificar automáticamente el amortiguamiento con tolerancia configurable.',
  'Sincronizar las animaciones 3D, las gráficas y los indicadores con el mismo resultado.',
  'Ofrecer experimentos guiados, desafíos con puntuación y un modo de presentación.',
];

export default function PaginaAcerca() {
  return (
    <div className="pagina acerca">
      <header className="encabezado-pagina">
        <span className="etiqueta-seccion">Acerca del proyecto</span>
        <h1>ELECTROLAB 3D</h1>
        <p>
          Laboratorio virtual interactivo de circuitos RLC y ecuaciones diferenciales de segundo orden. {EQUIPO.tipo} de {EQUIPO.asignatura}.
        </p>
      </header>

      <section className="acerca__equipo">
        {EQUIPO.integrantes.map((nombre) => (
          <article key={nombre} className="tarjeta integrante">
            <span className="integrante__avatar">{nombre.split(' ').map((p) => p[0]).join('')}</span>
            <h3>{nombre}</h3>
            <p className="texto-s texto-2">
              Estudiante de {EQUIPO.programa}
              <br />
              {EQUIPO.semestre}
            </p>
          </article>
        ))}
        <article className="tarjeta integrante integrante--profesor">
          <span className="integrante__avatar">
            <Icono nombre="libro" />
          </span>
          <h3>{EQUIPO.profesor}</h3>
          <p className="texto-s texto-2">
            Profesor de {EQUIPO.asignatura}
          </p>
        </article>
      </section>

      <div className="acerca__columnas">
        <section className="tarjeta">
          <h2>Objetivo general</h2>
          <p className="texto-2">
            Desarrollar una aplicación web 3D que permita modelar, visualizar, simular y analizar el comportamiento dinámico de circuitos RLC en serie mediante
            ecuaciones diferenciales lineales de segundo orden, relacionando los parámetros eléctricos con las soluciones matemáticas y la respuesta física.
          </p>
          <h3>Objetivos específicos</h3>
          <ul className="lista-check">
            {OBJETIVOS.map((o) => (
              <li key={o}>
                <Icono nombre="check" tamano={16} /> {o}
              </li>
            ))}
          </ul>
        </section>
        <section className="tarjeta">
          <h2>Arquitectura</h2>
          <p className="texto-2 texto-s">El motor es independiente de React: se prueba con Vitest sin interfaz. La escena 3D no contiene lógica matemática.</p>
          <ol className="capas">
            {CAPAS.map(([capa, tecnologia, descripcion]) => (
              <li key={capa}>
                <b>{capa}</b>
                <span className="mono texto-xs">{tecnologia}</span>
                <span className="texto-s texto-2">{descripcion}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="tarjeta acerca__flujo">
        <h2>Flujo de la simulación</h2>
        <div className="flujo">
          {['Parámetros', 'Validación Zod', 'Motor matemático', 'Clasificación', 'Soluciones + RK4', 'Serie temporal', 'Gráficas · 3D · Indicadores'].map((p, k, lista) => (
            <span key={p} className="flujo__paso">
              {p}
              {k < lista.length - 1 && <Icono nombre="flecha" tamano={14} />}
            </span>
          ))}
        </div>
      </section>

      <section className="acerca__cta">
        <Link to="/presentacion" className="boton boton--primario boton--grande">
          <Icono nombre="presentacion" /> Iniciar presentación
        </Link>
        <Link to="/laboratorio" className="boton boton--grande">
          <Icono nombre="laboratorio" /> Ir al laboratorio
        </Link>
      </section>
    </div>
  );
}
