// WotLK Raid Configuration
// This file contains the raid definitions used across the application

export interface Raid {
  id: number;
  name: string;
  image: string;
  description: string;
  minGearScore: number;
  rules?: string; // Nuevo campo para las reglas de la raid
}

export const wotlkRaids: Raid[] = [
  {
    id: 1,
    name: 'TOC 10N FARM',
    image: '/images/raids/tocfarm.jpg',
    description:
      'Se ponen a prueba el conocimiento de mecanicas de grupo y habilidad para el combate.',
    minGearScore: 4800,
    rules: 'PRIORIDAD DE LOTEO: Por función MAIN > DUAL.',
  },
  {
    id: 2,
    name: 'ICC 10N FARM',
    image: '/images/raids/iccfarm.jpg',
    description:
      'Se ponen a prueba el conocimiento de mecanicas de grupo y habilidad para el combate.',
    minGearScore: 5000,
    rules: '',
  },
  {
    id: 3,
    name: 'ICC 25N FARM',
    image: '/images/raids/iccfarm.jpg',
    description:
      'Se ponen a prueba el conocimiento de mecanicas de grupo y habilidad para el combate.',
    minGearScore: 5400,
    rules: `PRIORIDAD DE LOTEO: Por función MAIN > DUAL.
MARCAS: Debe linkear 1 t10 engemado/encantado.
ABACO: top3 cerrado en Reina.
TESTAMENTO: top5 daño en Panza cerrado + 5% en bestias. Rollean warrior fury, dk profano/escarcha, pícaro combate y druida feral, hunter punteria, mejora. Bajo rendimiento/Inactivo = NoLoot.
OBJETO: top5 cerrado daño en Panza + 3% en bestias.
TARRO: top5 daño en Panza cerrado + 5% en bestias, rollea paladín retry, pícaro asesinato, mejora.
OBJETO: top5 cerrado daño en Panza + 3% en bestias.
FILACTERIA: top3 cerrado daño en Profe + 10% en mocos.
COLMILLO: prioridad tanques activos en su rol, luego el resto.
RESERVADOS: Fragmentos, Items no ligados y Saros.
ARMAS LK: top10 daño en LK + 5% en Valkyrs y top3 conteo de sanacion en LK.
Un abalorio, Un arma, Dos marcas por raid.
Un ítem por main (excepto tanques), sin limite por dual. Marcas tambien por dual.
Arma y sostener cuentan como ítem. Solo excentas armas de Lk.
Armas 2.6 pueden ser loteadas por tanques.
Si en algun top no necesitan el ítem o no cumplen la regla para lotear, pasará al siguiente en top.`,
  },
  {
    id: 4,
    name: 'ICC 10N POR LK',
    image: '/images/raids/icclk.jpg',
    description: 'Jugadores con experiencia que buscan el logro de ICC10N.',
    minGearScore: 5600,
    rules: 'PRIORIDAD DE LOTEO: Por función MAIN > DUAL.',
  },
  {
    id: 5,
    name: 'SAGRARIO RUBY',
    image: '/images/raids/sr.jpg',
    description: 'Jugadores con experiencia que buscan el logro de SR.',
    minGearScore: 5800,
    rules: '',
  },
  {
    id: 6,
    name: 'ICC 25N POR LK',
    image: '/images/raids/icclk.jpg',
    description: 'Jugadores con experiencia que buscan el logro de ICC25N.',
    minGearScore: 5800,
    rules: `PRIORIDAD DE LOTEO: Por función MAIN > DUAL.
MARCAS: Debe linkear 1 t10 engemado/encantado.
ABACO: top3 cerrado en Reina.
TESTAMENTO: top5 daño en Panza cerrado + 5% en bestias. Rollean warrior fury, dk profano/escarcha, pícaro combate y druida feral, hunter punteria, mejora. Bajo rendimiento/Inactivo = NoLoot.
OBJETO: top5 cerrado daño en Panza + 3% en bestias.
TARRO: top5 daño en Panza cerrado + 5% en bestias, rollea paladín retry, pícaro asesinato, mejora.
OBJETO: top5 cerrado daño en Panza + 3% en bestias.
FILACTERIA: top3 cerrado daño en Profe + 10% en mocos.
COLMILLO: prioridad tanques activos en su rol, luego el resto.
RESERVADOS: Fragmentos, Items no ligados y Saros.
ARMAS LK: top10 daño en LK + 5% en Valkyrs y top3 conteo de sanacion en LK.
Un abalorio, Un arma, Dos marcas por raid.
Un ítem por main (excepto tanques), sin limite por dual. Marcas tambien por dual.
Arma y sostener cuentan como ítem. Solo excentas armas de Lk.
Armas 2.6 pueden ser loteadas por tanques.
Si en algun top no necesitan el ítem o no cumplen la regla para lotear, pasará al siguiente en top.`,
  },
  {
    id: 7,
    name: 'ICC 10H FARM',
    image: '/images/raids/iccfarm.jpg',
    description:
      'Se ponen a prueba el conocimiento de mecanicas de grupo y habilidad para el combate.',
    minGearScore: 5900,
    rules: `PRIORIDAD DE LOTEO: Por función MAIN > DUAL.
MARCAS: Debe linkear 1 t10 engemado/encantado.`,
  },
  {
    id: 8,
    name: 'ICC 25H FARM',
    image: '/images/raids/iccfarm.jpg',
    description:
      'Se ponen a prueba el conocimiento de mecanicas de grupo y habilidad para el combate.',
    minGearScore: 6000,
    rules: '',
  },
];
