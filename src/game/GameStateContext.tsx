import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, ReactNode } from 'react';
import { GameState } from './types';
import { gameStateReducer, initialGameState, GameAction } from './gameStateReducer';

interface GameStateContextProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  foundEvidence: (id: string) => void;
  makeDecision: (decisionId: string, choiceId: string, flags: Record<string, any>) => void;
  triggerNotification: (notif: GameState['activeNotification']) => void;
  dismissNotification: () => void;
  toggleSound: () => void;
  progressDay: (day: number, notif: GameState['activeNotification'], newFlags: Record<string, any>) => void;
  setStatus: (status: GameState['workdayStatus']) => void;
  completeTutorial: (day: number) => void;
  acknowledgeCase1Audit: () => void;
  setSelectedAuditElement: (element: GameState['selectedAuditElement']) => void;
  setSelectedRuleId: (ruleId: number | null) => void;
  resetGame: () => void;
}

const GameStateContext = createContext<GameStateContextProps | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'aelos_game_state';
const STORAGE_VERSION = 2;

type PersistedGameState = Partial<GameState> & { storageVersion?: number };

const migrateLegacyCaseId = (value: string) => value.replaceAll('case4', 'case3');

const restoreGameState = (initial: GameState): GameState => {
  try {
    const persisted = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!persisted) return initial;

    const parsed: unknown = JSON.parse(persisted);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return initial;

    const saved = parsed as PersistedGameState;
    const isLegacySave = saved.storageVersion !== STORAGE_VERSION;
    const savedDay = saved.currentDay ?? 1;
    const isRemovedFormCaseSave = isLegacySave && savedDay === 3;
    const currentDay = isRemovedFormCaseSave
      ? 2
      : isLegacySave && savedDay === 4
        ? 3
        : savedDay === 3
          ? 3
          : savedDay === 2
            ? 2
            : 1;
    const validStatuses: GameState['workdayStatus'][] = ['active', 'transitioning', 'finished'];
    const validSourceApps: NonNullable<GameState['selectedAuditElement']>['sourceApp'][] = ['mail', 'spreadsheet', 'aelchat'];
    const savedNotification = saved.activeNotification;
    const activeNotification = savedNotification === null || (
      savedNotification
      && typeof savedNotification === 'object'
      && typeof savedNotification.id === 'string'
      && typeof savedNotification.title === 'string'
      && typeof savedNotification.message === 'string'
      && (savedNotification.appToOpen === undefined || typeof savedNotification.appToOpen === 'string')
    ) ? savedNotification === null
      ? null
      : {
          ...savedNotification,
          id: isLegacySave ? migrateLegacyCaseId(savedNotification.id) : savedNotification.id,
        }
      : initial.activeNotification;
    const savedAuditElement = saved.selectedAuditElement;
    const selectedAuditElement = !isRemovedFormCaseSave && savedAuditElement
      && typeof savedAuditElement === 'object'
      && validSourceApps.includes(savedAuditElement.sourceApp)
      && typeof savedAuditElement.elementId === 'string'
      ? savedAuditElement
      : null;

    return {
      ...initial,
      currentDay,
      workdayStatus: isRemovedFormCaseSave
        ? 'transitioning'
        : saved.workdayStatus && validStatuses.includes(saved.workdayStatus)
        ? saved.workdayStatus
        : initial.workdayStatus,
      evidenceFound: Array.isArray(saved.evidenceFound)
        ? Array.from(new Set(saved.evidenceFound
            .filter((id): id is string => typeof id === 'string')
            .filter(id => !id.startsWith('ev-form-') && !id.startsWith('lead-form-'))
            .map(id => isLegacySave ? migrateLegacyCaseId(id) : id)))
        : initial.evidenceFound,
      decisionsMade: saved.decisionsMade && typeof saved.decisionsMade === 'object' && !Array.isArray(saved.decisionsMade)
        ? Object.fromEntries(Object.entries(saved.decisionsMade)
            .filter(([, choiceId]) => typeof choiceId === 'string')
            .map(([decisionId, choiceId]) => [
              isLegacySave ? migrateLegacyCaseId(decisionId) : decisionId,
              isLegacySave ? migrateLegacyCaseId(choiceId) : choiceId,
            ]))
        : initial.decisionsMade,
      flags: saved.flags && typeof saved.flags === 'object' && !Array.isArray(saved.flags)
        ? Object.fromEntries(Object.entries(saved.flags)
            .filter(([key]) => !key.startsWith('case3Religion')
              && !key.startsWith('case3Medication')
              && !key.startsWith('case3Undefined')
              && !key.startsWith('case3Voluntary')
              && !key.startsWith('case3Preview'))
            .map(([key, value]) => [isLegacySave ? migrateLegacyCaseId(key) : key, value]))
        : initial.flags,
      soundEnabled: typeof saved.soundEnabled === 'boolean' ? saved.soundEnabled : initial.soundEnabled,
      activeNotification,
      selectedAuditElement,
      selectedRuleId: typeof saved.selectedRuleId === 'number' && [1, 2, 3, 4].includes(saved.selectedRuleId)
        ? saved.selectedRuleId
        : null,
    };
  } catch (error) {
    console.error('Error loading game state from localStorage', error);
    return initial;
  }
};

