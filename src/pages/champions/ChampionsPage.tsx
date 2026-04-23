import { useState, Dispatch, SetStateAction } from "react";
import { ChampionData, Role } from "../../types";
import { ParsedChampionEntry } from "../../parseChampionsHtml";
import ChampionEditor from "./ChampionEditor";
import ChampionDetailPanel from "./ChampionDetailPanel";
import ChampionImportModal from "./ChampionImportModal";

const ROLES = [Role.Top, Role.Jungle, Role.Mid, Role.BOT, Role.Support];

const ROLE_ICONS: Record<Role, string> = {
  [Role.Top]: "⚔️",
  [Role.Jungle]: "🌿",
  [Role.Mid]: "🔮",
  [Role.BOT]: "🏹",
  [Role.Support]: "🛡️",
};

interface Props {
  champions: ChampionData[];
  onChampionsChange: Dispatch<SetStateAction<ChampionData[]>>;
}

interface Selection {
  name: string;
  role: Role;
}

type PendingScores = Partial<Record<Role, Record<string, number>>>;

export default function ChampionsPage({ champions, onChampionsChange }: Props) {
  const [editingChampion, setEditingChampion] = useState<ChampionData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selected, setSelected] = useState<Selection | null>(null);
  const [search, setSearch] = useState("");
  const [pendingScores, setPendingScores] = useState<PendingScores>({});
  const [showImport, setShowImport] = useState(false);

  const handleSave = (champion: ChampionData) => {
    onChampionsChange((prev) => {
      const idx = prev.findIndex((c) => c.name === champion.name);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = champion;
        return updated;
      }
      return [...prev, champion];
    });
    setEditingChampion(null);
    setIsCreating(false);
  };

  const handleDelete = (name: string) => {
    onChampionsChange((prev) => prev.filter((c) => c.name !== name));
    if (selected?.name === name) setSelected(null);
  };

  const handleEdit = (champion: ChampionData) => {
    setIsCreating(false);
    setEditingChampion(champion);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingChampion({ name: "", role: [], relations: [] });
  };

  const handleCancel = () => {
    setEditingChampion(null);
    setIsCreating(false);
  };

  const handleSliderChange = (championName: string, role: Role, score: number) => {
    setPendingScores((prev) => ({
      ...prev,
      [role]: { ...prev[role], [championName]: score },
    }));
  };

  const handleSaveColumn = (role: Role) => {
    const pending = pendingScores[role];
    if (!pending || Object.keys(pending).length === 0) return;
    onChampionsChange((prev) =>
      prev.map((c) => {
        const newScore = pending[c.name];
        if (newScore === undefined) return c;
        return {
          ...c,
          role: c.role.map((r) => (r.role === role ? { ...r, metaScore: newScore } : r)),
        };
      })
    );
    setPendingScores((prev) => {
      const next = { ...prev };
      delete next[role];
      return next;
    });
  };

  const handleApplyImport = (preview: ParsedChampionEntry[]) => {
    onChampionsChange((prev) =>
      prev.map((c) => {
        const entries = preview.filter(
          (e) => e.name.toLowerCase() === c.name.toLowerCase()
        );
        if (entries.length === 0) return c;
        let roles = [...c.role];
        for (const entry of entries) {
          const idx = roles.findIndex((r) => r.role === entry.role);
          if (idx >= 0) {
            roles[idx] = { ...roles[idx], metaScore: entry.metaScore };
          } else {
            roles.push({ role: entry.role, metaScore: entry.metaScore });
          }
        }
        return { ...c, role: roles };
      })
    );
    setShowImport(false);
  };

  const handleSelect = (name: string, role: Role) => {
    setSelected((prev) =>
      prev?.name === name && prev?.role === role ? null : { name, role }
    );
  };

  const selectedChampion = selected
    ? champions.find((c) => c.name === selected.name) ?? null
    : null;

  void handleCreate;

  return (
    <div className="champions-page">
      <div className="champions-page-header">
        <h2>Champion Database</h2>
        <input
          className="text-input champions-search"
          type="text"
          placeholder="Search champion..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn-secondary import-btn" onClick={() => setShowImport(true)}>
          Import from HTML
        </button>
      </div>

      <div className="role-columns">
        {ROLES.map((role) => {
          const query = search.trim().toLowerCase();
          const rolePending = pendingScores[role] ?? {};
          const dirtyCount = Object.keys(rolePending).length;

          const roleChampions = champions
            .filter(
              (c) =>
                c.role.some((r) => r.role === role) &&
                (!query || c.name.toLowerCase().includes(query))
            )
            .sort((a, b) => {
              const aScore = a.role.find((r) => r.role === role)?.metaScore ?? 0;
              const bScore = b.role.find((r) => r.role === role)?.metaScore ?? 0;
              return bScore - aScore;
            });

          return (
            <div key={role} className="role-column">
              <div className="role-column-header">
                <span>{ROLE_ICONS[role]}</span>
                <span>{role}</span>
                <span className="role-count">{roleChampions.length}</span>
                <button
                  className={`btn-save-column${dirtyCount > 0 ? " dirty" : ""}`}
                  disabled={dirtyCount === 0}
                  onClick={() => handleSaveColumn(role)}
                >
                  {dirtyCount > 0 ? `Save (${dirtyCount})` : "Saved"}
                </button>
              </div>
              <div className="role-column-list">
                {roleChampions.map((champion) => {
                  const savedScore =
                    champion.role.find((r) => r.role === role)?.metaScore ?? 0;
                  const displayScore = rolePending[champion.name] ?? savedScore;
                  const isDirty = champion.name in rolePending;
                  const isSelected =
                    selected?.name === champion.name && selected?.role === role;
                  const scoreColor =
                    displayScore > 0
                      ? "#4ade80"
                      : displayScore < 0
                      ? "#f87171"
                      : "#9ca3af";

                  return (
                    <div
                      key={champion.name}
                      className={`role-champion-card${isSelected ? " selected" : ""}${isDirty ? " dirty" : ""}`}
                      onClick={() => handleSelect(champion.name, role)}
                    >
                      <div className="role-champion-header">
                        <span className="role-champion-name">{champion.name}</span>
                        {isDirty && <span className="dirty-dot" title="Unsaved change" />}
                        <button
                          className="btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(champion);
                          }}
                        >
                          Edit
                        </button>
                      </div>
                      <div
                        className="role-meta-slider"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="range"
                          min={-7}
                          max={7}
                          step={0.1}
                          value={displayScore}
                          onChange={(e) =>
                            handleSliderChange(
                              champion.name,
                              role,
                              Number(e.target.value)
                            )
                          }
                          className="score-slider"
                          style={{ accentColor: scoreColor }}
                        />
                        <span className="score-value" style={{ color: scoreColor }}>
                          {displayScore > 0 ? "+" : ""}
                          {displayScore}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {roleChampions.length === 0 && (
                  <div className="empty-state">No champions</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedChampion && selected && (
        <ChampionDetailPanel
          champion={selectedChampion}
          role={selected.role}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onClose={() => setSelected(null)}
        />
      )}

      {editingChampion && (
        <ChampionEditor
          champion={editingChampion}
          champions={champions}
          isNew={isCreating}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {showImport && (
        <ChampionImportModal
          champions={champions}
          onApply={handleApplyImport}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}
