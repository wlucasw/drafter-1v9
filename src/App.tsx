import { useState, useEffect, useRef } from "react";
import { ChampionData } from "./types";
import { loadChampions, saveChampions } from "./store";
import ChampionList from "./components/ChampionList";
import ChampionEditor from "./components/ChampionEditor";
import DraftPage from "./components/DraftPage";
import "./App.css";

type Tab = "champions" | "draft";

export default function App() {
  const [tab, setTab] = useState<Tab>("champions");
  const [champions, setChampions] = useState<ChampionData[]>([]);
  const [editingChampion, setEditingChampion] = useState<ChampionData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    loadChampions().then((data) => {
      loadedRef.current = true;
      setChampions(data);
    });
  }, []);

  useEffect(() => {
    if (loadedRef.current) saveChampions(champions);
  }, [champions]);

  const handleSave = (champion: ChampionData) => {
    setChampions((prev) => {
      const idx = prev.findIndex((c) => c.name === champion.name);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = champion;
        return updated;
      }
      return [...prev, champion];
    });
    setEditingChampion(null);
    setIsCreating(false);
  };

  const handleDelete = (name: string) => {
    setChampions((prev) => prev.filter((c) => c.name !== name));
  };

  const handleEdit = (champion: ChampionData) => {
    setIsCreating(false);
    setEditingChampion(champion);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingChampion({ name: "", role: [], relations: [] });
  };

  const handleCancel = () => {
    setEditingChampion(null);
    setIsCreating(false);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-title">
          <span className="header-icon">⚔️</span>
          <h1>LoL Draft Manager</h1>
        </div>
        <nav className="tabs">
          <button
            className={`tab${tab === "champions" ? " active" : ""}`}
            onClick={() => setTab("champions")}
          >
            Champion Database
          </button>
          <button
            className={`tab${tab === "draft" ? " active" : ""}`}
            onClick={() => setTab("draft")}
          >
            Draft Advisor
          </button>
        </nav>
      </header>

      <main className="main">
        {tab === "champions" && (
          <>
            <ChampionList
              champions={champions}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCreate={handleCreate}
            />
            {editingChampion && (
              <ChampionEditor
                champion={editingChampion}
                champions={champions}
                isNew={isCreating}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            )}
          </>
        )}

        {tab === "draft" && <DraftPage champions={champions} />}
      </main>
    </div>
  );
}
