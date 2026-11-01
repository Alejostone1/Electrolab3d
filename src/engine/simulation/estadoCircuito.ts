import type { EstadoCircuito } from '../electrical/tipos';
import type { ResultadoSimulacion } from './simulador';

/**
 * Determina el estado del circuito a partir del resultado del motor y del tiempo.
 * La amplitud remanente del transitorio se estima con la envolvente e^{−t/τ}.
 */
export function determinarEstadoCircuito(
  resultado: ResultadoSimulacion,
  tiempo: number,
  conectado: boolean,
): EstadoCircuito {
  if (!conectado) return 'desconectado';
  if (tiempo <= 0) return 'preparado';
  if (tiempo < 0.03 * resultado.duracion) return 'encendido';
  if (resultado.tiempoEstabilizacion !== null && tiempo >= resultado.tiempoEstabilizacion) return 'estabilizado';

  const tiempoDesdeExcitacion =
    resultado.parametros.fuente.tipo === 'pulso' && tiempo > resultado.parametros.fuente.anchoPulso
      ? tiempo - resultado.parametros.fuente.anchoPulso
      : tiempo;
  const amplitudRemanente = Math.exp(-tiempoDesdeExcitacion / resultado.derivados.constanteTiempoDominante);
  if (amplitudRemanente < 0.02) return 'estabilizado';
  if (amplitudRemanente < 0.15) return 'estabilizandose';
  return resultado.clasificacion === 'subamortiguado' ? 'oscilando' : 'transitorio';
}

export const NOMBRES_ESTADO: Record<EstadoCircuito, string> = {
  desconectado: 'Desconectado',
  preparado: 'Preparado',
  encendido: 'Encendido',
  transitorio: 'Transitorio',
  oscilando: 'Oscilando',
  estabilizandose: 'Estabilizándose',
  estabilizado: 'Estabilizado',
};

export const DESCRIPCION_ESTADO: Record<EstadoCircuito, string> = {
  desconectado: 'El interruptor está abierto: no circula corriente.',
  preparado: 'Interruptor cerrado y circuito listo. Pulsa reproducir para iniciar t > 0.',
  encendido: 'La fuente acaba de conectarse: la corriente empieza a crecer desde cero.',
  transitorio: 'Respuesta transitoria sin oscilación: la carga se aproxima monótonamente al equilibrio.',
  oscilando: 'La energía se intercambia entre L y C: la carga oscila alrededor de C·E₀.',
  estabilizandose: 'El transitorio casi se ha extinguido (amplitud remanente < 15 %).',
  estabilizado: 'Régimen permanente: el transitorio es menor al 2 %.',
};
