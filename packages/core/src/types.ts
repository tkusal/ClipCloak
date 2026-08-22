export type FindingCategory = 'secret' | 'credential' | 'pii' | 'financial';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface DetectionContext {
  filename?: string;
  surroundingText?: string;
}

export interface ClipCloakConfig {
  packs?: string[];
  minSeverity?: Severity;
  minConfidence?: number;
  ignore?: string[];
  blockMinSeverity?: Severity;
  blockCategories?: FindingCategory[];
}

export interface DetectOptions {
  packs?: string[];
  minConfidence?: number;
  minSeverity?: Severity;
  context?: DetectionContext;
}

export interface Finding {
  detectorId: string;
  packId: string;
  category: FindingCategory;
  severity: Severity;
  confidence: number;
  start: number;
  end: number;
  redactedPreview: string;
  reason: string;
}

export interface Detector {
  id: string;
  category: FindingCategory;
  detect: (text: string, context?: DetectionContext) => Omit<Finding, 'packId'>[];
}

export interface DetectorPack {
  id: string;
  name: string;
  detectors: Detector[];
}

export interface DetectorError {
  packId: string;
  detectorId: string;
  errorMessage: string;
}

export interface DetectResult {
  findings: Finding[];
  errors: DetectorError[];
}

export interface ScanResult {
  file: string;
  findings: Finding[];
  errors: DetectorError[];
  error?: string;
}