export const GameStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameStateReducer, initialGameState, restoreGameState);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ ...state, storageVersion: STORAGE_VERSION }));
    } catch (e) {
      console.error('Error saving game state to localStorage', e);
    }
  }, [state]);

  const foundEvidence = useCallback((id: string) => {
    dispatch({ type: 'FOUND_EVIDENCE', payload: id });
  }, []);

  const makeDecision = useCallback((decisionId: string, choiceId: string, flags: Record<string, any>) => {
    dispatch({ type: 'MAKE_DECISION', payload: { decisionId, choiceId, flags } });
  }, []);

  const triggerNotification = useCallback((notif: GameState['activeNotification']) => {
    dispatch({ type: 'TRIGGER_NOTIFICATION', payload: notif });
  }, []);

  const dismissNotification = useCallback(() => {
    dispatch({ type: 'DISMISS_NOTIFICATION' });
  }, []);

  const toggleSound = useCallback(() => {
    dispatch({ type: 'TOGGLE_SOUND' });
  }, []);

  const progressDay = useCallback((day: number, notif: GameState['activeNotification'], newFlags: Record<string, any>) => {
    dispatch({ type: 'PROGRESS_DAY', payload: { day, notifications: notif, newFlags } });
  }, []);

  const setStatus = useCallback((status: GameState['workdayStatus']) => {
    dispatch({ type: 'SET_STATUS', payload: status });
  }, []);

  const completeTutorial = useCallback((day: number) => {
    dispatch({ type: 'COMPLETE_TUTORIAL', payload: day });
  }, []);

  const acknowledgeCase1Audit = useCallback(() => {
    dispatch({ type: 'ACKNOWLEDGE_CASE1_AUDIT' });
  }, []);

  const setSelectedAuditElement = useCallback((element: GameState['selectedAuditElement']) => {
    dispatch({ type: 'SELECT_AUDIT_ELEMENT', payload: element });
  }, []);

  const setSelectedRuleId = useCallback((ruleId: number | null) => {
    dispatch({ type: 'SELECT_RULE', payload: ruleId });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  const value = useMemo<GameStateContextProps>(() => ({
    state,
    dispatch,
    foundEvidence,
    makeDecision,
    triggerNotification,
    dismissNotification,
    toggleSound,
    progressDay,
    setStatus,
    completeTutorial,
    acknowledgeCase1Audit,
    setSelectedAuditElement,
    setSelectedRuleId,
    resetGame,
  }), [
    state,
    foundEvidence,
    makeDecision,
    triggerNotification,
    dismissNotification,
    toggleSound,
    progressDay,
    setStatus,
    completeTutorial,
    acknowledgeCase1Audit,
    setSelectedAuditElement,
    setSelectedRuleId,
    resetGame,
  ]);

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
};

// Kept with the provider so the state API remains a single, explicit module.
// oxlint-disable-next-line react/only-export-components
export const useGameState = () => {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
};
