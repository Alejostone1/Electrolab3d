/**
 * Genera la guía de exposición en PDF a partir de los mismos datos que usa la
 * aplicación (bloques, diapositivas, símbolos y motor matemático).
 *
 * Uso:  npx vite-node scripts/guia/generarGuia.ts
 * Requiere Microsoft Edge o Google Chrome instalado (impresión nativa a PDF).
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import katex from 'katex';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { BLOQUES } from '@/data/exposicion';
import { EQUIPO } from '@/data/navegacion';
import { LATEX_SIMBOLO, SIMBOLOS } from '@/data/simbolos';
import { CONDICIONES_INICIALES_REPOSO, generarProcedimiento, obtenerPreset, PRESETS, simularCircuito } from '@/engine';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const f = (latex: string, bloque = false) => katex.renderToString(latex, { displayMode: bloque, throwOnError: false, strict: 'ignore' });
const F = (latex: string) => f(latex, true);

/* ─────────────── Guion por diapositiva (debe coincidir con diapositivas.tsx) ─────────────── */
interface Guion {
  id: string;
  titulo: string;
  bloque: 0 | 1 | 2 | null;
  decir: string;
  formulas?: string[];
  animacion: string;
}

const GUION: Guion[] = [
  {
    id: 'portada',
    titulo: 'ELECTROLAB 3D',
    bloque: 0,
    decir: 'Presentar el proyecto, al equipo y al profesor. Explicar que ELECTROLAB 3D es un laboratorio virtual donde cada animación sale de la solución de una ecuación diferencial.',
    animacion: 'El circuito 3D gira lentamente con la simulación subamortiguada en marcha.',
  },
  {
    id: 'capitulo-1',
    titulo: BLOQUES[0].titulo,
    bloque: 0,
    decir: 'Anunciar el capítulo I y los seis temas: circuito RLC en serie, fuente, interruptor y condiciones iniciales, resistor, inductor y capacitor.',
    animacion: 'Plano bajo del circuito con giro continuo.',
  },
  {
    id: 'que-es',
    titulo: '¿Qué es un circuito RLC en serie?',
    bloque: 0,
    decir: 'Una fuente, un resistor, un inductor y un capacitor conectados uno tras otro: la misma corriente atraviesa todos. R disipa, L almacena energía magnética, C almacena energía eléctrica.',
    formulas: ['i_R = i_L = i_C = i(t)'],
    animacion: 'Los puntos del cable son la corriente calculada: su velocidad y su sentido siguen a i(t).',
  },
  {
    id: 'fuente',
    titulo: 'La fuente de voltaje',
    bloque: 0,
    decir: 'La celda convierte energía química en eléctrica (ánodo de zinc, cátodo de MnO₂, separador). En la ecuación, E(t) es el término independiente que excita al sistema.',
    formulas: ['E(t) = V_L + V_R + V_C'],
    animacion: 'Acercamiento y despiece de la celda: carcasa, cátodo, separador, ánodo y colector rotulados.',
  },
  {
    id: 'interruptor',
    titulo: 'El interruptor y las condiciones iniciales',
    bloque: 0,
    decir: 'El interruptor se cierra en t = 0. El capacitor parte descargado y sin corriente: esas son las dos condiciones iniciales que necesita una EDO de segundo orden.',
    formulas: ["q(0) = 0, \\quad i(0) = q'(0) = 0"],
    animacion: 'La cuchilla baja y cierra el circuito.',
  },
  {
    id: 'resistor',
    titulo: 'El resistor: donde la energía se vuelve calor',
    bloque: 0,
    decir: 'Núcleo cerámico con película de carbón en espiral; las bandas codifican el valor. Cumple la ley de Ohm y disipa P = Ri². R aparece en α = R/2L y es la responsable del amortiguamiento.',
    formulas: ['V_R = R\\,i', 'P_R = R\\,i^2'],
    animacion: 'Despiece del resistor; el brillo térmico es proporcional a la potencia calculada (simulación sobreamortiguada).',
  },
  {
    id: 'inductor',
    titulo: 'El inductor: inercia eléctrica',
    bloque: 0,
    decir: 'Devanado de cobre sobre núcleo de ferrita. Por la ley de Faraday-Lenz se opone a los cambios de corriente; de aquí sale la segunda derivada de la ecuación.',
    formulas: ["V_L = L\\frac{di}{dt} = L\\,q''"],
    animacion: 'Las líneas de campo magnético (ilustrativas) crecen y cambian de sentido con i(t); luego el inductor se despieza.',
  },
  {
    id: 'capacitor',
    titulo: 'El capacitor: carga acumulada',
    bloque: 0,
    decir: 'Dos placas separadas por un dieléctrico. Su carga q(t) es la incógnita de la EDO. Cerrar el bloque con la conclusión y ceder la palabra a Alejandro.',
    formulas: ['V_C = \\frac{q}{C}', 'i = \\frac{dq}{dt}'],
    animacion: 'Rayos X y despiece del capacitor; el número de cargas rojas y azules es proporcional a q(t).',
  },
  {
    id: 'capitulo-2',
    titulo: BLOQUES[1].titulo,
    bloque: 1,
    decir: 'Anunciar el capítulo II: vamos a convertir lo que hace el circuito en una ecuación y a resolverla paso a paso, sin saltarnos nada.',
    animacion: 'Vista cenital del circuito girando.',
  },
  {
    id: 'piezas',
    titulo: 'Las piezas de la ecuación',
    bloque: 1,
    decir: 'Leer la ecuación como una frase. q es lo que buscamos (la carga), q′ es la corriente (qué tan rápido cambia la carga), q″ es qué tan rápido cambia la corriente, L, R y C son números conocidos y E es la batería. Es de segundo orden porque aparece hasta q″.',
    formulas: ["L\\,q'' + R\\,q' + \\frac{1}{C}\\,q = E(t)"],
    animacion: 'El circuito funciona de fondo; cada término se puede tocar para ver su significado.',
  },
  {
    id: 'kirchhoff',
    titulo: 'La regla de la malla',
    bloque: 1,
    decir: 'En palabras: todo el voltaje que pone la batería se reparte entre las tres piezas. Luego se cambia cada voltaje por su fórmula y, como la corriente es la rapidez con que cambia la carga, todo queda escrito con q.',
    formulas: ['E = V_L + V_R + V_C', "L\\,q'' + R\\,q' + \\frac{1}{C}\\,q = E(t)"],
    animacion: 'La ecuación se construye en cuatro pasos; los símbolos de cada paso caen y se acomodan. El botón «Siguiente paso» permite marcar el ritmo.',
  },
  {
    id: 'exponencial',
    titulo: 'Probamos con una exponencial',
    bloque: 1,
    decir: 'La idea clave: buscamos una función que al derivarla siga pareciéndose a sí misma. e^{rt} cumple eso: al derivar solo aparece r multiplicando. Al reemplazarla, como e^{rt} nunca es cero, queda una ecuación de segundo grado como las del colegio, con a = L, b = R y c = 1/C.',
    formulas: ['q = e^{rt}', "q' = r e^{rt},\\quad q'' = r^2 e^{rt}", 'L r^2 + R r + \\frac{1}{C} = 0'],
    animacion: 'Derivación progresiva en cuatro pasos.',
  },
  {
    id: 'discriminante',
    titulo: 'El número que decide todo',
    bloque: 1,
    decir: 'Con la fórmula general aparece una raíz cuadrada. Lo que va dentro, Δ = R² − 4L/C, decide todo: negativo oscila como un columpio, cero llega justo sin pasarse, positivo llega lento como una puerta con freno. Con R = 10 Ω da −1900, así que oscila. La frontera es R crítica ≈ 44.72 Ω.',
    formulas: ['r = \\frac{-R \\pm \\sqrt{\\Delta}}{2L}', '\\Delta = R^2 - \\frac{4L}{C}', 'R_c = 2\\sqrt{L/C} \\approx 44.72\\ \\Omega'],
    animacion: 'Cálculo con números reales y los tres casos con colores.',
  },
  {
    id: 'soluciones',
    titulo: 'Las tres respuestas posibles',
    bloque: 1,
    decir: 'El capacitor siempre termina con la misma carga, C·E₀; lo que cambia es cómo llega: oscilando, justo o lento. A y B se ajustan para que al empezar el capacitor esté vacío. El factor e^{−αt} hace que todo se apague con el tiempo.',
    formulas: ['e^{-\\alpha t}(A\\cos\\omega_d t + B\\sin\\omega_d t)', '(A + Bt)e^{-\\alpha t}', 'A e^{r_1 t} + B e^{r_2 t}'],
    animacion: 'Las tres formas aparecen con el color de cada caso.',
  },
  {
    id: 'rk4',
    titulo: 'La computadora lo comprueba',
    bloque: 1,
    decir: 'Runge-Kutta 4 divide el tiempo en pasitos pequeños; en cada uno mira cuatro veces hacia dónde va la curva y avanza con el promedio. Al compararlo con la fórmula exacta, la diferencia es diminuta. Cerrar el bloque y ceder la palabra a Sebastián.',
    formulas: ['q_{\\text{siguiente}} = q_{\\text{actual}} + h\\cdot\\tfrac{k_1 + 2k_2 + 2k_3 + k_4}{6}'],
    animacion: 'Tabla de validación calculada en vivo por el motor.',
  },
  {
    id: 'capitulo-3',
    titulo: BLOQUES[2].titulo,
    bloque: 2,
    decir: 'Anunciar el capítulo III: interpretar físicamente los tres casos y llevarlos a aplicaciones reales.',
    animacion: 'Los tres osciladores mecánicos en movimiento.',
  },
  {
    id: 'sub',
    titulo: 'Subamortiguado · R = 10 Ω',
    bloque: 2,
    decir: 'La masa (análogo de L) sobrepasa el equilibrio y oscila; la barra de energía del transitorio cae por escalones; en el cable la corriente cambia de sentido.',
    formulas: ['q(t) = CE_0\\left[1 - e^{-\\alpha t}\\left(\\cos\\omega_d t + \\tfrac{\\alpha}{\\omega_d}\\sin\\omega_d t\\right)\\right]'],
    animacion: 'Circuito + oscilador masa-resorte-amortiguador movidos por la misma simulación; registrador que dibuja q(t).',
  },
  {
    id: 'critico',
    titulo: 'Críticamente amortiguado · R ≈ 44.72 Ω',
    bloque: 2,
    decir: 'Llega al equilibrio lo más rápido posible sin sobrepasarlo; la corriente nunca cambia de sentido.',
    formulas: ['q(t) = CE_0\\left[1 - (1 + \\alpha t)e^{-\\alpha t}\\right]'],
    animacion: 'Misma escena con R crítica.',
  },
  {
    id: 'sobre',
    titulo: 'Sobreamortiguado · R = 80 Ω',
    bloque: 2,
    decir: 'El amortiguamiento es tan grande que la masa se arrastra hacia el equilibrio; el resistor brilla más.',
    formulas: ['q(t) = CE_0 + A e^{r_1 t} + B e^{r_2 t},\\quad r_1, r_2 < 0'],
    animacion: 'Misma escena con R = 80 Ω.',
  },
  {
    id: 'comparacion',
    titulo: 'Los tres regímenes, lado a lado',
    bloque: 2,
    decir: 'Misma L, C, E₀ y condiciones iniciales; solo cambia R. El crítico es el primero en estabilizarse sin sobrepaso.',
    animacion: 'Tres osciladores sincronizados con un reloj común y curvas que se dibujan.',
  },
  {
    id: 'app-suspension',
    titulo: 'Suspensión de un automóvil',
    bloque: 2,
    decir: 'Régimen subamortiguado moderado (ζ ≈ 0.2–0.4): compromiso entre confort y control. La animación es la respuesta al escalón con ζ = 0.3.',
    formulas: ["m x'' + b x' + k x = F(t)", '\\zeta = \\frac{b}{2\\sqrt{mk}}'],
    animacion: 'La rueda sube a un bordillo; la carrocería sobrepasa un poco y se asienta.',
  },
  {
    id: 'app-instrumento',
    titulo: 'Instrumentos de aguja',
    bloque: 2,
    decir: 'Los instrumentos analógicos se diseñan cerca del amortiguamiento crítico (ζ ≈ 0.7–1) para que la aguja llegue rápido a la lectura sin oscilar.',
    formulas: ["J\\theta'' + D\\theta' + \\kappa\\theta = M(t)"],
    animacion: 'Aguja roja con ζ = 1 frente a una aguja ámbar con ζ = 0.15.',
  },
  {
    id: 'app-puerta',
    titulo: 'Cierrapuertas hidráulico',
    bloque: 2,
    decir: 'Régimen sobreamortiguado: el aceite que pasa por un orificio estrecho frena la puerta para que cierre despacio y sin golpear.',
    animacion: 'La puerta se cierra lentamente con ζ = 2.5.',
  },
  {
    id: 'app-radio',
    titulo: 'Sintonizador de radio',
    bloque: 2,
    decir: 'Circuito fuertemente subamortiguado (Q alto). El capacitor variable cambia f₀; solo se amplifica la emisora en resonancia.',
    formulas: ['f_0 = \\frac{1}{2\\pi\\sqrt{LC}}', 'Q = \\frac{1}{R}\\sqrt{\\frac{L}{C}}'],
    animacion: 'Las barras son |H| calculado para cada frecuencia; se enciende la antena sintonizada.',
  },
  {
    id: 'cierre',
    titulo: 'Matemáticas que se pueden ver',
    bloque: null,
    decir: 'Cierre conjunto: cada integrante resume su conclusión en una frase y se agradece al profesor.',
    animacion: 'Vista general del circuito girando.',
  },
];

