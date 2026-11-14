import { describe, expect, it } from 'vitest';
import { claveSimbolo, LATEX_SIMBOLO, SIMBOLOS } from '../../src/data/simbolos';
import { parametrosSegundoOrden, simularCircuito } from '../../src/engine';

describe('Diccionario de símbolos', () => {
  it('distingue variables por su subíndice', () => {
    expect(claveSimbolo('ω', '0')).toBe('ω0');
    expect(claveSimbolo('ω', 'd')).toBe('ωd');
    expect(claveSimbolo('ω', '02')).toBe('ω0');
    expect(claveSimbolo('E', '0')).toBe('E0');
    expect(claveSimbolo('V', 'L')).toBe('VL');
    expect(claveSimbolo('R', 'crítica')).toBe('Rc');
    expect(claveSimbolo('r', '1')).toBe('r');
    expect(claveSimbolo('k', '3')).toBe('kRK');
    expect(claveSimbolo('L', '')).toBe('L');
    expect(claveSimbolo('ψ', '')).toBeNull();
  });

  it('toda entrada tiene representación LaTeX', () => {
    for (const clave of Object.keys(SIMBOLOS)) expect(LATEX_SIMBOLO[clave], clave).toBeTruthy();
  });
});

describe('Analogía mecánica', () => {
  it('reproduce la relación de amortiguamiento y la frecuencia pedidas', () => {
    for (const zeta of [0.3, 1, 2.5]) {
      const r = simularCircuito(parametrosSegundoOrden(zeta, 7.5));
      expect(r.derivados.relacionAmortiguamiento).toBeCloseTo(zeta, 10);
      expect(r.derivados.frecuenciaNatural).toBeCloseTo(7.5, 10);
    }
  });
});
