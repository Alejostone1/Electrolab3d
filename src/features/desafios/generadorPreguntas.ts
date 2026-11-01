import {
  calcularParametrosDerivados,
  clasificarAmortiguamiento,
  FUENTE_POR_DEFECTO,
  NOMBRES_AMORTIGUAMIENTO,
  simularCircuito,
  type ParametrosCircuito,
  type ResultadoSimulacion,
  type TipoAmortiguamiento,
} from '@/engine';
import { aPrecision } from '@/utils/formato';

export type TipoPregunta = 'seleccion' | 'grafica' | 'configuracion';

export interface Pregunta {
  id: string;
  tipo: TipoPregunta;
  categoria: string;
  enunciado: string;
  /** Fórmula opcional (LaTeX) que acompaña al enunciado. */
  formula?: string;
  opciones: string[];
  correcta: number;
  explicacion: string;
  /** Para preguntas de gráfica: resultado a dibujar. */
  resultado?: ResultadoSimulacion;
  /** Para retos de configuración: parámetros base y verificación. */
  reto?: { base: ParametrosCircuito; objetivo: TipoAmortiguamiento };
}

const aleatorio = (minimo: number, maximo: number, decimales = 0) => Number((minimo + Math.random() * (maximo - minimo)).toFixed(decimales));
const elegir = <T,>(lista: T[]) => lista[Math.floor(Math.random() * lista.length)];

function mezclar(opciones: string[], correcta: string): { opciones: string[]; correcta: number } {
  const unicas = Array.from(new Set(opciones));
  const mezcladas = unicas.sort(() => Math.random() - 0.5);
  return { opciones: mezcladas, correcta: mezcladas.indexOf(correcta) };
}

export function circuitoAleatorio(): ParametrosCircuito {
  const inductancia = elegir([0.1, 0.2, 0.25, 0.5, 1, 1.5, 2]);
  const capacitancia = elegir([100, 200, 470, 1000, 2200, 4700]) * 1e-6;
  const rc = 2 * Math.sqrt(inductancia / capacitancia);
  // Se eligen valores lejos de la frontera para que la pregunta sea justa.
  const tipo = elegir<TipoAmortiguamiento>(['subamortiguado', 'subamortiguado', 'sobreamortiguado', 'critico']);
  let resistencia = tipo === 'subamortiguado' ? rc * aleatorio(0.1, 0.6, 2) : tipo === 'critico' ? rc : rc * aleatorio(1.5, 2.5, 2);
  resistencia = Math.min(100, Math.max(1, Number(resistencia.toFixed(2))));
  return { inductancia, resistencia, capacitancia, fuente: { ...FUENTE_POR_DEFECTO, amplitud: elegir([5, 9, 12, 24]) } };
}

function describir(p: ParametrosCircuito) {
  return `L = ${p.inductancia} H, R = ${p.resistencia} Ω, C = ${aPrecision(p.capacitancia * 1e6, 4)} µF`;
}

const NOMBRES = Object.values(NOMBRES_AMORTIGUAMIENTO);

function preguntaIdentificar(): Pregunta {
  const p = circuitoAleatorio();
  const d = calcularParametrosDerivados(p);
  const tipo = clasificarAmortiguamiento(d.relacionAmortiguamiento, 0.01);
  const correcta = NOMBRES_AMORTIGUAMIENTO[tipo];
  return {
    id: crypto.randomUUID?.() ?? String(Math.random()),
    tipo: 'seleccion',
    categoria: 'Identificación de amortiguamiento',
    enunciado: `Un circuito RLC en serie tiene ${describir(p)}. ¿Qué tipo de respuesta presenta?`,
    opciones: NOMBRES,
    correcta: NOMBRES.indexOf(correcta),
    explicacion: `R crítica = 2√(L/C) = ${aPrecision(d.resistenciaCritica, 4)} Ω y ζ = α/ω₀ = ${aPrecision(d.relacionAmortiguamiento, 3)}. Como ${
      tipo === 'subamortiguado' ? 'R < R crítica (ζ < 1)' : tipo === 'critico' ? 'R = R crítica (ζ = 1)' : 'R > R crítica (ζ > 1)'
    }, el sistema es ${correcta.toLowerCase()}.`,
  };
}

