import Plotly from 'plotly.js-dist-min';
import createPlotlyComponent from 'react-plotly.js/factory';
import { memo, useMemo } from 'react';
import type { Data, Layout } from 'plotly.js';
import { usePreferencias } from '@/store/usePreferencias';

const Plot = createPlotlyComponent(Plotly);

export interface Serie {
  nombre: string;
  x: number[];
  y: number[];
  color: string;
  discontinua?: boolean;
  visible?: boolean;
  grosor?: number;
}

const TEMAS = {
  dark: { texto: '#cbd5e1', rejilla: 'rgba(148,163,184,0.12)', eje: 'rgba(148,163,184,0.3)', fondoHover: '#101d30' },
  light: { texto: '#334155', rejilla: 'rgba(15,23,42,0.08)', eje: 'rgba(15,23,42,0.25)', fondoHover: '#ffffff' },
};

/** Reduce el número de puntos para graficar con fluidez sin alterar la forma de la curva. */
export function diezmar<T>(valores: T[], maximo = 1500): T[] {
  if (valores.length <= maximo) return valores;
  const paso = Math.ceil(valores.length / maximo);
  const resultado: T[] = [];
  for (let k = 0; k < valores.length; k += paso) resultado.push(valores[k]);
  if (resultado[resultado.length - 1] !== valores[valores.length - 1]) resultado.push(valores[valores.length - 1]);
  return resultado;
}

interface PropiedadesGrafica {
  titulo: string;
  series: Serie[];
  ejeX: string;
  ejeY: string;
  cursor?: number | null;
  alto?: number;
}

/** Gráfica Plotly con estilo del sistema de diseño (temas claro/oscuro). */
export const GraficaCientifica = memo(function GraficaCientifica({ titulo, series, ejeX, ejeY, cursor = null, alto = 320 }: PropiedadesGrafica) {
  const tema = usePreferencias((s) => s.tema);
  const colores = TEMAS[tema];

  const datos = useMemo<Data[]>(
    () =>
      series.map((s) => ({
        type: 'scatter',
        mode: 'lines',
        name: s.nombre,
        x: diezmar(s.x),
        y: diezmar(s.y),
        line: { color: s.color, width: s.grosor ?? 2, dash: s.discontinua ? 'dash' : 'solid' },
        visible: s.visible === false ? 'legendonly' : true,
        hovertemplate: '%{y:.4g}<extra>' + s.nombre + '</extra>',
      })),
    [series],
  );

  const disposicion = useMemo<Partial<Layout>>(
    () => ({
      title: { text: titulo, font: { size: 14, color: colores.texto, family: 'Sora, sans-serif' }, x: 0.02, xanchor: 'left' },
      autosize: true,
      height: alto,
      margin: { l: 58, r: 14, t: 42, b: 46 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { family: 'Inter, sans-serif', size: 11, color: colores.texto },
      hovermode: 'x unified',
      hoverlabel: { bgcolor: colores.fondoHover, font: { family: 'JetBrains Mono, monospace', size: 11 } },
      legend: { orientation: 'h', y: -0.22, x: 0, font: { size: 11 } },
      xaxis: { title: { text: ejeX }, gridcolor: colores.rejilla, zerolinecolor: colores.eje, linecolor: colores.eje, exponentformat: 'SI' },
      yaxis: { title: { text: ejeY }, gridcolor: colores.rejilla, zerolinecolor: colores.eje, linecolor: colores.eje, exponentformat: 'SI' },
      shapes:
        cursor === null
          ? []
          : [{ type: 'line', x0: cursor, x1: cursor, yref: 'paper', y0: 0, y1: 1, line: { color: '#f59e0b', width: 1.5, dash: 'dot' } }],
    }),
    [titulo, colores, ejeX, ejeY, cursor, alto],
  );

  return (
    <div className="grafica">
      <Plot
        data={datos}
        layout={disposicion}
        config={{ responsive: true, displaylogo: false, modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'], toImageButtonOptions: { filename: 'electrolab-grafica' } }}
        style={{ width: '100%' }}
        useResizeHandler
      />
    </div>
  );
});
