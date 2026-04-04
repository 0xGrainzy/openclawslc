"use client";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

const MONO: React.CSSProperties = {
  fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
};
const BEBAS: React.CSSProperties = {
  fontFamily: "'Bebas Neue',sans-serif",
  letterSpacing: "0.02em",
};

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";
  const errorParam = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    errorParam === "AccessDenied"
      ? "Access denied. Only authorized users may sign in."
      : errorParam
      ? "Sign-in failed. Please try again."
      : ""
  );
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError("");
    await signIn("google", { callbackUrl });
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwLoading(true);
    setError("");
    const result = await signIn("password", {
      password,
      callbackUrl,
      redirect: false,
    });
    setPwLoading(false);
    if (result?.ok) {
      window.location.href = callbackUrl;
    } else {
      setError(
        result?.error === "Too many login attempts. Please wait a minute."
          ? result.error
          : "Invalid password."
      );
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Wordmark */}
        <div style={{ ...BEBAS, fontSize: "2rem", color: "#fff", marginBottom: "0.25rem" }}>
          OPENCLAW <span style={{ color: "#2563EB" }}>SLC</span>
        </div>
        <div style={{
          ...MONO,
          fontSize: "0.42rem",
          letterSpacing: "0.24em",
          color: "rgba(255,255,255,0.35)",
          marginBottom: "2.5rem",
          textTransform: "uppercase",
        }}>
          Admin Panel
        </div>

        {error && (
          <div style={{
            ...MONO,
            fontSize: "0.50rem",
            color: "#FCA5A5",
            letterSpacing: "0.08em",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.25)",
            padding: "10px 14px",
            marginBottom: "1.5rem",
          }}>
            {error}
          </div>
        )}

        {/* Google Sign In (Primary) */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            padding: "14px 20px",
            background: "#FFFFFF",
            color: "#000000",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            ...MONO,
            fontSize: "0.60rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontWeight: 700,
            marginBottom: "1.25rem",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          {loading ? "Signing in…" : "Sign in with Google"}
        </button>

        {/* Divider */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "1.25rem",
        }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.10)" }} />
          <span style={{ ...MONO, fontSize: "0.38rem", letterSpacing: "0.14em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.10)" }} />
        </div>

        {/* Password Form */}
        <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{
              ...MONO,
              fontSize: "0.42rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.40)",
              display: "block",
              marginBottom: "0.5rem",
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              placeholder="Enter password"
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff",
                ...MONO,
                fontSize: "0.85rem",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={pwLoading}
            style={{
              padding: "10px 20px",
              background: "rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.6)",
              border: "1px solid rgba(255,255,255,0.15)",
              cursor: pwLoading ? "not-allowed" : "pointer",
              opacity: pwLoading ? 0.7 : 1,
              ...MONO,
              fontSize: "0.55rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {pwLoading ? "Signing in…" : "Sign in →"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#000" }} />}>
      <LoginForm />
    </Suspense>
  );
}
