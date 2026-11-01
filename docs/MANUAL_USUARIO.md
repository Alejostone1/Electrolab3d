# Manual de usuario · ELECTROLAB 3D

## 1. Navegación
- **Celular:** botón ☰ (arriba a la derecha) abre el menú con todos los módulos. El botón azul abre el modo presentación.
- **Escritorio:** barra superior con los módulos principales.
- El ícono ☀/☾ cambia entre modo claro y oscuro (se recuerda en el navegador).

## 2. Laboratorio 3D
1. Pulsa **Cerrar interruptor y encender** (o haz clic sobre el interruptor 3D) para conectar la fuente.
2. Usa ▶ / ⏸ / ⏭ / ↺ para reproducir, pausar, avanzar 2 % o reiniciar. La línea de tiempo permite saltar a cualquier instante; el selector `1×` cambia la velocidad.
3. **Cámara:** arrastra para rotar, rueda o pellizco para zoom, clic derecho o dos dedos para desplazar. Botones *Isométrica / Frontal / Superior*.
4. **Inspeccionar un componente:** toca el componente o su chip inferior. La cámara se acerca y se abre su ficha (ecuación, partes internas).
5. **Ver por dentro:**
   - *Rayos X*: vuelve translúcidas las carcasas.
   - *Despiece*: separa las piezas internas con rótulos (solo del componente seleccionado, o de todos si no hay selección).
6. *Campos* muestra corriente, campo magnético, campo eléctrico y calor; *Etiquetas* muestra valores en vivo.
7. **Parámetros** (panel izquierdo o pestaña *Parámetros* en celular): sliders o valores exactos para L, R, C (µF) y E₀; presets de los tres regímenes; tipo de señal de la fuente; opciones numéricas (tolerancia de clasificación y paso RK4).
8. **Resultados**: tipo de respuesta, ω₀, α, ζ, R crítica, ωd, Q, valores instantáneos, osciloscopio y validaciones del modelo.

## 3. Gráficas
Curvas del mismo resultado del laboratorio. Activa/desactiva curvas con las casillas o tocando la leyenda. El cursor naranjo sigue el tiempo de reproducción. **Exportar CSV** descarga toda la serie temporal.

## 4. Centro matemático
Elige *Configuración del laboratorio* o un preset para generar los 13 pasos: Kirchhoff → EDO → normalización → ecuación característica → raíces → clasificación → soluciones → interpretación.

## 5. Experimentos
Elige uno de los 5 experimentos, lee el procedimiento, agrega valores propios con *Agregar curva*, compara la tabla y pulsa **Guardar experimento** (nombre y observaciones). El historial permite abrir cada configuración en 3D, eliminarla o exportarla en JSON.

## 6. Desafíos
- **Predice antes de experimentar:** observa los parámetros, elige el tipo de respuesta, enciende el circuito y compara con la explicación matemática.
- **Cuestionario:** 8 preguntas generadas al azar (identificación, cálculo, gráficas, predicción y un reto de configuración) con puntaje e historial.

## 7. Presentación
Botones ← →, puntos de progreso o teclado (← → espacio). *Auto* avanza cada 15 s. El botón del cubo oculta el texto para ver solo la escena 3D (tecla H). Esc sale. En las diapositivas de componentes la cámara hace zoom y luego despieza el componente; *Ver por dentro / Ensamblar* lo controla manualmente.
