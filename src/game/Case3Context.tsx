import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { playSound } from '../components/sound';
import {
  createCase3Attachments,
  createCase3Recipients,
  evaluateCase3Draft,
  type Case3ArtifactId,
  type Case3Attachment,
  type Case3Evaluation,
  type Case3Recipient,
} from '../content/scenario_3';
import { useGameState } from './GameStateContext';

type Case3TimerStatus = 'initial' | 'running' | 'sent';
type Case3Screen = 'review' | 'preflight' | 'result';

interface Case3State {
  secondsRemaining: number;
  timerStatus: Case3TimerStatus;
  activityNotice: string | null;
  screen: Case3Screen;
  recipients: Case3Recipient[];
  attachments: Case3Attachment[];
  selectedArtifact: Case3ArtifactId;
  evaluation: Case3Evaluation | null;
  sentAutomatically: boolean;
}

type Case3Action =
  | { type: 'RESET' }
  | { type: 'START' }
  | { type: 'TICK' }
  | { type: 'SET_NOTICE'; notice: string | null }
  | { type: 'SELECT_ARTIFACT'; artifact: Case3ArtifactId }
  | { type: 'REMOVE_RECIPIENT'; id: string }
  | { type: 'PROTECT_AUDIENCE' }
  | { type: 'REMOVE_ATTACHMENT'; id: string }
  | { type: 'OPEN_PREFLIGHT' }
  | { type: 'CLOSE_PREFLIGHT' }
  | { type: 'SUBMIT'; evaluation: Case3Evaluation; automatic: boolean };

const createInitialState = (): Case3State => ({
  secondsRemaining: 30,
  timerStatus: 'initial',
  activityNotice: null,
  screen: 'review',
  recipients: createCase3Recipients(),
  attachments: createCase3Attachments(),
  selectedArtifact: null,
  evaluation: null,
  sentAutomatically: false,
});

const case3Reducer = (state: Case3State, action: Case3Action): Case3State => {
  switch (action.type) {
    case 'RESET':
      return createInitialState();
    case 'START':
      if (state.timerStatus !== 'initial') return state;
      return { ...state, timerStatus: 'running', activityNotice: 'Revisión iniciada' };
    case 'TICK':
      if (state.timerStatus !== 'running' || state.secondsRemaining <= 0) return state;
      return { ...state, secondsRemaining: Math.max(0, state.secondsRemaining - 1) };
    case 'SET_NOTICE':
      return { ...state, activityNotice: action.notice };
    case 'SELECT_ARTIFACT':
      return { ...state, selectedArtifact: action.artifact };
    case 'REMOVE_RECIPIENT':
      return {
        ...state,
        selectedArtifact: null,
        recipients: state.recipients.map(recipient => recipient.id === action.id ? { ...recipient, active: false } : recipient),
      };
    case 'PROTECT_AUDIENCE':
      return {
        ...state,
        selectedArtifact: null,
        recipients: state.recipients.map(recipient => recipient.id === 'staff-list' ? { ...recipient, bucket: 'bcc', note: 'Destinatarios protegidos con CCO.' } : recipient),
      };
    case 'REMOVE_ATTACHMENT':
      return {
        ...state,
        selectedArtifact: null,
        attachments: state.attachments.map(attachment => attachment.id === action.id ? { ...attachment, active: false } : attachment),
      };
    case 'OPEN_PREFLIGHT':
      return { ...state, screen: 'preflight', activityNotice: null };
    case 'CLOSE_PREFLIGHT':
      return { ...state, screen: 'review', timerStatus: 'running', activityNotice: 'Reanudando…' };
    case 'SUBMIT':
      return {
        ...state,
        screen: 'result',
        timerStatus: 'sent',
        activityNotice: null,
        selectedArtifact: null,
        evaluation: action.evaluation,
        sentAutomatically: action.automatic,
      };
    default:
      return state;
  }
};

interface Case3ContextValue {
  state: Case3State;
  startReview: () => void;
  selectArtifact: (artifact: Case3ArtifactId) => void;
  removeRecipient: (id: string) => void;
  protectAudience: () => void;
  removeAttachment: (id: string) => void;
  openPreflight: () => void;
  closePreflight: () => void;
  confirmSend: () => void;
  finishScenario: () => void;
  resetCase3: () => void;
  retryCase3: () => void;
}

const Case3Context = createContext<Case3ContextValue | undefined>(undefined);

