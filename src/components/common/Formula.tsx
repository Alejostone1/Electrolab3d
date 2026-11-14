import katex from 'katex';
import 'katex/dist/katex.min.css';
import { memo, useLayoutEffect, useMemo, useRef } from 'react';
import { anotarSimbolos } from '@/utils/simbolosKatex';

interface PropiedadesFormula {
  latex: string;
  bloque?: boolean;
  className?: string;
  /** Si es true (por defecto) cada variable muestra su explicación al tocarla o señalarla. */
  interactiva?: boolean;
}

/** Renderiza una expresión LaTeX con KaTeX (sin lanzar errores en tiempo de ejecución). */
export const Formula = memo(function Formula({ latex, bloque = false, className, interactiva = true }: PropiedadesFormula) {
  const nodo = useRef<HTMLElement>(null);
  const html = useMemo(
    () => katex.renderToString(latex, { displayMode: bloque, throwOnError: false, strict: 'ignore', trust: false }),
    [latex, bloque],
  );
  useLayoutEffect(() => {
    if (interactiva && nodo.current) anotarSimbolos(nodo.current);
  }, [html, interactiva]);

  if (bloque)
    return <div ref={nodo as React.RefObject<HTMLDivElement>} className={`formula-bloque ${className ?? ''}`} dangerouslySetInnerHTML={{ __html: html }} />;
  return <span ref={nodo as React.RefObject<HTMLSpanElement>} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
});
