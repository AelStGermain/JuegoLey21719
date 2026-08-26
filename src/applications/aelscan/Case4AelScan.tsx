import React from 'react';
import { Check, EyeOff, FileSpreadsheet, Mail, RotateCcw, ShieldAlert, Trash2, UserRoundSearch } from 'lucide-react';
import { getCase4CorrectedCount } from '../../content/scenario_4';
import { useCase4 } from '../../game/Case4Context';
import { useWindowManager } from '../../game/WindowManagerContext';
import './Case4AelScan.css';

export const Case4AelScan: React.FC = () => {
  const { openWindow } = useWindowManager();
  const {
    state,
    protectAudience,
    removeAttachment,
    selectArtifact,
    resumeReview,
    retryCase4,
  } = useCase4();
  const correctedCount = getCase4CorrectedCount(state.recipients, state.attachments);
  const payroll = state.attachments.find(attachment => attachment.kind === 'payroll' && attachment.active);
  const evaluation = state.evaluation;

  const returnToMail = () => {
    selectArtifact(null);
    openWindow('mail');
    if (state.timerStatus === 'paused' && state.screen === 'review') resumeReview();
  };

  const renderContext = () => {
    if (state.selectedArtifact === 'suspicious-recipient') {
      return (
        <section className="case4-scan__context">
          <span className="case4-scan__context-icon"><UserRoundSearch size={22} /></span>
          <small>AELSCAN DICE</small>
          <h2>Esa dirección no me resulta familiar.</h2>
          <p>Mira con atención el dominio antes de decidir.</p>
          <button type="button" onClick={returnToMail}><Mail size={13} /> Volver al correo</button>
        </section>
      );
    }

    if (state.selectedArtifact === 'audience-privacy') {
      return (
        <section className="case4-scan__context">
          <span className="case4-scan__context-icon"><EyeOff size={22} /></span>
          <small>AELSCAN DICE</small>
          <h2>Hmm… 238 personas recibirán este correo.</h2>
          <p>¿Todos necesitan ver las direcciones de los demás?</p>
          <div>
            <button type="button" onClick={() => { protectAudience(); returnToMail(); }}><EyeOff size={13} /> Ocultar direcciones</button>
            <button type="button" onClick={returnToMail}>Volver</button>
          </div>
        </section>
      );
    }

    if (state.selectedArtifact === 'payroll') {
      return (
        <section className="case4-scan__context">
          <span className="case4-scan__context-icon"><FileSpreadsheet size={22} /></span>
          <small>AELSCAN DICE</small>
          <h2>Ese archivo contiene bastante más información que el mensaje.</h2>
          <p>El correo solo informa una fecha. ¿Hace falta compartir sueldos y cuentas bancarias?</p>
          <div>
            {payroll && <button type="button" onClick={() => { removeAttachment(payroll.id); returnToMail(); }}><Trash2 size={13} /> Retirar adjunto</button>}
            <button type="button" onClick={returnToMail}>Volver</button>
          </div>
          {state.timerStatus === 'paused' && <em>Revisión pausada mientras lees.</em>}
        </section>
      );
    }

    return null;
  };

  const contextual = renderContext();

  if (state.screen === 'result' && evaluation && evaluation.level !== 'perfect') {
    return (
      <div className="ael-app aelscan-app case4-scan">
        <header className="case4-scan__header"><span><ShieldAlert size={17} /></span><div><strong>AelScan</strong><small>Revisión rápida</small></div></header>
        <section className="case4-scan__error">
          <span>¿QUÉ OCURRIÓ?</span>
          <h2>El correo salió con algo pendiente.</h2>
          {evaluation.checks.filter(check => !check.passed).map(check => (
            <div key={check.id}><b>{check.pillar}</b><p>{check.detail}</p></div>
          ))}
          <button type="button" onClick={() => { retryCase4(); openWindow('mail'); }}><RotateCcw size={13} /> Reintentar</button>
        </section>
      </div>
    );
  }

  return (
    <div className="ael-app aelscan-app case4-scan">
      <header className="case4-scan__header">
        <span><ShieldAlert size={17} /></span>
        <div><strong>AelScan</strong><small>Asistente de revisión</small></div>
        <b>{correctedCount}/3</b>
      </header>
      <div className="case4-scan__progress"><span style={{ width: `${correctedCount / 3 * 100}%` }} /></div>

      {contextual ?? (
        <section className="case4-scan__compact">
          <small>REVISIÓN RÁPIDA</small>
          <h2>{correctedCount === 3 ? 'Listo para enviar' : '3 cosas por revisar'}</h2>
          <p>{correctedCount === 3 ? 'Bien. El correo conserva solo lo necesario.' : 'Mira el correo y abre lo que te parezca extraño.'}</p>
          <div className="case4-scan__checklist">
            <div className={evaluation?.checks[0].passed || !state.recipients.some(recipient => recipient.active && recipient.kind === 'unknown-domain') ? 'is-done' : ''}>
              <span>{!state.recipients.some(recipient => recipient.active && recipient.kind === 'unknown-domain') ? <Check size={13} /> : null}</span>
              <p><strong>¿A quién?</strong>Revisa los destinatarios.</p>
            </div>
            <div className={state.recipients.find(recipient => recipient.id === 'staff-list')?.bucket === 'bcc' ? 'is-done' : ''}>
              <span>{state.recipients.find(recipient => recipient.id === 'staff-list')?.bucket === 'bcc' ? <Check size={13} /> : null}</span>
              <p><strong>¿Todos deben verlo?</strong>Protege sus direcciones.</p>
            </div>
            <div className={!payroll ? 'is-done' : ''}>
              <span>{!payroll ? <Check size={13} /> : null}</span>
              <p><strong>¿Qué se adjunta?</strong>Abre los archivos.</p>
            </div>
          </div>
          {correctedCount === 3 && <div className="case4-scan__ready"><Check size={18} /> <span><strong>3 riesgos corregidos</strong>Vuelve a AelMail para enviar.</span></div>}
        </section>
      )}
    </div>
  );
};

export default Case4AelScan;
