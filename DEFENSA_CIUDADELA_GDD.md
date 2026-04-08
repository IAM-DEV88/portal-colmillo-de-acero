# Game Design Document (GDD) - Defensa de la Ciudadela

Este documento detalla las directrices, mecánicas, entidades y arquitectura del minijuego "Defensa de la Ciudadela" integrado en el portal Colmillo de Acero. Sirve como guía de referencia centralizada para mantener el balance y la coherencia en futuras iteraciones.

---

## 1. Visión General

**Defensa de la Ciudadela** es un minijuego de defensa de torres (Tower Defense) renderizado dinámicamente mediante HTML5 `<canvas>`.
El objetivo del jugador es sobrevivir a tantas oleadas de "Adds" (enemigos) como sea posible construyendo defensas estratégicas.

### Economía del Juego
- **Combustible (Turnos):** Cada intento o partida cuesta **1 Turno**. Los turnos se obtienen interactuando con otras mecánicas del portal (ej. La Ruleta).
- **Recurso de Partida (Oro):** Se usa exclusivamente durante la partida para construir torres. El jugador inicia con `400g` y gana más oro eliminando enemigos o recogiendo Runas Etéreas.

---

## 2. Entidades del Juego

### 2.1 Torres (Defensas)
Las torres son las defensas principales. Tienen salud propia, un coste en oro y pueden ser atacadas o destruidas por los enemigos o eventos.

| Tipo | Color | Costo | Rango | Daño | Cadencia (Fire Rate) | Salud (HP) | Efecto Especial |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Básica** | Azul (`#60A5FA`) | 100g | 180 | 30 | Alta (45 ticks) | 100 | Disparo único balanceado. |
| **Francotirador** | Morado (`#C084FC`) | 250g | 350 | 80 | Lenta (90 ticks) | 60 | Largo alcance y daño masivo. Frágil. |
| **Splash (Área)** | Rojo (`#EF4444`) | 400g | 150 | 40 | Media (60 ticks) | 150 | Daño de área (AoE). Radio de explosión: 80. |
| **Nova de Hielo** | Cyan (`#22D3EE`) | 500g | 200 | 15 | Muy Lenta (120) | 200 | Daño de área masivo (Radio: 150) con proyectil casi instantáneo. Alta durabilidad. |
| **Reparación** | Verde (`#22C55E`) | 50g | N/A | N/A | N/A | +50 | Restaura 50 HP a una torre dañada. |

### 2.2 Enemigos (Adds)
Los enemigos viajan por el camino generado y atacan las torres cercanas o la ciudadela. Su salud y velocidad escalan con cada oleada.

| Tipo | Color / Estética | Mod. Velocidad | Mod. Salud | Tipo de Ataque | Efecto sobre Torres |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Normal** | Verde | 1.0x | 1.0x | `normal` (Círculo) | Daño estándar a la torre. |
| **Fuego** | Rojo | 0.8x (Lento) | 1.5x (Tanque) | `fire` (Llama) | Daño extra por quemadura (ráfaga de fuego). |
| **Hielo** | Azul | 1.3x (Rápido) | 0.7x (Frágil) | `ice` (Diamante) | **Congela** la torre por 1 segundo (impide disparar). |
| **Veneno** | Esmeralda | 1.0x | 1.2x | `poison` (Burbuja) | Daño por veneno progresivo/extra. |
| **Sombra** | Morado Oscuro | 1.1x | 1.3x | `shadow` (Media Luna)| Daño alto y sigilo. |

#### **Mecánica de Rango Aumentado (Sniper Enemies)**
- En cada oleada (excepto oleadas de jefe), de **1 a 3 enemigos aleatorios** reciben un aumento masivo en su rango de ataque (de 120 a 250).
- **Indicador Visual:** Estos enemigos poseen un aura o "crosshair" ámbar (`#FCD34D`) dibujada a su alrededor.

#### **Jefes de Élite (Mini-Bosses)**
- **Aparición:** El último enemigo de cada **3 oleadas** es un Jefe de Élite.
- **Stats:** Poseen vida masiva, velocidad muy reducida, rango de ataque aumentado de forma base, y ataques altamente dañinos con cadencia acelerada.
- **Recompensa:** Al morir, sueltan oro masivo y tienen un **100% de probabilidad** de soltar una Runa Etérea.

---

## 3. Mecánicas del Entorno y Eventos

### 3.1 Eventos Aleatorios (Tensión Visual)
A partir de la oleada 2, hay un 90% de probabilidad de que ocurra un evento entre oleadas. Una alerta roja/naranja/morada advertirá al jugador.

1. **Lluvia de Fuego (Meteoro):**
   - **Efecto:** Destruye instantáneamente una torre al azar.
   - **Castigo:** Si el jugador no tiene torres, el meteoro impacta la Ciudadela directamente (-20 HP).
2. **Maldición de Sombras:**
   - **Efecto:** Una torre al azar es paralizada (congelada) durante 5 segundos completos (300 ticks).
3. **Runas Etéreas (Bonus Drop):**
   - **Efecto:** Aparecen entre 2 y 4 runas flotantes que el jugador debe atrapar (hacer clic) antes de que desaparezcan.

### 3.2 Runas Etéreas (Aumentos / Buffs)
Las runas pueden aparecer por el Evento Aleatorio o al morir un enemigo (10% prob. normal, 100% prob. jefe).

