/**
 * Diccionario de símbolos matemáticos y eléctricos de ELECTROLAB 3D.
 * Alimenta las explicaciones contextuales que aparecen al tocar o pasar el
 * cursor sobre una variable dentro de cualquier fórmula KaTeX.
 * Solo se indica unidad cuando la magnitud la tiene de forma inequívoca.
 */
export interface DefinicionSimbolo {
  simbolo: string;
  nombre: string;
  unidad?: string;
  descripcion: string[];
}

export const SIMBOLOS: Record<string, DefinicionSimbolo> = {
  L: {
    simbolo: 'L',
    nombre: 'Inductancia',
    unidad: 'henrio (H)',
    descripcion: [
      'Propiedad de la bobina de oponerse a los cambios de corriente (ley de Faraday-Lenz).',
      'Almacena energía en el campo magnético: energía ½ L i².',
      'Actúa como la "masa" del sistema: aparece multiplicando a q″.',
    ],
  },
  R: {
    simbolo: 'R',
    nombre: 'Resistencia',
    unidad: 'ohmio (Ω)',
    descripcion: [
      'Oposición al paso de la corriente; disipa energía en forma de calor (P = R i²).',
      'Es la responsable del amortiguamiento: α = R / 2L.',
    ],
  },
  Rc: {
    simbolo: 'R_c',
    nombre: 'Resistencia crítica',
    unidad: 'ohmio (Ω)',
    descripcion: ['Vale 2√(L/C). Es el valor de R que anula el discriminante.', 'Separa la respuesta oscilatoria (R < R crítica) de la no oscilatoria (R > R crítica).'],
  },
  C: {
    simbolo: 'C',
    nombre: 'Capacitancia',
    unidad: 'faradio (F)',
    descripcion: ['Capacidad del capacitor para almacenar carga por cada voltio aplicado: C = q / V.', 'Su inverso 1/C actúa como la "constante del resorte" del sistema.'],
  },
  q: {
    simbolo: 'q(t)',
    nombre: 'Carga eléctrica',
    unidad: 'culombio (C)',
    descripcion: ['Carga almacenada en el capacitor en el instante t. Es la incógnita de la EDO.', 'Su primera derivada es la corriente: q′(t) = i(t).'],
  },
  q0: { simbolo: 'q₀', nombre: 'Carga inicial', unidad: 'culombio (C)', descripcion: ['Valor de q en t = 0. En ELECTROLAB 3D el capacitor parte descargado: q₀ = 0.'] },
  qp: { simbolo: 'q_p', nombre: 'Solución particular', unidad: 'culombio (C)', descripcion: ['Parte de la solución impuesta por la fuente.', 'Con fuente constante: q_p = C·E₀ (régimen permanente).'] },
  qh: { simbolo: 'q_h', nombre: 'Solución homogénea', unidad: 'culombio (C)', descripcion: ['Respuesta natural del circuito sin fuente. Decae con el tiempo: es el transitorio.'] },
  i: {
    simbolo: 'i(t)',
    nombre: 'Corriente eléctrica',
    unidad: 'amperio (A)',
    descripcion: ['Rapidez con la que fluye la carga: i = dq/dt.', 'Es la misma en los tres componentes porque están en serie.'],
  },
  i0: { simbolo: 'i₀', nombre: 'Corriente inicial', unidad: 'amperio (A)', descripcion: ['Valor de i en t = 0. Al cerrar el interruptor la corriente parte de cero: i₀ = 0.'] },
  E: {
    simbolo: 'E(t)',
    nombre: 'Voltaje de la fuente',
    unidad: 'voltio (V)',
    descripcion: ['Fuerza electromotriz aplicada al circuito.', 'Es el término independiente (la "excitación") de la ecuación diferencial.'],
  },
  E0: { simbolo: 'E₀', nombre: 'Amplitud de la fuente', unidad: 'voltio (V)', descripcion: ['Valor constante del voltaje aplicado (o amplitud de la señal).'] },
  EL: { simbolo: 'E_L', nombre: 'Energía magnética', unidad: 'julio (J)', descripcion: ['Energía almacenada en el inductor: energía ½ L i².'] },
  EC: { simbolo: 'E_C', nombre: 'Energía eléctrica', unidad: 'julio (J)', descripcion: ['Energía almacenada en el capacitor: energía q² / 2C.'] },
  VL: { simbolo: 'V_L', nombre: 'Voltaje en el inductor', unidad: 'voltio (V)', descripcion: ['Vale L di/dt. Se opone a los cambios de la corriente.'] },
  VR: { simbolo: 'V_R', nombre: 'Voltaje en el resistor', unidad: 'voltio (V)', descripcion: ['Vale R i (ley de Ohm).'] },
  VC: { simbolo: 'V_C', nombre: 'Voltaje en el capacitor', unidad: 'voltio (V)', descripcion: ['Vale q / C.'] },
  V: { simbolo: 'V', nombre: 'Voltaje', unidad: 'voltio (V)', descripcion: ['Diferencia de potencial entre dos puntos del circuito.'] },
  P: { simbolo: 'P', nombre: 'Potencia', unidad: 'vatio (W)', descripcion: ['Energía por unidad de tiempo. En el resistor: P = R i².'] },
  t: { simbolo: 't', nombre: 'Tiempo', unidad: 'segundo (s)', descripcion: ['Variable independiente. t = 0 es el instante en que se cierra el interruptor.'] },
  tp: { simbolo: 't_p', nombre: 'Duración del pulso', unidad: 'segundo (s)', descripcion: ['Tiempo durante el cual la fuente de pulso entrega E₀.'] },
  'α': {
    simbolo: 'α',
    nombre: 'Coeficiente de amortiguamiento',
    unidad: 's⁻¹',
    descripcion: ['α = R / 2L. Rapidez con la que decae la envolvente e^(−αt).', 'Es la parte real (cambiada de signo) de las raíces complejas.'],
  },
  'ω': { simbolo: 'ω', nombre: 'Frecuencia angular', unidad: 'rad/s', descripcion: ['Rapidez de giro de una oscilación: ω = 2πf.'] },
  'ω0': {
    simbolo: 'ω₀',
    nombre: 'Frecuencia natural',
    unidad: 'rad/s',
    descripcion: ['ω₀ = 1/√(LC). Frecuencia a la que oscilaría el circuito sin resistencia.', 'También es la frecuencia de resonancia.'],
  },
  'ωd': {
    simbolo: 'ω_d',
    nombre: 'Frecuencia amortiguada',
    unidad: 'rad/s',
    descripcion: ['ωd = √(ω₀² − α²). Frecuencia real de la oscilación cuando ζ < 1.', 'Siempre es menor que ω₀.'],
  },
  'ζ': {
    simbolo: 'ζ',
    nombre: 'Relación de amortiguamiento',
    descripcion: ['ζ = α/ω₀ (adimensional).', 'ζ < 1 subamortiguado · ζ = 1 crítico · ζ > 1 sobreamortiguado.'],
  },
  'τ': { simbolo: 'τ', nombre: 'Constante de tiempo', unidad: 'segundo (s)', descripcion: ['Tiempo en que la parte transitoria cae a 1/e ≈ 37 %. La dominante es la de la raíz más lenta.'] },
  'Δ': { simbolo: 'Δ', nombre: 'Discriminante', descripcion: ['Δ = R² − 4L/C. Su signo decide el tipo de raíces:', 'Δ < 0 complejas · Δ = 0 repetida · Δ > 0 reales distintas.'] },
  r: {
    simbolo: 'r',
    nombre: 'Raíz característica',
    unidad: 's⁻¹',
    descripcion: ['Solución de L r² + R r + 1/C = 0.', 'Cada raíz genera un término e^(rt) en la solución homogénea.'],
  },
  A: { simbolo: 'A', nombre: 'Constante de integración A', descripcion: ['Se determina con las condiciones iniciales q(0) e i(0).', 'Sus unidades dependen de la forma de la solución.'] },
  B: { simbolo: 'B', nombre: 'Constante de integración B', descripcion: ['Segunda constante fijada por las condiciones iniciales.', 'Sus unidades dependen de la forma de la solución.'] },
  K: { simbolo: 'K', nombre: 'Constante propuesta', descripcion: ['Valor constante que se prueba como solución particular (q_p = K).'] },
  e: { simbolo: 'e', nombre: 'Número de Euler', descripcion: ['e ≈ 2.71828, base de la función exponencial.', 'Las soluciones de EDO lineales con coeficientes constantes se construyen con e^(rt).'] },
  d: { simbolo: 'd', nombre: 'Operador diferencial', descripcion: ['dq/dt indica la derivada de q respecto al tiempo: su tasa de cambio instantánea.'] },
  Q: { simbolo: 'Q', nombre: 'Factor de calidad', descripcion: ['Q = 1/(2ζ) = (1/R)√(L/C) (adimensional).', 'Mide qué tan selectiva es la resonancia: Q alto ⇒ oscilaciones duraderas.'] },
  f: { simbolo: 'f', nombre: 'Frecuencia', unidad: 'hercio (Hz)', descripcion: ['Ciclos por segundo: f = ω / 2π.'] },
  f0: { simbolo: 'f₀', nombre: 'Frecuencia de resonancia', unidad: 'hercio (Hz)', descripcion: ['f₀ = 1 / (2π√(LC)).'] },
  x: { simbolo: 'x', nombre: 'Desplazamiento', unidad: 'metro (m)', descripcion: ['Posición de la masa en el sistema mecánico análogo. Equivale a la carga q.'] },
  x1: { simbolo: 'x₁', nombre: 'Primera variable de estado', unidad: 'culombio (C)', descripcion: ['x₁ = q. El sistema de primer orden usado por RK4.'] },
  x2: { simbolo: 'x₂', nombre: 'Segunda variable de estado', unidad: 'amperio (A)', descripcion: ['x₂ = i = q′.'] },
  m: { simbolo: 'm', nombre: 'Masa', unidad: 'kilogramo (kg)', descripcion: ['Análogo mecánico de la inductancia L: inercia del sistema.'] },
  b: { simbolo: 'b', nombre: 'Coeficiente de amortiguamiento viscoso', unidad: 'N·s/m', descripcion: ['Análogo mecánico de la resistencia R: fuerza del amortiguador por unidad de velocidad.'] },
  k: { simbolo: 'k', nombre: 'Constante del resorte', unidad: 'N/m', descripcion: ['Análogo mecánico de 1/C: rigidez del resorte.'] },
  kRK: { simbolo: 'k_n', nombre: 'Pendiente de Runge-Kutta', descripcion: ['k₁…k₄ son cuatro estimaciones de la pendiente dentro del paso h.', 'RK4 las combina con pesos 1, 2, 2, 1.'] },
  F: { simbolo: 'F(t)', nombre: 'Fuerza externa', unidad: 'newton (N)', descripcion: ['Análogo mecánico de E(t).'] },
  h: { simbolo: 'h', nombre: 'Paso de integración', unidad: 'segundo (s)', descripcion: ['Incremento de tiempo usado por RK4 en cada iteración.'] },
  n: { simbolo: 'n', nombre: 'Índice de iteración', descripcion: ['Número de paso del método numérico.'] },
  s: { simbolo: 's', nombre: 'Variable de Laplace', unidad: 's⁻¹', descripcion: ['Frecuencia compleja de la función de transferencia H(s).'] },
  H: { simbolo: 'H(s)', nombre: 'Función de transferencia', descripcion: ['Cociente entre la salida y la entrada en el dominio de Laplace.'] },
};

