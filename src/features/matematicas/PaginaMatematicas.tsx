import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  calcularParametrosDerivados,
  calcularRaicesCaracteristicas,
  clasificarAmortiguamiento,
  CONDICIONES_INICIALES_REPOSO,
  generarProcedimiento,
  NOMBRES_AMORTIGUAMIENTO,
  obtenerPreset,
  type ParametrosCircuito,
  type TipoAmortiguamiento,
} from '@/engine';
import { Formula } from '@/components/common/Formula';
import { useLaboratorio } from '@/store/useLaboratorio';
import { aPrecision } from '@/utils/formato';
import { ReproductorProcedimiento } from './ReproductorProcedimiento';
import './matematicas.css';

type Origen = 'laboratorio' | TipoAmortiguamiento;

const OPCIONES: Array<{ id: Origen; nombre: string }> = [
  { id: 'laboratorio', nombre: 'Configuración del laboratorio' },
  { id: 'subamortiguado', nombre: 'Preset subamortiguado' },
  { id: 'critico', nombre: 'Preset crítico' },
  { id: 'sobreamortiguado', nombre: 'Preset sobreamortiguado' },
];

/** Raíces de la ecuación característica en el plano complejo. */
function PlanoComplejo({ parametros }: { parametros: ParametrosCircuito }) {
  const raices = calcularRaicesCaracteristicas(parametros.inductancia, parametros.resistencia, parametros.capacitancia);
  const escala = Math.max(Math.abs(raices.r1.re), Math.abs(raices.r2.re), Math.abs(raices.r1.im), 1) * 1.25;
  const aX = (re: number) => 180 + (re / escala) * 160;
  const aY = (im: number) => 110 - (im / escala) * 95;
  const w0 = calcularParametrosDerivados(parametros).frecuenciaNatural;
  const radio = (w0 / escala) * 160;
  return (
    <figure className="plano">
      <svg viewBox="0 0 360 220" role="img" aria-label="Raíces en el plano complejo">
        <line x1={10} x2={350} y1={110} y2={110} className="plano__eje" />
        <line x1={180} x2={180} y1={8} y2={212} className="plano__eje" />
        <ellipse cx={180} cy={110} rx={radio} ry={(w0 / escala) * 95} className="plano__circulo" />
        <text x={344} y={124} className="plano__texto">Re</text>
        <text x={186} y={18} className="plano__texto">Im</text>
        {[raices.r1, raices.r2].map((r, k) => (
          <g key={k}>
            <circle cx={aX(r.re)} cy={aY(r.im)} r={7} className={`plano__raiz plano__raiz--${raices.tipo}`} />
            <text x={aX(r.re) + 10} y={aY(r.im) - 8} className="plano__texto">
              r{k + 1}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="texto-s texto-2">
        Las raíces están siempre en el semiplano izquierdo (Re r &lt; 0): el transitorio decae. La elipse tiene radio ω₀ = {aPrecision(w0, 4)} rad/s; las raíces
        complejas viven sobre ella.
      </figcaption>
    </figure>
  );
}

export default function PaginaMatematicas() {
  const parametrosLaboratorio = useLaboratorio((s) => s.parametros);
  const tolerancia = useLaboratorio((s) => s.toleranciaCritica);
  const [origen, setOrigen] = useState<Origen>('laboratorio');
  const [modo, setModo] = useState<'reproductor' | 'documento'>('reproductor');
  const parametros = origen === 'laboratorio' ? parametrosLaboratorio : obtenerPreset(origen).parametros;
  const pasos = useMemo(() => generarProcedimiento(parametros, CONDICIONES_INICIALES_REPOSO, tolerancia), [parametros, tolerancia]);
  const derivados = calcularParametrosDerivados(parametros);
  const tipo = clasificarAmortiguamiento(derivados.relacionAmortiguamiento, tolerancia);

  return (
    <div className="pagina matematicas">
      <header className="encabezado-pagina">
        <span className="etiqueta-seccion">Módulo 04 · Centro matemático</span>
        <h1>Resolución paso a paso de la ecuación diferencial</h1>
        <p>Selecciona una configuración y el procedimiento se genera automáticamente con sus valores reales: cada paso explica qué operación se hace y por qué.</p>
      </header>

      <div className="matematicas__barra">
        <label className="campo matematicas__configuracion">
          <span className="campo__etiqueta">Configuración</span>
          <select className="selector" value={origen} onChange={(e) => setOrigen(e.target.value as Origen)}>
            {OPCIONES.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre}
              </option>
            ))}
          </select>
        </label>
        <span className={`chip chip--${tipo}`}>{NOMBRES_AMORTIGUAMIENTO[tipo]}</span>
        <div className="pestanas matematicas__modos" role="tablist">
          <button role="tab" className="pestana" aria-selected={modo === 'reproductor'} onClick={() => setModo('reproductor')}>
            Resolución animada
          </button>
          <button role="tab" className="pestana" aria-selected={modo === 'documento'} onClick={() => setModo('documento')}>
            Documento completo
          </button>
        </div>
      </div>
      <p className="texto-s texto-2 matematicas__ayuda">Toca o señala cualquier variable de una fórmula para ver qué significa y en qué unidad se mide.</p>

      {modo === 'reproductor' ? (
        <ReproductorProcedimiento pasos={pasos} parametros={parametros} tolerancia={tolerancia} />
      ) : (
      <div className="matematicas__diseno">
        <aside className="matematicas__lateral">
          <div className="tarjeta">
            <table className="tabla-datos mono">
              <tbody>
                <tr>
                  <th>L</th>
                  <td>{aPrecision(parametros.inductancia, 4)} H</td>
                </tr>
                <tr>
                  <th>R</th>
                  <td>{aPrecision(parametros.resistencia, 5)} Ω</td>
                </tr>
                <tr>
                  <th>C</th>
                  <td>{aPrecision(parametros.capacitancia * 1e6, 5)} µF</td>
                </tr>
                <tr>
                  <th>E₀</th>
                  <td>{parametros.fuente.amplitud} V</td>
                </tr>
                <tr>
                  <th>ζ</th>
                  <td>{aPrecision(derivados.relacionAmortiguamiento, 5)}</td>
                </tr>
              </tbody>
            </table>
            {origen === 'laboratorio' && (
              <p className="texto-s texto-2 matematicas__nota">
                Cambia los valores en el <Link to="/laboratorio">laboratorio</Link> y este procedimiento se recalcula.
              </p>
            )}
          </div>
          <PlanoComplejo parametros={parametros} />
          <nav className="indice-pasos tarjeta" aria-label="Índice de pasos">
            {pasos.map((p) => (
              <a key={p.numero} href={`#paso-${p.numero}`}>
                <span className="mono">{String(p.numero).padStart(2, '0')}</span> {p.titulo}
              </a>
            ))}
          </nav>
        </aside>

        <ol className="pasos">
          {pasos.map((paso) => (
            <motion.li
              key={`${origen}-${paso.numero}`}
              id={`paso-${paso.numero}`}
              className="paso tarjeta"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.4 }}
            >
              <span className="paso__numero mono">{String(paso.numero).padStart(2, '0')}</span>
              <div className="paso__cuerpo">
                <h2>{paso.titulo}</h2>
                <p className="texto-2">{paso.explicacion}</p>
                {paso.formulas.map((f, k) => (
                  <Formula key={k} latex={f} bloque />
                ))}
                {paso.nota && <p className="paso__nota texto-s">{paso.nota}</p>}
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
      )}
    </div>
  );
}
