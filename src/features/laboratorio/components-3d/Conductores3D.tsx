import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { leerMuestraActual } from '@/hooks/useSimulacion';
import { LONGITUD_RECORRIDO, POSICIONES, RECORRIDO } from './geometria';
import type { Paleta3D } from './paleta';

const PORTADORES = 90;

/** Tramo de una curva entre los parámetros a y b (para dejar huecos en los componentes). */
class TramoCurva extends THREE.Curve<THREE.Vector3> {
  constructor(
    private curva: THREE.Curve<THREE.Vector3>,
    private a: number,
    private b: number,
  ) {
    super();
  }
  getPoint(u: number, destino = new THREE.Vector3()) {
    return this.curva.getPointAt(this.a + (this.b - this.a) * u, destino);
  }
}

function parametroMasCercano(x: number, z: number): number {
  let mejor = 0;
  let distancia = Infinity;
  const p = new THREE.Vector3();
  for (let k = 0; k <= 1200; k++) {
    RECORRIDO.getPointAt(k / 1200, p);
    const d = (p.x - x) ** 2 + (p.z - z) ** 2;
    if (d < distancia) {
      distancia = d;
      mejor = k / 1200;
    }
  }
  return mejor;
}

/** Semilongitudes (en unidades de escena) ocupadas por cada componente sobre el conductor. */
const HUECOS: Array<[keyof typeof POSICIONES, number]> = [
  ['interruptor', 0.55],
  ['resistor', 0.58],
  ['inductor', 0.82],
  ['capacitor', 0.5],
];

interface PropiedadesConductores {
  paleta: Paleta3D;
  mostrarCorriente: boolean;
}

/**
 * Conductores en serie y portadores de corriente convencional. La velocidad y
 * el sentido de los portadores, y el brillo del cable, siguen a i(t) del motor.
 */
export function Conductores3D({ paleta, mostrarCorriente }: PropiedadesConductores) {
  const tramos = useMemo(() => {
    const intervalos = HUECOS.map(([id, semilongitud]) => {
      const [x, , z] = POSICIONES[id];
      const u = parametroMasCercano(x, z);
      const du = semilongitud / LONGITUD_RECORRIDO;
      return [u - du, u + du] as const;
    }).sort((a, b) => a[0] - b[0]);
    const geometrias: THREE.TubeGeometry[] = [];
    let inicio = 0;
    for (const [a, b] of intervalos) {
      geometrias.push(new THREE.TubeGeometry(new TramoCurva(RECORRIDO, inicio, a), 120, 0.05, 10));
      inicio = b;
    }
    geometrias.push(new THREE.TubeGeometry(new TramoCurva(RECORRIDO, inicio, 1), 120, 0.05, 10));
    return geometrias;
  }, []);
  const geometriaBrillo = useMemo(() => new THREE.TubeGeometry(RECORRIDO, 600, 0.11, 10), []);

  const materialCable = useMemo(
    () => new THREE.MeshStandardMaterial({ color: paleta.cobre, metalness: 0.85, roughness: 0.3, emissive: paleta.corriente, emissiveIntensity: 0 }),
    [paleta.cobre, paleta.corriente],
  );
  const materialBrillo = useRef<THREE.MeshBasicMaterial>(null);
  const portadores = useRef<THREE.InstancedMesh>(null);
  const desplazamiento = useRef(0);
  const auxiliar = useMemo(() => new THREE.Object3D(), []);
  const punto = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const muestra = leerMuestraActual();
    const intensidad = muestra.conectado ? Math.abs(muestra.corrienteNormalizada) : 0;
    const sentido = Math.sign(muestra.i);
    materialCable.emissiveIntensity = intensidad * 0.9;
    if (materialBrillo.current) materialBrillo.current.opacity = mostrarCorriente ? intensidad * 0.35 : 0;

    // Velocidad de los portadores ∝ i(t): el signo invierte el sentido del recorrido.
    desplazamiento.current = (desplazamiento.current + sentido * intensidad * Math.min(delta, 0.1) * 0.09 + 1) % 1;
    if (!portadores.current) return;
    portadores.current.visible = mostrarCorriente;
    for (let k = 0; k < PORTADORES; k++) {
      const u = (k / PORTADORES + desplazamiento.current) % 1;
      RECORRIDO.getPointAt(u, punto);
      auxiliar.position.copy(punto);
      auxiliar.scale.setScalar(intensidad > 0.004 ? 0.55 + intensidad * 0.75 : 0.0001);
      auxiliar.updateMatrix();
      portadores.current.setMatrixAt(k, auxiliar.matrix);
    }
    portadores.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {tramos.map((geometria, k) => (
        <mesh key={k} geometry={geometria} material={materialCable} castShadow />
      ))}
      <mesh geometry={geometriaBrillo}>
        <meshBasicMaterial ref={materialBrillo} color={paleta.corriente} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <instancedMesh ref={portadores} args={[undefined, undefined, PORTADORES]}>
        <sphereGeometry args={[0.06, 10, 10]} />
        <meshBasicMaterial color={paleta.corriente} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
