import { useState, useMemo, useEffect } from "react";
import { ChampionData, PlayerData, Role } from "../types";
import { loadPlayers } from "../store";
import {
  DRAFT_SEQUENCE,
  getSuggestions,
  computeTeamScore,
  Team,
} from "../draft/draftEngine";
import { teamName } from "../constants";

interface Props {
  champions: ChampionData[];
}

type SlotState = {
  championName: string | null;
  role: Role | null;
};

type BoFormat = "BO1" | "BO3" | "BO5";

const ROLES = Object.values(Role);

function fmt(n: number): string {
  return (n >= 0 ? "+" : "") + n.toFixed(1);
}

function scoreClass(n: number) {
  return n > 0 ? "pos" : n < 0 ? "neg" : "";
}

// Maps Role enum (BOT) to player data role field (Bot)
function roleToPlayerRole(role: Role): string {
  return role === Role.BOT ? "Bot" : role;
}

// Builds a playerScoreFn for a given team's players.
// Returns proficiency / 20 so scale matches metaScore range (~0–5).
function makePlayerScoreFn(players: PlayerData[], teamId: string) {
  const roster = players.filter((p) => p.teamId === teamId);
  return (championName: string, role: Role): number => {
    const playerRole = roleToPlayerRole(role);
    const player = roster.find((p) => p.role === playerRole);
    if (!player) return -5;
    const entry = player.champions.find(([name]) => name === championName);
    return entry ? ((entry[1] / 10) - 5) : -5;
  };
}

const SLOT_INDICES = {
  blueBans: DRAFT_SEQUENCE.map((d, i) => ({ d, i }))
    .filter(({ d }) => d.team === "blue" && d.kind === "ban")
    .map(({ i }) => i),
  redBans: DRAFT_SEQUENCE.map((d, i) => ({ d, i }))
    .filter(({ d }) => d.team === "red" && d.kind === "ban")
    .map(({ i }) => i),
  bluePicks: DRAFT_SEQUENCE.map((d, i) => ({ d, i }))
    .filter(({ d }) => d.team === "blue" && d.kind === "pick")
    .map(({ i }) => i),
  redPicks: DRAFT_SEQUENCE.map((d, i) => ({ d, i }))
    .filter(({ d }) => d.team === "red" && d.kind === "pick")
    .map(({ i }) => i),
};

