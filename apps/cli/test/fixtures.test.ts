import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { scanFile, getPacks } from '../src/utils/scanner.js';

describe('Fixtures', () => {
  const fixturesDir = path.resolve(__dirname, '../../../packages/core/test/fixtures');
  const allPacks = getPacks();

  describe('true-positive', () => {
    const dir = path.join(fixturesDir, 'true-positive');
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        it(`should detect secrets in ${file}`, () => {
          const filepath = path.join(dir, file);
          const result = scanFile(filepath, allPacks, { minConfidence: 0.5, minSeverity: 'low' });
          expect(result.errors).toHaveLength(0);
          expect(result.findings.length).toBeGreaterThan(0);
        });
      }
    }
  });

  describe('true-negative', () => {
    const dir = path.join(fixturesDir, 'true-negative');
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        it(`should NOT detect secrets in ${file}`, () => {
          const filepath = path.join(dir, file);
          const result = scanFile(filepath, allPacks, { minConfidence: 0.5, minSeverity: 'low' });
          expect(result.errors).toHaveLength(0);
          expect(result.findings).toHaveLength(0);
        });
      }
    }
  });

  describe('false-positive', () => {
    const dir = path.join(fixturesDir, 'false-positive');
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        it(`should NOT detect secrets in ${file}`, () => {
          const filepath = path.join(dir, file);
          const result = scanFile(filepath, allPacks, { minConfidence: 0.5, minSeverity: 'low' });
          expect(result.errors).toHaveLength(0);
          expect(result.findings).toHaveLength(0);
        });
      }
    }
  });

  describe('malformed', () => {
    const dir = path.join(fixturesDir, 'malformed');
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        it(`should gracefully handle ${file} without crashing`, () => {
          const filepath = path.join(dir, file);
          const result = scanFile(filepath, allPacks, { minConfidence: 0.5, minSeverity: 'low' });
          expect(result).toBeDefined();
        });
      }
    }
  });

  describe('regression', () => {
    const dir = path.join(fixturesDir, 'regression');
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        it(`should pass regression tests for ${file}`, () => {
          const filepath = path.join(dir, file);
          const result = scanFile(filepath, allPacks, { minConfidence: 0.5, minSeverity: 'low' });
          expect(result).toBeDefined();
        });
      }
    }
  });
});
