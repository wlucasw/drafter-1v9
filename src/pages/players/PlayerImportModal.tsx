import { useState } from "react";
import { PlayerData } from "../../types";
import { parseRosterHtml } from "../../parseRosterHtml";

interface Props {
  players: PlayerData[];
  onApply: (preview: Record<string, [string, number][]>) => void;
  onClose: () => void;
}

export default function PlayerImportModal({ players, onApply, onClose }: Props) {
  const [importHtml, setImportHtml] = useState("");
  const [importPreview, setImportPreview] = useState<Record<string, [string, number][]> | null>(null);

  const handleClose = () => {
    setImportHtml("");
    setImportPreview(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Import Champion Pools from HTML</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
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
          <button className="btn-secondary" onClick={handleClose}>Cancel</button>
          {!importPreview ? (
            <button
              className="btn-primary"
              onClick={() => setImportPreview(parseRosterHtml(importHtml))}
              disabled={!importHtml.trim()}
            >
              Parse
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={() => onApply(importPreview)}
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
  );
}
