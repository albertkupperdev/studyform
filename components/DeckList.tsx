"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DocumentUploader from "@/components/DocumentUploader";
import { createClient } from "@/lib/supabase/client";
import type { Document } from "@/types";

interface DeckWithStats extends Document {
  cardCount: number;
  dueCount: number;
}

interface Props {
  decks: DeckWithStats[];
}

function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)] ${className}`}>
      {children}
    </span>
  );
}

export default function DeckList({ decks }: Props) {
  const router = useRouter();
  const [showUploader, setShowUploader] = useState(decks.length === 0);

  const totalDue = decks.reduce((acc, d) => acc + d.dueCount, 0);
  const totalCards = decks.reduce((acc, d) => acc + d.cardCount, 0);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex-1 w-full">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <header className="mb-12">
          <div className="flex items-start justify-between gap-4 mb-6">
            <Eyebrow>Library · {new Date().getFullYear()}</Eyebrow>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] rounded-full transition-colors"
              style={{ color: "var(--muted)" }}
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>
              </svg>
              Sign out
            </button>
          </div>

          <h1 className="font-serif text-[56px] leading-[1.0] text-[var(--ink)]">
            Your <em className="not-italic" style={{ color: "var(--accent-deep)" }}>decks</em>.
          </h1>

          {/* Stat strip */}
          <div className="mt-7 grid grid-cols-3 divide-x" style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", borderColor: "var(--border)" }}>
            <StatCell label="Decks" value={decks.length} />
            <StatCell label="Cards" value={totalCards} />
            <StatCell label="Due now" value={totalDue} accent={totalDue > 0} />
          </div>
        </header>

        {/* New deck button / uploader */}
        <div className="mb-6">
          {!showUploader ? (
            <button
              onClick={() => setShowUploader(true)}
              className="group w-full inline-flex items-center justify-between gap-3 px-5 py-4 text-[15px] font-medium text-[var(--ink)] bg-white rounded-2xl transition-colors"
              style={{ border: "1.5px dashed var(--border-strong)" }}
            >
              <span className="inline-flex items-center gap-3">
                <span className="w-7 h-7 rounded-full flex items-center justify-center transition-colors" style={{ background: "var(--accent-bg)", color: "var(--accent-deep)" }}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </span>
                New deck
              </span>
              <Eyebrow className="opacity-60">PDF or URL</Eyebrow>
            </button>
          ) : (
            <DocumentUploader onCancel={decks.length > 0 ? () => setShowUploader(false) : undefined} />
          )}
        </div>

        {/* Deck list or empty state */}
        {decks.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center" style={{ border: "1px solid var(--border)" }}>
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-6" style={{ background: "var(--accent-bg)", color: "var(--accent-deep)" }}>
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </div>
            <h3 className="font-serif text-[28px] leading-tight text-[var(--ink)]">
              Nothing here <em className="not-italic" style={{ color: "var(--accent-deep)" }}>yet</em>.
            </h3>
            <p className="mt-3 text-[15px] max-w-xs mx-auto leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              Upload a PDF or paste a URL above. We'll write the cards in under a minute.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {decks.map((deck, i) => (
              <li key={deck.id}>
                <Link
                  href={`/deck/${deck.id}`}
                  className="group block bg-white rounded-2xl p-6 transition-all relative overflow-hidden"
                  style={{ border: "1px solid var(--border)" }}
                >
                  {/* Pistachio hover edge */}
                  <span className="absolute left-0 top-6 bottom-6 w-[3px] rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "var(--accent)" }} />

                  <div className="flex items-start gap-5">
                    <div className="flex-shrink-0 pt-1">
                      <span className="font-mono text-[11px] uppercase tracking-[0.14em] tabular-nums" style={{ color: "var(--soft)" }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-[22px] leading-[1.15] text-[var(--ink)]">
                        {deck.title}
                      </h3>
                      <div className="mt-2 flex items-center gap-2 text-[13px]" style={{ color: "var(--muted)" }}>
                        {deck.source_type === "pdf" ? (
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 1 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 1 0 7.07 7.07l1.5-1.5"/>
                          </svg>
                        )}
                        <span className="truncate">{deck.source_url ?? `${deck.title}.pdf`}</span>
                      </div>
                      <div className="mt-4 flex items-center gap-4">
                        <span className="font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--muted)" }}>
                          <span className="tabular-nums" style={{ color: "var(--ink)" }}>{deck.cardCount}</span> cards
                        </span>
                        {deck.dueCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--accent-deep)" }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                            <span className="tabular-nums" style={{ color: "var(--ink)" }}>{deck.dueCount}</span> due
                          </span>
                        ) : (
                          <span className="font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--soft)" }}>
                            · All caught up
                          </span>
                        )}
                      </div>
                    </div>
                    <svg viewBox="0 0 24 24" className="w-5 h-5 mt-1 transition-all group-hover:translate-x-0.5" style={{ color: "var(--border-strong)" }} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                    </svg>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCell({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="px-1 py-5 first:pl-0">
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">{label}</span>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-serif text-[40px] leading-none text-[var(--ink)]">{value}</span>
        {accent && <span className="w-2 h-2 rounded-full -translate-y-3" style={{ background: "var(--complement)" }} />}
      </div>
    </div>
  );
}
