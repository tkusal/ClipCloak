import type { Detector, DetectionContext, Finding } from '@clipcloak/core';
import { createRedactedPreview } from '@clipcloak/core';
import { isObviousDummyString, isSoftDummyString } from '../utils/entropy.js';

export const tokensDetector: Detector = {
  id: 'api-tokens',
  category: 'credential',
  defaultSeverity: 'critical',
  defaultConfidence: 0.95,
  description: 'General high-entropy API tokens (Slack, NPM, Sendgrid, GCP)',
  emittedIds: ['openai-api-key', 'anthropic-api-key', 'slack-token', 'npm-token', 'sendgrid-api-key', 'gcp-api-key'],
  detect(text: string, _context?: DetectionContext) {
    const findings: Omit<Finding, 'packId'>[] = [];

    // Better regex for OpenAI (sk-proj... and normal sk-...)
    const openaiRegex = /\bsk-(?!ant-)(?:proj-)?[A-Za-z0-9_-]{20,}\b/g;
    const anthropicRegex = /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g;
    const slackRegex = /\bxox[baprs]-[A-Za-z0-9-]+\b/g;
    const npmRegex = /\bnpm_[A-Za-z0-9]{36}\b/g;
    const sendgridRegex = /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/g;
    const gcpRegex = /\bAIza[0-9A-Za-z_-]{35}\b/g;

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
    runPattern(slackRegex, 'slack-token', 'Slack Token');
    runPattern(npmRegex, 'npm-token', 'NPM Token');
    runPattern(sendgridRegex, 'sendgrid-api-key', 'SendGrid API Key');
    runPattern(gcpRegex, 'gcp-api-key', 'GCP API Key');

    return findings;
  },
};
