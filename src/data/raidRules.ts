export interface RaidRule {
  raidId: string;
  alias?: string[];
  title: string;
  specificRules: string[];
  lootRules?: {
    item: string;
    requirement: string;
    classes?: string[];
  }[];
}

export const GENERAL_RULES = [
  "PRIORIDAD DE LOTEO: MAIN > DUAL.",
  "Un ítem y una marca por main (excepto tanques), sin limite por dual.",
  "Arma y sostener cuentan como ítem (Solo exentas armas de LK).",
  "Armas 2.6 pueden ser loteadas por tanques.",
  "Todos los TOP son cerrados.",
  "Si en algún top no necesitan el ítem o no cumplen la regla para lotear, pasará al siguiente en el top.",
  "Reservados: Sangres, Fragmentos, Items no ligados y Saros no se lotean.",
  "Mala mecánica -10 en dados.",
  "Sin frascos durante heroica -20 en dados.",
];

export const RAID_RULES: RaidRule[] = [
  {
    raidId: "ICC10H",
    alias: ["ICC10H ABAS"],
    title: "ICC 10 H",
    specificRules: [
    ],
    lootRules: [
       { item: "MARCAS", requirement: "Debe linkear 1 T10 engemado/encantado." }
    ]
  },
  {
    raidId: "ICC25N",
    alias: ["ICC25N POR LK"],
    title: "ICC 25 N",
    specificRules: [
    ],
    lootRules: [
        { item: "MARCAS", requirement: "Debe linkear 1 T10 engemado/encantado." },
        { item: "ABACO", requirement: "Top 3 cerrado en Reina." },
      { item: "TESTAMENTO", requirement: "Top 5 daño en Panza cerrado + 5% en bestias", classes: ["Warrior Fury", "DK Profano/Escarcha", "Pícaro Combate", "Druida Feral", "Hunter Puntería", "Mejora"] },
      { item: "COLMILLO", requirement: "Prioridad tanques activos en su rol, luego el resto." },
      { item: "OBJETO", requirement: "Top 5 cerrado daño en Panza + 3% en bestias" },
      { item: "TARRO", requirement: "Top 5 daño en Panza cerrado + 5% en bestias", classes: ["Paladín Retry", "Pícaro Asesinato", "Mejora"] },
      { item: "FILACTERIA", requirement: "Top 3 cerrado daño en Profe + 10% en mocos" },
      { item: "ARMAS LK", requirement: "Top 10 daño en LK + 5% en Valkyrs y Top 3 conteo de sanación en LK" }
    ]
  },
  {
    raidId: "SR25N",
    title: "SR 25 N",
    specificRules: [
    ],
    lootRules: [
      { item: "ESCAMA RESPLANDECIENTE (HEAL)", requirement: "Top 1 Afuera / Top 2 Adentro." },
      { item: "ESCAMA CARBONIZADA (CASTER)", requirement: "Top 3 Afuera / Top 4 Auras (Elemental, Pollo, Demo)." },
      { item: "ESCAMA AFILADA (MELE)", requirement: "War, DK, Feral, Caza Puntería, Pícaro, Mejora y Paladín con Agonía (Top 3 Fase Crepuscular y Top 3 Fase Físico)." },
      { item: "ESCAMA PETRIFICADA (TANK)", requirement: "Los 2 Tanques activos en su rol." },

      { item: "SELLO DE CREPÚSCULO", requirement: "Paladín Repre, Mejora, Pícaro Asesinato" },
      { item: "COLGANTE LOBREGUEZ", requirement: "War y DK" },
      { item: "PASOS VATICINIO", requirement: "Paladín Healer" },
      { item: "BOTINES RESURRECCIÓN", requirement: "Todos los Tanques" },
      { item: "AVANZADO DEL APOCALIPSIS", requirement: "Paladín Repre, DK Profano/Escarcha (con armas LK 25H) y War con Agonía" },
      { item: "CINTURÓN FORMA PARTIDA", requirement: "Chamanes" },
      { item: "BANDAS AGRAVIADAS", requirement: "Paladín Repre and Pícaro Asesinato" },
      { item: "BRAZALES CAMBIO FASE", requirement: "Druida Pollo and Healer" },
      { item: "BRAZALES NOCHE IGNEA", requirement: "Brujo, Mago, Sacer Shadow" },
      { item: "CAPA OCASO ARDIENTE", requirement: "Paladín Healer, Chamán Healer/Elemental, Sacer, Mago, Brujo, Pollo" }
    ]
  },
  {
    raidId: "TOC25N",
    title: "TOC 25 N",
    specificRules: [
    ],
    lootRules: [
      { item: "CALACA", requirement: "Top 5 en Gemelas Valkyries." },
      { item: "REINO", requirement: "Top 5 en Gemelas Valkyries." },
      { item: "HEAL", requirement: "Top 3 en Valkyrias." },
    ]
  },
  {
    raidId: "ICC25H",
    title: "ICC 25 H",
    specificRules: [
    ],
    lootRules: [
        { item: "ABACO", requirement: "Todos los Healers." },
      { item: "TESTAMENTO", requirement: "Top 5 en Panza + 7% adds en Libramorte." },
      { item: "OBJETO", requirement: "Top 5 en Panza + 5% adds en Libramorte." },
      { item: "TARRO", requirement: "Top 5 en Panza + 5% adds en Libramorte." },
      { item: "FILACTERIA", requirement: "Top 3 en Profe + 14% en Mocos." },

      { item: "REQUISITOS MARCAS H (MELES)", requirement: "15K en Panza" },
      { item: "REQUISITOS MARCAS H (CASTERS)", requirement: "12K en Profe (Sino cae Profe, 15K en Panza)" },
      { item: "REQUISITOS MARCAS H (HEALERS)", requirement: "Top 3 en Reina" },
      { item: "ESPECIALES (Demo/Pollo/Ele)", requirement: "11K Profe (Sino cae Profe, 14K en Panza)" },
      { item: "EQUIPO MARCAS H", requirement: "Tener 4/5 partes santificadas (Paladín Healer/Tank y Pícaro 2/5 partes)" }
    ]
  },
  {
    raidId: "ICC10N",
    alias: ["ICC 10N POR LK"],
    title: "ICC 10 N",
    specificRules: [
    ]
  }
];
