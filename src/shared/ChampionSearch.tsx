import { useState, useRef, useEffect } from "react";
import { ALL_CHAMPIONS } from "../champions-list";

interface Props {
  value: string;
  onChange: (name: string) => void;
  exclude?: string[];
  placeholder?: string;
}

export default function ChampionSearch({
  value,
  onChange,
  exclude = [],
  placeholder = "Search champion...",
}: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = ALL_CHAMPIONS.filter(
    (n) => !exclude.includes(n) && n.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (query !== value) setQuery(value);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [query, value]);

  const select = (name: string) => {
    onChange(name);
    setQuery(name);
    setOpen(false);
  };

  return (
    <div className="champion-search" ref={containerRef}>
      <input
        type="text"
        className="text-input"
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <ul className="champion-search-dropdown">
          {filtered.slice(0, 10).map((n) => (
            <li
              key={n}
              className={n === value ? "selected" : ""}
              onMouseDown={() => select(n)}
            >
              {n}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
