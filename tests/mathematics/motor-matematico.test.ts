import { describe, expect, it } from 'vitest';
import {
  calcularParametrosDerivados,
  calcularRaicesCaracteristicas,
  clasificarAmortiguamiento,
  generarProcedimiento,
  integrarRK4,
  obtenerPreset,
  resolverAnaliticamente,
  residuoEcuacionCaracteristica,
  CONDICIONES_INICIALES_REPOSO,
  type ParametrosCircuito,
} from '../../src/engine';

const sub = obtenerPreset('subamortiguado').parametros;
const critico = obtenerPreset('critico').parametros;
const sobre = obtenerPreset('sobreamortiguado').parametros;

describe('Parámetros derivados', () => {
  it('calcula la frecuencia natural ω₀ = 1/√(LC)', () => {
    const d = calcularParametrosDerivados(sub);
    expect(d.frecuenciaNatural).toBeCloseTo(1 / Math.sqrt(0.5 * 0.001), 10);
    expect(d.frecuenciaNatural).toBeCloseTo(44.72136, 4);
  });

  it('calcula α = R/2L y ζ = α/ω₀', () => {
    const d = calcularParametrosDerivados(sub);
    expect(d.coeficienteAmortiguamiento).toBe(10);
    expect(d.relacionAmortiguamiento).toBeCloseTo(10 / 44.72136, 5);
  });

  it('calcula la resistencia crítica 2√(L/C) ≈ 44.72 Ω', () => {
    const d = calcularParametrosDerivados(sub);
    expect(d.resistenciaCritica).toBeCloseTo(44.72136, 4);
  });

  it('calcula ωd solo para el caso subamortiguado', () => {
    expect(calcularParametrosDerivados(sub).frecuenciaAmortiguada).toBeCloseTo(Math.sqrt(2000 - 100), 8);
    expect(calcularParametrosDerivados(sobre).frecuenciaAmortiguada).toBeNull();
  });
});

describe('Clasificación del amortiguamiento', () => {
  it('clasifica los tres presets', () => {
    for (const [p, esperado] of [
      [sub, 'subamortiguado'],
      [critico, 'critico'],
      [sobre, 'sobreamortiguado'],
    ] as const) {
      expect(clasificarAmortiguamiento(calcularParametrosDerivados(p).relacionAmortiguamiento)).toBe(esperado);
    }
  });

  it('usa la tolerancia configurable cerca de ζ = 1', () => {
    const casi: ParametrosCircuito = { ...sub, resistencia: 44.72 };
    const zeta = calcularParametrosDerivados(casi).relacionAmortiguamiento;
    expect(clasificarAmortiguamiento(zeta, 1e-3)).toBe('critico');
    expect(clasificarAmortiguamiento(zeta, 1e-8)).toBe('subamortiguado');
  });
});

describe('Ecuación característica', () => {
  it('detecta raíces complejas, repetidas y reales distintas', () => {
    expect(calcularRaicesCaracteristicas(0.5, 10, 0.001).tipo).toBe('complejas-conjugadas');
    expect(calcularRaicesCaracteristicas(0.5, critico.resistencia, 0.001).tipo).toBe('reales-repetidas');
    expect(calcularRaicesCaracteristicas(0.5, 80, 0.001).tipo).toBe('reales-distintas');
  });

  it('las raíces satisfacen L r² + R r + 1/C = 0', () => {
    for (const R of [5, 10, 44.7213595, 80, 100]) {
      const raices = calcularRaicesCaracteristicas(0.5, R, 0.001);
      expect(residuoEcuacionCaracteristica(raices, raices.r1)).toBeLessThan(1e-6);
      expect(residuoEcuacionCaracteristica(raices, raices.r2)).toBeLessThan(1e-6);
    }
  });

  it('las raíces complejas son −α ± iωd', () => {
    const raices = calcularRaicesCaracteristicas(0.5, 10, 0.001);
    expect(raices.r1.re).toBeCloseTo(-10, 10);
    expect(raices.r1.im).toBeCloseTo(Math.sqrt(1900), 10);
    expect(raices.r2.im).toBeCloseTo(-Math.sqrt(1900), 10);
  });
});

