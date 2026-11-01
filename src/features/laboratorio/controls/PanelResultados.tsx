import { Link } from 'react-router-dom';
import { DESCRIPCION_AMORTIGUAMIENTO, DESCRIPCION_ESTADO, NOMBRES_AMORTIGUAMIENTO } from '@/engine';
import { Formula } from '@/components/common/Formula';
import { Icono } from '@/components/common/Icono';
import { FICHAS } from '@/data/componentes';
import { useEstadoCircuito, useMuestraActual } from '@/hooks/useSimulacion';
import { useLaboratorio } from '@/store/useLaboratorio';
import { aPrecision, formatearIngenieria } from '@/utils/formato';
import { Osciloscopio } from './Osciloscopio';

function Indicador({ nombre, valor, color }: { nombre: string; valor: string; color?: string }) {
  return (
    <div className="indicador" style={color ? { borderColor: `color-mix(in srgb, ${color} 40%, transparent)` } : undefined}>
      <span className="indicador__nombre">{nombre}</span>
      <span className="indicador__valor" style={color ? { color } : undefined}>
        {valor}
      </span>
    </div>
  );
}

export function PanelClasificacion() {
  const resultado = useLaboratorio((s) => s.resultado);
  const { derivados, clasificacion } = resultado;
  return (
    <div className="panel-lab__seccion">
      <div className={`clasificacion clasificacion--${clasificacion}`}>
        <span className="clasificacion__etiqueta">Tipo de respuesta</span>
        <strong>{NOMBRES_AMORTIGUAMIENTO[clasificacion]}</strong>
        <p>{DESCRIPCION_AMORTIGUAMIENTO[clasificacion]}</p>
        <div className="zeta">
          <div className="zeta__barra">
            <span className="zeta__marca" style={{ left: `${Math.min(100, (derivados.relacionAmortiguamiento / 3) * 100)}%` }} />
            <span className="zeta__critico" />
          </div>
          <div className="zeta__escala mono">
            <span>ζ = 0</span>
            <span>1</span>
            <span>3</span>
          </div>
        </div>
      </div>
      <div className="lista-indicadores">
        <Indicador nombre="ω₀ frecuencia natural" valor={`${aPrecision(derivados.frecuenciaNatural, 4)} rad/s`} />
        <Indicador nombre="α amortiguamiento" valor={`${aPrecision(derivados.coeficienteAmortiguamiento, 4)} s⁻¹`} />
        <Indicador nombre="ζ relación" valor={aPrecision(derivados.relacionAmortiguamiento, 4)} />
        <Indicador nombre="R crítica" valor={`${aPrecision(derivados.resistenciaCritica, 4)} Ω`} />
        <Indicador nombre="ωd amortiguada" valor={derivados.frecuenciaAmortiguada ? `${aPrecision(derivados.frecuenciaAmortiguada, 4)} rad/s` : 'No aplica'} />
        <Indicador nombre="Q factor de calidad" valor={aPrecision(derivados.factorCalidad, 3)} />
        <Indicador nombre="τ dominante" valor={formatearIngenieria(derivados.constanteTiempoDominante, 's')} />
        <Indicador
          nombre="t estabilización (2 %)"
          valor={resultado.tiempoEstabilizacion !== null ? formatearIngenieria(resultado.tiempoEstabilizacion, 's') : '—'}
        />
      </div>
    </div>
  );
}

