import type { components } from '../../api/schema';

export type Claim = components['schemas']['Claim'];

export interface TextSegment {
  text: string;
  claim: Claim | null;
}

export function splitIntoSegments(text: string, claims: Claim[]): TextSegment[] {
  if (!text) return [];
  if (!claims || claims.length === 0) return [{ text, claim: null }];

  const sorted = [...claims]
    .filter((c) => c.span.length >= 2 && c.span[0] < c.span[1] && c.span[1] <= text.length)
    .sort((a, b) => a.span[0] - b.span[0]);

  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const claim of sorted) {
    const [start, end] = claim.span;
    if (start < cursor) continue;
    if (start > cursor) {
      segments.push({ text: text.slice(cursor, start), claim: null });
    }
    segments.push({ text: text.slice(start, end), claim });
    cursor = end;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), claim: null });
  }

  return segments;
}
