import { EXPORT_TO_DISPLAY } from "./championNames";

export function parseRosterHtml(html: string): Record<string, [string, number][]> {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const result: Record<string, [string, number][]> = {};

  const playerLinks = doc.querySelectorAll('a[href*="/dashboard/player/"]');

  for (const link of Array.from(playerLinks)) {
    const href = link.getAttribute("href") ?? "";
    const match = href.match(/\/dashboard\/player\/([^?/]+)/);
    if (!match) continue;
    const ign = match[1].toLowerCase();

    // Structure: a → div(flex gap-2) → div(header) → div(player section)
    const section = link.parentElement?.parentElement?.parentElement;
    if (!section) continue;

    // Champion icons are 28x28; role icons are 18x18 — use width to discriminate
    const champImgs = section.querySelectorAll('img[width="28"]');
    const champions: [string, number][] = [];

    for (const img of Array.from(champImgs)) {
      const raw = img.getAttribute("alt");
      if (!raw) continue;
      const champName = EXPORT_TO_DISPLAY[raw] ?? raw;

      // img → div.relative → card div
      // card.children: [div.relative, div.min-w-0]
      // div.min-w-0.children: [span(name), div(score-row)]
      // div(score-row).children: [span(score)]
      const card = img.parentElement?.parentElement;
      const scoreText = card?.children[1]?.children[1]?.children[0]?.textContent;
      const score = scoreText ? parseInt(scoreText, 10) : 50;

      if (!isNaN(score)) {
        champions.push([champName, score]);
      }
    }

    if (champions.length > 0) {
      result[ign] = champions;
    }
  }

  return result;
}
