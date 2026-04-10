# Game Design Document (GDD) - Defensa de la Ciudadela

Este documento detalla las directrices, mecánicas, entidades y arquitectura del minijuego "Defensa de la Ciudadela" integrado en el portal Colmillo de Acero. Sirve como guía de referencia centralizada para mantener el balance y la coherencia en futuras iteraciones.

---

## 1. Visión General

**Defensa de la Ciudadela** es un minijuego de defensa de torres (Tower Defense) táctico y de ritmo dinámico, centrado en el combate 1v1 y la gestión de recursos en tiempo real.

#### **Condición de Derrota (Game Over)**
El juego termina en derrota si:
1. **La Ciudadela Cae:** La salud de la ciudadela llega a **0**.
2. **Insolvencia Estratégica:** El jugador se queda sin puestos de avanzada construidos **y** sin suficiente acero para comprar el puesto más económico (Colmillo Ligero).

### Economía del Juego
- **Turnos:** Cada partida cuesta **1 Turno**. Los turnos se obtienen en el portal.
- **Acero (Recurso de Construcción):**
  - Generación pasiva: **Moderada (~0.56/seg)**.
  - Capacidad máxima: **500**.
  - Fuente principal: Bajas confirmadas y Runas (Bonus x0.85).
- **Táctica (Recurso de Acción):**
  - Generación pasiva: **Fluida (~1.26/seg)**.
  - Capacidad máxima: **450**.
  - Fuente principal: Combos de bajas y Runas (Bonus x0.85).

| Torre | Costo Base | Daño |
| :--- | :--- | :--- |
| **Colmillo Ligero** | 40 | 35 |
| **Mirada del Lobo** | 150 | 60 |
| **Rugido de Acero** | 300 | 30 |
| **Aullido Ártico** | 500 | 20 |

---

## 2. Entidades del Juego

### 2.1 Puestos Defensivos (Torres)
Las torres tienen salud propia y pueden evolucionar mediante bajas confirmadas. Atacan siempre al **enemigo más cercano**.

| Tipo | Nombre | Costo (Acero) | Rango | Daño | Cadencia | HP | Efecto Especial |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Básica** | Colmillo Ligero | 20 | 180 | 35 | 25 ticks | 225 | Balanceada. |
| **Sniper** | Mirada del Lobo | 100 | 380 | 120 | 80 ticks | 120 | Splash, Ralentización. |
| **Splash** | Rugido de Acero | 300 | 160 | 30 | 50 ticks | 300 | Daño de área masivo. |
| **Healer** | Santuario de Vida | 70 | 120 | 15 | 90 ticks | 400 | Sana a los puestos cercanos. Solo activa durante oleadas. |

### 2.2 Sinergia: Vínculo de Acero
Los puestos **Colmillo Ligero** (Básicos) obtienen beneficios al posicionarse estratégicamente:
- **Mecánica de Parejas:** Si dos puestos Colmillo Ligero se encuentran dentro del rango de influencia del otro, forman un **Vínculo de Acero**.
- **Bono de Armadura:** Las torres vinculadas reciben un **30% menos de daño** de todos los ataques enemigos.
- **Visualización:** El vínculo se indica mediante una línea de energía punteada entre los centros de las torres.
- El bono funciona de par en par (una torre solo puede estar vinculada a otra a la vez para este bono específico).

#### **Acciones Tácticas**
- **Reparar (R):** Restaura salud y otorga un **Escudo de Acero** temporal que permite disparar a un segundo objetivo.
- **Mejorar (E):** Aumenta el nivel del puesto, su daño, rango y salud máxima.
- **Vender:** Recupera una parte de la inversión inicial (Acero).
  - **Valor de Venta:** 50% de la inversión total (Construcción + Mejoras).
  - **Bono de Veteranía:** El valor aumenta un **+5% por cada estrella** (baja confirmada).
  - **Penalización de Daño:** El valor se reduce si la torre está dañada (hasta un 50% menos a 0 HP).
  - Se puede vender desde el panel de inspección o mediante la herramienta de venta en el panel izquierdo.
- *Nota: Los costes de Reparación y Mejora escalan con el número de oleada.*

