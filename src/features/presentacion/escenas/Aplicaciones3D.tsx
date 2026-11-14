import { Html, RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { amplitudResonancia, muestrearEn, parametrosSegundoOrden, simularCircuito, type ResultadoSimulacion } from '@/engine';
import { CurvaHelice } from '../../laboratorio/components-3d/geometria';
import type { Paleta3D } from '../../laboratorio/components-3d/paleta';

/** Reloj en bucle: recorre la simulación y espera `pausa` segundos antes de repetir. */
function useRelojBucle(duracionReal: number, pausa = 1.2) {
  const reloj = useRef(0);
  useFrame((_, delta) => {
    reloj.current = (reloj.current + Math.min(delta, 0.1)) % (duracionReal + pausa);
  });
  return () => Math.min(reloj.current / duracionReal, 1);
}

/** Simula con el motor real un sistema de 2.º orden y devuelve x/x∞ en función del avance [0, 1]. */
function useRespuestaEscalon(zeta: number, omega0: number) {
  return useMemo(() => {
    const resultado: ResultadoSimulacion = simularCircuito(parametrosSegundoOrden(zeta, omega0));
    const referencia = resultado.parametros.capacitancia;
    return (avance: number) => muestrearEn(resultado, avance * resultado.duracion).q / referencia;
  }, [zeta, omega0]);
}

function Rotulo({ posicion, titulo, detalle }: { posicion: [number, number, number]; titulo: string; detalle: string }) {
  return (
    <Html position={posicion} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div className="rotulo-escena">
        <b>{titulo}</b>
        <span>{detalle}</span>
      </div>
    </Html>
  );
}

/* ─────────────── Suspensión de un automóvil (ζ ≈ 0.3, subamortiguada) ─────────────── */
export function Suspension3D({ paleta }: { paleta: Paleta3D }) {
  const respuesta = useRespuestaEscalon(0.3, 2 * Math.PI * 1.2);
  const reloj = useRef(0);
  const carroceria = useRef<THREE.Group>(null);
  const rueda = useRef<THREE.Group>(null);
  const resorte = useRef<THREE.Mesh>(null);
  const bordillo = useRef<THREE.Mesh>(null);
  const llanta = useRef<THREE.Group>(null);
  const geometriaResorte = useMemo(() => {
    const g = new THREE.TubeGeometry(new CurvaHelice(0.28, 1, 7), 240, 0.05, 6);
    g.translate(0, 0.5, 0);
    return g;
  }, []);
  const ESCALON = 0.45;
  const LLEGADA = 1.2;
  const RESPUESTA = 4.5;

  useFrame((_, delta) => {
    reloj.current = (reloj.current + Math.min(delta, 0.1)) % (LLEGADA + RESPUESTA + 0.8);
    const t = reloj.current;
    // Fase 1: el bordillo se acerca. Fase 2: la rueda sube (escalón) y la carrocería responde.
    const subio = t >= LLEGADA ? 1 : 0;
    const avance = subio ? Math.min(1, (t - LLEGADA) / RESPUESTA) : 0;
    const yRueda = 0.75 + ESCALON * subio;
    const yCarro = 2.35 + ESCALON * (subio ? respuesta(avance) : 0);
    if (bordillo.current) bordillo.current.position.x = subio ? 1.2 : -7 + (t / LLEGADA) * 8.2;
    if (rueda.current) rueda.current.position.y = yRueda;
    if (carroceria.current) carroceria.current.position.y = yCarro;
    if (resorte.current) {
      resorte.current.position.y = yRueda + 0.3;
      resorte.current.scale.y = yCarro - 0.35 - (yRueda + 0.3);
    }
    if (llanta.current) llanta.current.rotation.z -= delta * (subio ? 0.4 : 3);
  });

  return (
    <group>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[9, 0.1, 3]} />
        <meshStandardMaterial color={paleta.placa} roughness={0.9} />
      </mesh>
      <mesh ref={bordillo} position={[0, ESCALON / 2, 0]} receiveShadow>
        <boxGeometry args={[4, ESCALON, 2.6]} />
        <meshStandardMaterial color={paleta.placaBorde} roughness={0.9} />
      </mesh>
      <group ref={rueda} position={[0, 0.75, 0]}>
        <group ref={llanta}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.55, 0.22, 20, 48]} />
            <meshStandardMaterial color="#1c1f24" roughness={0.85} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.38, 0.38, 0.3, 24]} />
            <meshStandardMaterial color={paleta.metal} metalness={0.9} roughness={0.25} />
          </mesh>
          {[0, 1, 2, 3, 4].map((k) => (
            <mesh key={k} rotation={[0, 0, (k / 5) * Math.PI * 2]} position={[0, 0, 0.16]}>
              <boxGeometry args={[0.08, 0.6, 0.04]} />
              <meshStandardMaterial color="#8a96a3" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
        </group>
      </group>
      <mesh ref={resorte} geometry={geometriaResorte} position={[0, 1.05, 0]}>
        <meshStandardMaterial color="#d14b3b" metalness={0.6} roughness={0.35} />
      </mesh>
      <group ref={carroceria} position={[0, 2.35, 0]}>
        <RoundedBox args={[4.6, 0.7, 2.4]} radius={0.18} castShadow>
          <meshPhysicalMaterial color="#2f6fdb" metalness={0.6} roughness={0.25} clearcoat={1} />
        </RoundedBox>
        <mesh position={[0, -0.32, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.5, 16]} />
          <meshStandardMaterial color="#2b3440" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
      <Rotulo posicion={[0, 3.6, 0]} titulo="Suspensión · ζ ≈ 0.3" detalle="Sube el bordillo: la carrocería sobrepasa un poco y se asienta" />
    </group>
  );
}

/* ─────────────── Instrumento de aguja (ζ ≈ 1, crítico) ─────────────── */
export function Instrumento3D({ paleta }: { paleta: Paleta3D }) {
  const avance = useRelojBucle(3, 1.5);
  const critico = useRespuestaEscalon(1, 2 * Math.PI * 1.5);
  const sinAmortiguar = useRespuestaEscalon(0.15, 2 * Math.PI * 1.5);
  const aguja = useRef<THREE.Group>(null);
  const fantasma = useRef<THREE.Group>(null);
  const LECTURA = 0.75;
  const angulo = (x: number) => THREE.MathUtils.degToRad(55 - 110 * Math.min(1.25, LECTURA * x));

  useFrame(() => {
    const a = avance();
    if (aguja.current) aguja.current.rotation.z = angulo(critico(a));
    if (fantasma.current) fantasma.current.rotation.z = angulo(sinAmortiguar(a));
  });

  const marcas = useMemo(() => Array.from({ length: 23 }, (_, k) => k), []);

  return (
    <group position={[0, 1.6, 0]}>
      <RoundedBox args={[4.4, 3.2, 0.6]} radius={0.15} position={[0, 0, -0.35]} castShadow>
        <meshStandardMaterial color="#1b2330" roughness={0.6} />
      </RoundedBox>
      <mesh position={[0, 0.1, -0.04]}>
        <planeGeometry args={[3.9, 2.6]} />
        <meshStandardMaterial color="#f3efe4" roughness={0.9} />
      </mesh>
      {marcas.map((k) => {
        const a = THREE.MathUtils.degToRad(55 - (110 * k) / 22);
        const largo = k % 5 === 0 ? 0.28 : 0.15;
        return (
          <mesh key={k} position={[-Math.sin(a) * 1.75, -0.9 + Math.cos(a) * 1.75, -0.02]} rotation={[0, 0, a]}>
            <planeGeometry args={[0.025, largo]} />
            <meshBasicMaterial color="#1b2330" />
          </mesh>
        );
      })}
      <mesh position={[-Math.sin(angulo(1)) * 1.98, -0.9 + Math.cos(angulo(1)) * 1.98, -0.02]}>
        <circleGeometry args={[0.05, 16]} />
        <meshBasicMaterial color={paleta.seleccion} />
      </mesh>
      <group ref={fantasma} position={[0, -0.9, 0]}>
        <mesh position={[0, 0.9, 0]}>
          <planeGeometry args={[0.035, 1.8]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.35} />
        </mesh>
      </group>
      <group ref={aguja} position={[0, -0.9, 0.01]}>
        <mesh position={[0, 0.9, 0]}>
          <planeGeometry args={[0.04, 1.8]} />
          <meshBasicMaterial color="#c0392b" />
        </mesh>
        <mesh>
          <circleGeometry args={[0.1, 20]} />
          <meshBasicMaterial color="#1b2330" />
        </mesh>
      </group>
      <Rotulo posicion={[0, 2.1, 0]} titulo="Instrumento de aguja · ζ ≈ 1" detalle="Rojo: crítico, llega sin oscilar · Ámbar: ζ = 0.15, oscila" />
    </group>
  );
}

/* ─────────────── Cierrapuertas hidráulico (ζ ≈ 2.5, sobreamortiguado) ─────────────── */
export function Cierrapuertas3D({ paleta }: { paleta: Paleta3D }) {
  const avance = useRelojBucle(5, 1.5);
  const sobre = useRespuestaEscalon(2.5, 2 * Math.PI * 0.6);
  const puerta = useRef<THREE.Group>(null);
  const brazo = useRef<THREE.Group>(null);

  useFrame(() => {
    const angulo = (Math.PI / 2) * (1 - sobre(avance()));
    if (puerta.current) puerta.current.rotation.y = angulo;
    if (brazo.current) brazo.current.rotation.y = angulo * 0.55;
  });

  return (
    <group position={[-1, 0, 0]}>
      <mesh position={[1, -0.05, 0.5]} receiveShadow>
        <boxGeometry args={[7, 0.1, 5]} />
        <meshStandardMaterial color={paleta.placa} roughness={0.9} />
      </mesh>
      {/* Marco */}
      <mesh position={[-0.12, 1.9, 0]} castShadow>
        <boxGeometry args={[0.2, 3.8, 0.3]} />
        <meshStandardMaterial color="#d8d2c4" roughness={0.6} />
      </mesh>
      <mesh position={[1.2, 3.85, 0]} castShadow>
        <boxGeometry args={[2.85, 0.2, 0.3]} />
        <meshStandardMaterial color="#d8d2c4" roughness={0.6} />
      </mesh>
      <mesh position={[2.55, 1.9, 0]} castShadow>
        <boxGeometry args={[0.2, 3.8, 0.3]} />
        <meshStandardMaterial color="#d8d2c4" roughness={0.6} />
      </mesh>
      {/* Hoja de la puerta: bisagra en x = 0 */}
      <group ref={puerta}>
        <mesh position={[1.2, 1.85, 0]} castShadow>
          <boxGeometry args={[2.4, 3.6, 0.1]} />
          <meshStandardMaterial color="#8a5a3b" roughness={0.55} />
        </mesh>
        <mesh position={[2.15, 1.75, 0.12]}>
          <sphereGeometry args={[0.07, 14, 14]} />
          <meshStandardMaterial color={paleta.metal} metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Cuerpo del cierrapuertas (cilindro hidráulico) */}
        <mesh position={[0.55, 3.45, 0.16]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.8, 16]} />
          <meshStandardMaterial color="#9aa5b1" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
      <group ref={brazo} position={[0.95, 3.45, 0.24]}>
        <mesh position={[0.35, 0, 0]}>
          <boxGeometry args={[0.7, 0.05, 0.05]} />
          <meshStandardMaterial color="#2b3440" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>
      <Rotulo posicion={[1.2, 4.6, 0]} titulo="Cierrapuertas hidráulico · ζ ≈ 2.5" detalle="Cierra despacio, sin golpear ni rebotar" />
    </group>
  );
}

