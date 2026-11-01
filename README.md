# ELECTROLAB 3D

Laboratorio virtual interactivo de circuitos **RLC en serie** y ecuaciones diferenciales lineales de segundo orden.

> Proyecto final de **Matemáticas IV** · Profesor **Cristian C. Sánchez**
> Alejandro Piedrahita · Daniel Colorado · Sebastián Patiño — Ingeniería de Sistemas y Telecomunicaciones, octavo semestre.

```
L q''(t) + R q'(t) + q(t)/C = E(t)
```

## Qué hace

| Módulo | Ruta | Contenido |
|---|---|---|
| Inicio | `/` | Portada con escena 3D en funcionamiento, indicadores y acceso a módulos |
| Laboratorio 3D | `/laboratorio` | Circuito 3D seleccionable, rayos X, despiece de cada componente, campos ilustrativos, reproducción, estados |
| Experimentos | `/experimentos` | 5 experimentos guiados con barridos, tabla comparativa e historial local |
| Centro matemático | `/matematicas` | Procedimiento de 13 pasos generado con los valores reales + raíces en el plano complejo |
| Gráficas | `/graficas` | q(t), i(t), voltajes, energía, comparativa de los 3 regímenes, error RK4, exportación CSV |
| Desafíos | `/desafios` | “Predice antes de experimentar” y cuestionario con puntuación generado por el motor |
| Aplicaciones | `/aplicaciones` | Aplicaciones, analogía mecánica, conceptos, formulario, glosario, unidades y referencias |
| Acerca | `/acerca` | Equipo, objetivos y arquitectura |
| Presentación | `/presentacion` | Recorrido educativo 3D de 15 diapositivas para la sustentación (← → espacio, H, Esc) |

Tema claro y oscuro en toda la aplicación, diseño responsive pensado primero para celular.

## Principio de diseño

Hay **un solo resultado de simulación** (`store/useLaboratorio.ts`). Al cambiar un parámetro:

```
parámetros → validación (Zod) → motor matemático → clasificación → soluciones (analítica + RK4)
          → serie temporal → gráficas · animación 3D · indicadores · centro matemático
```

La escena 3D no contiene matemática: lee la muestra instantánea del motor en cada cuadro (`leerMuestraActual`).

- Portadores de corriente: velocidad y sentido ∝ i(t).
- Capacitor: número de cargas y campo ∝ q(t)/(C·E₀).
- Resistor: brillo térmico ∝ P_R = R·i²(t); las bandas de color codifican el valor real de R.
- Inductor: líneas de campo (ilustrativas) ∝ |i(t)|; número de espiras crece con L.

## Motor matemático (`src/engine`)

- `mathematics/parametrosDerivados.ts` — ω₀, α, ζ, R crítica, ωd, Q, τ dominante.
- `mathematics/raices.ts` — ecuación característica con Math.js (raíces complejas).
- `mathematics/clasificacion.ts` — clasificación con tolerancia configurable sobre |ζ − 1|.
- `mathematics/solucionAnalitica.ts` — soluciones cerradas para raíces complejas, repetidas y reales distintas, con condiciones iniciales generales.
- `mathematics/rk4.ts` — Runge-Kutta 4 sobre x₁ = q, x₂ = i, paso configurable.
- `simulation/simulador.ts` — serie temporal completa, energías, tiempo de estabilización, sobrepaso.
- `simulation/validaciones.ts` — condiciones iniciales, i = dq/dt, Kirchhoff, suma de voltajes, balance energético, estabilidad RK4 y concordancia analítica. Si alguna falla, la interfaz lo advierte.

## Desarrollo

```bash
npm install
npm run dev        # servidor local
npm test           # 41 pruebas unitarias del motor (Vitest)
npm run build      # build de producción
npm run test:e2e   # pruebas de interfaz (requiere: npx playwright install)
```

## Stack

React 18 · Vite · TypeScript · Three.js · React Three Fiber · Drei · Framer Motion · GSAP · Plotly.js · KaTeX · Math.js · Zustand · Zod · Vitest · Playwright.

Los modelos 3D se construyen con geometrías de Three.js (sin recursos de terceros). Las representaciones de campos son simplificaciones visuales, no simulaciones electromagnéticas.

## Documentación

- [Manual de usuario](docs/MANUAL_USUARIO.md)
- [Guion de sustentación](docs/GUION_SUSTENTACION.md)

## Despliegue

Configurado para Vercel (`vercel.json` reescribe las rutas a `index.html`). Persistencia 100 % local (`localStorage`); no hay backend.
