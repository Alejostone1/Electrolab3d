/**
 * Estado global del laboratorio. Es el "sistema central de simulación":
 *
 *   parámetros → validación (Zod) → motor matemático → resultado
 *        ↘ gráficas, escena 3D, indicadores y centro matemático leen el MISMO resultado.
 */
import { create } from 'zustand';
import {
  CONDICIONES_INICIALES_REPOSO,
  obtenerPreset,
  simularCircuito,
  TOLERANCIA_CRITICA_POR_DEFECTO,
  validarParametros,
  type ConfiguracionFuente,
  type IdComponente,
  type ParametrosCircuito,
  type ResultadoSimulacion,
  type TipoAmortiguamiento,
} from '@/engine';
import { escribir, leer } from '@/services/almacenamiento';

export type VistaCamara = 'libre' | 'frontal' | 'superior' | 'isometrica' | 'componente';
export type ClaveParametro = 'inductancia' | 'resistencia' | 'capacitancia';

/** Duración real (s) que tarda en reproducirse toda la simulación a velocidad 1×. */
export const DURACION_REPRODUCCION = 12;

interface EstadoLaboratorio {
  parametros: ParametrosCircuito;
  toleranciaCritica: number;
  pasoManual: number | null;
  resultado: ResultadoSimulacion;
  errores: string[];
  presetActivo: TipoAmortiguamiento | null;

  conectado: boolean;
  reproduciendo: boolean;
  tiempo: number;
  velocidad: number;

  componenteSeleccionado: IdComponente | null;
  vistaCamara: VistaCamara;
  /** Contador que fuerza a la cámara a re-encuadrar aunque la vista no cambie. */
  solicitudCamara: number;
  rayosX: boolean;
  explosionado: boolean;
  mostrarCampos: boolean;
  mostrarEtiquetas: boolean;

  actualizarParametro: (clave: ClaveParametro, valor: number) => void;
  actualizarFuente: (cambios: Partial<ConfiguracionFuente>) => void;
  establecerParametros: (parametros: ParametrosCircuito) => void;
  aplicarPreset: (id: TipoAmortiguamiento) => void;
  restablecer: () => void;
  establecerTolerancia: (tolerancia: number) => void;
  establecerPasoManual: (paso: number | null) => void;

  alternarInterruptor: () => void;
  encender: () => void;
  reproducir: () => void;
  pausar: () => void;
  reiniciar: () => void;
  avanzar: (fraccion?: number) => void;
  establecerTiempo: (tiempo: number) => void;
  establecerVelocidad: (velocidad: number) => void;
  avanzarReloj: (segundosReales: number) => void;

  seleccionarComponente: (id: IdComponente | null) => void;
  establecerVista: (vista: VistaCamara) => void;
  alternar: (clave: 'rayosX' | 'explosionado' | 'mostrarCampos' | 'mostrarEtiquetas') => void;
}

const PARAMETROS_INICIALES = obtenerPreset('subamortiguado').parametros;

function calcular(parametros: ParametrosCircuito, tolerancia: number, paso: number | null) {
  return simularCircuito(parametros, {
    condiciones: CONDICIONES_INICIALES_REPOSO,
    toleranciaCritica: tolerancia,
    pasoIntegracion: paso ?? undefined,
  });
}

function cargarParametrosGuardados(): ParametrosCircuito {
  const guardados = leer<unknown>('parametros', null);
  const validacion = validarParametros(guardados);
  return validacion.valido ? validacion.parametros : structuredClone(PARAMETROS_INICIALES);
}

const parametrosIniciales = cargarParametrosGuardados();

