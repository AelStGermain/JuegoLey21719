export const AELSCAN_SHOW_REGULATIONS_EVENT = 'aelscan:show-regulations';
export const AELSCAN_PIN_EVIDENCE_EVENT = 'aelscan:pin-evidence';

/** Moves AelScan back to its Regulation view when the player selects evidence. */
export const showAelScanRegulations = () => {
  window.dispatchEvent(new CustomEvent(AELSCAN_SHOW_REGULATIONS_EVENT));
};

/** Pins contextual evidence in AelScan without making the editor perform the analysis. */
export const pinEvidenceInAelScan = (evidenceId: string) => {
  window.dispatchEvent(new CustomEvent<string>(AELSCAN_PIN_EVIDENCE_EVENT, { detail: evidenceId }));
};
