import type { Detector, DetectionContext, Finding } from '@clipcloak/core';
import { createRedactedPreview } from '@clipcloak/core';
import { isObviousDummyString, isSoftDummyString } from '../utils/entropy.js';

export const tokensDetector: Detector = {
  id: 'api-tokens',
  category: 'credential',
  detect(text: string, _context?: DetectionContext) {
    const findings: Omit<Finding, 'packId'>[] = [];

    // Better regex for OpenAI (sk-proj... and normal sk-...)
    const openaiRegex = /\bsk-(?!ant-)(?:proj-)?[A-Za-z0-9\-_]{20,}\b/g;
    const anthropicRegex = /\bsk-ant-[A-Za-z0-9\-_]{20,}\b/g;
    const githubRegex = /\bgh[pousr]_[A-Za-z0-9]{36}\b/g;

    const runPattern = (regex: RegExp, id: string, name: string) => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        const token = match[0];
        
        if (isObviousDummyString(token)) {
          continue;
        }

        let confidence = 0.95;
        if (isSoftDummyString(token)) {
          confidence = 0.75;
        }

        findings.push({
          detectorId: id,
          category: this.category,
          severity: 'critical' as const,
          confidence,
          start: match.index,
          end: match.index + token.length,
          redactedPreview: createRedactedPreview(token, id, { strategy: 'partial' }),
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
