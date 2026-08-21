import { describe, expect, it } from 'vitest';
import {
  CASE3_OBJECTED_FIELD_IDS,
  CASE3_REVIEW_FIELD_ID,
  scenario3,
} from '../src/content/scenario_3';

const field = (fieldId: string) => scenario3.fields.find(item => item.id === fieldId);

describe('Case 3 simplified form review', () => {
  it('keeps a visible purpose on every question', () => {
    expect(scenario3.fields).toHaveLength(8);
    expect(scenario3.fields.every(item => Boolean(item.purpose))).toBe(true);
    expect(field(CASE3_REVIEW_FIELD_ID)).toBeDefined();
  });

  it('limits the puzzle to four objected questions', () => {
    expect(CASE3_OBJECTED_FIELD_IDS).toEqual(['religion', 'medication', 'diet', 'instagram']);
  });

  it('keeps birthdate and address as required administrative records', () => {
    for (const fieldId of ['birthdate', 'address']) {
      expect(field(fieldId)).toMatchObject({
        required: true,
        existingAdministrativeRecord: true,
      });
      expect(field(fieldId)?.objection).toBeUndefined();
    }
  });

  it('removes fields that lack purpose or necessity', () => {
    expect(field('instagram')?.objection).toMatchObject({ action: 'remove', pillar: 'FINALIDAD' });
    expect(field('religion')?.objection).toMatchObject({ action: 'remove', pillar: 'NECESIDAD' });
    expect(field('medication')?.objection).toMatchObject({ action: 'remove', pillar: 'NECESIDAD' });
  });

  it('makes dietary preference voluntary without deleting its valid purpose', () => {
    expect(field('diet')?.objection).toMatchObject({ action: 'make_optional', pillar: 'FINALIDAD' });
  });

  it('leaves name and emergency contact without objections', () => {
    expect(field('name')?.objection).toBeUndefined();
    expect(field('emergency')?.objection).toBeUndefined();
  });
});
