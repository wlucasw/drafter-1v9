import { useState } from "react";
import { ChampionData } from "../../types";
import { parseChampionsHtml, ParsedChampionEntry } from "../../parseChampionsHtml";

interface Props {
  champions: ChampionData[];
  onApply: (entries: ParsedChampionEntry[]) => void;
  onClose: () => void;
}

export default function ChampionImportModal({ champions, onApply, onClose }: Props) {
  const [importHtml, setImportHtml] = useState("");
  const [importPreview, setImportPreview] = useState<ParsedChampionEntry[] | null>(null);

  const handleClose = () => {
    setImportHtml("");
    setImportPreview(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Import Meta Scores from HTML</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>
        <div className="modal-body">
          {!importPreview ? (
            <div className="form-group">
              <label style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                Paste the full page HTML (e.g. from the Legends Manager 26 champions page)
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
              {(() => {
                const matched = importPreview.filter((e) =>
                  champions.some((c) => c.name.toLowerCase() === e.name.toLowerCase())
                );
                const unmatched = importPreview.filter(
                  (e) => !champions.some((c) => c.name.toLowerCase() === e.name.toLowerCase())
                );
                return (
                  <>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                      Found <strong style={{ color: "var(--text)" }}>{importPreview.length}</strong> entries —{" "}
                      <strong style={{ color: "var(--green)" }}>{matched.length}</strong> matched,{" "}
                      <strong style={{ color: "var(--red)" }}>{unmatched.length}</strong> not in database (will be skipped).
                    </p>
                    {unmatched.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.75rem" }}>
                        {unmatched.map((e) => (
                          <span
                            key={`${e.name}-${e.role}`}
                            style={{
                              padding: "0.2rem 0.5rem",
                              background: "rgba(248,113,113,0.1)",
                              border: "1px solid rgba(248,113,113,0.3)",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              color: "var(--red)",
                            }}
                          >
                            {e.name} ({e.role})
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleClose}>Cancel</button>
          {!importPreview ? (
            <button
              className="btn-primary"
              onClick={() => setImportPreview(parseChampionsHtml(importHtml))}
              disabled={!importHtml.trim()}
            >
              Parse
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={() => onApply(importPreview)}
              disabled={!importPreview.some((e) =>
                champions.some((c) => c.name.toLowerCase() === e.name.toLowerCase())
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
