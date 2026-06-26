"use client";

interface LevelPopoverProps {
  onSelect: (level: string) => void;
}

export default function LevelPopover({ onSelect }: LevelPopoverProps) {
  return (
    <div className="absolute bottom-16 left-24 bg-white shadow-xl rounded-lg border w-48 z-50">
      {["Beginner", "Intermediate", "Advanced"].map((level) => (
        <button
          key={level}
          onClick={() => onSelect(level)}
          className="w-full px-4 py-2 text-left hover:bg-gray-100"
        >
          {level}
        </button>
      ))}
    </div>
  );
}
