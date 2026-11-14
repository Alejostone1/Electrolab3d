import { Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { Cabecera } from '@/components/layout/Cabecera';
import { PiePagina } from '@/components/layout/PiePagina';
import { Cargando, Notificaciones } from '@/components/feedback/Feedback';
import { ExplicadorSimbolos } from '@/components/feedback/ExplicadorSimbolos';
import { useRelojSimulacion } from '@/hooks/useSimulacion';
import * as Rutas from './routes';

function DesplazarArriba() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

export function App() {
  useRelojSimulacion();
  const { pathname } = useLocation();
  const pantallaCompleta = pathname.startsWith('/presentacion');
  const sinPie = pantallaCompleta || pathname.startsWith('/laboratorio') || pathname.startsWith('/ensamblaje');

  return (
    <>
      <DesplazarArriba />
      {!pantallaCompleta && <Cabecera />}
      <main>
        <Suspense fallback={<Cargando />}>
          <Routes>
            <Route path="/" element={<Rutas.Inicio />} />
            <Route path="/laboratorio" element={<Rutas.Laboratorio />} />
            <Route path="/ensamblaje" element={<Rutas.Ensamblaje />} />
            <Route path="/experimentos" element={<Rutas.Experimentos />} />
            <Route path="/matematicas" element={<Rutas.Matematicas />} />
            <Route path="/graficas" element={<Rutas.Graficas />} />
            <Route path="/desafios" element={<Rutas.Desafios />} />
            <Route path="/aplicaciones" element={<Rutas.Aplicaciones />} />
            <Route path="/acerca" element={<Rutas.Acerca />} />
            <Route path="/presentacion" element={<Rutas.Presentacion />} />
            <Route path="*" element={<Rutas.Inicio />} />
          </Routes>
        </Suspense>
      </main>
      {!sinPie && <PiePagina />}
      <Notificaciones />
      <ExplicadorSimbolos />
    </>
  );
}
