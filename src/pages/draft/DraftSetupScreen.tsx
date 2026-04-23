import { PlayerData } from "../../types";
import { Team } from "../../draft/draftEngine";
import { teamName } from "../../constants";
import { BoFormat } from "./draftPageTypes";

interface Props {
  boFormat: BoFormat | null;
  blueTeamId: string | null;
  redTeamId: string | null;
  teamIds: string[];
  players: PlayerData[];
  onSetBoFormat: (f: BoFormat) => void;
  onSetBlueTeam: (id: string) => void;
  onSetRedTeam: (id: string) => void;
  onSetMySide: (side: Team) => void;
  onBack: () => void;
}

export default function DraftSetupScreen({
  boFormat,
  blueTeamId,
  redTeamId,
  teamIds,
  players,
  onSetBoFormat,
  onSetBlueTeam,
  onSetRedTeam,
  onSetMySide,
  onBack,
}: Props) {
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
              <button key={f} className="side-card neutral" onClick={() => onSetBoFormat(f)}>
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
          {renderTeamGrid(onSetBlueTeam, null)}
        </>
      )}
      {step === "red" && (
        <>
          <h2 className="side-selection-title">Red Side Team</h2>
          {renderTeamGrid(onSetRedTeam, blueTeamId)}
        </>
      )}
      {step === "side" && (
        <>
          <h2 className="side-selection-title">Which side are you advising?</h2>
          <div className="side-selection-cards">
            <button className="side-card blue" onClick={() => onSetMySide("blue")}>
              <span className="side-card-icon">🔵</span>
              <span className="side-card-name">{teamName(blueTeamId!)}</span>
              <span className="side-card-hint">Blue Side · First pick</span>
            </button>
            <button className="side-card red" onClick={() => onSetMySide("red")}>
              <span className="side-card-icon">🔴</span>
              <span className="side-card-name">{teamName(redTeamId!)}</span>
              <span className="side-card-hint">Red Side · Last pick</span>
            </button>
          </div>
          <button className="btn-secondary" style={{ marginTop: "1rem" }} onClick={onBack}>
            ← Back
          </button>
        </>
      )}
    </div>
  );
}
