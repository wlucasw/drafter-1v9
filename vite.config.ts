import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.resolve(__dirname, 'champions.json');
const META_FILE = path.resolve(__dirname, 'meta.json');
const PLAYERS_FILE = path.resolve(__dirname, 'players.json');

// Maps export keys (no spaces/special chars) to display names
const EXPORT_TO_DISPLAY: Record<string, string> = {
  AurelionSol: 'Aurelion Sol',
  Belveth: "Bel'Veth",
  Chogath: "Cho'Gath",
  DrMundo: 'Dr. Mundo',
  JarvanIV: 'Jarvan IV',
  Kaisa: "Kai'Sa",
  Khazix: "Kha'Zix",
  KogMaw: "Kog'Maw",
  KSante: "K'Sante",
  Leblanc: 'LeBlanc',
  LeeSin: 'Lee Sin',
  MasterYi: 'Master Yi',
  MissFortune: 'Miss Fortune',
  MonkeyKing: 'Wukong',
  Nunu: 'Nunu & Willump',
  RekSai: "Rek'Sai",
  Renata: 'Renata Glasc',
  TahmKench: 'Tahm Kench',
  TwistedFate: 'Twisted Fate',
  Velkoz: "Vel'Koz",
  XinZhao: 'Xin Zhao',
};

const DISPLAY_TO_EXPORT: Record<string, string> = Object.fromEntries(
  Object.entries(EXPORT_TO_DISPLAY).map(([k, v]) => [v, k])
);

const toDisplay = (key: string) => EXPORT_TO_DISPLAY[key] ?? key;
const toExportKey = (name: string) => DISPLAY_TO_EXPORT[name] ?? name;

interface Counterpick { a: string; b: string; value: number }
interface Synergy { a: string; b: string; value: number }

interface ExportData {
  schema_version: string;
  kind: string;
  extracted_at: string;
  data: {
    roles: Record<string, string[]>;
    counterpicks: Counterpick[];
    metaScores?: Record<string, number>;
    synergies?: Synergy[];
  };
}

interface RoleScore { role: string; metaScore: number }
interface ChampionRelation {
  championNameConsidered: string;
  championNameRelated: string;
  relationScore: number;
  relationType: 'counter' | 'synergy';
}
interface ChampionData {
  name: string;
  role: RoleScore[];
  relations: ChampionRelation[];
}

function readMeta(): Record<string, number> {
  try {
    return JSON.parse(fs.readFileSync(META_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writeMeta(metaScores: Record<string, number>): void {
  fs.writeFileSync(META_FILE, JSON.stringify(metaScores, null, 2));
}

function exportToChampions(exportData: ExportData): ChampionData[] {
  const { roles, counterpicks, synergies = [] } = exportData.data;
  const metaScores = readMeta();

  return Object.entries(roles).map(([key, roleList]) => {
    const name = toDisplay(key);

    const role: RoleScore[] = roleList.map(r => ({
      role: r,
      metaScore: metaScores[`${key}|${r}`] ?? 0,
    }));

    const relations: ChampionRelation[] = [];

    for (const cp of counterpicks) {
      if (cp.a === key) {
        relations.push({
          championNameConsidered: name,
          championNameRelated: toDisplay(cp.b),
          relationScore: cp.value,
          relationType: 'counter',
        });
      } else if (cp.b === key) {
        relations.push({
          championNameConsidered: name,
          championNameRelated: toDisplay(cp.a),
          relationScore: -cp.value,
          relationType: 'counter',
        });
      }
    }

    for (const syn of synergies) {
      if (syn.a === key) {
        relations.push({
          championNameConsidered: name,
          championNameRelated: toDisplay(syn.b),
          relationScore: syn.value,
          relationType: 'synergy',
        });
      } else if (syn.b === key) {
        relations.push({
          championNameConsidered: name,
          championNameRelated: toDisplay(syn.a),
          relationScore: syn.value,
          relationType: 'synergy',
        });
      }
    }

    return { name, role, relations };
  });
}

function championsToExport(champions: ChampionData[], existing: ExportData): { export: ExportData; metaScores: Record<string, number> } {
  const roles: Record<string, string[]> = {};
  const metaScores: Record<string, number> = {};
  const counterpicks: Counterpick[] = [];
  const synergies: Synergy[] = [];
  const seenCounters = new Set<string>();
  const seenSynergies = new Set<string>();

  for (const champ of champions) {
    const key = toExportKey(champ.name);
    roles[key] = champ.role.map(r => r.role);

    for (const r of champ.role) {
      if (r.metaScore !== 0) {
        metaScores[`${key}|${r.role}`] = r.metaScore;
      }
    }

    for (const rel of champ.relations) {
      const aKey = toExportKey(rel.championNameConsidered);
      const bKey = toExportKey(rel.championNameRelated);

      if (rel.relationType === 'counter') {
        if (rel.relationScore > 0) {
          const cpKey = `${aKey}|${bKey}`;
          if (!seenCounters.has(cpKey)) {
            seenCounters.add(cpKey);
            counterpicks.push({ a: aKey, b: bKey, value: rel.relationScore });
          }
        } else if (rel.relationScore < 0) {
          // Store as the reverse direction (b counters a)
          const cpKey = `${bKey}|${aKey}`;
          if (!seenCounters.has(cpKey)) {
            seenCounters.add(cpKey);
            counterpicks.push({ a: bKey, b: aKey, value: -rel.relationScore });
          }
        }
      } else if (rel.relationType === 'synergy') {
        const synKey = [aKey, bKey].sort().join('|');
        if (!seenSynergies.has(synKey)) {
          seenSynergies.add(synKey);
          synergies.push({ a: aKey, b: bKey, value: rel.relationScore });
        }
      }
    }
  }

  return {
    export: {
      schema_version: existing.schema_version,
      kind: existing.kind,
      extracted_at: existing.extracted_at,
      data: { roles, counterpicks, synergies },
    },
    metaScores,
  };
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'champions-api',
      configureServer(server) {
        server.middlewares.use('/api/champions', (req, res) => {
          if (req.method === 'GET') {
            try {
              const exportData: ExportData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
              const champions = exportToChampions(exportData);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(champions));
            } catch {
              res.setHeader('Content-Type', 'application/json');
              res.end('[]');
            }
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => (body += chunk));
            req.on('end', () => {
              try {
                const champions: ChampionData[] = JSON.parse(body);
                const existing: ExportData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
                const { export: updated, metaScores } = championsToExport(champions, existing);
                fs.writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2));
                writeMeta(metaScores);
                res.setHeader('Content-Type', 'application/json');
                res.end('{"ok":true}');
              } catch {
                res.statusCode = 500;
                res.end('{"error":"save failed"}');
              }
            });
          }
        });

        server.middlewares.use('/api/players', (req, res) => {
          if (req.method === 'GET') {
            try {
              const raw = JSON.parse(fs.readFileSync(PLAYERS_FILE, 'utf-8'));
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(raw.data.rostered_seeds));
            } catch {
              res.setHeader('Content-Type', 'application/json');
              res.end('[]');
            }
          }
        });
      },
    },
  ],
});
