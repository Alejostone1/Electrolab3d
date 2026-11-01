import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  calcularParametrosDerivados,
  clasificarAmortiguamiento,
  DESCRIPCION_AMORTIGUAMIENTO,
  NOMBRES_AMORTIGUAMIENTO,
  RANGOS,
  type ParametrosCircuito,
  type TipoAmortiguamiento,
} from '@/engine';
import { Formula } from '@/components/common/Formula';
import { Icono } from '@/components/common/Icono';
import { listarHistorialDesafios, registrarDesafio } from '@/services/almacenamiento';
import { useLaboratorio } from '@/store/useLaboratorio';
import { notificar } from '@/store/useNotificaciones';
import { aPrecision } from '@/utils/formato';
import { ControlDeslizante } from '../laboratorio/controls/ControlDeslizante';
import { Osciloscopio } from '../laboratorio/controls/Osciloscopio';
import { circuitoAleatorio, generarCuestionario, type Pregunta } from './generadorPreguntas';
import './desafios.css';

type Modo = 'prediccion' | 'cuestionario';
const TIPOS: TipoAmortiguamiento[] = ['subamortiguado', 'critico', 'sobreamortiguado'];

/** Funcionalidad diferenciadora: predecir antes de encender el circuito. */
function PrediceAntesDeExperimentar() {
  const [parametros, setParametros] = useState<ParametrosCircuito>(() => circuitoAleatorio());
  const [prediccion, setPrediccion] = useState<TipoAmortiguamiento | null>(null);
  const [fase, setFase] = useState<'observar' | 'ejecutando' | 'comparar'>('observar');
  const [aciertos, setAciertos] = useState({ correctas: 0, total: 0 });
  const resultado = useLaboratorio((s) => s.resultado);
  const tiempo = useLaboratorio((s) => s.tiempo);
  const reproduciendo = useLaboratorio((s) => s.reproduciendo);

  const d = calcularParametrosDerivados(parametros);
  const real = clasificarAmortiguamiento(d.relacionAmortiguamiento);
  const acerto = prediccion === real;

  const ejecutar = () => {
    if (!prediccion) return;
    const laboratorio = useLaboratorio.getState();
    laboratorio.establecerParametros(parametros);
    useLaboratorio.setState({ tiempo: 0 });
    laboratorio.reproducir();
    setFase('ejecutando');
  };

  // Al terminar la simulación (o si el usuario la pausa) se pasa a la comparación.
  const terminoSimulacion = fase === 'ejecutando' && !reproduciendo && tiempo > 0;
  useEffect(() => {
    if (!terminoSimulacion) return;
    setFase('comparar');
    setAciertos((a) => ({ correctas: a.correctas + (acerto ? 1 : 0), total: a.total + 1 }));
  }, [terminoSimulacion, acerto]);

  const nuevo = () => {
    setParametros(circuitoAleatorio());
    setPrediccion(null);
    setFase('observar');
  };

  const pasos = ['Observa', 'Predice', 'Ejecuta', 'Compara', 'Explica'];
  const pasoActual = fase === 'observar' ? (prediccion ? 1 : 0) : fase === 'ejecutando' ? 2 : 4;

  return (
    <div className="prediccion">
      <ol className="prediccion__pasos">
        {pasos.map((p, k) => (
          <li key={p} className={k <= pasoActual ? 'activo' : ''}>
            <span>{k + 1}</span>
            {p}
          </li>
        ))}
      </ol>

      <div className="prediccion__diseno">
        <div className="tarjeta">
          <h2>1. Observa los parámetros</h2>
          <div className="lista-indicadores">
            <div className="indicador">
              <span className="indicador__nombre">Inductancia L</span>
              <span className="indicador__valor">{parametros.inductancia} H</span>
            </div>
            <div className="indicador">
              <span className="indicador__nombre">Resistencia R</span>
              <span className="indicador__valor">{parametros.resistencia} Ω</span>
            </div>
            <div className="indicador">
              <span className="indicador__nombre">Capacitancia C</span>
              <span className="indicador__valor">{aPrecision(parametros.capacitancia * 1e6, 4)} µF</span>
            </div>
            <div className="indicador">
              <span className="indicador__nombre">Fuente E₀</span>
              <span className="indicador__valor">{parametros.fuente.amplitud} V</span>
            </div>
          </div>
          <p className="texto-s texto-2">
            Pista: compara R con <Formula latex="2\sqrt{L/C}" />.
          </p>
          <h2>2. Predice el comportamiento</h2>
          <div className="opciones-prediccion" role="radiogroup">
            {TIPOS.map((t) => (
              <button
                key={t}
                role="radio"
                aria-checked={prediccion === t}
                disabled={fase !== 'observar'}
                className={`opcion opcion--${t} ${prediccion === t ? 'opcion--elegida' : ''}`}
                onClick={() => setPrediccion(t)}
              >
                {NOMBRES_AMORTIGUAMIENTO[t]}
              </button>
            ))}
          </div>
          <button className="boton boton--primario boton--grande prediccion__ejecutar" disabled={!prediccion || fase !== 'observar'} onClick={ejecutar}>
            <Icono nombre="energia" /> 3. Encender y ejecutar el circuito
          </button>
          <p className="texto-xs texto-2">El circuito también se carga en el laboratorio 3D con estos valores.</p>
        </div>

        <div className="tarjeta">
          <h2>4. Observa y compara</h2>
          {fase === 'observar' ? (
            <div className="prediccion__espera texto-2">
              <Icono nombre="lupa" tamano={32} />
              <p>Haz tu predicción y enciende el circuito para ver la respuesta calculada por el motor.</p>
            </div>
          ) : (
            <>
              <Osciloscopio resultado={resultado} tiempo={tiempo} completo={false} alto={150} />
              <AnimatePresence>
                {fase === 'comparar' && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`veredicto ${acerto ? 'veredicto--ok' : 'veredicto--error'}`}>
                    <strong>
                      <Icono nombre={acerto ? 'check' : 'x'} /> {acerto ? '¡Predicción correcta!' : 'La predicción no coincide'}
                    </strong>
                    <p>
                      Predijiste <b>{NOMBRES_AMORTIGUAMIENTO[prediccion!].toLowerCase()}</b>; el motor obtuvo <b>{NOMBRES_AMORTIGUAMIENTO[real].toLowerCase()}</b>.
                    </p>
                    <h3>5. Explicación matemática</h3>
                    <Formula
                      latex={`\\zeta = \\frac{R}{2}\\sqrt{\\frac{C}{L}} = \\frac{${parametros.resistencia}}{2}\\sqrt{\\frac{${parametros.capacitancia}}{${parametros.inductancia}}} = ${aPrecision(d.relacionAmortiguamiento, 4)}`}
                      bloque
                    />
                    <p className="texto-s">
                      R crítica = {aPrecision(d.resistenciaCritica, 4)} Ω. {DESCRIPCION_AMORTIGUAMIENTO[real]}
                    </p>
                    <div className="fila">
                      <button className="boton boton--primario" onClick={nuevo}>
                        Nuevo circuito
                      </button>
                      <Link to="/matematicas" className="boton">
                        Ver procedimiento completo
                      </Link>
                      <Link to="/laboratorio" className="boton">
                        Ver en 3D
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
          <p className="texto-s texto-2 prediccion__marcador">
            Aciertos en esta sesión: <b className="mono">{aciertos.correctas}/{aciertos.total}</b>
          </p>
        </div>
      </div>
    </div>
  );
}

function RetoConfiguracion({ pregunta, alResponder, respondida }: { pregunta: Pregunta; alResponder: (correcta: boolean) => void; respondida: boolean }) {
  const [resistencia, setResistencia] = useState(pregunta.reto!.base.resistencia);
  const parametros = { ...pregunta.reto!.base, resistencia };
  const zeta = calcularParametrosDerivados(parametros).relacionAmortiguamiento;
  return (
    <div className="reto">
      <ControlDeslizante
        etiqueta="Resistencia"
        simbolo="R"
        unidad="Ω"
        valor={resistencia}
        minimo={RANGOS.resistencia.minimo}
        maximo={RANGOS.resistencia.maximo}
        paso={0.01}
        alCambiar={setResistencia}
      />
      <p className="mono texto-s texto-2">ζ actual = {respondida ? aPrecision(zeta, 4) : '?'}</p>
      <button className="boton boton--primario" disabled={respondida} onClick={() => alResponder(Math.abs(zeta - 1) <= 0.02)}>
        Comprobar configuración
      </button>
    </div>
  );
}

function Cuestionario() {
  const [preguntas, setPreguntas] = useState<Pregunta[]>(() => generarCuestionario());
  const [indice, setIndice] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, boolean>>({});
  const [eleccion, setEleccion] = useState<number | null>(null);
  const historial = useMemo(() => listarHistorialDesafios(), [indice]);
  const pregunta = preguntas[indice];
  const respondida = pregunta ? pregunta.id in respuestas : false;
  const puntaje = Object.values(respuestas).filter(Boolean).length;
  const terminado = indice >= preguntas.length;

  const responder = (correcta: boolean, opcion?: number) => {
    if (respondida) return;
    setEleccion(opcion ?? null);
    setRespuestas((r) => ({ ...r, [pregunta.id]: correcta }));
  };

  const siguiente = () => {
    setEleccion(null);
    if (indice + 1 >= preguntas.length) {
      registrarDesafio({ fecha: new Date().toISOString(), puntaje, total: preguntas.length });
      notificar(`Desafío terminado: ${puntaje}/${preguntas.length}`, puntaje >= preguntas.length / 2 ? 'exito' : 'info');
    }
    setIndice((i) => i + 1);
  };

  const reiniciar = () => {
    setPreguntas(generarCuestionario());
    setIndice(0);
    setRespuestas({});
    setEleccion(null);
  };

  if (terminado) {
    const porcentaje = Math.round((puntaje / preguntas.length) * 100);
    return (
      <div className="tarjeta resultado-final">
        <span className="resultado-final__porcentaje mono">{porcentaje}%</span>
        <h2>
          {puntaje} de {preguntas.length} respuestas correctas
        </h2>
        <p className="texto-2">
          {porcentaje >= 80 ? 'Excelente dominio del modelo RLC.' : porcentaje >= 50 ? 'Buen trabajo: repasa los pasos del centro matemático.' : 'Revisa el centro matemático y vuelve a intentarlo.'}
        </p>
        <button className="boton boton--primario boton--grande" onClick={reiniciar}>
          <Icono nombre="reiniciar" /> Nuevo cuestionario
        </button>
        {historial.length > 0 && (
          <div className="historial-desafios">
            <h3>Intentos anteriores</h3>
            {historial.slice(0, 5).map((h) => (
              <p key={h.fecha} className="mono texto-s texto-2">
                {new Date(h.fecha).toLocaleString('es-CO')} · {h.puntaje}/{h.total}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="cuestionario">
      <div className="cuestionario__progreso">
        <span className="mono texto-s">
          Pregunta {indice + 1} de {preguntas.length}
        </span>
        <span className="mono texto-s">Puntaje: {puntaje}</span>
        <div className="barra-progreso">
          <span style={{ width: `${(indice / preguntas.length) * 100}%` }} />
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={pregunta.id} className="tarjeta pregunta" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
          <span className="etiqueta-seccion">{pregunta.categoria}</span>
          <h2>{pregunta.enunciado}</h2>
          {pregunta.formula && <Formula latex={pregunta.formula} bloque />}
          {pregunta.resultado && <Osciloscopio resultado={pregunta.resultado} tiempo={pregunta.resultado.duracion} alto={150} />}
          {pregunta.tipo === 'configuracion' ? (
            <RetoConfiguracion pregunta={pregunta} alResponder={(c) => responder(c)} respondida={respondida} />
          ) : (
            <div className="opciones">
              {pregunta.opciones.map((opcion, k) => {
                const estado = respondida ? (k === pregunta.correcta ? 'correcta' : k === eleccion ? 'incorrecta' : '') : '';
                return (
                  <button key={opcion} className={`opcion ${estado ? `opcion--${estado}` : ''}`} disabled={respondida} onClick={() => responder(k === pregunta.correcta, k)}>
                    <span className="opcion__letra mono">{String.fromCharCode(65 + k)}</span>
                    {opcion}
                  </button>
                );
              })}
            </div>
          )}
          {respondida && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`veredicto ${respuestas[pregunta.id] ? 'veredicto--ok' : 'veredicto--error'}`}>
              <strong>
                <Icono nombre={respuestas[pregunta.id] ? 'check' : 'x'} /> {respuestas[pregunta.id] ? 'Correcto' : 'Incorrecto'}
              </strong>
              <p>{pregunta.explicacion}</p>
              <button className="boton boton--primario" onClick={siguiente}>
                {indice + 1 >= preguntas.length ? 'Ver resultado' : 'Siguiente pregunta'} <Icono nombre="flecha" tamano={16} />
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function PaginaDesafios() {
  const [modo, setModo] = useState<Modo>('prediccion');
  return (
    <div className="pagina desafios">
      <header className="encabezado-pagina">
        <span className="etiqueta-seccion">Módulo 07 · Desafíos</span>
        <h1>Pon a prueba tu intuición matemática</h1>
        <p>Las preguntas se generan con circuitos aleatorios y sus respuestas las calcula el mismo motor del laboratorio.</p>
      </header>
      <div className="pestanas desafios__modos" role="tablist">
        <button role="tab" className="pestana" aria-selected={modo === 'prediccion'} onClick={() => setModo('prediccion')}>
          Predice antes de experimentar
        </button>
        <button role="tab" className="pestana" aria-selected={modo === 'cuestionario'} onClick={() => setModo('cuestionario')}>
          Cuestionario con puntuación
        </button>
      </div>
      {modo === 'prediccion' ? <PrediceAntesDeExperimentar /> : <Cuestionario />}
    </div>
  );
}
