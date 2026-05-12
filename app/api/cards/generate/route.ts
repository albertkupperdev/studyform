import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { groq, AI_MODEL } from "@/lib/ai";
import { buildCardGenerationPrompt } from "@/lib/prompts";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { documentId } = await request.json();

  if (!documentId) {
    return NextResponse.json({ error: "documentId is required" }, { status: 400 });
  }

  const { data: document } = await supabase
    .from("documents")
    .select("id, user_id")
    .eq("id", documentId)
    .single();

  if (!document || document.user_id !== user.id) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const { data: chunks, error: chunksError } = await supabase
    .from("chunks")
    .select("id, content")
    .eq("document_id", documentId)
    .order("chunk_index");

  if (chunksError || !chunks || chunks.length === 0) {
    return NextResponse.json({ error: "No chunks found for this document" }, { status: 404 });
  }

  const allCards: { document_id: string; chunk_id: string; front: string; back: string }[] = [];

  for (const chunk of chunks) {
    try {
      const completion = await groq.chat.completions.create({
        model: AI_MODEL,
        messages: [
          {
            role: "user",
            content: buildCardGenerationPrompt(chunk.content),
          },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      });

      const raw = completion.choices[0]?.message?.content ?? "";

      let parsed: { front: string; back: string }[];
      try {
        parsed = JSON.parse(raw);
      } catch {
        const match = raw.match(/\[[\s\S]*\]/);
        if (!match) continue;
        parsed = JSON.parse(match[0]);
      }

      if (!Array.isArray(parsed)) continue;

      for (const card of parsed) {
        if (typeof card.front === "string" && typeof card.back === "string") {
          allCards.push({
            document_id: documentId,
            chunk_id: chunk.id,
            front: card.front.trim(),
            back: card.back.trim(),
          });
        }
      }
    } catch {
      continue;
    }
  }

  if (allCards.length === 0) {
    return NextResponse.json({ error: "Failed to generate any cards" }, { status: 500 });
  }

  const { data: savedCards, error: saveError } = await supabase
    .from("cards")
    .insert(allCards)
    .select();

  if (saveError || !savedCards) {
    return NextResponse.json({ error: "Failed to save cards" }, { status: 500 });
  }

  return NextResponse.json({ cards: savedCards });
}
