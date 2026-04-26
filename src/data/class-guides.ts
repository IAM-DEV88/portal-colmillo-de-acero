export interface ClassGuideData {
  specName: string;
  className: string;
  classColor: string;
  iconUrl: string;
  stats: { label: string; value: string; detail: string }[];
  bisItems: { slot: string; name: string; source: string; quality: 'epic' | 'legendary'; id?: number; icon?: string }[];
  gems: { type: string; name: string; stat: string; id?: number; icon?: string }[];
  enchants: { slot: string; name: string; stat: string; id?: number; icon?: string }[];
  rotation: { name: string; description: string; priority: number }[];
}

export const classGuidesData: Record<string, ClassGuideData> = {
  "brujo-afliccion-335a": {
    specName: "Aflicción",
    className: "Brujo",
    classColor: "purple",
    iconUrl: "https://wotlk.ultimowow.com/static/images/wow/icons/large/spell_shadow_deathcoil.jpg",
    stats: [
      { label: "Índice de Golpe (Hit)", value: "11% (289 pts)", detail: "Con el talento 'Supresión' (3/3), necesitas un 11% para alcanzar el cap de hechizos contra jefes (17%)." },
      { label: "Celeridad (Haste)", value: "1100 - 1300", detail: "Tu estadística secundaria más importante. Aumenta la velocidad de tus DoTs y reduce el tiempo de casteo de tus hechizos principales." },
      { label: "Crítico", value: "Media", detail: "Útil para 'Ocaso' y daños explosivos ocasionales, pero escala menos que la Celeridad para Aflicción." },
      { label: "Poder con Hechizos (SP)", value: "Máximo posible", detail: "Escala masivamente con tus DoTs. Nunca es suficiente SP para un Brujo Aflicción." }
    ],
    bisItems: [
      { slot: "Cabeza", name: "Caperuza del Aquelarre oscuro santificada", source: "Set T10", quality: "epic", id: 51242, icon: "inv_helmet_152" },
      { slot: "Cuello", name: "Amuleto de la elegía silenciosa", source: "ICC 25H - Batalla Aerea", quality: "epic", id: 50658, icon: "inv_jewelry_necklace_43" },
      { slot: "Hombros", name: "Hombreras del Aquelarre oscuro santificadas", source: "Set T10", quality: "epic", id: 51244, icon: "inv_shoulder_120" },
      { slot: "Espalda", name: "Capa de ocaso ardiente", source: "Halion 25H", quality: "epic", id: 50628, icon: "item_icecrowncloakb" },
      { slot: "Pecho", name: "Toga del Aquelarre oscuro santificada", source: "Set T10", quality: "epic", id: 51240, icon: "inv_chest_cloth_52" },
      { slot: "Muñeca", name: "Brazales de noche ígnea", source: "Halion 25H", quality: "epic", id: 50601, icon: "inv_bracer_37" },
      { slot: "Manos", name: "Guantes del Aquelarre oscuro santificados", source: "Set T10", quality: "epic", id: 51241, icon: "inv_gauntlets_82" },
      { slot: "Cintura", name: "Cinturón de geliespectro aplastante", source: "ICC 25H - Lord Tuétano", quality: "epic", id: 50706, icon: "inv_belt_61" },
      { slot: "Piernas", name: "Pantalones manchados del Pesteador", source: "ICC 25H - Panzachancro", quality: "epic", id: 51243, icon: "inv_pants_cloth_33" },
      { slot: "Pies", name: "Botas de científico de la Peste", source: "ICC 25H - Panzachancro", quality: "epic", id: 50664, icon: "inv_boots_cloth_24" },
      { slot: "Anillo 1", name: "Sortija Cinérea de destrucción infinita", source: "Reputación Veredicto Cinéreo", quality: "epic", id: 50398, icon: "inv_jewelry_ring_84" },
      { slot: "Anillo 2", name: "Bucle del Gran Traidor", source: "ICC 25H - Tuétano", quality: "epic", id: 50614, icon: "inv_jewelry_ring_82" },
      { slot: "Anillo 2 opcion 2", name: "Anillo de rápido ascenso", source: "ICC 25H - Batalla Aerea", quality: "epic", id: 50614, icon: "inv_jewelry_ring_82" },
      { slot: "Abalorio 1", name: "Objeto desprendido extraño", source: "ICC 25H - Carapútrea", quality: "epic", id: 50365, icon: "inv_jewelry_trinket_03" },
      { slot: "Abalorio 2", name: "Escama Crepuscular carbonizada", source: "RS 25H - Halion", quality: "epic", id: 54588, icon: "inv_misc_rubysanctum2" },
      { slot: "Arma 1H", name: "Oleada de sangre, hoja de agonía de Kel'Thuzad", source: "ICC 25H - Lich King", quality: "epic", id: 50732, icon: "inv_sword_150" },
      { slot: "Off-hand", name: "Huso de seda de las Sombras", source: "ICC 25H - Sindragosa", quality: "epic", id: 50719, icon: "inv_offhand_item_04" },
      { slot: "Varita", name: "Pincho empalador de cadáveres  ", source: "ICC 25H - Carapútrea", quality: "epic", id: 50635, icon: "inv_wand_30" }
    ],
    gems: [
      { type: "meta", name: "Diamante de llama de cielo caótico", stat: "+21 Índice de golpe crítico y 3% Daño crítico aumentado", id: 41285, icon: "inv_misc_gem_diamond_07" },
      { type: "red", name: "Rubí cardeno rúnico", stat: "+23 Poder con Hechizos", id: 40113, icon: "inv_misc_gem_ruby_01" },
      { type: "orange", name: "Ametrino temerario", stat: "+12 Poder con Hechizos y +10 Celeridad", id: 40155, icon: "inv_misc_gem_topaz_02" },
      { type: "blue", name: "Piedra de terror purificada", stat: "+12 Poder con Hechizos y +10 Espíritu", id: 40133, icon: "inv_misc_gem_ebonshadow_02" }
    ],
    enchants: [
      { slot: "Arma", name: "Poder con hechizos poderoso", stat: "+63 Poder con Hechizos", id: 44467, icon: "spell_holy_greaterblessingofkings" },
      { slot: "Cabeza", name: "Arcanum de misterios ardientes", stat: "+30 Poder con Hechizos y +20 Crítico", id: 59959, icon: "inv_misc_armorkit_28" },
      { slot: "Hombros", name: "Inscripción de la tormenta superior", stat: "+24 Poder con Hechizos y +15 Crítico", id: 59936, icon: "ability_shaman_lavaburst" },
      { slot: "Pecho", name: "Estadísticas potentes", stat: "+10 a todas las estadísticas", id: 60662, icon: "spell_holy_greaterblessingofkings" }
    ],
    rotation: [
      { name: "Haunt (Poseer)", description: "Mantén este debuff al 100% de tiempo. Aumenta el daño de todos tus DoTs.", priority: 1 },
      { name: "Inestable / Corrupción / Maldición de Agonía", description: "Mantén todos tus DoTs activos. Corrupción se refresca con Poseer.", priority: 2 },
      { name: "Drenar Alma (Fase Execute)", description: "Cuando el jefe esté por debajo del 25% de vida, Drenar Alma se convierte en tu principal fuente de daño.", priority: 3 },
      { name: "Descarga de Sombras / Llama de Sombras", description: "Usa Descarga de Sombras como relleno. Llama de Sombras solo si estás a rango de melé.", priority: 4 },
      { name: "Life Tap (Transfusión)", description: "Mantén el buff de 'Transfusión de vida' activo para un aumento de SP extra.", priority: 5 }
    ]
  },
  "brujo-demonologia-335a": {
    specName: "Demonología",
    className: "Brujo",
    classColor: "purple",
    iconUrl: "https://wotlk.ultimowow.com/static/images/wow/icons/large/spell_shadow_metamorphosis.jpg",
    stats: [
      { label: "Índice de Golpe (Hit)", value: "14% (368 pts)", detail: "Necesitas un 14% para alcanzar el cap de hechizos contra jefes (17%), asumiendo un Pollo/Sombras en la raid." },
      { label: "Poder con Hechizos (SP)", value: "Prioridad Absoluta", detail: "Tu SP dicta el bono que das a toda la banda con 'Pacto Demoníaco'. Gemear SP es obligatorio." },
      { label: "Celeridad (Haste)", value: "800 - 1000", detail: "Importante para castear más rápido, pero nunca a costa del Poder con Hechizos." },
      { label: "Crítico", value: "Media-Baja", detail: "Bueno para activar el Pacto, pero obtendrás suficiente crítico del equipo BIS de ICC." }
    ],
    bisItems: [
      { slot: "Cabeza", name: "Caperuza del Aquelarre oscuro santificada", source: "ICC 25H - Set T10", quality: "epic", id: 51242, icon: "inv_helmet_152" },
      { slot: "Cuello", name: "Amuleto de la elegía silenciosa", source: "ICC 25H - Batalla Aerea", quality: "epic", id: 50658, icon: "inv_jewelry_necklace_43" },
      { slot: "Hombros", name: "Hombreras del Aquelarre oscuro santificadas", source: "ICC 25H - Set T10", quality: "epic", id: 51244, icon: "inv_shoulder_120" },
      { slot: "Espalda", name: "Capa de ocaso ardiente", source: "Halion 25H", quality: "epic", id: 50628, icon: "item_icecrowncloakb" },
      { slot: "Pecho", name: "Toga del Aquelarre oscuro santificada", source: "ICC 25H - Set T10", quality: "epic", id: 51240, icon: "inv_chest_cloth_52" },
      { slot: "Muñeca", name: "Brazales de noche ígnea", source: "Halion 25H", quality: "epic", id: 50601, icon: "inv_bracer_37" },
      { slot: "Manos", name: "Guantes del Aquelarre oscuro santificados", source: "ICC 25H - Set T10", quality: "epic", id: 51241, icon: "inv_gauntlets_82" },
      { slot: "Cintura", name: "Cinturón de geliespectro aplastante", source: "ICC 25H - Lord Tuétano", quality: "epic", id: 50706, icon: "inv_belt_61" },
      { slot: "Piernas", name: "Pantalones manchados del Pesteador", source: "ICC 25H - Panzachancro", quality: "epic", id: 51243, icon: "inv_pants_cloth_33" },
      { slot: "Pies", name: "Botas de científico de la Peste", source: "ICC 25H - Panzachancro", quality: "epic", id: 50664, icon: "inv_boots_cloth_24" },
      { slot: "Anillo 1", name: "Sortija Cinérea de destrucción infinita", source: "Reputación Veredicto Cinéreo", quality: "epic", id: 50398, icon: "inv_jewelry_ring_84" },
      { slot: "Anillo 2", name: "El otro sello de Valanar", source: "ICC 25H - Consejo de Sangre", quality: "epic", id: 50614, icon: "inv_jewelry_ring_82" },
      { slot: "Abalorio 1", name: "Filacteria del exánime innombrable", source: "ICC 25H - Sindragosa", quality: "epic", id: 50365, icon: "inv_jewelry_trinket_03" },
      { slot: "Abalorio 2", name: "Escama Crepuscular carbonizada", source: "RS 25H - Halion", quality: "epic", id: 54588, icon: "inv_misc_rubysanctum2" },
      { slot: "Arma 1H", name: "Oleada de sangre, hoja de agonía de Kel'Thuzad", source: "ICC 25H - Lich King", quality: "epic", id: 50732, icon: "inv_sword_150" },
      { slot: "Off-hand", name: "Huso de seda de las Sombras", source: "ICC 25H - Consejo de Sangre", quality: "epic", id: 50719, icon: "inv_offhand_item_04" },
      { slot: "Varita", name: "Pincho empalador de cadáveres", source: "ICC 25H - Carapútrea", quality: "epic", id: 50635, icon: "inv_wand_30" }
    ],
    gems: [
      { type: "meta", name: "Diamante de llama de cielo caótico", stat: "+21 Índice de golpe crítico y 3% Daño crítico aumentado", id: 41285, icon: "inv_misc_gem_diamond_07" },
      { type: "red", name: "Rubí cardeno rúnico", stat: "+23 Poder con Hechizos", id: 40113, icon: "inv_misc_gem_ruby_01" },
      { type: "orange", name: "Ametrino temerario", stat: "+12 Poder con Hechizos y +10 Celeridad", id: 40155, icon: "inv_misc_gem_topaz_02" },
      { type: "blue", name: "Piedra de terror purificada", stat: "+12 Poder con Hechizos y +10 Espíritu", id: 40133, icon: "inv_misc_gem_ebonshadow_02" }
    ],
    enchants: [
      { slot: "Arma", name: "Poder con hechizos poderoso", stat: "+63 Poder con Hechizos", id: 44467, icon: "spell_holy_greaterblessingofkings" },
      { slot: "Cabeza", name: "Arcanum de misterios ardientes", stat: "+30 Poder con Hechizos y +20 Crítico", id: 59959, icon: "inv_misc_armorkit_28" },
      { slot: "Hombros", name: "Inscripción de la tormenta superior", stat: "+24 Poder con Hechizos y +15 Crítico", id: 59936, icon: "ability_shaman_lavaburst" },
      { slot: "Pecho", name: "Estadísticas potentes", stat: "+10 a todas las estadísticas", id: 60662, icon: "spell_holy_greaterblessingofkings" }
    ],
    rotation: [
      { name: "Metamorfosis / Inmolar / Corrupción", description: "Transformarse siempre que esté disponible. Inmolar y Corrupción siempre activos.", priority: 1 },
      { name: "Fuego de Alma (Fase Execute)", description: "Cuando el jefe esté por debajo del 35% de vida, Fuego de Alma se vuelve prioritario bajo 'Exterminación'.", priority: 2 },
      { name: "Descarga de Sombras / Llama de Sombras", description: "Usa descargas como relleno. Llama de Sombras solo a rango de melé.", priority: 3 },
      { name: "Pacto Demoníaco", description: "Asegúrate de que tu Guardia Profe está atacando para activar el buff de SP a la banda.", priority: 4 },
      { name: "Life Tap (Transfusión)", description: "Mantén el buff de 'Transfusión de vida' activo para maximizar tu SP.", priority: 5 }
    ]
  },
  "chaman-mejora-335a": {
    specName: "Mejora",
    className: "Chamán",
    classColor: "blue",
    iconUrl: "https://wotlk.ultimowow.com/static/images/wow/icons/large/spell_nature_lightningshield.jpg",
    stats: [
      { label: "Índice de Golpe (Hit)", value: "14% (368 pts)", detail: "Necesitas un 14% para que tus hechizos (especialmente Choque de llamas y Rayo) no fallen contra jefes." },
      { label: "Pericia (Expertise)", value: "26 (Soft Cap)", detail: "Vital para que el jefe no esquive tus ataques automáticos y habilidades de melé. Mejora tu agro y DPS físico." },
      { label: "Celeridad (Haste)", value: "Alta Prioridad", detail: "Tu estadística secundaria más importante. Aumenta la velocidad de tus ataques blancos y activa más veces 'Arma de Vorágine'." },
      { label: "Poder de Ataque (AP)", value: "Muy Alta", detail: "Aumenta el daño de todas tus habilidades y el bono que obtienes de 'Conocimiento mental' (SP del AP)." }
    ],
    bisItems: [
      { slot: "Cabeza", name: "Yelmo de brujo de escarcha santificado", source: "ICC 25H - Set T10", quality: "epic", id: 51202, icon: "inv_helmet_152" },
      { slot: "Cuello", name: "Garra de crueldad de Sindragosa", source: "ICC 25H - Sindragosa", quality: "epic", id: 50633, icon: "inv_jewelry_necklace_43" },
      { slot: "Hombros", name: "Hombreras de brujo de escarcha santificadas", source: "ICC 25H - Set T10", quality: "epic", id: 51204, icon: "inv_shoulder_120" },
      { slot: "Espalda", name: "Capa de invierno real", source: "ICC 25H - Barco", quality: "epic", id: 50628, icon: "item_icecrowncloakb" },
      { slot: "Pecho", name: "Hábito de brujo de escarcha santificado", source: "ICC 25H - Set T10", quality: "epic", id: 51200, icon: "inv_chest_mail_11" },
      { slot: "Muñeca", name: "Brazales de saliva de gárgola", source: "ICC 25H - Lady Susurramuerte", quality: "epic", id: 50611, icon: "inv_bracer_37" },
      { slot: "Manos", name: "Guantes de brujo de escarcha santificados", source: "ICC 25H - Set T10", quality: "epic", id: 51201, icon: "inv_gauntlets_82" },
      { slot: "Cintura", name: "Cincho suturado de Astilla", source: "ICC 25H - Panzachancro", quality: "epic", id: 50620, icon: "inv_belt_61" },
      { slot: "Piernas", name: "Leotardos de brujo de escarcha santificados", source: "ICC 25H - Set T10", quality: "epic", id: 51203, icon: "inv_pants_mail_11" },
      { slot: "Pies", name: "Botas de crecimiento estancado", source: "ICC 25H - Panzachancro", quality: "epic", id: 50606, icon: "inv_boots_mail_03" },
      { slot: "Anillo 1", name: "Sortija Cinérea de venganza infinita", source: "Reputación Veredicto Cinéreo", quality: "epic", id: 50402, icon: "inv_jewelry_ring_84" },
      { slot: "Anillo 2", name: "Sello de muchas bocas", source: "ICC 25H - Carapútrea", quality: "epic", id: 50644, icon: "inv_jewelry_ring_82" },
      { slot: "Abalorio 1", name: "Testamento de Libramorte", source: "ICC 25H - Libramorte", quality: "epic", id: 50363, icon: "inv_jewelry_trinket_04" },
      { slot: "Abalorio 2", name: "Escama Crepuscular afilada", source: "RS 25H - Halion", quality: "epic", id: 54590, icon: "inv_misc_rubysanctum1" },
      { slot: "Arma Main", name: "Llamada de caos, hoja de los Reyes de Lordaeron", source: "ICC 25H - Lich King", quality: "epic", id: 50737, icon: "inv_axe_114" },
      { slot: "Arma Off", name: "Llamada de caos, hoja de los Reyes de Lordaeron", source: "ICC 25H - Lich King", quality: "epic", id: 50737, icon: "inv_axe_114" },
      { slot: "Totem", name: "Tótem de la avalancha de escarcha", source: "Emblemas de Escarcha", quality: "epic", id: 50458, icon: "inv_misc_totem_01" }
    ],
    gems: [
      { type: "meta", name: "Diamante de llama de cielo caótico", stat: "+21 Índice de golpe crítico y 3% Daño crítico aumentado", id: 41285, icon: "inv_misc_gem_diamond_07" },
      { type: "red", name: "Rubí cardeno llamativo", stat: "+20 Fuerza", id: 40111, icon: "inv_misc_gem_ruby_02" },
      { type: "yellow", name: "Ámbar del rey rápido", stat: "+20 Celeridad", id: 40128, icon: "inv_misc_gem_amber_02" },
      { type: "orange", name: "Ametrino temerario", stat: "+10 Poder de Ataque y +10 Celeridad", id: 40155, icon: "inv_misc_gem_topaz_02" }
    ],
    enchants: [
      { slot: "Armas", name: "Rabiar", stat: "Probabilidad de aumentar Poder de Ataque", id: 59620, icon: "ability_melee_hpane" },
      { slot: "Cabeza", name: "Arcanum de tormento", stat: "+50 Poder de Ataque y +20 Crítico", id: 59954, icon: "inv_misc_armorkit_28" },
      { slot: "Hombros", name: "Inscripción del hacha superior", stat: "+40 Poder de Ataque y +15 Crítico", id: 59934, icon: "ability_shaman_lavaburst" },
      { slot: "Pecho", name: "Estadísticas potentes", stat: "+10 a todas las estadísticas", id: 60662, icon: "spell_holy_greaterblessingofkings" }
    ],
    rotation: [
      { name: "Descarga de Relámpagos (Proc)", description: "Usa instantáneamente cuando tengas 5 cargas de 'Arma de Vorágine'.", priority: 1 },
      { name: "Golpe de Tormenta (Stormstrike)", description: "Aplica debuffs y daño masivo. Mantén siempre en CD.", priority: 2 },
      { name: "Látigo de Lava (Lava Lash)", description: "Usa solo si Golpe de Tormenta está en CD.", priority: 3 },
      { name: "Choque de Tierra / Escudo de Relámpagos", description: "Mantén el Escudo activo y usa Choque de Tierra como relleno de daño.", priority: 4 },
      { name: "Tótem de Fuerza de la Tierra / Viento Furioso", description: "Asegúrate de que tus tótems de mejora de melé estén activos para el grupo.", priority: 5 }
    ]
  },
  "chaman-restauracion-335a": {
    specName: "Restauración",
    className: "Chamán",
    classColor: "blue",
    iconUrl: "https://wotlk.ultimowow.com/static/images/wow/icons/large/spell_nature_magicimmunity.jpg",
    stats: [
      { label: "Celeridad (Haste)", value: "1269 (Cap)", detail: "Alcanzar 1269 de celeridad reduce el tiempo de casteo de tu Salva de Sanación a 1.5s y Ola de Sanación inferior a 1s." },
      { label: "Poder con Hechizos (SP)", value: "Máximo posible", detail: "Tu sanación escala directamente con esta estadística. Nunca es suficiente." },
      { label: "Crítico", value: "Muy importante", detail: "Activa 'Despertar ancestral' y 'Resurgimiento' para recuperar maná. Crucial para la sostenibilidad." },
      { label: "MP5", value: "Secundario", detail: "Obtendrás suficiente regeneración del equipo BIS y del Crítico, pero algo de MP5 base ayuda." }
    ],
    bisItems: [
      { slot: "Cabeza", name: "Yelmo de brujo de escarcha santificado", source: "ICC 25H - Set T10", quality: "epic", id: 51247, icon: "inv_helmet_152" },
      { slot: "Cuello", name: "Gargantilla carmesí de la Reina de Sangre", source: "ICC 25H - Reina de Sangre Lana'thel", quality: "epic", id: 50631, icon: "inv_jewelry_necklace_43" },
      { slot: "Hombros", name: "Hombreras de brujo de escarcha santificadas", source: "ICC 25H - Set T10", quality: "epic", id: 51249, icon: "inv_shoulder_120" },
      { slot: "Espalda", name: "Capa de ocaso ardiente", source: "RS 25H - Halion", quality: "epic", id: 50628, icon: "item_icecrowncloakb" },
      { slot: "Pecho", name: "Hábito de brujo de escarcha santificado", source: "ICC 25H - Set T10", quality: "epic", id: 51245, icon: "inv_chest_mail_11" },
      { slot: "Muñeca", name: "Brazales de cambio de fase", source: "RS 25H - Halion", quality: "epic", id: 50629, icon: "inv_bracer_37" },
      { slot: "Manos", name: "Guantes cambiadores", source: "RS 10H - Halion", quality: "epic", id: 51246, icon: "inv_gauntlets_82" },
      { slot: "Cintura", name: "Cinturón de forma partida", source: "RS 25H - Halion", quality: "epic", id: 50671, icon: "inv_belt_61" },
      { slot: "Piernas", name: "Leotardos de brujo de escarcha santificados", source: "ICC 25H - Set T10", quality: "epic", id: 51248, icon: "inv_pants_mail_11" },
      { slot: "Pies", name: "Botas de científico de la Peste", source: "ICC 25H - Panzachancro", quality: "epic", id: 50664, icon: "inv_boots_cloth_24" },
      { slot: "Anillo 1", name: "Anillo de rápido ascenso", source: "ICC 25H - Batalla de naves", quality: "epic", id: 50398, icon: "inv_jewelry_ring_84" },
      { slot: "Anillo 2", name: "Anillo de regeneración por fase", source: "RS 25H - Halion", quality: "epic", id: 50636, icon: "inv_jewelry_ring_82" },
      { slot: "Abalorio 1", name: "Escama Crepuscular resplandeciente", source: "RS 25H - Halion", quality: "epic", id: 50359, icon: "inv_jewelry_trinket_02" },
      { slot: "Abalorio 2", name: "Ábaco de Althor", source: "ICC 25H - Barco", quality: "epic", id: 54589, icon: "inv_misc_rubysanctum4" },
      { slot: "Arma 1H", name: "Cetro real de Terenas II", source: "ICC 25H - Lich King", quality: "epic", id: 50734, icon: "inv_mace_116" },
      { slot: "Arma 1H 2", name: "Martillo de los antiguos reyes", source: "Ulduar 25 - Yogg-Saron", quality: "epic", id: 50734, icon: "inv_mace_116" },
      { slot: "Escudo", name: "Baluarte de acero incandescente", source: "ICC 25H - Lord Tuétano", quality: "epic", id: 50616, icon: "inv_shield_72" },
      { slot: "Totem", name: "Tótem de la marea calmante", source: "Emblemas de Escarcha", quality: "epic", id: 50464, icon: "inv_misc_totem_02" }
      { slot: "Totem 2", name: "Tótem de la marea calmante", source: "Emblemas de Escarcha", quality: "epic", id: 50464, icon: "inv_misc_totem_02" }
    ],
    gems: [
      { type: "meta", name: "Diamante de llama de cielo de ascuas", stat: "+25 Poder con Hechizos y 2% Maná máximo", id: 41401, icon: "inv_misc_gem_diamond_07" },
      { type: "red", name: "Rubí cardeno rúnico", stat: "+23 Poder con Hechizos", id: 40113, icon: "inv_misc_gem_ruby_01" },
      { type: "orange", name: "Ametrino temerario", stat: "+12 Poder con Hechizos y +10 Celeridad", id: 40155, icon: "inv_misc_gem_topaz_02" },
      { type: "yellow", name: "Ámbar del rey rápido", stat: "+20 Celeridad", id: 40128, icon: "inv_misc_gem_amber_02" }
    ],
    enchants: [
      { slot: "Arma", name: "Poder con hechizos poderoso", stat: "+63 Poder con Hechizos", id: 44467, icon: "spell_holy_greaterblessingofkings" },
      { slot: "Cabeza", name: "Arcanum de misterios luminosos", stat: "+30 Poder con Hechizos y +10 regeneración de maná", id: 59960, icon: "inv_misc_armorkit_28" },
      { slot: "Hombros", name: "Inscripción del risco superior", stat: "+24 Poder con Hechizos y +8 regeneración de maná", id: 59937, icon: "ability_shaman_lavaburst" },
      { slot: "Pecho", name: "Estadísticas potentes", stat: "+10 a todas las estadísticas", id: 60662, icon: "spell_holy_greaterblessingofkings" }
    ],
    rotation: [
      { name: "Escudo de Tierra", description: "Mantén este buff activo en el tanque siempre. Sanación pasiva vital.", priority: 1 },
      { name: "Mareas Vivas (Riptide)", description: "Usa este HoT instantáneo para activar el buff de 'Mareas de sanación' (celeridad).", priority: 2 },
      { name: "Salva de Sanación (Chain Heal)", description: "Tu principal herramienta de sanación de banda. Úsala inteligentemente.", priority: 3 },
      { name: "Ola de Sanación Inferior", description: "Úsala para sanaciones rápidas en un solo objetivo cuando Mareas Vivas esté en CD.", priority: 4 },
      { name: "Tótem de Corriente de Sanación", description: "Asegúrate de que tus tótems estén activos en todo momento según la necesidad.", priority: 5 }
    ]
  },
  "druida-equilibrio-335a": {
    specName: "Equilibrio",
    className: "Druida",
    classColor: "orange",
    iconUrl: "https://wotlk.ultimowow.com/static/images/wow/icons/large/spell_nature_starfall.jpg",
    stats: [
      { label: "Índice de Golpe (Hit)", value: "10% (263 pts)", detail: "Con talentos (Equilibrio de Poder y Fuego Feérico mejorado), necesitas un 10% para no fallar hechizos contra jefes." },
      { label: "Celeridad (Haste)", value: "401 (Con 4p T10)", detail: "Con el bonus de 4 piezas del T10, este valor reduce el tiempo de casteo de Fuego Estelar durante el eclipse de Cólera." },
      { label: "Crítico", value: "Muy importante", detail: "Crucial para activar tus Eclipses y recuperar maná con 'Presura de la naturaleza'. Escala muy bien en WotLK." },
      { label: "Poder con Hechizos (SP)", value: "Máximo posible", detail: "Aumenta el daño de todos tus hechizos sin límite. Prioridad absoluta tras los caps de golpe y celeridad." }
    ],
    bisItems: [
      { slot: "Cabeza", name: "Yelmo de tejeascuas santificado", source: "Set T10", quality: "epic", id: 51292, icon: "inv_helmet_153" },
      { slot: "Cuello", name: "Gargantilla carmesí de la Reina de Sangre", source: "ICC 25H - Reina Lana'thel", quality: "epic", id: 50658, icon: "inv_jewelry_necklace_43" },
      { slot: "Hombros", name: "Manto de tejeascuas santificado", source: "Set T10", quality: "epic", id: 51294, icon: "inv_shoulder_121" },
      { slot: "Espalda", name: "Capa de ocaso ardiente", source: "Halion 25H", quality: "epic", id: 50628, icon: "item_icecrowncloakb" },
      { slot: "Pecho", name: "Vestiduras de tejeascuas santificadas", source: "Set T10", quality: "epic", id: 51290, icon: "inv_chest_leather_24" },
      { slot: "Muñeca", name: "Brazales de noche ígnea", source: "Halion 25H", quality: "epic", id: 50601, icon: "inv_bracer_37" },
      { slot: "Manos", name: "Guantes de tejeascuas santificados", source: "Set T10", quality: "epic", id: 51291, icon: "inv_gauntlets_83" },
      { slot: "Cintura", name: "Cinturón de geliespectro aplastante", source: "ICC 25H - Lord Tuétano", quality: "epic", id: 50706, icon: "inv_belt_61" },
      { slot: "Piernas", name: "Pantalones manchados del Pesteador", source: "ICC 25H - Panzachancro", quality: "epic", id: 51293, icon: "inv_pants_leather_23" },
      { slot: "Pies", name: "Botas de científico de la Peste", source: "ICC 25H - Carapútrea", quality: "epic", id: 50664, icon: "inv_boots_cloth_24" },
      { slot: "Anillo 1", name: "Sortija Cinérea de sabiduría infinita", source: "Reputación Veredicto Cinéreo", quality: "epic", id: 50398, icon: "inv_jewelry_ring_84" },
      { slot: "Anillo 2", name: "Anillo de rápido ascenso", source: "ICC 25H - Batalla Aerea", quality: "epic", id: 50636, icon: "inv_jewelry_ring_82" },
      { slot: "Abalorio 1", name: "Filacteria del exánime innombrable", source: "ICC 25H - Sindragosa", quality: "epic", id: 50365, icon: "inv_jewelry_trinket_03" },
      { slot: "Abalorio 2", name: "Escama Crepuscular carbonizada", source: "RS 25H - Halion", quality: "epic", id: 54588, icon: "inv_misc_rubysanctum2" },
      { slot: "Arma", name: "Cetro real de Terenas II", source: "ICC 25H - Rey Exánime", quality: "epic", id: 50731, icon: "inv_staff_104" },
      { slot: "Idol", name: "Ídolo del eclipse lunar", source: "Emblemas de Escarcha", quality: "epic", id: 50456, icon: "inv_misc_idol_02" }
    ],
    gems: [
      { type: "meta", name: "Diamante de llama de cielo caótico", stat: "+21 Índice de golpe crítico y 3% Daño crítico aumentado", id: 41285, icon: "inv_misc_gem_diamond_07" },
      { type: "red", name: "Rubí cardeno rúnico", stat: "+23 Poder con Hechizos", id: 40113, icon: "inv_misc_gem_ruby_01" },
      { type: "orange", name: "Ametrino temerario", stat: "+12 Poder con Hechizos y +10 Celeridad", id: 40155, icon: "inv_misc_gem_topaz_02" },
      { type: "blue", name: "Piedra de terror purificada", stat: "+12 Poder con Hechizos y +10 Espíritu", id: 40133, icon: "inv_misc_gem_ebonshadow_02" }
    ],
    enchants: [
      { slot: "Arma", name: "Poder con hechizos poderoso", stat: "+63 Poder con Hechizos", id: 44467, icon: "spell_holy_greaterblessingofkings" },
      { slot: "Cabeza", name: "Arcanum de misterios ardientes", stat: "+30 Poder con Hechizos y +20 Crítico", id: 59959, icon: "inv_misc_armorkit_28" },
      { slot: "Hombros", name: "Inscripción de la tormenta superior", stat: "+24 Poder con Hechizos y +15 Crítico", id: 59936, icon: "ability_shaman_lavaburst" },
      { slot: "Pecho", name: "Estadísticas potentes", stat: "+10 a todas las estadísticas", id: 60662, icon: "spell_holy_greaterblessingofkings" }
    ],
    rotation: [
      { name: "Fuego Feérico", description: "Mantén el debuff siempre activo. Aumenta tu probabilidad de golpe y la de la banda.", priority: 1 },
      { name: "Fuego Lunar / Enjambre de Insectos", description: "Mantén tus DoTs activos. Proporcionan daño constante y activan efectos de talentos.", priority: 2 },
      { name: "Cólera (Eclipse Solar)", description: "Usa Cólera hasta que se active el Eclipse de Fuego Estelar.", priority: 3 },
      { name: "Fuego Estelar (Eclipse Lunar)", description: "Usa Fuego Estelar hasta que termine el Eclipse de Cólera.", priority: 4 },
      { name: "Lluvia de Estrellas", description: "Úsalo siempre que esté disponible para un daño masivo de área o ráfaga de daño.", priority: 5 }
    ]
  },
  "druida-restauracion-335a": {
    specName: "Restauración",
    className: "Druida",
    classColor: "orange",
    iconUrl: "https://wotlk.ultimowow.com/static/images/wow/icons/large/spell_nature_healingtouch.jpg",
    stats: [
      { label: "Poder con Hechizos (SP)", value: "Máximo posible", detail: "Tu estadística más importante. Aumenta la sanación de todos tus hechizos, especialmente tus HoTs (sanación en el tiempo)." },
      { label: "Celeridad (Haste)", value: "856 (Soft Cap)", detail: "Con el bonus de 4 piezas del T10 y talentos, 856 de celeridad reduce el GCD de Recrecimiento y Nutrir a 1 segundo." },
      { label: "Espíritu (Spirit)", value: "Alto", detail: "Proporciona regeneración de maná constante y se convierte en Poder con Hechizos gracias al talento 'Forma de Árbol de vida'." },
      { label: "Crítico", value: "Secundario", detail: "Útil para Nutrir y Recrecimiento, pero menos prioritario que el SP y la Celeridad para un estilo de juego basado en HoTs." }
    ],
    bisItems: [
      { slot: "Cabeza", name: "Casco tejeazote santificado", source: "Emblemas de Escarcha", quality: "epic", id: 51297, icon: "inv_helmet_153" },
      { slot: "Cuello", name: "Amuleto de centinela osario", source: "ICC 25H - Lady Susurramuerte", quality: "epic", id: 50658, icon: "inv_jewelry_necklace_43" },
      { slot: "Hombros", name: "Espaldares tejeazote santificado", source: "Emblemas de Escarcha", quality: "epic", id: 51299, icon: "inv_shoulder_120" },
      { slot: "Espalda", name: "Capa de ocaso ardiente", source: "Halion 25H", quality: "epic", id: 50628, icon: "item_icecrowncloakb" },
      { slot: "Pecho", name: "Toga de seda sanguina", source: "ICC 25H - Consejo de Sangre", quality: "epic", id: 51295, icon: "inv_chest_leather_24" },
      { slot: "Muñeca", name: "Brazales de noche ígnea", source: "Halion 25H", quality: "epic", id: 50601, icon: "inv_bracer_37" },
      { slot: "Manos", name: "Guanteletes tejeazote santificados", source: "Emblemas de Escarcha", quality: "epic", id: 51296, icon: "inv_gauntlets_82" },
      { slot: "Cintura", name: "Guardapolvo ensangrentado del profesor", source: "ICC 25H - Profesor Putricidio", quality: "epic", id: 50706, icon: "inv_belt_61" },
      { slot: "Piernas", name: "Quijotes tejeazote santificados", source: "Emblemas de Escarcha", quality: "epic", id: 51298, icon: "inv_pants_leather_23" },
      { slot: "Pies", name: "Botas de crecimiento antinatural", source: "ICC 25H - Batalla Aerea", quality: "epic", id: 50664, icon: "inv_boots_cloth_24" },
      { slot: "Anillo 1", name: "Sortija Cinérea de sabiduría infinita", source: "Reputación Veredicto Cinéreo", quality: "epic", id: 50398, icon: "inv_jewelry_ring_84" },
      { slot: "Anillo 2", name: "Memoria de Malygos", source: "ICC 25H - Sindragosa", quality: "epic", id: 50636, icon: "inv_jewelry_ring_82" },
      { slot: "Abalorio 1", name: "Ábaco de Althor", source: "ICC 25H - Barco", quality: "epic", id: 50359, icon: "inv_jewelry_trinket_02" },
      { slot: "Abalorio 2", name: "Escama Crepuscular resplandeciente", source: "RS 25H - Halion", quality: "epic", id: 54589, icon: "inv_misc_rubysanctum4" },
      { slot: "Arma 1H", name: "Val'anyr, Martillo de los antiguos reyes", source: "Ulduar 25H - Yogg-Saron", quality: "epic", id: 50605, icon: "inv_mace_115" },
      { slot: "Mano izquierda", name: "Reloj de sol del anochecer eterno", source: "ICC 25H - Sindragosa", quality: "epic", id: 50719, icon: "inv_offhand_item_04" },
      { slot: "Ídolo", name: "Ídolo del sauce negro", source: "Emblemas de Escarcha", quality: "epic", id: 50454, icon: "inv_misc_idol_02" }
    ],
    gems: [
      { type: "meta", name: "Diamante de llama de cielo de ascuas", stat: "+25 Poder con Hechizos y 2% Maná máximo", id: 41401, icon: "inv_misc_gem_diamond_07" },
      { type: "red", name: "Rubí cardeno rúnico", stat: "+23 Poder con Hechizos", id: 40113, icon: "inv_misc_gem_ruby_01" },
      { type: "orange", name: "Ametrino temerario", stat: "+12 Poder con Hechizos y +10 Celeridad", id: 40155, icon: "inv_misc_gem_topaz_02" },
      { type: "blue", name: "Piedra de terror purificada", stat: "+12 Poder con Hechizos y +10 Espíritu", id: 40133, icon: "inv_misc_gem_ebonshadow_02" }
    ],
    enchants: [
      { slot: "Arma", name: "Poder con hechizos poderoso", stat: "+63 Poder con Hechizos", id: 44467, icon: "spell_holy_greaterblessingofkings" },
      { slot: "Cabeza", name: "Arcanum de misterios luminosos", stat: "+30 Poder con Hechizos y +10 regeneración de maná", id: 59960, icon: "inv_misc_armorkit_28" },
      { slot: "Hombros", name: "Inscripción del risco superior", stat: "+24 Poder con Hechizos y +8 regeneración de maná", id: 59937, icon: "ability_shaman_lavaburst" },
      { slot: "Pecho", name: "Estadísticas potentes", stat: "+10 a todas las estadísticas", id: 60662, icon: "spell_holy_greaterblessingofkings" }
    ],
    rotation: [
      { name: "Crecimiento Salvaje", description: "Úsalo siempre que el CD esté disponible si hay daño en banda. Tu HoT de área más potente.", priority: 1 },
      { name: "Rejuvenecimiento", description: "Mantén este HoT en tantos objetivos como sea posible antes de que reciban daño.", priority: 2 },
      { name: "Flor de Vida", description: "Úsalo principalmente en el tanque para mantener la sanación constante y recuperar maná al expirar.", priority: 3 },
      { name: "Nutrir", description: "Tu hechizo de sanación directa rápido. Úsalo para levantar vidas bajas si los HoTs no son suficientes.", priority: 4 },
      { name: "Alivio Prematuro", description: "Consumir un Rejuvenecimiento o Crecimiento para una sanación instantánea crítica.", priority: 5 }
    ]
  },
  "guerrero-furia-335a": {
    specName: "Furia",
    className: "Guerrero",
    classColor: "orange",
    iconUrl: "https://wotlk.ultimowow.com/static/images/wow/icons/large/ability_warrior_innerrage.jpg",
    stats: [
      { label: "Índice de Golpe (Hit)", value: "8% (164 pts)", detail: "Con el talento 'Precisión' (3/3), necesitas 164 de golpe para no fallar habilidades especiales contra jefes." },
      { label: "Penetración de Armadura (ArP)", value: "1400 (100% Cap)", detail: "Tu estadística más potente en ICC. Ignorar el 100% de la armadura del jefe aumenta tu daño físico masivamente." },
      { label: "Pericia (Expertise)", value: "26 (214 pts)", detail: "Evita que el jefe esquive tus ataques. Vital para no perder recursos de ira." },
      { label: "Fuerza (Strength)", value: "Máximo posible", detail: "Tras el cap de ArP, gemear fuerza es la mejor opción para aumentar el daño base." }
    ],
    bisItems: [
      { slot: "Cabeza", name: "Casco de señor Ymirjar santificado", source: "ICC 25H - Set T10", quality: "epic", id: 51227, icon: "inv_helmet_151" },
      { slot: "Cuello", name: "Colgante de lobreguez", source: "Halion 25H", quality: "epic", id: 50633, icon: "inv_jewelry_necklace_43" },
      { slot: "Hombros", name: "Espaldares de señor Ymirjar santificados", source: "ICC 25H - Set T10", quality: "epic", id: 51229, icon: "inv_shoulder_120" },
      { slot: "Espalda", name: "Astucia de Sylvanas", source: "TOC 25H", quality: "epic", id: 50628, icon: "item_icecrowncloakb" },
      { slot: "Espalda Opcion 2", name: "Maña de Vereesa", source: "TOC 25H", quality: "epic", id: 50628, icon: "item_icecrowncloakb" },
      { slot: "Pecho", name: "Coraza de señor Ymirjar santificada", source: "ICC 25H - Set T10", quality: "epic", id: 51225, icon: "inv_chest_plate_26" },
      { slot: "Muñeca", name: "Brazales de saliva de gárgola", source: "ICC 25H - Lady Susurramuerte", quality: "epic", id: 50611, icon: "inv_bracer_37" },
      { slot: "Manos", name: "Guantes de secretos de Aldriana", source: "ICC 25H - Carapútrea", quality: "epic", id: 51226, icon: "inv_gauntlets_81" },
      { slot: "Cintura", name: "Cincho suturado de Astilla", source: "ICC 25H - Panzachancro", quality: "epic", id: 50620, icon: "inv_belt_61" },
      { slot: "Piernas", name: "Quijotes de señor de Ymirjar santificados", source: "ICC 25H - Set T10", quality: "epic", id: 51228, icon: "inv_pants_plate_30" },
      { slot: "Pies", name: "Grévias de hueso de escarcha", source: "ICC 25H - Tuétano", quality: "epic", id: 50639, icon: "inv_boots_plate_12" },
      { slot: "Anillo 1", name: "Sortija Cinérea de venganza infinita", source: "Reputación Veredicto Cinéreo", quality: "epic", id: 50402, icon: "inv_jewelry_ring_84" },
      { slot: "Anillo 2", name: "Sello de muchas bocas", source: "ICC 25H - Carapútrea", quality: "epic", id: 50644, icon: "inv_jewelry_ring_82" },
      { slot: "Abalorio 1", name: "Testamento del Libramorte", source: "ICC 25H - Libramorte", quality: "epic", id: 50363, icon: "inv_jewelry_trinket_04" },
      { slot: "Abalorio 2", name: "Escama Crepuscular afilada", source: "RS 25H - Halion", quality: "epic", id: 54590, icon: "inv_misc_rubysanctum1" },
      { slot: "Arma Main", name: "Agonía de sombras", source: "Misión Legendaria ICC", quality: "legendary", id: 49623, icon: "inv_axe_113" },
      { slot: "Arma Off", name: "Glorenzelg, alta hoja de la Mano de Plata", source: "ICC 25H - Lich King", quality: "epic", id: 50730, icon: "inv_sword_150" },
      { slot: "Rango", name: "Lanzagranadas de Rowen", source: "ICC 25H - Barco", quality: "epic", id: 50733, icon: "inv_weapon_rifle_33" }
    ],
    gems: [
      { type: "meta", name: "Diamante de llama de cielo caótico", stat: "+21 Índice de golpe crítico y 3% Daño crítico aumentado", id: 41285, icon: "inv_jewelcrafting_icediamond_02" },
      { type: "red", name: "Rubí cardeno fracturado", stat: "+20 Penetración de Armadura", id: 40117, icon: "inv_jewelcrafting_gem_37" },
      { type: "red", name: "Rubí cardeno llamativo", stat: "+20 Fuerza", id: 40111, icon: "inv_jewelcrafting_gem_37" },
      { type: "orange", name: "Ametrino con inscripciones", stat: "+10 Fuerza y +10 Índice de Crítico", id: 40142, icon: "inv_jewelcrafting_gem_39" }
    ],
    enchants: [
      { slot: "Armas", name: "Rabiar", id: 59620, icon: "spell_nature_strength", stat: "Probabilidad de aumentar Poder de Ataque" },
      { slot: "Cabeza", name: "Arcanum de tormento", id: 59954, icon: "ability_warrior_rampage", stat: "+50 Poder de Ataque y +20 Crítico" },
      { slot: "Hombros", name: "Inscripción del hacha superior", id: 59934, icon: "trade_engineering", stat: "+40 Poder de Ataque y +15 Crítico" },
      { slot: "Pecho", name: "Estadísticas potentes", id: 60662, icon: "trade_engraving", stat: "+10 a todas las estadísticas" }
    ],
    rotation: [
      { name: "Torbellino (Whirlwind)", description: "Tu principal ataque de área y generación de daño. Úsalo siempre en CD.", priority: 1 },
      { name: "Sanguinaria (Bloodthirst)", description: "Ataque constante para mantener el daño y activar proc de talentos.", priority: 2 },
      { name: "Embate (Slam Proc)", description: "Úsalo solo cuando se active 'Oleada de sangre' para un casteo instantáneo.", priority: 3 },
      { name: "Golpe Heroico", description: "Úsalo como quemador de ira cuando tengas más de 60-70 puntos acumulados.", priority: 4 },
      { name: "Deseo de Muerte / Temeridad", description: "Úsalos en fases de ráfaga (BL) para un daño explosivo extremo.", priority: 5 }
    ]
  },
  "guerrero-proteccion-335a": {
    specName: "Protección",
    className: "Guerrero",
    classColor: "orange",
    iconUrl: "https://wotlk.ultimowow.com/static/images/wow/icons/large/ability_warrior_defensivestance.jpg",
    stats: [
      { label: "Defensa (Defense Cap)", value: "540 (Raid Cap)", detail: "Obligatorio para ser inmune a críticos de jefes en raid. No entres sin este valor." },
      { label: "Aguante (Stamina)", value: "Máximo posible", detail: "Tu estadística de supervivencia más importante. Aumenta tu salud máxima para resistir picos de daño." },
      { label: "Valor de Bloqueo", value: "Importante", detail: "Aumenta el daño de tu Embate con Escudo (agro) y reduce el daño físico recibido al bloquear." },
      { label: "Pericia (Expertise)", value: "26 (214 pts)", detail: "Evita que el jefe esquive o pare tus ataques. Crucial para mantener el agro constante." }
    ],
    bisItems: [
      { slot: "Cabeza", name: "Protector facial de señor de Ymirjar santificado", source: "ICC 25H - Set T10", quality: "epic", id: 51222, icon: "inv_helmet_151" },
      { slot: "Cuello", name: "Medallón de la Legión de Hierro", source: "ICC 25H - Libramorte", quality: "epic", id: 50627, icon: "inv_jewelry_necklace_44" },
      { slot: "Hombros", name: "Espaldares de señor de Ymirjar santificados", source: "ICC 25H - Set T10", quality: "epic", id: 51224, icon: "inv_shoulder_120" },
      { slot: "Espalda", name: "Capa de invierno real", source: "ICC 25H - Barco", quality: "epic", id: 50628, icon: "item_icecrowncloakb" },
      { slot: "Pecho", name: "Coraza de señor de Ymirjar santificada", source: "ICC 25H - Set T10", quality: "epic", id: 51220, icon: "inv_chest_plate_26" },
      { slot: "Muñeca", name: "Brazales de saliva de gárgola", source: "ICC 25H - Lady Susurramuerte", quality: "epic", id: 50611, icon: "inv_bracer_37" },
      { slot: "Manos", name: "Guanteletes de señor de Ymirjar santificados", source: "ICC 25H - Set T10", quality: "epic", id: 51221, icon: "inv_gauntlets_81" },
      { slot: "Cintura", name: "Cinturón de huesos rotos", source: "ICC 25H - Tuétano", quality: "epic", id: 50613, icon: "inv_belt_61" },
      { slot: "Piernas", name: "Quijotes de señor de Ymirjar santificados", source: "ICC 25H - Set T10", quality: "epic", id: 51223, icon: "inv_pants_plate_30" },
      { slot: "Pies", name: "Botas de científico loco", source: "ICC 25H - Panzachancro", quality: "epic", id: 50607, icon: "inv_boots_plate_12" },
      { slot: "Anillo 1", name: "Sortija Cinérea de protección infinita", source: "Reputación Veredicto Cinéreo", quality: "epic", id: 50404, icon: "inv_jewelry_ring_83" },
      { slot: "Anillo 2", name: "Lazo de esperanza de Jaina", source: "ICC 25H - Barco", quality: "epic", id: 50642, icon: "inv_jewelry_ring_82" },
      { slot: "Abalorio 1", name: "Órgano inidentificable", source: "ICC 25H - Carapútrea", quality: "epic", id: 50344, icon: "inv_misc_organ_03" },
      { slot: "Abalorio 2", name: "Colmillo impecable de Sindragosa", source: "ICC 25H - Sindragosa", quality: "epic", id: 50364, icon: "inv_jewelry_trinket_06" },
      { slot: "Arma 1H", name: "Última palabra", source: "ICC 25H - Lich King", quality: "epic", id: 50738, icon: "inv_mace_116" },
      { slot: "Escudo", name: "Muro de hielo glacial", source: "ICC 25H - Sindragosa", quality: "epic", id: 50729, icon: "inv_shield_73" },
      { slot: "Rango", name: "Rifle de balas de plata de Rowan", source: "ICC 25H - Barco", quality: "epic", id: 50733, icon: "inv_weapon_rifle_33" }
    ],
    gems: [
      { type: "meta", name: "Diamante de asedio de tierra austero", stat: "+32 Aguante y 2% Valor de Armadura", id: 41380, icon: "inv_misc_gem_diamond_04" },
      { type: "red", name: "Piedra de terror de defensor", stat: "+10 Esquive y +15 Aguante", id: 40167, icon: "inv_misc_gem_ebonshadow_02" },
      { type: "blue", name: "Zircón majestuoso sólido", stat: "+30 Aguante", id: 40119, icon: "inv_misc_gem_sapphire_02" },
      { type: "yellow", name: "Ametrino de guardián", stat: "+10 Parada y +15 Aguante", id: 40141, icon: "inv_misc_gem_topaz_01" }
    ],
    enchants: [
      { slot: "Arma", name: "Amparo de hojas", stat: "Probabilidad de aumentar Parada", id: 64441, icon: "spell_holy_blessingofprotection" },
      { slot: "Cabeza", name: "Arcanum de protector adepto", stat: "+37 Aguante y +20 Defensa", id: 59955, icon: "inv_misc_armorkit_27" },
      { slot: "Hombros", name: "Inscripción del pináculo superior", stat: "+20 Esquive y +15 Defensa", id: 59935, icon: "ability_warrior_shieldwall" },
      { slot: "Escudo", name: "Aguante mayor", stat: "+18 Aguante", id: 44489, icon: "spell_holy_greaterblessingofsanctuary" },
      { slot: "Pecho", name: "Supersalud", stat: "+275 Salud", id: 47900, icon: "spell_holy_greaterblessingofkings" }
    ],
    rotation: [
      { name: "Embate con Escudo", description: "Tu principal habilidad de generación de agro. Úsala siempre en CD.", priority: 1 },
      { name: "Revancha (Revenge)", description: "Daño masivo y generación de agro instantánea. Disponible tras esquivar/parar.", priority: 2 },
      { name: "Ola de Choque (Shockwave)", description: "Control de masas de área y gran agro inicial en grupos.", priority: 3 },
      { name: "Herir (Sunder Armor)", description: "Mantén 5 cargas de debuff de armadura si no hay un Guerrero Armas.", priority: 4 },
      { name: "Grito Desmoralizador / Atronar", description: "Debuffs esenciales para reducir el daño del jefe a la banda.", priority: 5 }
    ]
  },
  "paladin-proteccion-335a": {
    specName: "Protección",
    className: "Paladín",
    classColor: "pink",
    iconUrl: "https://wotlk.ultimowow.com/static/images/wow/icons/large/ability_paladin_shieldofvengeance.jpg",
    stats: [
      { label: "Defensa (Defense Cap)", value: "540 (Raid Cap)", detail: "Esencial para ser inmune a críticos de jefes de nivel 83. No entres a una raid sin este valor mínimo." },
      { label: "Aguante (Stamina)", value: "Máximo posible", detail: "Tu estadística de supervivencia principal. Escala con 'Santuario' y 'Fuerza divina'. Aumenta tu reserva de salud para aguantar golpes masivos." },
      { label: "Índice de Golpe (Hit)", value: "8% (263 pts)", detail: "Necesario para no fallar Sentencias y Martillo del Honrado. Vital para mantener la amenaza (agro)." },
      { label: "Pericia (Expertise)", value: "26 (Soft Cap)", detail: "Evita que el jefe esquive tus ataques, lo que previene el 'parry-haste' y mejora tu generación de agro." }
    ],
    bisItems: [
      { slot: "Cabeza", name: "Casco juraluz santificado", source: "ICC 25H - Set T10", quality: "epic", id: 51267, icon: "inv_helmet_154" },
      { slot: "Cuello", name: "Medallón de la Legión de Hierro", source: "ICC 25H - Libramorte", quality: "epic", id: 50627, icon: "inv_jewelry_necklace_44" },
      { slot: "Hombros", name: "Hombreras de placas juraluz santificadas", source: "ICC 25H - Set T10", quality: "epic", id: 51269, icon: "inv_shoulder_121" },
      { slot: "Espalda", name: "Capa de invierno real", source: "ICC 25H - Barco", quality: "epic", id: 50628, icon: "item_icecrowncloakb" },
      { slot: "Pecho", name: "Placa de batalla juraluz santificada", source: "ICC 25H - Set T10", quality: "epic", id: 51265, icon: "inv_chest_plate_27" },
      { slot: "Muñeca", name: "Brazales de saliva de gárgola", source: "ICC 25H - Lady Susurramuerte", quality: "epic", id: 50611, icon: "inv_bracer_37" },
      { slot: "Manos", name: "Guanteletes juraluz santificados", source: "ICC 25H - Set T10", quality: "epic", id: 51266, icon: "inv_gauntlets_84" },
      { slot: "Cintura", name: "Cinturón de huesos rotos", source: "ICC 25H - Tuétano", quality: "epic", id: 50613, icon: "inv_belt_61" },
      { slot: "Piernas", name: "Quijotes juraluz santificados", source: "ICC 25H - Set T10", quality: "epic", id: 51268, icon: "inv_pants_plate_31" },
      { slot: "Pies", name: "Botas de científico loco", source: "ICC 25H - Panzachancro", quality: "epic", id: 50607, icon: "inv_boots_plate_12" },
      { slot: "Anillo 1", name: "Sortija Cinérea de protección infinita", source: "Reputación Veredicto Cinéreo", quality: "epic", id: 50404, icon: "inv_jewelry_ring_83" },
      { slot: "Anillo 2", name: "Lazo de esperanza de Jaina", source: "ICC 25H - Barco", quality: "epic", id: 50642, icon: "inv_jewelry_ring_82" },
      { slot: "Abalorio 1", name: "Órgano inidentificable", source: "ICC 25H - Carapútrea", quality: "epic", id: 50344, icon: "inv_misc_organ_03" },
      { slot: "Abalorio 2", name: "Colmillo impecable de Sindragosa", source: "ICC 25H - Sindragosa", quality: "epic", id: 50364, icon: "inv_jewelry_trinket_06" },
      { slot: "Arma 1H", name: "Última palabra", source: "ICC 25H - Lich King", quality: "epic", id: 50738, icon: "inv_mace_116" },
      { slot: "Escudo", name: "Muro de hielo glacial", source: "ICC 25H - Sindragosa", quality: "epic", id: 50729, icon: "inv_shield_73" },
      { slot: "Tratado", name: "Tratado sobre el combatiente eterno", source: "Emblemas de Triunfo", quality: "epic", id: 47664, icon: "inv_misc_book_11" }
    ],
    gems: [
      { type: "meta", name: "Diamante de asedio de tierra austero", stat: "+32 Aguante y 2% Valor de Armadura", id: 41380, icon: "inv_misc_gem_diamond_04" },
      { type: "red", name: "Piedra de terror de defensor", stat: "+10 Esquive y +15 Aguante", id: 40167, icon: "inv_misc_gem_ebonshadow_02" },
      { type: "blue", name: "Zircón majestuoso sólido", stat: "+30 Aguante", id: 40119, icon: "inv_misc_gem_sapphire_02" },
      { type: "yellow", name: "Ametrino de guardián", stat: "+10 Parada y +15 Aguante", id: 40141, icon: "inv_misc_gem_topaz_01" }
    ],
    enchants: [
      { slot: "Arma", name: "Amparo de hojas", stat: "Probabilidad de aumentar Parada y daño de contraataque", id: 64441, icon: "spell_holy_blessingofprotection" },
      { slot: "Cabeza", name: "Arcanum de protector adepto", stat: "+37 Aguante y +20 Defensa", id: 59955, icon: "inv_misc_armorkit_27" },
      { slot: "Hombros", name: "Inscripción del pináculo superior", stat: "+20 Esquive y +15 Defensa", id: 59935, icon: "ability_warrior_shieldwall" },
      { slot: "Escudo", name: "Aguante mayor", stat: "+18 Aguante", id: 44489, icon: "spell_holy_greaterblessingofsanctuary" },
      { slot: "Pecho", name: "Supersalud", stat: "+275 Salud", id: 47900, icon: "spell_holy_greaterblessingofkings" }
    ],
    rotation: [
      { name: "Escudo Sagrado", description: "Mantén este buff activo al 100% del tiempo para aumentar tu bloqueo y daño sagrado al bloquear.", priority: 1 },
      { name: "Martillo del Honrado", description: "Tu principal generador de agro en un solo objetivo y área. Úsalo en cada CD.", priority: 2 },
      { name: "Sentencia de Sabiduría", description: "Recupera maná y aplica debuffs al jefe. Crucial para la sostenibilidad.", priority: 3 },
      { name: "Escudo de Rectitud", description: "Gran golpe de escudo que escala con tu valor de bloqueo. Úsalo tras Martillo.", priority: 4 },
      { name: "Consagración / Martillo de Cólera", description: "Rellena los huecos en la rotación 96969 con estas habilidades según la situación.", priority: 5 }
    ]
  },
  "paladin-retribucion-335a": {
    specName: "Retribución",
    className: "Paladín",
    classColor: "pink",
    iconUrl: "https://wotlk.ultimowow.com/static/images/wow/icons/large/spell_holy_auraoflight.jpg",
    stats: [
      { label: "Índice de Golpe (Hit)", value: "8% (263 pts)", detail: "Prioridad #1. Necesitas un 8% para no fallar golpes blancos ni habilidades especiales contra jefes de nivel 83." },
      { label: "Pericia (Expertise)", value: "26 (214 pts)", detail: "Prioridad #2. Reduce la probabilidad de que el jefe esquive tus ataques. Con el talento 'Sello de pureza' necesitas menos equipo." },
      { label: "Fuerza (Strength)", value: "Máximo posible", detail: "Tu estadística principal. Escala con 'Fuerza divina' y proporciona Poder de Ataque. No tiene límite (cap)." },
      { label: "Crítico / Celeridad", value: "Equilibrio BIS", detail: "El crítico es vital para el daño de hechizos y ataques. La celeridad reduce el tiempo de reutilización global y aumenta ataques blancos." }
    ],
    bisItems: [
      { slot: "Cabeza", name: "Casco juraluz santificado", source: "ICC 25H - Set T10", quality: "epic", id: 51277, icon: "inv_helmet_154" },
      { slot: "Cuello", name: "Penacho de Penumbra", source: "RS 25H - Halion", quality: "epic", id: 54581, icon: "item_icecrownnecka" },
      { slot: "Hombros", name: "Hombreras de placas juraluz santificadas", source: "ICC 25H - Set T10", quality: "epic", id: 51279, icon: "inv_shoulder_121" },
      { slot: "Espalda", name: "Capa de ocaso desgarrada", source: "RS 25H - Halion", quality: "epic", id: 54583, icon: "item_icecrowncloakd" },
      { slot: "Pecho", name: "Placa de batalla juraluz santificada", source: "ICC 25H - Set T10", quality: "epic", id: 51275, icon: "inv_chest_plate_27" },
      { slot: "Muñeca", name: "Braciles de juicio de luz", source: "ICC 25H - Barco", quality: "epic", id: 50659, icon: "inv_bracer_37" },
      { slot: "Manos", name: "Guantes de acechador Anub'ar", source: "ICC 25H - Valithria Caminasueños", quality: "epic", id: 51276, icon: "inv_gauntlets_84" },
      { slot: "Cintura", name: "Cincho suturado de Astilla", source: "ICC 25H - Panzachancro", quality: "epic", id: 50620, icon: "inv_belt_61" },
      { slot: "Piernas", name: "Quijotes juraluz santificados", source: "ICC 25H - Set T10", quality: "epic", id: 51278, icon: "inv_pants_plate_31" },
      { slot: "Pies", name: "Grévias de hueso de escarcha", source: "ICC 25H - Tuétano", quality: "epic", id: 50639, icon: "inv_boots_plate_12" },
      { slot: "Anillo 1", name: "Sortija Cinérea de venganza infinita", source: "Reputación Veredicto Cinéreo", quality: "epic", id: 50402, icon: "inv_jewelry_ring_84" },
      { slot: "Anillo 2", name: "Sello de muchas bocas", source: "ICC 25H - Carapútrea", quality: "epic", id: 50644, icon: "inv_jewelry_ring_82" },
      { slot: "Abalorio 1", name: "Testamento del Libramorte", source: "ICC 25H - Libramorte", quality: "epic", id: 50363, icon: "inv_jewelry_trinket_04" },
      { slot: "Abalorio 2", name: "Calavera dentuda susurrante", source: "ICC 25H - Lady Susurramuerte", quality: "epic", id: 50343, icon: "inv_misc_bone_skull_02" },
      { slot: "Arma", name: "Agonía de sombras", source: "Misión Legendaria ICC", quality: "legendary", id: 49623, icon: "inv_axe_113" },
      { slot: "Libram", name: "Tratado sobre tres verdades", source: "Emblemas de Escarcha", quality: "epic", id: 50455, icon: "inv_misc_book_16" }
    ],
    gems: [
      { type: "meta", name: "Diamante de llama de tierra incansable", stat: "+21 Agilidad y 3% Daño Crítico", id: 41398, icon: "inv_jewelcrafting_shadowspirit_02" },
      { type: "red", name: "Rubí cardeno llamativo", stat: "+20 Fuerza", id: 40111, icon: "inv_jewelcrafting_gem_37" },
      { type: "orange", name: "Ametrino con inscripciones", stat: "+10 Fuerza y +10 Índice de Crítico", id: 40142, icon: "inv_jewelcrafting_gem_39" },
      { type: "blue", name: "Lágrima de pesadilla", stat: "+10 a todas las estadísticas (Solo 1)", id: 49110, icon: "inv_misc_gem_pearl_12" }
    ],
    enchants: [
      { slot: "Arma", name: "Rabiar", id: 59620, icon: "spell_nature_strength", stat: "Probabilidad de aumentar Poder de Ataque" },
      { slot: "Cabeza", name: "Arcanum de tormento", id: 59954, icon: "ability_warrior_rampage", stat: "+50 Poder de Ataque y +20 Crítico" },
      { slot: "Hombros", name: "Inscripción del hacha superior", id: 59934, icon: "trade_engineering", stat: "+40 Poder de Ataque y +15 Crítico" },
      { slot: "Pecho", name: "Estadísticas potentes", id: 60662, icon: "trade_engraving", stat: "+10 a todas las estadísticas" }
    ],
    rotation: [
      { name: "Sentencia de Luz/Sabiduría", description: "Mantén siempre el debuff activo. Genera maná y regeneración.", priority: 1 },
      { name: "Martillo de Cólera", description: "Usar siempre que el objetivo esté por debajo del 20% de salud.", priority: 2 },
      { name: "Tormenta Divina", description: "Tu principal ataque de área y daño físico masivo.", priority: 3 },
      { name: "Golpe de Cruzado", description: "Ataque básico constante para mantener el ritmo de daño.", priority: 4 },
      { name: "Consagración", description: "Daño sagrado constante en el suelo. Prioridad baja en single target.", priority: 5 }
    ]
  },
  "picaro-combate-335a": {
    specName: "Combate",
    className: "Pícaro",
    classColor: "yellow",
    iconUrl: "https://wotlk.ultimowow.com/static/images/wow/icons/large/ability_backstab.jpg",
    stats: [
      { label: "Índice de Golpe (Hit)", value: "8% (237 pts)", detail: "Necesitas un 8% para no fallar habilidades especiales (como Golpe Siniestro) contra jefes de raid." },
      { label: "Penetración de Armadura (ArP)", value: "1400 (100% Cap)", detail: "Tu estadística más importante. Ignorar el 100% de la armadura física del jefe dispara tu daño masivamente." },
      { label: "Pericia (Expertise)", value: "26 (Soft Cap)", detail: "Evita que el jefe esquive tus ataques frontales o laterales. Vital para no desperdiciar energía." },
      { label: "Agilidad", value: "Alta Prioridad", detail: "Aumenta tu poder de ataque, probabilidad de crítico y armadura. Estadística base fundamental." }
    ],
    bisItems: [
      { slot: "Cabeza", name: "Caperuza de hoja de las sombras santificada", source: "ICC 25H - Set T10", quality: "epic", id: 51252, icon: "inv_helmet_153" },
      { slot: "Cuello", name: "Garra de crueldad de Sindragosa", source: "ICC 25H - Sindragosa", quality: "epic", id: 50633, icon: "inv_jewelry_necklace_43" },
      { slot: "Hombros", name: "Hombreras de hoja de las sombras santificadas", source: "ICC 25H - Set T10", quality: "epic", id: 51254, icon: "inv_shoulder_121" },
      { slot: "Espalda", name: "Capa de invierno real", source: "ICC 25H - Barco", quality: "epic", id: 50628, icon: "item_icecrowncloakb" },
      { slot: "Pecho", name: "Coraza de hoja de las sombras santificada", source: "ICC 25H - Set T10", quality: "epic", id: 51250, icon: "inv_chest_leather_24" },
      { slot: "Muñeca", name: "Brazales de saliva de gárgola", source: "ICC 25H - Lady Susurramuerte", quality: "epic", id: 50611, icon: "inv_bracer_37" },
      { slot: "Manos", name: "Guantes de secretos de Aldriana", source: "ICC 25H - Carapútrea", quality: "epic", id: 51251, icon: "inv_gauntlets_83" },
      { slot: "Cintura", name: "Cincho suturado de Astilla", source: "ICC 25H - Panzachancro", quality: "epic", id: 50620, icon: "inv_belt_61" },
      { slot: "Piernas", name: "Quijotes de hoja de las sombras santificados", source: "ICC 25H - Set T10", quality: "epic", id: 51253, icon: "inv_pants_leather_23" },
      { slot: "Pies", name: "Escarines de muerte inminente", source: "Peletería - ICC", quality: "epic", id: 49950, icon: "inv_boots_leather_01" },
      { slot: "Anillo 1", name: "Sortija Cinérea de venganza infinita", source: "Reputación Veredicto Cinéreo", quality: "epic", id: 50402, icon: "inv_jewelry_ring_84" },
      { slot: "Anillo 2", name: "Sello de muchas bocas", source: "ICC 25H - Carapútrea", quality: "epic", id: 50644, icon: "inv_jewelry_ring_82" },
      { slot: "Abalorio 1", name: "Testamento de Libramorte", source: "ICC 25H - Libramorte", quality: "epic", id: 50363, icon: "inv_jewelry_trinket_04" },
      { slot: "Abalorio 2", name: "Escama Crepuscular afilada", source: "RS 25H - Halion", quality: "epic", id: 54590, icon: "inv_misc_rubysanctum1" },
      { slot: "Arma Main", name: "Hoja de veneno de sangre", source: "ICC 25H - Libramorte", quality: "epic", id: 50672, icon: "inv_sword_149" },
      { slot: "Arma Off", name: "Hoja de veneno de sangre", source: "ICC 25H - Libramorte", quality: "epic", id: 50672, icon: "inv_sword_149" },
      { slot: "Rango", name: "Lanzagranadas de Rowen", source: "ICC 25H - Barco", quality: "epic", id: 50733, icon: "inv_weapon_rifle_33" }
    ],
    gems: [
      { type: "meta", name: "Diamante de llama de cielo caótico", stat: "+21 Índice de golpe crítico y 3% Daño crítico aumentado", id: 41285, icon: "inv_misc_gem_diamond_07" },
      { type: "red", name: "Rubí cardeno fracturado", stat: "+20 Penetración de Armadura", id: 40117, icon: "inv_misc_gem_ruby_01" },
      { type: "orange", name: "Ametrino con inscripciones", stat: "+10 Agilidad y +10 Índice de Crítico", id: 40147, icon: "inv_misc_gem_topaz_02" },
      { type: "blue", name: "Lágrima de pesadilla", stat: "+10 a todas las estadísticas (Solo 1)", id: 49110, icon: "inv_misc_gem_pearl_04" }
    ],
    enchants: [
      { slot: "Armas", name: "Rabiar", stat: "Probabilidad de aumentar Poder de Ataque", id: 59620, icon: "ability_melee_hpane" },
      { slot: "Cabeza", name: "Arcanum de tormento", stat: "+50 Poder de Ataque y +20 Crítico", id: 59954, icon: "inv_misc_armorkit_28" },
      { slot: "Hombros", name: "Inscripción del hacha superior", stat: "+40 Poder de Ataque y +15 Crítico", id: 59934, icon: "ability_shaman_lavaburst" },
      { slot: "Pecho", name: "Estadísticas potentes", stat: "+10 a todas las estadísticas", id: 60662, icon: "spell_holy_greaterblessingofkings" }
    ],
    rotation: [
      { name: "Hacer Picadillo (Slice and Dice)", description: "Mantén este buff activo al 100% del tiempo con cualquier cantidad de puntos de combo.", priority: 1 },
      { name: "Golpe Siniestro (Sinister Strike)", description: "Tu principal generador de puntos de combo. Úsalo para cargar tus remates.", priority: 2 },
      { name: "Eviscerar (Eviscerate)", description: "Tu remate de daño masivo cuando tienes 5 puntos de combo y Hacer Picadillo está activo.", priority: 3 },
      { name: "Asesinato Múltiple / Aluvión de Acero", description: "Úsalos como CDs de ráfaga para daño explosivo o control de área masivo.", priority: 4 },
      { name: "Veneno Instantáneo / Veneno Mortal", description: "Asegúrate de tener siempre venenos aplicados en ambas armas.", priority: 5 }
    ]
  }
};