### 2.2 Habilidades Especiales (Carga de Energía)
Cada puesto defensivo acumula energía con cada disparo. Al alcanzar un umbral específico de disparos, libera una **Habilidad Especial** única:

| Torre | Umbral de Disparos | Habilidad Especial | Frase de Activación | Efecto |
| :--- | :--- | :--- | :--- | :--- |
| **Básica** | 40 | Disparo Rápido | "¡DISPARO RÁPIDO!" | Duplica velocidad por 3s. |
| **Sniper** | 20 | Disparo Perforante | "¡DISPARO PERFORANTE!" | Impacto crítico masivo (400%). |
| **Splash** | 30 | Bombardeo | "¡BOMBARDEO!" | 3 explosiones adicionales. |
| **Healer** | 20 | Bendición Ancestral | "¡BENDICIÓN ANCESTRAL!" | Sanación masiva (25%) a todas las torres en área grande. |

### 2.3 Veteranía y Evolución
Los puestos de avanzada mejoran al eliminar enemigos:
- **Indicador de Estrellas (Veteranía):** Cada baja otorga una estrella, representada numéricamente (ej: **5★**). Cada estrella acumulada otorga un **+2% de daño**.
- **Evolución (Nivel):** Al alcanzar las **10 estrellas**, el puesto evoluciona al siguiente nivel:
  - Bono de Daño: +10% (permanente).
  - Salud: Aumenta la salud máxima en +50 y recupera el 25% de la salud actual.
  - El contador de estrellas se reinicia.

### 2.4 Enemigos (Adds)
Los enemigos escalan su nivel y estadísticas según la oleada actual. Atacan al **puesto más cercano**. Son clicables para inspeccionar sus estadísticas en la zona superior central mediante una interfaz compacta y moderna.

| Tipo | Nombre | Ataque Especial (Casteo) | Frases de Esprint |
| :--- | :--- | :--- | :--- |
| **Zombie** | Errante del Vacío | "¡Siente la podredumbre!" | "¡Carne fresca!", "¡Cereeeebros!" |
| **Brujo** | Sacerdote de Sombras | "¡Almas encadenadas, servidme!" | "¡La oscuridad avanza!", "¡Vuestras almas son mías!" |
| **Berserker** | Bestia de Carga | "¡POR EL CAOS!" | "¡SANGRE PARA EL CAOS!", "¡NADA ME DETENDRÁ!" |
| **Valkiria** | Caballero Gélido | "¡El frío os consumirá!" | "¡Como el viento del norte!", "¡Hielo y muerte!" |
| **Orbe** | Espectro Corrupto | "¿A quién disparas?" | "¡Solo soy una sombra!", "¡Inalcanzable!" |

#### **Mecánicas de Movimiento Enemigo**
- **Marcha Dinámica:** Los enemigos poseen una velocidad de marcha base significativa que escala con las oleadas.
- **Combate y Avance Lento:** Al entrar en combate con una torre, los enemigos reducen su velocidad al **25%** pero continúan avanzando lentamente. Esto asegura que entren en el rango de múltiples puestos defensivos.
- **Pausa de Casteo:** El movimiento se detiene completamente mientras el enemigo canaliza una habilidad especial.
- **Esprint de Marcha (Aceleración):** Si un enemigo no recibe daño durante **3 segundos**, su velocidad aumenta un **40%** y emite una **Frase de Esprint** aleatoria (indicado visualmente con partículas amarillas) hasta que vuelve a recibir daño o entra en combate.

---

## 3. Mecánicas del Entorno y Eventos

### 3.1 Oleadas y Progresión
- **Escalado Estricto:** La oleada $n$ contiene exactamente $n$ enemigos.
- **Spawn Masivo:** Todos los enemigos de la oleada aparecen simultáneamente al inicio de la misma, con ligeros desplazamientos de posición para evitar el solapamiento perfecto.
- **Generación Aleatoria:** Los tipos de enemigos en cada oleada se eligen de forma aleatoria del pool disponible.
- **Progresión de Niveles:** 
  - **Oleadas 1 a 7:** Todos los enemigos son **Nivel 1**.
  - **Oleadas 8+:** El nivel de los enemigos aumenta estrictamente en 1 por cada nueva oleada (Ej: Oleada 8 = Nivel 2, Oleada 9 = Nivel 3).
