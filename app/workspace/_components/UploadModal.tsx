"use client";

import { useRef, useState } from "react";

interface UploadModalProps {
  onClose: () => void;
}

export default function UploadModal({ onClose }: UploadModalProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  const openFilePicker = () => {
    fileRef.current?.click();
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      console.log("AI Response:", data.response);

      alert("Course generated successfully!");

      onClose();
    } catch (error) {
      console.error("Upload failed:", error);
      alert("File upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-[400px]">

        <h2 className="text-lg font-semibold mb-4">
          Upload Textbook
        </h2>

        <button
          onClick={openFilePicker}
          disabled={loading}
          className="w-full py-3 border rounded-lg hover:bg-gray-100"
        >
          {loading ? "Uploading..." : "Choose PDF / PPT / DOCX"}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.ppt,.pptx,.doc,.docx"
          hidden
          onChange={handleFileChange}
        />

        <button
          onClick={onClose}
          className="mt-4 text-sm text-gray-500"
        >
          Cancel
        </button>

      </div>
    </div>
  );
}