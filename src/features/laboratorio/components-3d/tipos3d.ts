import type { IdComponente } from '@/engine';
import type { Paleta3D } from './paleta';

/** Propiedades comunes de todos los componentes tridimensionales del circuito. */
export interface PropiedadesComponente3D {
  paleta: Paleta3D;
  seleccionado: boolean;
  alSeleccionar?: (id: IdComponente) => void;
  /** Vista de despiece: separa las partes internas. */
  explotado: boolean;
  /** Carcasas translúcidas para ver el interior. */
  rayosX: boolean;
  mostrarCampos: boolean;
  mostrarEtiquetas: boolean;
}
