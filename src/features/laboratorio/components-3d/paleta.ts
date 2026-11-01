import type { Tema } from '@/store/usePreferencias';

/** Colores de la escena 3D según el tema activo. */
export interface Paleta3D {
  fondo: string;
  niebla: string;
  placa: string;
  placaBorde: string;
  cuadricula: string;
  cuadriculaFuerte: string;
  cobre: string;
  conductor: string;
  corriente: string;
  campoMagnetico: string;
  campoElectrico: string;
  cargaPositiva: string;
  cargaNegativa: string;
  calor: string;
  seleccion: string;
  metal: string;
  plastico: string;
}

export const PALETAS: Record<Tema, Paleta3D> = {
  dark: {
    fondo: '#07111f',
    niebla: '#07111f',
    placa: '#0c1a2e',
    placaBorde: '#16304f',
    cuadricula: '#14304d',
    cuadriculaFuerte: '#1f4c75',
    cobre: '#d9824a',
    conductor: '#9fb3c8',
    corriente: '#22d3ee',
    campoMagnetico: '#38bdf8',
    campoElectrico: '#fbbf24',
    cargaPositiva: '#f87171',
    cargaNegativa: '#60a5fa',
    calor: '#ff6a2b',
    seleccion: '#34d399',
    metal: '#c7d2de',
    plastico: '#1d2b3f',
  },
  light: {
    fondo: '#e8eef6',
    niebla: '#e8eef6',
    placa: '#f8fbff',
    placaBorde: '#c9d7e8',
    cuadricula: '#d4e1ef',
    cuadriculaFuerte: '#a9c2dd',
    cobre: '#c46a32',
    conductor: '#5b6b7d',
    corriente: '#0284c7',
    campoMagnetico: '#0284c7',
    campoElectrico: '#d97706',
    cargaPositiva: '#dc2626',
    cargaNegativa: '#2563eb',
    calor: '#f15a1a',
    seleccion: '#059669',
    metal: '#a8b4c2',
    plastico: '#334155',
  },
};
