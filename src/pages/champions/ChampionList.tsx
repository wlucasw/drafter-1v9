import { ChampionData } from "../../types";

interface Props {
  champions: ChampionData[];
  onEdit: (champion: ChampionData) => void;
  onDelete: (name: string) => void;
  onCreate: () => void;
}

function scoreColor(score: number): string {
  if (score > 0) return "#4ade80";
  if (score < 0) return "#f87171";
  return "#9ca3af";
}

export default function ChampionList({ champions, onEdit, onDelete, onCreate }: Props) {
  return (
    <div className="champion-list">
      <div className="list-header">
        <h2>Champions ({champions.length})</h2>
      </div>

      {champions.length === 0 && (
        <div className="empty-state">
          <p>No champions yet. Add your first champion!</p>
        </div>
      )}

      <div className="champion-grid">
        {champions.map((champion) => (
          <div key={champion.name} className="champion-card">
            <div className="champion-card-header">
              <h3>{champion.name}</h3>
            </div>

            <div className="champion-roles">
              {champion.role.length === 0 && (
                <span className="no-roles">No roles defined</span>
              )}
              {champion.role.map((r) => (
                <div key={r.role} className="role-badge">
                  <span className="role-name">{r.role}</span>
                  <span className="score" style={{ color: scoreColor(r.metaScore) }}>
                    Meta: {r.metaScore > 0 ? "+" : ""}
                    {r.metaScore}
                  </span>
                </div>
              ))}
            </div>

            <div className="champion-relations-summary">
              <span>
                ⚡{" "}
                {champion.relations.filter((r) => r.relationType === "synergy").length}{" "}
                synergies
              </span>
              <span>
                ⚔️{" "}
                {champion.relations.filter((r) => r.relationType === "counter").length}{" "}
                counters
              </span>
            </div>

            <div className="champion-card-actions">
              <button className="btn-secondary" onClick={() => onEdit(champion)}>
                Edit
              </button>
              <button
                className="btn-danger"
                onClick={() => {
                  if (confirm(`Delete ${champion.name}?`)) onDelete(champion.name);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
