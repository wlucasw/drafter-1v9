import { Team } from "../../draft/draftEngine";
import { teamName } from "../../constants";

interface Props {
  gameNumber: number;
  maxGames: number;
  playedChampions: string[];
  boTeams: [string, string];
  blueTeamId: string | null;
  onSelectBlueSide: (blueId: string, redId: string) => void;
  onSelectMySide: (side: Team) => void;
  onBack: () => void;
}

export default function DraftBetweenGamesScreen({
  gameNumber,
  maxGames,
  playedChampions,
  boTeams,
  blueTeamId,
  onSelectBlueSide,
  onSelectMySide,
  onBack,
}: Props) {
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
            onClick={() => onSelectBlueSide(teamA, teamB)}
          >
            <span className="side-card-name">{teamName(teamA)}</span>
            <span className="side-card-hint">Blue Side · First pick</span>
          </button>
          <button
            className="side-card red"
            onClick={() => onSelectBlueSide(teamB, teamA)}
          >
            <span className="side-card-name">{teamName(teamB)}</span>
            <span className="side-card-hint">Blue Side · First pick</span>
          </button>
        </div>
      </div>
    );
  }

  const redTeamId = blueTeamId === teamA ? teamB : teamA;

  return (
    <div className="side-selection">
      <div className="bo-game-badge-large">Game {gameNumber} of {maxGames}</div>
      <h2 className="side-selection-title">Which side are you advising?</h2>
      <div className="side-selection-cards">
        <button className="side-card blue" onClick={() => onSelectMySide("blue")}>
          <span className="side-card-icon">🔵</span>
          <span className="side-card-name">{teamName(blueTeamId)}</span>
          <span className="side-card-hint">Blue Side · First pick</span>
        </button>
        <button className="side-card red" onClick={() => onSelectMySide("red")}>
          <span className="side-card-icon">🔴</span>
          <span className="side-card-name">{teamName(redTeamId)}</span>
          <span className="side-card-hint">Red Side · Last pick</span>
        </button>
      </div>
      <button
        className="btn-secondary"
        style={{ marginTop: "1rem" }}
        onClick={onBack}
      >
        ← Back
      </button>
    </div>
  );
}
