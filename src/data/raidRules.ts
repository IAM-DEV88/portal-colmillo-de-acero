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
  "Armas 2.6 pueden ser loteadas por tanques.",
  "Todos los TOP son cerrados.",
  "Si en algún top no necesitan el ítem o no cumplen la regla para lotear, pasará al siguiente en el top.",
  "Se rollea 20 min antes del ligado. Al dar Raid Off en orden de obtención.",
  "Puntualidad, consumibles, encantamientos y gemas al día.",
  "Mala mecánica -10 en dados.",
  "AFK/OFF/PVP o no respetar pull/mecánicas = Sin botín/Expulsión.",
  "DPS/Healer/Tank con bajo rendimiento = Sin botín/Expulsión.",
  "No Discord/Desconexión = Sin botín/Expulsión.",
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
      "Un ítem y una marca por main (excepto tanques), sin limite por dual.",
  "Arma y sostener cuentan como ítem (Solo exentas armas de LK).",
  "Reservados: Sangres, Fragmentos, Items no ligados y Saros no se lotean.",
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
      { item: "ESCAMA AFILADA (MELE)", requirement: "War, DK, Feral, Pícaro, Mejora y Paladín con Agonía (Top 3 Fase Crepuscular y Top 3 Fase Físico), Caza Puntería (Top 3 Fase Físico)." },
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
  "Sin frascos -20 en dados.",
      "Un ítem y una marca por main (excepto tanques), sin limite por dual.",
  "Arma y sostener cuentan como ítem (Solo exentas armas de LK).",
  "Reservados: Sangres, Fragmentos, Items no ligados y Saros no se lotean.",
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
  },
  {
    raidId: "GUILD",
    title: "Hermandad",
    specificRules: [],
  }
];

export const BOE_PRICES = [
  { item: "Gargantilla carmesí de la Reina de Sangre", price: "15000g" },
  { item: "Escarpines de Muerte inminente", price: "5000g" },
  { item: "Exterminadora de pesadillas", price: "4000g" },
  { item: "Brazales frágiles de la Dama", price: "3600g" },
  { item: "Ojo gélido de Tuétano", price: "3600g" },
  { item: "Sandalias de Consagración", price: "3100g" },
  { item: "Hombreras de placas de behemoth enfurecido", price: "3000g" },
  { item: "Saco de maravillas de Ikfirus", price: "2100g" },
  { item: "Collar de la suerte de Woodin", price: "2100g" },
  { item: "Yelmo de acero de titanes templado", price: "1800g" },
  { item: "Caparazón de reyes olvidados", price: "1200g" },
  { item: "Anillo de tendones podridos", price: "1100g" },
  { item: "Bolsa glacial", price: "800g" },
  { item: "Armadura de pierna de escama de hielo", price: "800g" },
  { item: "Hombreras de cadáver tieso", price: "800g" },
  { item: "Campana de Je'Tze", price: "700g" },
  { item: "Guardapolvo ensangrentado del profesor", price: "600g" },
  { item: "Hilo de hechizo luminoso", price: "500g" },
  { item: "Sortija de hueso de presagista", price: "400g" },
  { item: "Brazales del guardián de la cripta", price: "300g" },
  { item: "Cinturón de nova de sangre", price: "290g" },
  { item: "Rifle de balas de plata de Rowan", price: "190g" },
  { item: "Bufas de solidaridad de Wapach", price: "160g" },
  { item: "Aguijón supernumerario de Namlak", price: "130g" },
  { item: "Leotardos de talismanes dudosos", price: "130g" },
  { item: "Sello de Edward el Extraño", price: "90g" },
  { item: "Bolsa de tejido de Escarcha", price: "70g" },
  { item: "Cinturón del noble solitario", price: "70g" },
];

export const FARM_PRICES = [
  { item: "Pelaje ártico", price: "5800g", unit: "Stack" },
  { item: "Tejido de hechizos", price: "1800g", unit: "Stack" },
  { item: "Dragontina helada", price: "1800g", unit: "Stack" },
  { item: "Gema Epica", price: "1800g", unit: "Stack" },
  { item: "Cristal abisal", price: "1500g", unit: "Stack" },
  { item: "Loto de escarcha", price: "1400g", unit: "Stack" },
  { item: "Fragmento onírico", price: "1400g", unit: "Stack" },
  { item: "Vida, Sombra, Aire, Fuego, Orbe Congelado", price: "1300g", unit: "Stack" },
  { item: "Calcedonia", price: "700g", unit: "Stack" },
  { item: "Cardopresto", price: "600g", unit: "Stack" },
  { item: "Seda de araña tejehielo", price: "400g", unit: "Stack" },
  { item: "Mena de titanio", price: "200g", unit: "Stack" },
  { item: "Flor exánime", price: "200g", unit: "Stack" },
];

export const GUILD_RULES = [
  {
    title: "Código de Nota",
    rules: [
      "WISP función y gear score al General Admin u Oficial en línea para subir de rango.",
      "Así garantizan su participación en raids, ruletas y sorteos."
    ]
  },
  {
    title: "Baúl de Sorteos",
    rules: [
      "Se realizan sorteos aleatorios para recompensar a los jugadores en línea.",
      "Se reciben donaciones para mantener el baúl funcionando."
    ]
  },
  {
    title: "Farm lvl 74+",
    rules: [
      "Materiales e items lvl 74+ como orbes congelados, fragmento onírico, consumibles, etc.",
      "Se reciben donaciones para mantener el baúl funcionando."
    ]
  },
  {
    title: "Reconocimientos",
    rules: [
      "Los jugadores que contribuyen activamente al flujo de la hermandad son reconocidos mensualmente.",
      "Se anima a todos los miembros a liderar actividades y eventos."
    ]
  },
  {
    title: "Baúl de Equipamiento",
    rules: [
      "Acceso instantáneo a los elementos del baúl de equipamiento.",
      "Solicitar al GM en el servidor de Discord kMK2ZRRCza."
    ]
  },
  {
    title: "Respeto",
    rules: [
      "Respeto y cooperación entre todos los miembros.",
      "No se tolerará el racismo, discriminación o acoso de ningún tipo.",
      "Mantener un ambiente sano y de respeto mutuo."
    ]
  }
];
