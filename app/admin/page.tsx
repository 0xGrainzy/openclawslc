"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const MONO: React.CSSProperties = {
  fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
};
const BEBAS: React.CSSProperties = {
  fontFamily: "'Bebas Neue',sans-serif",
  letterSpacing: "0.02em",
};

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  lumaUrl: string;
  createdAt: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    title: "",
    date: "",
    time: "18:00",
    description: "",
    lumaUrl: "",
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch {
      setError("Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/admin/login");
    }
    if (status === "authenticated") {
      fetchEvents();
    }
  }, [status, router, fetchEvents]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const dateTime = `${form.date}T${form.time}:00`;
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          date: dateTime,
          description: form.description,
          lumaUrl: form.lumaUrl,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create");
      }
      setSuccess("Event added successfully");
      setForm({ title: "", date: "", time: "18:00", description: "", lumaUrl: "" });
      fetchEvents();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add event");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setSuccess("Event deleted");
      fetchEvents();
    } catch {
      setError("Failed to delete event");
    }
  };

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...MONO, fontSize: "0.52rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.14em" }}>
          LOADING...
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const now = new Date();
  const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div style={{ minHeight: "100vh", background: "#000", padding: "clamp(20px,4vw,48px)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ ...BEBAS, fontSize: "2rem", color: "#fff" }}>
              OPENCLAW <span style={{ color: "#2563EB" }}>SLC</span>
            </div>
            <div style={{ ...MONO, fontSize: "0.42rem", letterSpacing: "0.24em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
              Admin Panel — {session?.user?.email}
            </div>
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              style={{
                padding: "6px 12px", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.45)",
                border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer",
                ...MONO, fontSize: "0.42rem", letterSpacing: "0.12em", textTransform: "uppercase",
              }}
            >
              Sign Out
            </button>
            <a href="/" style={{ ...MONO, fontSize: "0.48rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>
              ← Back
            </a>
          </div>
        </div>

        {/* Feedback banners */}
        {error && (
          <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#FCA5A5", ...MONO, fontSize: "0.52rem", marginBottom: "1.5rem" }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ padding: "10px 14px", background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.35)", color: "#93C5FD", ...MONO, fontSize: "0.52rem", marginBottom: "1.5rem" }}>
            {success}
          </div>
        )}

        {/* Add Event Form */}
        <div style={{ border: "1px solid rgba(255,255,255,0.10)", padding: "1.75rem", marginBottom: "2.5rem" }}>
          <div style={{ ...MONO, fontSize: "0.42rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "#2563EB", marginBottom: "1.25rem" }}>
            Add Event
          </div>
          <form onSubmit={handleAddEvent} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={labelStyle}>Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required
                  style={inputStyle}
                  placeholder="Event name"
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <div>
                  <label style={labelStyle}>Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Time *</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
                placeholder="What's this event about?"
              />
            </div>
            <div>
              <label style={labelStyle}>Luma URL *</label>
              <input
                type="url"
                value={form.lumaUrl}
                onChange={e => setForm(f => ({ ...f, lumaUrl: e.target.value }))}
                required
                style={inputStyle}
                placeholder="https://lu.ma/..."
              />
            </div>
            <button type="submit" style={{
              padding: "11px 20px", background: "#2563EB", color: "#fff",
              border: "none", cursor: "pointer", ...MONO, fontSize: "0.60rem",
              letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700,
              alignSelf: "flex-start",
            }}>
              ADD EVENT →
            </button>
          </form>
        </div>

        {/* Event list */}
        <div>
          <div style={{ ...MONO, fontSize: "0.42rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "#2563EB", marginBottom: "1.25rem" }}>
            All Events ({events.length})
          </div>
          {loading && (
            <div style={{ ...MONO, fontSize: "0.52rem", color: "rgba(255,255,255,0.35)" }}>Loading...</div>
          )}
          {sorted.map(ev => {
            const evDate = new Date(ev.date);
            const isPast = evDate < now;
            return (
              <div key={ev.id} style={{
                padding: "1.25rem", borderTop: "1px solid rgba(255,255,255,0.08)",
                display: "flex", gap: "1rem", alignItems: "flex-start",
                opacity: isPast ? 0.5 : 1,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", flexWrap: "wrap", marginBottom: "0.35rem" }}>
                    <span style={{ fontSize: "1rem", fontWeight: 700, color: "#fff" }}>{ev.title}</span>
                    {isPast && <span style={{ ...MONO, fontSize: "0.38rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>PAST</span>}
                  </div>
                  <div style={{ ...MONO, fontSize: "0.48rem", color: "rgba(255,255,255,0.45)", marginBottom: "0.25rem" }}>
                    {evDate.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}
                  </div>
                  {ev.description && (
                    <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: "0.35rem" }}>{ev.description}</div>
                  )}
                  <a href={ev.lumaUrl} target="_blank" rel="noopener noreferrer"
                    style={{ ...MONO, fontSize: "0.42rem", color: "#60A5FA", textDecoration: "none", letterSpacing: "0.1em" }}>
                    {ev.lumaUrl}
                  </a>
                </div>
                <button
                  onClick={() => handleDelete(ev.id, ev.title)}
                  style={{
                    padding: "6px 12px", background: "rgba(239,68,68,0.1)", color: "#FCA5A5",
                    border: "1px solid rgba(239,68,68,0.25)", cursor: "pointer",
                    ...MONO, fontSize: "0.42rem", letterSpacing: "0.12em", textTransform: "uppercase",
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.25)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.1)"; }}
                >
                  Delete
                </button>
              </div>
            );
          })}
          {!loading && events.length === 0 && (
            <div style={{ ...MONO, fontSize: "0.52rem", color: "rgba(255,255,255,0.25)", padding: "1rem 0" }}>
              No events yet. Add your first one above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
  fontSize: "0.42rem",
  letterSpacing: "0.16em",
  textTransform: "uppercase" as const,
  color: "rgba(255,255,255,0.40)",
  display: "block",
  marginBottom: "0.4rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#fff",
  fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
  fontSize: "0.82rem",
  outline: "none",
};
