import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileSpreadsheet,
  Mail,
  MessageSquare,
  MousePointer2,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import './CaseTutorial.css';
import { resolveTutorialStepIndex, type TutorialProgress } from './tutorialProgress';

export type TutorialAppId = 'mail' | 'spreadsheet' | 'aelscan' | 'aelchat';

export interface CaseTutorialStep {
  eyebrow?: string;
  title: string;
  description: string;
  instruction: string;
  target?: string;
  appId?: TutorialAppId;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}

const CASE_TUTORIALS: Record<1 | 2 | 3, { label: string; steps: CaseTutorialStep[] }> = {
  1: {
    label: 'Caso 1 · Selección de personal',
    steps: [
      {
        title: 'Revisa una solicitud de RRHH',
        description: 'Investigarás un correo y una planilla antes de decidir cómo responder. El Scáner de complimiento te ayudará a saber qué se está incumpliendo.',
        instruction: 'Ruta del caso: correo → planilla → AelScan → respuesta final.',
        icon: Sparkles,
      },
      {
        eyebrow: 'Correo',
        title: 'Lee el mensaje y abre el adjunto',
        description: 'Revisa quién envía el correo, quién aparece en copia y qué archivo solicita compartir. Los elementos sospechosos se pueden seleccionar.',
        instruction: 'Este es el archivo Excel adjunto. Pulsa Siguiente para abrir la planilla.',
        target: '[data-tutorial-target="case1-attachment"]',
        appId: 'mail',
        icon: Mail,
      },
      {
        eyebrow: 'Planilla',
        title: 'Busca datos que no hacen falta',
        description: 'Haz clic en los encabezados de las columnas que parezcan excesivas para el propósito de selección. El elemento elegido quedará preparado para auditarse.',
        instruction: 'Estas son las columnas que revisarás. Pulsa Siguiente para conocer AelScan.',
        target: '[data-tutorial-target="case1-sheet"]',
        appId: 'spreadsheet',
        icon: FileSpreadsheet,
      },
      {
        eyebrow: 'AelScan',
        title: 'Relaciona evidencia y regla',
        description: 'Con una evidencia seleccionada, elige el pilar que corresponda. Una coincidencia correcta documenta el hallazgo y actualiza el progreso.',
        instruction: 'Documenta las 4 evidencias. Luego vuelve a Mail y responde.',
        target: '[data-tutorial-target="aelscan"]',
        appId: 'aelscan',
        icon: ShieldCheck,
      },
    ],
  },
  2: {
    label: 'Caso 2 · Comunicación y acceso',
    steps: [
      {
        title: 'Averigua lo ocurrido en el Chat',
        description: 'Aquí las evidencias están repartidas entre mensajes, perfiles y una planilla. Debes identificarlas y después aplicar tres medidas correctivas.',
        instruction: 'Arrastra la información (chats, planilla, etc) hacia los pilares de Privacidad en AelScan',
        icon: Search,
      },
      {
        eyebrow: 'Conversación del grupo',
        title: 'Lee los mensajes resaltados',
        description: 'Busca datos médicos, financieros o personales que no deberían estar expuestos en un chat general. Los bloques sospechosos pueden arrastrarse o seleccionarse.',
        instruction: 'Comienza leyendo la conversación completa.',
        target: '[data-tutorial-target="case2-chat"]',
        appId: 'aelchat',
        icon: MessageSquare,
      },
      {
        eyebrow: 'Info del grupo',
        title: 'Abre Info del grupo',
        description: 'Revisa la lista de integrantes y sus estados. Una persona inactiva que todavía conserva acceso también constituye una evidencia.',
        instruction: 'Entra a Info del grupo y revisa Miembros y Archivos.',
        target: '[data-tutorial-target="group-info"]',
        appId: 'aelchat',
        icon: Users,
      },
      {
        eyebrow: 'Planilla compartida',
        title: 'Inspecciona la planilla del Chat',
        description: 'Abre el archivo compartido y revisa tanto el libro completo como sus datos. El excel mismo es una evidencia de incumplimiento.',
        instruction: 'Abre la planilla y enlázala con el Escáner de cumplimiento.',
        target: '[data-tutorial-target="case2-sheet"]',
        appId: 'spreadsheet',
        icon: FileSpreadsheet,
      },
      {
        eyebrow: 'AelScan',
        title: 'Lleva los 7 hallazgos a AelScan',
        description: 'Relaciona cada evidencia con su pilar. Al completar 7 de 7, vuelve al Chat: allí se habilitarán las tres acciones de mitigación y el cierre del caso.',
        instruction: 'Una vez hagas las medidas podrás ir al Caso 3.',
        target: '[data-tutorial-target="aelscan"]',
        appId: 'aelscan',
        icon: ShieldCheck,
      },
    ],
  },
  3: {
    label: 'Caso 3 · El correo equivocado',
    steps: [
      {
        title: 'Encuentra tres riesgos en un correo programado',
        description: 'El tutorial no consume tiempo. Cuando lo cierres comenzará una cuenta regresiva de 30 segundos para corregir destinatarios, privacidad de la audiencia y adjuntos.',
        instruction: 'Ruta del caso: destinatarios → adjuntos → comprobar → enviar.',
        icon: Sparkles,
      },
      {
        eyebrow: 'Destinatarios',
        title: 'Comprueba quién recibirá el correo',
        description: 'Haz clic en cada chip. Retira la dirección sospechosa y protege la lista masiva para que las 238 personas no vean las direcciones de las demás.',
        instruction: 'Haz clic en Para y CC: protege la lista masiva y quita la dirección sospechosa.',
        target: '[data-tutorial-target="case3-recipients"]',
        appId: 'mail',
        icon: Users,
      },
      {
        eyebrow: 'Adjuntos',
        title: 'Abre ambos archivos',
        description: 'La planilla permite una revisión profunda y el PDF puede previsualizarse. Conserva únicamente el documento necesario para la finalidad del correo.',
        instruction: 'Abre ambos adjuntos y conserva solamente el aviso necesario.',
        target: '[data-tutorial-target="case3-attachments"]',
        appId: 'mail',
        icon: FileSpreadsheet,
      },
      {
        eyebrow: 'Botón Enviar',
        title: 'Envía solo cuando marque 3 de 3',
        description: 'El contador inferior registra las correcciones. Puedes comprobar antes, pero el mejor resultado se obtiene al resolver los tres riesgos.',
        instruction: 'Cuando el indicador esté completo, pulsa Enviar correo y confirma.',
        target: '[data-tutorial-target="case3-send"]',
        appId: 'mail',
        icon: Check,
      },
    ],
  },
};

