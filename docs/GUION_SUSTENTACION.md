# Guion de sustentación (≈ 15 minutos)

Abrir `/presentacion` en pantalla completa. Cada bloque indica quién habla (sugerido) y qué mostrar.

| # | Diapositiva | Responsable | Puntos clave |
|---|---|---|---|
| 1 | Portada | Alejandro | Nombre del proyecto, equipo, profesor. El circuito ya está simulando en vivo. |
| 2 | ¿Qué es un RLC en serie? | Alejandro | Misma corriente en todos los elementos. R disipa, L y C almacenan. Los puntos del cable = i(t). |
| 3 | Fuente | Daniel | Zoom + despiece de la celda. E(t) es el término independiente. |
| 4 | Interruptor | Daniel | Se cierra en t = 0: condiciones iniciales q(0) = 0, i(0) = 0. |
| 5 | Resistor | Daniel | Película de carbón en espiral, bandas = valor real de R. V = Ri, P = Ri². |
| 6 | Inductor | Sebastián | Devanado y núcleo; V_L = L di/dt origina la segunda derivada. Campo B ilustrativo. |
| 7 | Capacitor | Sebastián | Placas, dieléctrico y cargas ∝ q(t). V_C = q/C. |
| 8 | Kirchhoff → EDO | Alejandro | Sustitución i = q' ⇒ L q'' + R q' + q/C = E(t). |
| 9 | Ecuación característica | Alejandro | r = −α ± √(α² − ω₀²); ζ y R crítica. |
| 10–12 | Tres regímenes en vivo | Daniel | Mostrar el osciloscopio barriendo y la corriente que cambia de sentido solo en el subamortiguado. |
| 13 | Comparación | Sebastián | Solo cambia R. Analítica vs RK4: error relativo < 10⁻⁶ (pruebas automáticas). |
| 14 | Aplicaciones | Sebastián | Radio, filtros, fuentes conmutadas, analogía masa-resorte. |
| 15 | Cierre | Todos | “Matemáticas que se pueden ver”. |

## Demostración en vivo (3 minutos, después de la diapositiva 15)
1. `/laboratorio` → preset **Subamortiguado** → encender. Mostrar estado *Oscilando*.
2. Subir R lentamente con el slider hasta ≈ 44.72 Ω: la clasificación pasa a **Crítico**, cambian la barra ζ, el osciloscopio, el brillo del resistor y el movimiento de los portadores. *(Prueba definitiva del proyecto.)*
3. Seleccionar el inductor → *Ver por dentro*.
4. `/matematicas` → el procedimiento usa los valores recién elegidos.
5. `/graficas` → exportar CSV.

## Preguntas probables
- **¿Cómo saben que el resultado es correcto?** 41 pruebas unitarias: solución analítica vs RK4, Kirchhoff, balance de energía, estabilidad. El panel *Validaciones* lo verifica en cada simulación.
- **¿Por qué la tolerancia en el caso crítico?** R = 44.72 Ω da ζ ≈ 0.99997; sin tolerancia se clasificaría como subamortiguado por redondeo.
- **¿Los campos son reales?** Son representaciones ilustrativas cuya intensidad sigue a i(t) y q(t); no es una simulación electromagnética completa.
