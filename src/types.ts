export enum Role {
  Top = "Top",
  Jungle = "Jungle",
  Mid = "Mid",
  ADC = "ADC",
  Support = "Support",
}

export type RoleWithMetaAndPlayerScore = {
  role: Role;
  metaScore: number;
  playerScore: number;
};

export type ChampionRelation = {
  championNameConsidered: string;
  championNameRelated: string;
  relationScore: number;
  relationType: "counter" | "synergy";
};

export type ChampionData = {
  name: string;
  role: RoleWithMetaAndPlayerScore[];
  relations: ChampionRelation[];
};
