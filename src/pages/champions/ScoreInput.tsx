interface Props {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export default function ScoreInput({ label, value, onChange }: Props) {
  const color = value > 0 ? "#4ade80" : value < 0 ? "#f87171" : "#9ca3af";

  return (
    <div className="score-input">
      <span className="score-label">{label}</span>
      <input
        type="range"
        min={-7}
        max={7}
        step={0.1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="score-slider"
        style={{ accentColor: color }}
      />
      <span className="score-value" style={{ color }}>
        {value > 0 ? "+" : ""}
        {value}
      </span>
    </div>
  );
}