- **Oro (Color Dorado / Runa ᚩ):** Otorga entre +20 y +100 de Oro.
- **Salud (Color Verde / Runa ᛉ):** Cura la Ciudadela en +20 HP. Permite **Overheal** (superar los 100 HP máximos base).
- **Hielo (Color Azul / Runa ᛁ):** Ralentiza permanentemente a todos los enemigos actualmente vivos en el mapa a la mitad de su velocidad.
- **Frenesí (Color Rojo / Runa ᚱ):** Otorga el buff `doubleShot` a todas las torres del mapa, reduciendo su tiempo de recarga (Cooldown) a la mitad durante 5 segundos.
- **Bomba (Color Naranja / Runa ᛒ):** Infringe 50 de daño directo e instantáneo a todos los enemigos presentes en el mapa, mostrando daño masivo.

### 3.3 El Terreno y El Camino
- **Generación Dinámica:** El camino se genera evitando los bordes superior izquierdo y derecho para no colisionar con la Interfaz de Usuario (UI).
- **Terremoto (Map Shift):** Cada **7 oleadas**, ocurre un terremoto. El mapa cambia su ruta, **todas las torres actuales son destruidas** y la pantalla tiembla masivamente.
- **Penalización de Escape:** Si un enemigo llega al final del camino (Portal), la ciudadela pierde **-10 HP** y el jugador es penalizado con **-10 Oro**.

### 3.4 Fase de Caída (Game Over Retrasado)
- Si la salud de la ciudadela llega a **0 HP** mientras aún hay enemigos vivos en el mapa, el juego entra en la fase de "Caída".
- En esta fase, **no se muestra inmediatamente la pantalla de Game Over**. El jugador puede ver cómo sus torres intentan eliminar a los enemigos restantes.
- Cada enemigo que alcance la ciudadela durante la fase de Caída **drenará -50 Oro** del jugador.
- La pantalla de Game Over solo se activará una vez que **no queden enemigos en el mapa** (hayan sido eliminados o hayan escapado).

### 3.5 Efectos Visuales Especiales
- **Screen Shake (Temblor de Pantalla):** El canvas tiembla dinámicamente cuando:
  - Un enemigo escapa.
  - La ciudadela o una torre recibe un impacto de Meteoro.
  - Una torre es destruida.
  - Un Jefe Élite muere.
  - Se usa la Runa de Bomba.
- **Floating Text (Números de Daño):** Al impactar enemigos o torres, se dibujan números o iconos flotantes en el canvas indicando el daño recibido o el efecto aplicado (ej. `❄️`, `🔥`, `-40`).
- **Notificaciones Dinámicas y Combos:** Los mensajes centrales (`showCanvasToast`) se renderizan sin fondo oscuro, usando `strokeText` para máxima visibilidad.
  - **Runa Combo (Ámbar):** Recoger runas de oro rápidamente acumula un multiplicador que aumenta el tamaño y brillo del texto.
  - **Multi-Kill Combo (Rojo):** Matar enemigos en rápida sucesión (ej. con daño de área o runas) genera un contador `MULTI-KILL!` que recompensa con **oro extra** (+5g por cada nivel del combo).
  - Todas las notificaciones de combos aparecen fijas en la parte superior central del canvas para no bloquear la visión.
- **Status UI (Estados Activos):** Los buffs globales aplicados por las runas (ej. `🔥 Frenesí`, `❄️ Hielo`) muestran un panel translúcido interactivo en la **esquina inferior izquierda** de la pantalla. Este panel incluye un temporizador de cuenta regresiva (segundos) y una barra de progreso que se agota en tiempo real mientras el efecto está activo.

---

## 4. Arquitectura y Buenas Prácticas de Desarrollo

Para futuras iteraciones o al modificar `defensa.astro`, se deben seguir estas reglas:

### 4.1 Renderizado y Notificaciones (Canvas API)
- **Cero superposición DOM:** El juego no usa el DOM de HTML para las entidades, partículas, menús de inicio o Game Over. Todo esto se renderiza en el `<canvas>` en la función `draw()`.
- **Notificaciones In-Canvas:** En lugar de usar alertas externas (toasts), el juego emplea `showCanvasToast(msg, type)`, que dibuja mensajes flotantes dentro del canvas, garantizando que no se interfiera con los eventos del ratón.
- **Botones dentro del Canvas:** Elementos clickeables como el botón de "Siguiente Oleada" o "Iniciar Partida" se detectan calculando las coordenadas del ratón en el evento `canvas.addEventListener('click')`. Nunca usar `<button>` de HTML superpuestos (`z-index`) sobre el canvas, ya que rompen la captura de eventos (pointer-events).
- **Z-Index:** El canvas debe mantener un z-index libre de superposiciones oscuras o modales de Tailwind que impidan los clics.

### 4.2 Optimización y Bucle de Juego (Game Loop)
- **`requestAnimationFrame`:** Usar siempre este método nativo del navegador para mantener los 60fps constantes.
- **Limpieza de Arrays (Garbage Collection):** Los proyectiles, partículas, runas y enemigos deben eliminarse de sus respectivos arrays (`splice()`) inmediatamente cuando cumplen su ciclo de vida (`life <= 0`) o impactan, para evitar fugas de memoria.

### 4.3 Sistema de Audio
- **Procedural (Web Audio API):** No se deben importar archivos `.mp3` o `.wav` externos para no saturar el servidor. Se usa `AudioContext` para sintetizar sonidos procedimentales usando osciladores (`square`, `sine`, `sawtooth`) para disparos, explosiones y UI.

### 4.4 Balanceo
- Si se agregan nuevas torres o enemigos, sus configuraciones deben declararse explícitamente en el objeto constante `TOWER_STATS` o en la matriz `ENEMY_TYPES` respetando la estructura existente.
- Siempre garantizar que el oro inicial (actualmente `400g`) permita al jugador construir al menos una torre capaz de contener la primera oleada (ej. Torre Splash).
