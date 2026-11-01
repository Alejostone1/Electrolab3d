import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { Proveedores } from './app/providers';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Proveedores>
      <App />
    </Proveedores>
  </StrictMode>,
);
