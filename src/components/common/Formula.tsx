import katex from 'katex';
import 'katex/dist/katex.min.css';
import { memo, useMemo } from 'react';

interface PropiedadesFormula {
  latex: string;
  bloque?: boolean;
  className?: string;
}

/** Renderiza una expresión LaTeX con KaTeX (sin lanzar errores en tiempo de ejecución). */
export const Formula = memo(function Formula({ latex, bloque = false, className }: PropiedadesFormula) {
  const html = useMemo(
    () => katex.renderToString(latex, { displayMode: bloque, throwOnError: false, strict: 'ignore', trust: false }),
    [latex, bloque],
  );
  if (bloque) return <div className={`formula-bloque ${className ?? ''}`} dangerouslySetInnerHTML={{ __html: html }} />;
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
});
