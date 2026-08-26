import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { playSound } from '../components/sound';
import {
  createCase4Attachments,
  createCase4Recipients,
  evaluateCase4Draft,
  type Case4ArtifactId,
  type Case4Attachment,
  type Case4Evaluation,
  type Case4Recipient,
} from '../content/scenario_4';
import { useGameState } from './GameStateContext';

type Case4TimerStatus = 'initial' | 'running' | 'paused' | 'sent';
type Case4Screen = 'review' | 'preflight' | 'result';

interface Case4State {
  secondsRemaining: number;
  challengeMode: boolean;
  timerStatus: Case4TimerStatus;
  pauseReason: string | null;
  activityNotice: string | null;
  screen: Case4Screen;
  recipients: Case4Recipient[];
  attachments: Case4Attachment[];
  selectedArtifact: Case4ArtifactId;
  evaluation: Case4Evaluation | null;
  sentAutomatically: boolean;
}

type Case4Action =
  | { type: 'RESET' }
  | { type: 'START' }
  | { type: 'START_CHALLENGE' }
  | { type: 'PAUSE'; reason: string }
  | { type: 'RESUME' }
  | { type: 'TICK' }
  | { type: 'SET_NOTICE'; notice: string | null }
  | { type: 'SELECT_ARTIFACT'; artifact: Case4ArtifactId }
  | { type: 'REMOVE_RECIPIENT'; id: string }
  | { type: 'PROTECT_AUDIENCE' }
  | { type: 'REMOVE_ATTACHMENT'; id: string }
  | { type: 'OPEN_PREFLIGHT' }
  | { type: 'CLOSE_PREFLIGHT' }
  | { type: 'SUBMIT'; evaluation: Case4Evaluation; automatic: boolean };

const createInitialState = (): Case4State => ({
  secondsRemaining: 90,
  challengeMode: false,
  timerStatus: 'initial',
  pauseReason: 'EN ESPERA DE REVISIÓN',
  activityNotice: null,
  screen: 'review',
  recipients: createCase4Recipients(),
  attachments: createCase4Attachments(),
  selectedArtifact: null,
  evaluation: null,
  sentAutomatically: false,
});

const case4Reducer = (state: Case4State, action: Case4Action): Case4State => {
  switch (action.type) {
    case 'RESET':
      return createInitialState();
    case 'START':
      if (state.timerStatus !== 'initial') return state;
      return { ...state, timerStatus: 'running', pauseReason: null, activityNotice: 'Revisión iniciada' };
    case 'START_CHALLENGE':
      if (state.timerStatus !== 'initial') return state;
      return { ...state, secondsRemaining: 45, challengeMode: true, timerStatus: 'running', pauseReason: null, activityNotice: 'Modo desafío · 45 segundos' };
    case 'PAUSE':
      if (state.timerStatus === 'sent') return state;
      return { ...state, timerStatus: 'paused', pauseReason: action.reason, activityNotice: null };
    case 'RESUME':
      if (state.timerStatus === 'sent' || state.screen === 'result') return state;
      return { ...state, timerStatus: 'running', pauseReason: null, activityNotice: 'Reanudando…' };
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
      return { ...state, screen: 'preflight', timerStatus: 'paused', pauseReason: 'CONFIRMACIÓN DE ENVÍO', activityNotice: null };
    case 'CLOSE_PREFLIGHT':
      return { ...state, screen: 'review', timerStatus: 'running', pauseReason: null, activityNotice: 'Reanudando…' };
    case 'SUBMIT':
      return {
        ...state,
        screen: 'result',
        timerStatus: 'sent',
        pauseReason: null,
        activityNotice: null,
        selectedArtifact: null,
        evaluation: action.evaluation,
        sentAutomatically: action.automatic,
      };
    default:
      return state;
  }
};