/* ─────────────── Sintonizador de radio (RLC con Q alto) ─────────────── */
const ESTACIONES = [0.8, 1.0, 1.25];
const FACTOR_CALIDAD = 25;

export function Sintonizador3D({ paleta }: { paleta: Paleta3D }) {
  const reloj = useRef(0);
  const rotor = useRef<THREE.Group>(null);
  const antenas = useRef<Array<THREE.MeshStandardMaterial | null>>([]);
  const barras = useRef<Array<THREE.Mesh | null>>([]);
  const marcador = useRef<THREE.Mesh>(null);
  const BARRAS = 60;

  useFrame((_, delta) => {
    reloj.current += Math.min(delta, 0.1);
    // El rotor gira y cambia C: la resonancia ω₀ = 1/√(LC) barre entre 0.7 y 1.35 (relativo).
    const fase = (Math.sin(reloj.current * 0.45) + 1) / 2;
    const omega0 = 0.7 + fase * 0.65;
    if (rotor.current) rotor.current.rotation.y = fase * Math.PI;
    ESTACIONES.forEach((omega, k) => {
      const ganancia = amplitudResonancia(omega, omega0, FACTOR_CALIDAD) / FACTOR_CALIDAD;
      const m = antenas.current[k];
      if (m) m.emissiveIntensity = 0.1 + Math.min(1, ganancia) * 3;
    });
    barras.current.forEach((barra, k) => {
      if (!barra) return;
      const omega = 0.6 + (k / (BARRAS - 1)) * 0.85;
      const alto = Math.min(1, amplitudResonancia(omega, omega0, FACTOR_CALIDAD) / FACTOR_CALIDAD) * 2.2 + 0.03;
      barra.scale.y = alto;
      barra.position.y = alto / 2;
    });
    if (marcador.current) marcador.current.position.x = -3 + ((omega0 - 0.6) / 0.85) * 6;
  });

  return (
    <group>
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[8, 0.1, 5]} />
        <meshStandardMaterial color={paleta.placa} roughness={0.9} />
      </mesh>
      {/* Capacitor variable: estator fijo y rotor giratorio */}
      <group position={[-2.6, 0.9, 1.2]}>
        {Array.from({ length: 6 }).map((_, k) => (
          <mesh key={`e${k}`} position={[0, k * 0.12 - 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.7, 32, 0, Math.PI]} />
            <meshStandardMaterial color={paleta.metal} metalness={0.9} roughness={0.25} side={THREE.DoubleSide} />
          </mesh>
        ))}
        <group ref={rotor}>
          {Array.from({ length: 5 }).map((_, k) => (
            <mesh key={`r${k}`} position={[0, k * 0.12 - 0.24, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.65, 32, Math.PI, Math.PI]} />
              <meshStandardMaterial color="#d4a73c" metalness={0.9} roughness={0.25} side={THREE.DoubleSide} />
            </mesh>
          ))}
          <mesh>
            <cylinderGeometry args={[0.04, 0.04, 1.2, 10]} />
            <meshStandardMaterial color={paleta.metal} metalness={0.9} />
          </mesh>
        </group>
      </group>
      {/* Bobina de antena */}
      <mesh position={[-0.9, 0.6, 1.2]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.35, 0.12, 12, 32]} />
        <meshStandardMaterial color={paleta.cobre} metalness={0.85} roughness={0.3} />
      </mesh>
      {/* Respuesta en frecuencia |H(jω)| calculada */}
      <group position={[0, 0, -1.3]}>
        {Array.from({ length: BARRAS }).map((_, k) => (
          <mesh key={k} ref={(m) => (barras.current[k] = m)} position={[-3 + (k / (BARRAS - 1)) * 6, 0.5, 0]}>
            <boxGeometry args={[0.07, 1, 0.07]} />
            <meshStandardMaterial color={paleta.campoMagnetico} emissive={paleta.campoMagnetico} emissiveIntensity={0.4} />
          </mesh>
        ))}
        <mesh ref={marcador} position={[0, 1.3, 0.1]}>
          <boxGeometry args={[0.03, 2.6, 0.03]} />
          <meshBasicMaterial color={paleta.campoElectrico} toneMapped={false} />
        </mesh>
      </group>
      {/* Emisoras a frecuencias fijas */}
      {ESTACIONES.map((omega, k) => (
        <group key={k} position={[-3 + ((omega - 0.6) / 0.85) * 6, 0, 0.4]}>
          <mesh position={[0, 0.9, 0]}>
            <coneGeometry args={[0.18, 1.8, 4, 1, true]} />
            <meshStandardMaterial color={paleta.metal} wireframe />
          </mesh>
          <mesh position={[0, 1.9, 0]}>
            <sphereGeometry args={[0.1, 14, 14]} />
            <meshStandardMaterial
              ref={(m) => (antenas.current[k] = m)}
              color={paleta.seleccion}
              emissive={paleta.seleccion}
              emissiveIntensity={0.1}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
      <Rotulo posicion={[0, 3.1, -1.3]} titulo="Sintonizador RLC · Q = 25" detalle="Al girar el capacitor variable cambia ω₀ y se enciende la emisora en resonancia" />
    </group>
  );
}
