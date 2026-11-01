import type { TipoAmortiguamiento } from '../electrical/tipos';

/** Tolerancia por defecto sobre |ζ − 1| para considerar el sistema crítico. */
export const TOLERANCIA_CRITICA_POR_DEFECTO = 1e-3;

/**
 * Clasifica el sistema según la relación de amortiguamiento ζ.
 * La tolerancia evita que valores como R = 44.72 Ω (ζ ≈ 0.99997) se
 * reporten como subamortiguados por errores de redondeo.
 */
export function clasificarAmortiguamiento(
  relacionAmortiguamiento: number,
  tolerancia = TOLERANCIA_CRITICA_POR_DEFECTO,
): TipoAmortiguamiento {
  if (Math.abs(relacionAmortiguamiento - 1) <= tolerancia) return 'critico';
  return relacionAmortiguamiento < 1 ? 'subamortiguado' : 'sobreamortiguado';
}

export const NOMBRES_AMORTIGUAMIENTO: Record<TipoAmortiguamiento, string> = {
  subamortiguado: 'Subamortiguado',
  critico: 'Críticamente amortiguado',
  sobreamortiguado: 'Sobreamortiguado',
};

export const DESCRIPCION_AMORTIGUAMIENTO: Record<TipoAmortiguamiento, string> = {
  subamortiguado:
    'Raíces complejas conjugadas: la carga oscila alrededor del equilibrio con amplitud que decae exponencialmente.',
  critico:
    'Raíz real repetida: el sistema regresa al equilibrio en el menor tiempo posible sin oscilar.',
  sobreamortiguado:
    'Raíces reales distintas y negativas: retorno lento y monótono al equilibrio, sin oscilaciones.',
};

export const CONDICION_AMORTIGUAMIENTO: Record<TipoAmortiguamiento, string> = {
  subamortiguado: 'ζ < 1  ⇔  R < 2√(L/C)',
  critico: 'ζ = 1  ⇔  R = 2√(L/C)',
  sobreamortiguado: 'ζ > 1  ⇔  R > 2√(L/C)',
};