// Verificación: el guion debe tener exactamente las diapositivas de la aplicación, en el mismo orden.
const fuente = readFileSync(resolve(raiz, 'src/features/presentacion/diapositivas.tsx'), 'utf-8');
const idsApp = [...fuente.matchAll(/^\s{4}id: '([^']+)'/gm)].map((m) => m[1]);
if (idsApp.join() !== GUION.map((g) => g.id).join()) {
  throw new Error(`El guion no coincide con la presentación.\nApp: ${idsApp.join(', ')}\nGuía: ${GUION.map((g) => g.id).join(', ')}`);
}

/* ─────────────── Datos calculados con el motor ─────────────── */
const sub = obtenerPreset('subamortiguado').parametros;
const pasos = generarProcedimiento(sub, CONDICIONES_INICIALES_REPOSO);
const validacion = PRESETS.map((p) => {
  const r = simularCircuito(p.parametros);
  return {
    nombre: p.nombre,
    R: p.parametros.resistencia,
    zeta: r.derivados.relacionAmortiguamiento,
    ts: r.tiempoEstabilizacion,
    sobrepaso: r.sobrepaso,
    error: Math.max(r.errorNumerico!.carga / r.cargaReferencia, r.errorNumerico!.corriente / r.corrienteMaxima),
  };
});

