/**
 * Código de colores normalizado (IEC 60062) para las bandas del resistor 3D.
 * El modelo tridimensional muestra así el valor real de R.
 */
export const COLORES_BANDA = [
  { nombre: 'negro', color: '#1a1a1a' },
  { nombre: 'marrón', color: '#7a3b12' },
  { nombre: 'rojo', color: '#d62828' },
  { nombre: 'naranja', color: '#f77f00' },
  { nombre: 'amarillo', color: '#f5d000' },
  { nombre: 'verde', color: '#2a9d4b' },
  { nombre: 'azul', color: '#1d4ed8' },
  { nombre: 'violeta', color: '#7c3aed' },
  { nombre: 'gris', color: '#8a8a8a' },
  { nombre: 'blanco', color: '#f2f2f2' },
];

const BANDA_ORO_MULTIPLICADOR = { nombre: 'oro (×0.1)', color: '#c9a227' };
const BANDA_TOLERANCIA = { nombre: 'oro (±5 %)', color: '#c9a227' };

/** Bandas de 4 colores: dos dígitos, multiplicador y tolerancia. */
export function bandasResistor(resistencia: number): Array<{ nombre: string; color: string }> {
  const valor = Math.max(resistencia, 1);
  let exponente = Math.floor(Math.log10(valor)) - 1;
  let digitos = Math.round(valor / 10 ** exponente);
  if (digitos >= 100) {
    digitos = Math.round(digitos / 10);
    exponente += 1;
  }
  const primero = Math.floor(digitos / 10);
  const segundo = digitos % 10;
  const multiplicador = exponente >= 0 ? COLORES_BANDA[Math.min(exponente, 9)] : BANDA_ORO_MULTIPLICADOR;
  return [COLORES_BANDA[primero], COLORES_BANDA[segundo], multiplicador, BANDA_TOLERANCIA];
}
