import React, { useState, useEffect, useRef } from 'react';
import { useGameState } from '../../game/GameStateContext';
import { useWindowManager } from '../../game/WindowManagerContext';
import { scenario2, ChatMessage, ChatMember } from '../../content/scenario_2';
import {
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Info,
  Users,
  FileText,
  Clock,
  AlertTriangle,
  FolderOpen,
  Trash2,
  Sparkles
} from 'lucide-react';
import { playSound } from '../../components/sound';
import { beginEvidenceDrag, endEvidenceDrag } from '../../components/evidenceDrag';
import {
  CASE2_EVIDENCE_CATALOG,
  CASE2_FINDING_IDS,
  CASE2_INFRACTION_RULES_BY_EVIDENCE,
  getRuleTokens,
  isCase2EvidenceResolved,
} from '../../content/evidenceRules';
import { motion, AnimatePresence } from 'framer-motion';
import { pinEvidenceInAelScan, showAelScanRegulations } from '../../components/aelScanNavigation';

const getEvidenceDragLabel = (evidenceId: string) => {
  return CASE2_EVIDENCE_CATALOG[evidenceId]?.label ?? 'Evidencia de privacidad';
};

const MITIGATION_LABELS: Record<string, string> = {
  'javiera-disculpa': 'Avisar a Javiera y solicitar la revocación de su acceso',
  'aviso-grupal': 'Detener la divulgación de información médica y financiera',
  'eliminar-archivo': 'Retirar la copia compartida y solicitar una revisión de permisos',
};

