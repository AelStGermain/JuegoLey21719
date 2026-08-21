import { PrivacyScanInput, PrivacyScanResult } from '../game/types';

export interface PrivacyDetectionEngine {
  analyze(input: PrivacyScanInput): Promise<PrivacyScanResult>;
}
