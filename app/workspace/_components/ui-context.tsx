"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

/* =========================================================
   TYPES
========================================================= */
export type Message = {
  role: "user" | "assistant";
  content: string;
  files?: { name: string; url?: string; type?: string; size?: number;[key: string]: any }[] | File[];
};

export type Chat = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
};

type UIContextType = {
  mode: "idle" | "scan-qr" | "new-course";
  setMode: (mode: "idle" | "scan-qr" | "new-course") => void;

  scannedInput: string | null;
  setScannedInput: (value: string | null) => void;

  chats: Chat[];
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;

  addChat: (chat: Chat) => void;
  updateChat: (id: string, newMessages: Message[]) => void;
  renameChat: (id: string, newTitle: string) => void;
  deleteChat: (id: string) => void;
};

/* =========================================================
   CONTEXT
========================================================= */
const UIContext = createContext<UIContextType | undefined>(undefined);

/* =========================================================
   PROVIDER
========================================================= */
export function UIProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<"idle" | "scan-qr" | "new-course">("idle");
  const [scannedInput, setScannedInput] = useState<string | null>(null);

  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Load chats from local storage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem("t2c_chats");
    if (savedChats) {
      try {
        setChats(JSON.parse(savedChats));
      } catch (err) {
        console.error("Failed to parse chats from local storage:", err);
      }
    }
  }, []);

  // Save chats to local storage whenever they change
  useEffect(() => {
    localStorage.setItem("t2c_chats", JSON.stringify(chats));
  }, [chats]);

  const addChat = (chat: Chat) => {
    setChats((prev) => [chat, ...prev]);
    setCurrentChatId(chat.id);
  };

  const updateChat = (id: string, newMessages: Message[]) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === id ? { ...chat, messages: newMessages } : chat
      )
    );
  };

  const renameChat = (id: string, newTitle: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === id ? { ...chat, title: newTitle } : chat
      )
    );
  };

  const deleteChat = (id: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== id));
    if (currentChatId === id) {
      setCurrentChatId(null);
    }
  };

  return (
    <UIContext.Provider
      value={{
        mode,
        setMode,
        scannedInput,
        setScannedInput,
        chats,
        currentChatId,
        setCurrentChatId,
        addChat,
        updateChat,
        renameChat,
        deleteChat,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

/* =========================================================
   HOOK
========================================================= */
export function useUI() {
  const context = useContext(UIContext);

  if (!context) {
    throw new Error("useUI must be used inside UIProvider");
  }

  return context;
}
