import type { ParametrosCircuito, TipoAmortiguamiento } from './tipos';
import { FUENTE_POR_DEFECTO } from './parametros';

export interface Preset {
  id: TipoAmortiguamiento;
  nombre: string;
  descripcion: string;
  parametros: ParametrosCircuito;
}

const L = 0.5;
const C = 0.001;
/** Resistencia crítica exacta 2√(L/C) ≈ 44.72 Ω. */
export const R_CRITICA_PRESET = 2 * Math.sqrt(L / C);

/** Las tres configuraciones comparten L, C, E₀ y condiciones iniciales q(0) = 0, i(0) = 0. */
export const PRESETS: Preset[] = [
  {
    id: 'subamortiguado',
    nombre: 'Subamortiguado',
    descripcion: 'R < R crítica: la carga oscila alrededor de CE₀ mientras la envolvente decae.',
    parametros: { inductancia: L, resistencia: 10, capacitancia: C, fuente: { ...FUENTE_POR_DEFECTO } },
  },
  {
    id: 'critico',
    nombre: 'Crítico',
    descripcion: 'R = 2√(L/C) ≈ 44.72 Ω: llega al equilibrio lo más rápido posible sin oscilar.',
    parametros: { inductancia: L, resistencia: R_CRITICA_PRESET, capacitancia: C, fuente: { ...FUENTE_POR_DEFECTO } },
  },
  {
    id: 'sobreamortiguado',
    nombre: 'Sobreamortiguado',
    descripcion: 'R > R crítica: aproximación lenta y monótona al equilibrio, sin oscilaciones.',
    parametros: { inductancia: L, resistencia: 80, capacitancia: C, fuente: { ...FUENTE_POR_DEFECTO } },
  },
];

export function obtenerPreset(id: TipoAmortiguamiento): Preset {
  return PRESETS.find((preset) => preset.id === id)!;
}
