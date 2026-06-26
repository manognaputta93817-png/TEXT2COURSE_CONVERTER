"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Plus,
  ArrowUp,
  Activity,
  Video,
  FileText,
  ClipboardCheck,
  BookOpen,
  Brain,
  BarChart3,
  X,
} from "lucide-react";

import { useUI } from "@/app/workspace/_components/ui-context";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

/* ========================================================= */
/* TYPES                                                     */
/* ========================================================= */

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Feature = {
  id: string;
  label: string;
  description: string;
  icon: any;
  color: string;
  prompt?: string;
};

/* ========================================================= */
/* PLUS FEATURE DATA                                         */
/* ========================================================= */

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

function Hero() {
  const { mode, setMode, addChat } = useUI();

  const router = useRouter();


  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [inputValue, setInputValue] = useState<string>("");
  const [showPlusMenu, setShowPlusMenu] = useState<boolean>(false);
  const [showLevelMenu, setShowLevelMenu] = useState<boolean>(false);

  const [aiResponse, setAiResponse] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [dailyUploadedFiles, setDailyUploadedFiles] = useState<File[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const MIN_HEIGHT = 48;
  const MAX_HEIGHT = MIN_HEIGHT + 28;
  const MAX_FILES_PER_CHAT = 3;
  const MAX_FILES_PER_DAY = 10;

  /* ========================================================= */
  /* AUTH LISTENER                                             */
  /* ========================================================= */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  /* ========================================================= */
  /* TEXTAREA AUTO RESIZE                                      */
  /* ========================================================= */

  const handleInput = (): void => {
    if (!textareaRef.current) return;

    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      Math.min(textareaRef.current.scrollHeight, MAX_HEIGHT) + "px";
  };

  useEffect(() => {
    if (!textareaRef.current) return;

    textareaRef.current.style.height =
      inputValue === "" ? `${MIN_HEIGHT}px` : textareaRef.current.style.height;
  }, [inputValue]);

  /* ========================================================= */
  /* AUTO SCROLL                                               */
  /* ========================================================= */

  useEffect(() => {
    const timer = setTimeout(() => {
      chatEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [messages, loading]);

  /* ========================================================= */
  /* SEND MESSAGE                                              */
  /* ========================================================= */
  const handleSend = (): void => {
    if (!inputValue.trim()) return;

    const message = inputValue.trim();

    // Create complete Chat Context Entry
    const newChatId = uuidv4();
    addChat({
      id: newChatId,
      title: message.substring(0, 30) + (message.length > 30 ? "..." : ""),
      messages: [{ role: "user", content: message }],
      createdAt: Date.now(),
    });

    setInputValue("");

    // Navigate to active chat page
    router.push(`/workspace/chat`);
  };



  /* ========================================================= */
  /* FEATURE HANDLER                                           */
  /* ========================================================= */

  const handleFeatureClick = (feature: Feature): void => {
    setShowPlusMenu(false);

    if (feature.id === "upload") {
      fileInputRef.current?.click();
      return;
    }

    if (feature.id === "difficulty") {
      setShowLevelMenu(true);
      return;
    }

    if (feature.prompt) {
      setInputValue(feature.prompt);
      textareaRef.current?.focus();
    }
  };

  /* ========================================================= */
  /* SUGGESTIONS                                               */
  /* ========================================================= */

  const suggestions = [
    {
      name: "Diagram ",
      icon: <Activity className="w-4 h-4 mr-2 text-blue-500" />,
      prompt:
        "Create a detailed diagram for the topic .",
    },
    {
      name: "Flowchart",
      icon: <FileText className="w-4 h-4 mr-2 text-green-500" />,
      prompt: "Generate a  FlowChart for the topic .",
    },
    
    {
      name: "Quizzes",
      icon: <ClipboardCheck className="w-4 h-4 mr-2 text-yellow-500" />,
      prompt: "Generate quizzes or MCQs from this textbook content.",
    },
  ];

  const handleSuggestionClick = (prompt: string): void => {
    setInputValue(prompt);
    textareaRef.current?.focus();
  };

  /* ========================================================= */
  /* DEFAULT VIEW                                              */
  /* ========================================================= */

  return (
    <div className="px-6 py-12 flex flex-col items-center justify-center h-[80vh] text-center">
      <h1 className="text-4xl font-bold tracking-tight">
        Building with{" "}
        <span className="text-primary">
          {user?.displayName?.split(" ")[0] || "Learner"}
        </span>
      </h1>

      <p className="mt-2 text-xl text-muted-foreground">
        Let's create something amazing together
      </p>

      {/* INPUT BOX */}
      <div className="w-full max-w-2xl mt-3 relative">
        <div
          className="
      w-full
      bg-white/90
      backdrop-blur
      rounded-[28px]
      shadow-lg
      px-3
      py-1
      transition-all
      border border-gray-200
    "
        >
          {/* FILE CHIPS */}
          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 px-1 pt-1 pb-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="
              flex items-center gap-2
              px-3 py-1
              bg-gray-100
              rounded-full
              text-sm
            "
                >
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span className="max-w-[160px] truncate">
                    {file.name}
                  </span>

                  <button
                    onClick={() =>
                      setUploadedFiles((prev) =>
                        prev.filter((_, i) => i !== index)
                      )
                    }
                  >
                    <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* INPUT ROW */}
          <div className="flex items-center gap-2">
            {/* PLUS BUTTON */}
            <button
              onClick={() => setShowPlusMenu((prev) => !prev)}
              className="p-1 rounded-full hover:bg-gray-100 transition"
            >
              <Plus className="w-6 h-5 text-gray-600" />
            </button>

            {/* TEXTAREA */}
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onInput={handleInput}
              placeholder="Feed me a textbook, get back a course..."
              className="
          flex-3
          resize-none
          bg-transparent
          py-3
          focus:outline-none
          text-m
        "
              style={{ height: `${MIN_HEIGHT}px` }}
            />

            {/* SEND BUTTON */}
            <button
              onClick={handleSend}
              className="
          h-9 w-9
          rounded-full
          bg-primary
          text-white
          flex items-center justify-center
          hover:scale-105
          transition
        "
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>


      {/* FEATURE MENU */}
      {showPlusMenu && (
        <div className="mt-3 w-full max-w-2xl bg-white border rounded-2xl shadow-xl p-4">
          <div className="grid sm:grid-cols-2 gap-3">
            {plusFeatures.map((feature) => (
              <button
                key={feature.id}
                onClick={() => handleFeatureClick(feature)}
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
      )}

      {/* LEVEL MENU */}
      {showLevelMenu && (
        <div className="mt-2 bg-white border rounded-xl shadow p-2">
          {["Beginner", "Intermediate", "Advanced"].map((level) => (
            <button
              key={level}
              onClick={() => {
                setInputValue(`Difficulty level: ${level}`);
                setShowLevelMenu(false);
                textareaRef.current?.focus();
              }}
              className="block px-4 py-2 w-full text-left hover:bg-gray-100"
            >
              {level}
            </button>
          ))}
        </div>
      )}

      {/* CHAT HISTORY */}
      {messages.length > 0 && (
        <div className="w-full max-w-2xl mt-6 space-y-4 text-left">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-4 rounded-2xl whitespace-pre-line ${msg.role === "user"
                ? "bg-blue-500 text-white ml-auto max-w-[75%]"
                : "bg-gray-100 text-gray-900 mr-auto max-w-[75%]"
                }`}
            >
              {msg.content}
            </div>
          ))}

          {loading && (
            <div className="bg-gray-100 text-gray-500 p-4 rounded-2xl mr-auto max-w-[75%]">
              Generating response...
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      )}

      {/* AI RESPONSE OUTPUT */}
      {(aiResponse || loading) && (
        <div className="w-full max-w-2xl mt-6 p-5 bg-white border rounded-2xl shadow text-left">
          <h3 className="font-semibold mb-2">AI Response</h3>

          {loading ? (
            <p className="text-gray-500">Generating response...</p>
          ) : (
            <p className="whitespace-pre-line">{aiResponse}</p>
          )}
        </div>
      )}

      {/* SUGGESTIONS */}
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        {suggestions.map((item) => (
          <button
            key={item.name}
            onClick={() => handleSuggestionClick(item.prompt)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200
                       text-sm font-medium rounded-full flex items-center"
          >
            {item.icon}
            {item.name}
          </button>
        ))}
      </div>

      {/* FILE INPUT */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        accept=".pdf,.doc,.docx,.ppt,.pptx"
        onChange={(e) => {
          const files = e.target.files ? Array.from(e.target.files) : [];
          if (files.length === 0) return;

          if (dailyUploadedFiles.length >= MAX_FILES_PER_DAY) {
            alert(
              `You have reached the daily limit of ${MAX_FILES_PER_DAY} files.`
            );
            return;
          }

          const remainingPerChat =
            MAX_FILES_PER_CHAT - uploadedFiles.length;
          const remainingDaily =
            MAX_FILES_PER_DAY - dailyUploadedFiles.length;
          const allowed = Math.min(
            remainingPerChat,
            remainingDaily
          );

          if (allowed <= 0) {
            alert("You cannot upload more files in this chat.");
            return;
          }

          const filesToAdd = files.slice(0, allowed);
          setUploadedFiles((prev) => [...prev, ...filesToAdd]);
        }}
      />
    </div>
  );
}

export default Hero;
