import { describe, expect, it } from 'vitest';
import { analizarCircuito, circuitoEjemplo, huecoMasCercano, huecosDeTira, posicionHueco, terminalesPara, type Pieza } from '../../src/engine';

const reemplazar = (piezas: Pieza[], id: string, cambios: Partial<Pieza>) => piezas.map((p) => (p.id === id ? { ...p, ...cambios } : p));

describe('Geometría de la protoboard', () => {
  it('une las cinco perforaciones de cada media columna y los rieles completos', () => {
    expect(huecosDeTira('c7')).toEqual(['a7', 'b7', 'c7', 'd7', 'e7']);
    expect(huecosDeTira('h7')).toEqual(['f7', 'g7', 'h7', 'i7', 'j7']);
    expect(huecosDeTira('X+3')).toHaveLength(30);
  });

  it('encuentra la perforación más cercana a un punto', () => {
    const [x, z] = posicionHueco('g12');
    expect(huecoMasCercano(x + 0.2, z - 0.3)).toBe('g12');
    expect(huecoMasCercano(40, 0)).toBeNull();
  });

  it('calcula el segundo terminal según el tipo y la orientación', () => {
    expect(terminalesPara('resistor', 'a1', 'horizontal')).toEqual(['a1', 'a5']);
    expect(terminalesPara('capacitor', 'd4', 'vertical')).toEqual(['d4', 'f4']);
    expect(terminalesPara('resistor', 'a29', 'horizontal')).toBeNull();
  });
});

describe('Análisis topológico', () => {
  it('reconoce el lazo RLC del ejemplo y construye los parámetros', () => {
    const analisis = analizarCircuito(circuitoEjemplo());
    expect(analisis.errores).toEqual([]);
    expect(analisis.valido).toBe(true);
    expect(analisis.lazo).toEqual(['fuente-1', 'resistor-1', 'inductor-1', 'capacitor-1']);
    expect(analisis.parametros).toMatchObject({ inductancia: 0.5, resistencia: 10, capacitancia: 1000e-6 });
    expect(analisis.parametros!.fuente.amplitud).toBe(12);
  });

  it('detecta un interruptor abierto', () => {
    const analisis = analizarCircuito(reemplazar(circuitoEjemplo(), 'interruptor-1', { cerrado: false }));
    expect(analisis.valido).toBe(false);
    expect(analisis.errores.some((e) => e.mensaje.includes('abierto'))).toBe(true);
  });

  it('detecta un componente en cortocircuito (ambos terminales en la misma tira)', () => {
    const analisis = analizarCircuito(reemplazar(circuitoEjemplo(), 'resistor-1', { terminales: ['b6', 'e6'] }));
    expect(analisis.errores.some((e) => e.mensaje.includes('cortocircuito') && e.piezas.includes('resistor-1'))).toBe(true);
  });

  it('detecta un terminal sin conectar', () => {
    const analisis = analizarCircuito(circuitoEjemplo().filter((p) => p.id !== 'cable-1'));
    expect(analisis.errores.some((e) => e.mensaje.includes('sin conectar'))).toBe(true);
  });

  it('rechaza conexiones en paralelo', () => {
    const piezas = [...circuitoEjemplo(), { id: 'resistor-2', tipo: 'resistor' as const, valor: 20, terminales: ['f6', 'f10'] as [string, string] }];
    // f6/f10 están en otra media columna: se unen a b6/b10 con cables para formar un paralelo.
    piezas.push({ id: 'cable-2', tipo: 'cable', valor: 0, terminales: ['c6', 'g6'] }, { id: 'cable-3', tipo: 'cable', valor: 0, terminales: ['d10', 'h10'] });
    const analisis = analizarCircuito(piezas);
    expect(analisis.errores.some((e) => e.mensaje.includes('paralelo'))).toBe(true);
  });

  it('explica que un circuito RC no es de segundo orden', () => {
    const sinInductor = circuitoEjemplo()
      .filter((p) => p.id !== 'inductor-1')
      .concat({ id: 'cable-x', tipo: 'cable', valor: 0, terminales: ['d10', 'e14'] });
    const analisis = analizarCircuito(sinInductor);
    expect(analisis.errores.some((e) => e.mensaje.includes('RC'))).toBe(true);
  });

  it('suma resistores en serie y combina capacitores en serie', () => {
    const piezas: Pieza[] = [
      { id: 'f', tipo: 'fuente', valor: 9, terminales: ['a1', 'a4'] },
      { id: 'r1', tipo: 'resistor', valor: 10, terminales: ['b4', 'b8'] },
      { id: 'r2', tipo: 'resistor', valor: 15, terminales: ['c8', 'c12'] },
      { id: 'l', tipo: 'inductor', valor: 1, terminales: ['d12', 'd16'] },
      { id: 'c1', tipo: 'capacitor', valor: 2000e-6, terminales: ['e16', 'e18'] },
      { id: 'c2', tipo: 'capacitor', valor: 2000e-6, terminales: ['a18', 'a20'] },
      { id: 'w', tipo: 'cable', valor: 0, terminales: ['b20', 'b1'] },
    ];
    const analisis = analizarCircuito(piezas);
    expect(analisis.valido).toBe(true);
    expect(analisis.parametros!.resistencia).toBe(25);
    expect(analisis.parametros!.capacitancia).toBeCloseTo(1000e-6, 12);
  });
});
