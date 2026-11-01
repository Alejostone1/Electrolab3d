import { Link } from 'react-router-dom';
import { ENLACES, EQUIPO } from '@/data/navegacion';
import { Logotipo } from './Cabecera';
import './layout.css';

export function PiePagina() {
  return (
    <footer className="pie">
      <div className="pie__contenido">
        <div>
          <Logotipo />
          <p className="texto-2 texto-s pie__descripcion">
            Laboratorio virtual de circuitos RLC en serie y ecuaciones diferenciales lineales de segundo orden.
          </p>
        </div>
        <div>
          <h4>Módulos</h4>
          <ul className="pie__lista">
            {ENLACES.map((e) => (
              <li key={e.ruta}>
                <Link to={e.ruta}>{e.nombre}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Equipo</h4>
          <ul className="pie__lista texto-2">
            {EQUIPO.integrantes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <p className="texto-s texto-2">
            {EQUIPO.tipo} · {EQUIPO.asignatura} · Prof. {EQUIPO.profesor}
          </p>
        </div>
      </div>
      <p className="pie__legal texto-s">
        © {new Date().getFullYear()} ELECTROLAB 3D · {EQUIPO.programa}. Las representaciones de campos son ilustrativas.
      </p>
    </footer>
  );
}
