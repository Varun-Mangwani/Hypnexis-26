import { describe, it, expect } from 'vitest';
import { splitIntoSegments } from '../features/evidence/splitIntoSegments';
import type { components } from '../api/schema';

type Claim = components['schemas']['Claim'];

const makeClaim = (id: string, text: string, start: number, end: number, supported: boolean): Claim => ({
  claim_id: id,
  text,
  span: [start, end],
  supported,
  evidence_chunk_id: null,
});

describe('splitIntoSegments', () => {
  it('returns single segment for empty claims', () => {
    const segs = splitIntoSegments('hello world', []);
    expect(segs).toHaveLength(1);
    expect(segs[0].text).toBe('hello world');
    expect(segs[0].claim).toBeNull();
  });

  it('returns empty array for empty text', () => {
    const segs = splitIntoSegments('', [makeClaim('c1', 'x', 0, 1, true)]);
    expect(segs).toHaveLength(0);
  });

  it('splits text around a single claim', () => {
    const text = 'The sky is blue today.';
    const segs = splitIntoSegments(text, [makeClaim('c1', 'sky is blue', 4, 15, true)]);
    expect(segs).toHaveLength(3);
    expect(segs[0].text).toBe('The ');
    expect(segs[0].claim).toBeNull();
    expect(segs[1].text).toBe('sky is blue');
    expect(segs[1].claim?.claim_id).toBe('c1');
    expect(segs[2].text).toBe(' today.');
    expect(segs[2].claim).toBeNull();
  });

  it('handles adjacent claims with no gap text', () => {
    const text = 'ABCDEF';
    const segs = splitIntoSegments(text, [
      makeClaim('c1', 'ABC', 0, 3, true),
      makeClaim('c2', 'DEF', 3, 6, false),
    ]);
    expect(segs).toHaveLength(2);
    expect(segs[0].text).toBe('ABC');
    expect(segs[1].text).toBe('DEF');
  });

  it('ignores out-of-bounds claims', () => {
    const text = 'Short text.';
    const segs = splitIntoSegments(text, [makeClaim('c1', 'beyond', 50, 60, true)]);
    expect(segs).toHaveLength(1);
    expect(segs[0].claim).toBeNull();
  });

  it('skips overlapping claims (keeps first)', () => {
    const text = 'ABCDEFGH';
    const segs = splitIntoSegments(text, [
      makeClaim('c1', 'ABCD', 0, 4, true),
      makeClaim('c2', 'CD', 2, 4, false),
    ]);
    expect(segs.some((s) => s.claim?.claim_id === 'c2')).toBe(false);
    expect(segs.some((s) => s.claim?.claim_id === 'c1')).toBe(true);
  });

  it('handles claim spanning entire text', () => {
    const text = 'entire text is one claim';
    const segs = splitIntoSegments(text, [makeClaim('c1', text, 0, text.length, true)]);
    expect(segs).toHaveLength(1);
    expect(segs[0].text).toBe(text);
    expect(segs[0].claim?.claim_id).toBe('c1');
  });

  it('handles multiple non-adjacent claims with gaps', () => {
    const text = 'The quick brown fox jumps over the lazy dog';
    const segs = splitIntoSegments(text, [
      makeClaim('c1', 'quick brown', 4, 15, true),
      makeClaim('c2', 'lazy dog', 35, 43, false),
    ]);
    expect(segs).toHaveLength(4);
    expect(segs[0].text).toBe('The ');
    expect(segs[0].claim).toBeNull();
    expect(segs[1].claim?.claim_id).toBe('c1');
    expect(segs[2].text).toBe(' fox jumps over the ');
    expect(segs[2].claim).toBeNull();
    expect(segs[3].claim?.claim_id).toBe('c2');
  });

  it('handles claim at very start (no prefix)', () => {
    const text = 'Hello world';
    const segs = splitIntoSegments(text, [makeClaim('c1', 'Hello', 0, 5, true)]);
    expect(segs[0].text).toBe('Hello');
    expect(segs[1].text).toBe(' world');
  });

  it('handles claim at very end (no suffix)', () => {
    const text = 'Hello world';
    const segs = splitIntoSegments(text, [makeClaim('c1', 'world', 6, 11, false)]);
    expect(segs[0].text).toBe('Hello ');
    expect(segs[1].text).toBe('world');
    expect(segs.length).toBe(2);
  });
});
