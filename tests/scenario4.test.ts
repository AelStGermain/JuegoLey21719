import { describe, expect, it } from 'vitest';
import {
  createCase4Attachments,
  createCase4Recipients,
  evaluateCase4Draft,
  getCase4CorrectedCount,
} from '../src/content/scenario_4';

const correctedRecipients = () => createCase4Recipients().map(recipient => {
  if (recipient.kind === 'unknown-domain') return { ...recipient, active: false };
  if (recipient.id === 'staff-list') return { ...recipient, bucket: 'bcc' as const };
  return recipient;
});

const correctedAttachments = () => createCase4Attachments().map(attachment => (
  attachment.kind === 'payroll' ? { ...attachment, active: false } : attachment
));

describe('Case 4 quick-review evaluation', () => {
  it('starts with exactly three observable problems', () => {
    const recipients = createCase4Recipients();
    const attachments = createCase4Attachments();
    const evaluation = evaluateCase4Draft(recipients, attachments);

    expect(getCase4CorrectedCount(recipients, attachments)).toBe(0);
    expect(evaluation.level).toBe('critical');
    expect(evaluation.checks).toHaveLength(3);
    expect(evaluation.visibleCcCount).toBe(238);
  });

  it('recognizes the three simple corrections as a perfect result', () => {
    const recipients = correctedRecipients();
    const attachments = correctedAttachments();
    const evaluation = evaluateCase4Draft(recipients, attachments);

    expect(getCase4CorrectedCount(recipients, attachments)).toBe(3);
    expect(evaluation.level).toBe('perfect');
    expect(evaluation.correctedCount).toBe(3);
    expect(evaluation.checks.every(check => check.passed)).toBe(true);
    expect(evaluation.visibleCcCount).toBe(0);
  });

  it('reports a partial result when only the wrong address and audience are corrected', () => {
    const evaluation = evaluateCase4Draft(correctedRecipients(), createCase4Attachments());

    expect(evaluation.level).toBe('partial');
    expect(evaluation.correctedCount).toBe(2);
    expect(evaluation.checks.find(check => check.id === 'attachment')?.passed).toBe(false);
  });

  it('keeps the legitimate payment notice after the payroll is removed', () => {
    const evaluation = evaluateCase4Draft(correctedRecipients(), correctedAttachments());

    expect(evaluation.attachmentCount).toBe(1);
    expect(evaluation.summary).toContain('3 riesgos');
  });
});
