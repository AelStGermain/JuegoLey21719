import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  Clock3,
  EyeOff,
  FileSpreadsheet,
  FileText,
  MailCheck,
  Pause,
  Play,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { useWindowManager } from '../../game/WindowManagerContext';
import { useCase3 } from '../../game/Case3Context';
import { getCase3CorrectedCount, scenario3, type Case3Attachment, type Case3Recipient } from '../../content/scenario_3';
import './ScheduledMailCase.css';

const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

const ProgressDots: React.FC<{ count: number }> = ({ count }) => (
  <div className="case3-progress-dots" aria-label={`${count} de 3 riesgos corregidos`}>
    {[0, 1, 2].map(index => <span key={index} className={index < count ? 'is-done' : ''}>{index < count && <Check size={13} />}</span>)}
  </div>
);

const RecipientChip: React.FC<{ recipient: Case3Recipient; selected: boolean; onClick: () => void }> = ({ recipient, selected, onClick }) => (
  <motion.button
    layout
    initial={{ opacity: 0, scale: .82, x: 18 }}
    animate={{ opacity: 1, scale: 1, x: 0 }}
    exit={{ opacity: 0, scale: .48, x: 52, rotate: 4 }}
    transition={{ duration: .28, ease: 'easeOut' }}
    type="button"
    className={`case3-recipient-chip ${selected ? 'is-selected' : ''}`}
    onClick={onClick}
  >
    {recipient.name}
  </motion.button>
);

