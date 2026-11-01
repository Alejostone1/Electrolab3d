import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { leerMuestraActual } from '@/hooks/useSimulacion';
import { aPrecision } from '@/utils/formato';
import { POSICIONES } from './geometria';
import type { PropiedadesComponente3D } from './tipos3d';
import { aplicarTransparencia, ComponenteInteractivo, EtiquetaComponente, EtiquetaParte, useFactorAnimado } from './utilidades3d';

const ALTURA = 0.7;
const ROTACION_EJE_Z: [number, number, number] = [Math.PI / 2, 0, 0];

/**
 * Fuente de voltaje modelada como una celda cilíndrica con su estructura interna
 * (carcasa, cátodo, separador, ánodo y colector). El LED y el indicador siguen E(t).
 */
export function Fuente3D({ paleta, seleccionado, alSeleccionar, explotado, rayosX, mostrarEtiquetas }: PropiedadesComponente3D) {
  const factorDespiece = useFactorAnimado(explotado);
  const factorRayos = useFactorAnimado(rayosX || explotado);
  const carcasa = useRef<THREE.Group>(null);
  const catodo = useRef<THREE.Group>(null);
  const separador = useRef<THREE.Group>(null);
  const materialCarcasa = useRef<THREE.MeshStandardMaterial>(null);
  const materialFranja = useRef<THREE.MeshStandardMaterial>(null);
  const materialCatodo = useRef<THREE.MeshStandardMaterial>(null);
  const led = useRef<THREE.MeshStandardMaterial>(null);
  const valor = useRef<HTMLSpanElement>(null);

  useFrame(({ clock }) => {
    const d = factorDespiece.current;
    if (carcasa.current) carcasa.current.position.y = ALTURA + d * 2.9;
    if (catodo.current) catodo.current.position.y = ALTURA + d * 1.85;
    if (separador.current) separador.current.position.y = ALTURA + d * 0.95;
    aplicarTransparencia(materialCarcasa.current!, factorRayos.current, 0.12);
    aplicarTransparencia(materialFranja.current!, factorRayos.current, 0.12);
    aplicarTransparencia(materialCatodo.current!, factorRayos.current * (1 - d), 0.35);

    const muestra = leerMuestraActual();
    const relativo = muestra.conectado ? Math.abs(muestra.E) / 24 : 0;
    if (led.current) led.current.emissiveIntensity = muestra.conectado ? 0.6 + relativo * 4 + Math.sin(clock.elapsedTime * 4) * 0.2 : 0.05;
    if (valor.current) valor.current.textContent = muestra.conectado ? `E = ${aPrecision(muestra.E, 3)} V` : 'Desconectada';
  });

  return (
    <ComponenteInteractivo id="fuente" posicion={POSICIONES.fuente} seleccionado={seleccionado} alSeleccionar={alSeleccionar} colorSeleccion={paleta.seleccion} radioSeleccion={1.35}>
      {/* Cuna de soporte */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.25, 0.24, 2.1]} />
        <meshStandardMaterial color={paleta.plastico} roughness={0.7} />
      </mesh>

      {/* Ánodo de zinc + colector (siempre en su lugar) */}
      <group position={[0, ALTURA, 0]}>
        <mesh rotation={ROTACION_EJE_Z} castShadow>
          <cylinderGeometry args={[0.33, 0.33, 1.72, 32]} />
          <meshStandardMaterial color="#9aa5b1" roughness={0.85} metalness={0.2} />
        </mesh>
        <mesh rotation={ROTACION_EJE_Z}>
          <cylinderGeometry args={[0.06, 0.06, 1.86, 12]} />
          <meshStandardMaterial color="#d4a73c" metalness={0.9} roughness={0.25} />
        </mesh>
      </group>

      <group ref={separador} position={[0, ALTURA, 0]}>
        <mesh rotation={ROTACION_EJE_Z}>
          <cylinderGeometry args={[0.38, 0.38, 1.74, 32, 1, true]} />
          <meshStandardMaterial color="#f1efe6" roughness={0.9} side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
      </group>

      <group ref={catodo} position={[0, ALTURA, 0]}>
        <mesh rotation={ROTACION_EJE_Z}>
          <cylinderGeometry args={[0.55, 0.55, 1.76, 40, 1, true]} />
          <meshStandardMaterial ref={materialCatodo} color="#2c2f33" roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
      </group>

      <group ref={carcasa} position={[0, ALTURA, 0]}>
        <mesh rotation={ROTACION_EJE_Z} castShadow>
          <cylinderGeometry args={[0.62, 0.62, 1.8, 48]} />
          <meshStandardMaterial ref={materialCarcasa} color="#13233b" metalness={0.55} roughness={0.35} />
        </mesh>
        <mesh rotation={ROTACION_EJE_Z} position={[0, 0, -0.55]}>
          <cylinderGeometry args={[0.625, 0.625, 0.5, 48, 1, true]} />
          <meshStandardMaterial ref={materialFranja} color={paleta.corriente} metalness={0.4} roughness={0.3} side={THREE.DoubleSide} />
        </mesh>
        {/* Terminal positivo */}
        <mesh rotation={ROTACION_EJE_Z} position={[0, 0, -0.98]}>
          <cylinderGeometry args={[0.2, 0.2, 0.16, 24]} />
          <meshStandardMaterial color={paleta.metal} metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh rotation={ROTACION_EJE_Z} position={[0, 0, 0.92]}>
          <cylinderGeometry args={[0.5, 0.5, 0.05, 32]} />
          <meshStandardMaterial color={paleta.metal} metalness={0.9} roughness={0.25} />
        </mesh>
        {/* LED indicador */}
        <mesh position={[0, 0.63, 0.25]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial ref={led} color={paleta.seleccion} emissive={paleta.seleccion} emissiveIntensity={0.1} toneMapped={false} />
        </mesh>
      </group>

      {/* Lengüetas hacia los conductores */}
      {[-1, 1].map((lado) => (
        <mesh key={lado} position={[0, 0.5, lado * 1.02]}>
          <boxGeometry args={[0.14, 0.32, 0.06]} />
          <meshStandardMaterial color={paleta.metal} metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      <EtiquetaComponente ref={valor} posicion={[0, 2.1, 0]} nombre="Fuente E(t)" visible={mostrarEtiquetas && !explotado} seleccionado={seleccionado} />
      <EtiquetaParte posicion={[0.9, ALTURA + 2.9, 0]} texto="Carcasa metálica (−)" visible={explotado} />
      <EtiquetaParte posicion={[0.85, ALTURA + 1.85, 0]} texto="Cátodo MnO₂" visible={explotado} />
      <EtiquetaParte posicion={[0.75, ALTURA + 0.95, 0]} texto="Separador poroso" visible={explotado} />
      <EtiquetaParte posicion={[0.7, ALTURA - 0.05, 0.3]} texto="Ánodo de zinc + colector" visible={explotado} />
      <EtiquetaParte posicion={[0, ALTURA + 0.15, -1.3]} texto="Terminal +" visible={explotado || rayosX} />
    </ComponenteInteractivo>
  );
}
