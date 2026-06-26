"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "@/app/lib/firebase";
import { FcGoogle } from "react-icons/fc";
import { MdEmail } from "react-icons/md";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleEmailAuth = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/workspace");
    } catch {
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        router.replace("/workspace");
      } catch {
        setError("Authentication failed");
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      router.replace("/workspace");
    } catch {
      setError("Google sign-in failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow">
        <h1 className="text-xl font-semibold text-center mb-6">
          Login
        </h1>

        <input
          className="border p-3 w-full mb-3 rounded"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="border p-3 w-full mb-3 rounded"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="text-red-500 text-sm text-center mb-3">{error}</p>
        )}

        <button
          onClick={handleEmailAuth}
          className="w-full bg-black text-white p-3 rounded mb-3 flex items-center justify-center gap-2"
        >
          <MdEmail size={20} />
          Continue with Email
        </button>

        <button
          onClick={handleGoogleLogin}
          className="w-full border p-3 rounded flex items-center justify-center gap-2"
        >
          <FcGoogle size={20} />
          Continue with Google
        </button>
      </div>
    </div>
  );
}
