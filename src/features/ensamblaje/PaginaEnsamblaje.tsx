import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { DESCRIPCION_AMORTIGUAMIENTO, NOMBRES_AMORTIGUAMIENTO, validarParametros, type Pieza } from '@/engine';
import { Formula } from '@/components/common/Formula';
import { Icono } from '@/components/common/Icono';
import { useLaboratorio } from '@/store/useLaboratorio';
import { notificar } from '@/store/useNotificaciones';
import { aPrecision, formatearIngenieria } from '@/utils/formato';
import { Osciloscopio } from '../laboratorio/controls/Osciloscopio';
import { Escena3D } from '../laboratorio/scenes/Escena3D';
import { Protoboard3D } from './Protoboard3D';
import { COMPONENTES, orientacionDe, useEnsamblaje, type TipoComponente } from './useEnsamblaje';
import './ensamblaje.css';

const ORDEN: TipoComponente[] = ['fuente', 'resistor', 'inductor', 'capacitor', 'interruptor'];

function Biblioteca() {
  const herramienta = useEnsamblaje((s) => s.herramienta);
  const establecerHerramienta = useEnsamblaje((s) => s.establecerHerramienta);
  const iniciarArrastreHTML = (evento: DragEvent, tipo: TipoComponente) => {
    evento.dataTransfer.setData('text/x-electrolab', tipo);
    evento.dataTransfer.effectAllowed = 'copy';
  };
  return (
    <div className="biblioteca">
      <h2 className="ensamblaje__titulo-panel">Biblioteca</h2>
      <p className="texto-xs texto-2 biblioteca__ayuda">Arrastra a la placa o toca y luego elige la perforación.</p>
      <div className="biblioteca__lista">
        {ORDEN.map((tipo) => {
          const c = COMPONENTES[tipo];
          const activo = herramienta.modo === 'colocar' && herramienta.tipo === tipo;
          return (
            <button
              key={tipo}
              draggable
              onDragStart={(e) => iniciarArrastreHTML(e, tipo)}
              onClick={() => establecerHerramienta(activo ? { modo: 'seleccionar' } : { modo: 'colocar', tipo })}
              className={`componente-biblioteca ${activo ? 'componente-biblioteca--activo' : ''}`}
              title={c.descripcion}
            >
              <span className="componente-biblioteca__simbolo">{c.simbolo}</span>
              <span className="componente-biblioteca__nombre">{c.nombre}</span>
              <span className="componente-biblioteca__valor mono">{c.unidad ? `${c.defecto} ${c.unidad}` : 'cerrado'}</span>
            </button>
          );
        })}
        <button
          className={`componente-biblioteca ${herramienta.modo === 'cable' ? 'componente-biblioteca--activo' : ''}`}
          onClick={() => establecerHerramienta(herramienta.modo === 'cable' ? { modo: 'seleccionar' } : { modo: 'cable', inicio: null })}
          title="Une dos perforaciones con un conductor ideal"
        >
          <span className="componente-biblioteca__simbolo">—</span>
          <span className="componente-biblioteca__nombre">Cable</span>
          <span className="componente-biblioteca__valor mono">2 clics</span>
        </button>
      </div>
    </div>
  );
}

function Propiedades({ pieza }: { pieza: Pieza }) {
  const { actualizarPieza, eliminar, rotar } = useEnsamblaje.getState();
  if (pieza.tipo === 'cable') {
    return (
      <div className="propiedades">
        <h3>Cable</h3>
        <p className="mono texto-s">
          {pieza.terminales[0]} ↔ {pieza.terminales[1]}
        </p>
        <p className="texto-xs texto-2">Conductor ideal: une los nodos de ambas tiras.</p>
        <button className="boton boton--peligro boton--pequeno" onClick={() => eliminar(pieza.id)}>
          <Icono nombre="papelera" tamano={14} /> Eliminar
        </button>
      </div>
    );
  }
  const c = COMPONENTES[pieza.tipo];
  return (
    <div className="propiedades">
      <div className="propiedades__cabecera">
        <span className="propiedades__simbolo">{c.simbolo}</span>
        <div>
          <h3>{c.nombre}</h3>
          <span className="mono texto-xs texto-2">
            {pieza.terminales[0]} → {pieza.terminales[1]} · {orientacionDe(pieza)}
          </span>
        </div>
      </div>
      <p className="texto-xs texto-2">{c.descripcion}</p>
      {pieza.tipo === 'interruptor' ? (
        <button className={`boton ${pieza.cerrado ? 'boton--activo' : ''}`} onClick={() => actualizarPieza(pieza.id, { cerrado: !pieza.cerrado })}>
          {pieza.cerrado ? 'Cerrado · conduce' : 'Abierto · no conduce'}
        </button>
      ) : (
        <label className="campo">
          <span className="campo__etiqueta">
            Valor ({c.unidad}) · rango {c.minimo}–{c.maximo}
          </span>
          <div className="propiedades__valor">
            <input
              type="range"
              min={c.minimo}
              max={c.maximo}
              step={c.paso}
              value={pieza.valor / c.factor}
              style={{ '--progreso': `${((pieza.valor / c.factor - c.minimo) / (c.maximo - c.minimo)) * 100}%` } as React.CSSProperties}
              onChange={(e) => actualizarPieza(pieza.id, { valor: Number(e.target.value) * c.factor })}
            />
            <input
              className="entrada mono"
              type="number"
              min={c.minimo}
              max={c.maximo}
              step={c.paso}
              value={Number((pieza.valor / c.factor).toPrecision(6))}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (Number.isFinite(v) && v >= c.minimo && v <= c.maximo) actualizarPieza(pieza.id, { valor: v * c.factor });
              }}
            />
          </div>
        </label>
      )}
      <div className="fila">
        <button className="boton boton--pequeno" onClick={rotar} title="Rotar (R)">
          <Icono nombre="reiniciar" tamano={14} /> Rotar
        </button>
        <button className="boton boton--pequeno boton--peligro" onClick={() => eliminar(pieza.id)} title="Eliminar (Supr)">
          <Icono nombre="papelera" tamano={14} /> Eliminar
        </button>
      </div>
    </div>
  );
}

