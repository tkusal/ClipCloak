import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import { scanFile, getPacks, MAX_FILE_SIZE } from '../src/utils/scanner.js';

vi.mock('node:fs');

import type { MockInstance } from 'vitest';

describe('CLI: scanner utils', () => {
  let exitSpy: MockInstance;
  let warnSpy: MockInstance;

  beforeEach(() => {
    vi.resetAllMocks();
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getPacks', () => {
    it('should return all packs if no names provided', () => {
      const packs = getPacks();
      expect(packs.length).toBeGreaterThanOrEqual(3);
    });

    it('should return specific packs', () => {
      const packs = getPacks(['br', 'eu']);
      expect(packs).toHaveLength(2);
      expect(packs.some((p) => p.id === 'br')).toBe(true);
    });

    it('should throw on invalid packs', () => {
      expect(() => getPacks(['generic', 'invalid'])).toThrow("Pack 'invalid' not found");
    });
  });

  describe('scanFile', () => {
    it('should skip file if larger than MAX_FILE_SIZE', () => {
      vi.mocked(fs.statSync).mockReturnValue({ size: MAX_FILE_SIZE + 100, isFile: () => true } as unknown as fs.Stats);
      const result = scanFile('large.txt', []);
      expect(result.findings).toHaveLength(0);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('too large'));
    });

    it('should scan normal file', () => {
      vi.mocked(fs.statSync).mockReturnValue({ size: 1024, isFile: () => true } as unknown as fs.Stats);
      vi.mocked(fs.readFileSync).mockReturnValue('normal text');
      const packs = getPacks();
      const result = scanFile('test.txt', packs);
      expect(result.findings).toBeDefined();
    });

    it('should return error on read error', () => {
      vi.mocked(fs.statSync).mockImplementation(() => {
        throw new Error('Cannot stat');
      });
      const result = scanFile('test.txt', []);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].errorMessage).toContain('Cannot stat');
      expect(exitSpy).not.toHaveBeenCalled();
      expect(result.findings).toHaveLength(0);
    });
  });
});