function preguntaResistenciaCritica(): Pregunta {
  const p = circuitoAleatorio();
  const rc = 2 * Math.sqrt(p.inductancia / p.capacitancia);
  const correcta = `${aPrecision(rc, 4)} Ω`;
  const { opciones, correcta: indice } = mezclar(
    [correcta, `${aPrecision(Math.sqrt(p.inductancia / p.capacitancia), 4)} Ω`, `${aPrecision(2 * Math.sqrt(p.capacitancia / p.inductancia), 4)} Ω`, `${aPrecision(4 * p.inductancia / p.capacitancia / 1000, 4)} Ω`],
    correcta,
  );
  return {
    id: String(Math.random()),
    tipo: 'seleccion',
    categoria: 'Cálculo de resistencia crítica',
    enunciado: `Calcula la resistencia crítica para L = ${p.inductancia} H y C = ${aPrecision(p.capacitancia * 1e6, 4)} µF.`,
    formula: 'R_{\\text{crítica}} = ?',
    opciones,
    correcta: indice,
    explicacion: `El discriminante R² − 4L/C se anula cuando R = 2√(L/C) = 2√(${p.inductancia}/${p.capacitancia}) = ${correcta}.`,
  };
}

function preguntaFrecuencia(): Pregunta {
  const p = circuitoAleatorio();
  const w0 = 1 / Math.sqrt(p.inductancia * p.capacitancia);
  const correcta = `${aPrecision(w0, 4)} rad/s`;
  const { opciones, correcta: indice } = mezclar(
    [correcta, `${aPrecision(w0 / (2 * Math.PI), 4)} rad/s`, `${aPrecision(1 / (p.inductancia * p.capacitancia), 4)} rad/s`, `${aPrecision(Math.sqrt(p.inductancia / p.capacitancia), 4)} rad/s`],
    correcta,
  );
  return {
    id: String(Math.random()),
    tipo: 'seleccion',
    categoria: 'Ejercicio matemático',
    enunciado: `¿Cuál es la frecuencia natural ω₀ del circuito con L = ${p.inductancia} H y C = ${aPrecision(p.capacitancia * 1e6, 4)} µF?`,
    formula: '\\omega_0 = \\frac{1}{\\sqrt{LC}}',
    opciones,
    correcta: indice,
    explicacion: `ω₀ = 1/√(LC) = 1/√(${p.inductancia}·${p.capacitancia}) = ${correcta}. (Dividir entre 2π daría la frecuencia en Hz, no en rad/s.)`,
  };
}

function preguntaGrafica(): Pregunta {
  const p = circuitoAleatorio();
  const resultado = simularCircuito(p);
  const tipo = clasificarAmortiguamiento(resultado.derivados.relacionAmortiguamiento, 0.01);
  return {
    id: String(Math.random()),
    tipo: 'grafica',
    categoria: 'Interpretación de gráficas',
    enunciado: 'Observa la carga q(t) (cian) y la corriente i(t) (naranja) calculadas por el motor. ¿Qué tipo de respuesta representan?',
    opciones: NOMBRES,
    correcta: NOMBRES.indexOf(NOMBRES_AMORTIGUAMIENTO[tipo]),
    resultado,
    explicacion:
      tipo === 'subamortiguado'
        ? 'La carga sobrepasa C·E₀ y oscila, y la corriente cambia de signo: raíces complejas conjugadas.'
        : tipo === 'critico'
          ? 'La carga llega a C·E₀ rápidamente sin sobrepasarla y la corriente nunca cambia de signo: raíz doble.'
          : 'La carga se aproxima lentamente a C·E₀ sin oscilar: raíces reales distintas, dominadas por la más lenta.',
  };
}

