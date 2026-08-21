import { GameState } from './types';

export type GameAction =
  | { type: 'FOUND_EVIDENCE'; payload: string }
  | { type: 'MAKE_DECISION'; payload: { decisionId: string; choiceId: string; flags: Record<string, any> } }
  | { type: 'TRIGGER_NOTIFICATION'; payload: GameState['activeNotification'] }
  | { type: 'DISMISS_NOTIFICATION' }
  | { type: 'TOGGLE_SOUND' }
  | { type: 'PROGRESS_DAY'; payload: { day: number; notifications: GameState['activeNotification']; newFlags: Record<string, any> } }
  | { type: 'SET_STATUS'; payload: GameState['workdayStatus'] }
  | { type: 'SELECT_AUDIT_ELEMENT'; payload: GameState['selectedAuditElement'] }
  | { type: 'SELECT_RULE'; payload: number | null }
  | { type: 'RESET_GAME' };

export const initialGameState: GameState = {
  currentDay: 1,
  workdayStatus: 'active',
  evidenceFound: [],
  decisionsMade: {},
  flags: {},
  soundEnabled: false, // Default muted as requested
  activeNotification: {
    id: 'init-notif',
    title: '📥 Nuevo Correo Recibido',
    message: 'Tienes un correo pendiente en tu bandeja de entrada de Sofía Valenzuela (RRHH).',
    appToOpen: 'mail'
  },
  selectedAuditElement: null,
  selectedRuleId: null
};

export const gameStateReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'FOUND_EVIDENCE':
      if (state.evidenceFound.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        evidenceFound: [...state.evidenceFound, action.payload]
      };

    case 'MAKE_DECISION':
      return {
        ...state,
        decisionsMade: {
          ...state.decisionsMade,
          [action.payload.decisionId]: action.payload.choiceId
        },
        flags: {
          ...state.flags,
          ...action.payload.flags
        }
      };

    case 'TRIGGER_NOTIFICATION':
      return {
        ...state,
        activeNotification: action.payload
      };

    case 'DISMISS_NOTIFICATION':
      return {
        ...state,
        activeNotification: null
      };

    case 'TOGGLE_SOUND':
      return {
        ...state,
        soundEnabled: !state.soundEnabled
      };

    case 'PROGRESS_DAY': {
      const isStartingCase2 = state.currentDay !== 2 && action.payload.day === 2;
      const isStartingCase3 = state.currentDay !== 3 && action.payload.day === 3;
      return {
        ...state,
        currentDay: action.payload.day,
        workdayStatus: 'active',
        activeNotification: action.payload.notifications,
        evidenceFound: isStartingCase2
          ? state.evidenceFound.filter(id => (
              !id.startsWith('lead-')
              && !id.startsWith('ev-ch-')
              && !id.startsWith('ev-form-')
            ))
          : isStartingCase3
            ? state.evidenceFound.filter(id => !id.startsWith('lead-form-') && !id.startsWith('ev-form-'))
            : state.evidenceFound,
        selectedAuditElement: null,
        selectedRuleId: null,
        flags: {
          ...state.flags,
          ...action.payload.newFlags
        }
      };
    }

    case 'SET_STATUS':
      return {
        ...state,
        workdayStatus: action.payload
      };

    case 'SELECT_AUDIT_ELEMENT':
      return {
        ...state,
        selectedAuditElement: action.payload
      };

    case 'SELECT_RULE':
      return {
        ...state,
        selectedRuleId: action.payload
      };

    case 'RESET_GAME':
      return initialGameState;

    default:
      return state;
  }
};
