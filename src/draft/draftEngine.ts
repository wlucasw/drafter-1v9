import { ChampionData, Role } from "../types";

export type Team = "blue" | "red";
export type SlotKind = "ban" | "pick";

export type DraftSlotDef = {
  team: Team;
  kind: SlotKind;
  phase: 1 | 2;
};

// Standard competitive draft order (5 bans + 5 picks per team, 20 slots total)
export const DRAFT_SEQUENCE: DraftSlotDef[] = [
  // Phase 1 bans
  { team: "blue", kind: "ban", phase: 1 },
  { team: "red", kind: "ban", phase: 1 },
  { team: "blue", kind: "ban", phase: 1 },
  { team: "red", kind: "ban", phase: 1 },
  { team: "blue", kind: "ban", phase: 1 },
  { team: "red", kind: "ban", phase: 1 },
  // Phase 1 picks
  { team: "blue", kind: "pick", phase: 1 },
  { team: "red", kind: "pick", phase: 1 },
  { team: "red", kind: "pick", phase: 1 },
  { team: "blue", kind: "pick", phase: 1 },
  { team: "blue", kind: "pick", phase: 1 },
  { team: "red", kind: "pick", phase: 1 },
  // Phase 2 bans (red first)
  { team: "red", kind: "ban", phase: 2 },
  { team: "blue", kind: "ban", phase: 2 },
  { team: "red", kind: "ban", phase: 2 },
  { team: "blue", kind: "ban", phase: 2 },
  // Phase 2 picks
  { team: "red", kind: "pick", phase: 2 },
  { team: "blue", kind: "pick", phase: 2 },
  { team: "blue", kind: "pick", phase: 2 },
  { team: "red", kind: "pick", phase: 2 },
];

export type ScoreBreakdown = {
  total: number;
  base: number;
  synergy: number;
  counter: number;
};

export type ChampionSuggestion = {
  champion: ChampionData;
  role: Role | null;
  score: ScoreBreakdown;
};

// Returns player proficiency score (0–5) for a champion at a role, given a playerScoreFn.
// playerScoreFn is provided by the caller based on the selected team's roster.
export function computeChampionScore(
  champion: ChampionData,
  role: Role | null,
  alliedPicks: string[],
  enemyPicks: string[],
  allChampions: ChampionData[],
  playerScoreFn?: (championName: string, role: Role) => number
): ScoreBreakdown {
  const roleScore = (r: { metaScore: number; role: Role }) => {
    const meta = r.metaScore/3;
    const player = playerScoreFn ? playerScoreFn(champion.name, r.role)/2 : 0;
    return meta + player;
  };

  let base = 0;
  if (role) {
    const r = champion.role.find((r) => r.role === role);
    base = r ? roleScore(r) : -10;
  } else if (champion.role.length > 0) {
    base = Math.max(...champion.role.map(roleScore));
  }

  // Synergy with already-picked allies (both directions, deduplicated by pair)
  let synergy = 0;
  const synergyPairs = new Set<string>();
  const addSynergy = (a: string, b: string, score: number) => {
    const key = [a, b].sort().join("||");
    if (!synergyPairs.has(key)) {
      synergyPairs.add(key);
      synergy += score;
    }
  };
  for (const rel of champion.relations) {
    if (rel.relationType === "synergy" && alliedPicks.includes(rel.championNameRelated)) {
      addSynergy(champion.name, rel.championNameRelated, rel.relationScore);
    }
  }
  for (const allyName of alliedPicks) {
    const ally = allChampions.find((c) => c.name === allyName);
    if (!ally) continue;
    for (const rel of ally.relations) {
      if (rel.relationType === "synergy" && rel.championNameRelated === champion.name) {
        addSynergy(champion.name, allyName, rel.relationScore);
      }
    }
  }

  // Counter dynamics:
  // – enemy counters C  → negative (already encoded as negative relationScore on C)
  // – C counters enemy  → positive (read from enemy's relations, invert their negative score)
  let counter = 0;
  for (const rel of champion.relations) {
    if (rel.relationType === "counter" && enemyPicks.includes(rel.championNameRelated)) {
      counter += rel.relationScore/2;
    }
  }
  for (const enemyName of enemyPicks) {
    const enemy = allChampions.find((c) => c.name === enemyName);
    if (!enemy) continue;
    for (const rel of enemy.relations) {
      if (rel.relationType === "counter" && rel.championNameRelated === champion.name) {
        counter += -rel.relationScore/2;
      }
    }
  }

  return { total: base + synergy + counter, base, synergy, counter };
}

export function getSuggestions(
  allChampions: ChampionData[],
  takenNames: string[],
  alliedPicks: string[],
  enemyPicks: string[],
  role: Role | null,
  playerScoreFn?: (championName: string, role: Role) => number
): ChampionSuggestion[] {
  const available = allChampions.filter(
    (c) =>
      !takenNames.includes(c.name) &&
      (role === null || c.role.some((r) => r.role === role))
  );

  return available
    .map((champion) => ({
      champion,
      role,
      score: computeChampionScore(champion, role, alliedPicks, enemyPicks, allChampions, playerScoreFn),
    }))
    .sort((a, b) => b.score.total - a.score.total);
}

export function computeTeamScore(
  teamSlotIndices: number[],
  slots: { championName: string | null; role: Role | null }[],
  alliedPickNames: string[],
  enemyPickNames: string[],
  allChampions: ChampionData[],
  playerScoreFn?: (championName: string, role: Role) => number
): number {
  let total = 0;
  for (const i of teamSlotIndices) {
    const { championName, role } = slots[i];
    if (!championName) continue;
    const champ = allChampions.find((c) => c.name === championName);
    if (!champ) continue;
    const allies = alliedPickNames.filter((n) => n !== championName);
    total += computeChampionScore(champ, role, allies, enemyPickNames, allChampions, playerScoreFn).total;
  }
  return total;
}
