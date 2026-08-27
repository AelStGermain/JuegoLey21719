import { describe, expect, it } from 'vitest';
import { resolveTutorialStepIndex } from '../src/components/tutorialProgress';

describe('resolveTutorialStepIndex', () => {
  it('starts at step zero when changing from a longer tutorial to Case 3', () => {
    expect(resolveTutorialStepIndex(3, 4, { caseId: 2, stepIndex: 4 })).toBe(0);
  });

  it('never returns an unavailable step', () => {
    expect(resolveTutorialStepIndex(3, 4, { caseId: 3, stepIndex: 9 })).toBe(3);
  });
});
