import { describe, expect, it } from 'vitest';
import { CASE_APPLICATION_IDS, isApplicationAvailableInCase } from '../src/desktop/caseApplications';

describe('case-specific desktop applications', () => {
  it('isolates Mail, Chat and Forms in their corresponding cases', () => {
    expect(CASE_APPLICATION_IDS[1]).toEqual(['mail', 'spreadsheet']);
    expect(CASE_APPLICATION_IDS[2]).toEqual(['aelchat', 'spreadsheet']);
    expect(CASE_APPLICATION_IDS[3]).toEqual(['aelforms']);
    expect(isApplicationAvailableInCase(2, 'mail')).toBe(false);
    expect(isApplicationAvailableInCase(1, 'aelchat')).toBe(false);
    expect(isApplicationAvailableInCase(3, 'mail')).toBe(false);
    expect(isApplicationAvailableInCase(3, 'aelchat')).toBe(false);
    expect(isApplicationAvailableInCase(2, 'aelforms')).toBe(false);
  });

  it('keeps Excel available because each case has its own workbook', () => {
    expect(isApplicationAvailableInCase(1, 'spreadsheet')).toBe(true);
    expect(isApplicationAvailableInCase(2, 'spreadsheet')).toBe(true);
    expect(isApplicationAvailableInCase(3, 'spreadsheet')).toBe(false);
  });
});
