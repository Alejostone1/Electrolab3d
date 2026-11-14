import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { bandasResistor, muestrearEn, posicionHueco, type Pieza } from '@/engine';
import { CurvaHelice } from '../laboratorio/components-3d/geometria';
import type { Paleta3D } from '../laboratorio/components-3d/paleta';
import { useEnsamblaje } from './useEnsamblaje';

interface PropiedadesPieza {
  pieza: Pieza;
  paleta: Paleta3D;
  seleccionada: boolean;
  conError: boolean;
  enLazo: boolean;
}

/** Intensidad normalizada |i(t)|/i_max de la simulación de la estación (0 si no hay). */
function leerIntensidad(): number {
  const { resultado, tiempo } = useEnsamblaje.getState();
  if (!resultado || resultado.corrienteMaxima === 0) return 0;
  return Math.abs(muestrearEn(resultado, tiempo).corrienteNormalizada);
}

/** Material de cuerpo con resaltado de selección, error y corriente. */
function useMaterialCuerpo(color: string, paleta: Paleta3D, props: Omit<PropiedadesPieza, 'pieza' | 'paleta'>, extra: THREE.MeshStandardMaterialParameters = {}) {
  // Los parámetros extra solo se leen al crear el material (son constantes por tipo de pieza).
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.15, ...extra }), [color]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => material.dispose(), [material]);
  useFrame(({ clock }) => {
    if (props.conError) {
      material.emissive.set('#ff3b3b');
      material.emissiveIntensity = 0.35 + Math.sin(clock.elapsedTime * 5) * 0.2;
    } else if (props.seleccionada) {
      material.emissive.set(paleta.seleccion);
      material.emissiveIntensity = 0.45;
    } else if (props.enLazo) {
      material.emissive.set(paleta.corriente);
      material.emissiveIntensity = leerIntensidad() * 0.8;
    } else material.emissiveIntensity = 0;
  });
  return material;
}

function Patita({ x, z, alto }: { x: number; z: number; alto: number }) {
  return (
    <mesh position={[x, alto / 2 - 0.05, z]}>
      <cylinderGeometry args={[0.06, 0.06, alto + 0.1, 8]} />
      <meshStandardMaterial color="#c9ced6" metalness={0.9} roughness={0.25} />
    </mesh>
  );
}

function geometriaTerminales(pieza: Pieza) {
  const [ax, az] = posicionHueco(pieza.terminales[0]);
  const [bx, bz] = posicionHueco(pieza.terminales[1]);
  const largo = Math.hypot(bx - ax, bz - az);
  const angulo = Math.atan2(bz - az, bx - ax);
  return { ax, az, bx, bz, largo, angulo, mx: (ax + bx) / 2, mz: (az + bz) / 2 };
}

/** Pieza montada sobre la protoboard: modelo 3D según su tipo. */
export function Pieza3D({ pieza, paleta, seleccionada, conError, enLazo }: PropiedadesPieza) {
  const iniciarArrastre = useEnsamblaje((s) => s.iniciarArrastre);
  const herramienta = useEnsamblaje((s) => s.herramienta.modo);
  const controles = useThree((s) => s.controls) as { enabled: boolean } | null;
  const g = geometriaTerminales(pieza);
  const estado = { seleccionada, conError, enLazo };

  const alPresionar = (evento: ThreeEvent<PointerEvent>) => {
    if (herramienta !== 'seleccionar') return;
    evento.stopPropagation();
    // La cámara se congela en este mismo evento para que no gire mientras se arrastra.
    if (controles) controles.enabled = false;
    iniciarArrastre(pieza.id);
  };

  const comunes = {
    onPointerDown: alPresionar,
    // El clic sobre una pieza no debe llegar a la placa (que deseleccionaría).
    onClick: (evento: ThreeEvent<MouseEvent>) => evento.stopPropagation(),
    onPointerOver: () => herramienta === 'seleccionar' && (document.body.style.cursor = 'grab'),
    onPointerOut: () => (document.body.style.cursor = ''),
  };

  if (pieza.tipo === 'cable') return <Cable pieza={pieza} paleta={paleta} {...estado} {...comunes} />;

  return (
    <group {...comunes}>
      <Patita x={g.ax} z={g.az} alto={0.6} />
      <Patita x={g.bx} z={g.bz} alto={0.6} />
      <group position={[g.mx, 0, g.mz]} rotation={[0, -g.angulo, 0]}>
        {/* Alambres horizontales desde las patitas hasta el cuerpo */}
        <mesh position={[0, 0.58, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.055, 0.055, g.largo, 8]} />
          <meshStandardMaterial color="#c9ced6" metalness={0.9} roughness={0.25} />
        </mesh>
        {pieza.tipo === 'resistor' && <CuerpoResistor largo={g.largo} valor={pieza.valor} paleta={paleta} estado={estado} />}
        {pieza.tipo === 'capacitor' && <CuerpoCapacitor paleta={paleta} estado={estado} />}
        {pieza.tipo === 'inductor' && <CuerpoInductor largo={g.largo} paleta={paleta} estado={estado} />}
        {pieza.tipo === 'fuente' && <CuerpoFuente largo={g.largo} paleta={paleta} estado={estado} />}
        {pieza.tipo === 'interruptor' && <CuerpoInterruptor largo={g.largo} cerrado={Boolean(pieza.cerrado)} paleta={paleta} estado={estado} />}
      </group>
    </group>
  );
}

type Estado = Omit<PropiedadesPieza, 'pieza' | 'paleta'>;

