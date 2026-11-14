import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { muestrearEn, type ResultadoSimulacion } from '@/engine';
import { CurvaHelice } from '../../laboratorio/components-3d/geometria';
import type { Paleta3D } from '../../laboratorio/components-3d/paleta';

const ANCLA = 4.3;
const EQUILIBRIO = 1.55;
const AMPLITUD = 1.15;
const ANCHO_REGISTRO = 2.6;
const PUNTOS = 400;

interface PropiedadesOscilador {
  resultado: ResultadoSimulacion;
  /** Devuelve el tiempo de simulación actual (s). */
  leerTiempo: () => number;
  posicion?: [number, number, number];
  color: string;
  paleta: Paleta3D;
  titulo?: string;
  subtitulo?: string;
}

/** Altura de la masa: parte desplazada y se asienta en el equilibrio cuando q → C·E₀. */
function alturaMasa(cargaNormalizada: number) {
  return EQUILIBRIO + AMPLITUD * (1 - cargaNormalizada);
}

/**
 * Análogo mecánico del circuito RLC: masa (L), resorte (1/C) y amortiguador (R).
 * La posición de la masa, la curva del registrador y la barra de energía se
 * calculan con la serie temporal real del motor (q/(C·E₀)).
 */
export function Oscilador3D({ resultado, leerTiempo, posicion = [0, 0, 0], color, paleta, titulo, subtitulo }: PropiedadesOscilador) {
  const resorte = useRef<THREE.Mesh>(null);
  const masa = useRef<THREE.Group>(null);
  const vastago = useRef<THREE.Mesh>(null);
  const pluma = useRef<THREE.Mesh>(null);
  const guia = useRef<THREE.Mesh>(null);
  const energia = useRef<THREE.Mesh>(null);
  const linea = useRef<THREE.Line>(null);

  const geometriaResorte = useMemo(() => {
    const geometria = new THREE.TubeGeometry(new CurvaHelice(0.32, 1, 11), 360, 0.035, 6);
    geometria.translate(0, -0.5, 0); // de 0 a −1 en Y: se estira con scale.y
    return geometria;
  }, []);

  const referencia = resultado.parametros.capacitancia * resultado.parametros.fuente.amplitud;

  // Curva completa precalculada; cada cuadro solo cambia el rango visible.
  const geometriaCurva = useMemo(() => {
    const posiciones = new Float32Array(PUNTOS * 3);
    for (let k = 0; k < PUNTOS; k++) {
      const t = (k / (PUNTOS - 1)) * resultado.duracion;
      const qn = muestrearEn(resultado, t).q / referencia;
      posiciones[k * 3] = 1.6 + (k / (PUNTOS - 1)) * ANCHO_REGISTRO;
      posiciones[k * 3 + 1] = alturaMasa(qn);
      posiciones[k * 3 + 2] = 0.03;
    }
    const geometria = new THREE.BufferGeometry();
    geometria.setAttribute('position', new THREE.BufferAttribute(posiciones, 3));
    geometria.setDrawRange(0, 0);
    return geometria;
  }, [resultado, referencia]);

  const materialCurva = useMemo(() => new THREE.LineBasicMaterial({ color, linewidth: 2 }), [color]);
  const lineaObjeto = useMemo(() => new THREE.Line(geometriaCurva, materialCurva), [geometriaCurva, materialCurva]);

  // Energía inicial del transitorio: (q₀ − q∞)² / 2C con q₀ = 0.
  const energiaInicial = (referencia * referencia) / (2 * resultado.parametros.capacitancia);

  useFrame(() => {
    const t = Math.min(leerTiempo(), resultado.duracion);
    const muestra = muestrearEn(resultado, t);
    const qn = muestra.q / referencia;
    const y = alturaMasa(qn);
    if (masa.current) masa.current.position.y = y;
    const largo = ANCLA - (y + 0.38);
    if (resorte.current) resorte.current.scale.y = Math.max(0.2, largo);
    if (vastago.current) vastago.current.position.y = y + 0.38 + 0.85;
    if (pluma.current) pluma.current.position.set(1.6 + (t / resultado.duracion) * ANCHO_REGISTRO, y, 0.05);
    if (guia.current) {
      const x0 = 0.55;
      const x1 = 1.6 + (t / resultado.duracion) * ANCHO_REGISTRO;
      guia.current.position.set((x0 + x1) / 2, y, 0.02);
      guia.current.scale.x = Math.max(0.01, x1 - x0);
    }
    geometriaCurva.setDrawRange(0, Math.max(0, Math.round((t / resultado.duracion) * (PUNTOS - 1)) + 1));
    // Energía que le queda al transitorio: ½Li² + (q − q∞)²/2C, relativa a la inicial.
    const desviacion = muestra.q - referencia;
    const restante = (0.5 * resultado.parametros.inductancia * muestra.i ** 2 + desviacion ** 2 / (2 * resultado.parametros.capacitancia)) / energiaInicial;
    if (energia.current) {
      const alto = Math.max(0.001, Math.min(1, restante)) * 2.2;
      energia.current.scale.y = alto;
      energia.current.position.y = 0.35 + alto / 2;
    }
  });

  return (
    <group position={posicion}>
      {/* Estructura */}
      <mesh position={[0, ANCLA + 0.08, 0]} castShadow>
        <boxGeometry args={[1.6, 0.16, 0.8]} />
        <meshStandardMaterial color={paleta.metal} metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[-0.85, ANCLA / 2, -0.3]} castShadow>
        <boxGeometry args={[0.1, ANCLA + 0.2, 0.1]} />
        <meshStandardMaterial color={paleta.plastico} roughness={0.6} />
      </mesh>
      <mesh position={[0.3, 0.06, 0]} receiveShadow>
        <boxGeometry args={[5.4, 0.12, 1.1]} />
        <meshStandardMaterial color={paleta.placa} roughness={0.8} />
      </mesh>

      {/* Resorte (1/C) */}
      <mesh ref={resorte} geometry={geometriaResorte} position={[-0.25, ANCLA, 0]} castShadow>
        <meshStandardMaterial color={paleta.metal} metalness={0.9} roughness={0.25} />
      </mesh>

      {/* Amortiguador (R) */}
      <mesh position={[0.35, ANCLA - 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.13, 1.2, 20]} />
        <meshStandardMaterial color="#2b3440" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh ref={vastago} position={[0.35, 2.5, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.7, 10]} />
        <meshStandardMaterial color={paleta.metal} metalness={0.95} roughness={0.15} />
      </mesh>

      {/* Masa (L) */}
      <group ref={masa} position={[0, EQUILIBRIO, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.0, 0.76, 0.76]} />
          <meshStandardMaterial color="#cfd6de" metalness={0.85} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0, 0.385]}>
          <planeGeometry args={[0.9, 0.12]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      </group>

      {/* Línea de equilibrio */}
      <mesh position={[1.25, EQUILIBRIO, -0.02]}>
        <planeGeometry args={[3.6, 0.012]} />
        <meshBasicMaterial color={paleta.conductor} transparent opacity={0.5} />
      </mesh>

      {/* Registrador de q(t) */}
      <mesh position={[1.6 + ANCHO_REGISTRO / 2, EQUILIBRIO + 0.55, 0]}>
        <planeGeometry args={[ANCHO_REGISTRO + 0.2, AMPLITUD * 2 + 0.9]} />
        <meshStandardMaterial color={paleta.placa} roughness={0.9} />
      </mesh>
      <primitive object={lineaObjeto} ref={linea} />
      <mesh ref={pluma}>
        <sphereGeometry args={[0.055, 14, 14]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh ref={guia}>
        <planeGeometry args={[1, 0.008]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>

      {/* Energía restante del transitorio */}
      <mesh position={[-1.25, 0.36, 0]}>
        <boxGeometry args={[0.2, 0.02, 0.2]} />
        <meshStandardMaterial color={paleta.plastico} />
      </mesh>
      <mesh ref={energia} position={[-1.25, 1.4, 0]}>
        <boxGeometry args={[0.14, 1, 0.14]} />
        <meshBasicMaterial color={paleta.calor} toneMapped={false} transparent opacity={0.85} />
      </mesh>

      {titulo && (
        <Html position={[0.9, ANCLA + 0.75, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="rotulo-escena">
            <b style={{ color }}>{titulo}</b>
            {subtitulo && <span>{subtitulo}</span>}
          </div>
        </Html>
      )}
    </group>
  );
}
