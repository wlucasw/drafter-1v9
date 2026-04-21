# LoL Draft Manager

A League of Legends draft advisor that suggests picks and bans in real time based on meta viability, player proficiency, synergies, and counter matchups.

## Features

- **Draft Advisor** — step through the competitive draft sequence (5 bans + 5 picks per team, 2 phases) and get ranked champion suggestions at each step
- **Scoring engine** — weighs meta score, player proficiency, synergies with allied picks, and counters against enemy picks
- **Champion database** — create, edit, and delete champions with roles, meta scores, counters, and synergies
- **Team roster** — load player data and factor in per-player champion proficiency when scoring suggestions

## Tech Stack

- React 18 + TypeScript
- Vite (dev server + build)
- JSON file-backed API via a custom Vite middleware (`champions.json`, `players.json`, `meta.json`)

## Getting Started

In the root directory :
- Add your files :
champions.json     
players.json
- Create an empty file "meta.json" in the root directory        

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Project Structure

```
src/
  components/       # UI components (DraftPage, ChampionList, ChampionEditor, …)
  draft/
    draftEngine.ts  # Scoring and suggestion algorithms
  store.ts          # API layer (read/write champions and players)
  types.ts          # TypeScript interfaces and enums
champions.json      # Champion database
players.json        # Team roster data
meta.json           # Per-champion meta scores by role
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Compile TypeScript and bundle for production |
