export interface PaperEssencePoint {
  label: string;
  text: string;
}

function plainText(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractPaperEssence(body: string): PaperEssencePoint[] {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const headingIndex = lines.findIndex((line) =>
    /^##\s+.*(?:90\s*秒|paper in 90 seconds|90-second map)/i.test(line.trim()),
  );
  if (headingIndex < 0) return [];

  const points: PaperEssencePoint[] = [];
  for (const line of lines.slice(headingIndex + 1)) {
    if (/^##\s+/.test(line.trim())) break;
    const match = line.match(/^\s*-\s+\*\*(.+?)\*\*\s*[:：]?\s*(.+)$/);
    if (!match) continue;
    const label = plainText(match[1]).replace(/[:：]\s*$/, '');
    const text = plainText(match[2]);
    if (label && text) points.push({ label, text });
    if (points.length === 4) break;
  }
  return points;
}