const CONCEPTUALES: Array<Omit<Pregunta, 'id' | 'tipo'>> = [
  {
    categoria: 'Predicción del comportamiento',
    enunciado: 'Un circuito subamortiguado oscila. Si se duplica R (sin llegar a R crítica), ¿qué ocurre?',
    opciones: ['Las oscilaciones decaen más rápido', 'La frecuencia natural ω₀ se duplica', 'La carga final se duplica', 'Las oscilaciones crecen'],
    correcta: 0,
    explicacion: 'α = R/2L se duplica, así que la envolvente e^{−αt} decae más rápido. ω₀ y la carga final C·E₀ no dependen de R.',
  },
  {
    categoria: 'Predicción del comportamiento',
    enunciado: 'Con fuente constante, ¿cuál es la corriente cuando t → ∞?',
    opciones: ['Cero', 'E₀/R', 'E₀·C', 'Oscila indefinidamente'],
    correcta: 0,
    explicacion: 'En régimen permanente el capacitor queda cargado a C·E₀ y bloquea la corriente continua: i(∞) = 0.',
  },
  {
    categoria: 'Ejercicio matemático',
    enunciado: '¿Qué sustitución convierte la EDO de segundo orden en un sistema de primer orden para aplicar RK4?',
    formula: "Lq'' + Rq' + q/C = E(t)",
    opciones: ["x₁ = q, x₂ = q'", "x₁ = q', x₂ = q''", 'x₁ = L, x₂ = C', 'x₁ = e^{rt}, x₂ = r'],
    correcta: 0,
    explicacion: "Con x₁ = q y x₂ = i = q' se obtiene x₁' = x₂ y x₂' = [E(t) − R x₂ − x₁/C]/L.",
  },
  {
    categoria: 'Ejercicio matemático',
    enunciado: 'Si el discriminante R² − 4L/C es negativo, las raíces de la ecuación característica son:',
    opciones: ['Complejas conjugadas', 'Reales y distintas', 'Reales repetidas', 'Imaginarias puras siempre'],
    correcta: 0,
    explicacion: 'Δ < 0 ⇒ r = −α ± iω_d. Solo serían imaginarias puras si R = 0 (α = 0).',
  },
  {
    categoria: 'Predicción del comportamiento',
    enunciado: '¿Qué configuración alcanza el equilibrio más rápido sin sobrepasarlo?',
    opciones: ['Críticamente amortiguada', 'Sobreamortiguada', 'Subamortiguada', 'Todas tardan lo mismo'],
    correcta: 0,
    explicacion: 'El amortiguamiento crítico es la frontera: el menor tiempo de estabilización posible sin oscilar.',
  },
];

function preguntaConceptual(): Pregunta {
  const base = elegir(CONCEPTUALES);
  const correctaTexto = base.opciones[base.correcta];
  const { opciones, correcta } = mezclar([...base.opciones], correctaTexto);
  return { ...base, id: String(Math.random()), tipo: 'seleccion', opciones, correcta };
}

function retoConfiguracion(): Pregunta {
  const base = { ...circuitoAleatorio(), resistencia: 5 };
  // Solo se proponen circuitos cuya R crítica cae dentro del rango del slider (1–100 Ω).
  const rc = 2 * Math.sqrt(base.inductancia / base.capacitancia);
  const ajustado = rc > 100 ? { ...base, capacitancia: 1000e-6, inductancia: 0.5 } : base;
  return {
    id: String(Math.random()),
    tipo: 'configuracion',
    categoria: 'Reto de configuración',
    enunciado: `Con L = ${ajustado.inductancia} H y C = ${aPrecision(ajustado.capacitancia * 1e6, 4)} µF, ajusta R para que el circuito quede críticamente amortiguado (tolerancia ±2 %).`,
    opciones: [],
    correcta: -1,
    reto: { base: ajustado, objetivo: 'critico' },
    explicacion: `R crítica = 2√(L/C) = ${aPrecision(2 * Math.sqrt(ajustado.inductancia / ajustado.capacitancia), 4)} Ω.`,
  };
}

export function generarCuestionario(cantidad = 8): Pregunta[] {
  const generadores = [preguntaIdentificar, preguntaResistenciaCritica, preguntaFrecuencia, preguntaGrafica, preguntaConceptual, retoConfiguracion, preguntaGrafica, preguntaConceptual];
  return Array.from({ length: cantidad }, (_, k) => generadores[k % generadores.length]());
}
