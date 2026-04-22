import { Role } from "./types";

import { EXPORT_TO_DISPLAY } from "./championNames";

export type ParsedChampionEntry = {
  name: string;
  role: Role;
  metaScore: number;
};

const ROLE_ALT_MAP: Record<string, Role> = {
  Top: Role.Top,
  Jungle: Role.Jungle,
  Mid: Role.Mid,
  Bot: Role.BOT,
  Support: Role.Support,
};

function child(el: Element | null, idx: number): Element | null {
  if (!el || el.children.length <= idx) return null;
  return el.children[idx];
}

export function parseChampionsHtml(html: string): ParsedChampionEntry[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const entries: ParsedChampionEntry[] = [];

  // Each champion entry is a button containing a 32x32 ddragon champion image.
  // button > img[32](champion) / div.flex-1 > span(name) + div > img[11](role) / div.flex-shrink-0 > span(score)
  const champImgs = doc.querySelectorAll('img[width="32"]');

  for (const img of Array.from(champImgs)) {
    const raw = img.getAttribute("alt");
    if (!raw) continue;
    const name = EXPORT_TO_DISPLAY[raw] ?? raw;

    const button = img.parentElement;
    if (!button || button.tagName !== "BUTTON") continue;

    const roleAlt = child(child(child(button, 1), 1), 0)?.getAttribute("alt");
    const role = roleAlt ? ROLE_ALT_MAP[roleAlt] : undefined;
    if (!role) continue;

    const scoreText = child(child(button, 2), 0)?.textContent ?? "";
    const metaScore = parseFloat(scoreText);
    if (isNaN(metaScore)) continue;

    entries.push({ name, role, metaScore });
  }

  return entries;
}
