/**
 * Persistencia local (localStorage) de experimentos, preferencias e historial.
 * Todas las lecturas y escrituras toleran fallos (modo privado, cuota llena).
 */
import type { ParametrosCircuito, TipoAmortiguamiento } from '@/engine';

const PREFIJO = 'electrolab:';

export function leer<T>(clave: string, valorPorDefecto: T): T {
  try {
    const texto = localStorage.getItem(PREFIJO + clave);
    return texto ? (JSON.parse(texto) as T) : valorPorDefecto;
  } catch {
    return valorPorDefecto;
  }
}

export function escribir<T>(clave: string, valor: T): boolean {
  try {
    localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

export interface ExperimentoGuardado {
  id: string;
  nombre: string;
  experimento: string;
  fecha: string;
  parametros: ParametrosCircuito;
  clasificacion: TipoAmortiguamiento;
  resultados: {
    frecuenciaNatural: number;
    coeficienteAmortiguamiento: number;
    relacionAmortiguamiento: number;
    resistenciaCritica: number;
    corrienteMaxima: number;
    cargaMaxima: number;
    tiempoEstabilizacion: number | null;
    sobrepaso: number | null;
  };
  resumenGraficas: string;
  observaciones: string;
}

const CLAVE_EXPERIMENTOS = 'experimentos';

export function listarExperimentos(): ExperimentoGuardado[] {
  return leer<ExperimentoGuardado[]>(CLAVE_EXPERIMENTOS, []);
}

export function guardarExperimento(experimento: ExperimentoGuardado): boolean {
  return escribir(CLAVE_EXPERIMENTOS, [experimento, ...listarExperimentos()].slice(0, 100));
}

export function eliminarExperimento(id: string): boolean {
  return escribir(
    CLAVE_EXPERIMENTOS,
    listarExperimentos().filter((e) => e.id !== id),
  );
}

export interface RegistroDesafio {
  fecha: string;
  puntaje: number;
  total: number;
}

export function listarHistorialDesafios(): RegistroDesafio[] {
  return leer<RegistroDesafio[]>('desafios', []);
}

export function registrarDesafio(registro: RegistroDesafio): void {
  escribir('desafios', [registro, ...listarHistorialDesafios()].slice(0, 30));
}

export function descargarArchivo(nombre: string, contenido: string, tipo = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function generarId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
