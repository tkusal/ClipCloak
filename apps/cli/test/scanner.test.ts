import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import { scanFile, getPacks, MAX_FILE_SIZE } from '../src/utils/scanner.js';

vi.mock('node:fs');

describe('CLI: scanner utils', () => {
  let exitSpy: any;
  let errorSpy: any;
  let warnSpy: any;

  beforeEach(() => {
    vi.resetAllMocks();
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
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
      expect(packs.some(p => p.id === 'br')).toBe(true);
    });

    it('should ignore invalid packs', () => {
      const packs = getPacks(['generic', 'invalid']);
      expect(packs).toHaveLength(1);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('not found'));
    });
  });

  describe('scanFile', () => {
    it('should skip file if larger than MAX_FILE_SIZE', () => {
      vi.mocked(fs.statSync).mockReturnValue({ size: MAX_FILE_SIZE + 100 } as any);
      const result = scanFile('large.txt', []);
      expect(result.findings).toHaveLength(0);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('too large'));
    });

    it('should scan normal file', () => {
      vi.mocked(fs.statSync).mockReturnValue({ size: 1024 } as any);
      vi.mocked(fs.readFileSync).mockReturnValue('normal text');
      const packs = getPacks();
      const result = scanFile('test.txt', packs);
      expect(result.findings).toBeDefined();
    });

    it('should fail fast on read error', () => {
      vi.mocked(fs.statSync).mockImplementation(() => { throw new Error('Cannot stat'); });
      scanFile('test.txt', []);
      expect(errorSpy).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(2);
    });
  });
});
