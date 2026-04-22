import { useState, Dispatch, SetStateAction } from "react";
import { ChampionData, ChampionRelation, Role } from "../types";
import ChampionEditor from "./ChampionEditor";
import { parseChampionsHtml, ParsedChampionEntry } from "../parseChampionsHtml";

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

function getRelations(champion: ChampionData) {
  const toEntry = (r: ChampionRelation) => ({
    name:
      r.championNameConsidered === champion.name
        ? r.championNameRelated
        : r.championNameConsidered,
    score: r.relationScore,
  });

  const synergies = champion.relations
    .filter((r) => r.relationType === "synergy")
    .map(toEntry)
    .sort((a, b) => b.score - a.score);

  const counters = champion.relations
    .filter((r) => r.relationType === "counter")
    .map(toEntry)
    .sort((a, b) => b.score - a.score);

  return { synergies, counters };
}

export default function ChampionsPage({ champions, onChampionsChange }: Props) {
  const [editingChampion, setEditingChampion] = useState<ChampionData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selected, setSelected] = useState<Selection | null>(null);
  const [search, setSearch] = useState("");
  const [pendingScores, setPendingScores] = useState<PendingScores>({});
  const [showImport, setShowImport] = useState(false);
  const [importHtml, setImportHtml] = useState("");
  const [importPreview, setImportPreview] = useState<ParsedChampionEntry[] | null>(null);

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

  const handleParseImport = () => {
    setImportPreview(parseChampionsHtml(importHtml));
  };

  const handleApplyImport = () => {
    if (!importPreview) return;
    onChampionsChange((prev) =>
      prev.map((c) => {
        const entries = importPreview.filter(
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
    setImportHtml("");
    setImportPreview(null);
  };

  const handleCloseImport = () => {
    setShowImport(false);
    setImportHtml("");
    setImportPreview(null);
  };

  const handleSelect = (name: string, role: Role) => {
    setSelected((prev) =>
      prev?.name === name && prev?.role === role ? null : { name, role }
    );
  };

  const selectedChampion = selected
    ? champions.find((c) => c.name === selected.name) ?? null
    : null;

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

          // Sort by saved score to keep order stable while sliding
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
        <div className="champion-detail-panel">
          <div className="champion-detail-header">
            <h3>
              {selectedChampion.name}{" "}
              <span className="detail-role">— {selected.role}</span>
            </h3>
            <button
              className="btn-secondary"
              onClick={() => handleEdit(selectedChampion)}
            >
              Edit
            </button>
            <button
              className="btn-danger"
              onClick={() => handleDelete(selectedChampion.name)}
            >
              Delete
            </button>
            <button className="close-btn" onClick={() => setSelected(null)}>
              ×
            </button>
          </div>
          {(() => {
            const { synergies, counters } = getRelations(selectedChampion);
            return (
              <div className="champion-detail-relations">
                <div className="champion-detail-section">
                  <h4 className="detail-section-title synergy-title">
                    Synergies ({synergies.length})
                  </h4>
                  {synergies.length === 0 ? (
                    <div className="empty-state">No synergies</div>
                  ) : (
                    synergies.map((s) => (
                      <div key={s.name} className="relation-row synergy">
                        <span className="relation-type-badge synergy">Synergy</span>
                        <span className="related-champion">{s.name}</span>
                        <span
                          className="relation-score"
                          style={{ color: s.score > 0 ? "#4ade80" : "#f87171" }}
                        >
                          {s.score > 0 ? "+" : ""}
                          {s.score}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className="champion-detail-section">
                  <h4 className="detail-section-title counter-title">
                    Counters ({counters.length})
                  </h4>
                  {counters.length === 0 ? (
                    <div className="empty-state">No counters</div>
                  ) : (
                    counters.map((c) => (
                      <div key={c.name} className="relation-row counter">
                        <span className="relation-type-badge counter">Counter</span>
                        <span className="related-champion">{c.name}</span>
                        <span
                          className="relation-score"
                          style={{ color: c.score > 0 ? "#4ade80" : "#f87171" }}
                        >
                          {c.score > 0 ? "+" : ""}
                          {c.score}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })()}
        </div>
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
        <div className="modal-overlay" onClick={handleCloseImport}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Import Meta Scores from HTML</h2>
              <button className="close-btn" onClick={handleCloseImport}>×</button>
            </div>
            <div className="modal-body">
              {!importPreview ? (
                <div className="form-group">
                  <label style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                    Paste the full page HTML (e.g. from the Legends Manager 26 champions page)
                  </label>
                  <textarea
                    className="text-input"
                    style={{ minHeight: "200px", fontFamily: "monospace", fontSize: "0.75rem" }}
                    value={importHtml}
                    onChange={(e) => setImportHtml(e.target.value)}
                    placeholder="Paste HTML here…"
                  />
                </div>
              ) : (
                <div className="form-group">
                  {(() => {
                    const matched = importPreview.filter((e) =>
                      champions.some((c) => c.name.toLowerCase() === e.name.toLowerCase())
                    );
                    const unmatched = importPreview.filter(
                      (e) => !champions.some((c) => c.name.toLowerCase() === e.name.toLowerCase())
                    );
                    return (
                      <>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                          Found <strong style={{ color: "var(--text)" }}>{importPreview.length}</strong> entries —{" "}
                          <strong style={{ color: "var(--green)" }}>{matched.length}</strong> matched,{" "}
                          <strong style={{ color: "var(--red)" }}>{unmatched.length}</strong> not in database (will be skipped).
                        </p>
                        {unmatched.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.75rem" }}>
                            {unmatched.map((e) => (
                              <span
                                key={`${e.name}-${e.role}`}
                                style={{
                                  padding: "0.2rem 0.5rem",
                                  background: "rgba(248,113,113,0.1)",
                                  border: "1px solid rgba(248,113,113,0.3)",
                                  borderRadius: "4px",
                                  fontSize: "0.75rem",
                                  color: "var(--red)",
                                }}
                              >
                                {e.name} ({e.role})
                              </span>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={handleCloseImport}>Cancel</button>
              {!importPreview ? (
                <button
                  className="btn-primary"
                  onClick={handleParseImport}
                  disabled={!importHtml.trim()}
                >
                  Parse
                </button>
              ) : (
                <button
                  className="btn-primary"
                  onClick={handleApplyImport}
                  disabled={!importPreview.some((e) =>
                    champions.some((c) => c.name.toLowerCase() === e.name.toLowerCase())
                  )}
                >
                  Apply Import
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