/* ─────────────── Contenido ─────────────── */
const PREGUNTAS: Array<[string, string]> = [
  ['¿Por qué la ecuación es de segundo orden?', 'Porque el inductor aporta un voltaje proporcional a di/dt, y como i = dq/dt, aparece la segunda derivada de la carga. Sin inductor la ecuación sería de primer orden.'],
  ['¿Qué significa físicamente ζ?', 'Compara la rapidez con que se disipa la energía (α = R/2L) con la rapidez natural de intercambio entre L y C (ω₀). Es adimensional; decide si hay oscilación.'],
  ['¿Por qué R = 44.72 Ω y no 44.7213…?', '44.72 Ω es el valor redondeado de 2√(L/C) = 2√(0.5/0.001). El motor clasifica con una tolerancia sobre |ζ − 1| para no declarar subamortiguado un valor que solo difiere por redondeo.'],
  ['¿Qué pasa si R = 0?', 'α = 0 y las raíces son imaginarias puras ±iω₀: la oscilación no decae (caso ideal sin pérdidas). En la estación de ensamblaje se advierte esta situación.'],
  ['¿Por qué la carga final es C·E₀?', 'En régimen permanente las derivadas se anulan: L·0 + R·0 + q/C = E₀, luego q = CE₀. La corriente se hace cero porque el capacitor bloquea la corriente continua.'],
  ['¿Cómo saben que el resultado numérico es correcto?', `Se compara RK4 con la solución analítica en los tres casos: el error relativo máximo es del orden de ${validacion.map((v) => v.error.toExponential(0)).join(', ')}. Además se verifican Kirchhoff, i = dq/dt, el balance de energía, la estabilidad del método y la topología de la protoboard en 55 pruebas automáticas.`],
  ['¿Por qué usar RK4 si hay solución analítica?', 'La solución cerrada solo está implementada para fuente constante. Para pulsos, ondas cuadradas o sinusoidales se necesita un método numérico; RK4 es de cuarto orden y estable con el paso automático elegido.'],
  ['¿Las líneas de campo son una simulación electromagnética?', 'No. Son representaciones ilustrativas cuya intensidad sigue a i(t) (campo magnético) y a q(t) (campo eléctrico). Las magnitudes eléctricas sí son exactas.'],
  ['¿Por qué el crítico se estabiliza antes que el sobreamortiguado?', `En el sobreamortiguado domina la raíz más cercana a cero, que es más lenta que −α del caso crítico. Con los presets: crítico ≈ ${(validacion[1].ts! * 1000).toFixed(0)} ms y sobreamortiguado ≈ ${(validacion[2].ts! * 1000).toFixed(0)} ms.`],
  ['¿Por qué una suspensión no es críticamente amortiguada?', 'Porque se prioriza el confort: un amortiguamiento alto transmite los golpes del camino a la carrocería. Se acepta un pequeño sobrepaso (ζ ≈ 0.2–0.4).'],
  ['¿Qué limita a la estación de ensamblaje?', 'Resuelve un único lazo en serie con una fuente, al menos un inductor y un capacitor. Detecta y explica cortocircuitos, terminales abiertos, ramas en paralelo y circuitos de primer orden (RC, RL).'],
  ['¿Qué es la analogía mecánica?', 'm x″ + b x′ + k x = F(t) tiene la misma forma: m ↔ L, b ↔ R, k ↔ 1/C, x ↔ q, F ↔ E. Por eso el oscilador 3D se mueve con la misma solución.'],
];

