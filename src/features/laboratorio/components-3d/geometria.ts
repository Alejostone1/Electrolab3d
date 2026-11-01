import * as THREE from 'three';
import type { IdComponente } from '@/engine';

/**
 * Disposición espacial del circuito sobre la placa del laboratorio.
 * El lazo es rectangular: fuente (izquierda) → interruptor y resistor (fondo)
 * → inductor (derecha) → capacitor (frente) → regreso a la fuente.
 */
export const ALTURA_CONDUCTOR = 0.42;
const X = 4.2;
const Z = 2.6;

export const POSICIONES: Record<IdComponente, [number, number, number]> = {
  fuente: [-X, 0, 0],
  interruptor: [-1.9, 0, -Z],
  resistor: [1.3, 0, -Z],
  inductor: [X, 0, 0],
  capacitor: [0, 0, Z],
  conductores: [0, 0, 0],
};

/** Curva cerrada con esquinas redondeadas en el sentido de la corriente convencional. */
function crearRecorrido(): THREE.CurvePath<THREE.Vector3> {
  const y = ALTURA_CONDUCTOR;
  const r = 0.5;
  const puntos: Array<[number, number]> = [
    [-X, -0.95],
    [-X, -Z],
    [X, -Z],
    [X, Z],
    [-X, Z],
    [-X, 0.95],
  ];
  const camino = new THREE.CurvePath<THREE.Vector3>();
  const v = (x: number, z: number) => new THREE.Vector3(x, y, z);
  let actual = v(puntos[0][0], puntos[0][1]);
  for (let k = 1; k < puntos.length; k++) {
    const esquina = v(puntos[k][0], puntos[k][1]);
    const siguiente = puntos[k + 1] ? v(puntos[k + 1][0], puntos[k + 1][1]) : null;
    if (!siguiente) {
      camino.add(new THREE.LineCurve3(actual, esquina));
      break;
    }
    const entrada = esquina.clone().add(actual.clone().sub(esquina).setLength(r));
    const salida = esquina.clone().add(siguiente.clone().sub(esquina).setLength(r));
    camino.add(new THREE.LineCurve3(actual, entrada));
    camino.add(new THREE.QuadraticBezierCurve3(entrada, esquina, salida));
    actual = salida;
  }
  return camino;
}

export const RECORRIDO = crearRecorrido();
export const LONGITUD_RECORRIDO = RECORRIDO.getLength();

/** Hélice para bobinas y la película de carbón del resistor. */
export class CurvaHelice extends THREE.Curve<THREE.Vector3> {
  constructor(
    private radio: number,
    private largo: number,
    private vueltas: number,
  ) {
    super();
  }
  getPoint(u: number, destino = new THREE.Vector3()): THREE.Vector3 {
    const angulo = u * this.vueltas * Math.PI * 2;
    return destino.set(Math.cos(angulo) * this.radio, (u - 0.5) * this.largo, Math.sin(angulo) * this.radio);
  }
}

/** Elipse en el plano XY (líneas de campo magnético alrededor del inductor). */
export class CurvaElipse extends THREE.Curve<THREE.Vector3> {
  constructor(
    private semiejeX: number,
    private semiejeY: number,
    private desplazamientoX: number,
  ) {
    super();
  }
  getPoint(u: number, destino = new THREE.Vector3()): THREE.Vector3 {
    const angulo = u * Math.PI * 2;
    return destino.set(this.desplazamientoX + Math.cos(angulo) * this.semiejeX, Math.sin(angulo) * this.semiejeY, 0);
  }
}

/** Encuadres de cámara predefinidos [posición, objetivo]. */
export const VISTAS_CAMARA = {
  isometrica: { posicion: [8.5, 7.5, 10] as const, objetivo: [0, 0.4, 0] as const },
  frontal: { posicion: [0, 2.4, 13] as const, objetivo: [0, 0.6, 0] as const },
  superior: { posicion: [0, 15, 0.01] as const, objetivo: [0, 0, 0] as const },
  libre: { posicion: [8.5, 7.5, 10] as const, objetivo: [0, 0.4, 0] as const },
};

/** Desplazamiento de cámara para inspeccionar de cerca cada componente. */
export const ENFOQUE_COMPONENTE: Record<IdComponente, [number, number, number]> = {
  fuente: [-2.6, 2.2, 3.2],
  interruptor: [1.6, 2.2, 3],
  resistor: [1.2, 1.9, 3.2],
  inductor: [3, 2.4, 2.8],
  capacitor: [2.2, 2.2, 3.4],
  conductores: [8, 9, 10],
};
