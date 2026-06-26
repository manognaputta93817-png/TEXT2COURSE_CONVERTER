"use client";

import { useState } from "react";
import { loginUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { MdEmail } from "react-icons/md";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await loginUser(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err.code);
    }
  };

  const handleGoogleLogin = () => {
    // TODO: Add Firebase Google Auth
    alert("Google login clicked");
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      backgroundColor: "#f7f7f7"
    }}>
      <div style={{
        padding: "2rem",
        borderRadius: "12px",
        backgroundColor: "#fff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        width: "100%",
        maxWidth: "400px"
      }}>
        <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Sign In</h2>

        <button
          onClick={handleGoogleLogin}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            width: "100%",
            padding: "0.75rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
            marginBottom: "1rem",
            cursor: "pointer",
            backgroundColor: "#fff"
          }}
        >
          <FcGoogle size={24} /> Continue with Google
        </button>

        <button
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            width: "100%",
            padding: "0.75rem",
            border: "1px solid #ccc",
            borderRadius: "8px",
            marginBottom: "1rem",
            cursor: "pointer",
            backgroundColor: "#fff"
          }}
        >
          <MdEmail size={24} /> Continue with Email
        </button>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.75rem",
              marginBottom: "0.75rem",
              borderRadius: "8px",
              border: "1px solid #ccc"
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.75rem",
              marginBottom: "0.75rem",
              borderRadius: "8px",
              border: "1px solid #ccc"
            }}
          />

          {error && <p style={{ color: "red", marginBottom: "0.5rem" }}>{error}</p>}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "8px",
              backgroundColor: "#46e5daff",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
              border: "none"
            }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
