import { NOMBRES_ESTADO } from '@/engine';
import { Icono } from '@/components/common/Icono';
import { useEstadoCircuito } from '@/hooks/useSimulacion';
import { DURACION_REPRODUCCION, useLaboratorio } from '@/store/useLaboratorio';
import { aPrecision } from '@/utils/formato';
import './controles.css';

const VELOCIDADES = [0.25, 0.5, 1, 2, 4];

/** Controles de reproducción compartidos por el laboratorio, las gráficas y la presentación. */
export function BarraReproduccion({ compacta = false }: { compacta?: boolean }) {
  const tiempo = useLaboratorio((s) => s.tiempo);
  const duracion = useLaboratorio((s) => s.resultado.duracion);
  const reproduciendo = useLaboratorio((s) => s.reproduciendo);
  const conectado = useLaboratorio((s) => s.conectado);
  const velocidad = useLaboratorio((s) => s.velocidad);
  const estado = useEstadoCircuito();
  const { reproducir, pausar, reiniciar, avanzar, establecerTiempo, establecerVelocidad, alternarInterruptor } = useLaboratorio.getState();

  const camaraLenta = DURACION_REPRODUCCION / duracion / velocidad;

  return (
    <div className={`reproduccion ${compacta ? 'reproduccion--compacta' : ''}`}>
      <div className="reproduccion__botones">
        <button
          className={`boton boton--icono ${conectado ? 'boton--activo' : ''}`}
          onClick={alternarInterruptor}
          aria-label={conectado ? 'Abrir interruptor (apagar)' : 'Cerrar interruptor (encender)'}
          title={conectado ? 'Apagar' : 'Encender'}
        >
          <Icono nombre="energia" />
        </button>
        <button
          className="boton boton--primario boton--icono"
          onClick={reproduciendo ? pausar : reproducir}
          aria-label={reproduciendo ? 'Pausar' : 'Reproducir'}
          title={reproduciendo ? 'Pausar' : 'Reproducir'}
        >
          <Icono nombre={reproduciendo ? 'pausa' : 'reproducir'} />
        </button>
        <button className="boton boton--icono" onClick={() => avanzar()} aria-label="Avanzar un paso" title="Avanzar 2 %">
          <Icono nombre="avanzar" tamano={18} />
        </button>
        <button className="boton boton--icono" onClick={reiniciar} aria-label="Reiniciar" title="Reiniciar">
          <Icono nombre="reiniciar" tamano={18} />
        </button>
      </div>

      <div className="reproduccion__linea">
        <input
          type="range"
          min={0}
          max={duracion}
          step={duracion / 1000}
          value={tiempo}
          aria-label="Tiempo de simulación"
          style={{ '--progreso': `${(tiempo / duracion) * 100}%` } as React.CSSProperties}
          onChange={(e) => establecerTiempo(Number(e.target.value))}
        />
        <div className="reproduccion__tiempos mono">
          <span>t = {aPrecision(tiempo * 1000, 4)} ms</span>
          <span className={`chip chip--estado-${estado}`}>{NOMBRES_ESTADO[estado]}</span>
          <span>{aPrecision(duracion * 1000, 4)} ms</span>
        </div>
      </div>

      <label className="reproduccion__velocidad">
        <span className="visualmente-oculto">Velocidad</span>
        <select className="selector mono" value={velocidad} onChange={(e) => establecerVelocidad(Number(e.target.value))}>
          {VELOCIDADES.map((v) => (
            <option key={v} value={v}>
              {v}×
            </option>
          ))}
        </select>
        {!compacta && <small className="texto-2">cámara lenta ×{aPrecision(camaraLenta, 3)}</small>}
      </label>
    </div>
  );
}