interface Case4ContextValue {
  state: Case4State;
  challengeAvailable: boolean;
  startReview: () => void;
  startChallenge: () => void;
  pauseReview: (reason?: string) => void;
  resumeReview: () => void;
  togglePause: () => void;
  pauseForDeepReview: () => void;
  selectArtifact: (artifact: Case4ArtifactId) => void;
  removeRecipient: (id: string) => void;
  protectAudience: () => void;
  removeAttachment: (id: string) => void;
  openPreflight: () => void;
  closePreflight: () => void;
  confirmSend: () => void;
  finishScenario: () => void;
  resetCase4: () => void;
  retryCase4: () => void;
}

const Case4Context = createContext<Case4ContextValue | undefined>(undefined);

export const Case4Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { state: gameState, makeDecision, setStatus } = useGameState();
  const [state, dispatch] = useReducer(case4Reducer, undefined, createInitialState);
  const milestonesRef = useRef(new Set<number>());
  const noticeTimerRef = useRef<number | null>(null);
  const challengeAvailable = Boolean(gameState.decisionsMade['decision-scheduled-mail']);

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
    if (gameState.currentDay !== 4) {
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
    const evaluation = evaluateCase4Draft(state.recipients, state.attachments);
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

  const startChallenge = useCallback(() => {
    dispatch({ type: 'START_CHALLENGE' });
    playSound.chime(gameState.soundEnabled);
  }, [gameState.soundEnabled]);

  const pauseReview = useCallback((reason = 'REVISIÓN PAUSADA') => {
    dispatch({ type: 'PAUSE', reason });
    playSound.click(gameState.soundEnabled);
  }, [gameState.soundEnabled]);

  const resumeReview = useCallback(() => {
    dispatch({ type: 'RESUME' });
    setTemporaryNotice('Reanudando…', 1200);
    playSound.click(gameState.soundEnabled);
  }, [gameState.soundEnabled, setTemporaryNotice]);

  const togglePause = useCallback(() => {
    if (state.timerStatus === 'running') pauseReview();
    else if (state.timerStatus === 'paused') resumeReview();
  }, [pauseReview, resumeReview, state.timerStatus]);

  const pauseForDeepReview = useCallback(() => {
    if (state.timerStatus === 'running') pauseReview('REVISIÓN PAUSADA');
  }, [pauseReview, state.timerStatus]);

  const selectArtifact = useCallback((artifact: Case4ArtifactId) => {
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
    makeDecision('decision-scheduled-mail', `case4-${state.evaluation.level}`, {
      case4Outcome: state.evaluation.level,
      case4SentAutomatically: state.sentAutomatically,
    });
    setStatus('transitioning');
    playSound.chime(gameState.soundEnabled);
  }, [gameState.soundEnabled, makeDecision, setStatus, state.evaluation, state.sentAutomatically]);

  const resetCase4 = useCallback(() => {
    milestonesRef.current.clear();
    dispatch({ type: 'RESET' });
  }, []);

  const value = useMemo<Case4ContextValue>(() => ({
    state,
    challengeAvailable,
    startReview,
    startChallenge,
    pauseReview,
    resumeReview,
    togglePause,
    pauseForDeepReview,
    selectArtifact,
    removeRecipient,
    protectAudience,
    removeAttachment,
    openPreflight,
    closePreflight,
    confirmSend,
    finishScenario,
    resetCase4,
    retryCase4: resetCase4,
  }), [state, challengeAvailable, startReview, startChallenge, pauseReview, resumeReview, togglePause, pauseForDeepReview, selectArtifact, removeRecipient, protectAudience, removeAttachment, openPreflight, closePreflight, confirmSend, finishScenario, resetCase4]);

  return <Case4Context.Provider value={value}>{children}</Case4Context.Provider>;
};

// oxlint-disable-next-line react/only-export-components
export const useCase4 = () => {
  const context = useContext(Case4Context);
  if (!context) throw new Error('useCase4 must be used within Case4Provider');
  return context;
};
