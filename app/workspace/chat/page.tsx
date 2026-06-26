"use client";

import ReactMarkdown from "react-markdown";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  ArrowUp,
  BookOpen,
  Brain,
  BarChart3,
  FileText,
  X,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Pencil,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useUI } from "@/app/workspace/_components/ui-context";

/* ================= TYPES ================= */

import type { Message } from "@/app/workspace/_components/ui-context";

type Feature = {
  id: string;
  label: string;
  description: string;
  prompt?: string;
  icon: LucideIcon;
  color: string;
};

type ApiResponse = {
  success: boolean;
  data?: unknown;
};

/* ================= FEATURES ================= */

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

export default function ChatPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [showFeatures, setShowFeatures] = useState(false);
  const [showDifficulty, setShowDifficulty] = useState(false);

  // Message Actions State
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Record<number, 'up' | 'down'>>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const { scannedInput, setScannedInput, currentChatId, chats, updateChat } = useUI();

  /* ✅ NEW — uploaded files state */
  const [files, setFiles] = useState<File[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const hasLoadedRef = useRef(false);

  /* ================= AUTO RESIZE ================= */

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      textareaRef.current.scrollHeight + "px";
  }, [input]);

  /* ================= LOAD EXISTING CHAT ================= */

  const triggeringRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (currentChatId) {
      const chat = chats.find(c => c.id === currentChatId);
      if (chat) {
        setMessages(chat.messages);
        hasLoadedRef.current = true;

        // Auto-trigger AI generation if this is a newly created chat from Hero
        // or a chat that didn't get an initial assistant response.
        if (chat.messages.length === 1 && chat.messages[0].role === "user") {
          if (!triggeringRef.current.has(currentChatId)) {
            triggeringRef.current.add(currentChatId);
            setTimeout(() => {
              generateAIResponse(chat.messages[0].content);
            }, 0);
          }
        }
      }
    } else {
      setMessages([]);
      hasLoadedRef.current = false;
    }
  }, [currentChatId]); // Removed chats from dependency to avoid infinite loops

  /* ================= FIRST QUERY ================= */

  useEffect(() => {
    // Only trigger if no current chat and we have a query
    if (!query || hasLoadedRef.current || currentChatId) return;
    hasLoadedRef.current = true;

    const initialMessage: Message = { role: "user", content: query };
    setMessages([initialMessage]);
    generateAIResponse(query);
  }, [query, currentChatId]);

  /* ================= SCANNED INPUT ================= */

  useEffect(() => {
    if (scannedInput) {
      // Auto submit the scanned link
      const message = `Here is a scanned link: [${scannedInput}](${scannedInput})`;
      setMessages((prev) => [
        ...prev,
        { role: "user", content: message },
      ]);
      generateAIResponse(message);
      setScannedInput(null);
    }
  }, [scannedInput, setScannedInput]);

  /* ================= AUTO SCROLL ================= */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* ================= MESSAGE ACTIONS ================= */

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleEditClick = (index: number, content: string) => {
    setEditingIndex(index);
    setEditDraft(content);
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditDraft("");
  };

  const handleEditSubmit = (index: number) => {
    if (!editDraft.trim()) return;

    // Truncate message history from this user message onward
    const newMessages = messages.slice(0, index);
    const newMessage = { ...messages[index], content: editDraft.trim() };
    const updatedMessages = [...newMessages, newMessage];

    setMessages(updatedMessages);
    if (currentChatId) {
      updateChat(currentChatId, updatedMessages);
    }

    setEditingIndex(null);
    setEditDraft("");

    generateAIResponse(editDraft.trim(), newMessage.files as File[] | undefined);
  };

  const handleFeedback = (index: number, type: 'up' | 'down') => {
    setFeedback((prev) => ({ ...prev, [index]: type }));
  };

  /* ================= API ================= */

  const normalizeResponse = (data: unknown): string => {
    if (typeof data === "string") return data;
    if (typeof data === "object" && data !== null)
      return JSON.stringify(data, null, 2);
    return "Unable to generate response.";
  };

  /* ✅ UPDATED — supports files & streaming */
  const generateAIResponse = async (text: string, uploadFiles?: File[]) => {
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("message", text);

      uploadFiles?.forEach((file) => {
        formData.append("file", file);
      });

      const res = await fetch("/api/chat", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Network Error");

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data: ApiResponse = await res.json();
        const safeContent =
          data.success && data.data
            ? normalizeResponse(data.data)
            : "Failed to generate response.";

        setMessages((prev) => {
          const newMessages = [
            ...prev,
            { role: "assistant", content: safeContent },
          ] as Message[];
          if (currentChatId) {
            updateChat(currentChatId, newMessages);
          }
          return newMessages;
        });

        setLoading(false);
        return;
      }

      // Handle streaming text
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      setLoading(false); // stop 'AI is typing...' once streaming starts

      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            if (updated[lastIndex].role === "assistant") {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: updated[lastIndex].content + chunk,
              };
            }

            // Sync streamed chunk to context safely
            if (currentChatId) {
              updateChat(currentChatId, updated);
            }

            return updated;
          });
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error generating response." },
      ]);
      setLoading(false);
    }
  };

  /* ================= SEND ================= */

  const handleSend = () => {
    if (!input.trim() && files.length === 0) return;

    const message = input.trim() || "Please analyze the uploaded files.";

    const newMessage: Message = {
      role: "user",
      content: message,
      files: files.length ? [...files] : undefined, // ✅ store files
    };

    const updatedMessages = [...messages, newMessage];

    setMessages(updatedMessages);

    if (currentChatId) {
      updateChat(currentChatId, updatedMessages);
    }

    generateAIResponse(message, files);

    setInput("");
    setFiles([]);
  };

  /* ================= FILE SELECT ================= */

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected]);

    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /* ================= FEATURE ACTIONS ================= */

  const handleFeatureClick = (feature: Feature) => {
    setShowFeatures(false);

    if (feature.id === "upload") {
      fileInputRef.current?.click();
      return;
    }

    if (feature.id === "difficulty") {
      setShowDifficulty(true);
      return;
    }

    if (feature.prompt) {
      setInput(feature.prompt);
      textareaRef.current?.focus();
    }
  };

  /* ================= DIFFICULTY ================= */

  const difficultyLevels = [
    "Beginner",
    "Intermediate",
    "Advanced",
  ];

  /* ================= UI ================= */

  return (
    <div className="flex flex-col h-screen bg-white">

      {/* HEADER */}
      <div className="h-16 flex items-center px-6 border-b">
        <h1 className="text-xl font-semibold">
          AI Course Generator
        </h1>
      </div>

      {/* CHAT */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-6 max-w-4xl mx-auto">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col group ${msg.role === "user" ? "items-end" : "items-start"
                }`}
            >
              {editingIndex === i ? (
                <div className="w-full max-w-[75%] bg-gray-100 rounded-2xl p-4 space-y-3">
                  <textarea
                    className="w-full bg-white border rounded-lg p-3 outline-none resize-none min-h-[100px]"
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleEditCancel}
                      className="px-4 py-2 text-sm font-medium rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleEditSubmit(i)}
                      className="px-4 py-2 text-sm font-medium rounded-full bg-black text-white hover:bg-gray-800 transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="max-w-[75%] px-5 py-3 rounded-2xl bg-gray-100 space-y-2">

                    {/* TEXT */}
                    <ReactMarkdown
                      components={{
                        a: ({ node, ...props }) => (
                          <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all" />
                        )
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>

                    {/* ✅ ATTACHED FILES */}
                    {msg.files && msg.files.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {msg.files.map((file, idx) => (
                          <div
                            key={idx}
                            className="bg-white border rounded-full px-3 py-1 text-xs"
                          >
                            📎 {file.name}
                          </div>
                        ))}
                      </div>
                    )}

                  </div>

                  {/* ✅ MESSAGE ACTIONS (Copy, Edit, ThumbsUp/Down) */}
                  <div
                    className={`flex items-center gap-2 mt-2 px-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ${msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                  >
                    {msg.role === "user" ? (
                      <>
                        <button
                          onClick={() => handleCopy(msg.content, i)}
                          className="p-1 hover:text-black hover:bg-gray-100 rounded transition-colors"
                          title="Copy"
                        >
                          {copiedIndex === i ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                        <button
                          onClick={() => handleEditClick(i, msg.content)}
                          className="p-1 hover:text-black hover:bg-gray-100 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleCopy(msg.content, i)}
                          className="p-1 hover:text-black hover:bg-gray-100 rounded transition-colors"
                          title="Copy"
                        >
                          {copiedIndex === i ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                        <button
                          onClick={() => handleFeedback(i, "up")}
                          className={`p-1 rounded transition-colors ${feedback[i] === "up" ? "text-black bg-gray-100" : "hover:text-black hover:bg-gray-100"
                            }`}
                          title="Good response"
                        >
                          <ThumbsUp size={16} className={feedback[i] === "up" ? "fill-current" : ""} />
                        </button>
                        <button
                          onClick={() => handleFeedback(i, "down")}
                          className={`p-1 rounded transition-colors ${feedback[i] === "down" ? "text-black bg-gray-100" : "hover:text-black hover:bg-gray-100"
                            }`}
                          title="Bad response"
                        >
                          <ThumbsDown size={16} className={feedback[i] === "down" ? "fill-current" : ""} />
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}

          {loading && (
            <div className="text-gray-400 text-sm">
              AI is typing...
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* FEATURES PANEL */}
      {showFeatures && (
        <div className="px-4 pb-3">
          <div className="max-w-4xl mx-auto bg-white border rounded-2xl shadow-lg p-4">
            <div className="grid sm:grid-cols-2 gap-3">
              {plusFeatures.map((feature) => (
                <button
                  key={feature.id}
                  onClick={() => handleFeatureClick(feature)}
                  className="flex gap-3 p-4 border rounded-xl hover:bg-gray-50 text-left"
                >
                  <feature.icon
                    className={`w-5 h-5 mt-1 ${feature.color}`}
                  />
                  <div>
                    <p className="font-medium text-sm">
                      {feature.label}
                    </p>
                    <p className="text-xs text-gray-500">
                      {feature.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DIFFICULTY MENU */}
      {showDifficulty && (
        <div className="px-4 pb-2">
          <div className="max-w-4xl mx-auto bg-white border rounded-xl shadow p-2">
            {difficultyLevels.map((level) => (
              <button
                key={level}
                onClick={() => {
                  setInput(`Difficulty level: ${level}`);
                  setShowDifficulty(false);
                  textareaRef.current?.focus();
                }}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* INPUT */}
      <div className="px-4 py-4 border-t bg-white">
        <div className="max-w-4xl mx-auto bg-gray-100 rounded-3xl px-4 py-3">

          {/* ✅ FILE PREVIEW (ChatGPT style) */}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-white border rounded-full px-3 py-1 text-sm"
                >
                  {file.name}
                  <button onClick={() => removeFile(i)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end">
            <button
              onClick={() => setShowFeatures((p) => !p)}
              className="p-1 text-gray-500"
            >
              <Plus size={20} />
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message AI Course Generator..."
              className="flex-1 bg-transparent resize-none outline-none px-3"
            />

            <button
              onClick={handleSend}
              className="ml-2 p-2 rounded-full bg-black text-white"
            >
              <ArrowUp size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* FILE INPUT */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
        onChange={handleFileChange}
      />
    </div>
  );
}