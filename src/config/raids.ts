// WotLK Raid Configuration
// Dinámico: La configuración de raids se extrae exclusivamente de roster.json (leaderData)

export interface Raid {
  id: number;
  name: string;
  image: string;
  description: string;
  minGearScore: number;
  rules?: string;
}
