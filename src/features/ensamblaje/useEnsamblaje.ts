import { create } from 'zustand';
import {
  analizarCircuito,
  circuitoEjemplo,
  FILAS,
  huecosOcupados,
  leerHueco,
  simularCircuito,
  terminalesPara,
  idHueco,
  type AnalisisCircuito,
  type Orientacion,
  type Pieza,
  type ResultadoSimulacion,
  type TipoPieza,
} from '@/engine';
import { escribir, leer } from '@/services/almacenamiento';

export type TipoComponente = Exclude<TipoPieza, 'cable'>;

export type Herramienta =
  | { modo: 'seleccionar' }
  | { modo: 'colocar'; tipo: TipoComponente }
  | { modo: 'cable'; inicio: string | null };

export interface DefinicionComponente {
  nombre: string;
  simbolo: string;
  unidad: string;
  /** Factor de la unidad mostrada a SI (µF → F). */
  factor: number;
  minimo: number;
  maximo: number;
  paso: number;
  defecto: number;
  descripcion: string;
}

export const COMPONENTES: Record<TipoComponente, DefinicionComponente> = {
  fuente: { nombre: 'Fuente DC', simbolo: 'E', unidad: 'V', factor: 1, minimo: 1, maximo: 24, paso: 0.5, defecto: 12, descripcion: 'Batería ideal. El terminal izquierdo (rojo) es el positivo.' },
  resistor: { nombre: 'Resistor', simbolo: 'R', unidad: 'Ω', factor: 1, minimo: 1, maximo: 1000, paso: 1, defecto: 10, descripcion: 'Disipa energía; controla el amortiguamiento α = R/2L.' },
  inductor: { nombre: 'Inductor', simbolo: 'L', unidad: 'H', factor: 1, minimo: 0.01, maximo: 5, paso: 0.01, defecto: 0.5, descripcion: 'Bobina: se opone a los cambios de corriente.' },
  capacitor: { nombre: 'Capacitor', simbolo: 'C', unidad: 'µF', factor: 1e-6, minimo: 10, maximo: 10000, paso: 10, defecto: 1000, descripcion: 'Almacena carga. Varios en serie: 1/C = Σ1/Cᵢ.' },
  interruptor: { nombre: 'Interruptor', simbolo: 'S', unidad: '', factor: 1, minimo: 0, maximo: 0, paso: 0, defecto: 0, descripcion: 'Cerrado conduce como un cable; abierto corta el lazo.' },
};

export const COLORES_CABLE = ['#e0b028', '#d64545', '#2f7de1', '#2aa86b', '#9b59d0', '#f2f2f2'];

interface EstadoEnsamblaje {
  piezas: Pieza[];
  seleccion: string | null;
  herramienta: Herramienta;
  orientacion: Orientacion;
  huecoActivo: string | null;
  arrastrando: string | null;
  verConexiones: boolean;
  verRedes: boolean;
  analisis: AnalisisCircuito;
  resultado: ResultadoSimulacion | null;
  tiempo: number;
  reproduciendo: boolean;
  colorCable: number;

  establecerHerramienta: (herramienta: Herramienta) => void;
  establecerHueco: (hueco: string | null) => void;
  clicEnHueco: (hueco: string) => void;
  colocar: (tipo: TipoComponente, ancla: string) => boolean;
  iniciarArrastre: (id: string) => void;
  soltar: (hueco: string | null) => void;
  seleccionar: (id: string | null) => void;
  rotar: () => void;
  eliminar: (id?: string) => void;
  actualizarPieza: (id: string, cambios: Partial<Pieza>) => void;
  limpiar: () => void;
  cargarEjemplo: () => void;
  alternar: (clave: 'verConexiones' | 'verRedes') => void;
  reproducir: () => void;
  pausar: () => void;
  avanzarReloj: (segundos: number) => void;
}

const CLAVE = 'ensamblaje';
/** Segundos reales que dura la reproducción completa de la respuesta. */
const DURACION_REPRODUCCION = 8;

function cargar(): Pieza[] {
  const guardadas = leer<Pieza[] | null>(CLAVE, null);
  return Array.isArray(guardadas) && guardadas.every((p) => leerHueco(p.terminales?.[0]) && leerHueco(p.terminales?.[1])) ? guardadas : circuitoEjemplo();
}

let contador = Date.now() % 100000;
const nuevoId = (tipo: TipoPieza) => `${tipo}-${++contador}`;

/** Orientación de una pieza a partir de sus terminales. */
export function orientacionDe(pieza: Pieza): Orientacion {
  return leerHueco(pieza.terminales[0])!.fila === leerHueco(pieza.terminales[1])!.fila ? 'horizontal' : 'vertical';
}

/** Traslada los dos terminales de una pieza para que el primero quede en `ancla`. */
function trasladar(pieza: Pieza, ancla: string): [string, string] | null {
  const origen = leerHueco(pieza.terminales[0])!;
  const destino = leerHueco(ancla);
  const otro = leerHueco(pieza.terminales[1])!;
  if (!destino) return null;
  const dFila = FILAS.indexOf(destino.fila) - FILAS.indexOf(origen.fila);
  const dColumna = destino.columna - origen.columna;
  const fila = FILAS[FILAS.indexOf(otro.fila) + dFila];
  const columna = otro.columna + dColumna;
  if (!fila || columna < 1 || columna > 30) return null;
  return [ancla, idHueco(fila, columna)];
}

