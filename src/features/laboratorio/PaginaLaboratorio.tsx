import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { IdComponente } from '@/engine';
import { Icono, type NombreIcono } from '@/components/common/Icono';
import { FICHAS } from '@/data/componentes';
import { useLaboratorio, type VistaCamara } from '@/store/useLaboratorio';
import { usePreferencias } from '@/store/usePreferencias';
import { ENFOQUE_COMPONENTE, POSICIONES, VISTAS_CAMARA } from './components-3d/geometria';
import { BarraReproduccion } from './controls/BarraReproduccion';
import { PanelParametros } from './controls/PanelParametros';
import { FichaSeleccionada, PanelClasificacion, PanelInstantaneo, PanelValidaciones } from './controls/PanelResultados';
import { CircuitoRLC } from './scenes/CircuitoRLC';
import { Escena3D, type Encuadre } from './scenes/Escena3D';
import './laboratorio.css';

const VISTAS: Array<{ id: Exclude<VistaCamara, 'componente' | 'libre'>; nombre: string }> = [
  { id: 'isometrica', nombre: 'Isométrica' },
  { id: 'frontal', nombre: 'Frontal' },
  { id: 'superior', nombre: 'Superior' },
];

const CONMUTADORES: Array<{ clave: 'rayosX' | 'explosionado' | 'mostrarCampos' | 'mostrarEtiquetas'; nombre: string; icono: NombreIcono }> = [
  { clave: 'rayosX', nombre: 'Rayos X', icono: 'rayos' },
  { clave: 'explosionado', nombre: 'Despiece', icono: 'capas' },
  { clave: 'mostrarCampos', nombre: 'Campos', icono: 'campo' },
  { clave: 'mostrarEtiquetas', nombre: 'Etiquetas', icono: 'etiqueta' },
];

const COMPONENTES: Array<Exclude<IdComponente, 'conductores'>> = ['fuente', 'interruptor', 'resistor', 'inductor', 'capacitor'];

/** Calcula el encuadre de cámara desde el estado global. */
export function useEncuadreLaboratorio(): Encuadre {
  const vista = useLaboratorio((s) => s.vistaCamara);
  const seleccionado = useLaboratorio((s) => s.componenteSeleccionado);
  const explosionado = useLaboratorio((s) => s.explosionado);
  return useMemo(() => {
    if (vista === 'componente' && seleccionado) {
      const [x, y, z] = POSICIONES[seleccionado];
      const [dx, dy, dz] = ENFOQUE_COMPONENTE[seleccionado];
      const elevacion = explosionado ? 1.5 : 0;
      const alejamiento = explosionado ? 1.75 : 1;
      return {
        posicion: [x + dx * alejamiento, y + dy * alejamiento + elevacion, z + dz * alejamiento] as const,
        objetivo: [x, y + 0.8 + elevacion, z] as const,
      };
    }
    return VISTAS_CAMARA[vista === 'componente' ? 'isometrica' : vista];
  }, [vista, seleccionado, explosionado]);
}

type PestanaMovil = 'parametros' | 'resultados' | 'componente';

