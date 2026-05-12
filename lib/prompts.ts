export function buildCardGenerationPrompt(chunk: string): string {
  return `You are a flashcard generator creating spaced-repetition cards for serious study.

Rules:
- Each card tests exactly ONE concept, fact, definition, or relationship
- The front must be a specific, unambiguous question
- The back must be a concise answer — 1 to 3 sentences maximum
- Do not generate cards about vague or overly general ideas
- Do not repeat the same concept across multiple cards
- Only generate cards for information that is explicitly stated in the text
- Generate between 2 and 4 cards

Return a JSON array only — no explanation, no markdown, no code fences:
[
  { "front": "...", "back": "..." }
]

Text:
${chunk}`;
}
