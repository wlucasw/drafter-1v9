import { useState, useMemo } from "react";
import { ChampionData, Role } from "../types";
import {
  DRAFT_SEQUENCE,
  getSuggestions,
  computeTeamScore,
} from "../draft/draftEngine";

interface Props {
  champions: ChampionData[];
}

type SlotState = {
  championName: string | null;
  role: Role | null;
};

const ROLES = Object.values(Role);

function fmt(n: number): string {
  return (n >= 0 ? "+" : "") + n.toFixed(1);
}

function scoreClass(n: number) {
  return n > 0 ? "pos" : n < 0 ? "neg" : "";
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
  const [mySide, setMySide] = useState<Team | null>(null);
  const [slots, setSlots] = useState<SlotState[]>(
    DRAFT_SEQUENCE.map(() => ({ championName: null, role: null }))
  );
  const [activeSlot, setActiveSlot] = useState(0);
  const [roleFilter, setRoleFilter] = useState<Role | null>(null);
  const [search, setSearch] = useState("");

  const activeDef = DRAFT_SEQUENCE[activeSlot] ?? DRAFT_SEQUENCE[19];
  const isDraftComplete = activeSlot >= DRAFT_SEQUENCE.length;
  const isOurTurn = mySide !== null && activeDef.team === mySide;

  // All taken names except the active slot (so re-selection works)
  const allTaken = slots
    .map((s, i) => (i === activeSlot ? null : s.championName))
    .filter(Boolean) as string[];

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
      return getSuggestions(champions, allTaken, [], alliedPicks, null, isOurTurn);
    }
    return getSuggestions(champions, allTaken, alliedPicks, enemyPicks, roleFilter, isOurTurn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots, activeSlot, roleFilter, champions]);

  const visibleSuggestions = useMemo(() => {
    if (!search) return suggestions.slice(0, 25);
    return suggestions
      .filter((s) => s.champion.name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 25);
  }, [suggestions, search]);

  const blueScore = useMemo(
    () =>
      computeTeamScore(SLOT_INDICES.bluePicks, slots, bluePicks, redPicks, champions, mySide === "blue"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slots, champions, mySide]
  );
  const redScore = useMemo(
    () =>
      computeTeamScore(SLOT_INDICES.redPicks, slots, redPicks, bluePicks, champions, mySide === "red"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slots, champions, mySide]
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

  if (!mySide) {
    return (
      <div className="side-selection">
        <h2 className="side-selection-title">Choose your side</h2>
        <div className="side-selection-cards">
          <button className="side-card blue" onClick={() => setMySide("blue")}>
            <span className="side-card-icon">🔵</span>
            <span className="side-card-name">Blue Side</span>
            <span className="side-card-hint">First pick</span>
          </button>
          <button className="side-card red" onClick={() => setMySide("red")}>
            <span className="side-card-icon">🔴</span>
            <span className="side-card-name">Red Side</span>
            <span className="side-card-hint">Last pick</span>
          </button>
        </div>
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
              <span className={`draft-turn-badge ${activeDef.team}`}>
                {activeDef.team === "blue" ? "Blue" : "Red"} —{" "}
                {activeDef.kind === "ban" ? "Ban" : "Pick"}
              </span>
            </>
          ) : (
            <span className="draft-phase-label">Draft Complete</span>
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
          <div className="team-title blue">Blue Side</div>
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
              <h3>Draft Complete</h3>
              <p>
                Blue <strong className="blue-text">{fmt(blueScore)}</strong>
                {" vs "}
                Red <strong className="red-text">{fmt(redScore)}</strong>
              </p>
              <button className="btn-primary" style={{ marginTop: "1rem" }} onClick={handleReset}>
                New Draft
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
                    Sorted by threat level to {activeDef.team === "blue" ? "Blue" : "Red"} side
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
          <div className="team-title red">Red Side</div>
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
