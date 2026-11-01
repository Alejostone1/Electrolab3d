import { describe, expect, it } from 'vitest';
import {
  determinarEstadoCircuito,
  generarCSV,
  muestrearEn,
  obtenerPreset,
  PRESETS,
  simularCircuito,
  type ParametrosCircuito,
  type TipoFuente,
} from '../../src/engine';

describe('Simulación completa', () => {
  for (const preset of PRESETS) {
    it(`RK4 coincide con la solución analítica (${preset.nombre})`, () => {
      const r = simularCircuito(preset.parametros);
      expect(r.errorNumerico).not.toBeNull();
      expect(r.errorNumerico!.carga / r.cargaReferencia).toBeLessThan(1e-6);
      expect(r.errorNumerico!.corriente / r.corrienteMaxima).toBeLessThan(1e-6);
    });

    it(`aprueba todas las validaciones del modelo (${preset.nombre})`, () => {
      const r = simularCircuito(preset.parametros);
      const fallidas = r.validaciones.filter((v) => !v.aprobada);
      expect(fallidas, JSON.stringify(fallidas)).toHaveLength(0);
    });
  }

  it('solo el caso subamortiguado sobrepasa C·E₀', () => {
    expect(simularCircuito(obtenerPreset('subamortiguado').parametros).sobrepaso!).toBeGreaterThan(40);
    expect(simularCircuito(obtenerPreset('critico').parametros).sobrepaso!).toBeLessThan(1e-6);
    expect(simularCircuito(obtenerPreset('sobreamortiguado').parametros).sobrepaso!).toBeLessThan(1e-6);
  });

  it('el amortiguamiento crítico se estabiliza antes que el sobreamortiguado', () => {
    const tc = simularCircuito(obtenerPreset('critico').parametros).tiempoEstabilizacion!;
    const ts = simularCircuito(obtenerPreset('sobreamortiguado').parametros).tiempoEstabilizacion!;
    expect(tc).toBeLessThan(ts);
  });

  it('es estable y válido en los extremos de los rangos', () => {
    const extremos: Array<[number, number, number]> = [
      [0.1, 1, 100e-6],
      [0.1, 100, 100e-6],
      [2, 1, 5000e-6],
      [2, 100, 5000e-6],
      [0.1, 100, 5000e-6],
    ];
    for (const [L, R, C] of extremos) {
      const p: ParametrosCircuito = { inductancia: L, resistencia: R, capacitancia: C, fuente: obtenerPreset('critico').parametros.fuente };
      const r = simularCircuito(p);
      expect(r.indiceEstabilidad).toBeLessThan(0.5);
      const fallidas = r.validaciones.filter((v) => !v.aprobada);
      expect(fallidas, `${L},${R},${C}: ${JSON.stringify(fallidas)}`).toHaveLength(0);
    }
  });

  it('valida fuentes variables (pulso, sinusoidal, cuadrada)', () => {
    for (const tipo of ['pulso', 'sinusoidal', 'cuadrada'] as TipoFuente[]) {
      const base = obtenerPreset('subamortiguado').parametros;
      const r = simularCircuito({ ...base, fuente: { ...base.fuente, tipo } });
      expect(r.analitica).toBeNull();
      const fallidas = r.validaciones.filter((v) => !v.aprobada);
      expect(fallidas, `${tipo}: ${JSON.stringify(fallidas)}`).toHaveLength(0);
    }
  });
});

describe('Interpolación, estados y exportación', () => {
  const r = simularCircuito(obtenerPreset('subamortiguado').parametros);

  it('interpola valores consistentes con la malla', () => {
    const k = 400;
    const m = muestrearEn(r, r.serie.t[k]);
    expect(m.q).toBeCloseTo(r.serie.q[k], 12);
    expect(Math.abs(m.corrienteNormalizada)).toBeLessThanOrEqual(1 + 1e-9);
  });

  it('recorre los estados del circuito', () => {
    expect(determinarEstadoCircuito(r, 0, false)).toBe('desconectado');
    expect(determinarEstadoCircuito(r, 0, true)).toBe('preparado');
    expect(determinarEstadoCircuito(r, r.duracion * 0.01, true)).toBe('encendido');
    expect(determinarEstadoCircuito(r, 0.05, true)).toBe('oscilando');
    expect(determinarEstadoCircuito(r, r.duracion, true)).toBe('estabilizado');
    const s = simularCircuito(obtenerPreset('sobreamortiguado').parametros);
    expect(determinarEstadoCircuito(s, s.duracion * 0.1, true)).toBe('transitorio');
  });

  it('exporta un CSV con encabezado y todas las filas', () => {
    const csv = generarCSV(r).split('\n');
    expect(csv[1].startsWith('t_s,E_V,q_C,i_A')).toBe(true);
    expect(csv).toHaveLength(r.serie.t.length + 2);
  });
});