function PanelResultados() {
  const analisis = useEnsamblaje((s) => s.analisis);
  const resultado = useEnsamblaje((s) => s.resultado);
  const tiempo = useEnsamblaje((s) => s.tiempo);
  const reproduciendo = useEnsamblaje((s) => s.reproduciendo);
  const { reproducir, pausar, seleccionar } = useEnsamblaje.getState();
  const navegar = useNavigate();

  if (!analisis.valido || !resultado || !analisis.parametros) {
    return (
      <div className="diagnostico">
        <h3 className="diagnostico__titulo">
          <span className="punto-estado punto-estado--error" /> Circuito no compatible
        </h3>
        <ul className="diagnostico__lista">
          {analisis.errores.map((error) => (
            <li key={error.mensaje + error.piezas.join()}>
              <button className="diagnostico__error" onClick={() => error.piezas[0] && seleccionar(error.piezas[0])} disabled={!error.piezas.length}>
                {error.mensaje}
              </button>
            </li>
          ))}
        </ul>
        <p className="texto-xs texto-2">El modelo resuelve un único lazo en serie con una fuente, al menos un inductor y al menos un capacitor.</p>
      </div>
    );
  }

  const p = analisis.parametros;
  const d = resultado.derivados;
  const enRango = validarParametros(p).valido;
  return (
    <div className="diagnostico">
      <h3 className="diagnostico__titulo">
        <span className="punto-estado punto-estado--ok" /> Lazo RLC en serie reconocido
      </h3>
      <div className={`clasificacion-compacta clasificacion-compacta--${resultado.clasificacion}`}>
        <strong>{NOMBRES_AMORTIGUAMIENTO[resultado.clasificacion]}</strong>
        <span>{DESCRIPCION_AMORTIGUAMIENTO[resultado.clasificacion]}</span>
      </div>
      <Formula latex={`${aPrecision(p.inductancia, 4)}\\,q'' + ${aPrecision(p.resistencia, 4)}\\,q' + ${aPrecision(1 / p.capacitancia, 4)}\\,q = ${p.fuente.amplitud}`} bloque />
      <dl className="datos-compactos mono">
        <div>
          <dt>ζ</dt>
          <dd>{aPrecision(d.relacionAmortiguamiento, 4)}</dd>
        </div>
        <div>
          <dt>ω₀</dt>
          <dd>{aPrecision(d.frecuenciaNatural, 4)} rad/s</dd>
        </div>
        <div>
          <dt>R crítica</dt>
          <dd>{aPrecision(d.resistenciaCritica, 4)} Ω</dd>
        </div>
        <div>
          <dt>i máx</dt>
          <dd>{formatearIngenieria(resultado.corrienteMaxima, 'A')}</dd>
        </div>
      </dl>
      <Osciloscopio resultado={resultado} tiempo={tiempo} completo={false} alto={110} />
      <div className="fila">
        <button className="boton boton--primario boton--pequeno" onClick={reproduciendo ? pausar : reproducir}>
          <Icono nombre={reproduciendo ? 'pausa' : 'reproducir'} tamano={14} /> {reproduciendo ? 'Pausar' : 'Simular'}
        </button>
        <button
          className="boton boton--pequeno"
          disabled={!enRango}
          title={enRango ? 'Cargar estos valores en el laboratorio 3D' : 'Algún valor está fuera de los rangos del laboratorio'}
          onClick={() => {
            useLaboratorio.getState().establecerParametros(p);
            notificar('Circuito cargado en el laboratorio 3D', 'exito');
            navegar('/laboratorio');
          }}
        >
          <Icono nombre="laboratorio" tamano={14} /> Abrir en laboratorio
        </button>
      </div>
      {analisis.advertencias.map((a) => (
        <p key={a} className="texto-xs texto-2 diagnostico__advertencia">
          {a}
        </p>
      ))}
    </div>
  );
}

