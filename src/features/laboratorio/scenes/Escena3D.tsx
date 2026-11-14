import { CameraControls, ContactShadows, Environment, Lightformer } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Suspense, useEffect, useRef, type ReactNode } from 'react';
import { PALETAS, type Paleta3D } from '../components-3d/paleta';
import { usePreferencias } from '@/store/usePreferencias';

export interface Encuadre {
  posicion: readonly [number, number, number];
  objetivo: readonly [number, number, number];
}

interface PropiedadesEscena {
  encuadre: Encuadre;
  /** Cambia para forzar un nuevo encuadre aunque las coordenadas coincidan. */
  claveEncuadre?: number | string;
  autoRotar?: boolean;
  /** Velocidad de la deriva orbital (rad por cuadro). */
  velocidadGiro?: number;
  /** Punto que ilumina un foco cenital (componente que se está explicando). */
  foco?: readonly [number, number, number] | null;
  /** Desplaza el encuadre [x, y] (fracción de la distancia) para dejar espacio a un panel. */
  desplazamiento?: readonly [number, number];
  interactiva?: boolean;
  /** Congela la cámara sin desactivar los eventos del puntero (p. ej. al arrastrar piezas). */
  camaraBloqueada?: boolean;
  alClicVacio?: () => void;
  children: (paleta: Paleta3D) => ReactNode;
  className?: string;
}

function ControlCamara({
  encuadre,
  claveEncuadre,
  autoRotar,
  velocidadGiro = 0.0012,
  interactiva,
  camaraBloqueada = false,
  desplazamiento = [0, 0],
}: Pick<PropiedadesEscena, 'encuadre' | 'claveEncuadre' | 'autoRotar' | 'velocidadGiro' | 'interactiva' | 'camaraBloqueada' | 'desplazamiento'>) {
  const controles = useRef<CameraControls>(null);
  // En pantallas verticales (celulares) la cámara se aleja para que el circuito quepa a lo ancho.
  const aspecto = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const factor = aspecto < 1 ? Math.min(2.1, 1 / aspecto) : 1;
  useEffect(() => {
    const [ox, oy, oz] = encuadre.objetivo;
    const px = ox + (encuadre.posicion[0] - ox) * factor;
    const py = oy + (encuadre.posicion[1] - oy) * factor;
    const pz = oz + (encuadre.posicion[2] - oz) * factor;
    const distancia = Math.hypot(px - ox, py - oy, pz - oz);
    controles.current?.setFocalOffset(-desplazamiento[0] * distancia, desplazamiento[1] * distancia, 0, true);
    controles.current?.setLookAt(px, py, pz, ox, oy, oz, true);
  }, [encuadre.posicion, encuadre.objetivo, claveEncuadre, desplazamiento[0], desplazamiento[1], factor]);

  useEffect(() => {
    if (!autoRotar) return;
    let id = 0;
    const girar = () => {
      controles.current?.rotate(velocidadGiro, 0, false);
      id = requestAnimationFrame(girar);
    };
    id = requestAnimationFrame(girar);
    return () => cancelAnimationFrame(id);
  }, [autoRotar, velocidadGiro]);

  return (
    <CameraControls
      ref={controles}
      makeDefault
      enabled={interactiva && !camaraBloqueada}
      minDistance={1.6}
      maxDistance={30}
      maxPolarAngle={Math.PI * 0.495}
      smoothTime={0.55}
      draggingSmoothTime={0.12}
    />
  );
}

/** Foco cenital que se desliza suavemente hacia el componente en explicación. */
function FocoEscenico({ objetivo }: { objetivo: readonly [number, number, number] | null }) {
  const luz = useRef<THREE.SpotLight>(null);
  const blanco = useRef<THREE.Object3D>(new THREE.Object3D());
  useFrame((_, delta) => {
    if (!luz.current) return;
    const d = Math.min(delta, 0.1);
    luz.current.intensity = THREE.MathUtils.damp(luz.current.intensity, objetivo ? 90 : 0, 3, d);
    if (objetivo) {
      blanco.current.position.lerp(new THREE.Vector3(objetivo[0], objetivo[1], objetivo[2]), 1 - Math.exp(-3 * d));
      luz.current.position.set(blanco.current.position.x + 1.5, 7, blanco.current.position.z + 2);
    }
    luz.current.target = blanco.current;
    blanco.current.updateMatrixWorld();
  });
  return <spotLight ref={luz} angle={0.32} penumbra={0.7} distance={18} intensity={0} color="#e8f4ff" />;
}

/** Lienzo 3D común (laboratorio, inicio y presentación) con iluminación de estudio. */
export function Escena3D({
  encuadre,
  claveEncuadre,
  autoRotar = false,
  velocidadGiro,
  foco = null,
  desplazamiento,
  interactiva = true,
  camaraBloqueada,
  alClicVacio,
  children,
  className,
}: PropiedadesEscena) {
  const tema = usePreferencias((s) => s.tema);
  const calidadAlta = usePreferencias((s) => s.calidadAlta);
  const paleta = PALETAS[tema];

  return (
    <Canvas
      className={className}
      // Una escena no interactiva no debe capturar el dedo: así la página se puede desplazar encima.
      style={interactiva ? undefined : { pointerEvents: 'none', touchAction: 'auto' }}
      shadows={calidadAlta}
      dpr={calidadAlta ? [1, 2] : [1, 1.4]}
      camera={{ position: [...encuadre.posicion] as [number, number, number], fov: 42, near: 0.1, far: 120 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onPointerMissed={alClicVacio}
    >
      <color attach="background" args={[paleta.fondo]} />
      <fog attach="fog" args={[paleta.niebla, 22, 48]} />
      <ambientLight intensity={(tema === 'dark' ? 0.35 : 0.7) * (foco ? 0.55 : 1)} />
      <FocoEscenico objetivo={foco} />
      <directionalLight
        position={[6, 12, 6]}
        intensity={tema === 'dark' ? 1.4 : 1.8}
        castShadow={calidadAlta}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      <pointLight position={[-6, 4, -4]} intensity={tema === 'dark' ? 30 : 12} color="#38bdf8" distance={18} />
      <pointLight position={[6, 3, 5]} intensity={tema === 'dark' ? 18 : 8} color="#f59e0b" distance={16} />
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={2} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
        <Lightformer intensity={1.2} color="#38bdf8" position={[-8, 2, 0]} rotation-y={Math.PI / 2} scale={[10, 4, 1]} />
        <Lightformer intensity={0.8} color="#f59e0b" position={[8, 2, 0]} rotation-y={-Math.PI / 2} scale={[10, 4, 1]} />
      </Environment>
      <Suspense fallback={null}>{children(paleta)}</Suspense>
      {!calidadAlta && <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={14} blur={2.4} far={3} frames={1} />}
      <ControlCamara
        encuadre={encuadre}
        claveEncuadre={claveEncuadre}
        autoRotar={autoRotar}
        velocidadGiro={velocidadGiro}
        interactiva={interactiva}
        camaraBloqueada={camaraBloqueada}
        desplazamiento={desplazamiento}
      />
    </Canvas>
  );
}
