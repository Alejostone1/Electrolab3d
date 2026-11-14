import { Html, RoundedBox } from '@react-three/drei';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import {
  COLUMNAS,
  FILAS,
  FILAS_INFERIORES,
  FILAS_SUPERIORES,
  huecoMasCercano,
  huecosDeTira,
  posicionHueco,
  terminalesPara,
  todosLosHuecos,
  Z_FILA,
} from '@/engine';
import type { Paleta3D } from '../laboratorio/components-3d/paleta';
import { Pieza3D } from './Piezas3D';
import { terminalesValidos, useEnsamblaje } from './useEnsamblaje';

/** Escala de la placa: 1 unidad de escena = 1 paso de 2.54 mm × ESCALA. */
export const ESCALA = 0.34;
const ANCHO = COLUMNAS + 3;
const PROFUNDO = 20;
const HUECOS = todosLosHuecos();
const PALETA_REDES = ['#22d3ee', '#f59e0b', '#34d399', '#a78bfa', '#f87171', '#facc15', '#38bdf8', '#fb7185'];

/** Convierte un punto del mundo al plano de la placa (en pasos). */
function aPlaca(punto: THREE.Vector3): [number, number] {
  return [punto.x / ESCALA, punto.z / ESCALA];
}

/** Permite soltar componentes arrastrados desde la biblioteca HTML sobre la placa. */
function Proyector({ destino }: { destino: MutableRefObject<((x: number, y: number) => string | null) | null> }) {
  const { camera, gl } = useThree();
  useEffect(() => {
    const raycaster = new THREE.Raycaster();
    const plano = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const punto = new THREE.Vector3();
    destino.current = (x, y) => {
      const rect = gl.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      if (!raycaster.ray.intersectPlane(plano, punto)) return null;
      const [px, pz] = aPlaca(punto);
      return huecoMasCercano(px, pz);
    };
    return () => {
      destino.current = null;
    };
  }, [camera, gl, destino]);
  return null;
}

/** Avanza el reloj de la simulación de la estación. */
function Reloj() {
  const avanzarReloj = useEnsamblaje((s) => s.avanzarReloj);
  useFrame((_, delta) => avanzarReloj(Math.min(delta, 0.1)));
  return null;
}

function Perforaciones({ paleta }: { paleta: Paleta3D }) {
  const malla = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    if (!malla.current) return;
    const auxiliar = new THREE.Object3D();
    HUECOS.forEach((hueco, k) => {
      const [x, z] = posicionHueco(hueco);
      auxiliar.position.set(x, 0.012, z);
      auxiliar.updateMatrix();
      malla.current!.setMatrixAt(k, auxiliar.matrix);
    });
    malla.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={malla} args={[undefined, undefined, HUECOS.length]}>
      <boxGeometry args={[0.38, 0.02, 0.38]} />
      <meshStandardMaterial color={paleta === undefined ? '#222' : '#2a2f36'} roughness={0.9} />
    </instancedMesh>
  );
}

