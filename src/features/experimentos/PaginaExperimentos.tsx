import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  NOMBRES_AMORTIGUAMIENTO,
  NOMBRES_FUENTE,
  obtenerPreset,
  simularCircuito,
  type ParametrosCircuito,
  type ResultadoSimulacion,
  type TipoFuente,
} from '@/engine';
import { Icono } from '@/components/common/Icono';
import { Modal } from '@/components/common/Modal';
import { EXPERIMENTOS, type ExperimentoGuiado } from '@/data/experimentos';
import {
  descargarArchivo,
  eliminarExperimento,
  generarId,
  guardarExperimento,
  listarExperimentos,
  type ExperimentoGuardado,
} from '@/services/almacenamiento';
import { useLaboratorio } from '@/store/useLaboratorio';
import { notificar } from '@/store/useNotificaciones';
import { aPrecision, formatearIngenieria } from '@/utils/formato';
import { GraficaCientifica, type Serie } from '../graficas/GraficaCientifica';
import './experimentos.css';

const PALETA = ['#22d3ee', '#34d399', '#f59e0b', '#a78bfa', '#f87171', '#38bdf8', '#facc15'];

interface Ensayo {
  etiqueta: string;
  parametros: ParametrosCircuito;
  resultado: ResultadoSimulacion;
}

function construirEnsayos(experimento: ExperimentoGuiado, valores: Array<number | TipoFuente>, base: ParametrosCircuito): Ensayo[] {
  const referencia = obtenerPreset('subamortiguado').parametros;
  const ensayos = valores.map((valor) => {
    let parametros: ParametrosCircuito;
    let etiqueta: string;
    switch (experimento.variable) {
      case 'resistencia':
      case 'amortiguamiento':
        parametros = { ...referencia, resistencia: valor as number };
        etiqueta = `R = ${valor} Ω`;
        break;
      case 'capacitancia':
        parametros = { ...referencia, capacitancia: (valor as number) * 1e-6 };
        etiqueta = `C = ${valor} µF`;
        break;
      case 'inductancia':
        parametros = { ...referencia, inductancia: valor as number };
        etiqueta = `L = ${valor} H`;
        break;
      case 'fuente':
        parametros = { ...base, fuente: { ...base.fuente, tipo: valor as TipoFuente } };
        etiqueta = NOMBRES_FUENTE[valor as TipoFuente];
        break;
    }
    return { etiqueta, parametros };
  });
  // Todas las curvas sobre el mismo intervalo temporal para que sean comparables.
  const duracion = Math.min(20, Math.max(...ensayos.map((e) => simularCircuito(e.parametros).duracion)));
  return ensayos.map((e) => ({ ...e, resultado: simularCircuito(e.parametros, { duracion }) }));
}

