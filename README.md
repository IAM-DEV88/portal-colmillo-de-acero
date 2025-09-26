# Dominion Guild Portal

Portal web para la hermandad Dominion Guild de World of Warcraft.

## 🚀 Características

- **Diseño Moderno**: Interfaz atractiva y responsiva
- **Navegación Intuitiva**: Fácil acceso a todas las secciones
- **Animaciones Suaves**: Efectos visuales atractivos con AOS (Animate On Scroll)
- **Temas Oscuro**: Diseño con modo oscuro para una mejor experiencia visual
- **Optimizado para Móviles**: Se adapta perfectamente a cualquier dispositivo

## 🛠️ Tecnologías Utilizadas

- [Astro](https://astro.build/) - El framework web todo en uno
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS utilitario
- [TypeScript](https://www.typescriptlang.org/) - JavaScript tipado
- [AOS](https://michalsnik.github.io/aos/) - Biblioteca de animaciones al hacer scroll

## 🚀 Cómo Empezar

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/dominion-guild-portal.git
   cd dominion-guild-portal
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:4321`

4. **Construir para producción**
   ```bash
   npm run build
   ```
   Los archivos de producción se generarán en el directorio `dist/`

## 📁 Estructura del Proyecto

```
/
├── public/              # Archivos estáticos (imágenes, fuentes, etc.)
├── src/
│   ├── components/     # Componentes reutilizables
│   │   └── layout/     # Componentes de diseño (header, footer, etc.)
│   ├── pages/          # Páginas de la aplicación
│   └── styles/         # Estilos globales
├── .gitignore
├── astro.config.mjs    # Configuración de Astro
├── package.json
├── README.md
└── tsconfig.json      # Configuración de TypeScript
```

## 🎨 Personalización

### Colores

La paleta de colores principal se puede personalizar en el archivo `src/styles/global.css`:

```css
:root {
  --color-primary: #7c3aed;
  --color-secondary: #4f46e5;
  --color-accent: #8b5cf6;
  --color-dark: #0f0f1a;
  --color-light: #f8fafc;
}
```

### Fuentes

El proyecto utiliza la fuente Montserrat de Google Fonts. Para cambiarla, modifica el enlace en `src/components/layout/Layout.astro`.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.
