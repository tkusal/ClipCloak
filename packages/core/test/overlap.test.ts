import { describe, it, expect } from 'vitest';
import { resolveOverlaps } from '../src/overlap.js';
import type { Finding } from '../src/types.js';

describe('Core Overlap Resolution', () => {
  const createMockFinding = (
    start: number,
    end: number,
    severity: Finding['severity'] = 'low',
    confidence: number = 0.5,
  ): Finding => ({
    detectorId: 'test',
    packId: 'test',
    category: 'secret',
    severity,
    confidence,
    start,
    end,
    redactedPreview: '***',
    reason: 'test',
  });

  it('should return empty or single finding unchanged', () => {
    expect(resolveOverlaps([])).toEqual([]);
    const single = [createMockFinding(0, 10)];
    expect(resolveOverlaps(single)).toEqual(single);
  });

  it('should keep disjoint findings', () => {
    const f1 = createMockFinding(0, 5);
    const f2 = createMockFinding(10, 15);
    expect(resolveOverlaps([f2, f1])).toEqual([f1, f2]); // Output should be sorted by start index
  });

  it('should resolve full overlap (nested) prioritizing higher severity', () => {
    // E.g. an email inside a connection string
    const email = createMockFinding(5, 15, 'low', 0.9);
    const connString = createMockFinding(0, 20, 'high', 0.8);

    const resolved = resolveOverlaps([email, connString]);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].severity).toBe('high'); // Kept connString
  });

  it('should resolve partial overlap prioritizing confidence when severity is equal', () => {
    const f1 = createMockFinding(0, 10, 'medium', 0.8);
    const f2 = createMockFinding(5, 15, 'medium', 0.9);

    const resolved = resolveOverlaps([f1, f2]);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].confidence).toBe(0.9); // Kept f2
  });

  it('should prioritize longer match when severity and confidence are equal', () => {
    const f1 = createMockFinding(0, 10, 'medium', 0.8); // length 10
    const f2 = createMockFinding(0, 15, 'medium', 0.8); // length 15

    const resolved = resolveOverlaps([f1, f2]);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].end).toBe(15); // Kept f2
  });
});
