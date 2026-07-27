export function stripHtml(htmlOrText: string): string {
  return htmlOrText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function getWordCount(htmlOrText: string): number {
  const plain = stripHtml(htmlOrText);
  if (!plain) return 0;
  return plain.split(/\s+/).filter((w) => w.length > 0).length;
}
