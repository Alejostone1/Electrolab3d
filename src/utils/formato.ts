/**
 * Utilidades de formato numérico para indicadores, tablas y LaTeX.
 */

const PREFIJOS: Array<[number, string]> = [
  [1e9, 'G'],
  [1e6, 'M'],
  [1e3, 'k'],
  [1, ''],
  [1e-3, 'm'],
  [1e-6, 'µ'],
  [1e-9, 'n'],
  [1e-12, 'p'],
];

/** Formatea un valor con prefijo SI (p. ej. 0.0012 A → "1.2 mA"). */
export function formatearIngenieria(valor: number, unidad: string, cifras = 3): string {
  if (!Number.isFinite(valor)) return `— ${unidad}`;
  if (Math.abs(valor) < 1e-15) return `0 ${unidad}`;
  const absoluto = Math.abs(valor);
  for (const [factor, prefijo] of PREFIJOS) {
    if (absoluto >= factor * 0.9995) {
      return `${aPrecision(valor / factor, cifras)} ${prefijo}${unidad}`;
    }
  }
  return `${aPrecision(valor / 1e-12, cifras)} p${unidad}`;
}

/** Número con cifras significativas, sin ceros finales innecesarios. */
export function aPrecision(valor: number, cifras = 4): string {
  if (!Number.isFinite(valor)) return '—';
  if (valor === 0) return '0';
  const texto = Number(valor.toPrecision(cifras));
  const absoluto = Math.abs(texto);
  if (absoluto !== 0 && (absoluto < 1e-4 || absoluto >= 1e7)) return texto.toExponential(cifras - 1);
  return String(texto);
}

/** Número para LaTeX: notación científica con \times 10^{n} cuando corresponde. */
export function numeroLatex(valor: number, cifras = 4): string {
  if (!Number.isFinite(valor)) return '\\infty';
  if (valor === 0) return '0';
  const absoluto = Math.abs(valor);
  if (absoluto < 1e-3 || absoluto >= 1e5) {
    const exponente = Math.floor(Math.log10(absoluto));
    const mantisa = Number((valor / 10 ** exponente).toPrecision(cifras));
    return `${mantisa} \\times 10^{${exponente}}`;
  }
  return String(Number(valor.toPrecision(cifras)));
}

/** Número con signo explícito para expresiones LaTeX (" + 3" / " - 3"). */
export function conSigno(valor: number, cifras = 4): string {
  return valor < 0 ? ` - ${numeroLatex(-valor, cifras)}` : ` + ${numeroLatex(valor, cifras)}`;
}

export function limitar(valor: number, minimo: number, maximo: number): number {
  return Math.min(maximo, Math.max(minimo, valor));
}
