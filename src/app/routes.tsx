import { lazy } from 'react';

/** Carga progresiva: cada módulo se descarga solo cuando se visita. */
export const Inicio = lazy(() => import('@/features/inicio/PaginaInicio'));
export const Laboratorio = lazy(() => import('@/features/laboratorio/PaginaLaboratorio'));
export const Experimentos = lazy(() => import('@/features/experimentos/PaginaExperimentos'));
export const Matematicas = lazy(() => import('@/features/matematicas/PaginaMatematicas'));
export const Graficas = lazy(() => import('@/features/graficas/PaginaGraficas'));
export const Desafios = lazy(() => import('@/features/desafios/PaginaDesafios'));
export const Aplicaciones = lazy(() => import('@/features/aplicaciones/PaginaAplicaciones'));
export const Acerca = lazy(() => import('@/features/acerca/PaginaAcerca'));
export const Presentacion = lazy(() => import('@/features/presentacion/PaginaPresentacion'));
