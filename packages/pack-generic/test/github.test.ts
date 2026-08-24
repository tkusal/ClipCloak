import { describe, it, expect } from 'vitest';
import { githubDetector } from '../src/detectors/github.js';

describe('Generic Pack: GitHub Detector', () => {
  it('should detect classic PAT', () => {
    const text = 'Here is my token: ghp_' + 'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8';
    const findings = githubDetector.detect(text);
    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('github-token');
  });
  it('should detect fine-grained PAT', () => {
    const text = 'github' + '_pat_' + '1146kA9mAevJjpl1xDqyXeM5EQVYT7o5gmL7T6NPJQK0R9kvlWrcSblwxhFYiSElcc3X9WQwErTyUiOpA7';
    const findings = githubDetector.detect(text);
    expect(findings).toHaveLength(1);
  });
  it('should ignore false positives', () => {
    const text = 'ghp_short';
    const findings = githubDetector.detect(text);
    expect(findings).toHaveLength(0);
  });
  it('should ignore dummy strings', () => {
    const text = 'ghp_123456789012345678901234567890123456';
    const findings = githubDetector.detect(text);
    expect(findings).toHaveLength(0);
  });
});
