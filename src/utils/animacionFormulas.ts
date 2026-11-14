import gsap from 'gsap';

/** Clases de KaTeX que corresponden a un símbolo visible (letra, número, operador, signo). */
const SIMBOLOS = '.mord, .mbin, .mrel, .mopen, .mclose, .mpunct, .mop, .mspace + .mord';

/**
 * Hace que los símbolos de una fórmula KaTeX "caigan" uno a uno en orden de lectura:
 * entran desde arriba, giran un poco y se acomodan con un rebote suave.
 * Devuelve la animación para poder cancelarla.
 */
export function animarLetras(contenedor: HTMLElement, opciones: { duracion?: number; escalonado?: number } = {}): gsap.core.Tween | null {
  const html = contenedor.querySelector('.katex-html') ?? contenedor;
  // Solo las hojas: símbolos que no contienen otros símbolos (evita animar grupos enteros).
  const letras = Array.from(html.querySelectorAll<HTMLElement>(SIMBOLOS)).filter((nodo) => !nodo.querySelector(SIMBOLOS) && nodo.textContent?.trim());
  if (!letras.length) return null;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  contenedor.classList.add('formula-animada');
  return gsap.fromTo(
    letras,
    { y: -46, opacity: 0, rotation: () => gsap.utils.random(-28, 28), scale: 1.35, filter: 'blur(3px)' },
    {
      y: 0,
      opacity: 1,
      rotation: 0,
      scale: 1,
      filter: 'blur(0px)',
      duration: opciones.duracion ?? 0.75,
      ease: 'back.out(1.8)',
      stagger: { each: opciones.escalonado ?? 0.055, from: 'start' },
      onComplete: () => {
        contenedor.classList.remove('formula-animada');
        gsap.set(letras, { clearProps: 'transform,filter,opacity' });
      },
    },
  );
}
