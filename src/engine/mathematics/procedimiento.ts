import { EXPRESION_FUENTE_LATEX } from '../electrical/fuentes';
import type { CondicionesIniciales, ParametrosCircuito } from '../electrical/tipos';
import { conSigno, numeroLatex } from '../../utils/formato';
import { clasificarAmortiguamiento, NOMBRES_AMORTIGUAMIENTO } from './clasificacion';
import { calcularParametrosDerivados } from './parametrosDerivados';
import { calcularRaicesCaracteristicas } from './raices';
import { resolverAnaliticamente } from './solucionAnalitica';

/**
 * Genera el procedimiento matemático completo (13 pasos) para una configuración.
 * Cada paso explica qué operación se hizo y por qué, con fórmulas en LaTeX
 * construidas con los valores reales del circuito.
 */
export interface PasoProcedimiento {
  numero: number;
  titulo: string;
  /** Operación concreta que se aplica en este paso. */
  operacion: string;
  explicacion: string;
  /** Por qué es válido o necesario este paso. */
  justificacion: string;
  formulas: string[];
  nota?: string;
}

const DETALLES: Record<string, { operacion: string; justificacion: string }> = {
  'Segunda ley de Kirchhoff': {
    operacion: 'Plantear el balance de voltajes en la malla',
    justificacion: 'La energía por unidad de carga se conserva al recorrer un lazo cerrado.',
  },
  'Caídas de voltaje en cada componente': {
    operacion: 'Escribir la ley constitutiva de cada elemento',
    justificacion: 'Cada componente relaciona voltaje y corriente de forma distinta: proporcional, a través de la derivada o de la carga.',
  },
  'Relación entre corriente y carga': {
    operacion: 'Expresar i y di/dt en términos de q',
    justificacion: 'Así la ecuación queda con una sola incógnita, q(t), que además da el estado del capacitor.',
  },
  'Ecuación diferencial de segundo orden': {
    operacion: 'Sustituir las caídas y la relación i = q′',
    justificacion: 'Obtener una EDO lineal con coeficientes constantes, cuya teoría de solución es completa.',
  },
  Normalización: {
    operacion: 'Dividir toda la ecuación entre L',
    justificacion: 'L > 0, así que dividir no cambia las soluciones; aparecen α y ω₀, los parámetros que gobiernan la dinámica.',
  },
  'Ecuación característica': {
    operacion: 'Proponer q = e^{rt} en la ecuación homogénea',
    justificacion: 'La derivada de una exponencial es proporcional a ella misma, y e^{rt} nunca se anula.',
  },
  'Cálculo de las raíces': {
    operacion: 'Aplicar la fórmula cuadrática',
    justificacion: 'La ecuación característica es un polinomio de grado 2 con coeficientes reales.',
  },
  'Clasificación del amortiguamiento': {
    operacion: 'Comparar ζ con 1 (o R con R crítica)',
    justificacion: 'El signo del discriminante determina si las raíces son complejas, repetidas o reales distintas.',
  },
  'Solución homogénea': {
    operacion: 'Elegir la forma de q_h según el tipo de raíces',
    justificacion: 'Cada tipo de raíz genera un par de soluciones linealmente independientes.',
  },
  'Solución particular': {
    operacion: 'Proponer una solución con la forma de la fuente',
    justificacion: 'Por linealidad, la solución general es la homogénea más una particular cualquiera.',
  },
  'Aplicación de condiciones iniciales': {
    operacion: 'Imponer q(0) y q′(0) para hallar A y B',
    justificacion: 'Dos constantes requieren dos condiciones: el teorema de existencia y unicidad garantiza una única solución.',
  },
  'Solución final': {
    operacion: 'Sustituir las constantes en la solución general',
    justificacion: 'Es la única función que cumple la EDO y las condiciones iniciales.',
  },
  'Interpretación física': {
    operacion: 'Leer la solución en términos de energía y tiempo',
    justificacion: 'La matemática solo es útil si describe lo que el circuito realmente hace.',
  },
};

