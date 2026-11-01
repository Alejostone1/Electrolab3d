import { Grid, RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { determinarEstadoCircuito, type IdComponente } from '@/engine';
import { useLaboratorio } from '@/store/useLaboratorio';
import { Capacitor3D } from '../components-3d/Capacitor3D';
import { Conductores3D } from '../components-3d/Conductores3D';
import { Fuente3D } from '../components-3d/Fuente3D';
import { Inductor3D } from '../components-3d/Inductor3D';
import { Interruptor3D } from '../components-3d/Interruptor3D';
import type { Paleta3D } from '../components-3d/paleta';
import { Resistor3D } from '../components-3d/Resistor3D';

export interface ConfiguracionCircuito3D {
  paleta: Paleta3D;
  seleccionado: IdComponente | null;
  alSeleccionar?: (id: IdComponente) => void;
  /** true = todos; un arreglo = solo esos componentes. */
  explotados: boolean | IdComponente[];
  rayosX: boolean | IdComponente[];
  mostrarCampos: boolean;
  mostrarEtiquetas: boolean;
}

const COLORES_ESTADO: Record<string, string> = {
  desconectado: '#64748b',
  preparado: '#f59e0b',
  encendido: '#38bdf8',
  transitorio: '#22d3ee',
  oscilando: '#22d3ee',
  estabilizandose: '#34d399',
  estabilizado: '#34d399',
};

function incluye(valor: boolean | IdComponente[], id: IdComponente) {
  return Array.isArray(valor) ? valor.includes(id) : valor;
}

/** Placa del laboratorio con bornes auxiliares y LED de estado del circuito. */
function PlacaLaboratorio({ paleta }: { paleta: Paleta3D }) {
  const led = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (!led.current) return;
    const { resultado, tiempo, conectado } = useLaboratorio.getState();
    const estado = determinarEstadoCircuito(resultado, tiempo, conectado);
    led.current.color.set(COLORES_ESTADO[estado]);
    led.current.emissive.set(COLORES_ESTADO[estado]);
    led.current.emissiveIntensity = estado === 'desconectado' ? 0.2 : 1.6 + Math.sin(clock.elapsedTime * 3) * 0.5;
  });
  return (
    <group>
      <RoundedBox args={[11.4, 0.3, 7.8]} radius={0.12} position={[0, -0.15, 0]} receiveShadow>
        <meshStandardMaterial color={paleta.placa} roughness={0.85} metalness={0.05} />
      </RoundedBox>
      <Grid
        position={[0, 0.005, 0]}
        args={[11, 7.4]}
        cellSize={0.25}
        cellThickness={0.6}
        cellColor={paleta.cuadricula}
        sectionSize={1}
        sectionThickness={1}
        sectionColor={paleta.cuadriculaFuerte}
        fadeDistance={40}
        followCamera={false}
      />
      {[
        [-5.3, -3.5],
        [5.3, -3.5],
        [-5.3, 3.5],
        [5.3, 3.5],
      ].map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh position={[0, 0.12, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.18, 0.24, 6]} />
            <meshStandardMaterial color={paleta.metal} metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      ))}
      <group position={[-5.0, 0, 0]}>
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.5, 0.2, 0.5]} />
          <meshStandardMaterial color={paleta.plastico} />
        </mesh>
        <mesh position={[0, 0.28, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial ref={led} color="#64748b" emissive="#64748b" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/** Ensambla el circuito RLC en serie completo. */
export function CircuitoRLC({ paleta, seleccionado, alSeleccionar, explotados, rayosX, mostrarCampos, mostrarEtiquetas }: ConfiguracionCircuito3D) {
  const comunes = (id: IdComponente) => ({
    paleta,
    seleccionado: seleccionado === id,
    alSeleccionar,
    explotado: incluye(explotados, id),
    rayosX: incluye(rayosX, id),
    mostrarCampos,
    // Al inspeccionar un componente se ocultan las etiquetas de los demás.
    mostrarEtiquetas: mostrarEtiquetas && (!seleccionado || seleccionado === id),
  });
  return (
    <group>
      <PlacaLaboratorio paleta={paleta} />
      <Conductores3D paleta={paleta} mostrarCorriente={mostrarCampos} />
      <Fuente3D {...comunes('fuente')} />
      <Interruptor3D {...comunes('interruptor')} />
      <Resistor3D {...comunes('resistor')} />
      <Inductor3D {...comunes('inductor')} />
      <Capacitor3D {...comunes('capacitor')} />
    </group>
  );
}
