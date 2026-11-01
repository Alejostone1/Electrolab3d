import { useMemo } from 'react';
import type { ResultadoSimulacion } from '@/engine';
import './controles.css';

interface PropiedadesOsciloscopio {
  resultado: ResultadoSimulacion;
  tiempo: number;
  /** Si es false, la traza solo se dibuja hasta el tiempo actual (efecto de barrido). */
  completo?: boolean;
  alto?: number;
}

const ANCHO = 320;
const PUNTOS = 260;

function trazar(valores: number[], escala: number, alto: number, hastaIndice: number): string {
  const paso = Math.max(1, Math.floor(valores.length / PUNTOS));
  const partes: string[] = [];
  for (let k = 0; k <= Math.min(hastaIndice, valores.length - 1); k += paso) {
    const x = (k / (valores.length - 1)) * ANCHO;
    const y = alto / 2 - (valores[k] / escala) * (alto / 2 - 6);
    partes.push(`${partes.length ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return partes.join('');
}

/** Mini osciloscopio SVG ligero: q(t)/q_ref y i(t)/i_max con cursor de tiempo. */
export function Osciloscopio({ resultado, tiempo, completo = true, alto = 120 }: PropiedadesOsciloscopio) {
  const { serie, duracion } = resultado;
  const indiceActual = Math.round((tiempo / duracion) * (serie.t.length - 1));
  const hasta = completo ? serie.t.length - 1 : indiceActual;
  const escalaCarga = useMemo(() => Math.max(...serie.q.map(Math.abs), 1e-12), [serie.q]);
  const escalaCorriente = Math.max(resultado.corrienteMaxima, 1e-12);
  const carga = useMemo(() => trazar(serie.q, escalaCarga, alto, hasta), [serie.q, escalaCarga, alto, hasta]);
  const corriente = useMemo(() => trazar(serie.i, escalaCorriente, alto, hasta), [serie.i, escalaCorriente, alto, hasta]);
  const xCursor = (tiempo / duracion) * ANCHO;
  const yReferencia = resultado.parametros.fuente.tipo === 'constante' ? alto / 2 - ((resultado.parametros.capacitancia * resultado.parametros.fuente.amplitud) / escalaCarga) * (alto / 2 - 6) : null;

  return (
    <figure className="osciloscopio">
      <svg viewBox={`0 0 ${ANCHO} ${alto}`} preserveAspectRatio="none" role="img" aria-label="Osciloscopio de carga y corriente">
        {Array.from({ length: 9 }).map((_, k) => (
          <line key={`v${k}`} x1={(k / 8) * ANCHO} x2={(k / 8) * ANCHO} y1={0} y2={alto} className="osciloscopio__rejilla" />
        ))}
        {Array.from({ length: 5 }).map((_, k) => (
          <line key={`h${k}`} y1={(k / 4) * alto} y2={(k / 4) * alto} x1={0} x2={ANCHO} className="osciloscopio__rejilla" />
        ))}
        {yReferencia !== null && <line x1={0} x2={ANCHO} y1={yReferencia} y2={yReferencia} className="osciloscopio__referencia" />}
        <path d={corriente} className="osciloscopio__traza osciloscopio__traza--corriente" />
        <path d={carga} className="osciloscopio__traza osciloscopio__traza--carga" />
        <line x1={xCursor} x2={xCursor} y1={0} y2={alto} className="osciloscopio__cursor" />
      </svg>
      <figcaption className="osciloscopio__leyenda">
        <span className="osciloscopio__clave osciloscopio__clave--carga">q(t)</span>
        <span className="osciloscopio__clave osciloscopio__clave--corriente">i(t)</span>
        {yReferencia !== null && <span className="osciloscopio__clave osciloscopio__clave--referencia">C·E₀</span>}
      </figcaption>
    </figure>
  );
}
