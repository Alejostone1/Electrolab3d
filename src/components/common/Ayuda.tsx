import { useId, useState, type ReactNode } from 'react';
import './comunes.css';

/** Tooltip accesible: aparece con hover, foco o toque. */
export function Ayuda({ texto, children }: { texto: string; children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  return (
    <span
      className="ayuda"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      onClick={() => setVisible((v) => !v)}
      aria-describedby={id}
    >
      {children}
      <span role="tooltip" id={id} className={`ayuda__burbuja ${visible ? 'ayuda__burbuja--visible' : ''}`}>
        {texto}
      </span>
    </span>
  );
}
