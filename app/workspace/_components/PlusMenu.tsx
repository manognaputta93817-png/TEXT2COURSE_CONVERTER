"use client";

import {
  BookOpen,
  Brain,
  BarChart3,
  FileText,
} from "lucide-react";

type Feature = {
  id: string;
  label: string;
  description: string;
  icon: any;
  color: string;
  prompt?: string;
};

const plusFeatures: Feature[] = [
  {
    id: "upload",
    label: "Upload Textbook",
    description: "PDF / DOCX / PPT • OCR • Multiple files",
    icon: BookOpen,
    color: "text-blue-500",
  },
  {
    id: "outline",
    label: "Generate Course Outline",
    description: "Modules • Chapters • Lessons",
    prompt: "Generate a complete course outline from this textbook.",
    icon: Brain,
    color: "text-purple-500",
  },
  {
    id: "difficulty",
    label: "Set Difficulty Level",
    description: "Beginner • Intermediate • Advanced",
    icon: BarChart3,
    color: "text-red-500",
  },
  {
    id: "notes",
    label: "Generate Study Notes",
    description: "Summaries • Examples • Exam-oriented",
    prompt: "Generate structured study notes for this textbook.",
    icon: FileText,
    color: "text-indigo-500",
  },
];

interface Props {
  onFeatureClick: (feature: Feature) => void;
}

export default function PlusMenu({ onFeatureClick }: Props) {
  return (
    <div className="w-full bg-white border rounded-2xl shadow-xl p-4">
      <div className="grid sm:grid-cols-2 gap-3">
        {plusFeatures.map((feature) => (
          <button
            key={feature.id}
            onClick={() => onFeatureClick(feature)}
            className="flex gap-3 p-3 border rounded-xl hover:bg-gray-50 text-left"
          >
            <feature.icon className={`w-5 h-5 mt-1 ${feature.color}`} />

            <div>
              <p className="text-sm font-medium">{feature.label}</p>
              <p className="text-xs text-gray-500">
                {feature.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}