export default function DraftPage({ champions }: Props) {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [boFormat, setBoFormat] = useState<BoFormat | null>(null);
  const [gameNumber, setGameNumber] = useState(1);
  const [playedChampions, setPlayedChampions] = useState<string[]>([]);
  const [boTeams, setBoTeams] = useState<[string, string] | null>(null);
  const [betweenGames, setBetweenGames] = useState(false);
  const [blueTeamId, setBlueTeamId] = useState<string | null>(null);
  const [redTeamId, setRedTeamId] = useState<string | null>(null);
  const [mySide, setMySide] = useState<Team | null>(null);
  const [slots, setSlots] = useState<SlotState[]>(
    DRAFT_SEQUENCE.map(() => ({ championName: null, role: null }))
  );
  const [activeSlot, setActiveSlot] = useState(0);
  const [roleFilter, setRoleFilter] = useState<Role | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadPlayers().then(setPlayers);
  }, []);

  const teamIds = useMemo(
    () => [...new Set(players.map((p) => p.teamId))].sort(),
    [players]
  );

  const blueScoreFn = useMemo(
    () => (blueTeamId ? makePlayerScoreFn(players, blueTeamId) : undefined),
    [players, blueTeamId]
  );
  const redScoreFn = useMemo(
    () => (redTeamId ? makePlayerScoreFn(players, redTeamId) : undefined),
    [players, redTeamId]
  );

  const maxGames = boFormat === "BO5" ? 5 : boFormat === "BO3" ? 3 : 1;

  const activeDef = DRAFT_SEQUENCE[activeSlot] ?? DRAFT_SEQUENCE[19];
  const isDraftComplete = activeSlot >= DRAFT_SEQUENCE.length;
  const activeScoreFn = activeDef.team === "blue" ? blueScoreFn : redScoreFn;

  const allTaken = [
    ...slots
      .map((s, i) => (i === activeSlot ? null : s.championName))
      .filter(Boolean),
    ...playedChampions,
  ] as string[];

  const bluePicks = SLOT_INDICES.bluePicks
    .map((i) => slots[i].championName)
    .filter(Boolean) as string[];
  const redPicks = SLOT_INDICES.redPicks
    .map((i) => slots[i].championName)
    .filter(Boolean) as string[];

  const alliedPicks = activeDef.team === "blue" ? bluePicks : redPicks;
  const enemyPicks = activeDef.team === "blue" ? redPicks : bluePicks;

  const suggestions = useMemo(() => {
    if (isDraftComplete) return [];
    if (activeDef.kind === "ban") {
      return getSuggestions(champions, allTaken, [], alliedPicks, null, activeScoreFn);
    }
    return getSuggestions(champions, allTaken, alliedPicks, enemyPicks, roleFilter, activeScoreFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots, activeSlot, roleFilter, champions, blueScoreFn, redScoreFn]);

  const visibleSuggestions = useMemo(() => {
    if (!search) return suggestions.slice(0, 25);
    return suggestions
      .filter((s) => s.champion.name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 25);
  }, [suggestions, search]);

  const blueScore = useMemo(
    () => computeTeamScore(SLOT_INDICES.bluePicks, slots, bluePicks, redPicks, champions, blueScoreFn),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slots, champions, blueScoreFn]
  );
  const redScore = useMemo(
    () => computeTeamScore(SLOT_INDICES.redPicks, slots, redPicks, bluePicks, champions, redScoreFn),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slots, champions, redScoreFn]
  );

  const phaseLabel = (() => {
    if (activeSlot < 6) return "Phase 1 — Bans";
    if (activeSlot < 12) return "Phase 1 — Picks";
    if (activeSlot < 16) return "Phase 2 — Bans";
    return "Phase 2 — Picks";
  })();

  const handleSelect = (championName: string) => {
    const role = activeDef.kind === "pick" ? roleFilter : null;
    const newSlots = slots.map((s, i) =>
      i === activeSlot ? { championName, role } : s
    );
    setSlots(newSlots);
    setSearch("");

    let next = activeSlot + 1;
    while (next < DRAFT_SEQUENCE.length && newSlots[next].championName !== null) {
      next++;
    }
    setActiveSlot(next);
    if (next < DRAFT_SEQUENCE.length && DRAFT_SEQUENCE[next].kind !== "pick") {
      setRoleFilter(null);
    }
  };

  const handleSlotClick = (i: number) => {
    setActiveSlot(i);
    setSearch("");
    if (DRAFT_SEQUENCE[i].kind !== "pick") setRoleFilter(null);
  };

  const handleReset = () => {
    setSlots(DRAFT_SEQUENCE.map(() => ({ championName: null, role: null })));
    setActiveSlot(0);
    setRoleFilter(null);
    setSearch("");
    setMySide(null);
    setBlueTeamId(null);
    setRedTeamId(null);
    setBoFormat(null);
    setGameNumber(1);
    setPlayedChampions([]);
    setBoTeams(null);
    setBetweenGames(false);
  };

  const handleNextGame = () => {
    const currentPicks = [...SLOT_INDICES.bluePicks, ...SLOT_INDICES.redPicks]
      .map((i) => slots[i].championName)
      .filter(Boolean) as string[];
    setPlayedChampions((prev) => [...prev, ...currentPicks]);
    setGameNumber((prev) => prev + 1);
    setSlots(DRAFT_SEQUENCE.map(() => ({ championName: null, role: null })));
    setActiveSlot(0);
    setRoleFilter(null);
    setSearch("");
    setMySide(null);
    setBlueTeamId(null);
    setRedTeamId(null);
    setBetweenGames(true);
  };

  const renderBanSlot = (slotIndex: number, seq: number) => {
    const slot = slots[slotIndex];
    const isActive = slotIndex === activeSlot;
    return (
      <div
        key={slotIndex}
        className={`draft-ban-slot${isActive ? " active" : ""}${slot.championName ? " filled" : ""}`}
        onClick={() => handleSlotClick(slotIndex)}
        title={slot.championName ?? `Ban ${seq}`}
      >
        {slot.championName ? (
          <span className="ban-champ-name">{slot.championName}</span>
        ) : (
          <span className="ban-slot-empty">{isActive ? "▶" : seq}</span>
        )}
      </div>
    );
  };

  const renderPickSlot = (slotIndex: number, pickNum: number) => {
    const slot = slots[slotIndex];
    const isActive = slotIndex === activeSlot;
    const team = DRAFT_SEQUENCE[slotIndex].team;
    return (
      <div
        key={slotIndex}
        className={`draft-pick-slot ${team}${isActive ? " active" : ""}${slot.championName ? " filled" : ""}`}
        onClick={() => handleSlotClick(slotIndex)}
      >
        <span className="pick-seq">#{pickNum}</span>
        <div className="pick-info">
          {slot.role && <span className="pick-role-tag">{slot.role}</span>}
          <span className="pick-champ-name">
            {slot.championName ?? (isActive ? "← Select" : "—")}
          </span>
        </div>
      </div>
    );
  };

  const scoreTotal = blueScore + redScore;
  const blueWidth = scoreTotal !== 0
    ? Math.round((Math.max(blueScore, 0) / Math.max(blueScore + redScore, 1)) * 100)
    : 50;

  // ── Between-games side assignment ──
  if (betweenGames && boTeams && (!blueTeamId || !mySide)) {
    const [teamA, teamB] = boTeams;
    if (!blueTeamId) {
      return (
        <div className="side-selection">
          <div className="bo-game-badge-large">Game {gameNumber} of {maxGames}</div>
          <h2 className="side-selection-title">Which team plays Blue Side?</h2>
          {playedChampions.length > 0 && (
            <div className="fearless-notice">
              Fearless draft — {playedChampions.length} champion{playedChampions.length !== 1 ? "s" : ""} locked out from previous game{gameNumber > 2 ? "s" : ""}
            </div>
          )}
          <div className="side-selection-cards">
            <button
              className="side-card blue"
              onClick={() => { setBlueTeamId(teamA); setRedTeamId(teamB); }}
            >
              <span className="side-card-name">{teamName(teamA)}</span>
              <span className="side-card-hint">Blue Side · First pick</span>
            </button>
            <button
              className="side-card red"
              onClick={() => { setBlueTeamId(teamB); setRedTeamId(teamA); }}
            >
              <span className="side-card-name">{teamName(teamB)}</span>
              <span className="side-card-hint">Blue Side · First pick</span>
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="side-selection">
        <div className="bo-game-badge-large">Game {gameNumber} of {maxGames}</div>
        <h2 className="side-selection-title">Which side are you advising?</h2>
        <div className="side-selection-cards">
          <button className="side-card blue" onClick={() => setMySide("blue")}>
            <span className="side-card-icon">🔵</span>
            <span className="side-card-name">{teamName(blueTeamId)}</span>
            <span className="side-card-hint">Blue Side · First pick</span>
          </button>
          <button className="side-card red" onClick={() => setMySide("red")}>
            <span className="side-card-icon">🔴</span>
            <span className="side-card-name">{teamName(redTeamId!)}</span>
            <span className="side-card-hint">Red Side · Last pick</span>
          </button>
        </div>
        <button
          className="btn-secondary"
          style={{ marginTop: "1rem" }}
          onClick={() => { setBlueTeamId(null); setRedTeamId(null); }}
        >
          ← Back
        </button>
      </div>
    );
  }

  // ── Initial setup screen ──
  if (!boFormat || !blueTeamId || !redTeamId || !mySide) {
    const step = !boFormat ? "format" : !blueTeamId ? "blue" : !redTeamId ? "red" : "side";

    const renderTeamGrid = (onSelect: (id: string) => void, excludeId: string | null) => (
      <div className="team-grid">
        {teamIds.map((id) => {
          const roster = players.filter((p) => p.teamId === id);
          if (id === "fa") return null;
          return (
            <button
              key={id}
              className={`team-card${id === excludeId ? " disabled" : ""}`}
              onClick={() => id !== excludeId && onSelect(id)}
              disabled={id === excludeId}
            >
              <span className="team-card-name">{teamName(id)}</span>
              <span className="team-card-players">
                {roster.map((p) => p.ign).join(" · ")}
              </span>
            </button>
          );
        })}
      </div>
    );

    return (
      <div className="side-selection">
        {step === "format" && (
          <>
            <h2 className="side-selection-title">Series Format</h2>
            <div className="side-selection-cards">
              {(["BO1", "BO3", "BO5"] as BoFormat[]).map((f) => (
                <button key={f} className="side-card neutral" onClick={() => setBoFormat(f)}>
                  <span className="side-card-name">{f}</span>
                  <span className="side-card-hint">
                    {f === "BO1" ? "Single game" : f === "BO3" ? "Best of 3 · Fearless" : "Best of 5 · Fearless"}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
        {step === "blue" && (
          <>
            <h2 className="side-selection-title">Blue Side Team</h2>
            {renderTeamGrid((id) => setBlueTeamId(id), null)}
          </>
        )}
        {step === "red" && (
          <>
            <h2 className="side-selection-title">Red Side Team</h2>
            {renderTeamGrid((id) => { setRedTeamId(id); setBoTeams([blueTeamId!, id]); }, blueTeamId)}
          </>
        )}
        {step === "side" && (
          <>
            <h2 className="side-selection-title">Which side are you advising?</h2>
            <div className="side-selection-cards">
              <button className="side-card blue" onClick={() => setMySide("blue")}>
                <span className="side-card-icon">🔵</span>
                <span className="side-card-name">{teamName(blueTeamId!)}</span>
                <span className="side-card-hint">Blue Side · First pick</span>
              </button>
              <button className="side-card red" onClick={() => setMySide("red")}>
                <span className="side-card-icon">🔴</span>
                <span className="side-card-name">{teamName(redTeamId!)}</span>
                <span className="side-card-hint">Red Side · Last pick</span>
              </button>
            </div>
            <button className="btn-secondary" style={{ marginTop: "1rem" }} onClick={() => setRedTeamId(null)}>
              ← Back
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="draft-page">
      {/* ── Header ── */}
      <div className="draft-header">
        <div className="draft-phase-info">
          {!isDraftComplete ? (
            <>
              <span className="draft-phase-label">{phaseLabel}</span>
              {maxGames > 1 && (
                <span className="bo-game-badge">G{gameNumber}/{maxGames}</span>
              )}
              <span className={`draft-turn-badge ${activeDef.team}`}>
                {activeDef.team === "blue" ? teamName(blueTeamId) : teamName(redTeamId)} —{" "}
                {activeDef.kind === "ban" ? "Ban" : "Pick"}
              </span>
            </>
          ) : (
            <>
              <span className="draft-phase-label">
                {maxGames > 1 ? `Game ${gameNumber} Complete` : "Draft Complete"}
              </span>
              {maxGames > 1 && (
                <span className="bo-game-badge">G{gameNumber}/{maxGames}</span>
              )}
            </>
          )}
        </div>

        <div className="draft-score-display">
          <span className="blue-score-label">{fmt(blueScore)}</span>
          <div className="score-bar-track">
            <div className="score-bar-blue" style={{ width: `${blueWidth}%` }} />
          </div>
          <span className="red-score-label">{fmt(redScore)}</span>
        </div>

        <button className="btn-secondary" onClick={handleReset}>
          Reset
        </button>
      </div>

      {/* ── Board ── */}
      <div className="draft-board">
        {/* Blue team */}
        <div className="draft-team blue">
          <div className="team-title blue">{teamName(blueTeamId)}</div>
          <div className="team-section">
            <div className="section-label">Bans</div>
            <div className="bans-row">
              {SLOT_INDICES.blueBans.map((i, seq) => renderBanSlot(i, seq + 1))}
            </div>
          </div>
          <div className="team-section">
            <div className="section-label">Picks</div>
            <div className="picks-list">
              {SLOT_INDICES.bluePicks.map((i, n) => renderPickSlot(i, n + 1))}
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div className="draft-suggestions">
          {isDraftComplete ? (
            <div className="draft-complete">
              <div className="draft-complete-icon">🏆</div>
              <h3>{maxGames > 1 ? `Game ${gameNumber} Complete` : "Draft Complete"}</h3>
              <p>
                {teamName(blueTeamId)} <strong className="blue-text">{fmt(blueScore)}</strong>
                {" vs "}
                {teamName(redTeamId)} <strong className="red-text">{fmt(redScore)}</strong>
              </p>
              {gameNumber < maxGames && (
                <button
                  className="btn-primary"
                  style={{ marginTop: "1rem" }}
                  onClick={handleNextGame}
                >
                  Start Game {gameNumber + 1}
                </button>
              )}
              <button
                className={gameNumber < maxGames ? "btn-secondary" : "btn-primary"}
                style={{ marginTop: "0.5rem" }}
                onClick={handleReset}
              >
                {gameNumber < maxGames ? "End Series" : "New Draft"}
              </button>
            </div>
          ) : (
            <>
              <div className="suggestions-top">
                {activeDef.kind === "pick" && (
                  <div className="role-filters">
                    <button
                      className={`role-filter-btn${roleFilter === null ? " active" : ""}`}
                      onClick={() => setRoleFilter(null)}
                    >
                      All
                    </button>
                    {ROLES.map((r) => (
                      <button
                        key={r}
                        className={`role-filter-btn${roleFilter === r ? " active" : ""}`}
                        onClick={() => setRoleFilter(roleFilter === r ? null : r)}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
                {activeDef.kind === "ban" && (
                  <div className="ban-hint">
                    Sorted by threat level to {activeDef.team === "blue" ? teamName(blueTeamId) : teamName(redTeamId)}
                  </div>
                )}
                {playedChampions.length > 0 && (
                  <div className="fearless-notice">
                    Fearless — {playedChampions.length} champion{playedChampions.length !== 1 ? "s" : ""} locked out
                  </div>
                )}
                <input
                  type="text"
                  className="text-input"
                  placeholder="Search champion..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="suggestions-list">
                {visibleSuggestions.length === 0 ? (
                  <div className="empty-state">No champions found</div>
                ) : (
                  visibleSuggestions.map((s, idx) => (
                    <div
                      key={s.champion.name}
                      className="suggestion-item"
                      onClick={() => handleSelect(s.champion.name)}
                    >
                      <span className="sug-rank">#{idx + 1}</span>
                      <div className="sug-main">
                        <span className="sug-name">{s.champion.name}</span>
                        {s.role && <span className="sug-role">{s.role}</span>}
                        <div className="sug-breakdown">
                          <span className={scoreClass(s.score.base)}>
                            Base {fmt(s.score.base)}
                          </span>
                          {s.score.synergy !== 0 && (
                            <span className={scoreClass(s.score.synergy)}>
                              Syn {fmt(s.score.synergy)}
                            </span>
                          )}
                          {s.score.counter !== 0 && (
                            <span className={scoreClass(s.score.counter)}>
                              Ctr {fmt(s.score.counter)}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`sug-total ${scoreClass(s.score.total)}`}>
                        {fmt(s.score.total)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Red team */}
        <div className="draft-team red">
          <div className="team-title red">{teamName(redTeamId)}</div>
          <div className="team-section">
            <div className="section-label">Bans</div>
            <div className="bans-row">
              {SLOT_INDICES.redBans.map((i, seq) => renderBanSlot(i, seq + 1))}
            </div>
          </div>
          <div className="team-section">
            <div className="section-label">Picks</div>
            <div className="picks-list">
              {SLOT_INDICES.redPicks.map((i, n) => renderPickSlot(i, n + 1))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
