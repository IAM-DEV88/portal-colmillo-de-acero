export interface Guide {
  id: string;
  title: string;
  category: "Mecánicas" | "Especialización" | "Profesiones" | "Leveo";
  description: string;
  href: string;
  icon: string;
  color: string;
  specData?: any; // For class guides that use WoWCharacterPanel
}

export const categories = ["Mecánicas", "Especialización", "Profesiones", "Leveo"] as const;

export const colorClasses: Record<string, any> = {
  blue: {
    border: "border-blue-900/30",
    hoverBorder: "hover:border-blue-800/50",
    shadow: "hover:shadow-blue-500/5",
    iconBg: "bg-blue-500/10",
    iconBorder: "border-blue-500/20",
    iconText: "text-blue-400",
    btnBg: "bg-blue-500/10",
    btnText: "text-blue-400",
    btnHoverBg: "group-hover:bg-blue-500"
  },
  red: {
    border: "border-red-900/30",
    hoverBorder: "hover:border-red-800/50",
    shadow: "hover:shadow-red-500/5",
    iconBg: "bg-red-500/10",
    iconBorder: "border-red-500/20",
    iconText: "text-red-400",
    btnBg: "bg-red-500/10",
    btnText: "text-red-400",
    btnHoverBg: "group-hover:bg-red-500"
  },
  purple: {
    border: "border-purple-900/30",
    hoverBorder: "hover:border-purple-800/50",
    shadow: "hover:shadow-purple-500/5",
    iconBg: "bg-purple-500/10",
    iconBorder: "border-purple-500/20",
    iconText: "text-purple-400",
    btnBg: "bg-purple-500/10",
    btnText: "text-purple-400",
    btnHoverBg: "group-hover:bg-purple-500"
  },
  amber: {
    border: "border-amber-900/30",
    hoverBorder: "hover:border-amber-800/50",
    shadow: "hover:shadow-amber-500/5",
    iconBg: "bg-amber-500/10",
    iconBorder: "border-amber-500/20",
    iconText: "text-amber-400",
    btnBg: "bg-amber-500/10",
    btnText: "text-amber-400",
    btnHoverBg: "group-hover:bg-amber-500"
  },
  pink: {
    border: "border-pink-900/30",
    hoverBorder: "hover:border-pink-800/50",
    shadow: "hover:shadow-pink-500/5",
    iconBg: "bg-pink-500/10",
    iconBorder: "border-pink-500/20",
    iconText: "text-pink-400",
    btnBg: "bg-pink-500/10",
    btnText: "text-pink-400",
    btnHoverBg: "group-hover:bg-pink-500"
  },
  orange: {
    border: "border-orange-900/30",
    hoverBorder: "hover:border-orange-800/50",
    shadow: "hover:shadow-orange-500/5",
    iconBg: "bg-orange-500/10",
    iconBorder: "border-orange-500/20",
    iconText: "text-orange-400",
    btnBg: "bg-orange-500/10",
    btnText: "text-orange-400",
    btnHoverBg: "group-hover:bg-orange-500"
  },
  yellow: {
    border: "border-yellow-900/30",
    hoverBorder: "hover:border-yellow-800/50",
    shadow: "hover:shadow-yellow-500/5",
    iconBg: "bg-yellow-500/10",
    iconBorder: "border-yellow-500/20",
    iconText: "text-yellow-400",
    btnBg: "bg-yellow-500/10",
    btnText: "text-yellow-400",
    btnHoverBg: "group-hover:bg-yellow-500"
  },
  warrior: {
    border: "border-orange-900/30",
    hoverBorder: "hover:border-orange-800/50",
    shadow: "hover:shadow-orange-500/5",
    iconBg: "bg-orange-500/10",
    iconBorder: "border-orange-500/20",
    iconText: "text-orange-400",
    btnBg: "bg-orange-500/10",
    btnText: "text-orange-400",
    btnHoverBg: "group-hover:bg-orange-500"
  }
};

