import { useState } from "react";
import { PlayerData, PlayerRole } from "../types";
import { TEAM_NAMES } from "../constants";
import ChampionSearch from "./ChampionSearch";

const ROLES: PlayerRole[] = ["Top", "Jungle", "Mid", "Bot", "Support"];

interface Props {
  player: PlayerData;
  isNew: boolean;
  onSave: (player: PlayerData) => void;
  onCancel: () => void;
}

function profColor(prof: number): string {
  return `hsl(${prof * 1.2}, 70%, 55%)`;
}

export default function PlayerEditor({ player, isNew, onSave, onCancel }: Props) {
  const [ign, setIgn] = useState(player.ign);
  const [firstName, setFirstName] = useState(player.firstName);
  const [lastName, setLastName] = useState(player.lastName);
  const [role, setRole] = useState<PlayerRole>(player.role);
  const [teamId, setTeamId] = useState(player.teamId);
  const [champions, setChampions] = useState<[string, number][]>(player.champions);

  const [showChampForm, setShowChampForm] = useState(false);
  const [newChampName, setNewChampName] = useState("");
  const [newChampProf, setNewChampProf] = useState(50);

  const existingChampNames = champions.map(([name]) => name);

  const addChampion = () => {
    if (!newChampName) return;
    const entry: [string, number] = [newChampName, newChampProf];
    setChampions((prev) =>
      [...prev, entry].sort((a, b) => b[1] - a[1]) as [string, number][]
    );
    setNewChampName("");
    setNewChampProf(50);
    setShowChampForm(false);
  };

  const removeChampion = (name: string) => {
    setChampions((prev) => prev.filter(([n]) => n !== name));
  };

  const updateProficiency = (name: string, value: number) => {
    setChampions((prev) => prev.map(([n, p]) => (n === name ? [n, value] : [n, p])));
  };

  const handleSave = () => {
    if (!ign) return;
    onSave({ ign, firstName, lastName, role, teamId, champions });
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isNew ? "New Player" : `Edit ${player.ign}`}</h2>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label>IGN</label>
              {isNew ? (
                <input
                  type="text"
                  className="text-input"
                  value={ign}
                  onChange={(e) => setIgn(e.target.value)}
                  placeholder="In-game name"
                />
              ) : (
                <input type="text" className="text-input" value={ign} disabled />
              )}
            </div>
            <div className="form-group">
              <label>Team</label>
              <select
                className="select-input"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
              >
                <option value="fa">— No team —</option>
                {Object.entries(TEAM_NAMES).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                className="text-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                className="text-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Role</label>
            <select
              className="select-input"
              value={role}
              onChange={(e) => setRole(e.target.value as PlayerRole)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="section">
            <div className="section-header">
              <h3>Champion Pool ({champions.length})</h3>
              {!showChampForm ? (
                <button className="btn-sm" onClick={() => setShowChampForm(true)}>
                  + Add Champion
                </button>
              ) : (
                <button className="btn-sm" onClick={() => setShowChampForm(false)}>
                  Cancel
                </button>
              )}
            </div>

            {champions.length === 0 && !showChampForm && (
              <p className="empty-state">No champions in pool</p>
            )}

            {champions.map(([name, prof]) => (
              <div key={name} className="role-row">
                <span className="role-tag">{name}</span>
                <div className="proficiency-slider-row">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={prof}
                    onChange={(e) => updateProficiency(name, Number(e.target.value))}
                    className="score-slider"
                    style={{ accentColor: profColor(prof) }}
                  />
                  <span className="score-value" style={{ color: profColor(prof) }}>
                    {prof}
                  </span>
                </div>
                <button className="btn-remove" onClick={() => removeChampion(name)}>✕</button>
              </div>
            ))}

            {showChampForm && (
              <div className="inline-form">
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
                <button
                  className="btn-primary btn-sm"
                  onClick={addChampion}
                  disabled={!newChampName}
                >
                  Add
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={!ign}>
            {isNew ? "Create Player" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
