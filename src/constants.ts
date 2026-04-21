export const TEAM_NAMES: Record<string, string> = {
  fnc: "Fnatic",
  g2: "G2 Esports",
  gx: "Giant X",
  kc: "Karmine Corp",
  mkoi: "Movistar KOI",
  navi: "NAVI",
  sft: "Shifters",
  sk: "SK Gaming",
  th: "Team Heretics",
  vit: "Team Vitality",
};

export function teamName(id: string): string {
  return TEAM_NAMES[id] ?? id.toUpperCase();
}
