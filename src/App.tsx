import { useState, useEffect, useRef } from "react";
import { ChampionData } from "./types";
import { loadChampions, saveChampions } from "./store";
import ChampionsPage from "./components/ChampionsPage";
import DraftPage from "./components/DraftPage";
import "./App.css";

type Tab = "champions" | "draft";

const getTabFromHash = (): Tab => {
  const hash = window.location.hash.slice(1);
  return hash === "draft" ? "draft" : "champions";
};

export default function App() {
  const [tab, setTab] = useState<Tab>(getTabFromHash);
  const [champions, setChampions] = useState<ChampionData[]>([]);
  const loadedRef = useRef(false);

  useEffect(() => {
    const onHashChange = () => setTab(getTabFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    loadChampions().then((data) => {
      loadedRef.current = true;
      setChampions(data);
    });
  }, []);

  useEffect(() => {
    if (loadedRef.current) saveChampions(champions);
  }, [champions]);

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
            onClick={() => { window.location.hash = "champions"; }}
          >
            Champion Database
          </button>
          <button
            className={`tab${tab === "draft" ? " active" : ""}`}
            onClick={() => { window.location.hash = "draft"; }}
          >
            Draft Advisor
          </button>
        </nav>
      </header>

      <main className="main">
        {tab === "champions" && (
          <ChampionsPage champions={champions} onChampionsChange={setChampions} />
        )}
        {tab === "draft" && <DraftPage champions={champions} />}
      </main>
    </div>
  );
}
