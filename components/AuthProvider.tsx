"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { auth } from "@/lib/firebase";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/workspace"); // 🔥 DIRECTLY OPEN 3rd IMAGE PAGE
      }
    });

    return () => unsub();
  }, [router]);

  return <>{children}</>;
}
