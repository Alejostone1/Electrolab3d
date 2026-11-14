/**
 * Distribución de la exposición entre los tres integrantes.
 * Es la fuente única que usan la presentación, la página "Acerca" y la guía PDF,
 * para que las tres coincidan exactamente.
 */
export interface BloqueExposicion {
  numero: 'I' | 'II' | 'III';
  integrante: string;
  titulo: string;
  duracion: string;
  enfoque: string;
  temas: string[];
  formulas: string[];
  conclusion: string;
  transicion: string;
}

export const BLOQUES: BloqueExposicion[] = [
  {
    numero: 'I',
    integrante: 'Alejandro Piedrahita',
    titulo: 'El circuito y sus componentes',
    duracion: '≈ 5 min',
    enfoque: 'Fundamento físico: qué es cada elemento, qué hay dentro y qué ley lo describe.',
    temas: ['Circuito RLC en serie', 'Fuente de voltaje', 'Interruptor y condiciones iniciales', 'Resistor', 'Inductor', 'Capacitor'],
    formulas: ['V_R = R\\,i', 'V_L = L\\,\\frac{di}{dt}', 'V_C = \\frac{q}{C}', 'i = \\frac{dq}{dt}', 'q(0) = 0,\\; i(0) = 0'],
    conclusion: 'Cada componente aporta una relación entre voltaje y carga: R con la primera derivada, L con la segunda y C con la carga misma.',
    transicion: 'Daniel unirá estas tres relaciones con la ley de Kirchhoff para obtener la ecuación diferencial.',
  },
  {
    numero: 'II',
    integrante: 'Daniel Colorado',
    titulo: 'Del circuito a la ecuación diferencial',
    duracion: '≈ 5 min',
    enfoque: 'Modelo matemático: deducción de la EDO, ecuación característica, soluciones y método numérico.',
    temas: ['Segunda ley de Kirchhoff', 'EDO lineal de segundo orden', 'Ecuación característica y discriminante', 'Soluciones de los tres casos y condiciones iniciales', 'Runge-Kutta 4 y validación'],
    formulas: [
      "L\\,q'' + R\\,q' + \\frac{1}{C}\\,q = E(t)",
      'L\\,r^2 + R\\,r + \\frac{1}{C} = 0',
      '\\alpha = \\frac{R}{2L},\\; \\omega_0 = \\frac{1}{\\sqrt{LC}},\\; \\zeta = \\frac{\\alpha}{\\omega_0}',
      'R_c = 2\\sqrt{L/C}',
    ],
    conclusion: 'El signo del discriminante decide la forma de la solución; la solución analítica y RK4 coinciden con error relativo menor a 10⁻⁶.',
    transicion: 'Sebastián mostrará qué significan físicamente esos tres casos y dónde aparecen en la ingeniería.',
  },
  {
    numero: 'III',
    integrante: 'Sebastián Patiño',
    titulo: 'Comportamiento, resultados y aplicaciones',
    duracion: '≈ 6 min',
    enfoque: 'Interpretación física: los tres regímenes en vivo, su comparación y aplicaciones reales justificadas.',
    temas: ['Subamortiguado', 'Críticamente amortiguado', 'Sobreamortiguado', 'Comparación de los tres regímenes', 'Suspensión, instrumento de aguja, cierrapuertas y sintonizador', 'Conclusiones'],
    formulas: [
      'q(t) = CE_0\\left[1 - e^{-\\alpha t}\\left(\\cos\\omega_d t + \\tfrac{\\alpha}{\\omega_d}\\sin\\omega_d t\\right)\\right]',
      'q(t) = CE_0\\left[1 - (1+\\alpha t)e^{-\\alpha t}\\right]',
      'q(t) = CE_0 + A e^{r_1 t} + B e^{r_2 t}',
      'f_0 = \\frac{1}{2\\pi\\sqrt{LC}},\\; Q = \\frac{1}{2\\zeta}',
    ],
    conclusion: 'El mismo modelo de segundo orden describe circuitos y sistemas mecánicos; elegir ζ es una decisión de diseño.',
    transicion: 'Cierre conjunto del equipo.',
  },
];
