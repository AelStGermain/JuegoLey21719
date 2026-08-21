import { describe, expect, it } from 'vitest';
import { scenario1 } from '../src/content/scenario_1';

describe('Case 1 final email decision', () => {
  it('offers exactly one unsafe response and one corrective response', () => {
    expect(scenario1.decision.choices.map(choice => choice.id)).toEqual([
      'choice-send-raw',
      'choice-send-sanitized',
    ]);
  });

  it('includes education of the sender in the corrective response', () => {
    const corrective = scenario1.decision.choices.find(choice => choice.id === 'choice-send-sanitized');
    expect(corrective?.text).toContain('educar a Sofía');
    expect(corrective?.consequences.educationalFeedback.description).toContain('explicaste a la emisora');
  });
});