function Ayuda() {
  const herramienta = useEnsamblaje((s) => s.herramienta);
  const orientacion = useEnsamblaje((s) => s.orientacion);
  const hueco = useEnsamblaje((s) => s.huecoActivo);
  const texto =
    herramienta.modo === 'colocar'
      ? `Toca una perforación para colocar el ${COMPONENTES[herramienta.tipo].nombre.toLowerCase()} (${orientacion}; R para rotar).`
      : herramienta.modo === 'cable'
        ? herramienta.inicio
          ? `Cable desde ${herramienta.inicio}: toca la perforación de destino.`
          : 'Toca la perforación donde empieza el cable.'
        : 'Arrastra una pieza para moverla · tócala para editarla · señala una perforación para ver su tira interna.';
  return (
    <div className="ensamblaje__ayuda">
      <span>{texto}</span>
      {hueco && <span className="mono">{hueco}</span>}
    </div>
  );
}

export default function PaginaEnsamblaje() {
  const piezas = useEnsamblaje((s) => s.piezas);
  const seleccion = useEnsamblaje((s) => s.seleccion);
  const herramienta = useEnsamblaje((s) => s.herramienta);
  const arrastrando = useEnsamblaje((s) => s.arrastrando);
  const verConexiones = useEnsamblaje((s) => s.verConexiones);
  const verRedes = useEnsamblaje((s) => s.verRedes);
  const { establecerHerramienta, rotar, eliminar, alternar, cargarEjemplo, limpiar, colocar, soltar } = useEnsamblaje.getState();
  const proyector = useRef<((x: number, y: number) => string | null) | null>(null);
  const piezaSeleccionada = piezas.find((p) => p.id === seleccion);

  // Atajos de teclado y fin del arrastre fuera de la placa.
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) return;
      if (e.key === 'r' || e.key === 'R') rotar();
      else if (e.key === 'Delete' || e.key === 'Backspace') eliminar();
      else if (e.key === 'Escape') establecerHerramienta({ modo: 'seleccionar' });
    };
    const alSoltar = () => {
      const estado = useEnsamblaje.getState();
      if (estado.arrastrando) soltar(estado.huecoActivo);
    };
    window.addEventListener('keydown', alTeclear);
    window.addEventListener('pointerup', alSoltar);
    return () => {
      window.removeEventListener('keydown', alTeclear);
      window.removeEventListener('pointerup', alSoltar);
    };
  }, [rotar, eliminar, establecerHerramienta, soltar]);

  const alSoltarHTML = (evento: DragEvent) => {
    evento.preventDefault();
    const tipo = evento.dataTransfer.getData('text/x-electrolab') as TipoComponente;
    const hueco = proyector.current?.(evento.clientX, evento.clientY);
    if (!tipo || !hueco) return;
    if (!colocar(tipo, hueco)) notificar('No cabe ahí: alguna perforación está ocupada o queda fuera de la placa.', 'error');
  };

  return (
    <div className="ensamblaje">
      <aside className="ensamblaje__lateral panel">
        <Biblioteca />
      </aside>

      <section className="ensamblaje__escenario" onDragOver={(e) => e.preventDefault()} onDrop={alSoltarHTML}>
        <div className="ensamblaje__lienzo">
          <Escena3D encuadre={{ posicion: [0, 8.5, 7.5], objetivo: [0, 0, 0.4] }} camaraBloqueada={Boolean(arrastrando)}>
            {(paleta) => <Protoboard3D paleta={paleta} proyector={proyector} />}
          </Escena3D>
          <div className="ensamblaje__herramientas">
            <div className="grupo-botones">
              <button className={`boton boton--pequeno ${herramienta.modo === 'seleccionar' ? 'boton--activo' : ''}`} onClick={() => establecerHerramienta({ modo: 'seleccionar' })}>
                Seleccionar
              </button>
              <button className={`boton boton--pequeno ${herramienta.modo === 'cable' ? 'boton--activo' : ''}`} onClick={() => establecerHerramienta({ modo: 'cable', inicio: null })}>
                Cable
              </button>
              <button className="boton boton--pequeno" onClick={rotar} title="Rotar (R)">
                Rotar
              </button>
            </div>
            <div className="grupo-botones">
              <button className={`boton boton--pequeno ${verConexiones ? 'boton--activo' : ''}`} onClick={() => alternar('verConexiones')} aria-pressed={verConexiones}>
                Conexiones internas
              </button>
              <button className={`boton boton--pequeno ${verRedes ? 'boton--activo' : ''}`} onClick={() => alternar('verRedes')} aria-pressed={verRedes}>
                Nodos
              </button>
              <button className="boton boton--pequeno" onClick={cargarEjemplo}>
                Ejemplo RLC
              </button>
              <button className="boton boton--pequeno boton--peligro" onClick={limpiar}>
                Vaciar
              </button>
            </div>
          </div>
          <Ayuda />
        </div>
      </section>

      <aside className="ensamblaje__lateral ensamblaje__lateral--derecho panel">
        <AnimatePresence mode="wait">
          {piezaSeleccionada && (
            <motion.div key={piezaSeleccionada.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Propiedades pieza={piezaSeleccionada} />
            </motion.div>
          )}
        </AnimatePresence>
        <PanelResultados />
      </aside>
    </div>
  );
}
