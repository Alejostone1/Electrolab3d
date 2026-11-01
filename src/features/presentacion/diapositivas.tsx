import type { ReactNode } from 'react';
import type { IdComponente, TipoAmortiguamiento } from '@/engine';
import { Formula } from '@/components/common/Formula';
import { EQUIPO } from '@/data/navegacion';
import { ENFOQUE_COMPONENTE, POSICIONES } from '../laboratorio/components-3d/geometria';
import type { Encuadre } from '../laboratorio/scenes/Escena3D';
import { CurvasComparativas } from './CurvasComparativas';
import { OsciloscopioEnVivo } from './OsciloscopioEnVivo';

export interface Diapositiva {
  id: string;
  seccion: string;
  titulo: string;
  contenido: ReactNode;
  encuadre: Encuadre;
  autoRotar?: boolean;
  /** Componente resaltado con el anillo de selección. */
  foco?: IdComponente;
  /** Componentes que se despiezan automáticamente tras `retrasoDespiece` ms. */
  despiece?: IdComponente[];
  retrasoDespiece?: number;
  rayosX?: IdComponente[];
  /** Configuración del circuito al entrar en la diapositiva. */
  preset?: TipoAmortiguamiento;
  ejecutar?: boolean;
  conectar?: boolean;
}

function enfocar(id: IdComponente, distancia = 1, elevacion = 0): Encuadre {
  const [x, y, z] = POSICIONES[id];
  const [dx, dy, dz] = ENFOQUE_COMPONENTE[id];
  return {
    posicion: [x + dx * distancia, y + dy * distancia + elevacion, z + dz * distancia],
    objetivo: [x, y + 0.8 + elevacion * 0.8, z],
  };
}

const GENERAL: Encuadre = { posicion: [9, 8, 11], objetivo: [0, 0.3, 0] };
const SUPERIOR: Encuadre = { posicion: [0.01, 14, 6], objetivo: [0, 0, 0.5] };

