import { useState, Dispatch, SetStateAction } from "react";
import { PlayerData, PlayerRole } from "../types";
import { TEAM_NAMES, teamName } from "../constants";
import PlayerEditor from "./PlayerEditor";
import ChampionSearch from "./ChampionSearch";
import { parseRosterHtml } from "../parseRosterHtml";

function getTeamFromHash(): string | null {
  const parts = window.location.hash.slice(1).split("/");
  const id = parts[1] ?? "";
  return id in TEAM_NAMES ? id : null;
}

function setTeamInHash(id: string | null) {
  window.location.hash = id ? `players/${id}` : "players";
}

const ROLES: PlayerRole[] = ["Top", "Jungle", "Mid", "Bot", "Support"];

const ROLE_ICONS: Record<PlayerRole, string> = {
  Top: "⚔️",
  Jungle: "🌿",
  Mid: "🔮",
  Bot: "🏹",
  Support: "🛡️",
};

type PendingProf = Record<string, Record<string, number>>;

function profColor(prof: number): string {
  return `hsl(${prof * 1.2}, 70%, 55%)`;
}

interface Props {
  players: PlayerData[];
  onPlayersChange: Dispatch<SetStateAction<PlayerData[]>>;
}

export default function PlayersPage({ players, onPlayersChange }: Props) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(getTeamFromHash);
  const [editingPlayer, setEditingPlayer] = useState<PlayerData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingProf, setPendingProf] = useState<PendingProf>({});
  const [addingChampFor, setAddingChampFor] = useState<string | null>(null);
  const [newChampName, setNewChampName] = useState("");
  const [newChampProf, setNewChampProf] = useState(50);
  const [addingPlayerFor, setAddingPlayerFor] = useState<PlayerRole | null>(null);
  const [playerSearch, setPlayerSearch] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importHtml, setImportHtml] = useState("");
  const [importPreview, setImportPreview] = useState<Record<string, [string, number][]> | null>(null);

  const handleSliderChange = (ign: string, champName: string, value: number) => {
    setPendingProf((prev) => ({
      ...prev,
      [ign]: { ...prev[ign], [champName]: value },
    }));
  };

  const handleSaveColumn = (ign: string) => {
    const pending = pendingProf[ign];
    if (!pending || Object.keys(pending).length === 0) return;
    onPlayersChange((prev) =>
      prev.map((p) => {
        if (p.ign !== ign) return p;
        return {
          ...p,
          champions: p.champions.map(([name, prof]) => {
            const updated = pending[name];
            return (updated !== undefined ? [name, updated] : [name, prof]) as [string, number];
          }),
        };
      })
    );
    setPendingProf((prev) => {
      const next = { ...prev };
      delete next[ign];
      return next;
    });
  };

  const handleAddChampion = (ign: string) => {
    if (!newChampName) return;
    const entry: [string, number] = [newChampName, newChampProf];
    onPlayersChange((prev) =>
      prev.map((p) => {
        if (p.ign !== ign) return p;
        return {
          ...p,
          champions: [...p.champions, entry].sort((a, b) => b[1] - a[1]) as [string, number][],
        };
      })
    );
    setNewChampName("");
    setNewChampProf(50);
    setAddingChampFor(null);
  };

  const handleRemoveChampion = (ign: string, champName: string) => {
    onPlayersChange((prev) =>
      prev.map((p) =>
        p.ign !== ign ? p : { ...p, champions: p.champions.filter(([n]) => n !== champName) }
      )
    );
    setPendingProf((prev) => {
      if (!prev[ign]) return prev;
      const next = { ...prev, [ign]: { ...prev[ign] } };
      delete next[ign][champName];
      return next;
    });
  };

  const handleParseImport = () => {
    const parsed = parseRosterHtml(importHtml);
    setImportPreview(parsed);
  };

  const handleApplyImport = () => {
    if (!importPreview) return;
    onPlayersChange((prev) =>
      prev.map((p) => {
        const key = p.ign.toLowerCase();
        if (!(key in importPreview)) return p;
        return { ...p, champions: importPreview[key] };
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

  const handleAssignPlayer = (player: PlayerData, role: PlayerRole) => {
    onPlayersChange((prev) =>
      prev.map((p) =>
        p.ign !== player.ign ? p : { ...p, teamId: selectedTeamId!, role }
      )
    );
    setAddingPlayerFor(null);
    setPlayerSearch("");
  };

  const handleSave = (player: PlayerData) => {
    onPlayersChange((prev) => {
      const idx = prev.findIndex((p) => p.ign === player.ign);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = player;
        return updated;
      }
      return [...prev, player];
    });
    setEditingPlayer(null);
    setIsCreating(false);
  };

  const handleRelease = (ign: string) => {
    onPlayersChange((prev) =>
      prev.map((p) => (p.ign !== ign ? p : { ...p, teamId: "fa" }))
    );
  };

  const handleEdit = (player: PlayerData) => {
    setIsCreating(false);
    setEditingPlayer(player);
  };

  const handleCreate = (role: PlayerRole) => {
    setAddingPlayerFor(null);
    setPlayerSearch("");
    setIsCreating(true);
    setEditingPlayer({
      ign: "",
      firstName: "",
      lastName: "",
      role,
      teamId: selectedTeamId ?? "",
      champions: [],
    });
  };

  const handleCancel = () => {
    setEditingPlayer(null);
    setIsCreating(false);
  };

  const teamPlayers = selectedTeamId
    ? players.filter((p) => p.teamId === selectedTeamId)
    : [];

  // Players available to be assigned: not already on this team
  const availablePlayers = players
    .filter(
      (p) =>
        p.teamId !== selectedTeamId &&
        (!playerSearch ||
          p.ign.toLowerCase().includes(playerSearch.toLowerCase()) ||
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(playerSearch.toLowerCase()))
    )
    .sort((a, b) => {
      // Free agents first, then alphabetical
      if (!a.teamId && b.teamId) return -1;
      if (a.teamId && !b.teamId) return 1;
      return a.ign.localeCompare(b.ign);
    });

  return (
    <div className="champions-page">
      <div className="team-selector">
        {Object.entries(TEAM_NAMES).map(([id, name]) => (
          <button
            key={id}
            className={`team-tab${selectedTeamId === id ? " active" : ""}`}
            onClick={() => {
              const next = selectedTeamId === id ? null : id;
              setTeamInHash(next);
              setSelectedTeamId(next);
              setPendingProf({});
              setAddingChampFor(null);
              setAddingPlayerFor(null);
              setPlayerSearch("");
            }}
          >
            {name}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.75rem" }}>
        <button className="btn-secondary" onClick={() => setShowImport(true)}>
          Import from HTML
        </button>
      </div>

      {!selectedTeamId && (
        <div className="empty-state" style={{ padding: "4rem", fontSize: "1rem" }}>
          Select a team above to manage its roster
        </div>
      )}

      {selectedTeamId && (
        <div className="role-columns">
          {ROLES.map((role) => {
            const player = teamPlayers.find((p) => p.role === role) ?? null;
            const ign = player?.ign ?? null;
            const ignPending = ign ? (pendingProf[ign] ?? {}) : {};
            const dirtyCount = Object.keys(ignPending).length;
            const isAddingChamp = addingChampFor !== null && addingChampFor === ign;
            const isPickingPlayer = addingPlayerFor === role;
            const existingChampNames = player?.champions.map(([n]) => n) ?? [];

            return (
              <div key={role} className="role-column">
                <div className="role-column-header">
                  <span>{ROLE_ICONS[role]}</span>
                  <span>{role}</span>
                  {player ? (
                    <>
                      <span className="role-count">{player.champions.length}</span>
                      <button
                        className={`btn-save-column${dirtyCount > 0 ? " dirty" : ""}`}
                        disabled={dirtyCount === 0}
                        onClick={() => handleSaveColumn(player.ign)}
                      >
                        {dirtyCount > 0 ? `Save (${dirtyCount})` : "Saved"}
                      </button>
                    </>
                  ) : isPickingPlayer ? (
                    <button
                      className="btn-sm"
                      style={{ marginLeft: "auto" }}
                      onClick={() => {
                        setAddingPlayerFor(null);
                        setPlayerSearch("");
                      }}
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      className="btn-sm"
                      style={{ marginLeft: "auto" }}
                      onClick={() => setAddingPlayerFor(role)}
                    >
                      + Add
                    </button>
                  )}
                </div>

                {player && (
                  <div className="player-column-info">
                    <div className="player-column-name">
                      <span className="player-ign">{player.ign}</span>
                      {player.firstName && (
                        <span className="player-realname">
                          {player.firstName} {player.lastName}
                        </span>
                      )}
                    </div>
                    <div className="player-column-actions">
                      <button className="btn-sm" onClick={() => handleEdit(player)}>
                        Edit
                      </button>
                      <button className="btn-danger" onClick={() => handleRelease(player.ign)}>
                        Delete
                      </button>
                    </div>
                  </div>
                )}

                <div className="role-column-list">
                  {/* Player picker for empty role slot */}
                  {!player && isPickingPlayer && (
                    <div className="player-picker">
                      <input
                        className="text-input"
                        value={playerSearch}
                        onChange={(e) => setPlayerSearch(e.target.value)}
                        placeholder="Search by IGN or name..."
                        autoFocus
                      />
                      <div className="player-picker-list">
                        {availablePlayers.length === 0 && (
                          <div className="empty-state">No players found</div>
                        )}
                        {availablePlayers.map((p) => (
                          <div
                            key={p.ign}
                            className="player-picker-item"
                            onClick={() => handleAssignPlayer(p, role)}
                          >
                            <div className="player-picker-info">
                              <span className="player-picker-ign">{p.ign}</span>
                              {p.firstName && (
                                <span className="player-picker-realname">
                                  {p.firstName} {p.lastName}
                                </span>
                              )}
                            </div>
                            <span
                              className={`player-picker-team${!p.teamId || p.teamId === "fa" ? " free-agent" : ""}`}
                            >
                              {!p.teamId || p.teamId === "fa" ? "Free agent" : teamName(p.teamId)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <button
                        className="btn-sm player-create-btn"
                        onClick={() => handleCreate(role)}
                      >
                        + Create new player
                      </button>
                    </div>
                  )}

                  {!player && !isPickingPlayer && (
                    <div className="empty-state">No player assigned</div>
                  )}

                  {/* Champion pool */}
                  {player &&
                    [...player.champions]
                      .sort((a, b) => b[1] - a[1])
                      .map(([name, savedProf]) => {
                        const displayProf =
                          ign && ignPending[name] !== undefined ? ignPending[name] : savedProf;
                        const isDirty = ign ? name in ignPending : false;
                        const color = profColor(displayProf);

                        return (
                          <div
                            key={name}
                            className={`role-champion-card${isDirty ? " dirty" : ""}`}
                          >
                            <div className="role-champion-header">
                              <span className="role-champion-name">{name}</span>
                              {isDirty && <span className="dirty-dot" title="Unsaved change" />}
                              <button
                                className="btn-remove"
                                onClick={() => ign && handleRemoveChampion(ign, name)}
                              >
                                ✕
                              </button>
                            </div>
                            <div
                              className="role-meta-slider"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="range"
                                min={0}
                                max={100}
                                step={1}
                                value={displayProf}
                                onChange={(e) =>
                                  ign && handleSliderChange(ign, name, Number(e.target.value))
                                }
                                className="score-slider"
                                style={{ accentColor: color }}
                              />
                              <span className="score-value" style={{ color }}>
                                {displayProf}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                  {player && player.champions.length === 0 && !isAddingChamp && (
                    <div className="empty-state">No champions in pool</div>
                  )}

                  {player && !isAddingChamp && (
                    <button
                      className="btn-sm player-add-champ-btn"
                      onClick={() => {
                        setAddingChampFor(ign);
                        setNewChampName("");
                        setNewChampProf(50);
                      }}
                    >
                      + Champion
                    </button>
                  )}

                  {player && isAddingChamp && (
                    <div className="inline-form player-champ-form">
                      <ChampionSearch
                        value={newChampName}
                        onChange={setNewChampName}
                        exclude={existingChampNames}
                        placeholder="Search champion..."
                      />
                      <div className="proficiency-slider-row">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={newChampProf}
                          onChange={(e) => setNewChampProf(Number(e.target.value))}
                          className="score-slider"
                          style={{ accentColor: profColor(newChampProf) }}
                        />
                        <span className="score-value" style={{ color: profColor(newChampProf) }}>
                          {newChampProf}
                        </span>
                      </div>
                      <div className="player-champ-form-actions">
                        <button
                          className="btn-secondary"
                          onClick={() => setAddingChampFor(null)}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn-primary btn-sm"
                          onClick={() => ign && handleAddChampion(ign)}
                          disabled={!newChampName}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingPlayer && (
        <PlayerEditor
          player={editingPlayer}
          isNew={isCreating}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {showImport && (
        <div className="modal-overlay" onClick={handleCloseImport}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Import Champion Pools from HTML</h2>
              <button className="close-btn" onClick={handleCloseImport}>×</button>
            </div>
            <div className="modal-body">
              {!importPreview ? (
                <div className="form-group">
                  <label style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                    Paste the full page HTML (e.g. from Legends Manager 26 champion pool page)
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
                  <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
                    Found champion pools for {Object.keys(importPreview).length} player(s).
                    Existing players will have their pools replaced.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {Object.entries(importPreview).map(([ign, champs]) => {
                      const matched = players.find((p) => p.ign.toLowerCase() === ign);
                      return (
                        <div
                          key={ign}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            padding: "0.5rem 0.75rem",
                            background: "var(--bg-input)",
                            border: `1px solid ${matched ? "var(--border)" : "rgba(248,113,113,0.3)"}`,
                            borderRadius: "4px",
                          }}
                        >
                          <span style={{ fontWeight: 600, color: matched ? "var(--text)" : "var(--red)", minWidth: "120px" }}>
                            {matched ? matched.ign : ign}
                          </span>
                          <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                            {champs.length} champions
                          </span>
                          {!matched && (
                            <span style={{ color: "var(--red)", fontSize: "0.75rem", marginLeft: "auto" }}>
                              no match — will be skipped
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
                  disabled={Object.keys(importPreview).every(
                    (ign) => !players.find((p) => p.ign.toLowerCase() === ign)
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
