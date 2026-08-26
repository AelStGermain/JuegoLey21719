import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileCheck2,
  Send,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { useGameState } from '../../game/GameStateContext';
import { playSound } from '../../components/sound';
import {
  CASE3_OBJECTED_FIELD_IDS,
  CASE3_RELIGION_FINDING_ID,
  CASE3_REVIEW_FIELD_ID,
  scenario3,
  type Case3FormField,
} from '../../content/scenario_3';
import './AelFormsApp.css';

type FormMode = 'editor' | 'preview';

const PREVIEW_ADMINISTRATIVE_VALUES: Record<string, string> = {
  name: 'Daniela Rojas',
  birthdate: '14/08/1992',
  emergency: 'Patricio Rojas · +56 9 5555 0182',
  address: 'Av. Los Aromos 1840, Santiago',
};

export const AelFormsApp: React.FC = () => {
  const { state: gameState, foundEvidence, makeDecision, setStatus } = useGameState();
  const [mode, setMode] = useState<FormMode>('editor');
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const [removedFieldIds, setRemovedFieldIds] = useState<string[]>([]);
  const [optionalFieldIds, setOptionalFieldIds] = useState<string[]>([]);
  const [inspectedFieldIds, setInspectedFieldIds] = useState<string[]>([]);
  const [previewValidated, setPreviewValidated] = useState(false);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const [reviewReady, setReviewReady] = useState(false);
  const [reviewIssues, setReviewIssues] = useState<string[]>([]);
  const finishStartedRef = React.useRef(false);

  useEffect(() => {
    if (reviewIssues.length === 0) return;

    const timeoutId = window.setTimeout(() => setReviewIssues([]), 8000);
    return () => window.clearTimeout(timeoutId);
  }, [reviewIssues]);

  const religionRemoved = removedFieldIds.includes('religion');
  const medicationRemoved = removedFieldIds.includes('medication');
  const instagramRemoved = removedFieldIds.includes('instagram');
  const dietOptional = optionalFieldIds.includes('diet');
  const correctionsComplete = religionRemoved
    && medicationRemoved
    && instagramRemoved
    && dietOptional;
  const visibleFields = useMemo(
    () => scenario3.fields.filter(field => !removedFieldIds.includes(field.id)),
    [removedFieldIds],
  );
  const inspectedObjectedFieldCount = CASE3_OBJECTED_FIELD_IDS.filter(id => inspectedFieldIds.includes(id)).length;
  const workflowSteps = [
    { label: 'Revisa las preguntas objetables', done: inspectedObjectedFieldCount === CASE3_OBJECTED_FIELD_IDS.length },
    { label: 'Corrige las relaciones que no estén justificadas', done: correctionsComplete },
    { label: 'Comprueba la experiencia del trabajador', done: previewValidated },
    { label: 'Envía el formulario a revisión', done: reviewReady },
  ];
  const completedWorkflowSteps = workflowSteps.filter(step => step.done).length;

  const openPreview = () => {
    setMode('preview');
    setPreviewMessage(null);
    setReviewIssues([]);
    playSound.click(gameState.soundEnabled);
  };

  const continueEditing = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    setInspectedFieldIds(ids => ids.includes(fieldId) ? ids : [...ids, fieldId]);
    setReviewIssues([]);
  };

  const applyCorrection = (field: Case3FormField) => {
    if (!field.objection) return;

    if (field.objection.action === 'remove') {
      setRemovedFieldIds(ids => ids.includes(field.id) ? ids : [...ids, field.id]);
      setSelectedFieldId('');
    } else {
      setOptionalFieldIds(ids => ids.includes(field.id) ? ids : [...ids, field.id]);
    }
    if (field.id === CASE3_REVIEW_FIELD_ID && !gameState.evidenceFound.includes(CASE3_RELIGION_FINDING_ID)) {
      foundEvidence(CASE3_RELIGION_FINDING_ID);
    }
    setReviewReady(false);
    setReviewIssues([]);
    setPreviewValidated(false);
    playSound.success(gameState.soundEnabled);
  };

  const testPreviewSubmission = () => {
    const blockingFields = visibleFields.filter(field => (
      ['religion', 'diet'].includes(field.id) && field.required && !optionalFieldIds.includes(field.id)
    ));

    if (blockingFields.length > 0) {
      setPreviewValidated(false);
      setPreviewMessage(`El formulario todavía exige completar: ${blockingFields.slice(0, 2).map(field => field.label).join(' y ')}${blockingFields.length > 2 ? '…' : '.'}`);
      playSound.warning(gameState.soundEnabled);
      return;
    }

    setPreviewMessage('La persona puede enviar el formulario sin completar los campos voluntarios.');
    setPreviewValidated(true);
    playSound.success(gameState.soundEnabled);
  };

  const evaluateDraft = () => {
    const issues: string[] = [];
    if (!religionRemoved) issues.push('Religión continúa en el formulario aunque no sea necesaria para organizar actividades generales.');
    if (!medicationRemoved) issues.push('Medicamentos de uso permanente todavía solicita información excesiva.');
    if (!instagramRemoved) issues.push('Instagram continúa sin una finalidad definida.');
    if (!dietOptional) issues.push('Preferencia alimentaria debe ser voluntaria porque depende de participar en actividades.');
    if (!previewValidated) issues.push('La experiencia del trabajador todavía no fue comprobada con un envío de prueba en Preview.');

    setReviewIssues(issues);
    setReviewReady(issues.length === 0);
    playSound[issues.length === 0 ? 'success' : 'warning'](gameState.soundEnabled);
  };

  const finishSlice = () => {
    if (!reviewReady || gameState.workdayStatus !== 'active' || finishStartedRef.current) return;
    finishStartedRef.current = true;
    makeDecision('decision-form-2026', 'vertical-slice-approved', {
      case3Outcome: 'slice_success',
      case3ReligionRemoved: true,
      case3MedicationRemoved: true,
      case3UndefinedFieldRemoved: true,
      case3VoluntaryFieldConfigured: true,
      case3PreviewChecked: true,
    });
    setStatus('transitioning');
    playSound.chime(gameState.soundEnabled);
  };

  return (
    <div className="forms-app">
      <header className="forms-app__bar">
        <div className="forms-app__identity">
          <div className="forms-app__brand"><ClipboardCheck size={17} /> AelForms</div>
          <div className="forms-app__filename">Actualización de Datos y Bienestar 2026 <span>· Guardado</span></div>
        </div>
        <div className="forms-app__modes">
          <button className={mode === 'editor' ? 'is-active' : ''} onClick={() => { setMode('editor'); setReviewIssues([]); }}><Settings2 size={13} /> Preguntas</button>
          <button className={mode === 'preview' ? 'is-active' : ''} onClick={openPreview}><Eye size={13} /> Vista previa</button>
        </div>
      </header>

      {mode === 'editor' ? (
        <div className="forms-app__workspace">
          <aside className="forms-request">
            <div className="forms-request__label">SOLICITUD · RRHH</div>
            <strong>Revisión antes de publicar</strong>
            <p>{scenario3.request}</p>
            <div className="forms-progress">
              <div className="forms-progress__heading">
                <strong>Revisión del formulario</strong>
                <span>{completedWorkflowSteps}/{workflowSteps.length}</span>
              </div>
              <div className="forms-progress__bar"><span style={{ width: `${(completedWorkflowSteps / workflowSteps.length) * 100}%` }} /></div>
              {workflowSteps.map((step, index) => (
                <div key={step.label} className={`forms-progress__step ${step.done ? 'is-done' : ''}`}>
                  <span>{step.done ? '✓' : index + 1}</span>
                  {step.label}
                </div>
              ))}
            </div>
          </aside>

          <main className="forms-editor">
            <div className="forms-editor__toolbar">
              <div>
                <span className="forms-editor__status">BORRADOR</span>
                <span className="forms-editor__save">Edita las preguntas antes de publicar</span>
              </div>
            </div>

            <section className="form-canvas">
              <div className="form-title-card">
                <div className="form-title-card__accent" />
                <h1>{scenario3.title}</h1>
                <p>{scenario3.description}</p>
                <div
                  className="form-purpose"
                >
                  <div><strong>Cómo revisar este borrador</strong><span>{scenario3.purpose}</span></div>
                  <span className="form-purpose__tag">Dato + finalidad</span>
                </div>
              </div>

              <div className="form-fields">
                <AnimatePresence initial={false}>
                  {visibleFields.map(field => {
                    const isOptional = optionalFieldIds.includes(field.id);
                    const isSelected = selectedFieldId === field.id;
                    const isResolved = field.objection?.action === 'make_optional' && isOptional;
                    const typeLabel = field.type === 'textarea'
                      ? 'Párrafo'
                      : field.type === 'select'
                        ? 'Lista desplegable'
                        : field.type === 'date'
                          ? 'Fecha'
                          : 'Respuesta corta';
                    return (
                      <motion.article
                        layout
                        key={field.id}
                        className={`form-question-card ${isSelected ? 'is-selected' : ''} ${isResolved ? 'is-resolved' : ''}`}
                        onClick={() => continueEditing(field.id)}
                        exit={{ height: 0, opacity: 0, x: -45, marginBottom: 0 }}
                        transition={{ duration: 0.28 }}
                      >
                        <span className="form-question-card__handle" aria-hidden="true">•••</span>
                        <div className="form-question-card__top">
                          <div className="form-question-card__title">{field.label}{!isOptional && <b>*</b>}{isOptional && <em>Voluntaria</em>}</div>
                          <div className="form-question-card__type">{typeLabel} <span>⌄</span></div>
                        </div>
                        <div className={`form-answer-sample ${field.type === 'textarea' ? 'is-long' : ''}`}>
                          {field.type === 'select' ? 'Elige una opción' : field.placeholder || typeLabel}
                        </div>
                        <div className={`form-question-card__purpose ${field.purpose === 'Sin finalidad definida' ? 'is-undefined' : ''}`}>
                          <span>Finalidad:</span> {field.purpose}
                        </div>

                        {isSelected && (
                          <div className="form-question-inspector" onClick={event => event.stopPropagation()}>
                            <div className="form-why-heading">
                              <div><strong>REVISIÓN DE LA PREGUNTA</strong><span>Comprueba si requiere una corrección de protección de datos.</span></div>
                              <span className="form-why-heading__pillar">LEY 21.719</span>
                            </div>

                            <div className="form-assigned-purpose">
                              <span>FINALIDAD ASIGNADA POR RRHH</span>
                              <strong>{field.purpose}</strong>
                            </div>

                            {field.objection ? (
                              isResolved ? (
                                <div className="form-correction-resolved" role="status">
                                  <ShieldCheck size={18} />
                                  <div><strong>Corrección aplicada</strong><span>La pregunta ahora es voluntaria y mantiene una finalidad concreta.</span></div>
                                </div>
                              ) : (
                                <div className="form-law-objection">
                                  <div className="form-law-objection__heading">
                                    <ShieldAlert size={18} />
                                    <div><span>PILAR COMPROMETIDO</span><strong>{field.objection.pillar}</strong></div>
                                  </div>
                                  <strong>{field.objection.title}</strong>
                                  <p>{field.objection.reason}</p>
                                  <button className="form-correction-choice" onClick={() => applyCorrection(field)}>
                                    {field.objection.action === 'remove' ? <Trash2 size={15} /> : <ShieldCheck size={15} />}
                                    <span><strong>{field.objection.actionLabel}</strong><small>Pilar: {field.objection.pillar}</small></span>
                                  </button>
                                </div>
                              )
                            ) : (
                              <div className="form-field-ok">
                                <ShieldCheck size={18} />
                                <div>
                                  <strong>Sin cambios requeridos</strong>
                                  <span>{field.existingAdministrativeRecord
                                    ? 'Este dato ya forma parte del registro administrativo de la empresa y se mantiene para esa misma gestión.'
                                    : 'La pregunta tiene una finalidad concreta y proporcional.'}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.article>
                    );
                  })}
                </AnimatePresence>
              </div>

              <div className="form-consent-card">
                <span className="form-consent__checkbox" />
                <div><strong>Consentimiento</strong><span>Autorizo el uso de los datos para fines administrativos, beneficios y actividades internas.</span></div>
              </div>
            </section>

            <footer className="forms-editor__footer">
              <span>Selecciona una pregunta para editar sus opciones.</span>
              <button className="forms-review-button" onClick={evaluateDraft}><Send size={14} /> Enviar borrador a revisión</button>
            </footer>

            {reviewIssues.length > 0 && (
              <div className="forms-report forms-report--needs-work" role="status" aria-live="polite">
                <div className="forms-report__heading">
                  <strong>FORMULARIO REQUIERE REVISIÓN</strong>
                  <button type="button" onClick={() => setReviewIssues([])} aria-label="Cerrar aviso"><X size={14} /></button>
                </div>
                <span>Continúa editando; puedes volver a enviarlo cuando completes estos puntos:</span>
                {reviewIssues.map(issue => <span key={issue}>• {issue}</span>)}
              </div>
            )}
            {reviewReady && (
              <div className="forms-report forms-report--ready">
                <FileCheck2 size={20} />
                <div><strong>FORMULARIO APROBADO</strong><span>Las preguntas objetables fueron corregidas y la voluntariedad fue comprobada.</span></div>
                <button onClick={finishSlice} disabled={finishStartedRef.current}>Entregar versión corregida</button>
              </div>
            )}
          </main>
        </div>
      ) : (
        <div className="forms-preview">
          <div className="forms-preview__top">
            <div><strong>Vista del trabajador</strong><span>Así se comportará el formulario publicado.</span></div>
            <button onClick={() => setMode('editor')}><Settings2 size={13} /> Volver al editor</button>
          </div>
          <div className="forms-preview__paper">
            <h1>{scenario3.title}</h1>
            <p>{scenario3.description}</p>
            <div className="forms-preview__test-note">Prueba: los datos administrativos ya están completos; intenta omitir los campos de actividades.</div>
            <div className="forms-preview__fields">
              {visibleFields.map(field => {
                const isOptional = optionalFieldIds.includes(field.id);
                return (
                  <label key={field.id}>
                    <span>{field.label} {!isOptional && <b>*</b>} {isOptional && <em>Voluntaria</em>}</span>
                    {field.type === 'textarea'
                      ? <textarea value={PREVIEW_ADMINISTRATIVE_VALUES[field.id] ?? ''} readOnly />
                      : <input value={PREVIEW_ADMINISTRATIVE_VALUES[field.id] ?? ''} readOnly />}
                  </label>
                );
              })}
            </div>
            <label className="forms-preview__consent"><input type="checkbox" readOnly /> Acepto</label>
            <button className="forms-preview__submit" onClick={testPreviewSubmission}>Probar envío omitiendo lo voluntario</button>
            {previewMessage && (
              <div className={`forms-preview__message ${previewMessage.startsWith('La persona') ? 'is-success' : ''}`}>
                {previewMessage.startsWith('La persona') && <CheckCircle2 size={15} />}{previewMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AelFormsApp;
