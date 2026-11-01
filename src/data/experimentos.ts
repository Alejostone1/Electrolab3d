import type { TipoFuente } from '@/engine';

export type VariableBarrido = 'resistencia' | 'capacitancia' | 'inductancia' | 'amortiguamiento' | 'fuente';

export interface ExperimentoGuiado {
  id: string;
  numero: number;
  titulo: string;
  objetivo: string;
  variable: VariableBarrido;
  /** Valores del barrido en unidades de interfaz (Ω, µF, H) o tipos de fuente. */
  valores: number[] | TipoFuente[];
  unidad: string;
  pasos: string[];
  preguntas: string[];
  conclusion: string;
}

export const EXPERIMENTOS: ExperimentoGuiado[] = [
  {
    id: 'resistencia',
    numero: 1,
    titulo: 'Influencia de la resistencia',
    objetivo: 'Analizar cómo R modifica el coeficiente de amortiguamiento α = R/2L y el tipo de respuesta.',
    variable: 'resistencia',
    valores: [5, 15, 30, 44.72, 80],
    unidad: 'Ω',
    pasos: [
      'Mantén L = 0.5 H, C = 1000 µF y E₀ = 12 V.',
      'Observa las curvas de carga para cada valor de R.',
      'Compara ζ, el sobrepaso y el tiempo de estabilización en la tabla.',
      'Agrega un valor propio de R y localiza la frontera crítica.',
    ],
    preguntas: ['¿Qué ocurre con el sobrepaso cuando R aumenta?', '¿Para qué valor de R desaparece la oscilación?', '¿Cambia la carga final C·E₀?'],
    conclusion: 'Al aumentar R crece α: las oscilaciones se amortiguan más rápido hasta desaparecer cuando R ≥ 2√(L/C) ≈ 44.72 Ω. La carga final no depende de R.',
  },
  {
    id: 'capacitancia',
    numero: 2,
    titulo: 'Influencia de la capacitancia',
    objetivo: 'Observar cómo C cambia la frecuencia natural ω₀ = 1/√(LC) y la carga final.',
    variable: 'capacitancia',
    valores: [200, 500, 1000, 2500, 5000],
    unidad: 'µF',
    pasos: ['Mantén L = 0.5 H, R = 10 Ω y E₀ = 12 V.', 'Compara el periodo de oscilación de cada curva.', 'Fíjate en el nivel final de carga de cada una.'],
    preguntas: ['¿La frecuencia aumenta o disminuye con C?', '¿Por qué la carga final es distinta en cada caso?', '¿Cómo cambia R crítica con C?'],
    conclusion: 'Mayor C ⇒ menor ω₀ (oscilaciones más lentas), mayor carga final C·E₀ y menor R crítica = 2√(L/C).',
  },
  {
    id: 'inductancia',
    numero: 3,
    titulo: 'Influencia de la inductancia',
    objetivo: 'Analizar cómo L afecta a la vez la frecuencia natural y el amortiguamiento.',
    variable: 'inductancia',
    valores: [0.1, 0.25, 0.5, 1, 2],
    unidad: 'H',
    pasos: ['Mantén R = 10 Ω, C = 1000 µF y E₀ = 12 V.', 'Observa la corriente: el inductor se opone a sus cambios.', 'Compara α y ω₀ en la tabla.'],
    preguntas: ['¿Por qué L reduce tanto α como ω₀?', '¿Qué valor de L produce más oscilaciones visibles?', '¿Qué pasa con el pico de corriente?'],
    conclusion: 'L aparece en α = R/2L y en ω₀ = 1/√(LC): más inductancia hace la respuesta más lenta, con menos amortiguamiento y picos de corriente menores.',
  },
  {
    id: 'amortiguamiento',
    numero: 4,
    titulo: 'Comparación de amortiguamiento',
    objetivo: 'Comparar las tres respuestas con L, C y E₀ fijos y condiciones iniciales nulas.',
    variable: 'amortiguamiento',
    valores: [10, 44.72, 80],
    unidad: 'Ω',
    pasos: ['Usa los presets del enunciado (R = 10, 44.72 y 80 Ω).', 'Identifica cuál oscila, cuál llega primero sin oscilar y cuál es más lento.', 'Contrasta con las raíces en el centro matemático.'],
    preguntas: ['¿Cuál se estabiliza primero?', '¿Cuál tiene la mayor corriente máxima?', '¿Qué tipo de raíces corresponde a cada curva?'],
    conclusion: 'El crítico se estabiliza primero sin sobrepaso; el subamortiguado oscila (raíces complejas) y el sobreamortiguado es lento (raíces reales distintas).',
  },
  {
    id: 'fuente',
    numero: 5,
    titulo: 'Variaciones de la fuente',
    objetivo: 'Explorar la respuesta del mismo circuito ante señales constante, pulso, sinusoidal y cuadrada.',
    variable: 'fuente',
    valores: ['constante', 'pulso', 'sinusoidal', 'cuadrada'],
    unidad: '',
    pasos: [
      'Usa el circuito del laboratorio (L, R, C actuales).',
      'Compara la carga con cada tipo de fuente.',
      'Prueba una sinusoide cerca de f₀ en el laboratorio para ver resonancia.',
    ],
    preguntas: ['¿Qué parte de la respuesta es transitoria y cuál forzada?', '¿Qué ocurre con la carga cuando termina el pulso?', '¿Por qué la sinusoidal no se estabiliza en un valor fijo?'],
    conclusion: 'La respuesta total = natural (decae con e^{−αt}) + forzada (sigue a la fuente). Las fuentes variables se resuelven con RK4.',
  },
];
