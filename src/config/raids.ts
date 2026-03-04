// WotLK Raid Configuration
// Dinámico: La configuración de raids se extrae exclusivamente de Supabase (leaderData) vía rosterService.

export interface Raid {
  id: number;
  name: string;
  image: string;
  description: string;
  minGearScore: number;
  rules?: string;
}
