import { describe, it, expect } from 'vitest';
import { tokensDetector } from '../src/detectors/tokens.js';

describe('Generic Pack: Tokens Detector', () => {
  it('should detect OpenAI sk-proj format', () => {
    const text = 'Here is my key: sk-proj-1234567890abcdef1234567890abcdef';
    const findings = tokensDetector.detect(text);
    
    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('openai-api-key');
    expect(findings[0].severity).toBe('critical');
    expect(findings[0].redactedPreview).toBe('sk-proj-********cdef');
  });

  it('should detect Anthropic sk-ant format', () => {
    const text = 'sk-ant-1234567890abcdef1234567890abcdef';
    const findings = tokensDetector.detect(text);
    
    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('anthropic-api-key');
  });

  it('should detect GitHub PAT format', () => {
    const text = 'Use this ghp_ABCdefGHIjklMNOpqrSTUvwxYZ0123456789';
    const findings = tokensDetector.detect(text);
    
    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('github-pat');
  });

  it('should ignore false positives', () => {
    const text = 'ask-me-anything ghp_short sk-123';
    const findings = tokensDetector.detect(text);
    expect(findings).toHaveLength(0);
  });
});
