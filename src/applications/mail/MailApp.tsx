import React from 'react';
import { useGameState } from '../../game/GameStateContext';
import { useWindowManager } from '../../game/WindowManagerContext';
import { scenario1 } from '../../content/scenario_1';
import { Mail, FileSpreadsheet } from 'lucide-react';
import { playSound } from '../../components/sound';
import { beginEvidenceDrag, endEvidenceDrag } from '../../components/evidenceDrag';
import { CASE1_INFRACTION_RULES_BY_ELEMENT, getRuleTokens } from '../../content/evidenceRules';
import { showAelScanRegulations } from '../../components/aelScanNavigation';
import ScheduledMailCase from './ScheduledMailCase';

export const MailApp: React.FC = () => {
  const { state: gameState, setSelectedAuditElement, makeDecision } = useGameState();
  const { openWindow } = useWindowManager();
  const [selectedMailId, setSelectedMailId] = React.useState<string>('email-hr-request');
  const [showReplyOptions, setShowReplyOptions] = React.useState(false);
  const replyPanelRef = React.useRef<HTMLDivElement>(null);
  const replySubmittingRef = React.useRef(false);

  const currentEmail = scenario1.emails.find(e => e.id === selectedMailId) || scenario1.emails[0];
  const isCcDiscovered = gameState.evidenceFound.includes('ev-cc-leak');
  const isCase1AuditComplete = gameState.currentDay === 1
    && scenario1.evidences.every(evidence => gameState.evidenceFound.includes(evidence.id));
  const storedReplyId = gameState.decisionsMade[scenario1.decision.id];
  const selectedReplyId = scenario1.decision.choices.some(choice => choice.id === storedReplyId)
    ? storedReplyId
    : undefined;

  React.useEffect(() => {
    if (isCase1AuditComplete && !selectedReplyId) {
      setShowReplyOptions(true);
    }
  }, [isCase1AuditComplete, selectedReplyId]);

  const revealReplyOptions = () => {
    setShowReplyOptions(true);
    playSound.chime(gameState.soundEnabled);
    requestAnimationFrame(() => replyPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }));
  };

  const handleReplyChoice = (choiceId: string) => {
    if (!isCase1AuditComplete || selectedReplyId || replySubmittingRef.current) return;
    const choice = scenario1.decision.choices.find(option => option.id === choiceId);
    if (!choice) return;

    replySubmittingRef.current = true;
    makeDecision(scenario1.decision.id, choice.id, choice.consequences.setFlags);
    playSound.chime(gameState.soundEnabled);
  };

  const handleMailElementClick = (elementId: string) => {
    if (gameState.currentDay !== 1) return; // Only selectable in Day 1 Case 1
    showAelScanRegulations();
    
    // Don't click if already found
    if (elementId === 'email-cc-header' && isCcDiscovered) return;

    const isSelected = gameState.selectedAuditElement?.elementId === elementId;
    if (isSelected) {
      setSelectedAuditElement(null);
    } else {
      setSelectedAuditElement({ sourceApp: 'mail', elementId });
    }
    playSound.click(gameState.soundEnabled);
  };

  const handleDragStart = (e: React.DragEvent<HTMLElement>, elementId: string, label: string) => {
    if (gameState.currentDay !== 1) return;
    e.dataTransfer.setData('text/plain', elementId);
    beginEvidenceDrag(e, label);
    setSelectedAuditElement({ sourceApp: 'mail', elementId });
    playSound.click(gameState.soundEnabled);
  };

  if (gameState.currentDay === 3) return <ScheduledMailCase />;

  return (
    <div className="ael-app mail-app" style={{ display: 'flex', height: '100%', width: '100%', background: '#f8fafc' }}>
      {/* Mail folder sidebar */}
      <div className="app-sidebar" style={{ width: '200px', borderRight: '1px solid #e2e8f0', background: '#f1f5f9', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div className="app-brandbar" style={{ padding: '12px 14px', background: '#0284c7', color: 'white', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail size={14} /> Bandeja de Entrada
        </div>
        {scenario1.emails.map(email => {
          const isSelected = email.id === selectedMailId;
          const isUnread = email.id === 'email-hr-request' && !gameState.decisionsMade['decision-hr-send'];
          
          return (
            <div
              key={email.id}
              className={`mail-list-item ${isSelected ? 'is-selected' : ''}`}
              onClick={() => { setSelectedMailId(email.id); playSound.click(gameState.soundEnabled); }}
              style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', cursor: 'pointer', background: isSelected ? '#eff6ff' : 'transparent', borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent', fontWeight: isUnread ? 700 : 400 }}>
              <div style={{ fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{email.sender.split('@')[0]}</span>
                <span style={{ color: '#94a3b8' }}>{email.dateStr.split(',')[1]}</span>
              </div>
              <div style={{ fontSize: '0.79rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px', color: '#334155' }}>{email.subject}</div>
            </div>
          );
        })}
      </div>

      {/* Reading pane */}
      <div className="app-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: 'white' }}>
        {/* Header */}
        <div className="mail-reading-header" style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.83rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#1e293b', marginBottom: '2px' }}>
            <span
              id="email-subject-header"
              style={{ display: 'inline-block' }}
            >
              {currentEmail.subject}
            </span>
          </div>
          
          <div style={{ color: '#64748b', fontSize: '0.79rem' }}>
            <strong>De:</strong>{' '}
            <span
              id="email-de-header"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {currentEmail.sender}
            </span>
          </div>

          <div style={{ color: '#64748b', fontSize: '0.79rem' }}>
            <strong>Para:</strong>{' '}
            <span
              id="email-para-header"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {currentEmail.recipient}
            </span>
          </div>

          {currentEmail.cc && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.79rem', color: '#64748b' }}>
              <strong>CC:</strong>
              {currentEmail.id === 'email-hr-request' && gameState.currentDay === 1 ? (
                <span
                  id="email-cc-header"
                  onClick={() => handleMailElementClick('email-cc-header')}
                  draggable={!isCcDiscovered}
                  onDragStart={(e) => handleDragStart(e, 'email-cc-header', 'Campo CC · destinatario externo')}
                  onDragEnd={endEvidenceDrag}
                  data-rule-ids={getRuleTokens(CASE1_INFRACTION_RULES_BY_ELEMENT['email-cc-header'])}
                  className={'selectable-hotspot draggable-evidence ' + (gameState.selectedAuditElement?.elementId === 'email-cc-header' ? 'selected' : '')}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    border: isCcDiscovered ? '2px solid #10b981' : undefined,
                    background: isCcDiscovered ? 'rgba(16,185,129,0.05)' : undefined,
                    color: isCcDiscovered ? '#065f46' : undefined,
                    fontWeight: isCcDiscovered ? 'bold' : 'normal',
                    padding: isCcDiscovered ? '2px 6px' : undefined,
                    borderRadius: isCcDiscovered ? '4px' : undefined,
                    cursor: isCcDiscovered ? 'default' : 'grab'
                  }}
                  title={isCcDiscovered ? 'Riesgo verificado' : undefined}
                >
                  {currentEmail.cc}
                  {isCcDiscovered && <span style={{ fontSize: '0.62rem', marginLeft: '6px', color: '#065f46', background: '#d1fae5', padding: '1px 4px', borderRadius: '4px' }}>✓ Infracción</span>}
                </span>
              ) : (
                <span style={{ fontFamily: 'var(--font-mono)', color: '#475569' }}>{currentEmail.cc}</span>
              )}
            </div>
          )}
        </div>

        {isCase1AuditComplete && !selectedReplyId && (
          <button
            type="button"
            onClick={revealReplyOptions}
            className="mail-reply-ready"
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 4,
              margin: '8px 12px 0',
              padding: '9px 12px',
              border: '1px solid #84cc16',
              borderRadius: '9px',
              background: 'linear-gradient(105deg, #ecfccb, #fef9c3)',
              color: '#365314',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 5px 16px rgba(132,204,22,0.2)',
            }}
          >
            ✉️ Auditoría completa · Responder el correo de Sofía
          </button>
        )}

        {/* Body */}
        <div className="mail-reading-body" style={{ flex: 1, whiteSpace: 'pre-line', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', lineHeight: '1.7', color: '#334155', padding: '16px' }}>
          <p>{currentEmail.body}</p>

          {/* Attachment card */}
          {currentEmail.attachment && (
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                Archivos Adjuntos:
              </span>
              <div
                onClick={(event) => { event.stopPropagation(); openWindow('spreadsheet'); playSound.click(gameState.soundEnabled); }}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', maxWidth: '320px', transition: 'border 0.2s' }}
                className="hover-card mail-attachment-card"
              >
                <div style={{ color: '#10b981' }}>
                  <FileSpreadsheet size={24} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e3a8a' }}>{currentEmail.attachment.name}</span>
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>{currentEmail.attachment.type}</span>
                </div>
              </div>
            </div>
          )}

          {isCase1AuditComplete && (
            <div
              ref={replyPanelRef}
              className="case-action-panel"
              style={{
                marginTop: '24px',
                padding: '14px',
                border: '2px solid #a3e635',
                borderRadius: '12px',
                background: 'linear-gradient(145deg, #f7fee7, #fefce8)',
                boxShadow: '0 10px 28px rgba(132,204,22,0.18)',
                whiteSpace: 'normal',
              }}
            >
              <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#4d7c0f', letterSpacing: '0.7px', textTransform: 'uppercase' }}>
                Fase final · Respuesta al correo
              </div>
              <div style={{ marginTop: '4px', fontSize: '0.88rem', fontWeight: 800, color: '#1e293b' }}>
                {selectedReplyId ? 'Respuesta enviada' : scenario1.decision.prompt}
              </div>

              {selectedReplyId ? (
                <div style={{ marginTop: '9px', padding: '10px 12px', borderRadius: '8px', background: '#dcfce7', color: '#166534', fontSize: '0.78rem', fontWeight: 700 }}>
                  ✓ Tu acción fue registrada. Revisa la evaluación para continuar.
                </div>
              ) : showReplyOptions ? (
                <div style={{ display: 'grid', gap: '8px', marginTop: '11px' }}>
                  {scenario1.decision.choices.map((choice, index) => (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => handleReplyChoice(choice.id)}
                      className="mail-reply-choice"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '9px',
                        background: 'rgba(255,255,255,0.9)',
                        color: '#334155',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '0.76rem',
                        lineHeight: 1.4,
                        fontWeight: 650,
                      }}
                    >
                      <span style={{ color: '#65a30d', fontWeight: 900, marginRight: '6px' }}>{index + 1}.</span>
                      {choice.text}
                    </button>
                  ))}
                </div>
              ) : (
                <button type="button" className="retro-btn primary" onClick={revealReplyOptions} style={{ marginTop: '10px' }}>
                  Ver alternativas de respuesta
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MailApp;
