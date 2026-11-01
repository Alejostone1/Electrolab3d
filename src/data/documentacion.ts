import type { NombreIcono } from '@/components/common/Icono';

export const APLICACIONES: Array<{ titulo: string; icono: NombreIcono; texto: string; ecuacion: string }> = [
  {
    titulo: 'Electrónica',
    icono: 'rayo',
    texto: 'Redes de amortiguamiento (snubbers) en fuentes conmutadas y control de sobrepicos al encender cargas inductivas.',
    ecuacion: 'R \\geq 2\\sqrt{L/C} \\Rightarrow \\text{sin sobrepaso}',
  },
  {
    titulo: 'Radiofrecuencia',
    icono: 'onda',
    texto: 'Sintonizar una emisora es ajustar C (o L) para que la frecuencia de resonancia coincida con la portadora.',
    ecuacion: 'f_0 = \\frac{1}{2\\pi\\sqrt{LC}}',
  },
  {
    titulo: 'Circuitos resonantes',
    icono: 'campo',
    texto: 'Con poco amortiguamiento el circuito responde intensamente cerca de ω₀. El factor de calidad Q mide qué tan selectivo es.',
    ecuacion: 'Q = \\frac{1}{R}\\sqrt{\\frac{L}{C}} = \\frac{1}{2\\zeta}',
  },
  {
    titulo: 'Filtros eléctricos',
    icono: 'graficas',
    texto: 'Filtros pasa-banda, rechaza-banda, pasa-bajas y pasa-altas en audio, instrumentación y comunicaciones.',
    ecuacion: '\\Delta\\omega = \\frac{R}{L}',
  },
  {
    titulo: 'Sistemas de control',
    icono: 'experimentos',
    texto: 'El mismo modelo de segundo orden describe suspensiones, servomotores y sistemas masa-resorte-amortiguador.',
    ecuacion: 'm\\,x\'\' + b\\,x\' + k\\,x = F(t)',
  },
  {
    titulo: 'Procesamiento de señales',
    icono: 'onda',
    texto: 'Los filtros analógicos RLC inspiran los filtros digitales IIR de segundo orden (biquads) usados en audio y telecomunicaciones.',
    ecuacion: 'H(s) = \\frac{1/LC}{s^2 + (R/L)s + 1/LC}',
  },
];

export const ANALOGIA = [
  ['Carga q', 'Posición x'],
  ['Corriente i', 'Velocidad v'],
  ['Inductancia L', 'Masa m'],
  ['Resistencia R', 'Amortiguador b'],
  ['1/C', 'Constante del resorte k'],
  ['Voltaje E(t)', 'Fuerza F(t)'],
];

export const GLOSARIO: Array<[string, string]> = [
  ['Amortiguamiento', 'Pérdida progresiva de energía de un sistema oscilante; en el RLC la produce la resistencia.'],
  ['Coeficiente de amortiguamiento (α)', 'α = R/2L. Rapidez con la que decae la envolvente e^{−αt}.'],
  ['Relación de amortiguamiento (ζ)', 'ζ = α/ω₀. Clasifica la respuesta: < 1, = 1 o > 1.'],
  ['Ecuación característica', 'Polinomio L r² + R r + 1/C = 0 que se obtiene al proponer q = e^{rt}.'],
  ['Frecuencia natural (ω₀)', 'ω₀ = 1/√(LC): frecuencia a la que oscilaría el circuito sin resistencia.'],
  ['Frecuencia amortiguada (ωd)', 'ωd = √(ω₀² − α²): frecuencia real de oscilación en el caso subamortiguado.'],
  ['Resistencia crítica', 'R = 2√(L/C): frontera entre respuesta oscilatoria y no oscilatoria.'],
  ['Régimen transitorio', 'Parte de la respuesta que se extingue con el tiempo (solución homogénea).'],
  ['Régimen permanente', 'Respuesta que queda cuando el transitorio desaparece (solución particular).'],
  ['Runge-Kutta 4 (RK4)', 'Método numérico de cuarto orden que avanza la solución combinando cuatro pendientes por paso.'],
  ['Sobrepaso', 'Cuánto supera la carga su valor final, en porcentaje. Solo ocurre si ζ < 1.'],
  ['Tiempo de estabilización', 'Instante a partir del cual la respuesta permanece dentro del 2 % del valor final.'],
];

