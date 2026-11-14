/**
 * Modelo eléctrico de una protoboard y análisis topológico de lo que se arma en ella.
 *
 * Geometría (como una protoboard real de media placa):
 *  - 30 columnas numeradas 1…30.
 *  - Bloque superior a–e y bloque inferior f–j: en cada columna las cinco perforaciones
 *    de un bloque están unidas por una tira metálica interna. El canal central separa los bloques.
 *  - Cuatro rieles de alimentación (X+, X−, Y+, Y−) que recorren toda la placa.
 *
 * El análisis convierte piezas y cables en un grafo de nodos eléctricos y decide si
 * forman un único lazo en serie compatible con el modelo  L q'' + R q' + q/C = E.
 */
import { FUENTE_POR_DEFECTO } from '../electrical/parametros';
import type { ParametrosCircuito } from '../electrical/tipos';

export const COLUMNAS = 30;
export const FILAS_SUPERIORES = ['a', 'b', 'c', 'd', 'e'] as const;
export const FILAS_INFERIORES = ['f', 'g', 'h', 'i', 'j'] as const;
export const RIELES = ['X+', 'X-', 'Y+', 'Y-'] as const;
export const FILAS = ['X+', 'X-', ...FILAS_SUPERIORES, ...FILAS_INFERIORES, 'Y+', 'Y-'] as const;
export type Fila = (typeof FILAS)[number];

/** Coordenada Z (en pasos de 2.54 mm) de cada fila, con el canal central entre e y f. */
export const Z_FILA: Record<Fila, number> = {
  'X+': -8.2,
  'X-': -7.2,
  a: -5,
  b: -4,
  c: -3,
  d: -2,
  e: -1,
  f: 1,
  g: 2,
  h: 3,
  i: 4,
  j: 5,
  'Y+': 7.2,
  'Y-': 8.2,
};

export interface Hueco {
  fila: Fila;
  columna: number;
}

export function idHueco(fila: Fila, columna: number): string {
  return `${fila}${columna}`;
}

export function leerHueco(id: string): Hueco | null {
  const coincidencia = /^(X\+|X-|Y\+|Y-|[a-j])(\d{1,2})$/.exec(id);
  if (!coincidencia) return null;
  const columna = Number(coincidencia[2]);
  if (columna < 1 || columna > COLUMNAS) return null;
  return { fila: coincidencia[1] as Fila, columna };
}

/** Posición en el plano de la placa (x, z) en pasos; el origen es el centro. */
export function posicionHueco(id: string): [number, number] {
  const hueco = leerHueco(id)!;
  return [hueco.columna - (COLUMNAS + 1) / 2, Z_FILA[hueco.fila]];
}

/** Tira metálica interna a la que pertenece una perforación. */
export function tiraInterna(id: string): string {
  const hueco = leerHueco(id)!;
  if ((RIELES as readonly string[]).includes(hueco.fila)) return `riel ${hueco.fila}`;
  return (FILAS_SUPERIORES as readonly string[]).includes(hueco.fila) ? `col ${hueco.columna} (a–e)` : `col ${hueco.columna} (f–j)`;
}

/** Todas las perforaciones conectadas internamente con la dada (misma tira). */
export function huecosDeTira(id: string): string[] {
  const hueco = leerHueco(id)!;
  if ((RIELES as readonly string[]).includes(hueco.fila)) return Array.from({ length: COLUMNAS }, (_, k) => idHueco(hueco.fila, k + 1));
  const bloque = (FILAS_SUPERIORES as readonly string[]).includes(hueco.fila) ? FILAS_SUPERIORES : FILAS_INFERIORES;
  return bloque.map((fila) => idHueco(fila, hueco.columna));
}

export function todosLosHuecos(): string[] {
  return FILAS.flatMap((fila) => Array.from({ length: COLUMNAS }, (_, k) => idHueco(fila, k + 1)));
}

/** Perforación más cercana a un punto del plano (en pasos), o null si está fuera. */
export function huecoMasCercano(x: number, z: number): string | null {
  const columna = Math.round(x + (COLUMNAS + 1) / 2);
  if (columna < 1 || columna > COLUMNAS) return null;
  let mejor: Fila | null = null;
  let distancia = 0.6;
  for (const fila of FILAS) {
    const d = Math.abs(Z_FILA[fila] - z);
    if (d < distancia) {
      distancia = d;
      mejor = fila;
    }
  }
  return mejor ? idHueco(mejor, columna) : null;
}

