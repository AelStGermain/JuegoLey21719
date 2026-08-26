import { describe, expect, it } from 'vitest';
import { ACTIVE_CASE_IDS, CASE_APPLICATION_IDS, getCaseProgressPosition, isApplicationAvailableInCase } from '../src/desktop/caseApplications';

describe('case-specific desktop applications', () => {
  it('exposes only Cases 1, 2 and 4 with their corresponding applications', () => {
    expect(ACTIVE_CASE_IDS).toEqual([1, 2, 3]);
    expect(CASE_APPLICATION_IDS[1]).toEqual(['mail', 'spreadsheet']);
    expect(CASE_APPLICATION_IDS[2]).toEqual(['aelchat', 'spreadsheet']);
    expect(CASE_APPLICATION_IDS[3]).toEqual(['mail', 'spreadsheet']);
    expect(isApplicationAvailableInCase(2, 'mail')).toBe(false);
    expect(isApplicationAvailableInCase(1, 'aelchat')).toBe(false);
    expect(isApplicationAvailableInCase(3, 'mail')).toBe(true);
    expect(isApplicationAvailableInCase(3, 'aelchat')).toBe(false);
  });

  it('keeps Excel available because each case has its own workbook', () => {
    expect(isApplicationAvailableInCase(1, 'spreadsheet')).toBe(true);
    expect(isApplicationAvailableInCase(2, 'spreadsheet')).toBe(true);
    expect(isApplicationAvailableInCase(3, 'spreadsheet')).toBe(true);
  });

  it('shows the original case numbers across three progress positions', () => {
    expect(getCaseProgressPosition(1)).toBe(1);
    expect(getCaseProgressPosition(2)).toBe(2);
    expect(getCaseProgressPosition(3)).toBe(3);
  });
});