const RECOMENDACIONES = [
  'Ensayar con el modo presentación en pantalla completa (tecla F11 o el botón correspondiente) y avanzar con las flechas del teclado.',
  'Cada integrante debe poder tocar cualquier variable de sus fórmulas y explicar su significado y unidad, porque el profesor puede preguntarlo.',
  'Usar la tecla H para ocultar el texto cuando se quiera que el público mire solo la escena 3D.',
  'En las diapositivas de componentes, esperar a que el despiece termine antes de nombrar las partes.',
  'Tener abierto el laboratorio en otra pestaña para responder preguntas cambiando R en vivo (prueba definitiva del proyecto).',
  'Respetar los tiempos: ≈ 5 min, ≈ 5 min y ≈ 6 min. Las transiciones están escritas al final de cada bloque.',
];

const VARIABLES = ['L', 'R', 'C', 'q', 'i', 'E', 'E0', 't', 'α', 'ω0', 'ωd', 'ζ', 'Rc', 'Δ', 'r', 'A', 'B', 'qp', 'qh', 'Q', 'τ', 'h', 'kRK', 'x1', 'x2'];

/* ─────────────── HTML ─────────────── */
const bloqueHTML = (indice: 0 | 1 | 2) => {
  const b = BLOQUES[indice];
  const diapositivas = GUION.map((g, k) => ({ ...g, numero: k + 1 })).filter((g) => g.bloque === indice);
  return `
  <section class="bloque salto">
    <div class="bloque__cabecera">
      <span class="bloque__numero" style="color:${b.color}">${b.numero}</span>
      <div>
        <p class="antetitulo">Bloque ${b.numero} · ${b.duracion}</p>
        <h2>${b.integrante}</h2>
        <p class="bloque__titulo">${b.titulo}</p>
      </div>
    </div>
    <h3>Introducción</h3>
    <p>${b.enfoque}</p>
    <h3>Conceptos que debe explicar</h3>
    <ul>${b.temas.map((t) => `<li>${t}</li>`).join('')}</ul>
    <h3>Fórmulas que debe dominar</h3>
    <div class="formulas">${b.formulas.map(F).join('')}</div>
    <h3>Diapositivas a su cargo</h3>
    ${diapositivas
      .map(
        (d) => `
      <div class="diapositiva">
        <p class="diapositiva__numero">Diapositiva ${d.numero}</p>
        <h4>${d.titulo}</h4>
        <p><b>Qué decir.</b> ${d.decir}</p>
        ${d.formulas ? `<div class="formulas">${d.formulas.map(F).join('')}</div>` : ''}
        <p class="nota"><b>En pantalla.</b> ${d.animacion}</p>
      </div>`,
      )
      .join('')}
    <h3>Conclusión del bloque</h3>
    <p>${b.conclusion}</p>
    <p class="transicion"><b>Transición.</b> ${b.transicion}</p>
  </section>`;
};