/* ─────────────────────────── Piezas ─────────────────────────── */

export type TipoPieza = 'fuente' | 'resistor' | 'capacitor' | 'inductor' | 'interruptor' | 'cable';
export type Orientacion = 'horizontal' | 'vertical';

export interface Pieza {
  id: string;
  tipo: TipoPieza;
  /** Valor en unidades SI (Ω, F, H, V). Ignorado en cables e interruptores. */
  valor: number;
  /** Perforaciones de los terminales [A, B]. En la fuente, A es el borne positivo. */
  terminales: [string, string];
  cerrado?: boolean;
  color?: string;
}

/** Separación en columnas (horizontal) o filas (vertical) entre terminales de cada tipo. */
export const SEPARACION: Record<Exclude<TipoPieza, 'cable'>, number> = {
  fuente: 3,
  resistor: 4,
  capacitor: 2,
  inductor: 4,
  interruptor: 3,
};

/** Calcula el segundo terminal a partir del primero, o null si cae fuera de la placa. */
export function terminalesPara(tipo: Exclude<TipoPieza, 'cable'>, ancla: string, orientacion: Orientacion): [string, string] | null {
  const hueco = leerHueco(ancla);
  if (!hueco) return null;
  const paso = SEPARACION[tipo];
  if (orientacion === 'horizontal') {
    const columna = hueco.columna + paso;
    return columna <= COLUMNAS ? [ancla, idHueco(hueco.fila, columna)] : null;
  }
  const indice = FILAS.indexOf(hueco.fila);
  const destino = FILAS[indice + paso];
  return destino ? [ancla, idHueco(destino, hueco.columna)] : null;
}

/** Perforaciones ocupadas por terminales (cada perforación admite un solo terminal). */
export function huecosOcupados(piezas: Pieza[], excepto?: string): Set<string> {
  const ocupados = new Set<string>();
  for (const pieza of piezas) if (pieza.id !== excepto) pieza.terminales.forEach((t) => ocupados.add(t));
  return ocupados;
}

/* ─────────────────────────── Análisis ─────────────────────────── */

class Conjuntos {
  private padre = new Map<string, string>();
  raiz(x: string): string {
    if (!this.padre.has(x)) this.padre.set(x, x);
    const p = this.padre.get(x)!;
    if (p === x) return x;
    const r = this.raiz(p);
    this.padre.set(x, r);
    return r;
  }
  unir(a: string, b: string) {
    this.padre.set(this.raiz(a), this.raiz(b));
  }
}

export interface ProblemaCircuito {
  mensaje: string;
  piezas: string[];
}

export interface AnalisisCircuito {
  valido: boolean;
  parametros: ParametrosCircuito | null;
  errores: ProblemaCircuito[];
  advertencias: string[];
  /** Nodo eléctrico (red) de cada perforación usada. */
  redes: Map<string, string>;
  /** Piezas que forman el lazo, en orden de recorrido desde el borne positivo. */
  lazo: string[];
  resumen: { resistencias: number; inductores: number; capacitores: number; fuentes: number; cables: number };
}

const NOMBRES: Record<TipoPieza, string> = {
  fuente: 'La fuente',
  resistor: 'Un resistor',
  capacitor: 'Un capacitor',
  inductor: 'Un inductor',
  interruptor: 'El interruptor',
  cable: 'Un cable',
};

/**
 * Analiza la topología: une tiras internas, cables e interruptores cerrados en nodos;
 * el resto de piezas son ramas entre nodos. El circuito es compatible si todas las ramas
 * forman un único lazo simple (cada nodo con grado exactamente 2) con una fuente,
 * al menos un inductor y al menos un capacitor.
 */
