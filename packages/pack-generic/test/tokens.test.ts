import { describe, it, expect } from 'vitest';
import { tokensDetector } from '../src/detectors/tokens.js';

describe('Generic Pack: Tokens Detector', () => {
  it('should detect OpenAI sk-proj format', () => {
    const text = 'Here is my key: sk-proj-aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV';
    const findings = tokensDetector.detect(text);

    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('openai-api-key');
    expect(findings[0].severity).toBe('critical');
    expect(findings[0].redactedPreview).toBe('sk-proj-********T2uV');
  });

  it('should detect Anthropic sk-ant format', () => {
    const text = 'sk-ant-Z9yX8wV7uT6sR5qP4oN3mJ2kL1hG0fE';
    const findings = tokensDetector.detect(text);

    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('anthropic-api-key');
  });

  it('should detect GitHub PAT format', () => {
    // 36 character string
    const text = 'Use this ghp_8uF3hN9rL2kP5qW4xT7mJ1cV6bZ9nQ3yX5w0';
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
