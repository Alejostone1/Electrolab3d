/**
 * Tipos del dominio eléctrico de ELECTROLAB 3D.
 * Todas las magnitudes se expresan en unidades SI (H, Ω, F, V, s).
 */

export type TipoFuente = 'constante' | 'pulso' | 'sinusoidal' | 'cuadrada';

export interface ConfiguracionFuente {
  tipo: TipoFuente;
  /** Amplitud E₀ en voltios. */
  amplitud: number;
  /** Frecuencia de las señales sinusoidal y cuadrada, en Hz. */
  frecuencia: number;
  /** Duración del pulso rectangular, en segundos. */
  anchoPulso: number;
}

export interface ParametrosCircuito {
  /** L en henrios. */
  inductancia: number;
  /** R en ohmios. */
  resistencia: number;
  /** C en faradios. */
  capacitancia: number;
  fuente: ConfiguracionFuente;
}

export interface CondicionesIniciales {
  /** q(0) en culombios. */
  cargaInicial: number;
  /** i(0) en amperios. */
  corrienteInicial: number;
}

export type TipoAmortiguamiento = 'subamortiguado' | 'critico' | 'sobreamortiguado';

export type EstadoCircuito =
  | 'desconectado'
  | 'preparado'
  | 'encendido'
  | 'transitorio'
  | 'oscilando'
  | 'estabilizandose'
  | 'estabilizado';

export type IdComponente = 'fuente' | 'interruptor' | 'resistor' | 'inductor' | 'capacitor' | 'conductores';