export function analizarCircuito(piezas: Pieza[]): AnalisisCircuito {
  const conjuntos = new Conjuntos();
  const usados = new Set<string>();
  for (const pieza of piezas) pieza.terminales.forEach((t) => usados.add(t));
  // 1. Conexiones internas de la protoboard.
  for (const hueco of usados) conjuntos.unir(hueco, `tira:${tiraInterna(hueco)}`);
  // 2. Conductores ideales: cables e interruptores cerrados.
  for (const pieza of piezas) {
    if (pieza.tipo === 'cable' || (pieza.tipo === 'interruptor' && pieza.cerrado)) conjuntos.unir(pieza.terminales[0], pieza.terminales[1]);
  }
  const redes = new Map<string, string>();
  for (const hueco of usados) redes.set(hueco, conjuntos.raiz(hueco));

  const ramas = piezas.filter((p) => p.tipo === 'fuente' || p.tipo === 'resistor' || p.tipo === 'capacitor' || p.tipo === 'inductor');
  const resumen = {
    resistencias: piezas.filter((p) => p.tipo === 'resistor').length,
    inductores: piezas.filter((p) => p.tipo === 'inductor').length,
    capacitores: piezas.filter((p) => p.tipo === 'capacitor').length,
    fuentes: piezas.filter((p) => p.tipo === 'fuente').length,
    cables: piezas.filter((p) => p.tipo === 'cable').length,
  };
  const errores: ProblemaCircuito[] = [];
  const advertencias: string[] = [];
  const resultado = (lazo: string[] = []): AnalisisCircuito => ({
    valido: errores.length === 0,
    parametros: null,
    errores,
    advertencias,
    redes,
    lazo,
    resumen,
  });

  if (piezas.length === 0) {
    errores.push({ mensaje: 'La protoboard está vacía. Arrastra componentes desde la biblioteca.', piezas: [] });
    return resultado();
  }

  const abiertos = piezas.filter((p) => p.tipo === 'interruptor' && !p.cerrado);
  if (abiertos.length) errores.push({ mensaje: 'El interruptor está abierto: no puede circular corriente.', piezas: abiertos.map((p) => p.id) });

  if (resumen.fuentes === 0) errores.push({ mensaje: 'Falta la fuente de voltaje E.', piezas: [] });
  if (resumen.fuentes > 1) errores.push({ mensaje: 'El modelo admite una sola fuente.', piezas: piezas.filter((p) => p.tipo === 'fuente').map((p) => p.id) });

  // Ramas en cortocircuito: ambos terminales en el mismo nodo.
  for (const rama of ramas) {
    if (redes.get(rama.terminales[0]) === redes.get(rama.terminales[1])) {
      errores.push({
        mensaje: `${NOMBRES[rama.tipo]} está en cortocircuito: sus dos terminales quedan en el mismo nodo (misma tira o unidos por un cable).`,
        piezas: [rama.id],
      });
    }
  }

  // Grado de cada nodo según las ramas que llegan a él.
  const grado = new Map<string, string[]>();
  for (const rama of ramas) {
    for (const terminal of rama.terminales) {
      const red = redes.get(terminal)!;
      grado.set(red, [...(grado.get(red) ?? []), rama.id]);
    }
  }
  const sueltas = new Set<string>();
  for (const [, piezasNodo] of grado) {
    if (piezasNodo.length === 1) {
      if (sueltas.has(piezasNodo[0])) continue;
      sueltas.add(piezasNodo[0]);
      const pieza = piezas.find((p) => p.id === piezasNodo[0])!;
      errores.push({ mensaje: `${NOMBRES[pieza.tipo]} tiene un terminal sin conectar: el circuito está abierto.`, piezas: piezasNodo });
    } else if (piezasNodo.length > 2) {
      errores.push({
        mensaje: `Hay ${piezasNodo.length} terminales unidos en un mismo nodo: es una conexión en paralelo o ramificada, que el modelo en serie no resuelve.`,
        piezas: piezasNodo,
      });
    }
  }

  // Cables o interruptores que no tocan ninguna rama del circuito.
  const nodosConRamas = new Set(grado.keys());
  for (const pieza of piezas) {
    if ((pieza.tipo === 'cable' || pieza.tipo === 'interruptor') && !nodosConRamas.has(redes.get(pieza.terminales[0])!)) {
      advertencias.push(`${NOMBRES[pieza.tipo]} no está conectado a ningún componente.`);
    }
  }

  if (errores.length) return resultado();

  // Con todos los grados = 2, se recorre el lazo desde la fuente; si no se visitan
  // todas las ramas, hay más de un lazo independiente.
  const fuente = ramas.find((r) => r.tipo === 'fuente')!;
  const lazo: string[] = [fuente.id];
  let nodo = redes.get(fuente.terminales[1])!;
  let anterior = fuente;
  while (lazo.length <= ramas.length) {
    const siguienteId = grado.get(nodo)!.find((id) => id !== anterior.id)!;
    if (siguienteId === fuente.id) break;
    const siguiente = ramas.find((r) => r.id === siguienteId)!;
    lazo.push(siguiente.id);
    nodo = redes.get(siguiente.terminales[0]) === nodo ? redes.get(siguiente.terminales[1])! : redes.get(siguiente.terminales[0])!;
    anterior = siguiente;
  }
  if (lazo.length !== ramas.length) {
    const fuera = ramas.filter((r) => !lazo.includes(r.id)).map((r) => r.id);
    errores.push({ mensaje: 'Hay componentes formando un lazo separado que no incluye a la fuente.', piezas: fuera });
    return resultado(lazo);
  }

  if (resumen.inductores === 0) {
    errores.push({
      mensaje:
        resumen.capacitores > 0
          ? 'Circuito RC: sin inductor la ecuación es de primer orden. Este modelo de segundo orden necesita al menos un inductor.'
          : 'Falta un inductor y un capacitor: sin ellos no hay ecuación de segundo orden.',
      piezas: [],
    });
  }
  if (resumen.capacitores === 0 && resumen.inductores > 0) {
    errores.push({ mensaje: 'Circuito RL: sin capacitor la ecuación es de primer orden. Agrega al menos un capacitor.', piezas: [] });
  }
  if (errores.length) return resultado(lazo);

  // Equivalentes en serie: R y L se suman; para C se suman los inversos.
  const enLazo = lazo.map((id) => ramas.find((r) => r.id === id)!);
  const resistencia = enLazo.filter((p) => p.tipo === 'resistor').reduce((s, p) => s + p.valor, 0);
  const inductancia = enLazo.filter((p) => p.tipo === 'inductor').reduce((s, p) => s + p.valor, 0);
  const capacitancia = 1 / enLazo.filter((p) => p.tipo === 'capacitor').reduce((s, p) => s + 1 / p.valor, 0);
  if (resumen.resistencias === 0) advertencias.push('Sin resistor el amortiguamiento es nulo (R = 0): oscilación ideal que no decae.');
  if (resumen.resistencias > 1) advertencias.push(`Resistores en serie: R = ΣRᵢ = ${resistencia.toFixed(2)} Ω.`);
  if (resumen.inductores > 1) advertencias.push(`Inductores en serie: L = ΣLᵢ = ${inductancia.toFixed(3)} H.`);
  if (resumen.capacitores > 1) advertencias.push(`Capacitores en serie: 1/C = Σ1/Cᵢ ⇒ C = ${(capacitancia * 1e6).toFixed(1)} µF.`);

  return {
    valido: true,
    parametros: {
      inductancia,
      resistencia,
      capacitancia,
      fuente: { ...FUENTE_POR_DEFECTO, tipo: 'constante', amplitud: Math.abs(fuente.valor) },
    },
    errores,
    advertencias,
    redes,
    lazo,
    resumen,
  };
}

/** Circuito RLC en serie de ejemplo (L = 0.5 H, R = 10 Ω, C = 1000 µF, E = 12 V). */
export function circuitoEjemplo(): Pieza[] {
  return [
    { id: 'fuente-1', tipo: 'fuente', valor: 12, terminales: ['a3', 'a6'] },
    { id: 'resistor-1', tipo: 'resistor', valor: 10, terminales: ['b6', 'b10'] },
    { id: 'inductor-1', tipo: 'inductor', valor: 0.5, terminales: ['c10', 'c14'] },
    { id: 'capacitor-1', tipo: 'capacitor', valor: 1000e-6, terminales: ['d14', 'd16'] },
    { id: 'interruptor-1', tipo: 'interruptor', valor: 0, terminales: ['e16', 'e19'], cerrado: true },
    { id: 'cable-1', tipo: 'cable', valor: 0, terminales: ['b19', 'b3'], color: '#e0b028' },
  ];
}
