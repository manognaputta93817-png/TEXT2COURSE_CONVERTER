"use client";

import { UIProvider } from "@/app/workspace/_components/ui-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return <UIProvider>{children}</UIProvider>;
}
