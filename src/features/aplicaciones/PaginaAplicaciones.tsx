import { motion } from 'framer-motion';
import { useState } from 'react';
import { Formula } from '@/components/common/Formula';
import { Icono } from '@/components/common/Icono';
import { FICHAS } from '@/data/componentes';
import { ANALOGIA, APLICACIONES, FORMULARIO, GLOSARIO, REFERENCIAS, UNIDADES } from '@/data/documentacion';
import './aplicaciones.css';

type Seccion = 'aplicaciones' | 'conceptos' | 'formulario' | 'glosario' | 'unidades' | 'referencias';

const SECCIONES: Array<[Seccion, string]> = [
  ['aplicaciones', 'Aplicaciones'],
  ['conceptos', 'Conceptos'],
  ['formulario', 'Formulario'],
  ['glosario', 'Glosario'],
  ['unidades', 'Unidades'],
  ['referencias', 'Referencias'],
];

export default function PaginaAplicaciones() {
  const [seccion, setSeccion] = useState<Seccion>('aplicaciones');
  const [busqueda, setBusqueda] = useState('');
  const glosario = GLOSARIO.filter(([t, d]) => `${t} ${d}`.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div className="pagina aplicaciones">
      <header className="encabezado-pagina">
        <span className="etiqueta-seccion">Módulo 08 · Aplicaciones y documentación</span>
        <h1>Del aula al mundo real</h1>
        <p>Los circuitos RLC están en radios, filtros, fuentes de poder y sistemas de control. Aquí tienes sus aplicaciones y todo el material de consulta.</p>
      </header>

      <div className="pestanas aplicaciones__pestanas" role="tablist">
        {SECCIONES.map(([id, nombre]) => (
          <button key={id} role="tab" className="pestana" aria-selected={seccion === id} onClick={() => setSeccion(id)}>
            {nombre}
          </button>
        ))}
      </div>

      <motion.div key={seccion} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {seccion === 'aplicaciones' && (
          <>
            <div className="rejilla">
              {APLICACIONES.map((a) => (
                <article key={a.titulo} className="tarjeta tarjeta--interactiva aplicacion">
                  <span className="funcionalidad__icono aplicacion__icono">
                    <Icono nombre={a.icono} tamano={22} />
                  </span>
                  <h3>{a.titulo}</h3>
                  <p className="texto-2 texto-s">{a.texto}</p>
                  <Formula latex={a.ecuacion} bloque />
                </article>
              ))}
            </div>
            <section className="tarjeta analogia">
              <h2>Analogía mecánica</h2>
              <p className="texto-2">La misma ecuación de segundo orden gobierna un sistema masa-resorte-amortiguador:</p>
              <Formula latex="L\,q'' + R\,q' + \tfrac{1}{C}\,q = E(t) \quad\Longleftrightarrow\quad m\,x'' + b\,x' + k\,x = F(t)" bloque />
              <table className="tabla-datos">
                <thead>
                  <tr>
                    <th>Circuito RLC</th>
                    <th>Sistema mecánico</th>
                  </tr>
                </thead>
                <tbody>
                  {ANALOGIA.map(([e, m]) => (
                    <tr key={e}>
                      <td>{e}</td>
                      <td>{m}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}

        {seccion === 'conceptos' && (
          <div className="rejilla">
            {Object.values(FICHAS).map((f) => (
              <article key={f.id} className="tarjeta concepto">
                <div className="fila">
                  <span className="ficha__simbolo-doc mono">{f.simbolo}</span>
                  <div>
                    <h3>{f.nombre}</h3>
                    <span className="texto-xs texto-2">{f.unidad}</span>
                  </div>
                </div>
                <p className="texto-s">{f.rol}</p>
                <Formula latex={f.ecuacion} bloque />
                <p className="texto-s texto-2">{f.comportamiento}</p>
              </article>
            ))}
          </div>
        )}

        {seccion === 'formulario' && (
          <div className="formulario">
            {FORMULARIO.map(([nombre, latex]) => (
              <div key={nombre} className="tarjeta formulario__item">
                <span className="texto-s texto-2">{nombre}</span>
                <Formula latex={latex} bloque />
              </div>
            ))}
          </div>
        )}

        {seccion === 'glosario' && (
          <>
            <input className="entrada glosario__busqueda" placeholder="Buscar término…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} aria-label="Buscar en el glosario" />
            <dl className="glosario">
              {glosario.map(([termino, definicion]) => (
                <div key={termino} className="tarjeta">
                  <dt>{termino}</dt>
                  <dd className="texto-2 texto-s">{definicion}</dd>
                </div>
              ))}
              {glosario.length === 0 && <p className="texto-2">Sin resultados para “{busqueda}”.</p>}
            </dl>
          </>
        )}

        {seccion === 'unidades' && (
          <div className="tarjeta tabla-desplazable">
            <table className="tabla-datos">
              <thead>
                <tr>
                  <th>Magnitud</th>
                  <th>Símbolo</th>
                  <th>Unidad SI</th>
                  <th>Equivalencia</th>
                </tr>
              </thead>
              <tbody>
                {UNIDADES.map(([m, s, u, e]) => (
                  <tr key={m}>
                    <td>{m}</td>
                    <td className="mono">{s}</td>
                    <td>{u}</td>
                    <td className="mono">{e}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="texto-s texto-2">Prefijos usados en el laboratorio: m (10⁻³), µ (10⁻⁶), n (10⁻⁹), k (10³).</p>
          </div>
        )}

        {seccion === 'referencias' && (
          <div className="tarjeta">
            <ol className="referencias">
              {REFERENCIAS.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ol>
            <p className="texto-s texto-2">
              Las representaciones de campos eléctricos y magnéticos son ilustrativas y simplificadas; no constituyen una simulación electromagnética completa.
              Los modelos 3D fueron construidos con geometrías de Three.js por el equipo, sin recursos de terceros con licencias restringidas.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
