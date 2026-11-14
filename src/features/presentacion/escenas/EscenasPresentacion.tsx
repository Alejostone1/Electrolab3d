import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { NOMBRES_AMORTIGUAMIENTO, PRESETS, simularCircuito, type IdComponente } from '@/engine';
import { useLaboratorio } from '@/store/useLaboratorio';
import type { Paleta3D } from '../../laboratorio/components-3d/paleta';
import { CircuitoRLC } from '../../laboratorio/scenes/CircuitoRLC';
import { Cierrapuertas3D, Instrumento3D, Sintonizador3D, Suspension3D } from './Aplicaciones3D';
import { Oscilador3D } from './Oscilador3D';

export type TipoEscena = 'circuito' | 'regimen' | 'comparacion' | 'suspension' | 'instrumento' | 'cierrapuertas' | 'sintonizador';

export const COLORES_REGIMEN = { subamortiguado: '#22d3ee', critico: '#34d399', sobreamortiguado: '#f59e0b' } as const;

/** Entrada cinematográfica de cada escena: sube desde abajo y se escala suavemente. */
function Entrada({ children }: { children: ReactNode }) {
  const grupo = useRef<THREE.Group>(null);
  const progreso = useRef(0);
  useFrame((_, delta) => {
    progreso.current = THREE.MathUtils.damp(progreso.current, 1, 3.2, Math.min(delta, 0.1));
    if (!grupo.current) return;
    const p = progreso.current;
    grupo.current.position.y = (1 - p) * -1.2;
    grupo.current.scale.setScalar(0.9 + 0.1 * p);
  });
  return <group ref={grupo}>{children}</group>;
}

const leerTiempoGlobal = () => useLaboratorio.getState().tiempo;

/** Circuito + análogo mecánico, ambos movidos por la simulación global del laboratorio. */
function EscenaRegimen({ paleta, circuito }: { paleta: Paleta3D; circuito: ReactNode }) {
  const resultado = useLaboratorio((s) => s.resultado);
  return (
    <group>
      {circuito}
      <Oscilador3D
        resultado={resultado}
        leerTiempo={leerTiempoGlobal}
        posicion={[0.4, 0, -6.2]}
        color={COLORES_REGIMEN[resultado.clasificacion]}
        paleta={paleta}
        titulo="Análogo mecánico"
        subtitulo="masa ↔ L · amortiguador ↔ R · resorte ↔ 1/C"
      />
    </group>
  );
}

/** Los tres regímenes lado a lado, con el mismo L, C, E₀ y un reloj común en bucle. */
function EscenaComparacion({ paleta }: { paleta: Paleta3D }) {
  const simulaciones = useMemo(() => {
    const duracion = 0.6;
    return PRESETS.map((p) => ({ preset: p, resultado: simularCircuito(p.parametros, { duracion, muestras: 1200 }) }));
  }, []);
  const reloj = useRef(0);
  useFrame((_, delta) => {
    // 0.6 s de simulación se muestran en 6 s reales, con 1.5 s de pausa al final.
    reloj.current = (reloj.current + Math.min(delta, 0.1)) % 7.5;
  });
  const leerTiempo = () => Math.min(reloj.current / 6, 1) * 0.6;
  return (
    <group scale={0.82}>
      {simulaciones.map(({ preset, resultado }, k) => (
        <Oscilador3D
          key={preset.id}
          resultado={resultado}
          leerTiempo={leerTiempo}
          posicion={[(k - 1) * 6.2 - 1.1, 0, 0]}
          color={COLORES_REGIMEN[preset.id]}
          paleta={paleta}
          titulo={NOMBRES_AMORTIGUAMIENTO[preset.id]}
          subtitulo={`R = ${preset.parametros.resistencia.toFixed(2)} Ω · ζ = ${resultado.derivados.relacionAmortiguamiento.toFixed(2)}`}
        />
      ))}
    </group>
  );
}

interface PropiedadesEscenaPresentacion {
  tipo: TipoEscena;
  paleta: Paleta3D;
  foco: IdComponente | null;
  despiezados: IdComponente[];
  rayosX: IdComponente[] | false;
  mostrarEtiquetas: boolean;
}

export function EscenaPresentacion({ tipo, paleta, foco, despiezados, rayosX, mostrarEtiquetas }: PropiedadesEscenaPresentacion) {
  const circuito = (
    <CircuitoRLC paleta={paleta} seleccionado={foco} explotados={despiezados} rayosX={rayosX} mostrarCampos mostrarEtiquetas={mostrarEtiquetas} />
  );
  // La clave reinicia la animación de entrada solo cuando cambia el escenario, no en cada diapositiva.
  const contenido = (() => {
    switch (tipo) {
      case 'regimen':
        return <EscenaRegimen paleta={paleta} circuito={circuito} />;
      case 'comparacion':
        return <EscenaComparacion paleta={paleta} />;
      case 'suspension':
        return <Suspension3D paleta={paleta} />;
      case 'instrumento':
        return <Instrumento3D paleta={paleta} />;
      case 'cierrapuertas':
        return <Cierrapuertas3D paleta={paleta} />;
      case 'sintonizador':
        return <Sintonizador3D paleta={paleta} />;
      default:
        return circuito;
    }
  })();
  return <Entrada key={tipo}>{contenido}</Entrada>;
}
