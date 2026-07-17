export function descriptionToTldr(description: string): string[] {
  const sentences = description
    .match(/[^。！？!?]+[。！？!?]?/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean);

  return sentences && sentences.length > 1 ? sentences.slice(0, 3) : [description];
}
