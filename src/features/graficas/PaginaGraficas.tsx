import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { generarCSV, muestrearEn, NOMBRES_AMORTIGUAMIENTO, NOMBRES_FUENTE, PRESETS, simularCircuito, type ParametrosCircuito } from '@/engine';
import { Icono } from '@/components/common/Icono';
import { useTiempoEspaciado } from '@/hooks/useTiempoEspaciado';
import { descargarArchivo } from '@/services/almacenamiento';
import { useLaboratorio } from '@/store/useLaboratorio';
import { notificar } from '@/store/useNotificaciones';
import { aPrecision, formatearIngenieria } from '@/utils/formato';
import { BarraReproduccion } from '../laboratorio/controls/BarraReproduccion';
import { GraficaCientifica, type Serie } from './GraficaCientifica';
import './graficas.css';

const COLORES = {
  carga: '#22d3ee',
  corriente: '#f59e0b',
  analitica: '#a78bfa',
  vL: '#38bdf8',
  vR: '#f87171',
  vC: '#34d399',
  E: '#94a3b8',
  sub: '#22d3ee',
  critico: '#34d399',
  sobre: '#f59e0b',
};

type ModoComparacion = 'enunciado' | 'actual';

export default function PaginaGraficas() {
  const resultado = useLaboratorio((s) => s.resultado);
  const tiempo = useTiempoEspaciado(110);
  const [mostrarAnalitica, setMostrarAnalitica] = useState(true);
  const [curvasVoltaje, setCurvasVoltaje] = useState({ vL: true, vR: true, vC: true, E: true });
  const [modoComparacion, setModoComparacion] = useState<ModoComparacion>('enunciado');

  const { serie, analitica, parametros } = resultado;
  const tMs = useMemo(() => serie.t.map((t) => t * 1000), [serie.t]);
  const cursor = tiempo * 1000;
  const muestra = muestrearEn(resultado, tiempo);

  const seriesCarga = useMemo<Serie[]>(() => {
    const lista: Serie[] = [{ nombre: 'q(t) RK4', x: tMs, y: serie.q, color: COLORES.carga, grosor: 2.4 }];
    if (analitica && mostrarAnalitica) lista.push({ nombre: 'q(t) analítica', x: tMs, y: analitica.q, color: COLORES.analitica, discontinua: true });
    if (parametros.fuente.tipo === 'constante') {
      const qf = parametros.capacitancia * parametros.fuente.amplitud;
      lista.push({ nombre: 'C·E₀', x: [tMs[0], tMs[tMs.length - 1]], y: [qf, qf], color: COLORES.E, discontinua: true, grosor: 1 });
    }
    return lista;
  }, [tMs, serie.q, analitica, mostrarAnalitica, parametros]);

  const seriesCorriente = useMemo<Serie[]>(() => {
    const lista: Serie[] = [{ nombre: 'i(t) RK4', x: tMs, y: serie.i, color: COLORES.corriente, grosor: 2.4 }];
    if (analitica && mostrarAnalitica) lista.push({ nombre: 'i(t) analítica', x: tMs, y: analitica.i, color: COLORES.analitica, discontinua: true });
    return lista;
  }, [tMs, serie.i, analitica, mostrarAnalitica]);

  const seriesVoltaje = useMemo<Serie[]>(
    () => [
      { nombre: 'V_L inductor', x: tMs, y: serie.vL, color: COLORES.vL, visible: curvasVoltaje.vL },
      { nombre: 'V_R resistor', x: tMs, y: serie.vR, color: COLORES.vR, visible: curvasVoltaje.vR },
      { nombre: 'V_C capacitor', x: tMs, y: serie.vC, color: COLORES.vC, visible: curvasVoltaje.vC },
      { nombre: 'E(t) total', x: tMs, y: serie.E, color: COLORES.E, discontinua: true, visible: curvasVoltaje.E },
    ],
    [tMs, serie, curvasVoltaje],
  );

  const seriesEnergia = useMemo<Serie[]>(
    () => [
      { nombre: 'E_L = ½Li²', x: tMs, y: serie.energiaL, color: COLORES.vL },
      { nombre: 'E_C = q²/2C', x: tMs, y: serie.energiaC, color: COLORES.vC },
      { nombre: 'Disipada ∫Ri²dt', x: tMs, y: serie.energiaDisipada, color: COLORES.vR },
      { nombre: 'Entregada ∫E·i dt', x: tMs, y: serie.energiaFuente, color: COLORES.E, discontinua: true },
    ],
    [tMs, serie],
  );

  const seriesError = useMemo<Serie[] | null>(() => {
    if (!analitica) return null;
    return [
      { nombre: '|q_RK4 − q_exacta|', x: tMs, y: serie.q.map((q, k) => Math.abs(q - analitica.q[k])), color: COLORES.carga },
      { nombre: '|i_RK4 − i_exacta|', x: tMs, y: serie.i.map((i, k) => Math.abs(i - analitica.i[k])), color: COLORES.corriente },
    ];
  }, [tMs, serie, analitica]);

  // Comparativa: tres simulaciones del mismo motor con distinta R.
  const comparacion = useMemo(() => {
    const configuraciones: Array<{ id: 'sub' | 'critico' | 'sobre'; parametros: ParametrosCircuito }> =
      modoComparacion === 'enunciado'
        ? PRESETS.map((p, k) => ({ id: (['sub', 'critico', 'sobre'] as const)[k], parametros: p.parametros }))
        : (() => {
            const rc = resultado.derivados.resistenciaCritica;
            const base = { ...parametros, fuente: { ...parametros.fuente, tipo: 'constante' as const } };
            return [
              { id: 'sub' as const, parametros: { ...base, resistencia: rc * 0.25 } },
              { id: 'critico' as const, parametros: { ...base, resistencia: rc } },
              { id: 'sobre' as const, parametros: { ...base, resistencia: rc * 2 } },
            ];
          })();
    const resultados = configuraciones.map((c) => ({ ...c, r: simularCircuito(c.parametros) }));
    const duracion = Math.max(...resultados.map((r) => r.r.duracion));
    return configuraciones.map((c) => {
      const r = simularCircuito(c.parametros, { duracion });
      const nombre = `${NOMBRES_AMORTIGUAMIENTO[r.clasificacion]} (R = ${aPrecision(c.parametros.resistencia, 4)} Ω)`;
      return { id: c.id, nombre, r };
    });
  }, [modoComparacion, parametros, resultado.derivados.resistenciaCritica]);

  const seriesComparacionCarga = useMemo<Serie[]>(
    () => comparacion.map((c) => ({ nombre: c.nombre, x: c.r.serie.t.map((t) => t * 1000), y: c.r.serie.q, color: COLORES[c.id] })),
    [comparacion],
  );
  const seriesComparacionCorriente = useMemo<Serie[]>(
    () => comparacion.map((c) => ({ nombre: c.nombre, x: c.r.serie.t.map((t) => t * 1000), y: c.r.serie.i, color: COLORES[c.id] })),
    [comparacion],
  );

  const exportar = () => {
    const nombre = `electrolab_${resultado.clasificacion}_L${parametros.inductancia}_R${parametros.resistencia.toFixed(2)}_C${parametros.capacitancia}.csv`;
    descargarArchivo(nombre, generarCSV(resultado));
    notificar(`CSV exportado (${serie.t.length} filas)`, 'exito');
  };

  return (
    <div className="pagina graficas">
      <header className="encabezado-pagina">
        <span className="etiqueta-seccion">Módulo 05 · Observatorio</span>
        <h1>Observatorio de gráficas</h1>
        <p>
          Todas las curvas salen del mismo resultado que anima la escena 3D: {NOMBRES_AMORTIGUAMIENTO[resultado.clasificacion].toLowerCase()} con L ={' '}
          {parametros.inductancia} H, R = {aPrecision(parametros.resistencia, 4)} Ω, C = {aPrecision(parametros.capacitancia * 1e6, 4)} µF y fuente{' '}
          {NOMBRES_FUENTE[parametros.fuente.tipo].toLowerCase()} de {parametros.fuente.amplitud} V.{' '}
          <Link to="/laboratorio">Cambiar parámetros en el laboratorio →</Link>
        </p>
      </header>

      <div className="graficas__controles panel">
        <BarraReproduccion compacta />
        <div className="graficas__opciones">
          <label className="interruptor-opcion">
            <input type="checkbox" checked={mostrarAnalitica} onChange={(e) => setMostrarAnalitica(e.target.checked)} disabled={!analitica} />
            Solución analítica
          </label>
          {(Object.keys(curvasVoltaje) as Array<keyof typeof curvasVoltaje>).map((clave) => (
            <label key={clave} className="interruptor-opcion">
              <input type="checkbox" checked={curvasVoltaje[clave]} onChange={() => setCurvasVoltaje((c) => ({ ...c, [clave]: !c[clave] }))} />
              {clave === 'E' ? 'E(t)' : clave.replace('v', 'V_')}
            </label>
          ))}
          <button className="boton boton--primario" onClick={exportar}>
            <Icono nombre="descargar" tamano={16} /> Exportar CSV
          </button>
        </div>
      </div>

      <div className="lectura panel" aria-live="off">
        <span className="lectura__titulo mono">t = {aPrecision(tiempo * 1000, 4)} ms</span>
        <span>q = {formatearIngenieria(muestra.q, 'C')}</span>
        <span>i = {formatearIngenieria(muestra.i, 'A')}</span>
        <span>V_L = {aPrecision(muestra.vL, 3)} V</span>
        <span>V_R = {aPrecision(muestra.vR, 3)} V</span>
        <span>V_C = {aPrecision(muestra.vC, 3)} V</span>
        <span>E = {aPrecision(muestra.E, 3)} V</span>
      </div>

      <div className="graficas__rejilla">
        <GraficaCientifica titulo="Carga q(t)" series={seriesCarga} ejeX="t (ms)" ejeY="q (C)" cursor={cursor} />
        <GraficaCientifica titulo="Corriente i(t)" series={seriesCorriente} ejeX="t (ms)" ejeY="i (A)" cursor={cursor} />
        <GraficaCientifica titulo="Voltajes: V_L + V_R + V_C = E(t)" series={seriesVoltaje} ejeX="t (ms)" ejeY="V (V)" cursor={cursor} />
        <GraficaCientifica titulo="Energía del sistema" series={seriesEnergia} ejeX="t (ms)" ejeY="E (J)" cursor={cursor} />
      </div>

      <section className="graficas__seccion">
        <div className="fila graficas__seccion-cabecera">
          <div>
            <span className="etiqueta-seccion">Comparación</span>
            <h2>Subamortiguado, crítico y sobreamortiguado</h2>
          </div>
          <div className="pestanas" role="tablist">
            <button className="pestana" role="tab" aria-selected={modoComparacion === 'enunciado'} onClick={() => setModoComparacion('enunciado')}>
              Presets del enunciado
            </button>
            <button className="pestana" role="tab" aria-selected={modoComparacion === 'actual'} onClick={() => setModoComparacion('actual')}>
              Con L y C actuales
            </button>
          </div>
        </div>
        <div className="graficas__rejilla">
          <GraficaCientifica titulo="Carga q(t) en los tres regímenes" series={seriesComparacionCarga} ejeX="t (ms)" ejeY="q (C)" />
          <GraficaCientifica titulo="Corriente i(t) en los tres regímenes" series={seriesComparacionCorriente} ejeX="t (ms)" ejeY="i (A)" />
        </div>
        {modoComparacion === 'actual' && (
          <p className="texto-s texto-2">R = 0.25·R_c, R_c y 2·R_c con R_c = {aPrecision(resultado.derivados.resistenciaCritica, 4)} Ω; misma L, C, E₀ y q(0) = i(0) = 0.</p>
        )}
      </section>

      <section className="graficas__seccion">
        <span className="etiqueta-seccion">Métodos numéricos</span>
        <h2>RK4 frente a la solución analítica</h2>
        {seriesError ? (
          <>
            <GraficaCientifica titulo="Error absoluto de Runge-Kutta 4" series={seriesError} ejeX="t (ms)" ejeY="error" />
            <p className="texto-s texto-2">
              Paso de integración h = {resultado.pasoIntegracion.toExponential(3)} s · error máximo en carga {resultado.errorNumerico!.carga.toExponential(2)} C ·
              en corriente {resultado.errorNumerico!.corriente.toExponential(2)} A.
            </p>
          </>
        ) : (
          <p className="texto-2">Con fuentes variables no hay solución cerrada implementada: las curvas provienen únicamente de RK4.</p>
        )}
      </section>
    </div>
  );
}