export default function PaginaExperimentos() {
  const [activo, setActivo] = useState(EXPERIMENTOS[0].id);
  const experimento = EXPERIMENTOS.find((e) => e.id === activo)!;
  const [extras, setExtras] = useState<Record<string, number[]>>({});
  const [nuevoValor, setNuevoValor] = useState('');
  const [guardados, setGuardados] = useState<ExperimentoGuardado[]>(() => listarExperimentos());
  const [modalGuardar, setModalGuardar] = useState(false);
  const [nombre, setNombre] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const base = useLaboratorio((s) => s.parametros);
  const establecerParametros = useLaboratorio((s) => s.establecerParametros);
  const navegar = useNavigate();

  const valores = useMemo(
    () => [...(experimento.valores as Array<number | TipoFuente>), ...(extras[experimento.id] ?? [])],
    [experimento, extras],
  );
  const ensayos = useMemo(() => construirEnsayos(experimento, valores, base), [experimento, valores, base]);

  const seriesCarga = useMemo<Serie[]>(
    () => ensayos.map((e, k) => ({ nombre: e.etiqueta, x: e.resultado.serie.t.map((t) => t * 1000), y: e.resultado.serie.q, color: PALETA[k % PALETA.length] })),
    [ensayos],
  );
  const seriesCorriente = useMemo<Serie[]>(
    () => ensayos.map((e, k) => ({ nombre: e.etiqueta, x: e.resultado.serie.t.map((t) => t * 1000), y: e.resultado.serie.i, color: PALETA[k % PALETA.length] })),
    [ensayos],
  );

  const resumen = ensayos
    .map((e) => `${e.etiqueta}: ${NOMBRES_AMORTIGUAMIENTO[e.resultado.clasificacion]}, ζ=${aPrecision(e.resultado.derivados.relacionAmortiguamiento, 3)}, i_max=${formatearIngenieria(e.resultado.corrienteMaxima, 'A')}`)
    .join(' | ');

  const agregarValor = () => {
    const numero = Number(nuevoValor.replace(',', '.'));
    const limites = { resistencia: [1, 100], amortiguamiento: [1, 100], capacitancia: [100, 5000], inductancia: [0.1, 2] } as const;
    if (experimento.variable === 'fuente') return;
    const [minimo, maximo] = limites[experimento.variable];
    if (!Number.isFinite(numero) || numero < minimo || numero > maximo) {
      notificar(`Valor fuera de rango (${minimo} – ${maximo} ${experimento.unidad})`, 'error');
      return;
    }
    setExtras((e) => ({ ...e, [experimento.id]: [...(e[experimento.id] ?? []), numero] }));
    setNuevoValor('');
  };

  const cargarEnLaboratorio = (parametros: ParametrosCircuito) => {
    establecerParametros(parametros);
    notificar('Configuración cargada en el laboratorio', 'exito');
    navegar('/laboratorio');
  };

  const guardar = () => {
    const principal = ensayos[0];
    const registro: ExperimentoGuardado = {
      id: generarId(),
      nombre: nombre.trim() || `${experimento.titulo} · ${new Date().toLocaleDateString('es-CO')}`,
      experimento: experimento.titulo,
      fecha: new Date().toISOString(),
      parametros: principal.parametros,
      clasificacion: principal.resultado.clasificacion,
      resultados: {
        frecuenciaNatural: principal.resultado.derivados.frecuenciaNatural,
        coeficienteAmortiguamiento: principal.resultado.derivados.coeficienteAmortiguamiento,
        relacionAmortiguamiento: principal.resultado.derivados.relacionAmortiguamiento,
        resistenciaCritica: principal.resultado.derivados.resistenciaCritica,
        corrienteMaxima: principal.resultado.corrienteMaxima,
        cargaMaxima: Math.max(...principal.resultado.serie.q),
        tiempoEstabilizacion: principal.resultado.tiempoEstabilizacion,
        sobrepaso: principal.resultado.sobrepaso,
      },
      resumenGraficas: resumen,
      observaciones: observaciones.trim(),
    };
    if (guardarExperimento(registro)) {
      setGuardados(listarExperimentos());
      notificar('Experimento guardado en este navegador', 'exito');
    } else notificar('No se pudo guardar (almacenamiento no disponible)', 'error');
    setModalGuardar(false);
    setNombre('');
    setObservaciones('');
  };

  return (
    <div className="pagina experimentos">
      <header className="encabezado-pagina">
        <span className="etiqueta-seccion">Módulo 06 · Laboratorio de experimentos</span>
        <h1>Experimentos guiados</h1>
        <p>Cada experimento varía un parámetro y ejecuta el motor para todas las configuraciones a la vez. Agrega tus propios valores, compara y guarda tus conclusiones.</p>
      </header>

      <div className="pestanas experimentos__pestanas" role="tablist">
        {EXPERIMENTOS.map((e) => (
          <button key={e.id} role="tab" className="pestana" aria-selected={activo === e.id} onClick={() => setActivo(e.id)}>
            {e.numero}. {e.titulo}
          </button>
        ))}
      </div>

      <div className="experimentos__diseno">
        <article className="tarjeta experimento__guia">
          <span className="etiqueta-seccion">Experimento {experimento.numero}</span>
          <h2>{experimento.titulo}</h2>
          <p>{experimento.objetivo}</p>
          <h3>Procedimiento</h3>
          <ol>
            {experimento.pasos.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
          <h3>Preguntas guía</h3>
          <ul>
            {experimento.preguntas.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <details className="experimento__conclusion">
            <summary>Ver conclusión esperada</summary>
            <p>{experimento.conclusion}</p>
          </details>
          {experimento.variable !== 'fuente' && (
            <div className="experimento__agregar">
              <input
                className="entrada mono"
                inputMode="decimal"
                placeholder={`Nuevo valor (${experimento.unidad})`}
                value={nuevoValor}
                onChange={(e) => setNuevoValor(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && agregarValor()}
                aria-label="Nuevo valor del barrido"
              />
              <button className="boton" onClick={agregarValor}>
                Agregar curva
              </button>
            </div>
          )}
          <button className="boton boton--primario experimento__guardar" onClick={() => setModalGuardar(true)}>
            <Icono nombre="guardar" tamano={16} /> Guardar experimento
          </button>
        </article>

        <div className="experimento__resultados">
          <GraficaCientifica titulo="Carga q(t)" series={seriesCarga} ejeX="t (ms)" ejeY="q (C)" alto={300} />
          <GraficaCientifica titulo="Corriente i(t)" series={seriesCorriente} ejeX="t (ms)" ejeY="i (A)" alto={300} />
          <div className="tarjeta tabla-desplazable">
            <table className="tabla-datos">
              <thead>
                <tr>
                  <th>Ensayo</th>
                  <th>ω₀ (rad/s)</th>
                  <th>α (s⁻¹)</th>
                  <th>ζ</th>
                  <th>Tipo</th>
                  <th>i máx</th>
                  <th>Sobrepaso</th>
                  <th>t estab.</th>
                  <th />
                </tr>
              </thead>
              <tbody className="mono">
                {ensayos.map((e, k) => (
                  <tr key={`${e.etiqueta}-${k}`}>
                    <td>
                      <span className="punto-color" style={{ background: PALETA[k % PALETA.length] }} />
                      {e.etiqueta}
                    </td>
                    <td>{aPrecision(e.resultado.derivados.frecuenciaNatural, 4)}</td>
                    <td>{aPrecision(e.resultado.derivados.coeficienteAmortiguamiento, 4)}</td>
                    <td>{aPrecision(e.resultado.derivados.relacionAmortiguamiento, 3)}</td>
                    <td>
                      <span className={`chip chip--${e.resultado.clasificacion}`}>{NOMBRES_AMORTIGUAMIENTO[e.resultado.clasificacion]}</span>
                    </td>
                    <td>{formatearIngenieria(e.resultado.corrienteMaxima, 'A')}</td>
                    <td>{e.resultado.sobrepaso !== null ? `${aPrecision(e.resultado.sobrepaso, 3)} %` : '—'}</td>
                    <td>{e.resultado.tiempoEstabilizacion !== null ? formatearIngenieria(e.resultado.tiempoEstabilizacion, 's') : '—'}</td>
                    <td>
                      <button className="boton boton--fantasma boton--pequeno" onClick={() => cargarEnLaboratorio(e.parametros)} title="Abrir en el laboratorio 3D">
                        <Icono nombre="laboratorio" tamano={15} /> 3D
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <section className="historial">
        <div className="fila historial__cabecera">
          <div>
            <span className="etiqueta-seccion">Historial local</span>
            <h2>Experimentos guardados ({guardados.length})</h2>
          </div>
          {guardados.length > 0 && (
            <button
              className="boton"
              onClick={() => descargarArchivo('electrolab_experimentos.json', JSON.stringify(guardados, null, 2), 'application/json')}
            >
              <Icono nombre="descargar" tamano={16} /> Exportar JSON
            </button>
          )}
        </div>
        {guardados.length === 0 ? (
          <p className="texto-2">Aún no hay experimentos guardados. Se almacenan en este navegador.</p>
        ) : (
          <div className="rejilla">
            {guardados.map((g) => (
              <article key={g.id} className="tarjeta registro">
                <div className="fila registro__cabecera">
                  <span className={`chip chip--${g.clasificacion}`}>{NOMBRES_AMORTIGUAMIENTO[g.clasificacion]}</span>
                  <time className="texto-xs texto-2">{new Date(g.fecha).toLocaleString('es-CO')}</time>
                </div>
                <h3>{g.nombre}</h3>
                <p className="texto-s texto-2">{g.experimento}</p>
                <p className="mono texto-s">
                  L={g.parametros.inductancia} H · R={aPrecision(g.parametros.resistencia, 4)} Ω · C={aPrecision(g.parametros.capacitancia * 1e6, 4)} µF · E₀=
                  {g.parametros.fuente.amplitud} V
                </p>
                <p className="mono texto-xs texto-2">
                  ω₀={aPrecision(g.resultados.frecuenciaNatural, 4)} rad/s · ζ={aPrecision(g.resultados.relacionAmortiguamiento, 3)} · R_c=
                  {aPrecision(g.resultados.resistenciaCritica, 4)} Ω
                </p>
                <details>
                  <summary className="texto-s">Resumen de gráficas</summary>
                  <p className="texto-xs texto-2">{g.resumenGraficas}</p>
                </details>
                {g.observaciones && <p className="registro__observaciones texto-s">“{g.observaciones}”</p>}
                <div className="fila">
                  <button className="boton boton--pequeno" onClick={() => cargarEnLaboratorio(g.parametros)}>
                    <Icono nombre="laboratorio" tamano={14} /> Abrir en 3D
                  </button>
                  <button
                    className="boton boton--pequeno boton--peligro"
                    onClick={() => {
                      eliminarExperimento(g.id);
                      setGuardados(listarExperimentos());
                      notificar('Experimento eliminado', 'info');
                    }}
                  >
                    <Icono nombre="papelera" tamano={14} /> Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Modal abierto={modalGuardar} titulo="Guardar experimento" alCerrar={() => setModalGuardar(false)}>
        <div className="formulario-guardar">
          <label className="campo">
            <span className="campo__etiqueta">Nombre</span>
            <input className="entrada" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder={experimento.titulo} maxLength={80} />
          </label>
          <label className="campo">
            <span className="campo__etiqueta">Observaciones</span>
            <textarea className="entrada" rows={4} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="¿Qué observaste? ¿Coincide con tu predicción?" maxLength={600} />
          </label>
          <p className="texto-xs texto-2">Se guardarán los parámetros, resultados del primer ensayo, el tipo de amortiguamiento y el resumen de las {ensayos.length} curvas.</p>
          <button className="boton boton--primario" onClick={guardar}>
            <Icono nombre="guardar" tamano={16} /> Guardar
          </button>
        </div>
      </Modal>
    </div>
  );
}
