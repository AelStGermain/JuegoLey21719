import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AELSCAN_PIN_EVIDENCE_EVENT,
  pinEvidenceInAelScan,
  type AelScanPinEvidenceDetail,
} from '../src/components/aelScanNavigation';

describe('AelScan evidence pinning', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps the DOM anchor id and source application together', () => {
    const eventTarget = new EventTarget();
    vi.stubGlobal('window', eventTarget);

    let received: AelScanPinEvidenceDetail | undefined;
    eventTarget.addEventListener(AELSCAN_PIN_EVIDENCE_EVENT, event => {
      received = (event as CustomEvent<AelScanPinEvidenceDetail>).detail;
    });

    pinEvidenceInAelScan('ev-ch-msg-depression', 'aelchat');

    expect(received).toEqual({
      evidenceId: 'ev-ch-msg-depression',
      sourceApp: 'aelchat',
    });
  });
});