function CuerpoResistor({ largo, valor, paleta, estado }: { largo: number; valor: number; paleta: Paleta3D; estado: Estado }) {
  const material = useMaterialCuerpo('#d9c39a', paleta, estado);
  const bandas = bandasResistor(valor);
  const cuerpo = Math.max(1.6, largo - 1.4);
  return (
    <group position={[0, 0.62, 0]}>
      <mesh material={material} rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.36, cuerpo - 0.72, 6, 20]} />
      </mesh>
      {bandas.map((banda, k) => (
        <mesh key={k} position={[-cuerpo / 2 + 0.45 + k * (cuerpo / 5) + (k === 3 ? cuerpo / 6 : 0), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.375, 0.375, 0.13, 20]} />
          <meshStandardMaterial color={banda.color} roughness={0.5} metalness={k === 3 ? 0.7 : 0} />
        </mesh>
      ))}
    </group>
  );
}

function CuerpoCapacitor({ paleta, estado }: { paleta: Paleta3D; estado: Estado }) {
  const material = useMaterialCuerpo('#1f4fa8', paleta, estado);
  return (
    <group position={[0, 1.65, 0]}>
      <mesh material={material} castShadow>
        <cylinderGeometry args={[0.85, 0.85, 2.1, 28]} />
      </mesh>
      <mesh position={[0, 0, 0.0]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.86, 0.86, 2.06, 28, 1, true, -0.35, 0.7]} />
        <meshStandardMaterial color="#dfe6ef" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.06, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.04, 28]} />
        <meshStandardMaterial color="#b9c2cc" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

function CuerpoInductor({ largo, paleta, estado }: { largo: number; paleta: Paleta3D; estado: Estado }) {
  const nucleo = useMaterialCuerpo('#3a3d42', paleta, estado, { metalness: 0.3, roughness: 0.7 });
  const cuerpo = Math.max(1.6, largo - 1.2);
  const bobina = useMemo(() => new THREE.TubeGeometry(new CurvaHelice(0.5, cuerpo - 0.5, 12), 300, 0.07, 6), [cuerpo]);
  return (
    <group position={[0, 0.85, 0]} rotation={[0, 0, Math.PI / 2]}>
      <mesh material={nucleo} castShadow>
        <cylinderGeometry args={[0.38, 0.38, cuerpo, 20]} />
      </mesh>
      <mesh geometry={bobina}>
        <meshStandardMaterial color={paleta.cobre} metalness={0.85} roughness={0.28} />
      </mesh>
    </group>
  );
}

function CuerpoFuente({ largo, paleta, estado }: { largo: number; paleta: Paleta3D; estado: Estado }) {
  const material = useMaterialCuerpo('#1d2430', paleta, estado);
  const ancho = largo + 0.8;
  return (
    <group position={[0, 1.15, 0]}>
      <mesh material={material} castShadow>
        <boxGeometry args={[ancho, 1.3, 1.6]} />
      </mesh>
      <mesh position={[-ancho / 2 + 0.35, 0, 0]}>
        <boxGeometry args={[0.7, 1.32, 1.62]} />
        <meshStandardMaterial color="#c0392b" roughness={0.5} />
      </mesh>
      <mesh position={[-ancho / 2 + 0.35, 0.67, 0]}>
        <boxGeometry args={[0.36, 0.04, 0.1]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-ancho / 2 + 0.35, 0.67, 0]}>
        <boxGeometry args={[0.1, 0.04, 0.36]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[ancho / 2 - 0.35, 0.67, 0]}>
        <boxGeometry args={[0.36, 0.04, 0.1]} />
        <meshBasicMaterial color="#9fb3c8" />
      </mesh>
    </group>
  );
}

function CuerpoInterruptor({ largo, cerrado, paleta, estado }: { largo: number; cerrado: boolean; paleta: Paleta3D; estado: Estado }) {
  const material = useMaterialCuerpo('#2b3440', paleta, estado);
  const palanca = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (palanca.current) palanca.current.position.x = THREE.MathUtils.damp(palanca.current.position.x, cerrado ? largo * 0.18 : -largo * 0.18, 10, delta);
  });
  return (
    <group position={[0, 0.85, 0]}>
      <mesh material={material} castShadow>
        <boxGeometry args={[largo + 0.4, 0.7, 1.1]} />
      </mesh>
      <mesh ref={palanca} position={[0, 0.5, 0]}>
        <boxGeometry args={[0.45, 0.4, 0.45]} />
        <meshStandardMaterial color={cerrado ? '#2aa86b' : '#d64545'} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Cable({
  pieza,
  paleta,
  seleccionada,
  conError,
  enLazo,
  ...eventos
}: PropiedadesPieza & {
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}) {
  const g = geometriaTerminales(pieza);
  const geometria = useMemo(() => {
    const altura = 0.6 + g.largo * 0.12;
    const curva = new THREE.CatmullRomCurve3([
      new THREE.Vector3(g.ax, 0, g.az),
      new THREE.Vector3(g.ax, altura * 0.7, g.az),
      new THREE.Vector3(g.mx, altura, g.mz),
      new THREE.Vector3(g.bx, altura * 0.7, g.bz),
      new THREE.Vector3(g.bx, 0, g.bz),
    ]);
    return new THREE.TubeGeometry(curva, 48, 0.12, 8);
  }, [g.ax, g.az, g.bx, g.bz, g.mx, g.mz, g.largo]);
  const material = useMaterialCuerpo(pieza.color ?? '#e0b028', paleta, { seleccionada, conError, enLazo }, { roughness: 0.5 });
  return <mesh geometry={geometria} material={material} castShadow {...eventos} />;
}
