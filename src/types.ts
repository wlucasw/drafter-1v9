export enum Role {
  Top = "Top",
  Jungle = "Jungle",
  Mid = "Mid",
  ADC = "ADC",
  Support = "Support",
}

export type RoleScore = {
  role: Role;
  metaScore: number;
};

export type ChampionRelation = {
  championNameConsidered: string;
  championNameRelated: string;
  relationScore: number;
  relationType: "counter" | "synergy";
};

export type ChampionData = {
  name: string;
  role: RoleScore[];
  relations: ChampionRelation[];
};

export type PlayerRole = "Top" | "Jungle" | "Mid" | "Bot" | "Support";

export type PlayerData = {
  ign: string;
  firstName: string;
  lastName: string;
  role: PlayerRole;
  teamId: string;
  champions: [string, number][];
};