const css = readFileSync(resolve(raiz, 'node_modules/katex/dist/katex.min.css'), 'utf-8').replace(
  /url\(fonts\//g,
  `url(${pathToFileURL(resolve(raiz, 'node_modules/katex/dist/fonts')).href}/`,
);

const fecha = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Guía de exposición · ELECTROLAB 3D</title>
<style>${css}
@page { size: A4; margin: 22mm 18mm 20mm 18mm;
  @top-left { content: 'ELECTROLAB 3D · Guía de exposición'; font: 7pt 'Segoe UI', sans-serif; color: #6b7c8f; }
  @top-right { content: 'Matemáticas IV'; font: 7pt 'Segoe UI', sans-serif; color: #6b7c8f; }
  @bottom-right { content: 'Página ' counter(page) ' de ' counter(pages); font: 7pt 'Segoe UI', sans-serif; color: #6b7c8f; }
}
@page :first { @top-left { content: none; } @top-right { content: none; } @bottom-right { content: none; } }
* { box-sizing: border-box; }
body { font-family: 'Segoe UI', Inter, Arial, sans-serif; color: #14202e; font-size: 10.5pt; line-height: 1.55; margin: 0; }
h1, h2, h3, h4 { font-family: 'Segoe UI Semibold', 'Segoe UI', sans-serif; font-weight: 600; color: #0b1624; margin: 0; }
h2 { font-size: 20pt; letter-spacing: -0.01em; }
h3 { font-size: 11pt; margin: 16pt 0 6pt; color: #0e7490; text-transform: uppercase; letter-spacing: 0.06em; }
h4 { font-size: 12pt; margin: 2pt 0 4pt; }
p { margin: 0 0 7pt; }
ul, ol { margin: 0 0 8pt; padding-left: 16pt; }
li { margin-bottom: 3pt; }
.salto { page-break-before: always; }
.portada { height: 250mm; display: flex; flex-direction: column; justify-content: space-between; border-left: 3pt solid #0891b2; padding: 6mm 0 0 10mm; }
.portada .antetitulo { margin-top: 18mm; }
.portada h1 { font-size: 46pt; letter-spacing: 0.02em; line-height: 1; margin: 6mm 0 4mm; }
.portada h1 span { color: #0891b2; }
.portada .subtitulo { font-size: 15pt; color: #3c4d61; max-width: 140mm; }
.creditos { border-top: 0.8pt solid #9fb0c2; }
.creditos div { display: grid; grid-template-columns: 14mm 1fr; padding: 3.2mm 0; border-bottom: 0.5pt solid #d3dbe4; }
.creditos .num { color: #0891b2; font-family: Consolas, monospace; }
.creditos strong { font-size: 13pt; display: block; }
.creditos em { font-style: normal; color: #4a5a6c; }
.pie-portada { font-size: 10pt; color: #3c4d61; }
.antetitulo { font-family: Consolas, monospace; font-size: 8.5pt; letter-spacing: 0.14em; text-transform: uppercase; color: #0891b2; margin: 0; }
.seccion { margin-bottom: 8pt; }
.seccion > h2 { border-bottom: 0.8pt solid #9fb0c2; padding-bottom: 4pt; margin-bottom: 10pt; font-size: 17pt; }
table { width: 100%; border-collapse: collapse; margin: 4pt 0 10pt; font-size: 9.5pt; }
th, td { text-align: left; padding: 4pt 5pt; border-bottom: 0.5pt solid #d3dbe4; vertical-align: top; }
th { color: #4a5a6c; font-weight: 600; border-bottom: 0.8pt solid #9fb0c2; }
.bloque__cabecera { display: grid; grid-template-columns: 26mm 1fr; align-items: end; border-bottom: 0.8pt solid #9fb0c2; padding-bottom: 6pt; }
.bloque__numero { font-size: 54pt; line-height: 0.9; color: #0891b2; font-weight: 600; }
.bloque__titulo { font-size: 12pt; color: #3c4d61; margin: 2pt 0 0; }
.diapositiva { border-left: 2pt solid #0891b2; padding: 2pt 0 2pt 9pt; margin: 9pt 0; page-break-inside: avoid; }
.diapositiva__numero { font-family: Consolas, monospace; font-size: 8pt; color: #6b7c8f; margin: 0; }
.formulas .katex-display { margin: 4pt 0; }
.formulas { background: #f2f6fa; border-radius: 4pt; padding: 2pt 8pt; margin: 4pt 0 8pt; }
.nota { color: #4a5a6c; font-size: 9.5pt; }
.transicion { border-top: 0.5pt solid #d3dbe4; padding-top: 6pt; color: #0e7490; }
.paso { page-break-inside: avoid; margin-bottom: 8pt; }
.paso h4 span { color: #0891b2; font-family: Consolas, monospace; margin-right: 6pt; }
.pregunta { page-break-inside: avoid; margin-bottom: 8pt; }
.pregunta p:first-child { font-weight: 600; margin-bottom: 2pt; }
.simbolo { font-family: KaTeX_Math, 'Times New Roman', serif; font-style: italic; font-size: 12pt; color: #0e7490; }
.dos { columns: 2; column-gap: 8mm; }
.punto { display: inline-block; width: 8pt; height: 8pt; border-radius: 50%; margin-right: 5pt; vertical-align: middle; }
</style></head><body>

<section class="portada">
  <div>
    <p class="antetitulo">${EQUIPO.tipo} · ${EQUIPO.asignatura}</p>
    <h1>ELECTROLAB <span>3D</span></h1>
    <p class="subtitulo">Guía de exposición: circuitos RLC en serie y ecuaciones diferenciales lineales de segundo orden</p>
  </div>
  <div class="creditos">
    ${BLOQUES.map((b) => `<div><span class="num"><i class="punto" style="background:${b.color}"></i>${b.numero}</span><span><strong>${b.integrante}</strong><em>${b.titulo}</em></span></div>`).join('')}
  </div>
  <p class="pie-portada">${EQUIPO.programa} · ${EQUIPO.semestre}<br>Profesor ${EQUIPO.profesor}<br>${fecha}</p>
</section>

<section class="seccion salto">
  <p class="antetitulo">1 · Proyecto</p>
  <h2>Título y objetivo de la exposición</h2>
  <p><b>ELECTROLAB 3D — Laboratorio virtual interactivo de circuitos RLC y ecuaciones diferenciales de segundo orden.</b></p>
  <p>El objetivo de la exposición es demostrar que la ecuación ${f("L\\,q'' + R\\,q' + \\tfrac{1}{C}q = E(t)")} describe con exactitud el comportamiento de un circuito RLC en serie, que su solución depende del tipo de raíces de la ecuación característica y que los tres regímenes de amortiguamiento aparecen en sistemas reales de ingeniería.</p>
  <p>La aplicación conecta cada componente 3D, cada gráfica y cada indicador con el mismo resultado del motor matemático: cambiar un parámetro cambia simultáneamente los cálculos, la clasificación, las gráficas y la animación.</p>

  <h2 style="margin-top:14pt">Integrantes y distribución</h2>
  <table>
    <thead><tr><th>Bloque</th><th>Integrante</th><th>Tema</th><th>Diapositivas</th><th>Tiempo</th></tr></thead>
    <tbody>
    ${BLOQUES.map((b, k) => {
      const numeros = GUION.map((g, i) => (g.bloque === k ? i + 1 : null)).filter(Boolean) as number[];
      return `<tr><td><i class="punto" style="background:${b.color}"></i>${b.numero}</td><td>${b.integrante}</td><td>${b.titulo}</td><td>${numeros[0]}–${numeros[numeros.length - 1]}</td><td>${b.duracion}</td></tr>`;
    }).join('')}
    <tr><td>—</td><td>Todo el equipo</td><td>Conclusión</td><td>${GUION.length}</td><td>≈ 1 min</td></tr>
    </tbody>
  </table>
  <p class="nota">La distribución sigue la continuidad conceptual: física de los componentes → modelo matemático → interpretación y aplicaciones. En la presentación cada diapositiva muestra un punto del color del integrante que la expone (en el cierre aparecen los tres). El bloque matemático está dividido en pasos pequeños y explicados en palabras sencillas.</p>
</section>

${bloqueHTML(0)}
${bloqueHTML(1)}
${bloqueHTML(2)}

<section class="seccion salto">
  <p class="antetitulo">2 · Fundamento</p>
  <h2>Conceptos y fórmulas relevantes</h2>
  <h3>Ley de Kirchhoff y caídas de voltaje</h3>
  ${F('E(t) = V_L + V_R + V_C, \\qquad V_L = L\\frac{di}{dt},\\quad V_R = R\\,i,\\quad V_C = \\frac{q}{C}')}
  <h3>Parámetros derivados</h3>
  ${F('\\omega_0 = \\frac{1}{\\sqrt{LC}},\\qquad \\alpha = \\frac{R}{2L},\\qquad \\zeta = \\frac{\\alpha}{\\omega_0},\\qquad R_c = 2\\sqrt{\\frac{L}{C}},\\qquad \\omega_d = \\sqrt{\\omega_0^2 - \\alpha^2}')}
  <h3>Energía</h3>
  ${F('E_L = \\tfrac{1}{2}L i^2,\\qquad E_C = \\frac{q^2}{2C},\\qquad P_R = R\\,i^2')}
  <p>Con fuente constante, en régimen permanente la mitad de la energía entregada por la fuente queda almacenada en el capacitor y la otra mitad se disipa en el resistor, independientemente de R (verificado en las pruebas).</p>
  <h3>Clasificación</h3>
  <table>
    <thead><tr><th>Condición</th><th>Raíces</th><th>Régimen</th><th>Comportamiento</th></tr></thead>
    <tbody>
      <tr><td>${f('\\zeta < 1')}</td><td>Complejas conjugadas</td><td>Subamortiguado</td><td>Oscila con amplitud decreciente</td></tr>
      <tr><td>${f('\\zeta = 1')}</td><td>Real repetida</td><td>Crítico</td><td>Equilibrio más rápido sin oscilar</td></tr>
      <tr><td>${f('\\zeta > 1')}</td><td>Reales distintas</td><td>Sobreamortiguado</td><td>Aproximación lenta y monótona</td></tr>
    </tbody>
  </table>
  <h3>Resultados del motor con los presets (L = 0.5 H, C = 1000 µF, E₀ = 12 V)</h3>
  <table>
    <thead><tr><th>Régimen</th><th>R (Ω)</th><th>ζ</th><th>Sobrepaso</th><th>t de estabilización (2 %)</th><th>Error RK4</th></tr></thead>
    <tbody>${validacion
      .map(
        (v) =>
          `<tr><td>${v.nombre}</td><td>${v.R.toFixed(2)}</td><td>${v.zeta.toFixed(3)}</td><td>${v.sobrepaso!.toFixed(1)} %</td><td>${(v.ts! * 1000).toFixed(0)} ms</td><td>${v.error.toExponential(1)}</td></tr>`,
      )
      .join('')}</tbody>
  </table>
</section>

<section class="seccion salto">
  <p class="antetitulo">3 · Glosario</p>
  <h2>Significado de las variables y unidades</h2>
  <table>
    <thead><tr><th>Símbolo</th><th>Nombre</th><th>Unidad</th><th>Significado</th></tr></thead>
    <tbody>${VARIABLES.map((clave) => {
      const s = SIMBOLOS[clave];
      return `<tr><td>${f(LATEX_SIMBOLO[clave] ?? s.simbolo)}</td><td>${s.nombre}</td><td>${s.unidad ?? 'adimensional / depende del contexto'}</td><td>${s.descripcion.join(' ')}</td></tr>`;
    }).join('')}</tbody>
  </table>
  <h3>Unidades del Sistema Internacional</h3>
  <table>
    <thead><tr><th>Magnitud</th><th>Unidad</th><th>Equivalencia</th></tr></thead>
    <tbody>
      <tr><td>Carga</td><td>culombio (C)</td><td>A·s</td></tr>
      <tr><td>Corriente</td><td>amperio (A)</td><td>C/s</td></tr>
      <tr><td>Voltaje</td><td>voltio (V)</td><td>J/C</td></tr>
      <tr><td>Resistencia</td><td>ohmio (Ω)</td><td>V/A</td></tr>
      <tr><td>Inductancia</td><td>henrio (H)</td><td>V·s/A</td></tr>
      <tr><td>Capacitancia</td><td>faradio (F)</td><td>C/V</td></tr>
      <tr><td>Potencia</td><td>vatio (W)</td><td>J/s</td></tr>
      <tr><td>Frecuencia angular</td><td>rad/s</td><td>—</td></tr>
    </tbody>
  </table>
</section>

<section class="seccion salto">
  <p class="antetitulo">4 · Desarrollo matemático</p>
  <h2>Resolución completa del caso subamortiguado</h2>
  <p>Procedimiento generado por el motor de ELECTROLAB 3D con L = ${sub.inductancia} H, R = ${sub.resistencia} Ω, C = ${sub.capacitancia} F y E₀ = ${sub.fuente.amplitud} V. Es el mismo que muestra el Centro matemático.</p>
  ${pasos
    .map(
      (p) => `<div class="paso"><h4><span>${String(p.numero).padStart(2, '0')}</span>${p.titulo}</h4>
      <p><b>Operación:</b> ${p.operacion}. ${p.explicacion}</p>
      <div class="formulas">${p.formulas.map(F).join('')}</div>
      <p class="nota"><b>¿Por qué?</b> ${p.justificacion}</p></div>`,
    )
    .join('')}
</section>

<section class="seccion salto">
  <p class="antetitulo">5 · Ingeniería</p>
  <h2>Aplicaciones reales</h2>
  <table>
    <thead><tr><th>Aplicación</th><th>Régimen</th><th>Justificación</th></tr></thead>
    <tbody>
      <tr><td>Suspensión automotriz</td><td>Subamortiguado (ζ ≈ 0.2–0.4)</td><td>Compromiso entre confort (amortiguamiento bajo) y control (poco rebote).</td></tr>
      <tr><td>Instrumentos de aguja</td><td>Cercano al crítico (ζ ≈ 0.7–1)</td><td>La aguja debe llegar rápido a la lectura sin oscilar alrededor de ella.</td></tr>
      <tr><td>Cierrapuertas hidráulico</td><td>Sobreamortiguado (ζ &gt; 1)</td><td>La puerta debe cerrar despacio y sin golpear ni rebotar.</td></tr>
      <tr><td>Sintonizador de radio</td><td>Subamortiguado con Q alto</td><td>La resonancia aguda selecciona una sola emisora: f₀ = 1/(2π√(LC)).</td></tr>
    </tbody>
  </table>
  <p>Analogía mecánica: ${f("m x'' + b x' + k x = F(t)")} con m ↔ L, b ↔ R, k ↔ 1/C, x ↔ q y F ↔ E. La relación de amortiguamiento mecánica es ${f('\\zeta = b/(2\\sqrt{mk})')}.</p>
</section>

<section class="seccion salto">
  <p class="antetitulo">6 · Defensa</p>
  <h2>Preguntas probables y respuestas</h2>
  ${PREGUNTAS.map(([p, r]) => `<div class="pregunta"><p>${p}</p><p>${r}</p></div>`).join('')}

  <h2 style="margin-top:14pt">Recomendaciones para la sustentación</h2>
  <ol>${RECOMENDACIONES.map((r) => `<li>${r}</li>`).join('')}</ol>

  <h2 style="margin-top:14pt">Conclusión</h2>
  <p>ELECTROLAB 3D muestra que una ecuación diferencial lineal de segundo orden con coeficientes constantes no es solo un ejercicio algebraico: describe la carga, la corriente, la energía y el calor de un circuito real. El tipo de raíces de la ecuación característica decide si el sistema oscila, llega al equilibrio lo más rápido posible o se aproxima lentamente, y esa misma decisión es la que toman los ingenieros al diseñar suspensiones, instrumentos, mecanismos y circuitos de comunicaciones.</p>
</section>
</body></html>`;

const salida = resolve(raiz, 'docs/pdf');
mkdirSync(salida, { recursive: true });
const rutaHtml = resolve(raiz, 'docs/pdf/.guia.html');
writeFileSync(rutaHtml, html, 'utf-8');

const candidatos = [
  process.env.NAVEGADOR,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter((ruta): ruta is string => Boolean(ruta && existsSync(ruta)));
if (!candidatos.length) throw new Error('No se encontró Edge ni Chrome. Define NAVEGADOR con la ruta del ejecutable.');
const destino = resolve(salida, 'Guia_Exposicion_ELECTROLAB3D.pdf');
const ejecucion = spawnSync(
  candidatos[0],
  ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${destino}`, '--virtual-time-budget=8000', pathToFileURL(rutaHtml).href],
  { stdio: 'inherit', timeout: 120000 },
);
if (ejecucion.status !== 0 || !existsSync(destino)) throw new Error('La impresión a PDF falló.');
console.log(`PDF generado en ${destino}`);
