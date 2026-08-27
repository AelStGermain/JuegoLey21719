import { describe, it, expect } from 'vitest';
import { gameStateReducer, initialGameState } from '../src/game/gameStateReducer';
import { GameState } from '../src/game/types';

describe('gameStateReducer', () => {
  it('should return initial state by default', () => {
    const state = gameStateReducer(initialGameState, { type: 'DISMISS_NOTIFICATION' });
    expect(state.activeNotification).toBeNull();
  });

  it('should register found evidence without duplicating', () => {
    let state = gameStateReducer(initialGameState, { type: 'FOUND_EVIDENCE', payload: 'ev-cc-leak' });
    expect(state.evidenceFound).toContain('ev-cc-leak');
    expect(state.evidenceFound.length).toBe(1);

    // Try adding again
    state = gameStateReducer(state, { type: 'FOUND_EVIDENCE', payload: 'ev-cc-leak' });
    expect(state.evidenceFound.length).toBe(1);

    // Add another
    state = gameStateReducer(state, { type: 'FOUND_EVIDENCE', payload: 'ev-sensitive-health' });
    expect(state.evidenceFound).toContain('ev-sensitive-health');
    expect(state.evidenceFound.length).toBe(2);
  });

  it('should record decisions and update consequence flags', () => {
    const decisionPayload = {
      decisionId: 'decision-hr-send',
      choiceId: 'choice-send-sanitized',
      flags: { exposedApplicants: false, actionTaken: 'send-sanitized' }
    };

    const state = gameStateReducer(initialGameState, { type: 'MAKE_DECISION', payload: decisionPayload });
    
    expect(state.decisionsMade['decision-hr-send']).toBe('choice-send-sanitized');
    expect(state.flags.exposedApplicants).toBe(false);
    expect(state.flags.actionTaken).toBe('send-sanitized');
  });

  it('should progress day and apply new flags/notifications', () => {
    const nextDayNotif = {
      id: 'notif-leak-incident',
      title: '⚠️ ALERTA DE INCIDENTE',
      message: 'Filtración de planilla reportada.'
    };

    const state = gameStateReducer({ ...initialGameState, workdayStatus: 'transitioning' }, {
      type: 'PROGRESS_DAY',
      payload: {
        day: 2,
        notifications: nextDayNotif,
        newFlags: { workdayProgressed: true }
      }
    });

    expect(state.currentDay).toBe(2);
    expect(state.activeNotification).toEqual(nextDayNotif);
    expect(state.flags.workdayProgressed).toBe(true);
  });

  it('blocks jumping to a later case before completing the current one', () => {
    const earlyAdvance = gameStateReducer(initialGameState, {
      type: 'PROGRESS_DAY',
      payload: { day: 2, notifications: null, newFlags: {} },
    });
    const skippedCase = gameStateReducer({ ...initialGameState, workdayStatus: 'transitioning' }, {
      type: 'PROGRESS_DAY',
      payload: { day: 3, notifications: null, newFlags: {} },
    });

    expect(earlyAdvance).toBe(initialGameState);
    expect(skippedCase.currentDay).toBe(1);
    expect(skippedCase.workdayStatus).toBe('transitioning');
  });

  it('records each completed tutorial in the persisted game flags', () => {
    const case1State = gameStateReducer(initialGameState, {
      type: 'COMPLETE_TUTORIAL',
      payload: 1,
    });
    const case2State = gameStateReducer(case1State, {
      type: 'COMPLETE_TUTORIAL',
      payload: 2,
    });

    expect(case2State.flags.tutorialCase1Seen).toBe(true);
    expect(case2State.flags.tutorialCase2Seen).toBe(true);
    expect(case2State.currentDay).toBe(1);
  });

  it('acknowledges the Case 1 audit only through its explicit confirmation action', () => {
    const evidenceOnlyState: GameState = {
      ...initialGameState,
      evidenceFound: ['ev-personal-rut', 'ev-sensitive-health', 'ev-sensitive-religion', 'ev-cc-leak'],
    };

    expect(evidenceOnlyState.flags.case1AuditAcknowledged).toBeUndefined();

    const acknowledgedState = gameStateReducer(evidenceOnlyState, { type: 'ACKNOWLEDGE_CASE1_AUDIT' });
    expect(acknowledgedState.flags.case1AuditAcknowledged).toBe(true);
  });

  it('starts Case 2 with a clean AelScan selection and no stale Case 2 achievements', () => {
    const dirtyCase1State: GameState = {
      ...initialGameState,
      workdayStatus: 'transitioning',
      evidenceFound: [
        'ev-cc-leak',
        'ev-ch-msg-dejala',
        'lead-retention-by-chance-resolved',
        'ev-form-purpose',
        'lead-form-religion-resolved',
      ],
      selectedAuditElement: { sourceApp: 'mail', elementId: 'email-cc-header' },
      selectedRuleId: 3,
    };

    const state = gameStateReducer(dirtyCase1State, {
      type: 'PROGRESS_DAY',
      payload: { day: 2, notifications: null, newFlags: { workdayProgressed: true } },
    });

    expect(state.evidenceFound).toEqual(['ev-cc-leak']);
    expect(state.selectedAuditElement).toBeNull();
    expect(state.selectedRuleId).toBeNull();
    expect(state.activeNotification).toBeNull();
  });

  it('progresses directly from Case 2 into the scheduled-mail Case 3', () => {
    const state = gameStateReducer({ ...initialGameState, currentDay: 2, workdayStatus: 'transitioning' }, {
      type: 'PROGRESS_DAY',
      payload: {
        day: 3,
        notifications: {
          id: 'case3-scheduled-mail',
          title: 'Envío programado pendiente de revisión',
          message: 'AelMail espera una revisión.',
          appToOpen: 'mail',
        },
        newFlags: { case3Started: true },
      },
    });

    expect(state.currentDay).toBe(3);
    expect(state.flags.case3Started).toBe(true);
    expect(state.activeNotification?.appToOpen).toBe('mail');
    expect(state.selectedAuditElement).toBeNull();
    expect(state.selectedRuleId).toBeNull();
  });

  it('should reset game state to initial configuration', () => {
    let state = gameStateReducer(initialGameState, { type: 'FOUND_EVIDENCE', payload: 'ev-cc-leak' });
    state = gameStateReducer(state, {
      type: 'MAKE_DECISION',
      payload: {
        decisionId: 'decision-hr-send',
        choiceId: 'choice-send-raw',
        flags: { exposedApplicants: true }
      }
    });

    const resetState = gameStateReducer(state, { type: 'RESET_GAME' });
    expect(resetState.evidenceFound.length).toBe(0);
    expect(resetState.decisionsMade).toEqual({});
    expect(resetState.flags).toEqual({});
    expect(resetState.currentDay).toBe(1);
  });
});
