import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useLaboratorio } from '@/store/useLaboratorio';
import { ALTURA_CONDUCTOR, POSICIONES } from './geometria';
import type { PropiedadesComponente3D } from './tipos3d';
import { aplicarTransparencia, ComponenteInteractivo, EtiquetaComponente, EtiquetaParte, useFactorAnimado } from './utilidades3d';

/** Interruptor de cuchilla. Abierto ⇒ estado "desconectado"; cerrado ⇒ circuito preparado. */
export function Interruptor3D({ paleta, seleccionado, alSeleccionar, explotado, rayosX, mostrarEtiquetas }: PropiedadesComponente3D) {
  const conectado = useLaboratorio((s) => s.conectado);
  const factorCerrado = useFactorAnimado(conectado, 6);
  const factorDespiece = useFactorAnimado(explotado);
  const factorRayos = useFactorAnimado(rayosX);
  const cuchilla = useRef<THREE.Group>(null);
  const contactos = useRef<THREE.Group>(null);
  const materialBase = useRef<THREE.MeshStandardMaterial>(null);
  const chispa = useRef<THREE.MeshStandardMaterial>(null);
  const valor = useRef<HTMLSpanElement>(null);

  useFrame(() => {
    const d = factorDespiece.current;
    if (cuchilla.current) {
      cuchilla.current.rotation.z = (1 - factorCerrado.current) * 1.05;
      cuchilla.current.position.y = ALTURA_CONDUCTOR + 0.2 + d * 1.1;
    }
    if (contactos.current) contactos.current.position.y = d * 0.55;
    aplicarTransparencia(materialBase.current!, factorRayos.current, 0.2);
    if (chispa.current) chispa.current.emissiveIntensity = factorCerrado.current > 0.95 ? 2.5 : 0;
    if (valor.current) valor.current.textContent = conectado ? 'Cerrado' : 'Abierto · clic para cerrar';
  });

  // Un clic sobre el interruptor lo abre o cierra (solo si la escena es interactiva).
  const alSeleccionarInterruptor = alSeleccionar ? () => useLaboratorio.getState().alternarInterruptor() : undefined;

  return (
    <ComponenteInteractivo id="interruptor" posicion={POSICIONES.interruptor} seleccionado={seleccionado} alSeleccionar={alSeleccionarInterruptor} colorSeleccion={paleta.seleccion} radioSeleccion={1}>
      <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.7, 0.2, 0.8]} />
        <meshStandardMaterial ref={materialBase} color="#3b2a20" roughness={0.6} />
      </mesh>
      <group ref={contactos}>
        {[-0.55, 0.55].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh position={[0, ALTURA_CONDUCTOR + 0.05, 0]} castShadow>
              <boxGeometry args={[0.16, 0.5, 0.3]} />
              <meshStandardMaterial color={paleta.cobre} metalness={0.85} roughness={0.25} />
            </mesh>
          </group>
        ))}
        <mesh position={[0.55, ALTURA_CONDUCTOR + 0.22, 0]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial ref={chispa} color={paleta.corriente} emissive={paleta.corriente} emissiveIntensity={0} toneMapped={false} />
        </mesh>
      </group>
      {/* Cuchilla con bisagra en x = −0.55 */}
      <group ref={cuchilla} position={[-0.55, ALTURA_CONDUCTOR + 0.2, 0]}>
        <mesh position={[0.6, 0, 0]} castShadow>
          <boxGeometry args={[1.25, 0.06, 0.14]} />
          <meshStandardMaterial color={paleta.cobre} metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[1.28, 0.12, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.36, 16]} />
          <meshStandardMaterial color="#c0392b" roughness={0.5} />
        </mesh>
      </group>

      <EtiquetaComponente ref={valor} posicion={[0, 1.6, 0]} nombre="Interruptor" visible={mostrarEtiquetas && !explotado} seleccionado={seleccionado} />
      <EtiquetaParte posicion={[0.3, ALTURA_CONDUCTOR + 1.55, 0]} texto="Cuchilla de cobre" visible={explotado} />
      <EtiquetaParte posicion={[1.1, 1.05, 0]} texto="Contactos" visible={explotado} />
      <EtiquetaParte posicion={[0, 0.1, 0.65]} texto="Base aislante" visible={explotado} />
    </ComponenteInteractivo>
  );
}
