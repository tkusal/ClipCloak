import type { Detector, DetectionContext } from '@clipcloak/core';
import { createRedactedPreview } from '@clipcloak/core';

export const pixDetector: Detector = {
  id: 'pix-key',
  category: 'financial',
  detect(text: string, context?: DetectionContext) {
    const findings = [];
    
    // 1. EVP (UUID) PIX Key (EVP = Endereço Virtual de Pagamento)
    // PIX UUIDs are standard RFC 4122 UUIDs
    const evpRegex = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
    let match;
    while ((match = evpRegex.exec(text)) !== null) {
      // Is it a PIX UUID or just a random UUID in code? We use context.
      // If we see "pix" nearby, confidence goes up.
      let confidence = 0.3; // Default UUID confidence is low (could be a db ID)
      const surrounding = context?.surroundingText || text.substring(Math.max(0, match.index - 50), match.index + 50);
      
      if (/pix/i.test(surrounding)) {
        confidence = 0.8;
      }

      findings.push({
        detectorId: 'pix-evp',
        category: this.category,
        severity: 'medium' as const,
        confidence,
        start: match.index,
        end: match.index + match[0].length,
        redactedPreview: createRedactedPreview(match[0], 'pix-evp', { strategy: 'full' }),
        reason: 'Random PIX Key (UUID) format',
      });
    }

    // 2. Contextual PIX Keys (Email or Phone explicitly marked as PIX)
    // We only trigger this if the word 'pix' is explicitly tied to it, otherwise 
    // it will just be picked up as regular Email or Phone by other detectors.
    const contextualPixRegex = /(?:pix(?:[\s:-]+chave)?[\s:-]+)([\w.-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\+?55\s?\(?\d{2}\)?\s?9\d{4}-?\d{4})/gi;
    
    while ((match = contextualPixRegex.exec(text)) !== null) {
      // match[1] is the actual key
      const keyStart = match.index + match[0].lastIndexOf(match[1]);
      const keyString = match[1];
      
      findings.push({
        detectorId: 'pix-contextual',
        category: this.category,
        severity: 'medium' as const,
        confidence: 0.9, // High confidence because "pix" was explicitly stated before it
        start: keyStart,
        end: keyStart + keyString.length,
        redactedPreview: createRedactedPreview(keyString, 'pix-contextual', { strategy: 'full' }),
        reason: 'Information explicitly labeled as a PIX key',
      });
    }

    return findings;
  },
};
