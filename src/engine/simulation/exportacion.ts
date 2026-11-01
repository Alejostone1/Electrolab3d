import type { ResultadoSimulacion } from './simulador';

/** Genera un CSV con la serie temporal completa (y la analítica si existe). */
export function generarCSV(resultado: ResultadoSimulacion): string {
  const { serie, analitica, parametros } = resultado;
  const encabezado = [
    't_s',
    'E_V',
    'q_C',
    'i_A',
    'vL_V',
    'vR_V',
    'vC_V',
    'PR_W',
    'EL_J',
    'EC_J',
    'Edisipada_J',
    ...(analitica ? ['q_analitica_C', 'i_analitica_A'] : []),
  ];
  const lineas = [
    `# ELECTROLAB 3D - L=${parametros.inductancia} H; R=${parametros.resistencia} ohm; C=${parametros.capacitancia} F; ` +
      `fuente=${parametros.fuente.tipo}; E0=${parametros.fuente.amplitud} V; clasificacion=${resultado.clasificacion}`,
    encabezado.join(','),
  ];
  for (let k = 0; k < serie.t.length; k++) {
    const fila = [
      serie.t[k],
      serie.E[k],
      serie.q[k],
      serie.i[k],
      serie.vL[k],
      serie.vR[k],
      serie.vC[k],
      serie.potenciaR[k],
      serie.energiaL[k],
      serie.energiaC[k],
      serie.energiaDisipada[k],
      ...(analitica ? [analitica.q[k], analitica.i[k]] : []),
    ];
    lineas.push(fila.map((valor) => valor.toExponential(8)).join(','));
  }
  return lineas.join('\n');
}
