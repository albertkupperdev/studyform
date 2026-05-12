"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Card, ReviewRating } from "@/types";

function Eyebrow({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <span className={`font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)] ${className}`} style={style}>
      {children}
    </span>
  );
}

const RATE_STYLES: Record<ReviewRating, { bg: string; color: string; hoverBg: string; border: string }> = {
  again: { bg: "var(--complement-bg)",   color: "var(--complement-deep)", hoverBg: "var(--complement-bg-hover)", border: "var(--complement-border)" },
  hard:  { bg: "#fbf2dc",                color: "#8a6624",                hoverBg: "#f5e6bf",                   border: "#f0e3b8" },
  good:  { bg: "var(--accent-bg)",       color: "var(--accent-deep)",     hoverBg: "var(--accent-tint)",         border: "var(--accent-tint)" },
  easy:  { bg: "var(--bg-2)",            color: "var(--ink)",             hoverBg: "var(--bg-2-hover)",          border: "var(--border-strong)" },
};

const RATE_SUB: Record<ReviewRating, string> = {
  again: "< 1m", hard: "6m", good: "10m", easy: "4d",
};

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [cards, setCards] = useState<Card[]>([]);
  const [chunkMap, setChunkMap] = useState<Map<string, string>>(new Map());
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [ratings, setRatings] = useState<ReviewRating[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [noCards, setNoCards] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const today = new Date().toISOString().split("T")[0];
      const { data: allCards } = await supabase.from("cards").select("*").eq("document_id", id);
      if (!allCards || allCards.length === 0) { setNoCards(true); setLoaded(true); return; }
      const { data: reviews } = await supabase.from("card_reviews").select("card_id, due_date").in("card_id", allCards.map((c) => c.id));
      const reviewedMap = new Map(reviews?.map((r) => [r.card_id, r.due_date]));
      const due = allCards.filter((c) => { const d = reviewedMap.get(c.id); return !d || d <= today; });

      const { data: chunks } = await supabase
        .from("chunks")
        .select("id, content")
        .in("id", due.map((c) => c.chunk_id));
      setChunkMap(new Map(chunks?.map((ch) => [ch.id, ch.content]) ?? []));

      setCards(due);
      setLoaded(true);
    }
    load();
  }, [id]);

  async function rate(rating: ReviewRating) {
    if (submitting) return;
    setSubmitting(true);
    const card = cards[idx];
    await fetch(`/api/review/${card.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating }),
    });
    setRatings((prev) => [...prev, rating]);
    setIdx((prev) => prev + 1);
    setRevealed(false);
    setShowSource(false);
    setSubmitting(false);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!loaded || idx >= cards.length) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (!revealed) setRevealed(true); }
      if (revealed) {
        if (e.key === "1") rate("again");
        if (e.key === "2") rate("hard");
        if (e.key === "3") rate("good");
        if (e.key === "4") rate("easy");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [revealed, idx, loaded, cards.length]);

  if (!loaded) return <Shell message="Loading…" />;
  if (noCards) return <Shell message="No cards found." />;

  const total = cards.length;
  const done = idx >= total;

  if (done) {
    const counts = ratings.reduce<Record<ReviewRating, number>>(
      (acc, r) => ({ ...acc, [r]: (acc[r] || 0) + 1 }),
      { again: 0, hard: 0, good: 0, easy: 0 }
    );
    return (
      <div className="flex-1 w-full">
        <div className="max-w-lg mx-auto px-6 py-20">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-8" style={{ background: "var(--accent)" }}>
              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--ink)" }}>
                <path d="M5 12l5 5L20 7"/>
              </svg>
            </div>
            <Eyebrow>Session complete</Eyebrow>
            <h1 className="mt-3 font-serif text-[48px] leading-[1.05] text-[var(--ink)]">
              Nice <em className="not-italic" style={{ color: "var(--accent-deep)" }}>work</em>.
            </h1>
            <p className="mt-4 text-[16px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              You reviewed <span className="font-medium text-[var(--ink)]">{total}</span> {total === 1 ? "card" : "cards"}.
            </p>
          </div>

          <dl className="mt-10 grid grid-cols-4 gap-2">
            {(["again", "hard", "good", "easy"] as ReviewRating[]).map((r) => {
              const s = RATE_STYLES[r];
              return (
                <div key={r} className="rounded-2xl p-4" style={{ background: s.bg, color: s.color }}>
                  <Eyebrow className="text-current opacity-80">{r}</Eyebrow>
                  <div className="mt-2 font-serif text-[32px] leading-none tabular-nums">{counts[r]}</div>
                </div>
              );
            })}
          </dl>

          <button
            onClick={() => router.push(`/deck/${id}`)}
            className="mt-10 w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 text-[15px] font-medium rounded-xl transition-colors group"
            style={{ background: "var(--ink)", color: "var(--bg)" }}
          >
            Back to deck
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  const card = cards[idx];

  return (
    <div className="flex-1 w-full flex flex-col">
      {/* Progress header */}
      <div className="max-w-3xl w-full mx-auto px-6 pt-10 pb-8">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => router.push(`/deck/${id}`)}
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors"
            style={{ color: "var(--muted)" }}
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"/><path d="m12 5-7 7 7 7"/>
            </svg>
            Exit
          </button>
          <Eyebrow>
            <span className="tabular-nums" style={{ color: "var(--ink)" }}>{String(idx + 1).padStart(2, "0")}</span>
            <span className="mx-1.5" style={{ color: "var(--border-strong)" }}>/</span>
            <span className="tabular-nums">{String(total).padStart(2, "0")}</span>
          </Eyebrow>
        </div>

        {/* Segmented progress bar */}
        <div className="flex gap-1">
          {cards.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{
                background: i < idx ? "var(--accent)" : i === idx ? "var(--ink)" : "var(--border-strong)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 w-full flex items-start justify-center px-6 pb-10">
        <div className="w-full max-w-3xl">
          <div className="bg-white rounded-3xl min-h-[360px] p-8 sm:p-12 flex flex-col relative overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            {/* Corner index */}
            <span className="absolute top-6 right-7 font-mono text-[11px] uppercase tracking-[0.14em] tabular-nums" style={{ color: "var(--border-strong)" }}>
              {String(idx + 1).padStart(2, "0")} · {String(total).padStart(2, "0")}
            </span>

            <Eyebrow>Question</Eyebrow>
            <p className="mt-4 font-serif text-[34px] sm:text-[40px] leading-[1.15] text-[var(--ink)]">
              {card.front}
            </p>

            {revealed && (
              <div className="mt-10 pt-8" style={{ borderTop: "1px solid var(--border)" }}>
                <Eyebrow style={{ color: "var(--accent-deep)" }}>Answer</Eyebrow>
                <p className="mt-3 text-[17px] sm:text-[18px] leading-[1.65]" style={{ color: "var(--ink-soft)" }}>
                  {card.back}
                </p>

                {chunkMap.has(card.chunk_id) && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowSource((v) => !v)}
                      className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors"
                      style={{ color: showSource ? "var(--accent-deep)" : "var(--soft)" }}
                    >
                      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={showSource ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
                      </svg>
                      See source
                    </button>
                    {showSource && (
                      <div className="mt-3 pl-3" style={{ borderLeft: "2px solid var(--accent)" }}>
                        <p className="text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
                          {chunkMap.get(card.chunk_id)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6">
            {!revealed ? (
              <button
                onClick={() => setRevealed(true)}
                className="w-full inline-flex items-center justify-center gap-3 px-4 py-4 text-[16px] font-medium rounded-2xl transition-colors"
                style={{ background: "var(--ink)", color: "var(--bg)" }}
              >
                Show answer
                <span className="font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--soft)" }}>
                  Space
                </span>
              </button>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["again", "hard", "good", "easy"] as ReviewRating[]).map((r, i) => {
                  const s = RATE_STYLES[r];
                  return (
                    <button
                      key={r}
                      onClick={() => rate(r)}
                      disabled={submitting}
                      className="inline-flex flex-col items-center justify-center px-3 py-4 rounded-2xl border transition-colors disabled:opacity-50 capitalize"
                      style={{ background: s.bg, color: s.color, borderColor: s.border }}
                    >
                      <span className="text-[15px] font-semibold">{r}</span>
                      <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] opacity-70">
                        {i + 1} · {RATE_SUB[r]}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Shell({ message }: { message: string }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-sm" style={{ color: "var(--muted)" }}>{message}</p>
    </div>
  );
}
