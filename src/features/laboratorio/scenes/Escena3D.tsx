import { CameraControls, ContactShadows, Environment, Lightformer } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
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
  /** Desplaza el encuadre [x, y] (fracción de la distancia) para dejar espacio a un panel. */
  desplazamiento?: readonly [number, number];
  interactiva?: boolean;
  alClicVacio?: () => void;
  children: (paleta: Paleta3D) => ReactNode;
  className?: string;
}

function ControlCamara({
  encuadre,
  claveEncuadre,
  autoRotar,
  interactiva,
  desplazamiento = [0, 0],
}: Pick<PropiedadesEscena, 'encuadre' | 'claveEncuadre' | 'autoRotar' | 'interactiva' | 'desplazamiento'>) {
  const controles = useRef<CameraControls>(null);
  // En pantallas verticales (celulares) la cámara se aleja para que el circuito quepa a lo ancho.
  const aspecto = useThree((s) => s.size.width / Math.max(1, s.size.height));
  const factor = aspecto < 1.2 ? Math.min(2.1, 1.2 / aspecto) : 1;
  useEffect(() => {
    const [ox, oy, oz] = encuadre.objetivo;
    const px = ox + (encuadre.posicion[0] - ox) * factor;
    const py = oy + (encuadre.posicion[1] - oy) * factor;
    const pz = oz + (encuadre.posicion[2] - oz) * factor;
    const distancia = Math.hypot(px - ox, py - oy, pz - oz);
    controles.current?.setFocalOffset(-desplazamiento[0] * distancia, -desplazamiento[1] * distancia, 0, true);
    controles.current?.setLookAt(px, py, pz, ox, oy, oz, true);
  }, [encuadre.posicion, encuadre.objetivo, claveEncuadre, desplazamiento[0], desplazamiento[1], factor]);

  useEffect(() => {
    if (!autoRotar) return;
    let id = 0;
    const girar = () => {
      controles.current?.rotate(0.0012, 0, false);
      id = requestAnimationFrame(girar);
    };
    id = requestAnimationFrame(girar);
    return () => cancelAnimationFrame(id);
  }, [autoRotar]);

  return (
    <CameraControls
      ref={controles}
      makeDefault
      enabled={interactiva}
      minDistance={1.6}
      maxDistance={30}
      maxPolarAngle={Math.PI * 0.495}
      smoothTime={0.55}
      draggingSmoothTime={0.12}
    />
  );
}

/** Lienzo 3D común (laboratorio, inicio y presentación) con iluminación de estudio. */
export function Escena3D({
  encuadre,
  claveEncuadre,
  autoRotar = false,
  desplazamiento,
  interactiva = true,
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
      shadows={calidadAlta}
      dpr={calidadAlta ? [1, 2] : [1, 1.4]}
      camera={{ position: [...encuadre.posicion] as [number, number, number], fov: 42, near: 0.1, far: 120 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onPointerMissed={alClicVacio}
    >
      <color attach="background" args={[paleta.fondo]} />
      <fog attach="fog" args={[paleta.niebla, 22, 48]} />
      <ambientLight intensity={tema === 'dark' ? 0.35 : 0.7} />
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
        interactiva={interactiva}
        desplazamiento={desplazamiento}
      />
    </Canvas>
  );
}
