import { ChampionData, PlayerData } from "./types";

export async function loadChampions(): Promise<ChampionData[]> {
  const res = await fetch('/api/champions');
  if (!res.ok) return [];
  return res.json();
}

export async function saveChampions(champions: ChampionData[]): Promise<void> {
  await fetch('/api/champions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(champions),
  });
}

export async function loadPlayers(): Promise<PlayerData[]> {
  const res = await fetch('/api/players');
  if (!res.ok) return [];
  return res.json();
}

export async function savePlayers(players: PlayerData[]): Promise<void> {
  await fetch('/api/players', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(players),
  });
}
