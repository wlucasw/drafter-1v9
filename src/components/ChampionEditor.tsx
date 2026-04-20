import { useState } from "react";
import {
  ChampionData,
  Role,
  ChampionRelation,
} from "../types";
import ChampionSearch from "./ChampionSearch";
import ScoreInput from "./ScoreInput";

interface Props {
  champion: ChampionData;
  champions: ChampionData[];
  isNew: boolean;
  onSave: (champion: ChampionData) => void;
  onCancel: () => void;
}

function scoreColor(score: number): string {
  if (score > 0) return "#4ade80";
  if (score < 0) return "#f87171";
  return "#9ca3af";
}

export default function ChampionEditor({
  champion,
  champions,
  isNew,
  onSave,
  onCancel,
}: Props) {
  const [name, setName] = useState(champion.name);
  const [roles, setRoles] = useState(champion.role);
  const [relations, setRelations] = useState<ChampionRelation[]>(champion.relations);

  // Role form state
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [newRoleValue, setNewRoleValue] = useState<Role>(Role.Top);
  const [newRoleMeta, setNewRoleMeta] = useState(0);

  // Relation form state
  const [showRelationForm, setShowRelationForm] = useState(false);
  const [newRelatedName, setNewRelatedName] = useState("");
  const [newRelationType, setNewRelationType] = useState<"synergy" | "counter">("synergy");
  const [newRelationScore, setNewRelationScore] = useState(5);

  const usedRoles = new Set(roles.map((r) => r.role));
  const availableRoles = Object.values(Role).filter((r) => !usedRoles.has(r));
  const existingNames = champions.map((c) => c.name).filter((n) => n !== name);

  const openRoleForm = () => {
    if (availableRoles.length > 0) setNewRoleValue(availableRoles[0]);
    setNewRoleMeta(0);
    setShowRoleForm(true);
  };

  const addRole = () => {
    setRoles((prev) => [
      ...prev,
      { role: newRoleValue, metaScore: newRoleMeta },
    ]);
    setShowRoleForm(false);
  };

  const removeRole = (role: Role) => {
    setRoles((prev) => prev.filter((r) => r.role !== role));
  };

  const updateRole = (role: Role, value: number) => {
    setRoles((prev) =>
      prev.map((r) => (r.role === role ? { ...r, metaScore: value } : r))
    );
  };

  const addRelation = () => {
    if (!newRelatedName.trim()) return;
    setRelations((prev) => [
      ...prev,
      {
        championNameConsidered: name,
        championNameRelated: newRelatedName.trim(),
        relationScore: newRelationScore,
        relationType: newRelationType,
      },
    ]);
    setNewRelatedName("");
    setNewRelationScore(5);
    setNewRelationType("synergy");
    setShowRelationForm(false);
  };

  const removeRelation = (idx: number) => {
    setRelations((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!name) return;
    const updatedRelations = relations.map((r) => ({
      ...r,
      championNameConsidered: name,
    }));
    onSave({ name, role: roles, relations: updatedRelations });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isNew ? "New Champion" : `Edit ${champion.name}`}</h2>
          <button className="close-btn" onClick={onCancel}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Name */}
          <div className="form-group">
            <label>Champion Name</label>
            {isNew ? (
              <ChampionSearch
                value={name}
                onChange={setName}
                exclude={existingNames}
                placeholder="Search champion..."
              />
            ) : (
              <input
                type="text"
                value={name}
                className="text-input"
                disabled
              />
            )}
          </div>

          {/* Roles */}
          <div className="section">
            <div className="section-header">
              <h3>Roles</h3>
              {availableRoles.length > 0 && !showRoleForm && (
                <button className="btn-sm" onClick={openRoleForm}>
                  + Add Role
                </button>
              )}
              {showRoleForm && (
                <button className="btn-sm" onClick={() => setShowRoleForm(false)}>
                  Cancel
                </button>
              )}
            </div>

            {roles.length === 0 && !showRoleForm && (
              <p className="empty-state">No roles defined</p>
            )}

            {roles.map((r) => (
              <div key={r.role} className="role-row">
                <span className="role-tag">{r.role}</span>
                <div className="score-inputs">
                  <ScoreInput
                    label="Meta"
                    value={r.metaScore}
                    onChange={(v) => updateRole(r.role, v)}
                  />
                </div>
                <button className="btn-remove" onClick={() => removeRole(r.role)}>
                  ✕
                </button>
              </div>
            ))}

            {showRoleForm && (
              <div className="inline-form">
                <select
                  value={newRoleValue}
                  onChange={(e) => setNewRoleValue(e.target.value as Role)}
                  className="select-input"
                >
                  {availableRoles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <ScoreInput label="Meta" value={newRoleMeta} onChange={setNewRoleMeta} />
                <button className="btn-primary btn-sm" onClick={addRole}>
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Relations */}
          <div className="section">
            <div className="section-header">
              <h3>Relations</h3>
              {!showRelationForm && (
                <button className="btn-sm" onClick={() => setShowRelationForm(true)}>
                  + Add Relation
                </button>
              )}
              {showRelationForm && (
                <button className="btn-sm" onClick={() => setShowRelationForm(false)}>
                  Cancel
                </button>
              )}
            </div>

            {relations.length === 0 && !showRelationForm && (
              <p className="empty-state">No relations defined</p>
            )}

            {relations.map((r, i) => (
              <div key={i} className={`relation-row ${r.relationType}`}>
                <span className={`relation-type-badge ${r.relationType}`}>
                  {r.relationType === "synergy" ? "⚡ Synergy" : "⚔️ Counter"}
                </span>
                <span className="related-champion">{r.championNameRelated}</span>
                <span
                  className="relation-score"
                  style={{ color: scoreColor(r.relationScore) }}
                >
                  {r.relationScore > 0 ? "+" : ""}
                  {r.relationScore}
                </span>
                <button className="btn-remove" onClick={() => removeRelation(i)}>
                  ✕
                </button>
              </div>
            ))}

            {showRelationForm && (
              <div className="inline-form relation-form">
                <div className="relation-type-selector">
                  <button
                    className={`type-btn${newRelationType === "synergy" ? " active synergy" : ""}`}
                    onClick={() => setNewRelationType("synergy")}
                  >
                    ⚡ Synergy
                  </button>
                  <button
                    className={`type-btn${newRelationType === "counter" ? " active counter" : ""}`}
                    onClick={() => setNewRelationType("counter")}
                  >
                    ⚔️ Counter
                  </button>
                </div>
                <div className="relation-champion-row">
                  <ChampionSearch
                    value={newRelatedName}
                    onChange={setNewRelatedName}
                    exclude={[name]}
                    placeholder="Search champion..."
                  />
                </div>
                <div className="relation-bottom-row">
                  <ScoreInput
                    label="Score"
                    value={newRelationScore}
                    onChange={setNewRelationScore}
                  />
                  <button
                    className="btn-primary btn-sm"
                    onClick={addRelation}
                    disabled={!newRelatedName.trim()}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={!name}
          >
            {isNew ? "Create Champion" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
