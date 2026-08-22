import type { Detector, DetectionContext } from '@clipcloak/core';
import { createRedactedPreview } from '@clipcloak/core';

export const tokensDetector: Detector = {
  id: 'api-tokens',
  category: 'credential',
  detect(text: string, _context?: DetectionContext) {
    const findings: any[] = [];
    
    // OpenAI: sk-proj-... or sk-...
    // Anthropic: sk-ant-...
    // GitHub: ghp_...
    const patterns = [
      { id: 'openai-api-key', regex: /\b(sk-[a-zA-Z0-9]{20,T?)(?:\s|$|[^a-zA-Z0-9\-])|\b(sk-proj-[a-zA-Z0-9\-_]{20,})\b/g, severity: 'critical', confidence: 0.95 },
      { id: 'anthropic-api-key', regex: /\b(sk-ant-api03-[a-zA-Z0-9\-_]{80,})\b/g, severity: 'critical', confidence: 0.99 },
      { id: 'github-pat', regex: /\b(gh[pousr]_[a-zA-Z0-9]{36})\b/g, severity: 'critical', confidence: 0.99 },
    ] as const;

    // Better regex for OpenAI (sk-proj... and normal sk-...)
    const openaiRegex = /\bsk-(?!ant-)(?:proj-)?[A-Za-z0-9\-_]{20,}\b/g;
    const anthropicRegex = /\bsk-ant-[A-Za-z0-9\-_]{20,}\b/g;
    const githubRegex = /\bgh[pousr]_[A-Za-z0-9]{36}\b/g;

    const runPattern = (regex: RegExp, id: string, name: string) => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        findings.push({
          detectorId: id,
          category: this.category,
          severity: 'critical' as const,
          confidence: 0.95,
          start: match.index,
          end: match.index + match[0].length,
          redactedPreview: createRedactedPreview(match[0], id, { strategy: 'partial' }),
          reason: `Matches ${name} pattern`,
        });
      }
    };

    runPattern(openaiRegex, 'openai-api-key', 'OpenAI API Key');
    runPattern(anthropicRegex, 'anthropic-api-key', 'Anthropic API Key');
    runPattern(githubRegex, 'github-pat', 'GitHub Personal Access Token');

    return findings;
  },
};
