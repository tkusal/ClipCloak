export interface Finding {
  type: string;
  value: string;
  redacted: string;
  startIndex: number;
  endIndex: number;
  packId: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface Detector {
  id: string;
  name: string;
  detect: (text: string) => Omit<Finding, 'packId'>[];
}

export interface Pack {
  id: string;
  name: string;
  version: string;
  detectors: Detector[];
}

export type DetectFunction = (text: string, packs: Pack[]) => Finding[];