interface CaseTutorialProps {
  caseId: number;
  open: boolean;
  onComplete: () => void;
  onStepChange?: (step: CaseTutorialStep) => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const CaseTutorial: React.FC<CaseTutorialProps> = ({ caseId, open, onComplete, onStepChange }) => {
  const safeCaseId = caseId === 3 ? 3 : caseId === 2 ? 2 : 1;
  const tutorial = CASE_TUTORIALS[safeCaseId];
  const [progress, setProgress] = useState<TutorialProgress>(() => ({ caseId: safeCaseId, stepIndex: 0 }));
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const stepIndex = resolveTutorialStepIndex(safeCaseId, tutorial.steps.length, progress);
  const step = tutorial.steps[stepIndex];

  useEffect(() => {
    if (open) setProgress({ caseId: safeCaseId, stepIndex: 0 });
  }, [open, safeCaseId]);

  useEffect(() => {
    if (!open) return;
    onStepChange?.(step);

    let cancelled = false;
    let retryTimer: number | undefined;

    const updateTarget = (attempt = 0) => {
      if (cancelled || !step.target) {
        setTargetRect(null);
        return;
      }

      const element = document.querySelector<HTMLElement>(step.target);
      if (!element) {
        setTargetRect(null);
        if (attempt < 8) retryTimer = window.setTimeout(() => updateTarget(attempt + 1), 90);
        return;
      }

      try {
        element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      } catch (e) {
        console.warn('Failed to scroll tutorial target into view', e);
      }

      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) setTargetRect(rect);
    };

    const delayedUpdate = window.setTimeout(() => updateTarget(), 70);
    const handleViewportChange = () => updateTarget();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      cancelled = true;
      window.clearTimeout(delayedUpdate);
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [open, step, onStepChange]);

  const cardPosition = useMemo<React.CSSProperties>(() => {
    if (!targetRect || window.innerWidth < 720) return {};
    const cardWidth = Math.min(410, window.innerWidth - 32);
    const centeredLeft = clamp(targetRect.left + targetRect.width / 2 - cardWidth / 2, 16, window.innerWidth - cardWidth - 16);
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;

    if (spaceBelow >= 310) return { width: cardWidth, left: centeredLeft, top: targetRect.bottom + 18 };
    if (spaceAbove >= 310) {
      return {
        width: cardWidth,
        left: centeredLeft,
        top: 'auto',
        bottom: window.innerHeight - targetRect.top + 18,
      };
    }

    const centeredTop = clamp(targetRect.top + targetRect.height / 2 - 150, 16, window.innerHeight - 316);
    if (targetRect.left >= cardWidth + 34) return { width: cardWidth, left: targetRect.left - cardWidth - 18, top: centeredTop };
    if (window.innerWidth - targetRect.right >= cardWidth + 34) return { width: cardWidth, left: targetRect.right + 18, top: centeredTop };
    return { width: cardWidth, left: centeredLeft, top: centeredTop };
  }, [targetRect]);

  const finish = () => {
    setTargetRect(null);
    onComplete();
  };

  const next = () => {
    if (stepIndex === tutorial.steps.length - 1) finish();
    else setProgress({ caseId: safeCaseId, stepIndex: stepIndex + 1 });
  };

  const StepIcon = step.icon;
  const isTooltipStep = Boolean(step.target);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`case-tutorial${targetRect ? ' has-target' : ' is-overview'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={isTooltipStep ? `${step.eyebrow}. ${step.instruction}` : undefined}
          aria-labelledby={isTooltipStep ? undefined : 'case-tutorial-title'}
        >
          {targetRect ? (
            <motion.div
              className="case-tutorial__spotlight"
              initial={{ opacity: 0, scale: .92 }}
              animate={{
                opacity: 1,
                scale: 1,
                left: Math.max(8, targetRect.left - 8),
                top: Math.max(8, targetRect.top - 8),
                width: Math.min(window.innerWidth - 16, targetRect.width + 16),
                height: Math.min(window.innerHeight - 16, targetRect.height + 16),
              }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            >
              <MousePointer2 size={18} />
            </motion.div>
          ) : (
            <div className="case-tutorial__backdrop" />
          )}

          <motion.section
            key={`${safeCaseId}-${stepIndex}`}
            className={`case-tutorial__card${isTooltipStep ? ' is-tooltip' : ''}`}
            style={cardPosition}
            initial={{ opacity: 0, y: 18, rotate: stepIndex % 2 ? .6 : -.6, scale: .96 }}
            animate={{ opacity: 1, y: 0, rotate: stepIndex % 2 ? .25 : -.25, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: .97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          >
            <button type="button" className="case-tutorial__close" onClick={finish} aria-label="Cerrar tutorial">
              <X size={17} strokeWidth={3} />
            </button>

            <header className="case-tutorial__header">
              <div className="case-tutorial__icon"><StepIcon size={25} strokeWidth={2.7} /></div>
              <div>
                {!isTooltipStep && <span>{tutorial.label}</span>}
                {step.eyebrow && <small>{step.eyebrow}</small>}
              </div>
            </header>

            <div className="case-tutorial__copy">
              {!isTooltipStep && <>
                <h2 id="case-tutorial-title">{step.title}</h2>
                <p>{step.description}</p>
              </>}
              <div className="case-tutorial__instruction">
                <ArrowRight size={16} strokeWidth={3} />
                <strong>{step.instruction}</strong>
              </div>
            </div>

            <footer className="case-tutorial__footer">
              <span />
              <div>
                {stepIndex > 0 && (
                  <button type="button" className="case-tutorial__button is-secondary" onClick={() => setProgress({ caseId: safeCaseId, stepIndex: stepIndex - 1 })}>
                    <ArrowLeft size={15} /> Atrás
                  </button>
                )}
                <button type="button" className="case-tutorial__button" onClick={next}>
                  {stepIndex === tutorial.steps.length - 1 ? <><Check size={16} /> Empezar caso</> : <>Siguiente <ArrowRight size={16} /></>}
                </button>
              </div>
            </footer>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CaseTutorial;
