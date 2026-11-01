import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { bandasResistor } from '@/engine';
import { leerMuestraActual } from '@/hooks/useSimulacion';
import { useLaboratorio } from '@/store/useLaboratorio';
import { aPrecision } from '@/utils/formato';
import { ALTURA_CONDUCTOR, CurvaHelice, POSICIONES } from './geometria';
import type { PropiedadesComponente3D } from './tipos3d';
import { aplicarTransparencia, ComponenteInteractivo, EtiquetaComponente, EtiquetaParte, useFactorAnimado } from './utilidades3d';

const PARTICULAS_CALOR = 36;
const ROTACION_EJE_X: [number, number, number] = [0, 0, Math.PI / 2];

/**
 * Resistor de película de carbón. Las bandas muestran el valor real de R y el
 * brillo térmico es proporcional a P_R(t) = R·i²(t) calculada por el motor.
 */
export function Resistor3D({ paleta, seleccionado, alSeleccionar, explotado, rayosX, mostrarCampos, mostrarEtiquetas }: PropiedadesComponente3D) {
  const resistencia = useLaboratorio((s) => s.parametros.resistencia);
  const bandas = useMemo(() => bandasResistor(resistencia), [resistencia]);
  const factorDespiece = useFactorAnimado(explotado);
  const factorRayos = useFactorAnimado(rayosX);
  const recubrimiento = useRef<THREE.Group>(null);
  const pelicula = useRef<THREE.Group>(null);
  const capuchones = useRef<Array<THREE.Group | null>>([]);
  const materialCuerpo = useRef<THREE.MeshStandardMaterial>(null);
  const materialesBandas = useRef<Array<THREE.MeshStandardMaterial | null>>([]);
  const materialPelicula = useRef<THREE.MeshStandardMaterial>(null);
  const materialNucleo = useRef<THREE.MeshStandardMaterial>(null);
  const calor = useRef<THREE.Points>(null);
  const valor = useRef<HTMLSpanElement>(null);

  const geometriaPelicula = useMemo(() => new THREE.TubeGeometry(new CurvaHelice(0.215, 1.05, 9), 400, 0.028, 6), []);
  const semillasCalor = useMemo(
    () => Array.from({ length: PARTICULAS_CALOR }, () => ({ x: (Math.random() - 0.5) * 1.1, z: (Math.random() - 0.5) * 0.4, fase: Math.random() })),
    [],
  );
  const posicionesCalor = useMemo(() => new Float32Array(PARTICULAS_CALOR * 3), []);

  useFrame(({ clock }) => {
    const d = factorDespiece.current;
    if (recubrimiento.current) recubrimiento.current.position.y = ALTURA_CONDUCTOR + d * 1.25;
    if (pelicula.current) pelicula.current.position.y = ALTURA_CONDUCTOR + d * 0.6;
    capuchones.current.forEach((grupo, k) => {
      if (grupo) grupo.position.x = (k === 0 ? -1 : 1) * (0.62 + d * 0.55);
    });
    aplicarTransparencia(materialCuerpo.current!, factorRayos.current, 0.14);
    materialesBandas.current.forEach((m) => aplicarTransparencia(m!, factorRayos.current, 0.2));

    const muestra = leerMuestraActual();
    const potencia = muestra.conectado ? muestra.potenciaNormalizada : 0;
    if (materialPelicula.current) materialPelicula.current.emissiveIntensity = potencia * 3.2;
    if (materialNucleo.current) materialNucleo.current.emissiveIntensity = potencia * 0.6;
    if (materialCuerpo.current) materialCuerpo.current.emissiveIntensity = potencia * 0.35;

    if (calor.current) {
      const material = calor.current.material as THREE.PointsMaterial;
      material.opacity = mostrarCampos ? Math.min(1, potencia * 1.4) : 0;
      const tiempo = clock.elapsedTime;
      semillasCalor.forEach((semilla, k) => {
        const avance = (semilla.fase + tiempo * (0.35 + potencia * 0.5)) % 1;
        posicionesCalor[k * 3] = semilla.x + Math.sin(tiempo * 2 + k) * 0.05;
        posicionesCalor[k * 3 + 1] = ALTURA_CONDUCTOR + 0.3 + avance * 1.2;
        posicionesCalor[k * 3 + 2] = semilla.z;
      });
      calor.current.geometry.attributes.position.needsUpdate = true;
    }
    if (valor.current) {
      valor.current.textContent = `${aPrecision(resistencia, 4)} Ω · V_R ${aPrecision(muestra.vR, 3)} V · P ${aPrecision(muestra.potenciaR, 3)} W`;
    }
  });

  const posicionesBandas = [-0.36, -0.2, -0.04, 0.32];

  return (
    <ComponenteInteractivo id="resistor" posicion={POSICIONES.resistor} seleccionado={seleccionado} alSeleccionar={alSeleccionar} colorSeleccion={paleta.seleccion} radioSeleccion={1.1}>
      {/* Núcleo cerámico */}
      <mesh position={[0, ALTURA_CONDUCTOR, 0]} rotation={ROTACION_EJE_X} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 1.22, 32]} />
        <meshStandardMaterial ref={materialNucleo} color="#efe9dc" roughness={0.8} emissive={paleta.calor} emissiveIntensity={0} />
      </mesh>

      {/* Película de carbón en espiral */}
      <group ref={pelicula} position={[0, ALTURA_CONDUCTOR, 0]} rotation={ROTACION_EJE_X}>
        <mesh geometry={geometriaPelicula}>
          <meshStandardMaterial ref={materialPelicula} color="#1b1b1b" roughness={0.6} emissive={paleta.calor} emissiveIntensity={0} toneMapped={false} />
        </mesh>
      </group>

      {/* Capuchones metálicos y terminales */}
      {[0, 1].map((k) => (
        <group key={k} ref={(g) => (capuchones.current[k] = g)} position={[(k === 0 ? -1 : 1) * 0.62, ALTURA_CONDUCTOR, 0]}>
          <mesh rotation={ROTACION_EJE_X}>
            <cylinderGeometry args={[0.24, 0.24, 0.16, 24]} />
            <meshStandardMaterial color={paleta.metal} metalness={0.9} roughness={0.25} />
          </mesh>
          <mesh rotation={ROTACION_EJE_X} position={[(k === 0 ? -1 : 1) * 0.25, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.45, 8]} />
            <meshStandardMaterial color={paleta.metal} metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Recubrimiento epóxico con bandas */}
      <group ref={recubrimiento} position={[0, ALTURA_CONDUCTOR, 0]}>
        <mesh rotation={ROTACION_EJE_X} castShadow>
          <capsuleGeometry args={[0.28, 1.0, 8, 32]} />
          <meshStandardMaterial ref={materialCuerpo} color="#d9c39a" roughness={0.55} emissive={paleta.calor} emissiveIntensity={0} />
        </mesh>
        {bandas.map((banda, k) => (
          <mesh key={k} position={[posicionesBandas[k], 0, 0]} rotation={ROTACION_EJE_X}>
            <cylinderGeometry args={[0.288, 0.288, 0.085, 32]} />
            <meshStandardMaterial
              ref={(m) => (materialesBandas.current[k] = m)}
              color={banda.color}
              roughness={0.45}
              metalness={k === 3 || banda.nombre.startsWith('oro') ? 0.7 : 0}
            />
          </mesh>
        ))}
      </group>

      {/* Calor disipado (ilustrativo) */}
      <points ref={calor}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[posicionesCalor, 3]} />
        </bufferGeometry>
        <pointsMaterial color={paleta.calor} size={0.07} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      <EtiquetaComponente ref={valor} posicion={[0, 1.45, 0]} nombre="Resistor R" visible={mostrarEtiquetas && !explotado} seleccionado={seleccionado} />
      <EtiquetaParte posicion={[0, ALTURA_CONDUCTOR + 1.7, 0]} texto={`Recubrimiento + bandas (${bandas.slice(0, 3).map((b) => b.nombre).join(', ')})`} visible={explotado} />
      <EtiquetaParte posicion={[0.95, ALTURA_CONDUCTOR + 0.6, 0]} texto="Película de carbón en espiral" visible={explotado} />
      <EtiquetaParte posicion={[0, ALTURA_CONDUCTOR - 0.35, 0.45]} texto="Núcleo cerámico" visible={explotado} />
      <EtiquetaParte posicion={[1.3, ALTURA_CONDUCTOR + 0.35, 0]} texto="Capuchón y terminal" visible={explotado} />
    </ComponenteInteractivo>
  );
}