/** Traduce el carácter base y el texto del subíndice de KaTeX a una clave del diccionario. */
export function claveSimbolo(base: string, subindice: string): string | null {
  const sub = subindice.replace(/[\s′'″]/g, '');
  const candidatos: string[] = [];
  if (base === 'R' && /cr|^c/i.test(sub)) candidatos.push('Rc');
  if (base === 'k' && /^[1-4n]/.test(sub)) candidatos.push('kRK');
  if (base === 'ω' && sub.includes('d')) candidatos.push('ωd');
  if (base === 'ω' && sub.includes('0')) candidatos.push('ω0');
  if (sub) {
    candidatos.push(base + sub, base + sub.replace(/2/g, ''), base + sub.charAt(0));
  }
  candidatos.push(base);
  return candidatos.find((c) => c in SIMBOLOS) ?? null;
}

/** Representación LaTeX del símbolo de cada entrada (para mostrarlo con KaTeX). */
export const LATEX_SIMBOLO: Record<string, string> = {
  L: 'L', R: 'R', Rc: 'R_c', C: 'C', q: 'q(t)', q0: 'q_0', qp: 'q_p', qh: 'q_h', i: 'i(t)', i0: 'i_0', E: 'E(t)', E0: 'E_0',
  EL: 'E_L', EC: 'E_C', VL: 'V_L', VR: 'V_R', VC: 'V_C', V: 'V', P: 'P', t: 't', tp: 't_p', 'α': '\alpha', 'ω': '\omega',
  'ω0': '\omega_0', 'ωd': '\omega_d', 'ζ': '\zeta', 'τ': '\tau', 'Δ': '\Delta', r: 'r', A: 'A', B: 'B', K: 'K', e: 'e',
  d: 'd', Q: 'Q', f: 'f', f0: 'f_0', x: 'x', x1: 'x_1', x2: 'x_2', m: 'm', b: 'b', k: 'k', kRK: 'k_n', F: 'F(t)', h: 'h',
  n: 'n', s: 's', H: 'H(s)',
};
