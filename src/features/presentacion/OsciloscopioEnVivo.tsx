import { useLaboratorio } from '@/store/useLaboratorio';
import { Osciloscopio } from '../laboratorio/controls/Osciloscopio';

/** Osciloscopio con barrido sincronizado al reloj global de simulación. */
export function OsciloscopioEnVivo() {
  const resultado = useLaboratorio((s) => s.resultado);
  const tiempo = useLaboratorio((s) => s.tiempo);
  return <Osciloscopio resultado={resultado} tiempo={tiempo} completo={false} alto={110} />;
}
