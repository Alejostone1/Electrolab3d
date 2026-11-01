import { useMemo } from 'react';
import { PRESETS, simularCircuito } from '@/engine';

const ANCHO = 320;
const ALTO = 130;
const COLORES = { subamortiguado: 'var(--cian)', critico: 'var(--verde)', sobreamortiguado: 'var(--naranja)' } as const;

/** Las tres respuestas de carga calculadas por el motor, sobre un mismo eje temporal. */
export function CurvasComparativas({ duracion = 0.5 }: { duracion?: number }) {
  const curvas = useMemo(
    () =>
      PRESETS.map((preset) => {
        const r = simularCircuito(preset.parametros, { duracion, muestras: 300 });
        const referencia = preset.parametros.capacitancia * preset.parametros.fuente.amplitud;
        const d = r.serie.q
          .map((q, k) => `${k ? 'L' : 'M'}${((k / 300) * ANCHO).toFixed(1)},${(ALTO - 10 - (q / referencia) * (ALTO - 50)).toFixed(1)}`)
          .join('');
        return { id: preset.id, nombre: preset.nombre, d };
      }),
    [duracion],
  );
  const yReferencia = ALTO - 10 - (ALTO - 50);
  return (
    <figure className="comparativa">
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img" aria-label="Comparación de las tres respuestas">
        <line x1={0} x2={ANCHO} y1={yReferencia} y2={yReferencia} className="comparativa__referencia" />
        <line x1={0} x2={ANCHO} y1={ALTO - 10} y2={ALTO - 10} className="comparativa__eje" />
        {curvas.map((c) => (
          <path key={c.id} d={c.d} fill="none" stroke={COLORES[c.id]} strokeWidth={2.2} className="comparativa__curva" />
        ))}
      </svg>
      <figcaption>
        {curvas.map((c) => (
          <span key={c.id} style={{ color: COLORES[c.id] }}>
            ● {c.nombre}
          </span>
        ))}
        <span className="texto-2">- - q = C·E₀</span>
      </figcaption>
    </figure>
  );
}