export default function PaginaLaboratorio() {
  // Selección superficial: la página no se re-renderiza cuando avanza el tiempo.
  const estado = useLaboratorio(
    useShallow((s) => ({
      vistaCamara: s.vistaCamara,
      componenteSeleccionado: s.componenteSeleccionado,
      solicitudCamara: s.solicitudCamara,
      explosionado: s.explosionado,
      rayosX: s.rayosX,
      mostrarCampos: s.mostrarCampos,
      mostrarEtiquetas: s.mostrarEtiquetas,
      conectado: s.conectado,
      seleccionarComponente: s.seleccionarComponente,
      establecerVista: s.establecerVista,
      alternar: s.alternar,
      encender: s.encender,
    })),
  );
  const calidadAlta = usePreferencias((s) => s.calidadAlta);
  const establecerCalidad = usePreferencias((s) => s.establecerCalidad);
  const encuadre = useEncuadreLaboratorio();
  const [pestana, setPestana] = useState<PestanaMovil>('resultados');

  const explotados = estado.explosionado ? (estado.componenteSeleccionado ? [estado.componenteSeleccionado] : true) : false;

  return (
    <div className="laboratorio">
      <aside className="laboratorio__lateral laboratorio__lateral--izquierdo panel solo-escritorio" aria-label="Parámetros">
        <PanelParametros />
      </aside>

      <section className="laboratorio__escenario" aria-label="Escenario 3D">
        <div className="escenario">
          <Escena3D
            encuadre={encuadre}
            claveEncuadre={estado.solicitudCamara}
            alClicVacio={() => estado.componenteSeleccionado && estado.seleccionarComponente(null)}
          >
            {(paleta) => (
              <CircuitoRLC
                paleta={paleta}
                seleccionado={estado.componenteSeleccionado}
                alSeleccionar={estado.seleccionarComponente}
                explotados={explotados}
                rayosX={estado.rayosX}
                mostrarCampos={estado.mostrarCampos}
                mostrarEtiquetas={estado.mostrarEtiquetas}
              />
            )}
          </Escena3D>

          <div className="escenario__superior">
            <div className="grupo-botones escenario__vistas" role="group" aria-label="Vistas de cámara">
              {VISTAS.map((v) => (
                <button
                  key={v.id}
                  className={`boton boton--pequeno ${estado.vistaCamara === v.id ? 'boton--activo' : ''}`}
                  onClick={() => estado.establecerVista(v.id)}
                >
                  <Icono nombre="camara" tamano={15} /> {v.nombre}
                </button>
              ))}
            </div>
            <div className="grupo-botones" role="group" aria-label="Capas de visualización">
              {CONMUTADORES.map((c) => (
                <button
                  key={c.clave}
                  className={`boton boton--pequeno ${estado[c.clave] ? 'boton--activo' : ''}`}
                  onClick={() => estado.alternar(c.clave)}
                  aria-pressed={estado[c.clave]}
                >
                  <Icono nombre={c.icono} tamano={15} /> {c.nombre}
                </button>
              ))}
              <button
                className={`boton boton--pequeno ${calidadAlta ? 'boton--activo' : ''}`}
                onClick={() => establecerCalidad(!calidadAlta)}
                title="Sombras y resolución alta"
              >
                HD
              </button>
            </div>
          </div>

          <div className="escenario__componentes" role="group" aria-label="Seleccionar componente">
            {COMPONENTES.map((id) => (
              <button
                key={id}
                className={`chip chip--sin-punto chip--boton ${estado.componenteSeleccionado === id ? 'chip--seleccionado' : ''}`}
                onClick={() => {
                  estado.seleccionarComponente(estado.componenteSeleccionado === id ? null : id);
                  setPestana('componente');
                }}
              >
                {FICHAS[id].simbolo} · {FICHAS[id].nombre}
              </button>
            ))}
          </div>

          {!estado.conectado && (
            <button className="escenario__encender boton boton--primario boton--grande" onClick={estado.encender}>
              <Icono nombre="energia" /> Cerrar interruptor y encender
            </button>
          )}
          <p className="escenario__ayuda texto-xs solo-escritorio">Arrastra para rotar · rueda para zoom · clic derecho para desplazar · clic en un componente para inspeccionarlo</p>
        </div>
        <div className="laboratorio__reproduccion panel">
          <BarraReproduccion />
        </div>
      </section>

      <aside className="laboratorio__lateral laboratorio__lateral--derecho panel solo-escritorio" aria-label="Resultados">
        <FichaSeleccionada />
        <PanelClasificacion />
        <PanelInstantaneo />
        <PanelValidaciones />
      </aside>

      <section className="laboratorio__movil solo-movil">
        <div className="pestanas" role="tablist">
          {(
            [
              ['parametros', 'Parámetros'],
              ['resultados', 'Resultados'],
              ['componente', 'Componente'],
            ] as const
          ).map(([id, nombre]) => (
            <button key={id} role="tab" className="pestana" aria-selected={pestana === id} onClick={() => setPestana(id)}>
              {nombre}
            </button>
          ))}
        </div>
        <div className="panel laboratorio__movil-contenido">
          {pestana === 'parametros' && <PanelParametros />}
          {pestana === 'resultados' && (
            <>
              <PanelClasificacion />
              <PanelInstantaneo />
              <PanelValidaciones />
            </>
          )}
          {pestana === 'componente' &&
            (estado.componenteSeleccionado ? (
              <FichaSeleccionada />
            ) : (
              <p className="texto-2 texto-s panel-lab__seccion">Toca un componente en la escena 3D o en la lista para ver su interior, ecuaciones y partes.</p>
            ))}
        </div>
      </section>
    </div>
  );
}
