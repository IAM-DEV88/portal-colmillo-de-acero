export interface Recognition {
  title: string;
  description: string;
  icon: string;
}

export interface FeaturedPlayer {
  playerName: string;
  recognitionIndices: number[];
}

export interface MonthData {
  featuredPlayers: FeaturedPlayer[];
}

export interface YearData {
  [month: string]: MonthData;
}

// Type for the year-month structure
type YearMonthData = {
  [month: string]: MonthData;
};

export interface FeaturedPlayersData {
  recognitions: Recognition[];
  [year: string]: YearMonthData | Recognition[];
}
