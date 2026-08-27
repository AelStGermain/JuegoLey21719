export interface TutorialProgress {
  caseId: number;
  stepIndex: number;
}

/**
 * React can render the next case once before an effect resets local tutorial
 * state. Never reuse an index from a longer tutorial for the new case.
 */
export const resolveTutorialStepIndex = (
  caseId: number,
  stepCount: number,
  progress: TutorialProgress,
) => {
  if (stepCount <= 0 || progress.caseId !== caseId) return 0;
  return Math.min(Math.max(progress.stepIndex, 0), stepCount - 1);
};