export const ScheduledMailCase: React.FC = () => {
  const { openWindow } = useWindowManager();
  const {
    state,
    challengeAvailable,
    startReview,
    startChallenge,
    togglePause,
    pauseForDeepReview,
    selectArtifact,
    removeRecipient,
    protectAudience,
    openPreflight,
    closePreflight,
    confirmSend,
    finishScenario,
    retryCase3,
  } = useCase3();
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<Case3Attachment | null>(null);

  const activeRecipients = useMemo(() => state.recipients.filter(recipient => recipient.active), [state.recipients]);
  const activeAttachments = useMemo(() => state.attachments.filter(attachment => attachment.active), [state.attachments]);
  const staff = state.recipients.find(recipient => recipient.id === 'staff-list');
  const copiedRecipients = activeRecipients.filter(recipient => recipient.id !== 'staff-list');
  const selectedRecipient = activeRecipients.find(recipient => recipient.id === selectedRecipientId) ?? null;
  const correctedCount = getCase3CorrectedCount(state.recipients, state.attachments);
  const audienceProtected = staff?.bucket === 'bcc';

  const inspectRecipient = (recipient: Case3Recipient) => {
    setSelectedRecipientId(recipient.id);
    if (recipient.id === 'staff-list') selectArtifact('audience-privacy');
    else if (recipient.kind === 'unknown-domain') selectArtifact('suspicious-recipient');
    else selectArtifact(null);
  };

  const closeRecipient = () => {
    setSelectedRecipientId(null);
    selectArtifact(null);
  };

  const openAttachment = (attachment: Case3Attachment) => {
    if (attachment.type === 'spreadsheet') {
      selectArtifact('payroll');
      pauseForDeepReview();
      openWindow('spreadsheet');
      return;
    }
    setPreviewAttachment(attachment);
  };

  const renderTimer = () => (
    <div className={`case3-timer ${state.secondsRemaining <= 10 && state.timerStatus === 'running' ? 'is-urgent' : ''}`}>
      <span>{state.timerStatus === 'initial' ? 'EN ESPERA DE REVISIÓN' : state.timerStatus === 'paused' ? 'REVISIÓN PAUSADA' : state.challengeMode ? 'MODO DESAFÍO' : 'TIEMPO DE REVISIÓN'}</span>
      <strong>{formatTime(state.secondsRemaining)}</strong>
      {state.timerStatus === 'initial' ? (
        <div className="case3-timer__starts">
          <button type="button" onClick={startReview}><Play size={13} /> Iniciar revisión</button>
          {challengeAvailable && <button type="button" className="is-challenge" onClick={startChallenge}>Desafío · 00:45</button>}
        </div>
      ) : (
        <button type="button" onClick={togglePause}><>{state.timerStatus === 'running' ? <Pause size={13} /> : <Play size={13} />}{state.timerStatus === 'running' ? ' Pausar' : ' Reanudar'}</></button>
      )}
    </div>
  );

  const renderReview = () => (
    <div className="case3-mail__review">
      <header className="case3-mail__mission">
        <div className="case3-mail__mission-copy">
          <span>ANTES DE ENVIAR</span>
          <strong>{scenario3.alertTitle}</strong>
          <div><small>Encuentra 3 problemas</small><ProgressDots count={correctedCount} /></div>
        </div>
        {renderTimer()}
      </header>

      <AnimatePresence>
        {state.activityNotice && (
          <motion.div className="case3-mail__activity" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {state.activityNotice}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="case3-compose">
        <section className="case3-compose__headers">
          <div className="case3-compose__sender"><b>De</b><span>{scenario3.sender}</span></div>
          <div className="case3-recipient-row">
            <b>Para</b>
            <AnimatePresence mode="wait">
              <motion.button
                key={audienceProtected ? 'protected' : 'visible'}
                type="button"
                className={`case3-staff-chip ${audienceProtected ? 'is-protected' : ''}`}
                initial={{ opacity: 0, scale: .75 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: .62 }}
                onClick={() => staff && inspectRecipient(staff)}
              >
                {audienceProtected ? <><EyeOff size={14} /> 238 destinatarios protegidos</> : <><span>Personal MedVibe</span><strong>238 personas</strong></>}
              </motion.button>
            </AnimatePresence>
          </div>
          <div className="case3-recipient-row">
            <b>CC</b>
            <div className="case3-recipient-row__chips">
              <AnimatePresence mode="popLayout">
                {copiedRecipients.map(recipient => (
                  <RecipientChip key={recipient.id} recipient={recipient} selected={selectedRecipientId === recipient.id} onClick={() => inspectRecipient(recipient)} />
                ))}
              </AnimatePresence>
            </div>
          </div>
          <div className="case3-compose__subject"><b>Asunto</b><span>{scenario3.subject}</span></div>
        </section>

        <AnimatePresence mode="wait">
          {selectedRecipient && (
            <motion.aside className="case3-recipient-popover" initial={{ opacity: 0, y: -8, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: .97 }}>
              {selectedRecipient.id === 'staff-list' ? (
                <>
                  <strong>238 personas recibirán este correo.</strong>
                  <p>¿Podrán ver las direcciones de los demás?</p>
                  <div>
                    <button type="button" onClick={closeRecipient}>Sí, mostrar</button>
                    <button type="button" onClick={() => { protectAudience(); setSelectedRecipientId(null); }}><EyeOff size={13} /> No, ocultar</button>
                  </div>
                </>
              ) : (
                <>
                  <strong>{selectedRecipient.name}</strong>
                  <code>{selectedRecipient.email}</code>
                  <span className={selectedRecipient.kind === 'unknown-domain' ? 'is-unknown' : 'is-known'}>{selectedRecipient.note}</span>
                  <div>
                    {selectedRecipient.kind === 'unknown-domain'
                      ? <button type="button" onClick={() => { removeRecipient(selectedRecipient.id); setSelectedRecipientId(null); }}><Trash2 size={13} /> Quitar</button>
                      : <button type="button" onClick={closeRecipient}>Volver</button>}
                  </div>
                </>
              )}
              <button type="button" className="case3-recipient-popover__close" aria-label="Cerrar" onClick={closeRecipient}><X size={13} /></button>
            </motion.aside>
          )}
        </AnimatePresence>

        <section className="case3-compose__body"><p>{scenario3.body}</p></section>

        <section className="case3-attachments">
          <div className="case3-attachments__heading"><span>Adjuntos</span><b>{activeAttachments.length}</b></div>
          <div className="case3-attachments__list">
            <AnimatePresence mode="popLayout">
              {activeAttachments.map(attachment => (
                <motion.button
                  layout
                  key={attachment.id}
                  type="button"
                  className={`case3-attachment case3-attachment--${attachment.type}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 70, rotate: 5, scale: .72 }}
                  transition={{ duration: .38 }}
                  onClick={(event) => { event.stopPropagation(); openAttachment(attachment); }}
                >
                  <span>{attachment.type === 'spreadsheet' ? <FileSpreadsheet size={23} /> : <FileText size={23} />}</span>
                  <div><strong>{attachment.name}</strong><small>{attachment.summary}</small></div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </main>

      <footer className={`case3-mail__footer ${correctedCount === 3 ? 'is-ready' : ''}`}>
        <div><span>RIESGOS CORREGIDOS</span><ProgressDots count={correctedCount} /></div>
        <button type="button" onClick={openPreflight}><Send size={15} /> {correctedCount === 3 ? 'Enviar correo' : 'Enviar'}</button>
      </footer>
    </div>
  );

  const renderPreflight = () => {
    const ready = correctedCount === 3;
    return (
      <div className={`case3-preflight ${ready ? 'is-ready' : ''}`}>
        <div className="case3-preflight__stamp">{ready ? <MailCheck size={27} /> : <Clock3 size={27} />}</div>
        <span>{ready ? 'LISTO PARA ENVIAR' : 'AELSCAN'}</span>
        <h2>{ready ? 'Los 3 riesgos fueron corregidos.' : 'Todavía parece quedar algo por revisar.'}</h2>
        <ProgressDots count={correctedCount} />
        <p>{ready ? 'El correo conserva el aviso correcto y la información necesaria.' : `${correctedCount} de 3 problemas corregidos. Puedes volver o enviar igualmente.`}</p>
        <div className="case3-preflight__actions">
          <button type="button" onClick={closePreflight}>Volver</button>
          <button type="button" onClick={confirmSend}><Send size={15} /> {ready ? 'Enviar correo' : 'Enviar igual'}</button>
        </div>
      </div>
    );
  };

  const renderResult = () => {
    const evaluation = state.evaluation;
    if (!evaluation) return null;
    return (
      <div className={`case3-result case3-result--${evaluation.level}`}>
        <header className="case3-result__hero">
          {evaluation.level === 'perfect' ? <MailCheck size={30} /> : <Clock3 size={30} />}
          <span>{state.sentAutomatically ? 'EL TIEMPO TERMINÓ' : 'ENVÍO FINALIZADO'}</span>
          <h2>{evaluation.title}</h2>
          <p>{evaluation.summary}</p>
        </header>

        {evaluation.level !== 'perfect' && (
          <section className="case3-consequences">
            <strong>MENSAJES RECIBIDOS DESPUÉS DEL ENVÍO</strong>
            {evaluation.checks.filter(check => !check.passed).map(check => (
              <article key={check.id}>
                <span>🔔 Nuevo correo</span>
                <p>{check.id === 'recipient'
                  ? 'Hola. Creo que este mensaje no era para mí. Recibí información de varias personas.'
                  : check.id === 'privacy'
                    ? '¿Por qué puedo ver las direcciones de todos los demás trabajadores?'
                    : '¿Era necesario que todos recibiéramos la nómina con los sueldos?'}</p>
              </article>
            ))}
          </section>
        )}

        <section className="case3-result__lesson">
          <span>LO QUE ACABAS DE HACER</span>
          {evaluation.checks.map(check => (
            <div key={check.id} className={check.passed ? 'is-passed' : 'is-missed'}>
              <b>{check.passed ? <Check size={13} /> : <X size={13} />}</b>
              <p><strong>{check.pillar}</strong>{check.detail}</p>
            </div>
          ))}
        </section>

        <blockquote>¿Quién lo recibirá? · ¿Qué estoy compartiendo? · ¿Realmente hace falta?</blockquote>
        <div className="case3-result__actions">
          {evaluation.level !== 'perfect' && <button type="button" onClick={retryCase3}>Reintentar</button>}
          <button type="button" onClick={finishScenario}>Continuar</button>
        </div>
      </div>
    );
  };

  return (
    <div className="ael-app mail-app case3-mail">
      {state.screen === 'review' && renderReview()}
      {state.screen === 'preflight' && renderPreflight()}
      {state.screen === 'result' && renderResult()}

      <AnimatePresence>
        {previewAttachment && (
          <motion.div className="case3-pdf-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewAttachment(null)}>
            <motion.article initial={{ y: 22, rotate: -1 }} animate={{ y: 0, rotate: .3 }} exit={{ y: 22 }} onClick={event => event.stopPropagation()}>
              <button type="button" aria-label="Cerrar documento" onClick={() => setPreviewAttachment(null)}><X size={15} /></button>
              <span>AVISO GENERAL</span>
              <h2>{previewAttachment.name}</h2>
              <pre>{scenario3.safePdfBody}</pre>
              <footer>MedVibe · Recursos Humanos</footer>
            </motion.article>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScheduledMailCase;
