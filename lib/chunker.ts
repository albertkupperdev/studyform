const MIN_CHUNK = 200;
const MAX_CHUNK = 800;

export function chunkText(text: string): string[] {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const paragraphs = normalized
    .split(/\n\n+/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 30);

  const chunks: string[] = [];
  let buffer = "";

  for (const paragraph of paragraphs) {
    if (buffer.length + paragraph.length <= MAX_CHUNK) {
      buffer = buffer ? `${buffer} ${paragraph}` : paragraph;
    } else {
      if (buffer.length >= MIN_CHUNK) {
        chunks.push(buffer);
      }

      if (paragraph.length > MAX_CHUNK) {
        const sentences = paragraph.split(/(?<=[.!?])\s+/);
        buffer = "";
        for (const sentence of sentences) {
          if (buffer.length + sentence.length <= MAX_CHUNK) {
            buffer = buffer ? `${buffer} ${sentence}` : sentence;
          } else {
            if (buffer.length >= MIN_CHUNK) chunks.push(buffer);
            buffer = sentence;
          }
        }
      } else {
        buffer = paragraph;
      }
    }
  }

  if (buffer.length >= MIN_CHUNK) chunks.push(buffer);

  return chunks;
}
