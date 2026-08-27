import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useWindowManager } from '../game/WindowManagerContext';
import { useGameState } from '../game/GameStateContext';
import {
  Mail,
  FileSpreadsheet,
  Volume2,
  VolumeX,
  RefreshCw,
  LayoutGrid,
  MessageSquare,
  CircleHelp,
  CircleCheck,
  LockKeyhole,
} from 'lucide-react';
import { playSound } from '../components/sound';
import Window from '../components/Window';
import FeedbackModal from '../components/FeedbackModal';
import ExperienceScreen, { SHOW_GAME_INTRO_EVENT } from '../components/ExperienceScreen';
import MailApp from '../applications/mail/MailApp';
import SpreadsheetApp from '../applications/spreadsheet/SpreadsheetApp';
import AelScanApp from '../applications/aelscan/AelScanApp';
import AelChatApp from '../applications/aelchat/AelChatApp';
import { scenario1 } from '../content/scenario_1';
import {
  CASE1_INFRACTION_RULES_BY_ELEMENT,
  CASE2_FINDING_IDS,
} from '../content/evidenceRules';
import { motion, AnimatePresence } from 'framer-motion';
import { getCaseApplicationIds, getCaseProgressPosition, isApplicationAvailableInCase } from './caseApplications';
import { useCase3 } from '../game/Case3Context';
import CaseTutorial, { type CaseTutorialStep } from '../components/CaseTutorial';
import CompletionScreen from '../components/CompletionScreen';

// Animated Bezier Connection Overlay
const ConnectionOverlay: React.FC<{
  selectedRuleId: number | null;
  selectedEvidence: { sourceApp: string; elementId: string } | null;
}> = ({ selectedRuleId, selectedEvidence }) => {
  const [coords, setCoords] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  useEffect(() => {
    if (!selectedRuleId || !selectedEvidence) {
      setCoords(null);
      return;
    }

    const evidenceElementId = selectedEvidence.elementId;
    let active = true;

    const updateCoords = () => {
      if (!active) return;
      const elRule = document.getElementById('rule-card-' + selectedRuleId);
      const elEvidence = document.getElementById(evidenceElementId);

      if (elRule && elEvidence) {
        const rectRule = elRule.getBoundingClientRect();
        const rectEvidence = elEvidence.getBoundingClientRect();

        const x1 = rectEvidence.left + rectEvidence.width / 2;
        const y1 = rectEvidence.top + rectEvidence.height / 2;
        const x2 = rectRule.left;
        const y2 = rectRule.top + rectRule.height / 2;

        setCoords({ x1, y1, x2, y2 });
      } else {
        setCoords(null);
      }

      requestAnimationFrame(updateCoords);
    };

    updateCoords();

    return () => {
      active = false;
    };
  }, [selectedRuleId, selectedEvidence]);

  if (!coords || !selectedEvidence) return null;

  // Let it resolve if Day 1 or Day 2
  const isConfirmedViolation =
    CASE1_INFRACTION_RULES_BY_ELEMENT[selectedEvidence.elementId]?.includes(selectedRuleId ?? -1) ?? false;

  let laserColor = '#3b82f6'; // Fresh cyan-blue default
  if (isConfirmedViolation) {
    laserColor = '#f43f5e';
  } else {
    // If Day 2, show nice blue laser during active connections
    laserColor = selectedRuleId ? '#3b82f6' : '#94a3b8';
  }

  // Calculate smooth horizontal Bezier curve
  const dx = Math.abs(coords.x2 - coords.x1) * 0.45;
  const cx1 = coords.x1 + dx;
  const cy1 = coords.y1;
  const cx2 = coords.x2 - dx;
  const cy2 = coords.y2;
  const pathData = "M " + coords.x1 + " " + coords.y1 + " C " + cx1 + " " + cy1 + " " + cx2 + " " + cy2 + " " + coords.x2 + " " + coords.y2;

  return (
    <AnimatePresence>
      <svg style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 9999 }}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 2 L 10 5 L 0 8 z" fill={laserColor} />
          </marker>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Glow breathing path underlay */}
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0.2, 0.45, 0.2] }}
          exit={{ opacity: 0 }}
          transition={{
            pathLength: { duration: 0.35, ease: 'easeOut' },
            opacity: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }
          }}
          d={pathData}
          fill="none"
          stroke={laserColor}
          strokeWidth="8"
          filter="url(#glow)"
        />

        {/* Marching dots streaming flow line */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1, strokeDashoffset: [-60, 0] }}
          exit={{ opacity: 0 }}
          transition={{
            pathLength: { duration: 0.35, ease: 'easeOut' },
            strokeDashoffset: { repeat: Infinity, duration: 1.0, ease: 'linear' }
          }}
          d={pathData}
          fill="none"
          stroke={laserColor}
          strokeWidth="3"
          strokeDasharray="8,6"
          markerEnd="url(#arrow)"
        />

        {/* Pulsing source point */}
        <motion.circle
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.3, 1] }}
          exit={{ scale: 0 }}
          transition={{ scale: { repeat: Infinity, duration: 1.0, ease: 'easeInOut' } }}
          cx={coords.x1} cy={coords.y1} r="6"
          fill={laserColor}
        />

        {/* Target point */}
        <motion.circle
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          cx={coords.x2} cy={coords.y2} r="5"
          fill={laserColor}
        />
      </svg>
    </AnimatePresence>
  );
};

