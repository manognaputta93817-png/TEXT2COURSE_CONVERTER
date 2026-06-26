"use client";

import { useState } from "react";
import FeaturePanel from "./FeaturePanel";
import UploadModal from "./UploadModal";
import LevelPopover from "./LevelPopover";
import StudyMaterialSection from "./StudyMaterialSection";
import { useRouter } from "next/navigation";

export default function InputWithFeatures() {
  const [showPanel, setShowPanel] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showLevel, setShowLevel] = useState(false);
  const [showStudy, setShowStudy] = useState(false);

  const router = useRouter();

  return (
    <>
      <div className="relative max-w-3xl mx-auto">
        <div className="flex items-center border rounded-full px-4 py-3 bg-white">
          <button onClick={() => setShowPanel(!showPanel)} className="text-2xl mr-3">+</button>
          <input
            placeholder="Feed me a textbook, get back a course..."
            className="flex-1 outline-none"
          />
        </div>

        {showPanel && (
          <FeaturePanel
            onUpload={() => setShowUpload(true)}
            onBlueprint={() => router.push("/workspace/blueprint")}
            onLevel={() => setShowLevel(true)}
            onStudy={() => setShowStudy(true)}
          />
        )}

        {showLevel && (
          <LevelPopover onSelect={(level) => {
            console.log("Selected level:", level);
            setShowLevel(false);
          }} />
        )}
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
      {showStudy && <StudyMaterialSection />}
    </>
  );
}
