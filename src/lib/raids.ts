// src/lib/raids.ts
export function getRaidName(id: number): string {
  const raids: { [key: number]: string } = {
    1: 'TOC 10N FARM',
    2: 'ICC 10N FARM',
    3: 'ICC 25N FARM',
    4: 'ICC 10N POR LK',
    5: 'SAGRARIO RUBY',
    6: 'ICC 25N POR LK',
    7: 'ICC 10H FARM',
    8: 'ICC 25H FARM'
  };
  return raids[id] || `Raid ${id}`;
}

export const raidDays = [
  'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'
];

export const raidTimes = [
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00'
];
