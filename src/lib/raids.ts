// src/lib/raids.ts
// Dinámico: Los nombres de las raids se extraen de roster.json (leaderData)

export const raidDays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

export const raidTimes = ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00'];

/**
 * Obtiene el nombre legible de una raid a partir de su ID
 */
export function getRaidName(raidId: string | number): string {
  if (!raidId) return 'Raid Desconocida';
  
  // Si es un string y no parece un ID numérico, probablemente ya es el nombre
  if (typeof raidId === 'string' && isNaN(Number(raidId))) {
    return raidId;
  }

  // Mapa de IDs conocidos a nombres (por si acaso se usan IDs numéricos en el futuro)
  const raidNames: Record<string, string> = {
    '1': 'ICC 10',
    '2': 'ICC 25',
    '3': 'RS 10',
    '4': 'RS 25',
    '5': 'TOC 10',
    '6': 'TOC 25',
  };

  return raidNames[raidId.toString()] || `Raid ${raidId}`;
}

/**
 * Normaliza el nombre de una raid para agrupar variantes similares
 * Ej: "ICC 25N", "ICC25N", "ICC 25HC" -> "ICC 25"
 */
export function normalizeRaidName(name: string): string {
  if (!name) return 'Otras';
  
  // Normalizar a mayúsculas y quitar espacios extras para la comparación
  const upperName = name.toUpperCase().trim().replace(/\s+/g, ' ');
  const compactName = upperName.replace(/\s+/g, '');
  
  // ICC
  if (compactName.includes('ICC')) {
    if (compactName.includes('10')) return 'ICC 10';
    if (compactName.includes('25')) return 'ICC 25';
    return 'ICC';
  }
  
  // RS / SAGRARIO
  if (compactName.includes('RS') || compactName.includes('SAGRARIO') || compactName.includes('RUBY')) {
    if (compactName.includes('10')) return 'RS 10';
    if (compactName.includes('25')) return 'RS 25';
    return 'RS';
  }
  
  // TOC
  if (compactName.includes('TOC') || compactName.includes('PRUEBA') || compactName.includes('CRUZADO')) {
    if (compactName.includes('10')) return 'TOC 10';
    if (compactName.includes('25')) return 'TOC 25';
    return 'TOC';
  }

  // ULDUAR
  if (compactName.includes('ULDUAR') || compactName.includes('ULD')) {
    if (compactName.includes('10')) return 'Ulduar 10';
    if (compactName.includes('25')) return 'Ulduar 25';
    return 'Ulduar';
  }

  // Si no coincide con patrones comunes, normalizamos el texto (mayúsculas y espacios)
  // para que "ICC10H abas" y "ICC10H Abas" sean iguales
  return upperName;
}
