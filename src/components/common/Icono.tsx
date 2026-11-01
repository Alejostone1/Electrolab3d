/** Iconografía técnica propia (trazos SVG 24×24) para evitar dependencias externas. */
const RUTAS = {
  inicio: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  laboratorio: 'M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3M7 15h10',
  experimentos: 'M4 19h16M6 16l4-6 3 4 2-3 3 5M4 5h7',
  matematicas: 'M5 4h14M5 4l6 8-6 8h14M15 12h4',
  graficas: 'M3 3v18h18M7 15l3-4 3 3 5-7',
  desafios: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3',
  aplicaciones: 'M4 6h16v12H4zM8 10h3M8 14h8M15 9v2',
  acerca: 'M12 8h.01M11 12h1v5h1M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  presentacion: 'M3 4h18v12H3zM12 16v4M8 20h8M10 8l4 2-4 2z',
  sol: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
  luna: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  cerrar: 'M6 6l12 12M18 6 6 18',
  reproducir: 'M7 4.5v15l12-7.5z',
  pausa: 'M7 4h3.5v16H7zM13.5 4H17v16h-3.5z',
  reiniciar: 'M4 12a8 8 0 1 0 2.4-5.7M4 4v5h5',
  avanzar: 'M5 5v14l9-7zM16 5h3v14h-3z',
  energia: 'M12 3v9M6.3 6.3a8 8 0 1 0 11.4 0',
  camara: 'M3 8h4l2-3h6l2 3h4v11H3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  capas: 'M12 3 2 8l10 5 10-5zM2 13l10 5 10-5M2 17.5l10 5 10-5',
  rayos: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3v18',
  campo: 'M4 12c3-6 13-6 16 0M4 12c3 6 13 6 16 0M12 4v16',
  etiqueta: 'M3 12V4h8l10 10-8 8zM7.5 7.5h.01',
  descargar: 'M12 3v12M7 10l5 5 5-5M4 19h16',
  guardar: 'M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM8 3v5h7V3M8 21v-7h8v7',
  papelera: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M6 6l12 12M18 6 6 18',
  flecha: 'M5 12h14M13 6l6 6-6 6',
  flechaIzq: 'M19 12H5M11 6l-6 6 6 6',
  info: 'M12 8h.01M11 12h1v5h1M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  cubo: 'M12 2 3 7v10l9 5 9-5V7zM3 7l9 5 9-5M12 12v10',
  expandir: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  lupa: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  bombilla: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  rayo: 'M13 2 4 14h7l-1 8 9-12h-7z',
  onda: 'M2 12c2-6 4-6 6 0s4 6 6 0 4-6 6 0',
  usuarios: 'M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-2a4 4 0 0 0-3-3.9M16 2.1a4 4 0 0 1 0 7.8',
  libro: 'M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5zM4 19.5A2.5 2.5 0 0 1 6.5 17H20',
  pantallaCompleta: 'M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5',
} as const;

export type NombreIcono = keyof typeof RUTAS;

interface PropiedadesIcono {
  nombre: NombreIcono;
  tamano?: number;
  className?: string;
  grosor?: number;
}

export function Icono({ nombre, tamano = 20, className, grosor = 1.7 }: PropiedadesIcono) {
  const relleno = nombre === 'reproducir' || nombre === 'pausa' || nombre === 'avanzar';
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill={relleno ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={relleno ? 0 : grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={RUTAS[nombre]} />
    </svg>
  );
}