export const staticGuides: Guide[] = [
  {
    id: "icc-heroico",
    title: "ICC 25 Heroico - Mecánicas",
    category: "Mecánicas",
    description: "Guía completa de las mecánicas de ICC 25 Heroico con navegación por tiempo",
    href: "/guides/icc-heroico",
    icon: "fa-skull",
    color: "blue"
  },
  {
    id: "halion-rs",
    title: "Halion - Sagrario Rubí",
    category: "Mecánicas",
    description: "Colección de guías visuales y estrategias para el encuentro de Halion 25H/N",
    href: "/guides/halion-rs",
    icon: "fa-dragon",
    color: "red"
  },
  {
    id: "toc",
    title: "Prueba del Cruzado (ToC)",
    category: "Mecánicas",
    description: "Guía completa de todos los encuentros de ToC 25H/N",
    href: "/guides/toc",
    icon: "fa-shield-alt",
    color: "purple"
  },
  {
    id: "nota-publica",
    title: "Guía de Nota Pública",
    category: "Leveo",
    description: "Aprende a configurar tu nota pública para participar en el sistema de raids",
    href: "/guides/nota-publica",
    icon: "fa-file-alt",
    color: "amber"
  },
  {
    id: "paladin-retribucion-335a",
    title: "Paladín Retribución 3.3.5a",
    category: "Especialización",
    description: "Guía del Paladín Retribución para WotLK. Equipo BIS, gemas, encantamientos y rotación para ICC 25 Heroico.",
    href: "/guides/paladin-retribucion-335a",
    icon: "fa-hammer",
    color: "pink"
  },
  {
    id: "paladin-proteccion-335a",
    title: "Paladín Protección 3.3.5a",
    category: "Especialización",
    description: "Guía del Paladín Tanque para WotLK. Equipo BIS, cap de defensa, gemas, encantamientos y rotación 96969.",
    href: "/guides/paladin-proteccion-335a",
    icon: "fa-shield-alt",
    color: "pink"
  },
  {
    id: "druida-restauracion-335a",
    title: "Druida Restauración 3.3.5a",
    category: "Especialización",
    description: "Guía del Druida Healer. Equipo BIS, caps de celeridad, gemas y rotación de HoTs.",
    href: "/guides/druida-restauracion-335a",
    icon: "fa-leaf",
    color: "orange"
  },
  {
    id: "druida-equilibrio-335a",
    title: "Druida Equilibrio 3.3.5a",
    category: "Especialización",
    description: "Guía del Druida Cásterr (Pollo). Equipo BIS, caps de celeridad y rotación de Eclipses.",
    href: "/guides/druida-equilibrio-335a",
    icon: "fa-moon",
    color: "orange"
  },
  {
    id: "brujo-afliccion-335a",
    title: "Brujo Aflicción 3.3.5a",
    category: "Especialización",
    description: "Guía del Brujo Aflicción. Equipo BIS, caps de celeridad y rotación de DoTs.",
    href: "/guides/brujo-afliccion-335a",
    icon: "fa-ghost",
    color: "purple"
  },
  {
    id: "brujo-demonologia-335a",
    title: "Brujo Demonología 3.3.5a",
    category: "Especialización",
    description: "Guía del Brujo Buff (Demo). Equipo BIS, gemas de SP y rotación de Metamorfosis.",
    href: "/guides/brujo-demonologia-335a",
    icon: "fa-fire-alt",
    color: "purple"
  },
  {
    id: "guerrero-furia-335a",
    title: "Guerrero Furia 3.3.5a",
    category: "Especialización",
    description: "Guía del Guerrero Furia. Equipo BIS, cap de ArP (100%) y rotación explosiva.",
    href: "/guides/guerrero-furia-335a",
    icon: "fa-fire",
    color: "warrior"
  },
  {
    id: "guerrero-proteccion-335a",
    title: "Guerrero Protección 3.3.5a",
    category: "Especialización",
    description: "Guía del Guerrero Tanque. Equipo BIS, cap de defensa y rotación de mitigación.",
    href: "/guides/guerrero-proteccion-335a",
    icon: "fa-shield-alt",
    color: "warrior"
  },
  {
    id: "chaman-restauracion-335a",
    title: "Chamán Restauración 3.3.5a",
    category: "Especialización",
    description: "Guía del Chamán Healer. Equipo BIS, cap de celeridad y sanación de banda.",
    href: "/guides/chaman-restauracion-335a",
    icon: "fa-water",
    color: "blue"
  },
  {
    id: "chaman-mejora-335a",
    title: "Chamán Mejora 3.3.5a",
    category: "Especialización",
    description: "Guía del Chamán Melé. Equipo BIS, cap de celeridad y rotación de Vorágine.",
    href: "/guides/chaman-mejora-335a",
    icon: "fa-bolt",
    color: "blue"
  },
  {
    id: "picaro-combate-335a",
    title: "Pícaro Combate 3.3.5a",
    category: "Especialización",
    description: "Guía del Pícaro Combate. Equipo BIS, cap de ArP (100%) y rotación de remates.",
    href: "/guides/picaro-combate-335a",
    icon: "fa-khanda",
    color: "yellow"
  }
];
