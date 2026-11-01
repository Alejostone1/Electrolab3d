import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { leerMuestraActual } from '@/hooks/useSimulacion';
import { useLaboratorio } from '@/store/useLaboratorio';
import { aPrecision, formatearIngenieria } from '@/utils/formato';
import { ALTURA_CONDUCTOR, POSICIONES } from './geometria';
import type { PropiedadesComponente3D } from './tipos3d';
import { aplicarTransparencia, ComponenteInteractivo, EtiquetaComponente, EtiquetaParte, useFactorAnimado } from './utilidades3d';

const ALTURA = 1.05;
const SEPARACION = 0.32;
const CARGAS_LADO = 5;
const CARGAS_POR_PLACA = CARGAS_LADO * CARGAS_LADO;
const LINEAS_CAMPO = 9;

/**
 * Capacitor de placas paralelas. La cantidad de cargas visibles y la intensidad
 * del campo eléctrico (ilustrativo) se calculan con q(t)/(C·E₀).
 */
export function Capacitor3D({ paleta, seleccionado, alSeleccionar, explotado, rayosX, mostrarCampos, mostrarEtiquetas }: PropiedadesComponente3D) {
  const capacitancia = useLaboratorio((s) => s.parametros.capacitancia);
  const factorDespiece = useFactorAnimado(explotado);
  const factorRayos = useFactorAnimado(rayosX);
  const placas = useRef<Array<THREE.Group | null>>([]);
  const dielectrico = useRef<THREE.Group>(null);
  const carcasa = useRef<THREE.Group>(null);
  const materialCarcasa = useRef<THREE.MeshPhysicalMaterial>(null);
  const materialesPlaca = useRef<Array<THREE.MeshStandardMaterial | null>>([]);
  const cargasPositivas = useRef<THREE.InstancedMesh>(null);
  const cargasNegativas = useRef<THREE.InstancedMesh>(null);
  const campo = useRef<THREE.Group>(null);
  const materialCampo = useMemo(
    () => new THREE.MeshBasicMaterial({ color: paleta.campoElectrico, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }),
    [paleta.campoElectrico],
  );
  const valor = useRef<HTMLSpanElement>(null);
  const auxiliar = useMemo(() => new THREE.Object3D(), []);

  // Malla de posiciones en la cara interna de cada placa (orden aleatorio estable).
  const rejilla = useMemo(() => {
    const puntos: Array<[number, number]> = [];
    for (let a = 0; a < CARGAS_LADO; a++) for (let b = 0; b < CARGAS_LADO; b++) puntos.push([(a - 2) * 0.24, (b - 2) * 0.24]);
    return puntos.sort(() => Math.random() - 0.5);
  }, []);

  useFrame(({ clock }) => {
    const d = factorDespiece.current;
    const separacion = SEPARACION + d * 0.95;
    placas.current.forEach((g, k) => {
      if (g) g.position.x = (k === 0 ? 1 : -1) * separacion;
    });
    if (dielectrico.current) dielectrico.current.position.y = ALTURA + d * 1.6;
    if (carcasa.current) carcasa.current.position.y = ALTURA + d * 2.9;
    aplicarTransparencia(materialCarcasa.current, Math.max(factorRayos.current, d), 0.04, 0.18);

    const muestra = leerMuestraActual();
    const carga = muestra.conectado || muestra.q !== 0 ? muestra.cargaNormalizada : 0;
    const magnitud = Math.min(1, Math.abs(carga));
    const visibles = Math.round(magnitud * CARGAS_POR_PLACA);
    // Con q > 0 la placa del lado +x (por donde entra la corriente convencional) es positiva.
    const signo = carga >= 0 ? 1 : -1;
    const actualizarCargas = (malla: THREE.InstancedMesh | null, lado: number) => {
      if (!malla) return;
      for (let k = 0; k < CARGAS_POR_PLACA; k++) {
        const [y, z] = rejilla[k];
        auxiliar.position.set(lado * (separacion - 0.09), ALTURA + y, z);
        auxiliar.scale.setScalar(k < visibles ? 1 + Math.sin(clock.elapsedTime * 5 + k) * 0.08 : 0.0001);
        auxiliar.updateMatrix();
        malla.setMatrixAt(k, auxiliar.matrix);
      }
      malla.instanceMatrix.needsUpdate = true;
    };
    actualizarCargas(cargasPositivas.current, signo);
    actualizarCargas(cargasNegativas.current, -signo);

    materialesPlaca.current.forEach((m, k) => {
      if (!m) return;
      const positiva = (k === 0 ? 1 : -1) === signo;
      m.emissive.set(positiva ? paleta.cargaPositiva : paleta.cargaNegativa);
      m.emissiveIntensity = magnitud * 0.3;
    });
    if (campo.current) {
      campo.current.visible = mostrarCampos && magnitud > 0.02;
      campo.current.scale.x = signo * (separacion / SEPARACION);
    }
    materialCampo.opacity = magnitud * 0.85;
    if (valor.current) {
      valor.current.textContent = `${aPrecision(capacitancia * 1e6, 4)} µF · q ${formatearIngenieria(muestra.q, 'C')} · V_C ${aPrecision(muestra.vC, 3)} V`;
    }
  });

  const lineasCampo = useMemo(() => {
    const posiciones: Array<[number, number]> = [];
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) posiciones.push([(a - 1) * 0.38, (b - 1) * 0.38]);
    return posiciones.slice(0, LINEAS_CAMPO);
  }, []);

  return (
    <ComponenteInteractivo id="capacitor" posicion={POSICIONES.capacitor} seleccionado={seleccionado} alSeleccionar={alSeleccionar} colorSeleccion={paleta.seleccion} radioSeleccion={1.25}>
      <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.9, 0.2, 1.2]} />
        <meshStandardMaterial color={paleta.plastico} roughness={0.7} />
      </mesh>

      {/* Placas conductoras con sus terminales */}
      {[0, 1].map((k) => (
        <group key={k} ref={(g) => (placas.current[k] = g)} position={[(k === 0 ? 1 : -1) * SEPARACION, 0, 0]}>
          <mesh position={[0, ALTURA, 0]} castShadow>
            <boxGeometry args={[0.07, 1.3, 1.3]} />
            <meshStandardMaterial
              ref={(m) => (materialesPlaca.current[k] = m)}
              color={paleta.metal}
              metalness={0.85}
              roughness={0.25}
              emissive={paleta.cargaPositiva}
              emissiveIntensity={0}
            />
          </mesh>
          <mesh position={[(k === 0 ? 1 : -1) * 0.22, ALTURA_CONDUCTOR, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.035, 0.035, 0.44, 8]} />
            <meshStandardMaterial color={paleta.metal} metalness={0.9} roughness={0.3} />
          </mesh>
          <mesh position={[0, (ALTURA_CONDUCTOR + ALTURA - 0.65) / 2, 0]}>
            <boxGeometry args={[0.06, ALTURA - 0.65 - ALTURA_CONDUCTOR + 0.06, 0.08]} />
            <meshStandardMaterial color={paleta.metal} metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Dieléctrico */}
      <group ref={dielectrico} position={[0, ALTURA, 0]}>
        <mesh>
          <boxGeometry args={[SEPARACION * 2 - 0.2, 1.18, 1.18]} />
          <meshPhysicalMaterial color="#5eead4" transparent opacity={0.28} roughness={0.15} transmission={0.4} depthWrite={false} />
        </mesh>
      </group>

      {/* Cargas acumuladas */}
      <instancedMesh ref={cargasPositivas} args={[undefined, undefined, CARGAS_POR_PLACA]}>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshBasicMaterial color={paleta.cargaPositiva} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={cargasNegativas} args={[undefined, undefined, CARGAS_POR_PLACA]}>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshBasicMaterial color={paleta.cargaNegativa} toneMapped={false} />
      </instancedMesh>

      {/* Campo eléctrico ilustrativo: de la placa positiva a la negativa */}
      <group ref={campo} position={[0, ALTURA, 0]}>
        {lineasCampo.map(([y, z], k) => (
          <group key={k} position={[0, y, z]}>
            <mesh rotation={[0, 0, Math.PI / 2]} material={materialCampo}>
              <cylinderGeometry args={[0.012, 0.012, SEPARACION * 1.5, 6]} />
            </mesh>
            <mesh position={[-SEPARACION * 0.78, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={materialCampo}>
              <coneGeometry args={[0.04, 0.1, 8]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Carcasa acrílica */}
      <group ref={carcasa} position={[0, ALTURA, 0]}>
        <mesh>
          <boxGeometry args={[1.25, 1.62, 1.62]} />
          <meshPhysicalMaterial ref={materialCarcasa} color="#9fd8ff" transparent opacity={0.16} roughness={0.08} metalness={0} depthWrite={false} />
        </mesh>
      </group>

      <EtiquetaComponente ref={valor} posicion={[0, 2.25, 0]} nombre="Capacitor C" visible={mostrarEtiquetas && !explotado} seleccionado={seleccionado} />
      <EtiquetaParte posicion={[0, ALTURA + 3.85, 0]} texto="Carcasa aislante" visible={explotado} />
      <EtiquetaParte posicion={[0, ALTURA + 2.3, 0]} texto="Dieléctrico" visible={explotado} />
      <EtiquetaParte posicion={[1.4, ALTURA + 0.85, 0]} texto="Placa (+q cuando q > 0)" visible={explotado} />
      <EtiquetaParte posicion={[-1.4, ALTURA + 0.85, 0]} texto="Placa (−q)" visible={explotado} lado="izquierda" />
    </ComponenteInteractivo>
  );
}
