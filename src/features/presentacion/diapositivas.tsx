import { useMemo, type ReactNode } from 'react';
import { PRESETS, simularCircuito, type IdComponente, type TipoAmortiguamiento } from '@/engine';
import { Formula } from '@/components/common/Formula';
import { FormulaProgresiva } from '@/components/common/FormulaProgresiva';
import { BLOQUES } from '@/data/exposicion';
import { EQUIPO } from '@/data/navegacion';
import { ENFOQUE_COMPONENTE, POSICIONES } from '../laboratorio/components-3d/geometria';
import type { Encuadre } from '../laboratorio/scenes/Escena3D';
import { CurvasComparativas } from './CurvasComparativas';
import type { TipoEscena } from './escenas/EscenasPresentacion';
import { OsciloscopioEnVivo } from './OsciloscopioEnVivo';

export interface Diapositiva {
  id: string;
  /** Bloque (0, 1, 2) del integrante que expone; `null` = todo el equipo. */
  bloque: 0 | 1 | 2 | null;
  seccion: string;
  titulo: string;
  contenido: ReactNode;
  encuadre: Encuadre;
  escena?: TipoEscena;
  autoRotar?: boolean;
  velocidadGiro?: number;
  /** Componente resaltado con anillo y foco de luz. */
  foco?: IdComponente;
  /** Componentes que se despiezan automáticamente tras `retrasoDespiece` ms. */
  despiece?: IdComponente[];
  retrasoDespiece?: number;
  rayosX?: IdComponente[];
  preset?: TipoAmortiguamiento;
  ejecutar?: boolean;
  conectar?: boolean;
  /** Diapositiva de apertura de capítulo (composición especial). */
  capitulo?: boolean;
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
const REGIMEN: Encuadre = { posicion: [2.5, 7.5, 13.5], objetivo: [1.2, 1.4, -2.2] };

/** Apertura de capítulo: integrante, temas y duración. */
function Capitulo({ indice }: { indice: 0 | 1 | 2 }) {
  const bloque = BLOQUES[indice];
  return (
    <div className="capitulo">
      <p className="capitulo__enfoque">{bloque.enfoque}</p>
      <ol className="capitulo__temas">
        {bloque.temas.map((tema, k) => (
          <li key={tema}>
            <span className="mono">{String(k + 1).padStart(2, '0')}</span>
            {tema}
          </li>
        ))}
      </ol>
      <p className="capitulo__duracion mono">{bloque.duracion}</p>
    </div>
  );
}

/** Cierre de bloque con la transición al siguiente integrante. */
function Transicion({ indice }: { indice: 0 | 1 }) {
  const bloque = BLOQUES[indice];
  return (
    <p className="transicion">
      <b>En resumen.</b> {bloque.conclusion} <span>{bloque.transicion}</span>
    </p>
  );
}

/** Errores reales RK4 vs. solución analítica para los tres presets. */
function TablaValidacion() {
  const filas = useMemo(
    () =>
      PRESETS.map((p) => {
        const r = simularCircuito(p.parametros);
        return { nombre: p.nombre, error: Math.max(r.errorNumerico!.carga / r.cargaReferencia, r.errorNumerico!.corriente / r.corrienteMaxima) };
      }),
    [],
  );
  return (
    <table className="tabla-datos tabla-validacion">
      <thead>
        <tr>
          <th>Régimen</th>
          <th>Error relativo máx.</th>
        </tr>
      </thead>
      <tbody className="mono">
        {filas.map((f) => (
          <tr key={f.nombre}>
            <td>{f.nombre}</td>
            <td>{f.error.toExponential(1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export const DIAPOSITIVAS: Diapositiva[] = [
  {
    id: 'portada',
    bloque: 0,
    seccion: 'Proyecto final · Matemáticas IV',
    titulo: 'ELECTROLAB 3D',
    encuadre: { posicion: [12, 4.5, 9], objetivo: [0, 0.4, 0] },
    autoRotar: true,
    velocidadGiro: 0.0009,
    preset: 'subamortiguado',
    ejecutar: true,
    contenido: (
      <>
        <p className="diapositiva__lead">
          Un laboratorio virtual para ver cómo una ecuación diferencial de segundo orden describe cada carga, cada oscilación y cada gota de calor en un circuito <b>RLC en serie</b>.
        </p>
        <div className="creditos">
          {BLOQUES.map((b) => (
            <div key={b.integrante} className="creditos__fila">
              <span className="creditos__numero mono">{b.numero}</span>
              <span className="creditos__nombre">{b.integrante}</span>
              <span className="creditos__rol">{b.titulo}</span>
            </div>
          ))}
        </div>
        <p className="creditos__pie">
          {EQUIPO.programa} · {EQUIPO.semestre}
          <br />
          Profesor <b>{EQUIPO.profesor}</b>
        </p>
      </>
    ),
  },

  /* ───────────── Capítulo I · Alejandro ───────────── */
  {
    id: 'capitulo-1',
    bloque: 0,
    capitulo: true,
    seccion: `Capítulo I · ${BLOQUES[0].integrante}`,
    titulo: BLOQUES[0].titulo,
    encuadre: { posicion: [-9, 2.2, 7], objetivo: [0, 0.6, 0] },
    autoRotar: true,
    velocidadGiro: 0.0015,
    contenido: <Capitulo indice={0} />,
  },
  {
    id: 'que-es',
    bloque: 0,
    seccion: 'I · El circuito',
    titulo: '¿Qué es un circuito RLC en serie?',
    encuadre: GENERAL,
    autoRotar: true,
    velocidadGiro: 0.0006,
    preset: 'subamortiguado',
    ejecutar: true,
    contenido: (
      <>
        <p>
          Una <b>fuente</b>, un <b>resistor</b>, un <b>inductor</b> y un <b>capacitor</b> conectados uno tras otro: la <b>misma corriente</b>{' '}
          <Formula latex="i(t)" /> recorre todos los elementos.
        </p>
        <ul className="lista-puntos">
          <li>
            <Formula latex="R" /> convierte energía eléctrica en calor.
          </li>
          <li>
            <Formula latex="L" /> la guarda en un campo magnético.
          </li>
          <li>
            <Formula latex="C" /> la guarda en un campo eléctrico.
          </li>
        </ul>
        <p className="texto-2">Los puntos luminosos del cable son la corriente calculada por el motor: su velocidad y su sentido siguen a i(t).</p>
      </>
    ),
  },
  {
    id: 'fuente',
    bloque: 0,
    seccion: 'I · Componentes por dentro',
    titulo: 'La fuente de voltaje',
    encuadre: enfocar('fuente', 2, 1.7),
    foco: 'fuente',
    despiece: ['fuente'],
    retrasoDespiece: 1800,
    contenido: (
      <>
        <p>Convierte energía química en eléctrica: el zinc se oxida y libera electrones que recorren el circuito hasta el cátodo de dióxido de manganeso.</p>
        <Formula latex="E(t) = V_L(t) + V_R(t) + V_C(t)" bloque />
        <p className="texto-2">
          En la ecuación, <Formula latex="E(t)" /> es el <b>término independiente</b>: la excitación del sistema.
        </p>
      </>
    ),
  },
  {
    id: 'interruptor',
    bloque: 0,
    seccion: 'I · Componentes por dentro',
    titulo: 'El interruptor y las condiciones iniciales',
    encuadre: enfocar('interruptor', 1.4, 0.4),
    foco: 'interruptor',
    preset: 'subamortiguado',
    conectar: true,
    contenido: (
      <>
        <p>Al cerrarse la cuchilla en t = 0 comienza el experimento. Antes de ese instante el capacitor está descargado y no circula corriente:</p>
        <Formula latex="q(0) = 0, \qquad i(0) = q'(0) = 0" bloque />
        <p className="texto-2">Una EDO de segundo orden necesita dos condiciones iniciales para tener solución única.</p>
      </>
    ),
  },
  {
    id: 'resistor',
    bloque: 0,
    seccion: 'I · Componentes por dentro',
    titulo: 'El resistor: donde la energía se vuelve calor',
    encuadre: enfocar('resistor', 1.9, 1.3),
    foco: 'resistor',
    despiece: ['resistor'],
    retrasoDespiece: 1800,
    preset: 'sobreamortiguado',
    ejecutar: true,
    contenido: (
      <>
        <p>
          Dentro hay un núcleo cerámico cubierto por una <b>película de carbón tallada en espiral</b>; su longitud fija el valor de R. Las bandas de color lo
          codifican.
        </p>
        <Formula latex="V_R = R\,i \qquad P_R = R\,i^2" bloque />
        <p className="texto-2">El brillo térmico es proporcional a la potencia calculada. R aparece en α = R/2L: es la responsable del amortiguamiento.</p>
      </>
    ),
  },
  {
    id: 'inductor',
    bloque: 0,
    seccion: 'I · Componentes por dentro',
    titulo: 'El inductor: inercia eléctrica',
    encuadre: enfocar('inductor', 1.9, 1.4),
    foco: 'inductor',
    despiece: ['inductor'],
    retrasoDespiece: 3200,
    preset: 'subamortiguado',
    ejecutar: true,
    contenido: (
      <>
        <p>
          Un <b>devanado de cobre</b> sobre un <b>núcleo de ferrita</b>. Si la corriente cambia, el campo magnético induce un voltaje que se opone al cambio (ley
          de Faraday-Lenz).
        </p>
        <Formula latex="V_L = L\,\frac{di}{dt} = L\,q''(t)" bloque />
        <p className="texto-2">De aquí sale la segunda derivada de la ecuación. Las líneas azules son una representación ilustrativa del campo B.</p>
      </>
    ),
  },
  {
    id: 'capacitor',
    bloque: 0,
    seccion: 'I · Componentes por dentro',
    titulo: 'El capacitor: carga acumulada',
    encuadre: enfocar('capacitor', 2, 1.8),
    foco: 'capacitor',
    despiece: ['capacitor'],
    retrasoDespiece: 3400,
    rayosX: ['capacitor'],
    preset: 'subamortiguado',
    ejecutar: true,
    contenido: (
      <>
        <p>
          Dos <b>placas conductoras</b> separadas por un <b>dieléctrico</b>. Las esferas rojas y azules son la carga +q y −q: su número es proporcional a q(t).
        </p>
        <Formula latex="V_C = \frac{q}{C} \qquad i = \frac{dq}{dt}" bloque />
        <Transicion indice={0} />
      </>
    ),
  },

  /* ───────────── Capítulo II · Daniel ───────────── */
  {
    id: 'capitulo-2',
    bloque: 1,
    capitulo: true,
    seccion: `Capítulo II · ${BLOQUES[1].integrante}`,
    titulo: BLOQUES[1].titulo,
    encuadre: { posicion: [0.01, 13, 5], objetivo: [0, 0, 0] },
    autoRotar: true,
    velocidadGiro: 0.0012,
    contenido: <Capitulo indice={1} />,
  },
  {
    id: 'kirchhoff',
    bloque: 1,
    seccion: 'II · El modelo',
    titulo: 'De Kirchhoff a la ecuación diferencial',
    encuadre: { posicion: [0.01, 14, 6], objetivo: [0, 0, 0.5] },
    preset: 'subamortiguado',
    ejecutar: true,
    contenido: (
      <>
        <p>En una malla cerrada el voltaje aplicado se reparte entre los componentes. Observa cómo se construye la ecuación:</p>
        <FormulaProgresiva
          pasos={[
            { latex: 'E(t) = V_L + V_R + V_C' },
            { latex: 'E(t) = L\\frac{di}{dt} + R\\,i + \\frac{q}{C}', operacion: 'Sustituir cada caída de voltaje' },
            { latex: "i = q', \\qquad \\frac{di}{dt} = q''", operacion: 'Relacionar corriente y carga' },
            { latex: "L\\,q'' + R\\,q' + \\frac{1}{C}\\,q = E(t)", operacion: 'Escribir todo en función de q(t)' },
          ]}
          intervalo={2200}
        />
        <p className="texto-2">EDO lineal, de segundo orden, con coeficientes constantes. Toca cualquier variable para ver su significado.</p>
      </>
    ),
  },
  {
    id: 'caracteristica',
    bloque: 1,
    seccion: 'II · El modelo',
    titulo: 'Ecuación característica y discriminante',
    encuadre: { posicion: [-6, 9, 9], objetivo: [0, 0, 0] },
    autoRotar: true,
    velocidadGiro: 0.0007,
    contenido: (
      <>
        <FormulaProgresiva
          pasos={[
            { latex: "L\\,q'' + R\\,q' + \\frac{1}{C}\\,q = 0" },
            { latex: 'q = e^{rt} \\;\\Rightarrow\\; e^{rt}\\left(L r^2 + R r + \\tfrac{1}{C}\\right) = 0', operacion: 'Proponer una exponencial' },
            { latex: 'r_{1,2} = -\\alpha \\pm \\sqrt{\\alpha^2 - \\omega_0^2}', operacion: 'Fórmula cuadrática' },
            { latex: '\\Delta = R^2 - \\frac{4L}{C} \\quad\\Rightarrow\\quad R_c = 2\\sqrt{L/C}', operacion: 'El signo del discriminante decide' },
          ]}
          intervalo={2200}
        />
        <div className="casos">
          <span className="chip chip--subamortiguado">Δ &lt; 0 · complejas</span>
          <span className="chip chip--critico">Δ = 0 · repetida</span>
          <span className="chip chip--sobreamortiguado">Δ &gt; 0 · reales</span>
        </div>
      </>
    ),
  },
  {
    id: 'soluciones',
    bloque: 1,
    seccion: 'II · El modelo',
    titulo: 'Las tres formas de la solución',
    encuadre: { posicion: [7, 5, 9], objetivo: [0, 0.4, 0] },
    autoRotar: true,
    velocidadGiro: 0.0007,
    contenido: (
      <>
        <p>
          Solución general = particular + homogénea. Con fuente constante <Formula latex="q_p = C E_0" />; las constantes <Formula latex="A" /> y{' '}
          <Formula latex="B" /> salen de <Formula latex="q(0) = 0" /> e <Formula latex="i(0) = 0" />.
        </p>
        <div className="formas">
          <div className="formas__fila formas__fila--subamortiguado">
            <span>Δ &lt; 0</span>
            <Formula latex="q_h = e^{-\alpha t}(A\cos\omega_d t + B\sin\omega_d t)" bloque />
          </div>
          <div className="formas__fila formas__fila--critico">
            <span>Δ = 0</span>
            <Formula latex="q_h = (A + B\,t)\,e^{-\alpha t}" bloque />
          </div>
          <div className="formas__fila formas__fila--sobreamortiguado">
            <span>Δ &gt; 0</span>
            <Formula latex="q_h = A\,e^{r_1 t} + B\,e^{r_2 t}" bloque />
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'rk4',
    bloque: 1,
    seccion: 'II · El modelo',
    titulo: 'Runge-Kutta 4: la comprobación numérica',
    encuadre: { posicion: [-8, 6, -7], objetivo: [0, 0.4, 0] },
    autoRotar: true,
    velocidadGiro: 0.0007,
    preset: 'subamortiguado',
    ejecutar: true,
    contenido: (
      <>
        <p>Para fuentes variables (pulso, onda cuadrada, sinusoidal) se integra el sistema de primer orden equivalente:</p>
        <Formula latex="x_1 = q,\; x_2 = i \;\Rightarrow\; x_1' = x_2,\quad x_2' = \frac{E(t) - R\,x_2 - x_1/C}{L}" bloque />
        <Formula latex="\mathbf{x}_{n+1} = \mathbf{x}_n + \tfrac{h}{6}(\mathbf{k}_1 + 2\mathbf{k}_2 + 2\mathbf{k}_3 + \mathbf{k}_4)" bloque />
        <TablaValidacion />
        <Transicion indice={1} />
      </>
    ),
  },

  /* ───────────── Capítulo III · Sebastián ───────────── */
  {
    id: 'capitulo-3',
    bloque: 2,
    capitulo: true,
    seccion: `Capítulo III · ${BLOQUES[2].integrante}`,
    titulo: BLOQUES[2].titulo,
    escena: 'comparacion',
    encuadre: { posicion: [-4, 2.5, 13], objetivo: [0, 2.2, 0] },
    autoRotar: true,
    velocidadGiro: 0.0006,
    contenido: <Capitulo indice={2} />,
  },
  {
    id: 'sub',
    bloque: 2,
    seccion: 'III · Simulación en vivo',
    titulo: 'Subamortiguado · R = 10 Ω',
    escena: 'regimen',
    encuadre: REGIMEN,
    preset: 'subamortiguado',
    ejecutar: true,
    contenido: (
      <>
        <Formula latex="q(t) = CE_0\left[1 - e^{-\alpha t}\left(\cos\omega_d t + \tfrac{\alpha}{\omega_d}\sin\omega_d t\right)\right]" bloque />
        <OsciloscopioEnVivo />
        <p className="texto-2">
          La masa sobrepasa el equilibrio y oscila; la barra naranja (energía del transitorio) baja a saltos porque R solo disipa cuando hay corriente. En el cable, los
          portadores cambian de sentido.
        </p>
      </>
    ),
  },
  {
    id: 'critico',
    bloque: 2,
    seccion: 'III · Simulación en vivo',
    titulo: 'Críticamente amortiguado · R ≈ 44.72 Ω',
    escena: 'regimen',
    encuadre: REGIMEN,
    preset: 'critico',
    ejecutar: true,
    contenido: (
      <>
        <Formula latex="q(t) = CE_0\left[1 - (1 + \alpha t)\,e^{-\alpha t}\right]" bloque />
        <OsciloscopioEnVivo />
        <p className="texto-2">La masa llega al equilibrio lo más rápido posible sin pasarse: la corriente nunca cambia de sentido.</p>
      </>
    ),
  },
  {
    id: 'sobre',
    bloque: 2,
    seccion: 'III · Simulación en vivo',
    titulo: 'Sobreamortiguado · R = 80 Ω',
    escena: 'regimen',
    encuadre: REGIMEN,
    preset: 'sobreamortiguado',
    ejecutar: true,
    contenido: (
      <>
        <Formula latex="q(t) = CE_0 + A\,e^{r_1 t} + B\,e^{r_2 t}, \quad r_1, r_2 < 0" bloque />
        <OsciloscopioEnVivo />
        <p className="texto-2">Demasiada resistencia: el amortiguador frena tanto que la masa se arrastra hacia el equilibrio. El resistor brilla más.</p>
      </>
    ),
  },
  {
    id: 'comparacion',
    bloque: 2,
    seccion: 'III · Análisis',
    titulo: 'Los tres regímenes, lado a lado',
    escena: 'comparacion',
    encuadre: { posicion: [0, 3.6, 22], objetivo: [0, 1.9, 0] },
    contenido: (
      <>
        <p>Misma L, misma C, mismo E₀ y mismas condiciones iniciales. Solo cambia R, y con ella ζ.</p>
        <CurvasComparativas />
        <p className="texto-2">
          El crítico (verde) es el primero en estabilizarse sin sobrepaso; el subamortiguado llega antes pero se pasa; el sobreamortiguado es el más lento.
        </p>
      </>
    ),
  },
  {
    id: 'app-suspension',
    bloque: 2,
    seccion: 'III · Aplicaciones reales',
    titulo: 'Suspensión de un automóvil',
    escena: 'suspension',
    encuadre: { posicion: [7.5, 4.6, 10.5], objetivo: [0, 1.7, 0] },
    autoRotar: true,
    velocidadGiro: 0.0008,
    contenido: (
      <>
        <Formula latex="m\,x'' + b\,x' + k\,x = F(t), \qquad \zeta = \frac{b}{2\sqrt{mk}}" bloque />
        <p>
          <b>Régimen: subamortiguado (ζ ≈ 0.2 – 0.4).</b> Un amortiguamiento crítico daría una marcha rígida e incómoda; uno muy bajo haría rebotar el auto. Los
          fabricantes eligen un subamortiguamiento moderado: un leve sobrepaso que se extingue en uno o dos ciclos.
        </p>
        <p className="texto-2">La animación es la respuesta al escalón con ζ = 0.3 y f₀ = 1.2 Hz, calculada con el mismo motor.</p>
      </>
    ),
  },
  {
    id: 'app-instrumento',
    bloque: 2,
    seccion: 'III · Aplicaciones reales',
    titulo: 'Instrumentos de aguja',
    escena: 'instrumento',
    encuadre: { posicion: [1.2, 2.2, 6.8], objetivo: [0, 1.7, 0] },
    contenido: (
      <>
        <Formula latex="J\,\theta'' + D\,\theta' + \kappa\,\theta = M(t)" bloque />
        <p>
          <b>Régimen: cercano al crítico (ζ ≈ 0.7 – 1).</b> En voltímetros y galvanómetros analógicos se busca que la aguja llegue a la lectura rápido y sin
          oscilar alrededor de ella, para poder leerla de inmediato.
        </p>
        <p className="texto-2">Aguja roja: ζ = 1. Aguja ámbar: ζ = 0.15, que tarda en asentarse.</p>
      </>
    ),
  },
  {
    id: 'app-puerta',
    bloque: 2,
    seccion: 'III · Aplicaciones reales',
    titulo: 'Cierrapuertas hidráulico',
    escena: 'cierrapuertas',
    encuadre: { posicion: [5.2, 3.6, 7], objetivo: [0.3, 1.9, 0.5] },
    autoRotar: true,
    velocidadGiro: 0.0006,
    contenido: (
      <>
        <Formula latex="\zeta > 1 \;\Rightarrow\; \theta(t) = A\,e^{r_1 t} + B\,e^{r_2 t},\; r_{1,2} < 0" bloque />
        <p>
          <b>Régimen: sobreamortiguado.</b> El aceite que pasa por un orificio estrecho actúa como un amortiguador viscoso grande: la puerta se cierra despacio y nunca
          golpea ni rebota contra el marco.
        </p>
        <p className="texto-2">Animación con ζ = 2.5 calculada por el motor.</p>
      </>
    ),
  },
  {
    id: 'app-radio',
    bloque: 2,
    seccion: 'III · Aplicaciones reales',
    titulo: 'Sintonizador de radio',
    escena: 'sintonizador',
    encuadre: { posicion: [0.5, 4.8, 8.5], objetivo: [0, 0.9, 0] },
    contenido: (
      <>
        <Formula latex="f_0 = \frac{1}{2\pi\sqrt{LC}}, \qquad Q = \frac{1}{R}\sqrt{\frac{L}{C}}, \qquad |H| = \frac{1}{\sqrt{(1-u^2)^2 + (u/Q)^2}}" bloque />
        <p>
          <b>Régimen: fuertemente subamortiguado (Q alto).</b> Al girar el capacitor variable cambia C y, con ella, f₀. Solo la emisora cuya frecuencia coincide con
          la resonancia se amplifica.
        </p>
        <p className="texto-2">Las barras son |H| calculado para cada frecuencia; u = ω/ω₀.</p>
      </>
    ),
  },
  {
    id: 'cierre',
    bloque: null,
    seccion: 'Conclusión · Todo el equipo',
    titulo: 'Matemáticas que se pueden ver',
    encuadre: { posicion: [11, 9, 11], objetivo: [0, 0.3, 0] },
    autoRotar: true,
    velocidadGiro: 0.0012,
    preset: 'subamortiguado',
    ejecutar: true,
    contenido: (
      <>
        <p>
          Cada animación proviene de la solución de <Formula latex="L\,q'' + R\,q' + q/C = E(t)" />. Cambiar un parámetro cambia a la vez los cálculos, la
          clasificación, las gráficas y la escena 3D.
        </p>
        <div className="creditos">
          {BLOQUES.map((b) => (
            <div key={b.integrante} className="creditos__fila">
              <span className="creditos__numero mono">{b.numero}</span>
              <span className="creditos__nombre">{b.integrante}</span>
              <span className="creditos__rol">{b.conclusion}</span>
            </div>
          ))}
        </div>
        <p className="creditos__pie">
          Gracias · Prof. {EQUIPO.profesor} · {EQUIPO.asignatura}
        </p>
      </>
    ),
  },
];
