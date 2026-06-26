"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

const MenuOptions = [
  {
    name: "Plans",
    path: "/plans",
  },
  {
    name: "Support",
    path: "/support",
  },
];

function Header() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between p-4 shadow">
      {/* Logo */}
      <div className="flex gap-2 items-center">
        <img src="/logo.svg" alt="logo" width={35} height={35} />
        <h2 className="font-bold text-xl">Text2Course</h2>
      </div>

      {/* Menu Options */}
      <div className="flex gap-3">
        {MenuOptions.map((menu, index) => (
          <Link href={menu.path} key={index}>
            <Button variant="ghost">{menu.name}</Button>
          </Link>
        ))}
      </div>

      {/* Login Button (FIXED) */}
      <div>
        <Button onClick={() => router.push("/login")}>
          Login <ArrowRight className="ml-1" />
        </Button>
      </div>
    </div>
  );
}

export default Header;
