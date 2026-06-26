"use client"

import { Plus, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Sidebar() {
  return (
    <aside className="w-64 border-r bg-muted/40 flex flex-col">
      <div className="p-4 space-y-2">
        <Button className="w-full justify-start gap-2">
          <Plus className="h-4 w-4" />
          New Course
        </Button>

        <Button variant="ghost" className="w-full justify-start gap-2">
          <Search className="h-4 w-4" />
          Search Courses
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        <p className="px-2 py-2 text-xs font-semibold text-muted-foreground">
          HISTORY
        </p>

        <SidebarItem title="Machine Learning Basics" />
        <SidebarItem title="Indus Valley Civilization" />
      </div>

      <div className="border-t p-4">
        <Button variant="ghost" className="w-full justify-start gap-2">
          <User className="h-4 w-4" />
          Profile
        </Button>
      </div>
    </aside>
  )
}

function SidebarItem({ title }: { title: string }) {
  return (
    <button className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-muted">
      {title}
    </button>
  )
}
