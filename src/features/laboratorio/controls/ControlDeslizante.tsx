import { useEffect, useId, useState } from 'react';
import { Ayuda } from '@/components/common/Ayuda';
import { Icono } from '@/components/common/Icono';
import { aPrecision } from '@/utils/formato';

interface PropiedadesControl {
  etiqueta: string;
  simbolo: string;
  unidad: string;
  valor: number;
  minimo: number;
  maximo: number;
  paso: number;
  ayuda?: string;
  color?: string;
  alCambiar: (valor: number) => void;
}

/** Slider + entrada numérica validada. Los valores fuera de rango se rechazan con mensaje. */
export function ControlDeslizante({ etiqueta, simbolo, unidad, valor, minimo, maximo, paso, ayuda, color, alCambiar }: PropiedadesControl) {
  const id = useId();
  const [texto, setTexto] = useState(aPrecision(valor, 5));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTexto(aPrecision(valor, 5));
    setError(null);
  }, [valor]);

  const confirmar = () => {
    const numero = Number(texto.replace(',', '.'));
    if (!Number.isFinite(numero) || texto.trim() === '') {
      setError('Ingresa un número válido');
      return;
    }
    if (numero < minimo || numero > maximo) {
      setError(`Rango permitido: ${minimo} – ${maximo} ${unidad}`);
      return;
    }
    setError(null);
    alCambiar(numero);
  };

  const progreso = ((valor - minimo) / (maximo - minimo)) * 100;

  return (
    <div className="control" style={color ? ({ '--acento': color } as React.CSSProperties) : undefined}>
      <div className="control__cabecera">
        <label htmlFor={id} className="control__etiqueta">
          <span className="control__simbolo mono">{simbolo}</span>
          {etiqueta}
          {ayuda && (
            <Ayuda texto={ayuda}>
              <Icono nombre="info" tamano={14} className="control__ayuda" />
            </Ayuda>
          )}
        </label>
        <div className="control__entrada">
          <input
            className={`entrada mono ${error ? 'entrada--invalida' : ''}`}
            inputMode="decimal"
            value={texto}
            aria-label={`${etiqueta} en ${unidad}`}
            aria-invalid={Boolean(error)}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={confirmar}
            onKeyDown={(e) => e.key === 'Enter' && confirmar()}
          />
          <span className="control__unidad">{unidad}</span>
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={minimo}
        max={maximo}
        step={paso}
        value={valor}
        style={{ '--progreso': `${progreso}%` } as React.CSSProperties}
        onChange={(e) => alCambiar(Number(e.target.value))}
      />
      {error && (
        <p className="control__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