export const useLaboratorio = create<EstadoLaboratorio>((set, get) => {
  /** Valida, recalcula y sincroniza el tiempo con la nueva duración. */
  const recalcular = (parametros: ParametrosCircuito, extra: Partial<EstadoLaboratorio> = {}) => {
    const validacion = validarParametros(parametros);
    if (!validacion.valido) {
      set({ parametros, errores: validacion.errores, ...extra });
      return;
    }
    const { toleranciaCritica, pasoManual, tiempo, resultado: anterior } = get();
    const resultado = calcular(validacion.parametros, toleranciaCritica, pasoManual);
    // Se conserva la posición relativa de la reproducción al cambiar parámetros en vivo.
    const fraccion = anterior.duracion > 0 ? tiempo / anterior.duracion : 0;
    escribir('parametros', validacion.parametros);
    set({ parametros: validacion.parametros, resultado, errores: [], tiempo: fraccion * resultado.duracion, ...extra });
  };

  return {
    parametros: parametrosIniciales,
    toleranciaCritica: TOLERANCIA_CRITICA_POR_DEFECTO,
    pasoManual: null,
    resultado: calcular(parametrosIniciales, TOLERANCIA_CRITICA_POR_DEFECTO, null),
    errores: [],
    presetActivo: null,

    conectado: false,
    reproduciendo: false,
    tiempo: 0,
    velocidad: 1,

    componenteSeleccionado: null,
    vistaCamara: 'isometrica',
    solicitudCamara: 0,
    rayosX: false,
    explosionado: false,
    mostrarCampos: true,
    mostrarEtiquetas: true,

    actualizarParametro: (clave, valor) => recalcular({ ...get().parametros, [clave]: valor }, { presetActivo: null }),
    actualizarFuente: (cambios) =>
      recalcular({ ...get().parametros, fuente: { ...get().parametros.fuente, ...cambios } }, { presetActivo: null }),
    establecerParametros: (parametros) => recalcular(structuredClone(parametros), { presetActivo: null }),
    aplicarPreset: (id) => recalcular(structuredClone(obtenerPreset(id).parametros), { presetActivo: id, tiempo: 0 }),
    restablecer: () =>
      recalcular(structuredClone(PARAMETROS_INICIALES), { presetActivo: 'subamortiguado', tiempo: 0, reproduciendo: false }),
    establecerTolerancia: (toleranciaCritica) => {
      set({ toleranciaCritica });
      recalcular(get().parametros);
    },
    establecerPasoManual: (pasoManual) => {
      set({ pasoManual });
      recalcular(get().parametros);
    },

    alternarInterruptor: () => {
      const conectado = !get().conectado;
      set({ conectado, reproduciendo: false, tiempo: 0 });
    },
    encender: () => set({ conectado: true, reproduciendo: true, tiempo: get().tiempo >= get().resultado.duracion ? 0 : get().tiempo }),
    reproducir: () => {
      const { tiempo, resultado } = get();
      set({ conectado: true, reproduciendo: true, tiempo: tiempo >= resultado.duracion ? 0 : tiempo });
    },
    pausar: () => set({ reproduciendo: false }),
    reiniciar: () => set({ tiempo: 0, reproduciendo: false }),
    avanzar: (fraccion = 0.02) => {
      const { tiempo, resultado } = get();
      set({ conectado: true, reproduciendo: false, tiempo: Math.min(resultado.duracion, tiempo + fraccion * resultado.duracion) });
    },
    establecerTiempo: (tiempo) => set({ conectado: true, tiempo: Math.min(Math.max(0, tiempo), get().resultado.duracion) }),
    establecerVelocidad: (velocidad) => set({ velocidad }),
    avanzarReloj: (segundosReales) => {
      const { reproduciendo, conectado, tiempo, resultado, velocidad } = get();
      if (!reproduciendo || !conectado) return;
      const siguiente = tiempo + (segundosReales * velocidad * resultado.duracion) / DURACION_REPRODUCCION;
      if (siguiente >= resultado.duracion) set({ tiempo: resultado.duracion, reproduciendo: false });
      else set({ tiempo: siguiente });
    },

    seleccionarComponente: (id) =>
      set({
        componenteSeleccionado: id,
        vistaCamara: id ? 'componente' : get().vistaCamara === 'componente' ? 'isometrica' : get().vistaCamara,
        solicitudCamara: get().solicitudCamara + 1,
      }),
    establecerVista: (vistaCamara) =>
      set({ vistaCamara, componenteSeleccionado: null, solicitudCamara: get().solicitudCamara + 1 }),
    alternar: (clave) => set({ [clave]: !get()[clave] } as Pick<EstadoLaboratorio, typeof clave>),
  };
});