export const UNIDADES: Array<[string, string, string, string]> = [
  ['Carga', 'q', 'culombio', 'C = A·s'],
  ['Corriente', 'i', 'amperio', 'A = C/s'],
  ['Voltaje', 'V, E', 'voltio', 'V = J/C'],
  ['Resistencia', 'R', 'ohmio', 'Ω = V/A'],
  ['Inductancia', 'L', 'henrio', 'H = V·s/A'],
  ['Capacitancia', 'C', 'faradio', 'F = C/V'],
  ['Potencia', 'P', 'vatio', 'W = J/s'],
  ['Energía', 'E', 'julio', 'J = W·s'],
  ['Frecuencia angular', 'ω', 'radián por segundo', 'rad/s'],
];

export const FORMULARIO: Array<[string, string]> = [
  ['Ecuación diferencial', "L\\,q'' + R\\,q' + \\frac{q}{C} = E(t)"],
  ['Ley de Kirchhoff', 'E = L\\frac{di}{dt} + R\\,i + \\frac{q}{C}'],
  ['Frecuencia natural', '\\omega_0 = \\frac{1}{\\sqrt{LC}}'],
  ['Coeficiente de amortiguamiento', '\\alpha = \\frac{R}{2L}'],
  ['Relación de amortiguamiento', '\\zeta = \\frac{\\alpha}{\\omega_0} = \\frac{R}{2}\\sqrt{\\frac{C}{L}}'],
  ['Resistencia crítica', 'R_c = 2\\sqrt{\\frac{L}{C}}'],
  ['Raíces', 'r_{1,2} = -\\alpha \\pm \\sqrt{\\alpha^2 - \\omega_0^2}'],
  ['Subamortiguado', 'q = CE_0\\left[1 - e^{-\\alpha t}\\left(\\cos\\omega_d t + \\tfrac{\\alpha}{\\omega_d}\\sin\\omega_d t\\right)\\right]'],
  ['Crítico', 'q = CE_0\\left[1 - (1+\\alpha t)e^{-\\alpha t}\\right]'],
  ['Sobreamortiguado', 'q = CE_0 + A e^{r_1 t} + B e^{r_2 t}'],
  ['Energías', 'E_L = \\tfrac{1}{2}L i^2,\\quad E_C = \\frac{q^2}{2C},\\quad P_R = R i^2'],
  ['RK4', '\\mathbf{x}_{n+1} = \\mathbf{x}_n + \\tfrac{h}{6}(\\mathbf{k}_1 + 2\\mathbf{k}_2 + 2\\mathbf{k}_3 + \\mathbf{k}_4)'],
];

export const REFERENCIAS = [
  'Zill, D. G. (2018). Ecuaciones diferenciales con aplicaciones de modelado (11.ª ed.). Cengage Learning. Sección 5.1: modelos lineales, circuitos en serie.',
  'Boyce, W. E., DiPrima, R. C. y Meade, D. B. (2017). Elementary Differential Equations and Boundary Value Problems (11.ª ed.). Wiley.',
  'Alexander, C. K. y Sadiku, M. N. O. (2013). Fundamentos de circuitos eléctricos (5.ª ed.). McGraw-Hill. Cap. 8: circuitos de segundo orden.',
  'Nilsson, J. W. y Riedel, S. A. (2015). Circuitos eléctricos (10.ª ed.). Pearson.',
  'Burden, R. L. y Faires, J. D. (2011). Análisis numérico (9.ª ed.). Cengage Learning. Métodos de Runge-Kutta.',
];
