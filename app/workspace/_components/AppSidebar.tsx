"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "@/app/lib/firebase"

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

import {
  Plus,
  Search,
  QrCode,
  BookOpen,
  Sparkles,
  Settings,
  HelpCircle,
  LogOut,
  MessageSquare,
  MoreVertical,
  Edit2,
  Trash2,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useUI } from "./ui-context"

export function AppSidebar() {
  const [search, setSearch] = useState("")
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")

  const { open } = useSidebar()
  const { setMode, chats, currentChatId, setCurrentChatId, renameChat, deleteChat } = useUI()
  const router = useRouter()

  const [user, setUser] = useState<{
    name: string
    image: string
    plan: string
  } | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const emailName =
          firebaseUser.email?.split("@")[0] || "User"

        setUser({
          name: firebaseUser.displayName || emailName,
          image:
            firebaseUser.photoURL ||
            "/avatar-placeholder.png",
          plan: "Free Plan",
        })
      } else {
        setUser(null)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    await signOut(auth)
    router.replace("/login")
  }

  return (
    <Sidebar collapsible="icon" className="border-r">
      {/* HEADER */}
      <SidebarHeader
        className={`flex flex-col ${open ? "px-4 py-5" : "items-center gap-4 py-4"
          }`}
      >
        {!open && <SidebarTrigger />}

        <div
          className={`flex items-center ${open ? "gap-3" : "justify-center"
            }`}
        >
          <Image
            src="/logo.svg"
            alt="logo"
            width={open ? 28 : 34}
            height={open ? 28 : 34}
          />
          {open && (
            <span className="text-[18px] font-semibold">
              Text2Course
            </span>
          )}
        </div>

        {open && (
          <div className="absolute right-2 top-2">
            <SidebarTrigger />
          </div>
        )}
      </SidebarHeader>

      {/* CONTENT */}
      <SidebarContent className="flex-1">
        <SidebarGroup>
          <SidebarGroupContent className="space-y-1 px-2">
            <button
              onClick={() => {
                setMode("new-course");
                setCurrentChatId(null);
                router.push("/workspace");
              }}
              className={`flex h-10 w-full items-center rounded-md hover:bg-muted
                ${open ? "gap-3 px-3 text-[14px]" : "justify-center"}
              `}
            >
              <Plus className={open ? "h-5 w-5" : "h-6 w-6"} />
              {open && "New Course"}
            </button>

            <div
              className={`flex h-10 items-center rounded-md hover:bg-muted
                ${open ? "gap-3 px-3" : "justify-center"}
              `}
            >
              <Search className={open ? "h-5 w-5" : "h-6 w-6"} />
              {open && (
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search course"
                  className="w-full bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
                />
              )}
            </div>

            <button
              onClick={() => setMode("scan-qr")}
              className={`flex h-10 w-full items-center rounded-md hover:bg-muted
                ${open ? "gap-3 px-3 text-[14px]" : "justify-center"}
              `}
            >
              <QrCode className={open ? "h-5 w-5" : "h-6 w-6"} />
              {open && "Scan QR Code"}
            </button>

            {/* CHAT HISTORY */}
            {open && chats.length > 0 && (
              <div className="mt-6 space-y-1">
                <div className="px-3 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Recent
                </div>
                {chats.map(chat => (
                  <div
                    key={chat.id}
                    className={`group flex items-center justify-between rounded-md hover:bg-muted px-3 py-2 ${currentChatId === chat.id ? "bg-muted font-medium" : "text-muted-foreground"
                      }`}
                  >
                    {editingChatId === chat.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => {
                          if (renameValue.trim()) renameChat(chat.id, renameValue.trim())
                          setEditingChatId(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (renameValue.trim()) renameChat(chat.id, renameValue.trim())
                            setEditingChatId(null)
                          }
                          if (e.key === "Escape") setEditingChatId(null)
                        }}
                        className="w-full bg-transparent text-sm outline-none"
                      />
                    ) : (
                      <button
                        className="flex items-center gap-3 overflow-hidden text-sm flex-1 text-left"
                        onClick={() => {
                          setCurrentChatId(chat.id)
                          router.push("/workspace/chat")
                        }}
                      >
                        <MessageSquare className="h-4 w-4 shrink-0" />
                        <span className="truncate">{chat.title || "Untitled Chat"}</span>
                      </button>
                    )}

                    {!editingChatId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 transition-opacity">
                            <MoreVertical className="h-4 w-4 text-gray-500" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingChatId(chat.id)
                              setRenameValue(chat.title || "Untitled Chat")
                            }}
                          >
                            <Edit2 className="h-4 w-4 mr-2" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteChat(chat.id)
                              if (currentChatId === chat.id) router.push("/workspace")
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* PROFILE (NO DIVIDER, CHATGPT STYLE) */}
      {user && (
        <SidebarFooter className="py-4 flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`flex items-center rounded-md hover:bg-muted
                  ${open ? "gap-3 px-3 py-2 w-full" : "justify-center"}
                `}
              >
                <Image
                  src={user.image}
                  alt="profile"
                  width={open ? 32 : 40}
                  height={open ? 32 : 40}
                  className="rounded-full"
                />

                {open && (
                  <>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.plan}
                      </p>
                    </div>

                    <span className="rounded-full border px-3 py-1 text-xs">
                      Upgrade
                    </span>
                  </>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuItem>
                <Sparkles className="mr-2 h-4 w-4" />
                Upgrade plan
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <HelpCircle className="mr-2 h-4 w-4" />
                Help
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-500"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  )
}
