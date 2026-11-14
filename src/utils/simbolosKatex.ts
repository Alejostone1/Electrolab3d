import { claveSimbolo } from '@/data/simbolos';

/**
 * Recorre el HTML generado por KaTeX y marca cada variable conocida con
 * `data-simbolo`, para que el explicador contextual pueda mostrar su significado.
 * Los subíndices se leen del nodo `.msupsub` hermano (ω₀ ≠ ω_d, V_L ≠ L).
 */
export function anotarSimbolos(raiz: HTMLElement): void {
  raiz.querySelectorAll<HTMLElement>('.mord').forEach((nodo) => {
    const texto = nodo.textContent ?? '';
    if (texto.length !== 1) return;
    const esVariable = nodo.classList.contains('mathnormal') || texto === 'Δ';
    if (!esVariable || nodo.closest('.msupsub')) return;
    const hermano = nodo.nextElementSibling;
    const subindice = hermano?.classList.contains('msupsub') ? hermano.textContent ?? '' : '';
    const clave = claveSimbolo(texto, subindice);
    if (!clave) return;
    // Se marca el grupo completo (base + subíndice) para que el área táctil sea mayor.
    const objetivo = subindice && nodo.parentElement?.classList.contains('mord') ? nodo.parentElement : nodo;
    objetivo.dataset.simbolo = clave;
    objetivo.classList.add('simbolo');
    objetivo.setAttribute('tabindex', '0');
    objetivo.setAttribute('role', 'button');
  });
}
