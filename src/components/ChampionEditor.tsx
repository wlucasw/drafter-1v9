import { useState } from "react";
import { ChampionData, Role } from "../types";
import ChampionSearch from "./ChampionSearch";
import ScoreInput from "./ScoreInput";

interface Props {
  champion: ChampionData;
  champions: ChampionData[];
  isNew: boolean;
  onSave: (champion: ChampionData) => void;
  onCancel: () => void;
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

  const [showRoleForm, setShowRoleForm] = useState(false);
  const [newRoleValue, setNewRoleValue] = useState<Role>(Role.Top);
  const [newRoleMeta, setNewRoleMeta] = useState(0);

  const usedRoles = new Set(roles.map((r) => r.role));
  const availableRoles = Object.values(Role).filter((r) => !usedRoles.has(r));
  const existingNames = champions.map((c) => c.name).filter((n) => n !== name);

  const openRoleForm = () => {
    if (availableRoles.length > 0) setNewRoleValue(availableRoles[0]);
    setNewRoleMeta(0);
    setShowRoleForm(true);
  };

  const addRole = () => {
    setRoles((prev) => [...prev, { role: newRoleValue, metaScore: newRoleMeta }]);
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

  const handleSave = () => {
    if (!name) return;
    onSave({ name, role: roles, relations: champion.relations });
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
