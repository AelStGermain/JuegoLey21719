export const AELSCAN_PIN_EVIDENCE_EVENT = 'aelscan:pin-evidence';

/** Pins contextual evidence in AelScan without making the editor perform the analysis. */
export const pinEvidenceInAelScan = (evidenceId: string) => {
  window.dispatchEvent(new CustomEvent<string>(AELSCAN_PIN_EVIDENCE_EVENT, { detail: evidenceId }));
};
