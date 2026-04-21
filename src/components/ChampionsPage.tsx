import { useState, Dispatch, SetStateAction } from "react";
import { ChampionData } from "../types";
import ChampionList from "./ChampionList";
import ChampionEditor from "./ChampionEditor";

interface Props {
  champions: ChampionData[];
  onChampionsChange: Dispatch<SetStateAction<ChampionData[]>>;
}

export default function ChampionsPage({ champions, onChampionsChange }: Props) {
  const [editingChampion, setEditingChampion] = useState<ChampionData | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSave = (champion: ChampionData) => {
    onChampionsChange((prev) => {
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
    onChampionsChange((prev) => prev.filter((c) => c.name !== name));
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
  );
}