export function PanelInstantaneo() {
  const muestra = useMuestraActual();
  const resultado = useLaboratorio((s) => s.resultado);
  const tiempo = useLaboratorio((s) => s.tiempo);
  const estado = useEstadoCircuito();
  return (
    <div className="panel-lab__seccion">
      <h3 className="panel-lab__titulo">Valores en t = {aPrecision(tiempo * 1000, 4)} ms</h3>
      <p className="texto-s texto-2">{DESCRIPCION_ESTADO[estado]}</p>
      <Osciloscopio resultado={resultado} tiempo={tiempo} />
      <div className="lista-indicadores">
        <Indicador nombre="Carga q" valor={formatearIngenieria(muestra.q, 'C')} color="var(--cian)" />
        <Indicador nombre="Corriente i" valor={formatearIngenieria(muestra.i, 'A')} color="var(--naranja)" />
        <Indicador nombre="V_L inductor" valor={`${aPrecision(muestra.vL, 3)} V`} />
        <Indicador nombre="V_R resistor" valor={`${aPrecision(muestra.vR, 3)} V`} />
        <Indicador nombre="V_C capacitor" valor={`${aPrecision(muestra.vC, 3)} V`} />
        <Indicador nombre="E(t) fuente" valor={`${aPrecision(muestra.E, 3)} V`} />
        <Indicador nombre="P_R = R·i²" valor={formatearIngenieria(muestra.potenciaR, 'W')} color="var(--rojo)" />
        <Indicador nombre="Energía L + C" valor={formatearIngenieria(muestra.energiaL + muestra.energiaC, 'J')} />
      </div>
      <p className="kirchhoff mono texto-s">
        V_L + V_R + V_C = {aPrecision(muestra.vL + muestra.vR + muestra.vC, 4)} V ≈ E(t) = {aPrecision(muestra.E, 4)} V
      </p>
    </div>
  );
}

export function PanelValidaciones() {
  const validaciones = useLaboratorio((s) => s.resultado.validaciones);
  const todas = validaciones.every((v) => v.aprobada);
  return (
    <details className="panel-lab__seccion validaciones" open={!todas}>
      <summary>
        <span className={`chip ${todas ? 'chip--ok' : 'chip--error'}`}>{todas ? 'Modelo verificado' : 'Revisar modelo'}</span>
        <span className="texto-s texto-2">{validaciones.filter((v) => v.aprobada).length}/{validaciones.length} validaciones</span>
      </summary>
      <ul className="validaciones__lista">
        {validaciones.map((v) => (
          <li key={v.id} title={v.descripcion}>
            <Icono nombre={v.aprobada ? 'check' : 'x'} tamano={16} className={v.aprobada ? 'texto-ok' : 'texto-error'} />
            <span>{v.nombre}</span>
            <span className="mono texto-2">{v.valor.toExponential(1)}</span>
          </li>
        ))}
      </ul>
      {!todas && <p className="aviso aviso--error texto-s">Algún indicador supera su tolerancia: el resultado numérico no debe tomarse como físicamente exacto.</p>}
    </details>
  );
}

export function FichaSeleccionada() {
  const seleccionado = useLaboratorio((s) => s.componenteSeleccionado);
  const explosionado = useLaboratorio((s) => s.explosionado);
  const { seleccionarComponente, alternar } = useLaboratorio.getState();
  if (!seleccionado || seleccionado === 'conductores') return null;
  const ficha = FICHAS[seleccionado];
  return (
    <div className="panel-lab__seccion ficha">
      <div className="ficha__cabecera">
        <span className="ficha__simbolo mono">{ficha.simbolo}</span>
        <div>
          <h3>{ficha.nombre}</h3>
          <span className="texto-s texto-2">{ficha.unidad}</span>
        </div>
        <button className="boton boton--fantasma boton--icono" onClick={() => seleccionarComponente(null)} aria-label="Cerrar ficha">
          <Icono nombre="cerrar" tamano={18} />
        </button>
      </div>
      <p className="texto-s">{ficha.rol}</p>
      <Formula latex={ficha.ecuacion} bloque />
      <button className={`boton ${explosionado ? 'boton--activo' : ''}`} onClick={() => alternar('explosionado')}>
        <Icono nombre="capas" tamano={16} /> {explosionado ? 'Ensamblar' : 'Ver por dentro (despiece)'}
      </button>
      <h4 className="ficha__subtitulo">Partes internas</h4>
      <ul className="ficha__partes">
        {ficha.partes.map((parte) => (
          <li key={parte.nombre}>
            <b>{parte.nombre}</b>
            <span>{parte.descripcion}</span>
          </li>
        ))}
      </ul>
      <p className="texto-s texto-2">{ficha.comportamiento}</p>
      <p className="texto-s ficha__nota">
        <Icono nombre="info" tamano={14} /> {ficha.representacion}
      </p>
      <Link to="/matematicas" className="texto-s">
        Ver la ecuación diferencial completa →
      </Link>
    </div>
  );
}
