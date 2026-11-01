import { describe, expect, it } from 'vitest';
import { bandasResistor, obtenerPreset, simularCircuito, validarParametros, voltajeFuente } from '../../src/engine';

describe('Validación de parámetros (Zod)', () => {
  it('acepta los presets', () => {
    expect(validarParametros(obtenerPreset('subamortiguado').parametros).valido).toBe(true);
  });

  it('rechaza valores fuera de rango con mensajes en español', () => {
    const r = validarParametros({ ...obtenerPreset('subamortiguado').parametros, resistencia: 500 });
    expect(r.valido).toBe(false);
    if (!r.valido) expect(r.errores[0]).toContain('100 Ω');
  });
});

describe('Relaciones eléctricas', () => {
  const r = simularCircuito(obtenerPreset('subamortiguado').parametros);
  const { serie } = r;
  const { inductancia: L, resistencia: R, capacitancia: C } = r.parametros;

  it('calcula V_R = R i y V_C = q/C', () => {
    for (const k of [10, 300, 1500]) {
      expect(serie.vR[k]).toBeCloseTo(R * serie.i[k], 12);
      expect(serie.vC[k]).toBeCloseTo(serie.q[k] / C, 12);
    }
  });

  it('cumple la segunda ley de Kirchhoff: E = V_L + V_R + V_C', () => {
    for (let k = 0; k < serie.t.length; k += 50) {
      expect(serie.vL[k] + serie.vR[k] + serie.vC[k]).toBeCloseTo(serie.E[k], 9);
    }
  });

  it('la potencia del resistor es R i² y nunca es negativa', () => {
    for (let k = 0; k < serie.t.length; k += 25) {
      expect(serie.potenciaR[k]).toBeCloseTo(R * serie.i[k] ** 2, 12);
      expect(serie.potenciaR[k]).toBeGreaterThanOrEqual(0);
    }
  });

  it('la energía disipada crece monótonamente', () => {
    for (let k = 1; k < serie.t.length; k++) expect(serie.energiaDisipada[k]).toBeGreaterThanOrEqual(serie.energiaDisipada[k - 1]);
  });

  it('en régimen permanente la mitad de la energía de la fuente queda en C y la otra mitad se disipa', () => {
    const largo = simularCircuito(r.parametros, { duracion: 3 });
    const k = largo.serie.t.length - 1;
    const Wf = largo.serie.energiaFuente[k];
    // Integral trapezoidal sobre la malla de salida: error relativo < 0.1 %.
    expect(Math.abs(Wf - C * 12 * 12) / (C * 12 * 12)).toBeLessThan(1e-3);
    expect(largo.serie.energiaC[k] / Wf).toBeCloseTo(0.5, 3);
    expect(largo.serie.energiaDisipada[k] / Wf).toBeCloseTo(0.5, 3);
    expect(L).toBe(0.5);
  });

  it('las bandas de color representan el valor de R', () => {
    expect(bandasResistor(10).map((b) => b.nombre).slice(0, 3)).toEqual(['marrón', 'negro', 'negro']);
    expect(bandasResistor(47).map((b) => b.nombre).slice(0, 3)).toEqual(['amarillo', 'violeta', 'negro']);
    expect(bandasResistor(100).map((b) => b.nombre).slice(0, 3)).toEqual(['marrón', 'negro', 'marrón']);
  });

  it('las fuentes producen las señales esperadas', () => {
    const base = { amplitud: 10, frecuencia: 2, anchoPulso: 0.1 };
    expect(voltajeFuente({ ...base, tipo: 'pulso' }, 0.05)).toBe(10);
    expect(voltajeFuente({ ...base, tipo: 'pulso' }, 0.2)).toBe(0);
    expect(voltajeFuente({ ...base, tipo: 'sinusoidal' }, 0.125)).toBeCloseTo(10, 10);
    expect(voltajeFuente({ ...base, tipo: 'cuadrada' }, 0.1)).toBe(10);
    expect(voltajeFuente({ ...base, tipo: 'cuadrada' }, 0.3)).toBe(0);
  });
});
