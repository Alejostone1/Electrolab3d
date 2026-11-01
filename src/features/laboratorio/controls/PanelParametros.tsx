import { NOMBRES_FUENTE, PRESETS, RANGOS, type TipoFuente } from '@/engine';
import { Icono } from '@/components/common/Icono';
import { notificar } from '@/store/useNotificaciones';
import { useLaboratorio } from '@/store/useLaboratorio';
import { ControlDeslizante } from './ControlDeslizante';

/** Panel izquierdo: presets, parámetros eléctricos, fuente y opciones numéricas. */
export function PanelParametros() {
  const parametros = useLaboratorio((s) => s.parametros);
  const presetActivo = useLaboratorio((s) => s.presetActivo);
  const errores = useLaboratorio((s) => s.errores);
  const toleranciaCritica = useLaboratorio((s) => s.toleranciaCritica);
  const pasoManual = useLaboratorio((s) => s.pasoManual);
  const resultado = useLaboratorio((s) => s.resultado);
  const { actualizarParametro, actualizarFuente, aplicarPreset, restablecer, establecerTolerancia, establecerPasoManual } = useLaboratorio.getState();
  const { fuente } = parametros;

  return (
    <div className="panel-lab__seccion">
      <h3 className="panel-lab__titulo">Configuraciones predefinidas</h3>
      <div className="presets">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            className={`preset preset--${preset.id} ${presetActivo === preset.id ? 'preset--activo' : ''}`}
            onClick={() => {
              aplicarPreset(preset.id);
              notificar(`Preset ${preset.nombre.toLowerCase()} cargado`, 'exito');
            }}
            title={preset.descripcion}
          >
            <span className="preset__nombre">{preset.nombre}</span>
            <span className="preset__valor mono">R = {preset.parametros.resistencia.toFixed(2)} Ω</span>
          </button>
        ))}
      </div>

      <h3 className="panel-lab__titulo">Parámetros del circuito</h3>
      <ControlDeslizante
        etiqueta="Inductancia"
        simbolo="L"
        unidad="H"
        valor={parametros.inductancia}
        minimo={RANGOS.inductancia.minimo}
        maximo={RANGOS.inductancia.maximo}
        paso={RANGOS.inductancia.paso}
        ayuda="Inercia eléctrica: más L reduce ω₀ y α (oscilaciones más lentas y duraderas)."
        alCambiar={(v) => actualizarParametro('inductancia', v)}
      />
      <ControlDeslizante
        etiqueta="Resistencia"
        simbolo="R"
        unidad="Ω"
        valor={parametros.resistencia}
        minimo={RANGOS.resistencia.minimo}
        maximo={RANGOS.resistencia.maximo}
        paso={RANGOS.resistencia.paso}
        ayuda={`Controla el amortiguamiento α = R/2L. R crítica actual: ${resultado.derivados.resistenciaCritica.toFixed(2)} Ω.`}
        alCambiar={(v) => actualizarParametro('resistencia', v)}
      />
      <ControlDeslizante
        etiqueta="Capacitancia"
        simbolo="C"
        unidad="µF"
        valor={Math.round(parametros.capacitancia * 1e6)}
        minimo={RANGOS.capacitancia.minimo * 1e6}
        maximo={RANGOS.capacitancia.maximo * 1e6}
        paso={1}
        ayuda="Más C almacena más carga (q∞ = C·E₀) y reduce la frecuencia natural."
        alCambiar={(v) => actualizarParametro('capacitancia', v * 1e-6)}
      />
      <ControlDeslizante
        etiqueta="Voltaje"
        simbolo="E₀"
        unidad="V"
        valor={fuente.amplitud}
        minimo={RANGOS.voltaje.minimo}
        maximo={RANGOS.voltaje.maximo}
        paso={RANGOS.voltaje.paso}
        ayuda="Amplitud de la fuente. Escala la respuesta pero no cambia el tipo de amortiguamiento."
        alCambiar={(v) => actualizarFuente({ amplitud: v })}
      />

      <h3 className="panel-lab__titulo">Señal de la fuente</h3>
      <div className="selector-fuente" role="radiogroup" aria-label="Tipo de fuente">
        {(Object.keys(NOMBRES_FUENTE) as TipoFuente[]).map((tipo) => (
          <button
            key={tipo}
            role="radio"
            aria-checked={fuente.tipo === tipo}
            className={`boton ${fuente.tipo === tipo ? 'boton--activo' : ''}`}
            onClick={() => actualizarFuente({ tipo })}
          >
            {NOMBRES_FUENTE[tipo]}
          </button>
        ))}
      </div>
      {(fuente.tipo === 'sinusoidal' || fuente.tipo === 'cuadrada') && (
        <ControlDeslizante
          etiqueta="Frecuencia"
          simbolo="f"
          unidad="Hz"
          valor={fuente.frecuencia}
          minimo={RANGOS.frecuencia.minimo}
          maximo={RANGOS.frecuencia.maximo}
          paso={RANGOS.frecuencia.paso}
          ayuda={`Resonancia cerca de f₀ = ${resultado.derivados.frecuenciaNaturalHz.toFixed(2)} Hz.`}
          alCambiar={(v) => actualizarFuente({ frecuencia: v })}
        />
      )}
      {fuente.tipo === 'pulso' && (
        <ControlDeslizante
          etiqueta="Duración del pulso"
          simbolo="tₚ"
          unidad="s"
          valor={fuente.anchoPulso}
          minimo={RANGOS.anchoPulso.minimo}
          maximo={RANGOS.anchoPulso.maximo}
          paso={RANGOS.anchoPulso.paso}
          alCambiar={(v) => actualizarFuente({ anchoPulso: v })}
        />
      )}

      <details className="opciones-avanzadas">
        <summary>Opciones numéricas</summary>
        <label className="campo">
          <span className="campo__etiqueta">Tolerancia de clasificación |ζ − 1|</span>
          <select className="selector" value={toleranciaCritica} onChange={(e) => establecerTolerancia(Number(e.target.value))}>
            <option value={1e-6}>1×10⁻⁶ (estricta)</option>
            <option value={1e-3}>1×10⁻³ (por defecto)</option>
            <option value={1e-2}>1×10⁻² (1 %)</option>
            <option value={5e-2}>5×10⁻² (5 %)</option>
          </select>
        </label>
        <label className="campo">
          <span className="campo__etiqueta">Paso de integración RK4</span>
          <select className="selector" value={pasoManual ?? 'auto'} onChange={(e) => establecerPasoManual(e.target.value === 'auto' ? null : Number(e.target.value))}>
            <option value="auto">Automático ({resultado.pasoIntegracion.toExponential(2)} s)</option>
            <option value={1e-3}>1 ms</option>
            <option value={1e-4}>0.1 ms</option>
            <option value={1e-5}>0.01 ms</option>
          </select>
        </label>
      </details>

      {errores.length > 0 && (
        <div className="aviso aviso--error" role="alert">
          {errores.map((e) => (
            <p key={e}>{e}</p>
          ))}
        </div>
      )}

      <button className="boton boton--peligro panel-lab__restablecer" onClick={() => { restablecer(); notificar('Parámetros restablecidos', 'info'); }}>
        <Icono nombre="reiniciar" tamano={16} /> Restablecer valores
      </button>
    </div>
  );
}
