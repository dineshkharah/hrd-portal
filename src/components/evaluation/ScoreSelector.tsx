"use client";

interface ScoreSelectorProps {
  value: number | null;
  onChange: (score: number) => void;
  disabled?: boolean;
}

export default function ScoreSelector({ value, onChange, disabled }: ScoreSelectorProps) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((score) => {
        const selected = value === score;
        return (
          <button
            key={score}
            type="button"
            disabled={disabled}
            onClick={() => onChange(score)}
            className={`
              w-7 h-7 rounded text-xs font-bold font-['Geist'] transition-all
              focus:outline-none focus:ring-2 focus:ring-[#D4A017]/50
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              ${
                selected
                  ? "bg-[#D4A017] text-[#180F04] shadow-sm scale-105"
                  : "bg-transparent border border-black/20 text-[#180F04]/50 hover:border-[#D4A017]/60 hover:text-[#180F04] hover:bg-[#D4A017]/10"
              }
            `}
          >
            {score}
          </button>
        );
      })}
    </div>
  );
}
