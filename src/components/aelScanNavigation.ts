export const AELSCAN_PIN_EVIDENCE_EVENT = 'aelscan:pin-evidence';

export interface AelScanPinEvidenceDetail {
  evidenceId: string;
  sourceApp: 'aelchat' | 'spreadsheet';
}

/** Pins contextual evidence in AelScan without making the editor perform the analysis. */
export const pinEvidenceInAelScan = (evidenceId: string, sourceApp: AelScanPinEvidenceDetail['sourceApp']) => {
  window.dispatchEvent(new CustomEvent<AelScanPinEvidenceDetail>(AELSCAN_PIN_EVIDENCE_EVENT, {
    detail: { evidenceId, sourceApp },
  }));
};
