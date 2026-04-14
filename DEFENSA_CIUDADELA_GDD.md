# GDD - DEFENSA DE LA CIUDADELA: EL ÚLTIMO BASTIÓN

## 1. Visión General
**Defensa de la Ciudadela** es un juego de Tower Defense táctico con elementos de gestión de recursos en tiempo real, donde el jugador debe proteger el núcleo de la ciudad contra oleadas crecientes de "La Plaga del Vacío". El juego destaca por su sistema de **Vínculos de Acero**, permitiendo ataques conjuntos coordinados entre torres del mismo tipo.

---

## 2. Sistema Económico
El juego utiliza un sistema de "Números Pequeños" para facilitar el cálculo táctico rápido.

### 2.1 Monedas
- **Acero (⚙️)**: Recurso material. Se usa para construir nuevas torres, realizar Sobrecargas de Acero y activar Vínculos.
- **Táctica (⚡)**: Recurso estratégico. Se usa para reparaciones de emergencia, mejoras de nivel permanentes y pausas tácticas.

### 2.2 Generación y Drenaje (Balance Activo)
Para evitar el acaparamiento infinito, el juego implementa un sistema de **Umbral de Drenaje**:
- **Acero**:
    - Generación pasiva: `0.8` por segundo.
    - Umbral de drenaje: `60`.
    - Tasa de drenaje: `0.1` por segundo si supera el umbral.
- **Táctica**:
    - Generación pasiva: `0.2` por segundo (solo durante combate).
    - Umbral de drenaje: `50`.
    - Tasa de drenaje: `0.1` por segundo si supera el umbral.

### 2.3 Inflación y Reembolsos
- **Inflación de Construcción**: `3%` por oleada.
- **Inflación de Mejoras**: `3%` por oleada.
- **Inflación de Sobrecarga (Acero)**: `0.2%` por oleada.
- **Tasa de Reembolso**: `75%` del valor invertido al vender una torre.

---

## 3. Unidades Defensivas (Torres)
Cada torre tiene un rol específico y un límite de despliegue para fomentar la diversidad.

### 3.1 Tipos de Torres
1.  **Colmillo Ligero (Básica)**: Defensa rápida y barata. (Límite: 8)
2.  **Mirada del Lobo (Francotirador)**: Gran alcance, daño crítico y ralentización. (Límite: 4)
3.  **Rugido de Acero (Splash/Fuego)**: Daño de área y quemaduras. (Límite: 2)
4.  **Santuario de Vida (Sanadora)**: Repara torres aliadas cercanas. (Límite: 3)

### 3.2 Sistema de Vínculos y Sobrecarga de Acero
- **Activación Manual**: Los vínculos (líneas de energía y bonos de sinergia) **solo se activan** si al menos dos torres del mismo tipo tienen activa la **Sobrecarga de Acero**.
- **Vínculos Múltiples**: Las torres potenciadas se enlazan con todas las demás torres potenciadas de su mismo tipo dentro de un rango de `1.2x` su alcance base.
- **Sobrecarga de Acero (Tecla C)**: Activa el estado potenciado de la torre durante 15 segundos.
- **Habilidades de Vínculo (Ataque Conjunto)**: Requiere que **ambas** torres del vínculo estén bajo los efectos de la Sobrecarga.
    - **Nexo de Energía**: Se crea un nodo en el punto medio del vínculo que ataca cada `45-60` frames.
    - **Colmillo**: Descarga cinética directa (40% de daño extra).
    - **Mirada**: Pulso de ceguera (incapacita al enemigo por 4s).
    - **Rugido**: Estallido incinerante (quemadura masiva).
    - **Santuario**: Nova de restauración (sana a todas las torres en área).

### 3.3 Progresión
- **Veteranía**: Las torres ganan estrellas (hasta 5) por cada 7 bajas, aumentando su daño un `5%` por estrella.
- **Mejoras Manuales (E)**: Aumentan permanentemente el Daño (+5%), Vida (+35), Rango (+15%) y Cadencia (+15%).

---

## 4. Enemigos (La Plaga del Vacío)
Los enemigos escalan en salud (`+5` por oleada) y velocidad (`+0.04` por oleada).

### 4.1 Tipos de Enemigos
- **Errante del Vacío**: Unidad básica, HP moderado.
- **Sacerdote de Sombras**: Nigromante que invoca sombras. Gran HP.
- **Bestia de Carga**: Rápido y furioso (Berserker).
- **Caballero Gélido**: Resistente y con aura de frío.
- **Espectro Corrupto**: Crea clones/espejismos.

---

## 5. Mecánicas de Combate y Estado
### 5.1 Optimización
- **Particionamiento Espacial**: El mapa se divide en una rejilla de `100x100` para optimizar la detección de enemigos cercanos ($O(1)$ en lugar de $O(n)$).

### 5.2 Estados del Juego
- **Intro**: Pantalla de inicio.
- **Playing**: Combate activo.
- **Paused**: Pausa táctica (Cuesta 1 de Táctica activar/mantener).
- **Gameover**: Derrota por caída de la ciudadela o falta de recursos.

### 5.3 Controles (Keybinds)
- **A, S, D, F**: Construir torres.
- **R**: Reparar (Cuesta Táctica, restaura 25% HP).
- **C**: Sobrecarga de Acero (Activa vínculos).
- **E**: Mejorar torre.
- **T**: Vender torre.
- **Espacio**: Iniciar/Siguiente Oleada.

---

## 6. Eventos y Peligros
- **Meteoritos**: Dañan torres (`20`) y la ciudadela (`10`).
- **Marcas de la Plaga (Runas)**: Aparecen en el camino y potenciarán a los enemigos que las alcancen.
- **Maldiciones**: Eventos aleatorios durante la oleada que alteran las reglas del juego.

---