export const DIAPOSITIVAS: Diapositiva[] = [
  {
    id: 'portada',
    seccion: 'Proyecto final · Matemáticas IV',
    titulo: 'ELECTROLAB 3D',
    encuadre: { posicion: [10, 6, 10], objetivo: [0, 0.4, 0] },
    autoRotar: true,
    preset: 'subamortiguado',
    ejecutar: true,
    contenido: (
      <>
        <p className="diapositiva__lead">
          Laboratorio virtual para modelar, simular y visualizar circuitos <b>RLC en serie</b> con ecuaciones diferenciales lineales de segundo orden.
        </p>
        <div className="equipo">
          {EQUIPO.integrantes.map((nombre) => (
            <span key={nombre} className="equipo__integrante">
              <span className="equipo__inicial">{nombre.split(' ').map((p) => p[0]).join('')}</span>
              {nombre}
            </span>
          ))}
        </div>
        <dl className="ficha-proyecto">
          <div>
            <dt>Programa</dt>
            <dd>
              {EQUIPO.programa} · {EQUIPO.semestre}
            </dd>
          </div>
          <div>
            <dt>Profesor</dt>
            <dd>{EQUIPO.profesor}</dd>
          </div>
          <div>
            <dt>Asignatura</dt>
            <dd>{EQUIPO.asignatura}</dd>
          </div>
        </dl>
      </>
    ),
  },
  {
    id: 'que-es',
    seccion: '01 · El problema',
    titulo: '¿Qué es un circuito RLC en serie?',
    encuadre: GENERAL,
    preset: 'subamortiguado',
    ejecutar: true,
    contenido: (
      <>
        <p>
          Una <b>fuente</b>, un <b>resistor</b>, un <b>inductor</b> y un <b>capacitor</b> conectados uno tras otro: la <b>misma corriente</b> i(t) recorre
          todos los elementos.
        </p>
        <ul className="lista-puntos">
          <li>
            <b>R</b> disipa energía en forma de calor.
          </li>
          <li>
            <b>L</b> guarda energía en un campo magnético.
          </li>
          <li>
            <b>C</b> guarda energía en un campo eléctrico.
          </li>
        </ul>
        <p className="texto-2">
          Los puntos luminosos del cable representan la corriente convencional calculada por el motor: su velocidad y sentido siguen a i(t).
        </p>
      </>
    ),
  },
  {
    id: 'fuente',
    seccion: '02 · Componentes por dentro',
    titulo: 'La fuente de voltaje',
    encuadre: enfocar('fuente', 2, 1.7),
    foco: 'fuente',
    despiece: ['fuente'],
    retrasoDespiece: 1600,
    contenido: (
      <>
        <p>Convierte energía química en eléctrica: el zinc se oxida y libera electrones que viajan por el circuito hasta el cátodo de dióxido de manganeso.</p>
        <Formula latex="E(t) = V_L(t) + V_R(t) + V_C(t)" bloque />
        <p className="texto-2">
          En la ecuación diferencial, E(t) es el <b>término independiente</b>: la "fuerza" que excita al sistema. ELECTROLAB 3D admite fuente constante, pulso, onda
          cuadrada y sinusoidal.
        </p>
      </>
    ),
  },
  {
    id: 'interruptor',
    seccion: '02 · Componentes por dentro',
    titulo: 'El interruptor y las condiciones iniciales',
    encuadre: enfocar('interruptor', 1.4, 0.4),
    foco: 'interruptor',
    preset: 'subamortiguado',
    conectar: true,
    contenido: (
      <>
        <p>Al cerrar la cuchilla en t = 0 empieza el experimento. Antes de ese instante el capacitor está descargado y no circula corriente:</p>
        <Formula latex="q(0) = 0, \qquad i(0) = q'(0) = 0" bloque />
        <p className="texto-2">Una EDO de segundo orden necesita dos condiciones iniciales para tener solución única.</p>
      </>
    ),
  },
  {
    id: 'resistor',
    seccion: '02 · Componentes por dentro',
    titulo: 'El resistor: donde la energía se vuelve calor',
    encuadre: enfocar('resistor', 1.9, 1.3),
    foco: 'resistor',
    despiece: ['resistor'],
    retrasoDespiece: 1600,
    contenido: (
      <>
        <p>
          Dentro hay un núcleo cerámico cubierto por una <b>película de carbón tallada en espiral</b>. La longitud de esa espiral fija el valor de R; las bandas de
          color lo codifican.
        </p>
        <Formula latex="V_R = R\,i \qquad P_R = R\,i^2" bloque />
        <p className="texto-2">R es la responsable del amortiguamiento: aparece en α = R/2L.</p>
      </>
    ),
  },
  {
    id: 'inductor',
    seccion: '02 · Componentes por dentro',
    titulo: 'El inductor: inercia eléctrica',
    encuadre: enfocar('inductor', 1.9, 1.4),
    foco: 'inductor',
    despiece: ['inductor'],
    retrasoDespiece: 2600,
    preset: 'subamortiguado',
    ejecutar: true,
    contenido: (
      <>
        <p>
          Un <b>devanado de cobre</b> sobre un <b>núcleo de ferrita</b>. Cuando la corriente cambia, el campo magnético induce un voltaje que se opone al cambio
          (ley de Faraday-Lenz).
        </p>
        <Formula latex="V_L = L\,\frac{di}{dt} = L\,q''(t)" bloque />
        <p className="texto-2">De aquí sale la segunda derivada de la ecuación. Las líneas azules son una representación ilustrativa de B.</p>
      </>
    ),
  },
  {
    id: 'capacitor',
    seccion: '02 · Componentes por dentro',
    titulo: 'El capacitor: carga acumulada',
    encuadre: enfocar('capacitor', 2, 1.8),
    foco: 'capacitor',
    despiece: ['capacitor'],
    retrasoDespiece: 3000,
    rayosX: ['capacitor'],
    preset: 'subamortiguado',
    ejecutar: true,
    contenido: (
      <>
        <p>
          Dos <b>placas conductoras</b> separadas por un <b>dieléctrico</b>. Las esferas rojas y azules representan la carga +q y −q; su cantidad es proporcional a
          q(t) calculada.
        </p>
        <Formula latex="V_C = \frac{q}{C} \qquad i = \frac{dq}{dt}" bloque />
        <p className="texto-2">La carga q(t) es la incógnita principal de la ecuación diferencial.</p>
      </>
    ),
  },
  {
    id: 'kirchhoff',
    seccion: '03 · El modelo matemático',
    titulo: 'De Kirchhoff a la ecuación diferencial',
    encuadre: SUPERIOR,
    contenido: (
      <>
        <p>La segunda ley de Kirchhoff dice que el voltaje aplicado se reparte entre los tres componentes:</p>
        <Formula latex="L\frac{di}{dt} + R\,i + \frac{q}{C} = E(t)" bloque />
        <p>Como i = q', sustituimos y obtenemos una EDO lineal de segundo orden con coeficientes constantes:</p>
        <Formula latex="L\,q'' + R\,q' + \frac{1}{C}\,q = E(t)" bloque className="formula-destacada" />
      </>
    ),
  },
  {
    id: 'caracteristica',
    seccion: '03 · El modelo matemático',
    titulo: 'Ecuación característica y sus raíces',
    encuadre: { posicion: [-6, 9, 9], objetivo: [0, 0, 0] },
    contenido: (
      <>
        <p>
          Proponiendo <Formula latex="q = e^{rt}" /> en la ecuación homogénea:
        </p>
        <Formula latex="L\,r^2 + R\,r + \frac{1}{C} = 0 \;\Rightarrow\; r = -\alpha \pm \sqrt{\alpha^2 - \omega_0^2}" bloque />
        <Formula latex="\alpha = \frac{R}{2L},\quad \omega_0 = \frac{1}{\sqrt{LC}},\quad \zeta = \frac{\alpha}{\omega_0},\quad R_c = 2\sqrt{L/C}" bloque />
        <div className="casos">
          <span className="chip chip--subamortiguado">ζ &lt; 1 · complejas</span>
          <span className="chip chip--critico">ζ = 1 · repetida</span>
          <span className="chip chip--sobreamortiguado">ζ &gt; 1 · reales</span>
        </div>
      </>
    ),
  },
  {
    id: 'sub',
    seccion: '04 · Simulación en vivo',
    titulo: 'Subamortiguado · R = 10 Ω',
    encuadre: GENERAL,
    preset: 'subamortiguado',
    ejecutar: true,
    contenido: (
      <>
        <Formula latex="q(t) = CE_0\left[1 - e^{-\alpha t}\left(\cos\omega_d t + \tfrac{\alpha}{\omega_d}\sin\omega_d t\right)\right]" bloque />
        <OsciloscopioEnVivo />
        <p className="texto-2">La energía va y viene entre L y C: la corriente cambia de sentido y los portadores del cable se devuelven.</p>
      </>
    ),
  },
  {
    id: 'critico',
    seccion: '04 · Simulación en vivo',
    titulo: 'Críticamente amortiguado · R ≈ 44.72 Ω',
    encuadre: GENERAL,
    preset: 'critico',
    ejecutar: true,
    contenido: (
      <>
        <Formula latex="q(t) = CE_0\left[1 - (1 + \alpha t)\,e^{-\alpha t}\right]" bloque />
        <OsciloscopioEnVivo />
        <p className="texto-2">Llega al equilibrio lo más rápido posible sin oscilar: la corriente nunca cambia de sentido.</p>
      </>
    ),
  },
  {
    id: 'sobre',
    seccion: '04 · Simulación en vivo',
    titulo: 'Sobreamortiguado · R = 80 Ω',
    encuadre: GENERAL,
    preset: 'sobreamortiguado',
    ejecutar: true,
    contenido: (
      <>
        <Formula latex="q(t) = CE_0 + A\,e^{r_1 t} + B\,e^{r_2 t}, \quad r_1, r_2 < 0" bloque />
        <OsciloscopioEnVivo />
        <p className="texto-2">Demasiada resistencia: el resistor brilla más y la carga sube lentamente, sin oscilaciones.</p>
      </>
    ),
  },
  {
    id: 'comparacion',
    seccion: '05 · Análisis',
    titulo: 'Las tres respuestas, mismo L, C y E₀',
    encuadre: { posicion: [0, 3, 12.5], objetivo: [0, 0.6, 0] },
    contenido: (
      <>
        <CurvasComparativas />
        <p>
          Solo cambia R. El motor resuelve cada caso <b>analíticamente</b> y con <b>Runge-Kutta 4</b>; ambas soluciones coinciden con un error relativo menor a
          10⁻⁶.
        </p>
      </>
    ),
  },
  {
    id: 'aplicaciones',
    seccion: '06 · Mundo real',
    titulo: '¿Dónde se usan los circuitos RLC?',
    encuadre: { posicion: [7, 4, -8], objetivo: [0, 0.4, 0] },
    autoRotar: true,
    contenido: (
      <ul className="lista-puntos">
        <li>
          <b>Radio y telecomunicaciones:</b> sintonizar una emisora es ajustar la resonancia ω₀ = 1/√(LC).
        </li>
        <li>
          <b>Filtros:</b> pasa-banda y rechaza-banda en audio y señales.
        </li>
        <li>
          <b>Fuentes conmutadas:</b> amortiguar sobrepicos de voltaje.
        </li>
        <li>
          <b>Sistemas de control:</b> el mismo modelo describe resortes, amortiguadores y suspensiones.
        </li>
      </ul>
    ),
  },
  {
    id: 'cierre',
    seccion: 'Conclusión',
    titulo: 'Matemáticas que se pueden ver',
    encuadre: { posicion: [11, 9, 11], objetivo: [0, 0.3, 0] },
    autoRotar: true,
    preset: 'subamortiguado',
    ejecutar: true,
    contenido: (
      <>
        <p>
          Cada animación del laboratorio proviene de la solución de <b>L q'' + R q' + q/C = E(t)</b>. Cambiar un parámetro cambia los cálculos, la clasificación,
          las gráficas y la escena 3D al mismo tiempo.
        </p>
        <div className="equipo">
          {EQUIPO.integrantes.map((nombre) => (
            <span key={nombre} className="equipo__integrante">
              <span className="equipo__inicial">{nombre.split(' ').map((p) => p[0]).join('')}</span>
              {nombre}
            </span>
          ))}
        </div>
        <p className="texto-2">
          ¡Gracias! · Prof. {EQUIPO.profesor} · {EQUIPO.asignatura}
        </p>
      </>
    ),
  },
];