describe('Soluciones analíticas', () => {
  for (const p of [sub, critico, sobre]) {
    it(`respeta condiciones iniciales y límite C·E₀ (R = ${p.resistencia.toFixed(2)} Ω)`, () => {
      const s = resolverAnaliticamente(p, CONDICIONES_INICIALES_REPOSO)!;
      expect(Math.abs(s.carga(0))).toBeLessThan(1e-14);
      expect(Math.abs(s.corriente(0))).toBeLessThan(1e-12);
      expect(s.carga(50)).toBeCloseTo(p.capacitancia * p.fuente.amplitud, 12);
      expect(Math.abs(s.corriente(50))).toBeLessThan(1e-12);
    });

    it(`satisface la EDO L q'' + R q' + q/C = E₀ (R = ${p.resistencia.toFixed(2)} Ω)`, () => {
      const s = resolverAnaliticamente(p, CONDICIONES_INICIALES_REPOSO)!;
      const h = 1e-6;
      for (const t of [0.01, 0.05, 0.1, 0.2]) {
        const qpp = (s.corriente(t + h) - s.corriente(t - h)) / (2 * h);
        const residuo = p.inductancia * qpp + p.resistencia * s.corriente(t) + s.carga(t) / p.capacitancia - p.fuente.amplitud;
        expect(Math.abs(residuo)).toBeLessThan(1e-4);
      }
    });
  }

  it('coincide con la fórmula del enunciado en el caso subamortiguado', () => {
    const s = resolverAnaliticamente(sub, CONDICIONES_INICIALES_REPOSO)!;
    const alfa = 10;
    const wd = Math.sqrt(1900);
    const w0 = Math.sqrt(2000);
    const CE0 = 0.012;
    for (const t of [0, 0.03, 0.1, 0.4]) {
      const q = CE0 * (1 - Math.exp(-alfa * t) * (Math.cos(wd * t) + (alfa / wd) * Math.sin(wd * t)));
      const i = CE0 * (w0 ** 2 / wd) * Math.exp(-alfa * t) * Math.sin(wd * t);
      expect(s.carga(t)).toBeCloseTo(q, 12);
      expect(s.corriente(t)).toBeCloseTo(i, 10);
    }
  });

  it('no ofrece solución analítica para fuentes variables', () => {
    expect(resolverAnaliticamente({ ...sub, fuente: { ...sub.fuente, tipo: 'sinusoidal' } }, CONDICIONES_INICIALES_REPOSO)).toBeNull();
  });
});

describe('Runge-Kutta de cuarto orden', () => {
  it('integra un oscilador armónico con error O(h⁴)', () => {
    const sistema = (_t: number, x: number, v: number): [number, number] => [v, -x];
    const errores = [0.1, 0.05].map((h) => {
      const pasos = Math.round(2 * Math.PI / h);
      const r = integrarRK4(sistema, [1, 0], (2 * Math.PI) / pasos, pasos);
      return Math.abs(r.x1[pasos] - 1);
    });
    expect(errores[1]).toBeLessThan(1e-5);
    // Reducir h a la mitad reduce el error ~16 veces.
    expect(errores[0] / errores[1]).toBeGreaterThan(12);
  });
});

describe('Procedimiento paso a paso', () => {
  it('genera los 13 pasos para cada configuración', () => {
    for (const p of [sub, critico, sobre]) {
      const pasos = generarProcedimiento(p, CONDICIONES_INICIALES_REPOSO);
      expect(pasos).toHaveLength(13);
      expect(pasos.every((paso) => paso.formulas.length > 0 && paso.explicacion.length > 10)).toBe(true);
    }
  });
});