/** Tiras metálicas internas (visibles en el modo "conexiones internas"). */
function TirasInternas({ visible }: { visible: boolean }) {
  const columnas = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    if (!columnas.current) return;
    const auxiliar = new THREE.Object3D();
    let k = 0;
    for (let c = 1; c <= COLUMNAS; c++) {
      for (const bloque of [FILAS_SUPERIORES, FILAS_INFERIORES]) {
        const zMedia = (Z_FILA[bloque[0]] + Z_FILA[bloque[4]]) / 2;
        auxiliar.position.set(c - (COLUMNAS + 1) / 2, -0.25, zMedia);
        auxiliar.updateMatrix();
        columnas.current.setMatrixAt(k++, auxiliar.matrix);
      }
    }
    columnas.current.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <group visible={visible}>
      <instancedMesh ref={columnas} args={[undefined, undefined, COLUMNAS * 2]}>
        <boxGeometry args={[0.5, 0.12, 4.5]} />
        <meshStandardMaterial color="#c9ced6" metalness={0.9} roughness={0.25} />
      </instancedMesh>
      {(['X+', 'X-', 'Y+', 'Y-'] as const).map((riel) => (
        <mesh key={riel} position={[0, -0.25, Z_FILA[riel]]}>
          <boxGeometry args={[COLUMNAS - 0.5, 0.12, 0.5]} />
          <meshStandardMaterial color="#c9ced6" metalness={0.9} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

/** Resalta la perforación señalada y toda su tira interna. */
function ResaltadoTira({ hueco, color }: { hueco: string | null; color: string }) {
  const huecos = hueco ? huecosDeTira(hueco) : [];
  return (
    <group>
      {huecos.map((h) => {
        const [x, z] = posicionHueco(h);
        return (
          <mesh key={h} position={[x, 0.03, z]}>
            <boxGeometry args={[h === hueco ? 0.62 : 0.46, 0.02, h === hueco ? 0.62 : 0.46]} />
            <meshBasicMaterial color={color} transparent opacity={h === hueco ? 0.95 : 0.45} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Marcas de color por nodo eléctrico en las perforaciones usadas. */
function MarcasRedes() {
  const redes = useEnsamblaje((s) => s.analisis.redes);
  const colores = useMemo(() => {
    const indice = new Map<string, number>();
    for (const red of redes.values()) if (!indice.has(red)) indice.set(red, indice.size);
    return indice;
  }, [redes]);
  return (
    <group>
      {[...redes.entries()].map(([hueco, red]) => {
        const [x, z] = posicionHueco(hueco);
        return (
          <mesh key={hueco} position={[x, 0.025, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.42, 20]} />
            <meshBasicMaterial color={PALETA_REDES[colores.get(red)! % PALETA_REDES.length]} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Vista previa de la pieza o cable que se está colocando o moviendo. */
function Fantasma({ paleta }: { paleta: Paleta3D }) {
  const herramienta = useEnsamblaje((s) => s.herramienta);
  const hueco = useEnsamblaje((s) => s.huecoActivo);
  const orientacion = useEnsamblaje((s) => s.orientacion);
  const piezas = useEnsamblaje((s) => s.piezas);
  const arrastrando = useEnsamblaje((s) => s.arrastrando);
  if (!hueco) return null;

  let terminales: [string, string] | null = null;
  let excepto: string | undefined;
  if (herramienta.modo === 'colocar') terminales = terminalesPara(herramienta.tipo, hueco, orientacion);
  else if (herramienta.modo === 'cable' && herramienta.inicio) terminales = [herramienta.inicio, hueco];
  else if (arrastrando) {
    const pieza = piezas.find((p) => p.id === arrastrando)!;
    const [ax, az] = posicionHueco(pieza.terminales[0]);
    const [bx, bz] = posicionHueco(pieza.terminales[1]);
    const [hx, hz] = posicionHueco(hueco);
    const otro = huecoMasCercano(hx + (bx - ax), hz + (bz - az));
    terminales = otro ? [hueco, otro] : null;
    excepto = pieza.id;
  } else return null;

  const valido = terminalesValidos(piezas, terminales, excepto);
  const color = valido ? paleta.seleccion : '#ef4444';
  if (!terminales) {
    const [x, z] = posicionHueco(hueco);
    return (
      <mesh position={[x, 0.4, z]}>
        <sphereGeometry args={[0.25, 12, 12]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.7} />
      </mesh>
    );
  }
  const [ax, az] = posicionHueco(terminales[0]);
  const [bx, bz] = posicionHueco(terminales[1]);
  const largo = Math.hypot(bx - ax, bz - az);
  return (
    <group>
      {[
        [ax, az],
        [bx, bz],
      ].map(([x, z], k) => (
        <mesh key={k} position={[x, 0.35, z]}>
          <cylinderGeometry args={[0.16, 0.16, 0.7, 12]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} toneMapped={false} />
        </mesh>
      ))}
      <mesh position={[(ax + bx) / 2, 0.75, (az + bz) / 2]} rotation={[0, -Math.atan2(bz - az, bx - ax), Math.PI / 2]}>
        <cylinderGeometry args={[0.32, 0.32, Math.max(0.2, largo - 0.4), 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

interface PropiedadesProtoboard {
  paleta: Paleta3D;
  proyector: MutableRefObject<((x: number, y: number) => string | null) | null>;
}

export function Protoboard3D({ paleta, proyector }: PropiedadesProtoboard) {
  const piezas = useEnsamblaje((s) => s.piezas);
  const seleccion = useEnsamblaje((s) => s.seleccion);
  const analisis = useEnsamblaje((s) => s.analisis);
  const verConexiones = useEnsamblaje((s) => s.verConexiones);
  const verRedes = useEnsamblaje((s) => s.verRedes);
  const huecoActivo = useEnsamblaje((s) => s.huecoActivo);
  const { establecerHueco, clicEnHueco, soltar } = useEnsamblaje.getState();

  const conError = useMemo(() => new Set(analisis.errores.flatMap((e) => e.piezas)), [analisis]);
  const enLazo = useMemo(() => new Set(analisis.valido ? piezas.map((p) => p.id) : []), [analisis, piezas]);

  const huecoDe = (evento: ThreeEvent<PointerEvent | MouseEvent>) => {
    const [x, z] = aPlaca(evento.point);
    return huecoMasCercano(x, z);
  };

  const etiquetasColumnas = [1, 5, 10, 15, 20, 25, 30];

  return (
    <group scale={ESCALA}>
      <Proyector destino={proyector} />
      <Reloj />
      <RoundedBox args={[ANCHO, 1, PROFUNDO]} radius={0.35} position={[0, -0.5, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#eeece6" roughness={0.75} transparent opacity={verConexiones ? 0.35 : 1} depthWrite={!verConexiones} />
      </RoundedBox>
      {/* Canal central y franjas de los rieles (+ rojo, − azul) */}
      <mesh position={[0, 0.005, 0]}>
        <boxGeometry args={[ANCHO - 1.5, 0.01, 0.8]} />
        <meshStandardMaterial color="#d5d2c9" />
      </mesh>
      {[
        [-8.9, '#d64545'],
        [-6.5, '#2f6fdb'],
        [6.5, '#d64545'],
        [8.9, '#2f6fdb'],
      ].map(([z, color]) => (
        <mesh key={z as number} position={[0, 0.006, z as number]}>
          <boxGeometry args={[COLUMNAS, 0.01, 0.08]} />
          <meshBasicMaterial color={color as string} />
        </mesh>
      ))}
      <Perforaciones paleta={paleta} />
      <TirasInternas visible={verConexiones} />
      {verRedes && <MarcasRedes />}
      <ResaltadoTira hueco={huecoActivo} color={paleta.campoMagnetico} />

      {/* Rótulos de filas y columnas */}
      {FILAS.map((fila) => (
        <Html key={fila} position={[-(COLUMNAS + 1) / 2 - 1, 0.1, Z_FILA[fila]]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
          <span className="rotulo-placa">{fila}</span>
        </Html>
      ))}
      {etiquetasColumnas.map((c) => (
        <Html key={c} position={[c - (COLUMNAS + 1) / 2, 0.1, -9.6]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
          <span className="rotulo-placa">{c}</span>
        </Html>
      ))}

      {/* Plano invisible que detecta la perforación bajo el puntero */}
      <mesh
        position={[0, 0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={(e) => establecerHueco(huecoDe(e))}
        onPointerLeave={() => establecerHueco(null)}
        onPointerUp={(e) => {
          if (useEnsamblaje.getState().arrastrando) soltar(huecoDe(e));
        }}
        onClick={(e) => {
          e.stopPropagation();
          const hueco = huecoDe(e);
          const estado = useEnsamblaje.getState();
          if (hueco && !estado.arrastrando && performance.now() - estado.soltadoEn > 300) clicEnHueco(hueco);
        }}
      >
        <planeGeometry args={[ANCHO, PROFUNDO]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {piezas.map((pieza) => (
        <Pieza3D key={pieza.id} pieza={pieza} paleta={paleta} seleccionada={seleccion === pieza.id} conError={conError.has(pieza.id)} enLazo={enLazo.has(pieza.id)} />
      ))}
      <Fantasma paleta={paleta} />
    </group>
  );
}