function recalcular(piezas: Pieza[]) {
  const analisis = analizarCircuito(piezas);
  const resultado = analisis.parametros ? simularCircuito(analisis.parametros) : null;
  escribir(CLAVE, piezas);
  return { piezas, analisis, resultado, tiempo: 0, reproduciendo: Boolean(resultado) };
}

export function terminalesValidos(piezas: Pieza[], terminales: [string, string] | null, excepto?: string): boolean {
  if (!terminales) return false;
  const ocupados = huecosOcupados(piezas, excepto);
  return terminales[0] !== terminales[1] && !ocupados.has(terminales[0]) && !ocupados.has(terminales[1]);
}

const iniciales = cargar();

export const useEnsamblaje = create<EstadoEnsamblaje>((set, get) => ({
  ...recalcular(iniciales),
  seleccion: null,
  herramienta: { modo: 'seleccionar' },
  orientacion: 'horizontal',
  huecoActivo: null,
  arrastrando: null,
  verConexiones: false,
  verRedes: true,
  colorCable: 0,

  establecerHerramienta: (herramienta) => set({ herramienta, seleccion: herramienta.modo === 'seleccionar' ? get().seleccion : null }),
  establecerHueco: (huecoActivo) => {
    if (huecoActivo !== get().huecoActivo) set({ huecoActivo });
  },

  clicEnHueco: (hueco) => {
    const { herramienta, piezas, colorCable } = get();
    if (herramienta.modo === 'colocar') {
      get().colocar(herramienta.tipo, hueco);
    } else if (herramienta.modo === 'cable') {
      if (!herramienta.inicio) {
        if (!huecosOcupados(piezas).has(hueco)) set({ herramienta: { modo: 'cable', inicio: hueco } });
        return;
      }
      const terminales: [string, string] = [herramienta.inicio, hueco];
      if (!terminalesValidos(piezas, terminales)) return;
      const cable: Pieza = { id: nuevoId('cable'), tipo: 'cable', valor: 0, terminales, color: COLORES_CABLE[colorCable % COLORES_CABLE.length] };
      set({ ...recalcular([...piezas, cable]), herramienta: { modo: 'cable', inicio: null }, colorCable: colorCable + 1 });
    } else {
      set({ seleccion: null });
    }
  },

  colocar: (tipo, ancla) => {
    const { piezas, orientacion } = get();
    const terminales = terminalesPara(tipo, ancla, orientacion);
    if (!terminalesValidos(piezas, terminales)) return false;
    const definicion = COMPONENTES[tipo];
    const pieza: Pieza = { id: nuevoId(tipo), tipo, valor: definicion.defecto * definicion.factor, terminales: terminales!, cerrado: tipo === 'interruptor' ? true : undefined };
    set({ ...recalcular([...piezas, pieza]), seleccion: pieza.id, herramienta: { modo: 'seleccionar' } });
    return true;
  },

  iniciarArrastre: (id) => set({ arrastrando: id, seleccion: id }),
  soltar: (hueco) => {
    const { arrastrando, piezas } = get();
    if (!arrastrando) return;
    const pieza = piezas.find((p) => p.id === arrastrando);
    const terminales = pieza && hueco ? trasladar(pieza, hueco) : null;
    if (pieza && terminales && terminalesValidos(piezas, terminales, pieza.id) && terminales[0] !== pieza.terminales[0]) {
      set({ ...recalcular(piezas.map((p) => (p.id === pieza.id ? { ...p, terminales } : p))), arrastrando: null });
    } else set({ arrastrando: null });
  },

  seleccionar: (seleccion) => set({ seleccion }),

  rotar: () => {
    const { seleccion, piezas, orientacion, herramienta } = get();
    const pieza = piezas.find((p) => p.id === seleccion);
    if (!pieza || pieza.tipo === 'cable' || herramienta.modo === 'colocar') {
      set({ orientacion: orientacion === 'horizontal' ? 'vertical' : 'horizontal' });
      return;
    }
    const nueva: Orientacion = orientacionDe(pieza) === 'horizontal' ? 'vertical' : 'horizontal';
    const terminales = terminalesPara(pieza.tipo, pieza.terminales[0], nueva);
    if (terminalesValidos(piezas, terminales, pieza.id)) set(recalcular(piezas.map((p) => (p.id === pieza.id ? { ...p, terminales: terminales! } : p))));
  },

  eliminar: (id) => {
    const objetivo = id ?? get().seleccion;
    if (!objetivo) return;
    set({ ...recalcular(get().piezas.filter((p) => p.id !== objetivo)), seleccion: null });
  },

  actualizarPieza: (id, cambios) => set(recalcular(get().piezas.map((p) => (p.id === id ? { ...p, ...cambios } : p)))),
  limpiar: () => set({ ...recalcular([]), seleccion: null }),
  cargarEjemplo: () => set({ ...recalcular(circuitoEjemplo()), seleccion: null }),
  alternar: (clave) => set({ [clave]: !get()[clave] } as Pick<EstadoEnsamblaje, typeof clave>),

  reproducir: () => {
    const { tiempo, resultado } = get();
    if (!resultado) return;
    set({ reproduciendo: true, tiempo: tiempo >= resultado.duracion ? 0 : tiempo });
  },
  pausar: () => set({ reproduciendo: false }),
  avanzarReloj: (segundos) => {
    const { reproduciendo, resultado, tiempo } = get();
    if (!reproduciendo || !resultado) return;
    const siguiente = tiempo + (segundos * resultado.duracion) / DURACION_REPRODUCCION;
    set(siguiente >= resultado.duracion ? { tiempo: resultado.duracion, reproduciendo: false } : { tiempo: siguiente });
  },
}));