export const Case3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { state: gameState, makeDecision, setStatus } = useGameState();
  const [state, dispatch] = useReducer(case3Reducer, undefined, createInitialState);
  const milestonesRef = useRef(new Set<number>());
  const noticeTimerRef = useRef<number | null>(null);

  const setTemporaryNotice = useCallback((notice: string, duration = 1900) => {
    dispatch({ type: 'SET_NOTICE', notice });
    if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => {
      noticeTimerRef.current = null;
      dispatch({ type: 'SET_NOTICE', notice: null });
    }, duration);
  }, []);

  useEffect(() => () => {
    if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
  }, []);

  useEffect(() => {
    if (gameState.currentDay !== 3) {
      milestonesRef.current.clear();
      dispatch({ type: 'RESET' });
    }
  }, [gameState.currentDay]);

  useEffect(() => {
    if (state.timerStatus !== 'running') return;
    const timerId = window.setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => window.clearInterval(timerId);
  }, [state.timerStatus]);

  const submitDraft = useCallback((automatic: boolean) => {
    const evaluation = evaluateCase3Draft(state.recipients, state.attachments);
    dispatch({ type: 'SUBMIT', evaluation, automatic });
    playSound[evaluation.level === 'perfect' ? 'success' : 'warning'](gameState.soundEnabled);
  }, [gameState.soundEnabled, state.attachments, state.recipients]);

  useEffect(() => {
    if (state.timerStatus === 'running' && state.secondsRemaining === 0) submitDraft(true);
  }, [state.secondsRemaining, state.timerStatus, submitDraft]);

  useEffect(() => {
    if (state.timerStatus !== 'running') return;
    const seconds = state.secondsRemaining;
    if (![30, 20, 10].includes(seconds) || milestonesRef.current.has(seconds)) return;
    milestonesRef.current.add(seconds);
    if (seconds === 30) setTemporaryNotice('AelMail: el envío sigue programado.');
    if (seconds === 20) playSound.warning(gameState.soundEnabled);
    if (seconds === 10) {
      setTemporaryNotice('Últimos segundos para revisar.');
      playSound.chime(gameState.soundEnabled);
    }
  }, [gameState.soundEnabled, setTemporaryNotice, state.secondsRemaining, state.timerStatus]);

  const startReview = useCallback(() => {
    dispatch({ type: 'START' });
    playSound.chime(gameState.soundEnabled);
  }, [gameState.soundEnabled]);

  useEffect(() => {
    const tutorialFinished = Boolean(gameState.flags.tutorialCase3Seen);
    if (gameState.currentDay === 3
      && gameState.workdayStatus === 'active'
      && tutorialFinished
      && state.timerStatus === 'initial') {
      startReview();
    }
  }, [gameState.currentDay, gameState.flags.tutorialCase3Seen, gameState.workdayStatus, startReview, state.timerStatus]);

  const selectArtifact = useCallback((artifact: Case3ArtifactId) => {
    dispatch({ type: 'SELECT_ARTIFACT', artifact });
    playSound.click(gameState.soundEnabled);
  }, [gameState.soundEnabled]);

  const removeRecipient = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_RECIPIENT', id });
    setTemporaryNotice('✓ Destinatario retirado');
    playSound.success(gameState.soundEnabled);
  }, [gameState.soundEnabled, setTemporaryNotice]);

  const protectAudience = useCallback(() => {
    dispatch({ type: 'PROTECT_AUDIENCE' });
    setTemporaryNotice('✓ 238 destinatarios protegidos con CCO');
    playSound.success(gameState.soundEnabled);
  }, [gameState.soundEnabled, setTemporaryNotice]);

  const removeAttachment = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ATTACHMENT', id });
    setTemporaryNotice('✓ Adjunto retirado');
    playSound.success(gameState.soundEnabled);
  }, [gameState.soundEnabled, setTemporaryNotice]);

  const openPreflight = useCallback(() => {
    dispatch({ type: 'OPEN_PREFLIGHT' });
    playSound.click(gameState.soundEnabled);
  }, [gameState.soundEnabled]);

  const closePreflight = useCallback(() => {
    dispatch({ type: 'CLOSE_PREFLIGHT' });
    setTemporaryNotice('Reanudando…', 1200);
    playSound.click(gameState.soundEnabled);
  }, [gameState.soundEnabled, setTemporaryNotice]);

  const confirmSend = useCallback(() => submitDraft(false), [submitDraft]);

  const finishScenario = useCallback(() => {
    if (!state.evaluation) return;
    makeDecision('decision-scheduled-mail', `case3-${state.evaluation.level}`, {
      case3Outcome: state.evaluation.level,
      case3SentAutomatically: state.sentAutomatically,
    });
    setStatus('transitioning');
    playSound.chime(gameState.soundEnabled);
  }, [gameState.soundEnabled, makeDecision, setStatus, state.evaluation, state.sentAutomatically]);

  const resetCase3 = useCallback(() => {
    milestonesRef.current.clear();
    dispatch({ type: 'RESET' });
  }, []);

  const retryCase3 = useCallback(() => {
    milestonesRef.current.clear();
    dispatch({ type: 'RESET' });
    dispatch({ type: 'START' });
    playSound.chime(gameState.soundEnabled);
  }, [gameState.soundEnabled]);

  const value = useMemo<Case3ContextValue>(() => ({
    state,
    startReview,
    selectArtifact,
    removeRecipient,
    protectAudience,
    removeAttachment,
    openPreflight,
    closePreflight,
    confirmSend,
    finishScenario,
    resetCase3,
    retryCase3,
  }), [state, startReview, selectArtifact, removeRecipient, protectAudience, removeAttachment, openPreflight, closePreflight, confirmSend, finishScenario, resetCase3, retryCase3]);

  return <Case3Context.Provider value={value}>{children}</Case3Context.Provider>;
};

// oxlint-disable-next-line react/only-export-components
export const useCase3 = () => {
  const context = useContext(Case3Context);
  if (!context) throw new Error('useCase3 must be used within Case3Provider');
  return context;
};
