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

  it('should ignore false positives', () => {
    const text = 'ask-me-anything ghp_short sk-123';
    const findings = tokensDetector.detect(text);
    expect(findings).toHaveLength(0);
  });

  it('should detect Slack tokens', () => {
    const text = 'xoxb-' + '987654321098-9876543210987-aBcDeFgHiJkLmNoPqRsTuVwX';
    const findings = tokensDetector.detect(text);
    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('slack-token');
  });

  it('should detect npm tokens', () => {
    const text = 'npm_' + 'aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789';
    const findings = tokensDetector.detect(text);
    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('npm-token');
  });

  it('should detect SendGrid tokens', () => {
    const text = 'SG.' + 'ECtsmUtDYErdq7Up6zu8So.UVGn4yFeZd7ITPRCTT6aFNQjdqtuAWeFq39CBa3VDnY';
    const findings = tokensDetector.detect(text);
    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('sendgrid-api-key');
  });

  it('should detect GCP tokens', () => {
    const text = 'AIza' + 'SyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q';
    const findings = tokensDetector.detect(text);
    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('gcp-api-key');
  });
});
