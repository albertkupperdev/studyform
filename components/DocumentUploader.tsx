"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tab = "pdf" | "url";

export default function DocumentUploader({ onCancel }: { onCancel?: () => void }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = tab === "pdf" ? !!file : /^https?:\/\/\S+/.test(url);

  async function handleSubmit() {
    if (!ready) return;
    setLoading(true);
    setError(null);

    try {
      let documentId: string;

      if (tab === "pdf") {
        const formData = new FormData();
        formData.append("file", file!);
        const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        documentId = data.documentId;
      } else {
        const res = await fetch("/api/documents/url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        documentId = data.documentId;
      }

      router.push(`/deck/${documentId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-5">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
          New deck
        </span>
        {onCancel && (
          <button
            onClick={onCancel}
            className="font-mono text-[11px] uppercase tracking-[0.14em] transition-colors"
            style={{ color: "var(--muted-soft)" }}
          >
            Cancel
          </button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="inline-flex p-1 rounded-full mb-5" style={{ background: "var(--bg-2)" }}>
        {(["pdf", "url"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] rounded-full transition-colors"
            style={
              tab === t
                ? { background: "white", color: "var(--ink)", boxShadow: "0 1px 2px rgba(22,23,15,0.08)" }
                : { color: "var(--muted)" }
            }
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === "pdf" ? (
        <label className="block cursor-pointer">
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div
            className="w-full px-6 py-12 rounded-xl text-center transition-colors group"
            style={{
              border: "1.5px dashed var(--border-strong)",
            }}
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 mx-auto mb-3 transition-colors" style={{ color: "var(--soft)" }} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>
            </svg>
            {file ? (
              <p className="text-[15px] font-medium text-[var(--ink)]">{file.name}</p>
            ) : (
              <>
                <p className="text-[15px] font-medium text-[var(--ink)]">Drop a PDF or click to upload</p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--muted-soft)" }}>
                  Up to 50 pages · 20 MB
                </p>
              </>
            )}
          </div>
        </label>
      ) : (
        <input
          type="url"
          placeholder="https://en.wikipedia.org/wiki/Mitochondrion"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full px-4 py-3.5 text-base text-[var(--ink)] placeholder:text-[var(--soft)] rounded-xl outline-none transition-all"
          style={{ background: "var(--bg-3)", border: "1px solid var(--border-strong)" }}
        />
      )}

      {error && <p className="mt-3 text-sm" style={{ color: "var(--complement-deep)" }}>{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!ready || loading}
        className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium rounded-xl transition-colors group"
        style={{
          background: ready && !loading ? "var(--accent)" : "var(--bg-2)",
          color: ready && !loading ? "var(--ink)" : "var(--soft)",
          cursor: ready && !loading ? "pointer" : "not-allowed",
        }}
      >
        {loading ? "Processing…" : "Generate flashcards"}
        {!loading && (
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
          </svg>
        )}
      </button>
    </div>
  );
}
