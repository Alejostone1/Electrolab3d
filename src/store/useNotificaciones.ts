import { create } from 'zustand';

export type TipoNotificacion = 'exito' | 'error' | 'info';

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  mensaje: string;
}

interface EstadoNotificaciones {
  notificaciones: Notificacion[];
  notificar: (mensaje: string, tipo?: TipoNotificacion) => void;
  descartar: (id: number) => void;
}

let contador = 0;

export const useNotificaciones = create<EstadoNotificaciones>((set, get) => ({
  notificaciones: [],
  notificar: (mensaje, tipo = 'info') => {
    const id = ++contador;
    set({ notificaciones: [...get().notificaciones.slice(-3), { id, tipo, mensaje }] });
    setTimeout(() => get().descartar(id), 3800);
  },
  descartar: (id) => set({ notificaciones: get().notificaciones.filter((n) => n.id !== id) }),
}));

export const notificar = (mensaje: string, tipo?: TipoNotificacion) =>
  useNotificaciones.getState().notificar(mensaje, tipo);
