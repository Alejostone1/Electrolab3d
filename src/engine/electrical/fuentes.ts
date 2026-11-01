import type { ConfiguracionFuente, TipoFuente } from './tipos';

/**
 * Voltaje aplicado E(t) para cada tipo de fuente.
 * La fuente se conecta en t = 0 (antes de ese instante E = 0).
 */
export function voltajeFuente(fuente: ConfiguracionFuente, t: number): number {
  if (t < 0) return 0;
  const { amplitud, frecuencia, anchoPulso } = fuente;
  switch (fuente.tipo) {
    case 'constante':
      return amplitud;
    case 'pulso':
      return t < anchoPulso ? amplitud : 0;
    case 'sinusoidal':
      return amplitud * Math.sin(2 * Math.PI * frecuencia * t);
    case 'cuadrada': {
      const fase = (t * frecuencia) % 1;
      return fase < 0.5 ? amplitud : 0;
    }
  }
}

export const NOMBRES_FUENTE: Record<TipoFuente, string> = {
  constante: 'Constante (DC)',
  pulso: 'Pulso rectangular',
  sinusoidal: 'Sinusoidal (AC)',
  cuadrada: 'Onda cuadrada',
};

export const EXPRESION_FUENTE_LATEX: Record<TipoFuente, string> = {
  constante: 'E(t) = E_0',
  pulso: 'E(t) = \\begin{cases} E_0 & 0 \\le t < t_p \\\\ 0 & t \\ge t_p \\end{cases}',
  sinusoidal: 'E(t) = E_0 \\sin(2\\pi f t)',
  cuadrada: 'E(t) = \\begin{cases} E_0 & \\text{primer semiperiodo} \\\\ 0 & \\text{segundo semiperiodo} \\end{cases}',
};

/** Indica si la fuente tiene saltos (útil para las validaciones con diferencias finitas). */
export function esFuenteDiscontinua(tipo: TipoFuente): boolean {
  return tipo === 'pulso' || tipo === 'cuadrada';
}
