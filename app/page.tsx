"use client";
import { useState } from "react";
import type { ResearchResponse } from "@/lib/research";

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ResearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/research?q=${encodeURIComponent(query.trim())}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <header style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#35E0D0,#8b5cf6)", display: "grid", placeItems: "center", fontWeight: 800, color: "#0a0c10" }}>V</div>
          <h1 style={{ margin: 0, fontSize: "1.75rem", letterSpacing: "-0.02em" }}>Veritas</h1>
        </div>
        <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.95rem" }}>
          Autonomous multi-node public research engine · Investigative journalism workspace
        </p>
      </header>

      <form onSubmit={runSearch} style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search person, organization, ticker, domain..."
          style={{
            flex: 1, padding: "0.9rem 1.1rem", borderRadius: 10, border: "1px solid #1e2633",
            background: "#12161e", color: "#e8f0f5", fontSize: "1rem"
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.9rem 1.5rem", borderRadius: 10, border: "none",
            background: loading ? "#1e2633" : "linear-gradient(135deg,#35E0D0,#2bb8ab)",
            color: "#0a0c10", fontWeight: 700, fontSize: "0.95rem"
          }}
        >
          {loading ? "Searching..." : "Investigate"}
        </button>
      </form>

      {error && (
        <div className="card" style={{ borderColor: "var(--red)", marginBottom: "1.5rem" }}>
          <strong style={{ color: "var(--red)" }}>Error:</strong> {error}
        </div>
      )}

      {data && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
            {data.connectorStates.map((c) => (
              <span key={c.id} className="badge" style={{
                background: c.status === "ok" ? "rgba(53,224,208,0.15)" : "rgba(239,68,68,0.15)",
                color: c.status === "ok" ? "var(--cyan)" : "var(--red)"
              }}>
                {c.id}: {c.status}
              </span>
            ))}
          </div>

          {data.warnings.length > 0 && (
            <div className="card" style={{ marginBottom: "1.5rem", borderColor: "var(--amber)" }}>
              <strong style={{ color: "var(--amber)" }}>Notes:</strong>
              <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.2rem", color: "var(--muted)" }}>
                {data.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
            {data.results.length} leads · Queried at {new Date(data.searchedAt).toLocaleString()} · Public records only (lead list, not findings)
          </p>

          <div style={{ display: "grid", gap: "1rem" }}>
            {data.results.map((r) => (
              <article key={r.id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "0.5rem" }}>
                  <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--cyan)", textDecoration: "none" }}>
                      {r.title}
                    </a>
                  </h2>
                  <span className="badge" style={{ background: "rgba(139,92,246,0.15)", color: "var(--violet)", whiteSpace: "nowrap" }}>
                    {r.confidence}% · {r.source}
                  </span>
                </div>
                <p style={{ margin: "0 0 0.6rem", color: "var(--muted)", fontSize: "0.9rem" }}>{r.summary}</p>
                <div style={{ fontSize: "0.75rem", color: "#5a6a80", fontFamily: "ui-monospace, monospace" }}>
                  {r.provenance} · {r.entityType} · publicOnly
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {!data && !loading && (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
          <p style={{ color: "var(--muted)", margin: 0 }}>
            Enter a name, company, ticker, or domain.<br />
            Live multi-node search across Wikidata · SEC · GDELT · Wikipedia · OpenAlex
          </p>
        </div>
      )}

      <footer style={{ marginTop: "4rem", paddingTop: "1.5rem", borderTop: "1px solid #1e2633", color: "#5a6a80", fontSize: "0.8rem" }}>
        Veritas Investigative Intelligence · Autonomous public research · AI assistive only · Source trail always visible
      </footer>
    </main>
  );
}