export const Desktop: React.FC = () => {
  const { state: windowManagerState, openWindow, closeWindow, focusWindow, autoArrange } = useWindowManager();
  const { state: case3State, resetCase3 } = useCase3();
  const {
    state: gameState,
    toggleSound,
    dismissNotification,
    triggerNotification,
    progressDay,
    setStatus,
    completeTutorial,
    resetGame,
  } = useGameState();

  const [time, setTime] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [showCase1CompletionNotice, setShowCase1CompletionNotice] = useState(false);
  const [showCase2CompletionNotice, setShowCase2CompletionNotice] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const milestoneAnnouncedRef = useRef({ case1: false, case2: false });
  const case1NoticeDismissedRef = useRef(false);
  const case2NoticeDismissedRef = useRef(false);

  const tutorialSeen = Boolean(gameState.flags[`tutorialCase${gameState.currentDay}Seen`]);

  useEffect(() => {
    if (gameState.workdayStatus !== 'active') {
      setTutorialOpen(false);
      return;
    }
    setTutorialOpen(!tutorialSeen);
  }, [gameState.currentDay, gameState.workdayStatus, tutorialSeen]);

  const handleTutorialStep = useCallback((step: CaseTutorialStep) => {
    if (!step.appId || step.appId === 'aelscan') return;
    openWindow(step.appId);
  }, [openWindow]);

  const handleTutorialComplete = useCallback(() => {
    completeTutorial(gameState.currentDay);
    setTutorialOpen(false);
    openWindow(gameState.currentDay === 2 ? 'aelchat' : 'mail');
    playSound.chime(gameState.soundEnabled);
  }, [completeTutorial, gameState.currentDay, gameState.soundEnabled, openWindow]);

  // Clock
  useEffect(() => {
    const update = () => {
      const d = new Date();
      setTime(
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      );
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  // Sound on notification
  useEffect(() => {
    if (gameState.activeNotification) {
      playSound.warning(gameState.soundEnabled);
    }
  }, [gameState.activeNotification, gameState.soundEnabled]);

  // Auto open applications on case startup
  useEffect(() => {
    if (gameState.workdayStatus === 'active') {
      if (gameState.currentDay === 1) {
        closeWindow('aelchat');
        openWindow('mail');
      } else if (gameState.currentDay === 2) {
        closeWindow('mail');
        openWindow('aelchat');
      } else if (gameState.currentDay === 3) {
        closeWindow('aelchat');
        closeWindow('spreadsheet');
        // Open after the Case 3 window tree has mounted. This also recovers
        // from a stale test/HMR state where every movable window was closed.
        const frameId = window.requestAnimationFrame(() => openWindow('mail'));
        return () => window.cancelAnimationFrame(frameId);
      }
    }
  }, [gameState.currentDay, gameState.workdayStatus, closeWindow, openWindow]);

  // Show feedback modal automatically when decision is made and status is still active (Day 1 only)
  useEffect(() => {
    const storedDecision = gameState.decisionsMade['decision-hr-send'];
    const decided = scenario1.decision.choices.some(choice => choice.id === storedDecision);
    if (decided && gameState.workdayStatus === 'active' && gameState.currentDay === 1) {
      setShowFeedback(true);
    }
  }, [gameState.decisionsMade, gameState.currentDay, gameState.workdayStatus]);

  const handleFeedbackClose = () => {
    setShowFeedback(false);
    setStatus('transitioning');
  };

  const handleShortcut = (appId: string) => {
    openWindow(appId);
    playSound.click(gameState.soundEnabled);
  };

  const handleNotificationAction = () => {
    if (gameState.activeNotification?.appToOpen) {
      openWindow(gameState.activeNotification.appToOpen);
    }
    dismissNotification();
    playSound.click(gameState.soundEnabled);
  };

  const handleNextDayLogin = () => {
    progressDay(2, null, { workdayProgressed: true });
    openWindow('aelchat');
    playSound.chime(gameState.soundEnabled);
  };

  const handleNextCase3 = () => {
    resetCase3();
    progressDay(3, {
      id: 'case3-scheduled-mail',
      title: 'Envío programado pendiente de revisión',
      message: 'RRHH programó una comunicación masiva. AelMail espera tu revisión antes de iniciar la cuenta regresiva.',
      appToOpen: 'mail',
    }, { case3Started: true });
    playSound.chime(gameState.soundEnabled);
  };

  // Cheerful, vibrant wallpaper styles changing per case/day
  const isDay2 = gameState.currentDay === 2;
  const isDay3 = gameState.currentDay === 3;
  const documentedCase2FindingCount = CASE2_FINDING_IDS.filter(id => gameState.evidenceFound.includes(id)).length;
  const isMilestoneNotification = gameState.activeNotification?.id.startsWith('milestone-') ?? false;
  const case1AuditComplete = scenario1.evidences.every(evidence => gameState.evidenceFound.includes(evidence.id));
  const case1AuditAcknowledged = Boolean(gameState.flags.case1AuditAcknowledged);
  const hasValidCase1Reply = scenario1.decision.choices.some(
    choice => choice.id === gameState.decisionsMade[scenario1.decision.id],
  );

  useEffect(() => {
    const shouldShowNotice = gameState.currentDay === 1
      && gameState.workdayStatus === 'active'
      && case1AuditComplete
      && case1AuditAcknowledged
      && !hasValidCase1Reply;

    if (shouldShowNotice && !case1NoticeDismissedRef.current) {
      setShowCase1CompletionNotice(true);
    }

    if (!case1AuditComplete || !case1AuditAcknowledged) {
      case1NoticeDismissedRef.current = false;
      setShowCase1CompletionNotice(false);
    }
  }, [case1AuditAcknowledged, case1AuditComplete, gameState.currentDay, gameState.workdayStatus, hasValidCase1Reply]);

  const dismissCase1CompletionNotice = () => {
    case1NoticeDismissedRef.current = true;
    setShowCase1CompletionNotice(false);
    openWindow('mail');
    playSound.chime(gameState.soundEnabled);
  };

  useEffect(() => {
    const case2AuditComplete = gameState.currentDay === 2
      && gameState.workdayStatus === 'active'
      && documentedCase2FindingCount === CASE2_FINDING_IDS.length;

    if (case2AuditComplete && !case2NoticeDismissedRef.current) {
      setShowCase2CompletionNotice(true);
    }

    if (!case2AuditComplete) {
      case2NoticeDismissedRef.current = false;
      setShowCase2CompletionNotice(false);
    }
  }, [documentedCase2FindingCount, gameState.currentDay, gameState.workdayStatus]);

  const dismissCase2CompletionNotice = () => {
    case2NoticeDismissedRef.current = true;
    setShowCase2CompletionNotice(false);
    openWindow('aelchat');
    playSound.chime(gameState.soundEnabled);
  };

  // Recovery path for completed saves and for any completion reached outside AelScan's active view.
  useEffect(() => {
    const case1PendingReply = gameState.currentDay === 1
      && case1AuditComplete
      && case1AuditAcknowledged
      && !hasValidCase1Reply;
    const case2PendingAction = gameState.currentDay === 2
      && documentedCase2FindingCount === CASE2_FINDING_IDS.length
      && gameState.workdayStatus === 'active';

    if (gameState.activeNotification?.id === 'milestone-case1-reply') {
      milestoneAnnouncedRef.current.case1 = true;
    }
    if (gameState.activeNotification?.id === 'milestone-case2-mitigation') {
      milestoneAnnouncedRef.current.case2 = true;
    }

    if (case1PendingReply && !gameState.activeNotification && !milestoneAnnouncedRef.current.case1) {
      milestoneAnnouncedRef.current.case1 = true;
      triggerNotification({
        id: 'milestone-case1-reply',
        title: '🎉 Auditoría completa · Responde el correo',
        message: 'Ya documentaste los 4 incumplimientos. Vuelve a Mail y elige una de las dos respuestas para Sofía.',
        appToOpen: 'mail',
      });
    }

    if (case2PendingAction && !gameState.activeNotification && !milestoneAnnouncedRef.current.case2) {
      milestoneAnnouncedRef.current.case2 = true;
      triggerNotification({
        id: 'milestone-case2-mitigation',
        title: '🎉 Auditoría completa · Actúa en el Chat',
        message: 'Documentaste las 7 evidencias y las 7 infracciones. Ahora aplica las medidas de mitigación interactivas en el Chat.',
        appToOpen: 'aelchat',
      });
    }
  }, [
    documentedCase2FindingCount,
    case1AuditAcknowledged,
    case1AuditComplete,
    hasValidCase1Reply,
    gameState.activeNotification,
    gameState.currentDay,
    gameState.decisionsMade,
    gameState.evidenceFound,
    gameState.workdayStatus,
    triggerNotification,
  ]);
  const allowedWindowIds = new Set(getCaseApplicationIds(gameState.currentDay));
  const minimizedWindows = windowManagerState.windows.filter(
    window => window.isOpen && window.isMinimized && allowedWindowIds.has(window.id),
  );
  const taskbarApps: Record<string, { label: string; Icon: React.ComponentType<{ size?: number }> }> = {
    mail: { label: 'AelMail', Icon: Mail },
    spreadsheet: { label: 'AelSheet', Icon: FileSpreadsheet },
    aelchat: { label: 'AelChat', Icon: MessageSquare },
  };
  const wallpaperStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    width: '100%',
    height: '100%',
    minWidth: '100vw',
    minHeight: '100dvh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: isDay3 ? '#287d83' : isDay2 ? '#8b5cf6' : '#3b82f6',
    backgroundImage: isDay3
      ? [
        'radial-gradient(circle at 15% 80%, rgba(250,204,21,0.48) 0%, transparent 35%)',
        'radial-gradient(circle at 84% 14%, rgba(251,146,60,0.42) 0%, transparent 34%)',
        'linear-gradient(135deg, #176b7a 0%, #2f8f89 48%, #5966a6 100%)',
      ].join(', ')
      : isDay2
        ? [
          'radial-gradient(circle at 12% 82%, rgba(163,230,53,0.62) 0%, transparent 38%)',
          'radial-gradient(circle at 82% 12%, rgba(250,204,21,0.48) 0%, transparent 36%)',
          'radial-gradient(circle at 52% 48%, rgba(255,255,255,0.18) 0%, transparent 54%)',
          'linear-gradient(135deg, #84cc16 0%, #facc15 20%, #c084fc 55%, #818cf8 100%)',
        ].join(', ')
        : [
          'radial-gradient(circle at 14% 84%, rgba(163,230,53,0.35) 0%, transparent 38%)',
          'radial-gradient(circle at 86% 14%, rgba(250,204,21,0.3) 0%, transparent 36%)',
          'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 0%, transparent 58%)',
          'linear-gradient(135deg, #22d3ee 0%, #3b82f6 56%, #818cf8 100%)',
        ].join(', '),
  };

  return (
    <div className={`ael-desktop day-${gameState.currentDay}`} style={wallpaperStyle}>
      {/* Dot grid overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        }}
      />

      {/* Connection overlay (draws document connection lines like Papers Please) */}
      <ConnectionOverlay
        selectedRuleId={gameState.selectedRuleId}
        selectedEvidence={gameState.selectedAuditElement}
      />

      {/* ─── MAIN LAYOUT: workspace + contextual side panel ─── */}
      <div
        className="desktop-main-layout"
        style={{
          position: 'fixed',
          inset: '0 0 40px 0',
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
        }}
      >
        {/* Left: shortcuts + windows workspace */}
        <div className="desktop-workspace" style={{ position: 'relative', flex: 1, minWidth: 0, overflow: 'hidden' }}>

          {/* Desktop Shortcuts */}
          <div style={{ position: 'absolute', top: '16px', left: '16px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 1, pointerEvents: 'auto' }}>
            {[
              { id: 'mail', label: 'AelMail', Icon: Mail, color: '#22d3ee' },
              { id: 'aelchat', label: 'AelChat', Icon: MessageSquare, color: '#a78bfa' },
              { id: 'spreadsheet', label: 'AelSheet', Icon: FileSpreadsheet, color: '#34d399' },
            ].filter(app => isApplicationAvailableInCase(gameState.currentDay, app.id)).map(({ id, label, Icon, color }) => (
              <button
                key={id}
                className="desktop-shortcut"
                data-tutorial-target={id}
                onClick={() => handleShortcut(id)}
                style={{ pointerEvents: 'auto', '--shortcut-accent': color } as React.CSSProperties}
              >
                <Icon size={32} color={color} strokeWidth={1.75} />
                <span className="desktop-shortcut-label" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{label}</span>
              </button>
            ))}
          </div>

          {/* Branding watermark */}
          <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.05)', fontSize: '7rem', fontWeight: 900, fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', pointerEvents: 'none', letterSpacing: '-4px' }}>
            AelOS
          </div>

          {/* Windows workspace */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
            <div style={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'none' }}>
              {isApplicationAvailableInCase(gameState.currentDay, 'mail') && (
                <Window id="mail">
                  <MailApp />
                </Window>
              )}
              {isApplicationAvailableInCase(gameState.currentDay, 'spreadsheet') && (
                <Window id="spreadsheet">
                  <SpreadsheetApp />
                </Window>
              )}
              {isApplicationAvailableInCase(gameState.currentDay, 'aelchat') && (
                <Window id="aelchat">
                  <AelChatApp />
                </Window>
              )}
            </div>
          </div>
        </div>

        {/* Right: AelScan fixed gadget panel */}
        <div
          className="aelscan-shell"
          data-tutorial-target="aelscan"
          style={{
            width: '280px',
            flexShrink: 0,
            borderLeft: '1px solid rgba(255,255,255,0.38)',
            display: 'flex',
            flexDirection: 'column',
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(22px) saturate(1.3)',
            zIndex: 5,
          }}
        >
          <AelScanApp />
        </div>
      </div>

      <AnimatePresence>
        {showCase1CompletionNotice && (
          <motion.button
            type="button"
            className="case1-completion-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={dismissCase1CompletionNotice}
            aria-label="Auditoría completa. Haz clic para ir a Mail y responder"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 5500,
              border: 'none',
              background: 'rgba(15,23,42,0.58)',
              backdropFilter: 'blur(7px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: '24px',
            }}
          >
            <motion.div
              className="case1-completion-card"
              initial={{ scale: 0.58, y: 70, rotate: -4 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.75, y: -35, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              style={{
                position: 'relative',
                width: 'min(510px, 92vw)',
                overflow: 'hidden',
                border: '3px solid #bef264',
                borderRadius: '24px',
                padding: '30px 34px',
                background: 'linear-gradient(145deg, #312e81 0%, #6d28d9 52%, #9333ea 100%)',
                color: 'white',
                textAlign: 'center',
                boxShadow: '0 30px 80px rgba(0,0,0,0.42), 0 0 0 7px rgba(250,204,21,0.16)',
              }}
            >
              {[0, 1, 2, 3].map(index => (
                <motion.span
                  key={index}
                  className="case1-completion-card__confetti"
                  aria-hidden="true"
                  animate={{ y: [0, -13, 0], rotate: [0, 16, -8, 0], opacity: [0.55, 1, 0.55] }}
                  transition={{ duration: 1.7 + index * 0.18, repeat: Infinity, delay: index * 0.16 }}
                  style={{ position: 'absolute', top: index % 2 ? '17%' : '72%', left: `${8 + index * 27}%`, color: index % 2 ? '#bef264' : '#fde047', fontSize: index % 2 ? '1.2rem' : '1.6rem' }}
                >
                  {index % 2 ? '✦' : '●'}
                </motion.span>
              ))}
              <motion.div
                className="case1-completion-card__icon"
                animate={{ scale: [1, 1.08, 1], rotate: [0, 2, -2, 0] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                style={{ position: 'relative', fontSize: '3.1rem', lineHeight: 1 }}
              >
                🎉
              </motion.div>
              <div className="case1-completion-card__eyebrow" style={{ position: 'relative', marginTop: '10px', color: '#d9f99d', fontFamily: 'var(--font-mono)', fontWeight: 900, letterSpacing: '1px' }}>
                4/4 EVIDENCIAS DOCUMENTADAS
              </div>
              <div className="case1-completion-card__title" style={{ position: 'relative', marginTop: '8px', fontSize: '1.5rem', fontWeight: 900, lineHeight: 1.15 }}>
                ¡Auditoría completada!
              </div>
              <p className="case1-completion-card__copy" style={{ position: 'relative', margin: '10px auto 0', maxWidth: '390px', color: '#ede9fe', fontSize: '0.9rem', lineHeight: 1.5 }}>
                El siguiente paso es responder el correo de RRHH. Tendrás dos alternativas y deberás elegir la acción más responsable.
              </p>
              <motion.div
                className="case1-completion-card__action"
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 1.1, repeat: Infinity }}
                style={{ position: 'relative', marginTop: '18px', display: 'inline-flex', padding: '9px 18px', borderRadius: '999px', background: 'linear-gradient(90deg, #a3e635, #fde047)', color: '#365314', fontWeight: 900, fontSize: '0.8rem' }}
              >
                Haz clic para ir a Mail →
              </motion.div>
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCase2CompletionNotice && (
          <motion.button
            type="button"
            className="case2-completion-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={dismissCase2CompletionNotice}
            aria-label="Investigación completa. Haz clic para abrir el Chat y comenzar la mitigación"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 5500,
              border: 'none',
              background: 'rgba(30,41,59,0.58)',
              backdropFilter: 'blur(7px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: '24px',
            }}
          >
            <motion.div
              initial={{ scale: 0.58, y: 70, rotate: 4 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.75, y: -35, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              style={{
                position: 'relative',
                width: 'min(510px, 92vw)',
                overflow: 'hidden',
                border: '3px solid #65a30d',
                borderRadius: '24px',
                padding: '30px 34px',
                background: 'linear-gradient(145deg, #fff7c2 0%, #fde047 48%, #bef264 100%)',
                color: '#365314',
                textAlign: 'center',
                boxShadow: '0 30px 80px rgba(0,0,0,0.4), 0 0 0 7px rgba(190,242,100,0.18)',
              }}
            >
              {[0, 1, 2, 3].map(index => (
                <motion.span
                  key={index}
                  aria-hidden="true"
                  animate={{ y: [0, -13, 0], rotate: [0, 16, -8, 0], opacity: [0.4, 0.9, 0.4] }}
                  transition={{ duration: 1.7 + index * 0.18, repeat: Infinity, delay: index * 0.16 }}
                  style={{ position: 'absolute', top: index % 2 ? '17%' : '72%', left: `${8 + index * 27}%`, color: index % 2 ? '#15803d' : '#ca8a04', fontSize: index % 2 ? '1.2rem' : '1.6rem' }}
                >
                  {index % 2 ? '✦' : '●'}
                </motion.span>
              ))}
              <motion.div
                animate={{ scale: [1, 1.08, 1], rotate: [0, 2, -2, 0] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                style={{ position: 'relative', fontSize: '3.1rem', lineHeight: 1 }}
              >
                🛠️
              </motion.div>
              <div style={{ position: 'relative', marginTop: '10px', color: '#3f6212', fontFamily: 'var(--font-mono)', fontWeight: 900, letterSpacing: '1px' }}>
                7/7 INFRACCIONES DOCUMENTADAS
              </div>
              <div style={{ position: 'relative', marginTop: '8px', fontSize: '1.5rem', fontWeight: 900, lineHeight: 1.15 }}>
                ¡Es hora de mitigar!
              </div>
              <p style={{ position: 'relative', margin: '10px auto 0', maxWidth: '390px', color: '#4d5f20', fontSize: '0.9rem', lineHeight: 1.5 }}>
                La investigación está completa. Vuelve al Chat y aplica las medidas necesarias para corregir los riesgos que encontraste.
              </p>
              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 1.1, repeat: Infinity }}
                style={{ position: 'relative', marginTop: '18px', display: 'inline-flex', padding: '9px 18px', borderRadius: '999px', background: '#365314', color: '#f7fee7', fontWeight: 900, fontSize: '0.8rem' }}
              >
                Haz clic para abrir el Chat →
              </motion.div>
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      {gameState.activeNotification && (
        <div
          className={`glass-panel${isMilestoneNotification ? ' milestone-toast' : ''}`}
          role="status"
          aria-live="assertive"
          style={{
            position: 'absolute',
            bottom: '52px',
            right: '292px',
            width: '300px',
            padding: '14px',
            zIndex: 200,
            borderLeft: isMilestoneNotification ? '4px solid #a3e635' : '4px solid #22d3ee',
            animation: isMilestoneNotification
              ? 'milestoneToastIn 0.5s cubic-bezier(0.16,1,0.3,1), milestoneToastGlow 1.7s ease-in-out 0.5s infinite'
              : 'windowOpen 0.25s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: '0.85rem',
              marginBottom: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              color: 'white',
            }}
          >
            <span>{gameState.activeNotification.title}</span>
            <button
              onClick={() => { dismissNotification(); playSound.click(gameState.soundEnabled); }}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', lineHeight: 1, padding: '0 0 0 8px', flexShrink: 0 }}
            >
              ✕
            </button>
          </div>
          <p style={{ fontSize: '0.78rem', opacity: 0.85, lineHeight: 1.4, color: 'white', marginBottom: '10px' }}>
            {gameState.activeNotification.message}
          </p>
          <button
            className="retro-btn primary"
            style={{ padding: '4px 12px', fontSize: '0.75rem', width: '100%', justifyContent: 'center' }}
            onClick={handleNotificationAction}
          >
            {gameState.activeNotification.id === 'milestone-case1-reply'
              ? 'Ir a Mail y responder →'
              : gameState.activeNotification.id === 'milestone-case2-mitigation'
                ? 'Abrir Chat y actuar →'
                : 'Revisar ahora'}
          </button>
        </div>
      )}

      {/* Legal Disclaimer */}
      <div
        style={{
          position: 'absolute',
          bottom: '44px',
          left: '108px',
          color: 'rgba(255,255,255,0.22)',
          fontSize: '0.65rem',
          maxWidth: '480px',
          lineHeight: '1.3',
          pointerEvents: 'none',
        }}
      >
        Educativo y de Simulación — Personajes y documentos ficticios. No constituye asesoría jurídica bajo Ley 21.719.
      </div>

      {/* Taskbar */}
      <div
        className="bevel-raised ael-taskbar"
        style={{
          height: '40px',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'rgba(255,255,255,0.82)',
          borderTop: '1px solid rgba(255,255,255,0.72)',
          backdropFilter: 'blur(20px) saturate(1.35)',
          zIndex: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          gap: '8px',
        }}
      >
        {/* Left: brand + reset + arrange */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <button
            className="retro-btn primary"
            style={{ fontSize: '0.78rem', padding: '3px 10px', gap: '5px' }}
            onClick={() => {
              resetGame();
              window.dispatchEvent(new Event(SHOW_GAME_INTRO_EVENT));
              playSound.chime(gameState.soundEnabled);
            }}
            title="Reiniciar caso desde el inicio"
          >
            <RefreshCw size={11} /> Reiniciar
          </button>
          <button
            className="retro-btn"
            style={{ fontSize: '0.78rem', padding: '3px 8px', gap: '5px' }}
            onClick={() => { autoArrange(); playSound.click(gameState.soundEnabled); }}
            title="Organizar ventanas automáticamente"
          >
            <LayoutGrid size={11} /> Organizar
          </button>

          <button
            className="retro-btn tutorial-replay-button"
            style={{ fontSize: '0.78rem', padding: '3px 8px', gap: '5px' }}
            onClick={() => {
              setTutorialOpen(true);
              playSound.click(gameState.soundEnabled);
            }}
            title={`Volver a ver la guía del Caso ${gameState.currentDay}`}
          >
            <CircleHelp size={12} /> Guía
          </button>

          {/* Progreso secuencial: informa el estado, pero no permite saltar casos. */}
          <div className="case-switcher case-progress-lock" aria-label="Progreso de casos">
            {[1, 2, 3].map(caseNumber => {
              const isFinalCaseComplete = gameState.currentDay === 3
                && caseNumber === 3
                && gameState.workdayStatus !== 'active';
              const status = caseNumber < gameState.currentDay || isFinalCaseComplete
                ? 'complete'
                : caseNumber === gameState.currentDay
                  ? 'current'
                  : 'locked';
              return (
                <div
                  key={caseNumber}
                  className={`case-progress-lock__item is-${status}`}
                  aria-label={`Caso ${caseNumber}: ${status === 'complete' ? 'completado' : status === 'current' ? 'en curso' : 'bloqueado'}`}
                  title={status === 'locked' ? `Completa el Caso ${caseNumber - 1} para desbloquearlo` : undefined}
                >
                  {status === 'complete' ? <CircleCheck size={12} /> : status === 'locked' ? <LockKeyhole size={11} /> : <span aria-hidden="true">●</span>}
                  <b>Caso {caseNumber}</b>
                </div>
              );
            })}
          </div>

          <div
            className="bevel-inset"
            style={{
              padding: '1px 10px',
              background: '#94a3b8',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'white',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              borderRadius: '4px',
            }}
          >
            <span>CASO {gameState.currentDay} · {getCaseProgressPosition(gameState.currentDay)}/3</span>
            <span>
              {gameState.currentDay === 1
                ? `${gameState.evidenceFound.filter(id => id.startsWith('ev-') && !id.startsWith('ev-ch-')).length}/4 evidencias`
                : gameState.currentDay === 2
                  ? `${documentedCase2FindingCount}/${CASE2_FINDING_IDS.length} resueltas`
                  : case3State.evaluation
                    ? `resultado ${case3State.evaluation.level}`
                    : `${case3State.secondsRemaining}s · ${case3State.timerStatus === 'running' ? 'envío activo' : 'envío pausado'}`
              }
            </span>
          </div>

          {minimizedWindows.length > 0 && (
            <div className="minimized-apps" aria-label="Aplicaciones minimizadas">
              {minimizedWindows.map(window => {
                const app = taskbarApps[window.id];
                if (!app) return null;
                const { Icon } = app;
                return (
                  <button
                    key={window.id}
                    className="minimized-app-button"
                    onClick={() => {
                      focusWindow(window.id);
                      playSound.click(gameState.soundEnabled);
                    }}
                    title={`Restaurar ${app.label}`}
                  >
                    <Icon size={12} />
                    <span>{app.label}</span>
                    <span className="minimized-app-button__state">min.</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Glowing taskbar warning/compliance alerts based on decision */}
          {gameState.decisionsMade['decision-hr-send'] && gameState.currentDay === 1 && (
            <div
              className="animate-pulse"
              style={{
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                fontFamily: 'var(--font-mono)',
                color: 'white',
                background: gameState.flags.exposedApplicants
                  ? '#f43f5e'
                  : gameState.flags.hiringDelayed
                    ? '#fbbf24'
                    : '#10b981',
                border: '1px solid ' + (
                  gameState.flags.exposedApplicants
                    ? '#be123c'
                    : gameState.flags.hiringDelayed
                      ? '#b45309'
                      : '#047857'
                ),
              }}
            >
              {gameState.flags.exposedApplicants
                ? '🚨 FUGA DE DATOS COMPROMETIDOS'
                : gameState.flags.hiringDelayed
                  ? '⚠️ FLUJO RETENIDO / CONTROL LEGAL'
                  : '✅ CUMPLIMIENTO VERIFICADO'}
            </div>
          )}
        </div>

        {/* Right: author + sound + clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <a
            href="https://github.com/AelStGermain"
            target="_blank"
            rel="noreferrer"
            title="Creado por Ael · GitHub: AelStGermain"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(100,116,139,0.3)',
              background: 'rgba(255,255,255,0.68)',
              color: '#475569',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.64rem',
              fontWeight: 800,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <span aria-hidden="true" style={{ fontSize: '0.75rem' }}>⌨</span>
            <span>Sofía Gómez · AelStGermain</span>
          </a>
          <button
            className={`retro-btn ${gameState.soundEnabled ? 'primary' : ''}`}
            style={{ padding: '3px 8px' }}
            onClick={toggleSound}
            title={gameState.soundEnabled ? 'Silenciar' : 'Activar sonido'}
          >
            {gameState.soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
          </button>

          <div
            className="bevel-inset"
            style={{
              padding: '3px 10px',
              background: '#94a3b8',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: 'white',
              borderRadius: '4px',
            }}
          >
            {time}
          </div>
        </div>
      </div>

      <CaseTutorial
        caseId={gameState.currentDay}
        open={tutorialOpen && gameState.workdayStatus === 'active'}
        onComplete={handleTutorialComplete}
        onStepChange={handleTutorialStep}
      />

      {/* FeedbackModal */}
      {showFeedback && (
        <FeedbackModal
          onClose={handleFeedbackClose}
        />
      )}

      {/* Case transition / Game End — the full scene advances with one click. */}
      {gameState.workdayStatus === 'transitioning' && (
        gameState.currentDay === 1 ? (
          <ExperienceScreen
            theme="case2"
            title="¿Qué hablan en el grupo?."
            lead="En el Chat de Administración se compartieron datos personales y hay accesos que podrían estar desactualizados."
            caseLabel="Caso 2 · Comunicación y acceso"
            caseTitle="Una conversación que parecía rutinaria."
            description="Entra al escritorio. El tutorial te mostrará por dónde comenzar."
            steps={[]}
            tools={[]}
            metrics={[]}
            compact
            continueLabel="Comenzar Caso 2"
            onContinue={handleNextDayLogin}
          />
        ) : gameState.currentDay === 2 ? (
          <ExperienceScreen
            theme="case2"
            title="Un correo saldrá en 30 segundos."
            lead="RRHH programó un envío masivo. Hay tres riesgos que deben corregirse antes de que termine la cuenta regresiva."
            caseLabel="Caso 3 · El correo equivocado"
            caseTitle="Revisa antes del envío."
            description="Al cerrar el tutorial comenzará inmediatamente el tiempo."
            steps={[]}
            tools={[]}
            metrics={[]}
            compact
            continueLabel="Abrir tutorial del Caso 3"
            onContinue={handleNextCase3}
          />
        ) : (
          <CompletionScreen
            onRestart={() => {
              resetGame();
              window.dispatchEvent(new Event(SHOW_GAME_INTRO_EVENT));
              playSound.chime(gameState.soundEnabled);
            }}
          />
        )
      )}
    </div>
  );
};

export default Desktop;
