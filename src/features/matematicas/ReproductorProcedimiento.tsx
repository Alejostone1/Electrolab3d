import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import {
  CONDICIONES_INICIALES_REPOSO,
  DESCRIPCION_AMORTIGUAMIENTO,
  NOMBRES_AMORTIGUAMIENTO,
  simularCircuito,
  type ParametrosCircuito,
  type PasoProcedimiento,
} from '@/engine';
import { Formula } from '@/components/common/Formula';
import { Icono } from '@/components/common/Icono';
import { aPrecision } from '@/utils/formato';

interface PropiedadesReproductor {
  pasos: PasoProcedimiento[];
  parametros: ParametrosCircuito;
  tolerancia: number;
}

const VELOCIDADES = [0.5, 1, 1.5, 2];
/** Tiempo (ms a velocidad 1) que tarda en aparecer cada expresión de un paso. */
const TIEMPO_EXPRESION = 1700;
const PAUSA_FINAL = 2600;
const ANCHO = 360;
const ALTO = 150;

/**
 * Reproductor del procedimiento: cada paso se construye expresión por expresión,
 * con controles de reproducción, y en paralelo se dibuja la respuesta q(t)
 * calculada por el motor a medida que avanza la resolución.
 */
export function ReproductorProcedimiento({ pasos, parametros, tolerancia }: PropiedadesReproductor) {
  const [paso, setPaso] = useState(0);
  const [visibles, setVisibles] = useState(1);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [velocidad, setVelocidad] = useState(1);

  const actual = pasos[paso];
  const completo = visibles >= actual.formulas.length;

  // Cambiar de configuración reinicia la lectura.
  useEffect(() => {
    setPaso(0);
    setVisibles(1);
  }, [pasos]);

  useEffect(() => {
    if (!reproduciendo) return;
    const espera = (completo ? PAUSA_FINAL : TIEMPO_EXPRESION) / velocidad;
    const id = setTimeout(() => {
      if (!completo) setVisibles((v) => v + 1);
      else if (paso + 1 < pasos.length) {
        setPaso(paso + 1);
        setVisibles(1);
      } else setReproduciendo(false);
    }, espera);
    return () => clearTimeout(id);
  }, [reproduciendo, completo, paso, visibles, velocidad, pasos.length]);

  const ir = (destino: number) => {
    setPaso(Math.max(0, Math.min(pasos.length - 1, destino)));
    setVisibles(1);
  };
  const siguiente = () => (completo ? ir(paso + 1) : setVisibles(actual.formulas.length));
  const anterior = () => (visibles > 1 ? setVisibles(1) : ir(paso - 1));

  const resultado = useMemo(
    () => simularCircuito(parametros, { condiciones: CONDICIONES_INICIALES_REPOSO, toleranciaCritica: tolerancia, muestras: 600 }),
    [parametros, tolerancia],
  );
  const curva = useMemo(() => {
    const { q } = resultado.serie;
    const maximo = Math.max(...q.map(Math.abs), 1e-12);
    return q.map((v, k) => `${k ? 'L' : 'M'}${((k / (q.length - 1)) * ANCHO).toFixed(1)},${(ALTO - 12 - (v / maximo) * (ALTO - 30)).toFixed(1)}`).join('');
  }, [resultado]);
  // La curva se revela a partir de la clasificación (paso 8) y se completa con la solución final.
  const progresoCurva = Math.max(0, Math.min(1, (paso + (visibles / actual.formulas.length) - 7) / (pasos.length - 8)));
  const clasificado = paso >= 7;
  const d = resultado.derivados;

  return (
    <div className="reproductor">
      <div className="reproductor__escenario">
        <div className="reproductor__progreso" role="tablist" aria-label="Pasos del procedimiento">
          {pasos.map((p, k) => (
            <button
              key={p.numero}
              role="tab"
              aria-selected={k === paso}
              aria-label={`Paso ${p.numero}: ${p.titulo}`}
              className={`reproductor__segmento ${k < paso ? 'reproductor__segmento--hecho' : ''} ${k === paso ? 'reproductor__segmento--actual' : ''}`}
              onClick={() => ir(k)}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.section
            key={`${paso}-${pasos.length}-${actual.titulo}`}
            className="reproductor__paso"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35 }}
          >
            <div className="reproductor__encabezado">
              <span className="reproductor__numero mono">
                {String(actual.numero).padStart(2, '0')}
                <small>/{pasos.length}</small>
              </span>
              <div>
                <h2>{actual.titulo}</h2>
                <p className="reproductor__operacion">{actual.operacion}</p>
              </div>
            </div>

            <div className="reproductor__expresiones">
              {actual.formulas.slice(0, visibles).map((f, k) => {
                const esUltima = k === actual.formulas.length - 1 && completo;
                return (
                  <motion.div
                    key={k}
                    className={`reproductor__expresion ${k === visibles - 1 ? 'reproductor__expresion--nueva' : ''} ${esUltima ? 'reproductor__expresion--resultado' : ''}`}
                    initial={{ opacity: 0, y: 14, filter: 'blur(5px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.5 }}
                  >
                    {k > 0 && <span className="reproductor__flecha" aria-hidden="true">⟶</span>}
                    {esUltima && <span className="reproductor__etiqueta mono">resultado</span>}
                    <Formula latex={f} bloque />
                  </motion.div>
                );
              })}
            </div>

            <div className="reproductor__texto">
              <p>{actual.explicacion}</p>
              <p className="reproductor__porque">
                <b>¿Por qué?</b> {actual.justificacion}
              </p>
              {actual.nota && <p className="paso__nota texto-s">{actual.nota}</p>}
            </div>
          </motion.section>
        </AnimatePresence>

        <div className="reproductor__controles">
          <button className="boton boton--icono" onClick={() => { setReproduciendo(false); ir(0); }} aria-label="Reiniciar" title="Reiniciar">
            <Icono nombre="reiniciar" tamano={18} />
          </button>
          <button className="boton boton--icono" onClick={anterior} disabled={paso === 0 && visibles === 1} aria-label="Paso anterior" title="Paso anterior">
            <Icono nombre="flechaIzq" tamano={18} />
          </button>
          <button
            className="boton boton--primario reproductor__play"
            onClick={() => {
              if (!reproduciendo && paso === pasos.length - 1 && completo) ir(0);
              setReproduciendo((v) => !v);
            }}
          >
            <Icono nombre={reproduciendo ? 'pausa' : 'reproducir'} tamano={16} /> {reproduciendo ? 'Pausar' : 'Reproducir'}
          </button>
          <button className="boton boton--icono" onClick={siguiente} disabled={paso === pasos.length - 1 && completo} aria-label="Siguiente paso" title="Siguiente">
            <Icono nombre="flecha" tamano={18} />
          </button>
          <label className="reproductor__velocidad">
            <span className="visualmente-oculto">Velocidad</span>
            <select className="selector mono" value={velocidad} onChange={(e) => setVelocidad(Number(e.target.value))}>
              {VELOCIDADES.map((v) => (
                <option key={v} value={v}>
                  {v}×
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <aside className="reproductor__contexto">
        <div className="reproductor__parametros mono">
          <span>L = {aPrecision(parametros.inductancia, 4)} H</span>
          <span>R = {aPrecision(parametros.resistencia, 5)} Ω</span>
          <span>C = {aPrecision(parametros.capacitancia * 1e6, 5)} µF</span>
          <span>E₀ = {parametros.fuente.amplitud} V</span>
        </div>

        <figure className="reproductor__grafica">
          <figcaption>
            Respuesta <Formula latex="q(t)" /> calculada por el motor
          </figcaption>
          <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img" aria-label="Respuesta q(t)">
            <line x1={0} x2={ANCHO} y1={ALTO - 12} y2={ALTO - 12} className="reproductor__eje" />
            <path d={curva} className="reproductor__curva reproductor__curva--fondo" />
            <path d={curva} pathLength={1} className={`reproductor__curva reproductor__curva--${resultado.clasificacion}`} style={{ strokeDashoffset: 1 - progresoCurva }} />
          </svg>
          {progresoCurva === 0 && <p className="texto-xs texto-2">La curva aparecerá cuando se clasifique el sistema.</p>}
        </figure>

        <div className={`reproductor__interpretacion ${clasificado ? 'reproductor__interpretacion--visible' : ''}`}>
          <span className="etiqueta-seccion">Interpretación</span>
          {clasificado ? (
            <>
              <strong className={`texto-${resultado.clasificacion}`}>{NOMBRES_AMORTIGUAMIENTO[resultado.clasificacion]}</strong>
              <p className="texto-s">{DESCRIPCION_AMORTIGUAMIENTO[resultado.clasificacion]}</p>
              <p className="mono texto-xs texto-2">
                ζ = {aPrecision(d.relacionAmortiguamiento, 4)} · ω₀ = {aPrecision(d.frecuenciaNatural, 4)} rad/s · α = {aPrecision(d.coeficienteAmortiguamiento, 4)} s⁻¹
              </p>
            </>
          ) : (
            <p className="texto-s texto-2">Aún no sabemos cómo se comporta el circuito: lo decidirá el discriminante en el paso 8.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