- **Escalado de Estadísticas:** La salud (HP), el daño y las recompensas escalan proporcionalmente al **Nivel del Enemigo**, no al número de oleada directamente.
- **Check map generation milestone (every 7 waves, triggers AFTER wave clear)**:
  - El camino (path) se regenera aleatoriamente cada 7 oleadas completadas.
  - **Regla de Preservación**: Solo se destruyen automáticamente los puestos de avanzada que colisionen con el nuevo trazado del camino. Los puestos que permanezcan en terreno seguro se conservan con su nivel y veteranía actuales.
  - Se activa un efecto de sacudida de pantalla masiva y una notificación en el canvas.

### 3.2 Niebla de Guerra (Fog of War)
- El mapa está cubierto por una niebla que oculta el terreno.
- La niebla se disipa permanentemente alrededor de los puestos defensivos construidos (Radio de visión: 120% del rango de la torre).
- El inicio y el final del camino (Portal) siempre son visibles.
- **Visibilidad Especial:** Las runas de botín de guerra y las marcas de la plaga son visibles a través de la niebla.

### 3.3 Maldiciones y Debuffs (Temporales)
Las maldiciones lanzadas por la Plaga ya no son permanentes. Cada efecto negativo tiene una duración estimada de **4 a 5 segundos** (240-300 ticks):
- **Cegado (Niebla Abisal):** Reduce el rango de la torre un 40% durante 5s.
- **Débil (Maldición de Lentitud/Vacío):** Reduce el daño de la torre un 40% durante 5s.
- **Oxidado (Oxidación Instantánea):** Reduce el daño de una torre específica un 60% durante 5s.
- **Congelado (Explosión de Hielo):** Paraliza la torre completamente.

Visualmente, estos estados se indican con una etiqueta roja sobre la barra de salud de la torre afectada.

### 4. Interfaz de Usuario (HUD)
El HUD ha sido optimizado para maximizar el área de combate mediante el uso de elementos flotantes y translúcidos:

- **Cápsula de Estadísticas (Inferior Central):** Unifica salud de la ciudadela, acero, táctica, oleada y conteo de puestos en un solo elemento compacto.
- **Dock de Construcción (Derecha):** Acceso rápido a los 4 tipos de puestos y botón de pausa. Los bordes cambian a **Verde** si hay fondos suficientes o **Rojo** si no.
- **Dock de Herramientas (Izquierda):** Controles de pantalla completa, configuración, reparación, mejora y venta rápida.
- **Placa de Inspección (Superior Central):** Aparece al seleccionar cualquier unidad. Permite ver estadísticas detalladas y realizar acciones específicas sobre la unidad seleccionada.

| Tecla | Acción |
| :--- | :--- |
| **A / S / D / F** | Seleccionar Torre (Básica / Sniper / Splash / Nova) |
| **R** | Reparar Puesto seleccionado |
| **E** | Mejorar Puesto seleccionado |
| **Espacio** | Pausar Juego (Cuesta 10 de Táctica) |
| **W** | Pantalla Completa |
| **Q** | Activar/Desactivar Sonidos |
| **Shift + Click** | Construcción múltiple del mismo tipo |

### 4.1 Opciones de Configuración (Menú ⚙️)
El menú de configuración permite ajustar la experiencia de juego:
- **Sonidos:** Activa o desactiva los efectos de audio sintetizados.
- **Turbo x2:** Duplica la velocidad del motor de juego para partidas más rápidas.
- **Niebla de Guerra:** Permite desactivar visualmente la niebla (modo depuración/accesibilidad).
- **Ver Rangos:** Activa la visualización permanente de los círculos de alcance de todos los puestos en tierra.
- **Reasignación de Teclas:** Permite cambiar los atajos de teclado haciendo clic en la tecla actual.

## 5. Notas Técnicas de Optimización

- **Colisiones:** Uso de distancias al cuadrado para evitar `Math.sqrt`.
- **Renderizado:** Bucle de 60fps con `requestAnimationFrame`.
- **IA:** Búsqueda de objetivo más cercano filtrada por cajas de colisión (bounding boxes) para ahorrar CPU.
- **Audio:** Sintetizado en tiempo real (Web Audio API).
