import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { leerMuestraActual } from '@/hooks/useSimulacion';
import { useLaboratorio } from '@/store/useLaboratorio';
import { aPrecision } from '@/utils/formato';
import { ALTURA_CONDUCTOR, CurvaElipse, CurvaHelice, POSICIONES } from './geometria';
import type { PropiedadesComponente3D } from './tipos3d';
import { aplicarTransparencia, ComponenteInteractivo, EtiquetaComponente, EtiquetaParte, useFactorAnimado } from './utilidades3d';

const ALTURA = 0.82;
const EJE_Z: [number, number, number] = [Math.PI / 2, 0, 0];
const LINEAS_CAMPO = 6;
const FLECHAS_POR_LINEA = 3;
const EJE_Y = new THREE.Vector3(0, 1, 0);
const giro = new THREE.Quaternion();

/**
 * Inductor: devanado de cobre sobre núcleo de ferrita. Las líneas de campo
 * magnético son ilustrativas; su intensidad y sentido siguen a i(t).
 */
export function Inductor3D({ paleta, seleccionado, alSeleccionar, explotado, rayosX, mostrarCampos, mostrarEtiquetas }: PropiedadesComponente3D) {
  const inductancia = useLaboratorio((s) => s.parametros.inductancia);
  // Más inductancia ⇒ más espiras visibles (representación cualitativa).
  const vueltas = Math.round(10 + inductancia * 6);
  const geometriaBobina = useMemo(() => new THREE.TubeGeometry(new CurvaHelice(0.47, 1.45, vueltas), vueltas * 40, 0.052, 8), [vueltas]);
  const curvasCampo = useMemo(() => [new CurvaElipse(0.95, 1.55, 0.95), new CurvaElipse(1.45, 2.0, 1.45)], []);
  const geometriasCampo = useMemo(() => curvasCampo.map((c) => new THREE.TubeGeometry(c, 96, 0.014, 5, true)), [curvasCampo]);

  const factorDespiece = useFactorAnimado(explotado);
  const factorRayos = useFactorAnimado(rayosX);
  const bobina = useRef<THREE.Group>(null);
  const nucleo = useRef<THREE.Group>(null);
  const bridas = useRef<Array<THREE.Group | null>>([]);
  const campo = useRef<THREE.Group>(null);
  const materialBobina = useRef<THREE.MeshStandardMaterial>(null);
  const materialesCampo = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const flechas = useRef<THREE.InstancedMesh>(null);
  const fase = useRef(0);
  const valor = useRef<HTMLSpanElement>(null);
  const auxiliar = useMemo(() => new THREE.Object3D(), []);
  const tangente = useMemo(() => new THREE.Vector3(), []);
  const punto = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const d = factorDespiece.current;
    if (bobina.current) bobina.current.position.y = ALTURA + d * 1.5;
    if (nucleo.current) nucleo.current.position.z = d * 2.1;
    bridas.current.forEach((g, k) => {
      if (!g) return;
      g.position.z = (k === 0 ? -1 : 1) * (0.8 + d * 0.9);
      g.position.y = ALTURA + d * 0.5;
    });
    aplicarTransparencia(materialBobina.current!, factorRayos.current, 0.25);

    const muestra = leerMuestraActual();
    const intensidad = muestra.conectado ? Math.abs(muestra.corrienteNormalizada) : 0;
    const sentido = Math.sign(muestra.i) || 1;
    const visibleCampo = mostrarCampos && !explotado;
    if (campo.current) {
      campo.current.visible = visibleCampo && intensidad > 0.01;
      campo.current.scale.setScalar(0.75 + intensidad * 0.35);
    }
    materialesCampo.current.forEach((m, k) => {
      if (m) m.opacity = intensidad * (k % 2 === 0 ? 0.75 : 0.4);
    });
    if (materialBobina.current) materialBobina.current.emissiveIntensity = intensidad * 0.5;

    // Flechas que recorren las líneas de campo en el sentido dado por la regla de la mano derecha.
    fase.current = (fase.current + sentido * intensidad * Math.min(delta, 0.1) * 0.35 + 1) % 1;
    if (flechas.current) {
      let indice = 0;
      for (let linea = 0; linea < LINEAS_CAMPO; linea++) {
        const curva = curvasCampo[0];
        const angulo = (linea / LINEAS_CAMPO) * Math.PI * 2;
        for (let f = 0; f < FLECHAS_POR_LINEA; f++) {
          const u = (fase.current + f / FLECHAS_POR_LINEA + linea * 0.07) % 1;
          curva.getPointAt(u, punto);
          curva.getTangentAt(u, tangente).multiplyScalar(sentido);
          auxiliar.position.copy(punto);
          auxiliar.quaternion.setFromUnitVectors(EJE_Y, tangente);
          auxiliar.position.applyAxisAngle(EJE_Y, angulo);
          auxiliar.quaternion.premultiply(giro.setFromAxisAngle(EJE_Y, angulo));
          auxiliar.scale.setScalar(visibleCampo ? 0.4 + intensidad * 0.8 : 0.0001);
          auxiliar.updateMatrix();
          flechas.current.setMatrixAt(indice++, auxiliar.matrix);
        }
      }
      flechas.current.instanceMatrix.needsUpdate = true;
    }
    if (valor.current) valor.current.textContent = `${aPrecision(inductancia, 3)} H · V_L ${aPrecision(muestra.vL, 3)} V`;
  });

  return (
    <ComponenteInteractivo id="inductor" posicion={POSICIONES.inductor} seleccionado={seleccionado} alSeleccionar={alSeleccionar} colorSeleccion={paleta.seleccion} radioSeleccion={1.35}>
      <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[1.0, 0.2, 2.0]} />
        <meshStandardMaterial color={paleta.plastico} roughness={0.7} />
      </mesh>
      {[-1, 1].map((lado) => (
        <mesh key={lado} position={[0, (ALTURA_CONDUCTOR + ALTURA) / 2, lado * 0.82]}>
          <cylinderGeometry args={[0.03, 0.03, ALTURA - ALTURA_CONDUCTOR + 0.1, 8]} />
          <meshStandardMaterial color={paleta.cobre} metalness={0.9} roughness={0.25} />
        </mesh>
      ))}

      {/* Núcleo de ferrita */}
      <group ref={nucleo}>
        <mesh position={[0, ALTURA, 0]} rotation={EJE_Z} castShadow>
          <cylinderGeometry args={[0.33, 0.33, 2.1, 32]} />
          <meshStandardMaterial color="#3a3d42" roughness={0.75} metalness={0.3} />
        </mesh>
      </group>

      {/* Bridas del carrete */}
      {[0, 1].map((k) => (
        <group key={k} ref={(g) => (bridas.current[k] = g)} position={[0, ALTURA, (k === 0 ? -1 : 1) * 0.8]}>
          <mesh rotation={EJE_Z} castShadow>
            <cylinderGeometry args={[0.66, 0.66, 0.08, 40]} />
            <meshStandardMaterial color="#e8e2d0" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Devanado de cobre */}
      <group ref={bobina} position={[0, ALTURA, 0]}>
        <mesh geometry={geometriaBobina} rotation={EJE_Z} castShadow>
          <meshStandardMaterial ref={materialBobina} color={paleta.cobre} metalness={0.85} roughness={0.28} emissive={paleta.cobre} emissiveIntensity={0} />
        </mesh>
      </group>

      {/* Campo magnético ilustrativo */}
      <group position={[0, ALTURA, 0]} rotation={EJE_Z}>
        <group ref={campo}>
          {Array.from({ length: LINEAS_CAMPO }).flatMap((_, linea) =>
            geometriasCampo.map((geometria, k) => (
              <mesh key={`${linea}-${k}`} geometry={geometria} rotation={[0, (linea / LINEAS_CAMPO) * Math.PI * 2, 0]}>
                <meshBasicMaterial
                  ref={(m) => (materialesCampo.current[linea * 2 + k] = m)}
                  color={paleta.campoMagnetico}
                  transparent
                  opacity={0}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                  toneMapped={false}
                />
              </mesh>
            )),
          )}
          <instancedMesh ref={flechas} args={[undefined, undefined, LINEAS_CAMPO * FLECHAS_POR_LINEA]}>
            <coneGeometry args={[0.07, 0.18, 10]} />
            <meshBasicMaterial color={paleta.campoMagnetico} toneMapped={false} />
          </instancedMesh>
        </group>
      </group>

      <EtiquetaComponente ref={valor} posicion={[0, 2.3, 0]} nombre="Inductor L" visible={mostrarEtiquetas && !explotado} seleccionado={seleccionado} />
      <EtiquetaParte posicion={[0, ALTURA + 2.2, 0]} texto={`Devanado de cobre (${vueltas} espiras)`} visible={explotado} />
      <EtiquetaParte posicion={[0.7, ALTURA, 2.3]} texto="Núcleo de ferrita" visible={explotado} />
      <EtiquetaParte posicion={[0.9, ALTURA + 0.6, -1.75]} texto="Brida del carrete" visible={explotado} />
    </ComponenteInteractivo>
  );
}
