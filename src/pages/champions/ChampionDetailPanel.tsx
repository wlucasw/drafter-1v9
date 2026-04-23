import { ChampionData, ChampionRelation, Role } from "../../types";

interface Props {
  champion: ChampionData;
  role: Role;
  onEdit: (champion: ChampionData) => void;
  onDelete: (name: string) => void;
  onClose: () => void;
}

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

export default function ChampionDetailPanel({ champion, role, onEdit, onDelete, onClose }: Props) {
  const { synergies, counters } = getRelations(champion);

  return (
    <div className="champion-detail-panel">
      <div className="champion-detail-header">
        <h3>
          {champion.name}{" "}
          <span className="detail-role">— {role}</span>
        </h3>
        <button className="btn-secondary" onClick={() => onEdit(champion)}>
          Edit
        </button>
        <button className="btn-danger" onClick={() => onDelete(champion.name)}>
          Delete
        </button>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>
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
    </div>
  );
}
