import type { NombreIcono } from '@/components/common/Icono';

export interface EnlaceNavegacion {
  ruta: string;
  nombre: string;
  icono: NombreIcono;
  descripcion: string;
}

export const ENLACES: EnlaceNavegacion[] = [
  { ruta: '/', nombre: 'Inicio', icono: 'inicio', descripcion: 'Presentación del laboratorio' },
  { ruta: '/laboratorio', nombre: 'Laboratorio 3D', icono: 'laboratorio', descripcion: 'Circuito RLC interactivo en 3D' },
  { ruta: '/experimentos', nombre: 'Experimentos', icono: 'experimentos', descripcion: 'Experimentos guiados e historial' },
  { ruta: '/matematicas', nombre: 'Centro matemático', icono: 'matematicas', descripcion: 'Resolución paso a paso de la EDO' },
  { ruta: '/graficas', nombre: 'Gráficas', icono: 'graficas', descripcion: 'Observatorio científico de curvas' },
  { ruta: '/desafios', nombre: 'Desafíos', icono: 'desafios', descripcion: 'Predice, calcula y compruébalo' },
  { ruta: '/aplicaciones', nombre: 'Aplicaciones', icono: 'aplicaciones', descripcion: 'Usos reales y documentación' },
  { ruta: '/acerca', nombre: 'Acerca del proyecto', icono: 'acerca', descripcion: 'Equipo, objetivos y créditos' },
];

export const EQUIPO = {
  integrantes: ['Alejandro Piedrahita', 'Daniel Colorado', 'Sebastián Patiño'],
  programa: 'Ingeniería de Sistemas y Telecomunicaciones',
  semestre: 'Octavo semestre',
  asignatura: 'Matemáticas IV',
  profesor: 'Cristian C. Sánchez',
  tipo: 'Proyecto final',
};