export function generarProcedimiento(
  parametros: ParametrosCircuito,
  condiciones: CondicionesIniciales,
  toleranciaCritica?: number,
): PasoProcedimiento[] {
  const { inductancia: L, resistencia: R, capacitancia: C, fuente } = parametros;
  const E0 = fuente.amplitud;
  const d = calcularParametrosDerivados(parametros);
  const raices = calcularRaicesCaracteristicas(L, R, C);
  const tipo = clasificarAmortiguamiento(d.relacionAmortiguamiento, toleranciaCritica);
  const solucion = resolverAnaliticamente(parametros, condiciones);
  const n = (valor: number, cifras = 4) => numeroLatex(valor, cifras);
  const RL = R / L;
  const LC = 1 / (L * C);

  const pasos: Omit<PasoProcedimiento, 'numero' | 'operacion' | 'justificacion'>[] = [];

  pasos.push({
    titulo: 'Segunda ley de Kirchhoff',
    explicacion:
      'En una malla cerrada la suma algebraica de las caídas de voltaje es igual al voltaje aplicado. En el circuito RLC en serie la misma corriente atraviesa los tres elementos.',
    formulas: ['E(t) = V_L(t) + V_R(t) + V_C(t)', EXPRESION_FUENTE_LATEX[fuente.tipo]],
  });

  pasos.push({
    titulo: 'Caídas de voltaje en cada componente',
    explicacion:
      'El inductor se opone a los cambios de corriente (ley de Faraday), el resistor sigue la ley de Ohm y el capacitor acumula carga entre sus placas.',
    formulas: [
      'V_L = L\\,\\frac{di}{dt}, \\qquad V_R = R\\,i, \\qquad V_C = \\frac{q}{C}',
      `L = ${n(L)}\\,\\text{H},\\quad R = ${n(R)}\\,\\Omega,\\quad C = ${n(C)}\\,\\text{F},\\quad E_0 = ${n(E0)}\\,\\text{V}`,
    ],
  });

  pasos.push({
    titulo: 'Relación entre corriente y carga',
    explicacion:
      'La corriente es la rapidez con la que cambia la carga del capacitor. Esto permite escribir toda la ecuación en términos de una sola incógnita q(t).',
    formulas: ["i(t) = \\frac{dq}{dt} = q'(t), \\qquad \\frac{di}{dt} = q''(t)"],
  });

  pasos.push({
    titulo: 'Ecuación diferencial de segundo orden',
    explicacion:
      'Sustituyendo las caídas de voltaje y la relación i = q\' en la ley de Kirchhoff obtenemos una EDO lineal de segundo orden con coeficientes constantes.',
    formulas: [
      "L\\,q''(t) + R\\,q'(t) + \\frac{1}{C}\\,q(t) = E(t)",
      `${n(L)}\\,q'' + ${n(R)}\\,q' + ${n(1 / C)}\\,q = E(t)`,
    ],
  });

  pasos.push({
    titulo: 'Normalización',
    explicacion:
      'Se divide entre L para dejar el coeficiente principal igual a 1. Aparecen los parámetros 2α = R/L y ω₀² = 1/(LC), que gobiernan toda la dinámica.',
    formulas: [
      "q'' + \\frac{R}{L}\\,q' + \\frac{1}{LC}\\,q = \\frac{E(t)}{L} \\;\\Longrightarrow\\; q'' + 2\\alpha\\, q' + \\omega_0^2\\, q = \\frac{E(t)}{L}",
      `q'' + ${n(RL)}\\,q' + ${n(LC)}\\,q = \\frac{E(t)}{${n(L)}}`,
      `\\alpha = \\frac{R}{2L} = ${n(d.coeficienteAmortiguamiento)}\\,\\text{s}^{-1}, \\qquad \\omega_0 = \\frac{1}{\\sqrt{LC}} = ${n(d.frecuenciaNatural)}\\,\\text{rad/s}`,
    ],
  });

  pasos.push({
    titulo: 'Ecuación característica',
    explicacion:
      'Para la ecuación homogénea se propone q = e^{rt}. Al sustituir, el factor e^{rt} nunca es cero, por lo que r debe satisfacer un polinomio de segundo grado.',
    formulas: [
      'L\\,r^2 + R\\,r + \\frac{1}{C} = 0 \\;\\Longleftrightarrow\\; r^2 + 2\\alpha r + \\omega_0^2 = 0',
      `${n(L)}\\,r^2 + ${n(R)}\\,r + ${n(1 / C)} = 0`,
    ],
  });

  const disc = raices.discriminante;
  const formulaRaices = [
    'r_{1,2} = \\frac{-R \\pm \\sqrt{R^2 - 4L/C}}{2L} = -\\alpha \\pm \\sqrt{\\alpha^2 - \\omega_0^2}',
    `\\Delta = R^2 - \\frac{4L}{C} = ${n(R * R)} - ${n((4 * L) / C)} = ${n(disc)}`,
  ];
  if (raices.tipo === 'complejas-conjugadas') {
    formulaRaices.push(
      `r_{1,2} = ${n(raices.r1.re)} \\pm ${n(raices.r1.im)}\\,\\mathrm{i} \\quad (\\omega_d = ${n(raices.r1.im)}\\,\\text{rad/s})`,
    );
  } else if (raices.tipo === 'reales-repetidas') {
    formulaRaices.push(`r_1 = r_2 = -\\alpha = ${n(raices.r1.re)}`);
  } else {
    formulaRaices.push(`r_1 = ${n(raices.r1.re)}, \\qquad r_2 = ${n(raices.r2.re)}`);
  }
  pasos.push({
    titulo: 'Cálculo de las raíces',
    explicacion:
      'Se aplica la fórmula cuadrática. El signo del discriminante Δ decide si las raíces son reales distintas, reales repetidas o complejas conjugadas.',
    formulas: formulaRaices,
  });

  pasos.push({
    titulo: 'Clasificación del amortiguamiento',
    explicacion: `Comparamos α con ω₀ (equivalentemente R con la resistencia crítica). Resultado: ${NOMBRES_AMORTIGUAMIENTO[tipo].toLowerCase()}.`,
    formulas: [
      `\\zeta = \\frac{\\alpha}{\\omega_0} = \\frac{${n(d.coeficienteAmortiguamiento)}}{${n(d.frecuenciaNatural)}} = ${n(d.relacionAmortiguamiento)}`,
      `R_{\\text{crítica}} = 2\\sqrt{\\frac{L}{C}} = ${n(d.resistenciaCritica)}\\,\\Omega`,
      tipo === 'subamortiguado'
        ? `\\zeta < 1 \\;\\Rightarrow\\; R = ${n(R)} < ${n(d.resistenciaCritica)}\\;\\Rightarrow\\; \\text{subamortiguado}`
        : tipo === 'critico'
          ? `\\zeta \\approx 1 \\;\\Rightarrow\\; R \\approx R_{\\text{crítica}}\\;\\Rightarrow\\; \\text{críticamente amortiguado}`
          : `\\zeta > 1 \\;\\Rightarrow\\; R = ${n(R)} > ${n(d.resistenciaCritica)}\\;\\Rightarrow\\; \\text{sobreamortiguado}`,
    ],
    nota:
      tipo === 'critico' && raices.tipo !== 'reales-repetidas'
        ? 'ζ está dentro de la tolerancia de clasificación, aunque numéricamente Δ no es exactamente cero; la solución usa la forma exacta correspondiente al signo de Δ.'
        : undefined,
  });

  const homogenea =
    raices.tipo === 'complejas-conjugadas'
      ? 'q_h(t) = e^{-\\alpha t}\\left(A\\cos\\omega_d t + B\\sin\\omega_d t\\right)'
      : raices.tipo === 'reales-repetidas'
        ? 'q_h(t) = (A + B\\,t)\\,e^{-\\alpha t}'
        : 'q_h(t) = A\\,e^{r_1 t} + B\\,e^{r_2 t}';
  pasos.push({
    titulo: 'Solución homogénea',
    explicacion:
      'La forma de la solución homogénea depende del tipo de raíces. Describe la respuesta natural (transitoria) del circuito, que decae porque Re(r) < 0.',
    formulas: [homogenea],
  });

  if (fuente.tipo === 'constante' && solucion) {
    pasos.push({
      titulo: 'Solución particular',
      explicacion:
        'Con fuente constante se propone q_p = K. Sus derivadas son cero, así que K/C = E₀. Físicamente: en régimen permanente el capacitor queda cargado a C·E₀ y la corriente se anula.',
      formulas: [`q_p = C\\,E_0 = ${n(C)} \\cdot ${n(E0)} = ${n(solucion.cargaParticular)}\\,\\text{C}`],
    });

    const { A, B } = solucion.constantes;
    const ecuacionesCI =
      raices.tipo === 'complejas-conjugadas'
        ? ["q(0) = C E_0 + A = q_0 \\Rightarrow A = q_0 - C E_0", "q'(0) = -\\alpha A + \\omega_d B = i_0 \\Rightarrow B = \\frac{i_0 + \\alpha A}{\\omega_d}"]
        : raices.tipo === 'reales-repetidas'
          ? ["q(0) = C E_0 + A = q_0 \\Rightarrow A = q_0 - C E_0", "q'(0) = B - \\alpha A = i_0 \\Rightarrow B = i_0 + \\alpha A"]
          : ["A + B = q_0 - C E_0", "r_1 A + r_2 B = i_0 \\Rightarrow A = \\frac{i_0 - r_2 (q_0 - C E_0)}{r_1 - r_2}"];
    pasos.push({
      titulo: 'Aplicación de condiciones iniciales',
      explicacion:
        'La solución general es q = q_p + q_h. Las dos constantes se obtienen imponiendo la carga y la corriente iniciales.',
      formulas: [
        `q(0) = ${n(condiciones.cargaInicial)}\\,\\text{C}, \\qquad i(0) = ${n(condiciones.corrienteInicial)}\\,\\text{A}`,
        ...ecuacionesCI,
        `A = ${n(A)}, \\qquad B = ${n(B)}`,
      ],
    });

    let final: string[];
    if (solucion.forma.tipo === 'complejas-conjugadas') {
      const { alfa, omegaD } = solucion.forma;
      final = [
        `q(t) = ${n(solucion.cargaParticular)} + e^{-${n(alfa)}t}\\left(${n(A)}\\cos(${n(omegaD)}t)${conSigno(B)}\\sin(${n(omegaD)}t)\\right)`,
        'i(t) = C E_0 \\frac{\\omega_0^2}{\\omega_d} e^{-\\alpha t}\\sin(\\omega_d t) \\quad (\\text{si } q_0 = i_0 = 0)',
      ];
    } else if (solucion.forma.tipo === 'reales-repetidas') {
      const { alfa } = solucion.forma;
      final = [
        `q(t) = ${n(solucion.cargaParticular)} + \\left(${n(A)}${conSigno(B)}\\,t\\right)e^{-${n(alfa)}t}`,
        'i(t) = C E_0\\, \\alpha^2\\, t\\, e^{-\\alpha t} \\quad (\\text{si } q_0 = i_0 = 0)',
      ];
    } else {
      const { r1, r2 } = solucion.forma;
      final = [
        `q(t) = ${n(solucion.cargaParticular)}${conSigno(A)}\\,e^{${n(r1)}t}${conSigno(B)}\\,e^{${n(r2)}t}`,
        'i(t) = A r_1 e^{r_1 t} + B r_2 e^{r_2 t}',
      ];
    }
    pasos.push({
      titulo: 'Solución final',
      explicacion: 'Sustituyendo las constantes se obtiene la carga para todo t ≥ 0; derivando, la corriente.',
      formulas: final,
    });
  } else {
    pasos.push({
      titulo: 'Solución particular',
      explicacion:
        'Con una fuente variable la solución particular depende de la forma de E(t). ELECTROLAB 3D resuelve este caso con el método numérico RK4 sobre el sistema de primer orden equivalente.',
      formulas: ["x_1 = q,\\quad x_2 = i", "x_1' = x_2, \\qquad x_2' = \\frac{E(t) - R\\,x_2 - x_1/C}{L}"],
    });
    pasos.push({
      titulo: 'Aplicación de condiciones iniciales',
      explicacion: 'RK4 parte del estado inicial (q₀, i₀) y avanza con pasos h, combinando cuatro pendientes por paso.',
      formulas: [
        `x_1(0) = ${n(condiciones.cargaInicial)}, \\qquad x_2(0) = ${n(condiciones.corrienteInicial)}`,
        '\\mathbf{x}_{n+1} = \\mathbf{x}_n + \\frac{h}{6}(\\mathbf{k}_1 + 2\\mathbf{k}_2 + 2\\mathbf{k}_3 + \\mathbf{k}_4)',
      ],
    });
    pasos.push({
      titulo: 'Solución final',
      explicacion:
        'La solución es la suma de la respuesta natural (homogénea, que se extingue) y la respuesta forzada impuesta por la fuente. Se visualiza en el observatorio de gráficas.',
      formulas: ['q(t) = q_h(t) + q_p(t) \\approx \\text{RK4}'],
    });
  }

  const interpretacion =
    tipo === 'subamortiguado'
      ? `La energía oscila entre el campo magnético del inductor y el campo eléctrico del capacitor con frecuencia ω_d ≈ ${n(d.frecuenciaAmortiguada ?? 0)} rad/s, mientras R la disipa en calor. La envolvente decae como e^{-αt}.`
      : tipo === 'critico'
        ? 'El circuito alcanza el equilibrio en el menor tiempo posible sin sobrepasarlo: es el punto de diseño típico de sistemas que deben responder rápido sin oscilar.'
        : 'La resistencia disipa la energía tan rápido que no hay oscilación: la carga se aproxima lentamente al equilibrio, dominada por la raíz más cercana a cero.';
  pasos.push({
    titulo: 'Interpretación física',
    explicacion: interpretacion,
    formulas: [
      `\\tau_{\\text{dominante}} = ${n(d.constanteTiempoDominante)}\\,\\text{s}, \\qquad Q = \\frac{1}{2\\zeta} = ${n(d.factorCalidad)}`,
      '\\lim_{t\\to\\infty} q(t) = C E_0, \\qquad \\lim_{t\\to\\infty} i(t) = 0 \\quad (\\text{fuente constante})',
    ],
  });

  return pasos.map((paso, indice) => ({ ...paso, ...DETALLES[paso.titulo], numero: indice + 1 }));
}
