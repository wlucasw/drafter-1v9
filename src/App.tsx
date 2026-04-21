import { useState, useEffect, useRef } from "react";
import { ChampionData, PlayerData } from "./types";
import { loadChampions, saveChampions, loadPlayers, savePlayers } from "./store";
import ChampionsPage from "./components/ChampionsPage";
import DraftPage from "./components/DraftPage";
import PlayersPage from "./components/PlayersPage";
import "./App.css";

type Tab = "champions" | "players" | "draft";

const getTabFromHash = (): Tab => {
  const hash = window.location.hash.slice(1).split("/")[0];
  if (hash === "draft") return "draft";
  if (hash === "players") return "players";
  return "champions";
};

export default function App() {
  const [tab, setTab] = useState<Tab>(getTabFromHash);
  const [champions, setChampions] = useState<ChampionData[]>([]);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const championsLoadedRef = useRef(false);
  const playersLoadedRef = useRef(false);

  useEffect(() => {
    const onHashChange = () => setTab(getTabFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    loadChampions().then((data) => {
      championsLoadedRef.current = true;
      setChampions(data);
    });
    loadPlayers().then((data) => {
      playersLoadedRef.current = true;
      setPlayers(data);
    });
  }, []);

  useEffect(() => {
    if (championsLoadedRef.current) saveChampions(champions);
  }, [champions]);

  useEffect(() => {
    if (playersLoadedRef.current) savePlayers(players);
  }, [players]);

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
            className={`tab${tab === "players" ? " active" : ""}`}
            onClick={() => { window.location.hash = "players"; }}
          >
            Players
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
        {tab === "players" && (
          <PlayersPage players={players} onPlayersChange={setPlayers} />
        )}
        {tab === "draft" && <DraftPage champions={champions} />}
      </main>
    </div>
  );
}
