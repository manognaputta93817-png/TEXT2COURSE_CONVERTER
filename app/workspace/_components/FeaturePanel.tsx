"use client";

interface FeaturePanelProps {
  onUpload: () => void;
  onBlueprint: () => void;
  onLevel: () => void;
  onStudy: () => void;
}

export default function FeaturePanel({
  onUpload,
  onBlueprint,
  onLevel,
  onStudy,
}: FeaturePanelProps) {
  return (
    <div className="absolute bottom-16 left-0 bg-white shadow-xl rounded-xl p-4 w-[420px] grid grid-cols-2 gap-4 z-40">

      <Feature title="Upload" desc="Upload textbook" onClick={onUpload} />
      <Feature title="Course Blueprint" desc="Generate structure" onClick={onBlueprint} />
      <Feature title="Level" desc="Select difficulty" onClick={onLevel} />
      <Feature title="Study Material" desc="Generate notes" onClick={onStudy} />

    </div>
  );
}

function Feature({
  title,
  desc,
  onClick,
}: {
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="p-4 rounded-lg border hover:bg-gray-100 cursor-pointer"
    >
      <h4 className="font-medium">{title}</h4>
      <p className="text-sm text-gray-500">{desc}</p>
    </div>
  );
}
