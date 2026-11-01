import { z } from 'zod';
import type { CondicionesIniciales, ConfiguracionFuente, ParametrosCircuito } from './tipos';

/** Rangos permitidos por el laboratorio (en unidades SI). */
export const RANGOS = {
  inductancia: { minimo: 0.1, maximo: 2, paso: 0.01 },
  resistencia: { minimo: 1, maximo: 100, paso: 0.01 },
  /** La capacitancia se edita en µF en la interfaz: 100 µF a 5000 µF. */
  capacitancia: { minimo: 100e-6, maximo: 5000e-6, paso: 1e-6 },
  voltaje: { minimo: 1, maximo: 24, paso: 0.1 },
  frecuencia: { minimo: 0.5, maximo: 50, paso: 0.1 },
  anchoPulso: { minimo: 0.005, maximo: 2, paso: 0.005 },
} as const;

const holgura = 1e-9;

export const esquemaFuente = z.object({
  tipo: z.enum(['constante', 'pulso', 'sinusoidal', 'cuadrada']),
  amplitud: z
    .number({ invalid_type_error: 'El voltaje debe ser numérico' })
    .min(RANGOS.voltaje.minimo - holgura, `El voltaje mínimo es ${RANGOS.voltaje.minimo} V`)
    .max(RANGOS.voltaje.maximo + holgura, `El voltaje máximo es ${RANGOS.voltaje.maximo} V`),
  frecuencia: z
    .number()
    .min(RANGOS.frecuencia.minimo - holgura, 'La frecuencia mínima es 0.5 Hz')
    .max(RANGOS.frecuencia.maximo + holgura, 'La frecuencia máxima es 50 Hz'),
  anchoPulso: z
    .number()
    .min(RANGOS.anchoPulso.minimo - holgura, 'El pulso mínimo es 5 ms')
    .max(RANGOS.anchoPulso.maximo + holgura, 'El pulso máximo es 2 s'),
});

export const esquemaParametros = z.object({
  inductancia: z
    .number({ invalid_type_error: 'La inductancia debe ser numérica' })
    .min(RANGOS.inductancia.minimo - holgura, 'La inductancia mínima es 0.1 H')
    .max(RANGOS.inductancia.maximo + holgura, 'La inductancia máxima es 2 H'),
  resistencia: z
    .number({ invalid_type_error: 'La resistencia debe ser numérica' })
    .min(RANGOS.resistencia.minimo - holgura, 'La resistencia mínima es 1 Ω')
    .max(RANGOS.resistencia.maximo + holgura, 'La resistencia máxima es 100 Ω'),
  capacitancia: z
    .number({ invalid_type_error: 'La capacitancia debe ser numérica' })
    .min(RANGOS.capacitancia.minimo - holgura, 'La capacitancia mínima es 100 µF')
    .max(RANGOS.capacitancia.maximo + holgura, 'La capacitancia máxima es 5000 µF'),
  fuente: esquemaFuente,
});

export type ResultadoValidacionParametros =
  | { valido: true; parametros: ParametrosCircuito }
  | { valido: false; errores: string[] };

export function validarParametros(entrada: unknown): ResultadoValidacionParametros {
  const resultado = esquemaParametros.safeParse(entrada);
  if (resultado.success) return { valido: true, parametros: resultado.data };
  return { valido: false, errores: resultado.error.issues.map((issue) => issue.message) };
}

export const CONDICIONES_INICIALES_REPOSO: CondicionesIniciales = {
  cargaInicial: 0,
  corrienteInicial: 0,
};

export const FUENTE_POR_DEFECTO: ConfiguracionFuente = {
  tipo: 'constante',
  amplitud: 12,
  frecuencia: 5,
  anchoPulso: 0.1,
};
