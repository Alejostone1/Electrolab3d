import { create } from 'zustand';
import { escribir, leer } from '@/services/almacenamiento';

export type Tema = 'dark' | 'light';

interface Preferencias {
  tema: Tema;
  calidadAlta: boolean;
}

interface EstadoPreferencias extends Preferencias {
  alternarTema: () => void;
  establecerCalidad: (alta: boolean) => void;
}

function temaInicial(): Tema {
  const actual = document.documentElement.dataset.theme;
  return actual === 'light' ? 'light' : 'dark';
}

const guardadas = leer<Partial<Preferencias>>('preferencias', {});
const esMovil = typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches;

export const usePreferencias = create<EstadoPreferencias>((set, get) => ({
  tema: guardadas.tema ?? temaInicial(),
  calidadAlta: guardadas.calidadAlta ?? !esMovil,
  alternarTema: () => {
    const tema: Tema = get().tema === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = tema;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tema === 'dark' ? '#07111F' : '#EEF3F9');
    escribir('preferencias', { tema, calidadAlta: get().calidadAlta });
    set({ tema });
  },
  establecerCalidad: (calidadAlta) => {
    escribir('preferencias', { tema: get().tema, calidadAlta });
    set({ calidadAlta });
  },
}));
