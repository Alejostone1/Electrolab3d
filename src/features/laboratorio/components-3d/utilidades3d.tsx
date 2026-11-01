import { Html } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { forwardRef, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import type { IdComponente } from '@/engine';
import './escena3d.css';

/** Valor animado (amortiguado exponencialmente) hacia 0 o 1. */
export function useFactorAnimado(activo: boolean, rapidez = 4) {
  const factor = useRef(activo ? 1 : 0);
  useFrame((_, delta) => {
    factor.current = THREE.MathUtils.damp(factor.current, activo ? 1 : 0, rapidez, Math.min(delta, 0.1));
  });
  return factor;
}

/** Ajusta la opacidad de una carcasa para el modo rayos X. */
export function aplicarTransparencia(
  material: THREE.Material | undefined | null,
  factorRayosX: number,
  opacidadMinima = 0.1,
  opacidadBase = 1,
) {
  if (!material) return;
  const opacidad = opacidadBase - factorRayosX * (opacidadBase - opacidadMinima);
  material.opacity = opacidad;
  material.transparent = opacidad < 0.99;
  material.depthWrite = opacidad > 0.6;
}

interface PropiedadesEtiquetaParte {
  posicion: [number, number, number];
  texto: string;
  visible: boolean;
  lado?: 'izquierda' | 'derecha';
}

/** Rótulo de una parte interna, visible en despiece o rayos X. */
export function EtiquetaParte({ posicion, texto, visible, lado = 'derecha' }: PropiedadesEtiquetaParte) {
  if (!visible) return null;
  return (
    <Html position={posicion} center distanceFactor={6} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div className={`etiqueta-parte etiqueta-parte--${lado}`}>{texto}</div>
    </Html>
  );
}

interface PropiedadesEtiquetaComponente {
  posicion: [number, number, number];
  nombre: string;
  visible: boolean;
  seleccionado: boolean;
}

/** Etiqueta flotante con nombre y valor en vivo (el valor se escribe vía ref, sin re-render). */
export const EtiquetaComponente = forwardRef<HTMLSpanElement, PropiedadesEtiquetaComponente>(function EtiquetaComponente(
  { posicion, nombre, visible, seleccionado },
  ref,
) {
  return (
    <Html position={posicion} center zIndexRange={[30, 0]} style={{ pointerEvents: 'none', display: visible ? 'block' : 'none' }}>
      <div className={`etiqueta-3d ${seleccionado ? 'etiqueta-3d--activa' : ''}`}>
        <b>{nombre}</b>
        <span ref={ref} className="mono" />
      </div>
    </Html>
  );
});

interface PropiedadesInteractivo {
  id: IdComponente;
  posicion: [number, number, number];
  rotacion?: [number, number, number];
  seleccionado: boolean;
  alSeleccionar?: (id: IdComponente) => void;
  colorSeleccion: string;
  radioSeleccion?: number;
  children: ReactNode;
}

/** Contenedor que agrega selección por clic, cursor y anillo de selección. */
export function ComponenteInteractivo({
  id,
  posicion,
  rotacion,
  seleccionado,
  alSeleccionar,
  colorSeleccion,
  radioSeleccion = 1.3,
  children,
}: PropiedadesInteractivo) {
  const [sobre, setSobre] = useState(false);
  const anillo = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!anillo.current) return;
    const visible = seleccionado || sobre;
    anillo.current.visible = visible;
    const material = anillo.current.material as THREE.MeshBasicMaterial;
    material.opacity = seleccionado ? 0.55 + Math.sin(clock.elapsedTime * 3) * 0.2 : 0.25;
    anillo.current.rotation.z = clock.elapsedTime * 0.4;
  });

  const alClic = (evento: ThreeEvent<MouseEvent>) => {
    if (!alSeleccionar) return;
    evento.stopPropagation();
    alSeleccionar(id);
  };

  return (
    <group
      position={posicion}
      onClick={alClic}
      onPointerOver={(e) => {
        if (!alSeleccionar) return;
        e.stopPropagation();
        setSobre(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setSobre(false);
        document.body.style.cursor = '';
      }}
    >
      <mesh ref={anillo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} visible={false}>
        <ringGeometry args={[radioSeleccion, radioSeleccion + 0.06, 64, 1, 0, Math.PI * 1.7]} />
        <meshBasicMaterial color={colorSeleccion} transparent opacity={0.5} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <group rotation={rotacion}>{children}</group>
    </group>
  );
}