export const AelChatApp: React.FC = () => {
  const { state: gameState, makeDecision, setStatus, triggerNotification } = useGameState();
  const { openWindow } = useWindowManager();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // General App Navigation
  const [activeContact, setActiveContact] = useState<'group' | 'javiera-dm'>('group');

  // ────────────── DAY 2 AELCHAT APP STATE ──────────────
  const [visibleMsgCount, setVisibleMsgCount] = useState<number>(1);
  const [chatSpeed, setChatSpeed] = useState<'normal' | 'fast' | 'paused'>('normal');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<'members' | 'files'>('members');
  const [selectedMemberProfile, setSelectedMemberProfile] = useState<ChatMember | null>(null);
  
  // ────────────── MITIGATION PHASE STATE ──────────────
  const [mitigationPhase, setMitigationPhase] = useState<boolean>(false);
  const [completedMitigations, setCompletedMitigations] = useState<Set<string>>(new Set());
  const [javieraDmMessages, setJavieraDmMessages] = useState<Array<{id: string; sender: 'player' | 'javiera'; text: string; timestamp: string}>>([
    { id: 'jdm-0', sender: 'javiera', text: 'Hola... ¿Eres del equipo de auditoría? Vi que aún tengo acceso al grupo.', timestamp: '10:01' }
  ]);
  const [fileDeleted, setFileDeleted] = useState<boolean>(false);
  const [groupMessageSent, setGroupMessageSent] = useState<boolean>(false);
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [isJavieraReplyPending, setIsJavieraReplyPending] = useState(false);
  const mitigationLocksRef = useRef(new Set<string>());
  const javieraReplyTimerRef = useRef<number | null>(null);
  const closeCaseStartedRef = useRef(false);

  // Typing indicator local feedback
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const isCase2EvidenceComplete = CASE2_FINDING_IDS.every(
    findingId => gameState.evidenceFound.includes(findingId),
  );

  const mitigationCount = completedMitigations.size;
  const allMitigationsComplete = mitigationCount === 3;

  // Auto-show completion modal when all 3 mitigations done
  useEffect(() => {
    if (allMitigationsComplete && mitigationPhase && !showCompletionModal) {
      const completionTimer = window.setTimeout(() => {
        setShowCompletionModal(true);
        playSound.success(gameState.soundEnabled);
      }, 800);
      return () => window.clearTimeout(completionTimer);
    }
  }, [allMitigationsComplete, mitigationPhase, showCompletionModal, gameState.soundEnabled]);

  useEffect(() => () => {
    if (javieraReplyTimerRef.current !== null) {
      window.clearTimeout(javieraReplyTimerRef.current);
    }
  }, []);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [visibleMsgCount, activeContact, isTyping]);

  // Handle Day 2 progressive message loading
  useEffect(() => {
    if (activeContact !== 'group') return;
    if (visibleMsgCount >= scenario2.messages.length) return;
    if (chatSpeed === 'paused') return;

    const delay = chatSpeed === 'fast' ? 1000 : 4000;
    
    // Trigger typing indicator 1.5s before message renders
    const typingTimer = setTimeout(() => {
      setIsTyping(true);
    }, Math.max(500, delay - 1500));

    const nextMsgTimer = setTimeout(() => {
      setIsTyping(false);
      setVisibleMsgCount(prev => prev + 1);
      playSound.click(gameState.soundEnabled);

      // Play chime if it was a strong message (like Javiera's first message)
      const nextMsg = scenario2.messages[visibleMsgCount];
      if (nextMsg && (nextMsg.sender === 'Javiera' || nextMsg.text.includes('médica') || nextMsg.text.includes('depresión'))) {
        playSound.warning(gameState.soundEnabled);
      }
    }, delay);

    return () => {
      clearTimeout(typingTimer);
      clearTimeout(nextMsgTimer);
    };
  }, [visibleMsgCount, chatSpeed, activeContact, gameState.soundEnabled]);

  // ────────────── DAY 2 EVIDENCE PINNING ANIMATION ──────────────
  const handleCollectEvidence = (evidenceId: string, _label: string, e: React.MouseEvent) => {
    e.stopPropagation();
    pinEvidenceInAelScan(evidenceId);
    showAelScanRegulations();
    playSound.click(gameState.soundEnabled);
  };

  const handleDragStart = (e: React.DragEvent<HTMLElement>, evidenceId: string) => {
    e.stopPropagation();
    e.dataTransfer.setData('text/plain', evidenceId);
    beginEvidenceDrag(e, getEvidenceDragLabel(evidenceId));
    playSound.click(gameState.soundEnabled);
  };

  // ────────────── MITIGATION HANDLERS ──────────────
  
  const completeMitigation = (mitigationId: string) => {
    setCompletedMitigations(prev => {
      const next = new Set(prev);
      next.add(mitigationId);
      return next;
    });
    playSound.success(gameState.soundEnabled);
    triggerNotification({
      id: 'mitigation-' + mitigationId,
      title: '✅ Mitigación Aplicada',
      message: MITIGATION_LABELS[mitigationId] ?? 'Acción correctiva registrada exitosamente.'
    });
  };

  // Mitigation 1: Send apology DM to Javiera and remove her
  const handleJavieraApology = () => {
    const mitigationId = 'javiera-disculpa';
    if (completedMitigations.has(mitigationId) || mitigationLocksRef.current.has(mitigationId)) return;
    mitigationLocksRef.current.add(mitigationId);
    setIsJavieraReplyPending(true);
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setJavieraDmMessages(prev => [...prev, {
      id: 'jdm-player-' + Date.now(),
      sender: 'player',
      text: 'Hola Javiera. Lamento que mantuviéramos tu acceso al grupo después de tu salida. Ya solicité su revocación y reporté la exposición de datos para corregirla.',
      timestamp: time
    }]);

    // Javiera responds after a delay
    javieraReplyTimerRef.current = window.setTimeout(() => {
      setJavieraDmMessages(prev => [...prev, {
        id: 'jdm-javiera-reply',
        sender: 'javiera',
        text: '¡Muchas gracias por avisarme! Me preocupaba bastante seguir viendo esos datos. Agradezco que se tomen medidas. 🙏',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsJavieraReplyPending(false);
      javieraReplyTimerRef.current = null;
      completeMitigation(mitigationId);
    }, 1500);
  };

  // Mitigation 2: Send compliance warning in group chat
  const handleGroupComplianceMessage = () => {
    const mitigationId = 'aviso-grupal';
    if (completedMitigations.has(mitigationId) || mitigationLocksRef.current.has(mitigationId)) return;
    mitigationLocksRef.current.add(mitigationId);
    setGroupMessageSent(true);

    // Add the compliance message to the visible messages
    // We'll add it as a visual-only message in the chat
    setVisibleMsgCount(scenario2.messages.length); // ensure all messages are visible first
    completeMitigation(mitigationId);
  };

  // Mitigation 3: Remove the exposed file and restrict the source permissions
  const handleDeleteFile = () => {
    const mitigationId = 'eliminar-archivo';
    if (completedMitigations.has(mitigationId) || mitigationLocksRef.current.has(mitigationId)) return;
    mitigationLocksRef.current.add(mitigationId);
    setFileDeleted(true);
    completeMitigation(mitigationId);
  };

  // Final case closure
  const handleCloseCase2 = () => {
    if (closeCaseStartedRef.current) return;
    closeCaseStartedRef.current = true;
    makeDecision('decision-case-2-action', 'mitigations-complete', {
      case2Outcome: 'success',
      exposedApplicants: false,
      hiringDelayed: false
    });
    setShowCompletionModal(false);
    setStatus('transitioning');
    playSound.success(gameState.soundEnabled);
  };


  // Day 2 messages to render progressively
  const day2Messages: ChatMessage[] = scenario2.messages.slice(0, visibleMsgCount);

  return (
    <div className="ael-app chat-app" style={{ display: 'flex', height: '100%', width: '100%', background: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
      
      {/* LEFT SIDEBAR: Chats List */}
      <div className="app-sidebar" style={{ width: '220px', background: '#f1f5f9', borderRight: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div className="app-brandbar" style={{ padding: '12px 14px', background: '#1e3a8a', color: 'white', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={14} /> Chats AelOS
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '6px' }}>
          {/* Group Chat Case 2 */}
          <div
                onClick={() => { setActiveContact('group'); playSound.click(gameState.soundEnabled); }}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: activeContact === 'group' ? 'white' : 'transparent',
                  borderLeft: activeContact === 'group' ? '3px solid #3b82f6' : '3px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#0369a1', position: 'relative' }}>
                  <Users size={16} />
                  {visibleMsgCount < scenario2.messages.length && chatSpeed !== 'paused' && (
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                  )}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' }}>Adm. Sucursal Centro</div>
                  <div style={{ fontSize: '0.66rem', color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    Carolina: {scenario2.messages[visibleMsgCount - 1]?.text}
                  </div>
                </div>
              </div>

          {/* Javiera DM - appears during mitigation phase */}
          {mitigationPhase && (
            <div
                  onClick={() => { setActiveContact('javiera-dm'); playSound.click(gameState.soundEnabled); }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: activeContact === 'javiera-dm' ? 'white' : 'transparent',
                    borderLeft: activeContact === 'javiera-dm' ? '3px solid #e11d48' : '3px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    position: 'relative'
                  }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ffe4e6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#be123c', position: 'relative' }}>
                    JS
                    {!completedMitigations.has('javiera-disculpa') && (
                      <div style={{ position: 'absolute', top: -2, right: -2, width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' }}>Javiera Soto</div>
                    <div style={{ fontSize: '0.66rem', color: completedMitigations.has('javiera-disculpa') ? '#10b981' : '#e11d48', fontWeight: 600 }}>
                      {completedMitigations.has('javiera-disculpa') ? '✅ Disculpa enviada' : '⚠️ Requiere acción'}
                    </div>
                  </div>
            </div>
          )}
        </div>
      </div>

      {/* CHAT MAIN PANEL */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
        
        {/* Chat Title bar */}
        <div style={{ padding: '10px 16px', background: 'white', borderBottom: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1e293b' }}>
              {activeContact === 'javiera-dm'
                ? 'Javiera Soto (Ex-trabajadora)'
                : 'Administración · Sucursal Centro'}
            </span>
            <div style={{ fontSize: '0.68rem', color: activeContact === 'javiera-dm' ? '#64748b' : '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: activeContact === 'javiera-dm' ? '#94a3b8' : '#10b981' }} />
              <span>{activeContact === 'javiera-dm' ? 'Desconectado (Inactivo)' : 'Conectado (En línea)'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {activeContact === 'group' && (
                /* Speed Controls */
                <div style={{ display: 'flex', background: '#f1f5f9', padding: '2px', borderRadius: '6px', border: '1px solid #e2e8f0', marginRight: '6px' }}>
                  <button
                    onClick={() => { setChatSpeed('normal'); playSound.click(gameState.soundEnabled); }}
                    style={{ background: chatSpeed === 'normal' ? 'white' : 'transparent', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold', color: chatSpeed === 'normal' ? '#3b82f6' : '#64748b', cursor: 'pointer' }}
                    title="Velocidad normal"
                  >
                    1x
                  </button>
                  <button
                    onClick={() => { setChatSpeed('fast'); playSound.click(gameState.soundEnabled); }}
                    style={{ background: chatSpeed === 'fast' ? 'white' : 'transparent', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold', color: chatSpeed === 'fast' ? '#3b82f6' : '#64748b', cursor: 'pointer' }}
                    title="Acelerar mensajes"
                  >
                    2x
                  </button>
                  <button
                    onClick={() => { setChatSpeed('paused'); playSound.click(gameState.soundEnabled); }}
                    style={{ background: chatSpeed === 'paused' ? 'white' : 'transparent', border: 'none', padding: '3px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold', color: chatSpeed === 'paused' ? '#3b82f6' : '#64748b', cursor: 'pointer' }}
                    title="Pausar flujo"
                  >
                    Pausa
                  </button>
                </div>
              )}

              <button
                className={'retro-btn ' + (isDrawerOpen ? 'primary' : '')}
                style={{ padding: '4px 8px', gap: '4px', fontSize: '0.72rem', position: 'relative' }}
                onClick={() => { setIsDrawerOpen(!isDrawerOpen); playSound.click(gameState.soundEnabled); }}
              >
                <Info size={12} />
                <span>Información</span>
                {mitigationPhase && !completedMitigations.has('eliminar-archivo') && (
                  <div style={{ position: 'absolute', top: -3, right: -3, width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
                )}
              </button>
          </div>
        </div>

        {/* MITIGATION PHASE HUD */}
        {mitigationPhase && (
          <div style={{
            padding: '10px 16px',
            background: '#f0fdf4',
            borderBottom: '1px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={15} color="#166534" />
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#166534', letterSpacing: '0.2px' }}>
                Fase de Mitigación de Privacidad
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '80px', height: '6px', background: '#dcfce7', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(mitigationCount / 3) * 100}%`, background: '#22c55e', transition: 'width 0.4s ease' }} />
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534' }}>
                {mitigationCount}/3 Completado
              </span>
            </div>
          </div>
        )}

        {/* Message Stream */}
        <div className="chat-canvas" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#f8fafc' }}>
          {activeContact === 'javiera-dm' ? (
              javieraDmMessages.map(msg => (
                <div key={msg.id} style={{ alignSelf: msg.sender === 'player' ? 'flex-end' : 'flex-start', display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'player' ? 'flex-end' : 'flex-start', width: '100%', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', marginLeft: msg.sender === 'player' ? '0' : '4px', marginRight: msg.sender === 'player' ? '4px' : '0' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: msg.sender === 'player' ? '#0369a1' : '#be123c' }}>
                      {msg.sender === 'player' ? 'Auditoría (Tú)' : 'Javiera Soto'}
                    </span>
                    <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{msg.timestamp}</span>
                  </div>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '14px',
                    borderTopLeftRadius: msg.sender === 'player' ? '14px' : '0',
                    borderTopRightRadius: msg.sender === 'player' ? '0' : '14px',
                    fontSize: '0.82rem',
                    lineHeight: '1.45',
                    background: msg.sender === 'player' ? '#e0f2fe' : '#fff5f5',
                    color: msg.sender === 'player' ? '#0369a1' : '#9f1239',
                    border: msg.sender === 'player' ? '1px solid #bae6fd' : '1px solid #fecdd3',
                    maxWidth: '75%',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))
            ) : (
              <>
                {day2Messages.map(msg => {
                  const isConfirmedEvidence = !!msg.evidenceId
                    && msg.evidenceId !== 'ev-ch-file-agosto'
                    && !!CASE2_INFRACTION_RULES_BY_EVIDENCE[msg.evidenceId];
                  const isDraggableEvidence = isConfirmedEvidence;
                  const isResolvedEvidence = Boolean(msg.evidenceId && isCase2EvidenceResolved(msg.evidenceId, gameState.evidenceFound));
                  
                  // Dynamic pastel speaker theme styles for expressiveness
                  const senderThemes: Record<string, { bg: string; border: string; text: string; headerColor: string }> = {
                    Carolina: { bg: '#fefbeb', border: '#fde047', text: '#78350f', headerColor: '#b45309' },
                    Andrés: { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', headerColor: '#15803d' },
                    Martín: { bg: '#f0f9ff', border: '#bae6fd', text: '#075985', headerColor: '#0369a1' },
                    Javiera: { bg: '#fff5f5', border: '#fecdd3', text: '#9f1239', headerColor: '#be123c' },
                    Felipe: { bg: '#fff7ed', border: '#fed7aa', text: '#9a3412', headerColor: '#c2410c' },
                  };

                  const theme = senderThemes[msg.sender] || { bg: 'white', border: '#e2e8f0', text: '#1e293b', headerColor: '#1e3a8a' };

                  return (
                    <div key={msg.id} style={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', width: '85%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', marginLeft: '2px' }}>
                        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: theme.headerColor }}>{msg.sender}</span>
                        <span style={{ fontSize: '0.64rem', color: '#64748b' }}>({msg.senderRole})</span>
                        <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{msg.timestamp}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }} className="chat-bubble-row">
                        <div style={{
                          padding: '10px 14px',
                          borderRadius: '14px',
                          borderTopLeftRadius: 0,
                          fontSize: '0.82rem',
                          lineHeight: '1.45',
                          background: theme.bg,
                          color: theme.text,
                          border: '1px solid ' + (isResolvedEvidence ? '#34d399' : theme.border),
                          flex: 1,
                          position: 'relative',
                          boxShadow: isResolvedEvidence ? '0 0 0 2px rgba(52,211,153,0.18)' : '0 2px 4px rgba(0,0,0,0.02)',
                          transition: 'border 0.2s',
                          cursor: isDraggableEvidence ? 'grab' : isConfirmedEvidence ? 'pointer' : 'default'
                        }}
                        className={isDraggableEvidence ? 'draggable-evidence' : undefined}
                        draggable={isDraggableEvidence}
                        onClick={isConfirmedEvidence ? (event) => handleCollectEvidence(msg.evidenceId!, msg.evidenceLabel ?? 'Evidencia del Chat', event) : undefined}
                        onDragStart={(e) => handleDragStart(e, msg.evidenceId!)}
                        onDragEnd={endEvidenceDrag}
                        data-rule-ids={isDraggableEvidence ? getRuleTokens(CASE2_INFRACTION_RULES_BY_EVIDENCE[msg.evidenceId!]) : undefined}
                        >
                          {msg.text}
                          {isResolvedEvidence && (
                            <div style={{ marginTop: '7px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 7px', borderRadius: '999px', background: '#d1fae5', color: '#047857', fontSize: '0.62rem', fontWeight: 900 }}>
                              ✓ Evidencia resuelta
                            </div>
                          )}
                          
                          {msg.attachmentId === 'ev-ch-file-agosto' && (
                            <div
                              onClick={() => { if (!fileDeleted) { openWindow('spreadsheet'); playSound.click(gameState.soundEnabled); } }}
                              style={{ 
                                marginTop: '8px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                padding: '6px 10px', 
                                background: fileDeleted ? '#fee2e2' : 'rgba(255,255,255,0.7)', 
                                border: '1px solid ' + (fileDeleted ? '#fca5a5' : theme.border), 
                                borderRadius: '8px', 
                                cursor: fileDeleted ? 'not-allowed' : 'pointer', 
                                fontSize: '0.72rem', 
                                fontWeight: 700, 
                                color: fileDeleted ? '#991b1b' : theme.text,
                                textDecoration: fileDeleted ? 'line-through' : 'none'
                              }}
                            >
                              <FolderOpen size={14} />
                              <span>{fileDeleted ? 'ACCESO REVOCADO - ARCHIVO ELIMINADO POR AUDITORÍA' : 'personal_sucursal_agosto.xlsx'}</span>
                              {!fileDeleted && <span style={{ fontSize: '0.62rem', opacity: 0.8, fontWeight: 400 }}>(Planilla Excel)</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Visual player-sent compliance warning message */}
                {groupMessageSent && (
                  <div style={{ alignSelf: 'flex-end', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: '75%', marginTop: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', marginRight: '4px' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#0369a1' }}>Auditoría (Tú)</span>
                      <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Enviado</span>
                    </div>
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: '14px',
                      borderTopRightRadius: 0,
                      fontSize: '0.82rem',
                      lineHeight: '1.45',
                      background: '#e0f2fe',
                      color: '#0369a1',
                      border: '1px solid #bae6fd',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}>
                      ⚠️ <strong>Protocolo de datos (Ley 21.719):</strong> En este grupo solo debe comunicarse la información operacional estrictamente necesaria. No publiquen diagnósticos, detalles de licencias médicas, deudas, anticipos ni problemas financieros personales. Estos antecedentes deben tratarse únicamente por canales autorizados y con acceso restringido.
                    </div>
                  </div>
                )}
              </>
            )}

          {/* Typing Indicator */}
          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'rgba(0,0,0,0.03)', borderRadius: '10px', width: 'fit-content' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#64748b', animation: 'pulse 1.2s infinite' }} />
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#64748b', animation: 'pulse 1.2s infinite 0.2s' }} />
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#64748b', animation: 'pulse 1.2s infinite 0.4s' }} />
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* BOTTOM ACTION BAR */}
        <div style={{ padding: '12px 14px', background: 'white', borderTop: '1px solid #cbd5e1', flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {mitigationPhase ? (
                /* Controles en fase de mitigación */
                activeContact === 'javiera-dm' ? (
                  !completedMitigations.has('javiera-disculpa') ? (
                    <div style={{ background: '#fff1f2', border: '1.5px solid #fecdd3', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: '#9f1239', fontSize: '0.78rem' }}>
                        <AlertTriangle size={14} color="#e11d48" />
                        <span>Mitigación 1/3: Avisar y Escalar el Acceso</span>
                      </div>
                      <p style={{ fontSize: '0.7rem', color: '#4c0519', margin: 0, lineHeight: '1.3' }}>
                        Resuelve dos hallazgos: avisa a Javiera y solicita que desactiven su acceso al grupo.
                      </p>
                      <button
                        onClick={handleJavieraApology}
                        disabled={isJavieraReplyPending}
                        className="retro-btn danger"
                        style={{ padding: '6px 12px', fontSize: '0.74rem', justifyContent: 'center', marginTop: '2px' }}
                      >
                        {isJavieraReplyPending ? 'Solicitando revocación…' : 'Avisar y Solicitar Revocación'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '10px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', color: '#166534', fontWeight: 600 }}>
                      <CheckCircle2 size={14} color="#22c55e" />
                      <span>Mitigación completada. Javiera Soto ha sido disculpada y notificada. Acceso del chat revocado.</span>
                    </div>
                  )
                ) : activeContact === 'group' ? (
                  !completedMitigations.has('aviso-grupal') ? (
                    <div style={{ background: '#fef3c7', border: '1.5px solid #fde68a', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: '#92400e', fontSize: '0.78rem' }}>
                        <AlertTriangle size={14} color="#d97706" />
                        <span>Mitigación 2/3: Detener Divulgaciones Sensibles</span>
                      </div>
                      <p style={{ fontSize: '0.7rem', color: '#78350f', margin: 0, lineHeight: '1.3' }}>
                        Resuelve los hallazgos médico y financiero: indica que no deben compartirse diagnósticos, licencias, deudas ni otros datos personales innecesarios en el grupo.
                      </p>
                      <button
                        onClick={handleGroupComplianceMessage}
                        className="retro-btn primary"
                        style={{ padding: '6px 12px', fontSize: '0.74rem', justifyContent: 'center', marginTop: '2px', background: '#3b82f6', borderColor: '#3b82f6' }}
                      >
                        Enviar Protocolo de Datos al Chat
                      </button>
                    </div>
                  ) : (
                    <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '10px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', color: '#166534', fontWeight: 600 }}>
                      <CheckCircle2 size={14} color="#22c55e" />
                      <span>Mitigación completada. Advertencia de cumplimiento Ley 21.719 enviada al chat.</span>
                    </div>
                  )
                ) : (
                  <div style={{ padding: '8px 12px', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.72rem', color: '#64748b' }}>
                    <span>Selecciona el chat "Javiera Soto" o el grupo de chat para aplicar las mitigaciones correspondientes.</span>
                  </div>
                )
              ) : (
                /* No en fase de mitigación */
                isCase2EvidenceComplete ? (
                  <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: '#1e40af', fontSize: '0.8rem' }}>
                      <AlertTriangle size={14} color="#3b82f6" />
                      <span>⚠️ INFRACCIONES VERIFICADAS: Iniciar Fase de Mitigación</span>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0, lineHeight: '1.3' }}>
                      Has auditado y verificado todos los incumplimientos del Caso 2 en AelScan. Comienza la fase de mitigación interactiva para corregir los riesgos legales detectados.
                    </p>
                    <button
                      onClick={() => { setMitigationPhase(true); setActiveContact('javiera-dm'); playSound.success(gameState.soundEnabled); }}
                      className="retro-btn primary"
                      style={{ padding: '8px 14px', fontSize: '0.78rem', justifyContent: 'center', marginTop: '4px', background: '#10b981', borderColor: '#10b981' }}
                    >
                      Iniciar Fase de Mitigación Interactiva
                    </button>
                  </div>
                ) : (
                  <div className="chat-drag-guidance" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.72rem', color: '#64748b' }}>
                    <Clock size={12} />
                    <span>Arrastra las evidencias sospechosas resaltadas hacia los artículos de la ley en AelScan para documentar los hallazgos.</span>
                  </div>
                )
              )}
          </div>
        </div>

        {/* SIDE DRAWER: GROUP INFO (MEMBERS & FILES) */}
        <AnimatePresence>
          {isDrawerOpen && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: '260px',
                background: 'white',
                borderLeft: '1px solid #cbd5e1',
                boxShadow: '-4px 0 16px rgba(0,0,0,0.06)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Header */}
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e293b' }}>Información del Grupo</span>
                <button
                  onClick={() => { setIsDrawerOpen(false); playSound.click(gameState.soundEnabled); }}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ✕
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid #cbd5e1', background: '#f1f5f9' }}>
                <button
                  onClick={() => { setDrawerTab('members'); setSelectedMemberProfile(null); playSound.click(gameState.soundEnabled); }}
                  style={{ flex: 1, padding: '8px 2px', border: 'none', borderBottom: drawerTab === 'members' ? '2.5px solid #3b82f6' : '2.5px solid transparent', background: 'transparent', fontSize: '0.7rem', fontWeight: drawerTab === 'members' ? 700 : 500, color: drawerTab === 'members' ? '#3b82f6' : '#64748b', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}
                >
                  <Users size={11} /> Miembros
                </button>
                <button
                  onClick={() => { setDrawerTab('files'); setSelectedMemberProfile(null); playSound.click(gameState.soundEnabled); }}
                  style={{ flex: 1, padding: '8px 2px', border: 'none', borderBottom: drawerTab === 'files' ? '2.5px solid #3b82f6' : '2.5px solid transparent', background: 'transparent', fontSize: '0.7rem', fontWeight: drawerTab === 'files' ? 700 : 500, color: drawerTab === 'files' ? '#3b82f6' : '#64748b', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}
                >
                  <FileText size={11} /> Archivos
                </button>
              </div>

              {/* Content area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                
                {drawerTab === 'members' && !selectedMemberProfile && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {scenario2.members.map(member => {
                      const isActive = member.status === 'Activo';
                      
                      return (
                        <div
                          key={member.id}
                          onClick={() => { setSelectedMemberProfile(member); playSound.click(gameState.soundEnabled); }}
                          style={{ padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc' }}
                        >
                          <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: isActive ? '#d1fae5' : '#e2e8f0', color: isActive ? '#065f46' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.74rem', fontWeight: 'bold' }}>
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#1e293b' }}>{member.name}</div>
                            <div style={{ fontSize: '0.66rem', color: '#64748b' }}>{member.role}</div>
                          </div>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isActive ? '#10b981' : '#94a3b8' }} />
                        </div>
                      );
                    })}
                  </div>
                )}

                {drawerTab === 'members' && selectedMemberProfile && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                      onClick={() => { setSelectedMemberProfile(null); playSound.click(gameState.soundEnabled); }}
                      style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.7rem', cursor: 'pointer', alignSelf: 'flex-start', padding: 0 }}
                    >
                      ← Volver a la lista
                    </button>

                    <div style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#1e293b' }}>{selectedMemberProfile.name}</div>
                      
                      <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />

                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        <strong>Área:</strong> {selectedMemberProfile.role}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        <strong>Ingreso:</strong> {selectedMemberProfile.joinDate}
                      </div>
                      
                      {selectedMemberProfile.termDate && (
                        <div style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 700 }}>
                          <strong>Término laboral:</strong> {selectedMemberProfile.termDate}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                        <strong>Estado Ficha:</strong>
                        <span style={{ fontSize: '0.65rem', background: selectedMemberProfile.status === 'Activo' ? '#d1fae5' : '#f1f5f9', color: selectedMemberProfile.status === 'Activo' ? '#065f46' : '#475569', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                          {selectedMemberProfile.status}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', color: '#64748b' }}>
                        <strong>Estado Chat:</strong>
                        <span style={{ fontSize: '0.65rem', background: '#d1fae5', color: '#065f46', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                          {selectedMemberProfile.chatStatus}
                        </span>
                      </div>

                      {/* Profile evidences click collection / Drag and drop */}
                      {selectedMemberProfile.profileEvidenceId && (
                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          
                          {/* 1. Job profile status */}
                          <div
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, selectedMemberProfile.profileEvidenceId!)}
                            onDragEnd={endEvidenceDrag}
                            onClick={(e) => handleCollectEvidence(selectedMemberProfile.profileEvidenceId!, 'Ficha: Javiera Soto inactiva', e)}
                            data-rule-ids={getRuleTokens(CASE2_INFRACTION_RULES_BY_EVIDENCE[selectedMemberProfile.profileEvidenceId])}
                            className="retro-btn primary draggable-evidence"
                            style={{ width: '100%', padding: '6px', fontSize: '0.68rem', justifyContent: 'center', cursor: 'grab', background: isCase2EvidenceResolved(selectedMemberProfile.profileEvidenceId, gameState.evidenceFound) ? '#d1fae5' : undefined, color: isCase2EvidenceResolved(selectedMemberProfile.profileEvidenceId, gameState.evidenceFound) ? '#047857' : undefined }}
                          >
                            {isCase2EvidenceResolved(selectedMemberProfile.profileEvidenceId, gameState.evidenceFound) ? '✓ Evidencia resuelta' : '📌 Inactiva + acceso activo (Arrastra)'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {drawerTab === 'files' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: fileDeleted ? '#991b1b' : '#1e3a8a', fontWeight: 'bold', fontSize: '0.74rem', marginBottom: '6px', textDecoration: fileDeleted ? 'line-through' : 'none' }}>
                        <FileText size={14} />
                        <span>personal_sucursal_agosto.xlsx</span>
                      </div>
                      
                      {fileDeleted ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '6px', background: '#fee2e2', borderRadius: '6px', border: '1px solid #fca5a5', fontSize: '0.66rem', color: '#991b1b', fontWeight: 'bold', textAlign: 'center' }}>
                          ✅ PLANILLA RETIRADA · REVISIÓN DE PERMISOS SOLICITADA
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => { openWindow('spreadsheet'); playSound.click(gameState.soundEnabled); }}
                            className="retro-btn"
                            style={{ width: '100%', padding: '5px', fontSize: '0.68rem', justifyContent: 'center', marginBottom: '6px' }}
                          >
                            <FolderOpen size={10} /> Abrir Planilla
                          </button>

                          {mitigationPhase && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                              <div style={{ fontSize: '0.63rem', color: '#7f1d1d', lineHeight: 1.35 }}>
                                Mitigación 3/3: retira la copia del Chat y solicita revisar los permisos de la base de RRHH.
                              </div>
                              <button
                                onClick={handleDeleteFile}
                                className="retro-btn danger"
                                style={{ width: '100%', padding: '6px', fontSize: '0.68rem', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }}
                              >
                                <Trash2 size={12} />
                                <span>Retirar Copia y Solicitar Revisión</span>
                                <div style={{ position: 'absolute', top: -3, right: -3, width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MODAL DIALOG: MITIGACIÓN COMPLETADA */}
      <AnimatePresence>
        {showCompletionModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              style={{
                background: 'white',
                border: '2px solid #bbf7d0',
                borderRadius: '16px',
                padding: '24px',
                width: '400px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                textAlign: 'center'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#166534' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                  <ShieldCheck size={28} color="#22c55e" />
                </div>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '0.2px' }}>¡Mitigación Completada!</span>
              </div>
              
              <p style={{ fontSize: '0.78rem', color: '#4b5563', margin: 0, lineHeight: '1.5' }}>
                Has aplicado exitosamente las 3 medidas de mitigación para contener la brecha de privacidad:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', background: '#f9fafb', borderRadius: '10px', border: '1px solid #f3f4f6', textAlign: 'left', fontSize: '0.72rem', color: '#374151' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#22c55e' }}>✔</span>
                  <span>Javiera fue avisada y la revocación de acceso quedó solicitada.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#22c55e' }}>✔</span>
                  <span>Aviso formal de cumplimiento publicado en el canal común.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#22c55e' }}>✔</span>
                  <span>Copia retirada del Chat y revisión de permisos solicitada.</span>
                </div>
              </div>

              <button
                onClick={handleCloseCase2}
                className="retro-btn primary"
                style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: '0.8rem', background: '#10b981', borderColor: '#10b981', color: 'white', marginTop: '6px' }}
              >
                Cerrar Jornada y Guardar Bitácora (Día 2)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AelChatApp;
