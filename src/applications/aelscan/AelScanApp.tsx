import React, { useCallback, useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useGameState } from '../../game/GameStateContext';
import { scenario1 } from '../../content/scenario_1';
import { ShieldAlert, HelpCircle } from 'lucide-react';
import { playSound } from '../../components/sound';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CASE1_INFRACTION_RULES_BY_ELEMENT,
  CASE2_FINDING_EVIDENCE_IDS,
  CASE2_FINDING_RULE_IDS,
  CASE2_INFRACTION_EVIDENCE_IDS,
  CASE2_INFRACTION_RULES_BY_EVIDENCE,
} from '../../content/evidenceRules';
import { AELSCAN_PIN_EVIDENCE_EVENT } from '../../components/aelScanNavigation';
import Case3AelScan from './Case3AelScan';

interface Pillar {
  id: number;
  title: string;
  principle: string;
  summary: string;
  question: string;
  clues: string[]; // Actionable hover clues specific to each case
}

interface AnchorRect {
  top: number;
  right: number;
  bottom: number;
  left: number;
  height: number;
  width: number;
}

interface RuleProgressItem {
  id: string;
  label: string;
  resolved: boolean;
}

const TOOLTIP_GAP = 12;
const TOOLTIP_VIEWPORT_MARGIN = 12;

const getTooltipPosition = (
  anchor: AnchorRect,
  tooltipWidth: number,
  tooltipHeight: number,
) => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const centeredTop = anchor.top + (anchor.height - tooltipHeight) / 2;
  const clampedTop = Math.min(
    Math.max(TOOLTIP_VIEWPORT_MARGIN, centeredTop),
    Math.max(TOOLTIP_VIEWPORT_MARGIN, viewportHeight - tooltipHeight - TOOLTIP_VIEWPORT_MARGIN),
  );

  if (anchor.left >= tooltipWidth + TOOLTIP_GAP + TOOLTIP_VIEWPORT_MARGIN) {
    return {
      left: anchor.left - tooltipWidth - TOOLTIP_GAP,
      top: clampedTop,
      placement: 'left' as const,
    };
  }

  if (viewportWidth - anchor.right >= tooltipWidth + TOOLTIP_GAP + TOOLTIP_VIEWPORT_MARGIN) {
    return {
      left: anchor.right + TOOLTIP_GAP,
      top: clampedTop,
      placement: 'right' as const,
    };
  }

  const fitsAbove = anchor.top >= tooltipHeight + TOOLTIP_GAP + TOOLTIP_VIEWPORT_MARGIN;
  const top = fitsAbove
    ? anchor.top - tooltipHeight - TOOLTIP_GAP
    : Math.min(
      anchor.bottom + TOOLTIP_GAP,
      Math.max(TOOLTIP_VIEWPORT_MARGIN, viewportHeight - tooltipHeight - TOOLTIP_VIEWPORT_MARGIN),
    );

  return {
    left: Math.min(
      Math.max(TOOLTIP_VIEWPORT_MARGIN, anchor.left + (anchor.width - tooltipWidth) / 2),
      Math.max(TOOLTIP_VIEWPORT_MARGIN, viewportWidth - tooltipWidth - TOOLTIP_VIEWPORT_MARGIN),
    ),
    top,
    placement: fitsAbove ? 'top' as const : 'bottom' as const,
  };
};

const RuleClueTooltip: React.FC<{
  anchor: AnchorRect;
  ruleId: number;
  clues: string[];
  progressItems: RuleProgressItem[];
}> = ({ anchor, ruleId, clues, progressItems }) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const maxTooltipWidth = Math.max(0, Math.min(280, window.innerWidth - (TOOLTIP_VIEWPORT_MARGIN * 2)));
  const [tooltipSize, setTooltipSize] = useState({ width: maxTooltipWidth, height: 120 });

  useLayoutEffect(() => {
    const tooltip = tooltipRef.current;
    if (!tooltip) return;

    const rect = tooltip.getBoundingClientRect();
    setTooltipSize({ width: rect.width, height: rect.height });
  }, [clues, progressItems, maxTooltipWidth]);

  const position = getTooltipPosition(anchor, tooltipSize.width, tooltipSize.height);

  const arrowStyle: React.CSSProperties = {
    position: 'absolute',
    width: 0,
    height: 0,
  };

  if (position.placement === 'left') {
    Object.assign(arrowStyle, {
      left: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      borderTop: '6px solid transparent',
      borderBottom: '6px solid transparent',
      borderLeft: '6px solid #1e293b',
    });
  } else if (position.placement === 'right') {
    Object.assign(arrowStyle, {
      right: '100%',
      top: '50%',
      transform: 'translateY(-50%)',
      borderTop: '6px solid transparent',
      borderBottom: '6px solid transparent',
      borderRight: '6px solid #1e293b',
    });
  } else if (position.placement === 'top') {
    Object.assign(arrowStyle, {
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      borderLeft: '6px solid transparent',
      borderRight: '6px solid transparent',
      borderTop: '6px solid #1e293b',
    });
  } else {
    Object.assign(arrowStyle, {
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      borderLeft: '6px solid transparent',
      borderRight: '6px solid transparent',
      borderBottom: '6px solid #1e293b',
    });
  }

  return createPortal(
    <motion.div
      ref={tooltipRef}
      id={`rule-clue-${ruleId}`}
      role="tooltip"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: maxTooltipWidth,
        maxHeight: `calc(100vh - ${TOOLTIP_VIEWPORT_MARGIN * 2}px)`,
        overflowY: 'auto',
        background: '#1e293b',
        color: '#f8fafc',
        padding: '10px 12px',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.3)',
        border: '1px solid #334155',
        zIndex: 999999,
        pointerEvents: 'none',
        fontSize: '0.68rem',
        lineHeight: '1.4',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ fontWeight: 700, color: '#fbbf24', marginBottom: '5px', textTransform: 'uppercase', fontSize: '0.62rem', letterSpacing: '0.3px' }}>
        💡 Pista de investigación
      </div>
      {clues.map((clue, index) => (
        <div key={clue} style={{ display: 'flex', gap: '6px', marginTop: index === 0 ? 0 : '5px' }}>
          <span aria-hidden="true" style={{ color: '#fbbf24', fontWeight: 900 }}>›</span>
          <span>{clue}</span>
        </div>
      ))}

      {progressItems.length > 0 && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #475569' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '6px', color: '#cbd5e1', fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
            <span>Hallazgos de este pilar</span>
            <span>{progressItems.filter(item => item.resolved).length}/{progressItems.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {progressItems.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                  padding: '5px 6px',
                  borderRadius: '6px',
                  background: item.resolved ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.06)',
                  color: item.resolved ? '#a7f3d0' : '#e2e8f0',
                  border: `1px solid ${item.resolved ? 'rgba(52,211,153,0.42)' : 'rgba(148,163,184,0.22)'}`,
                }}
              >
                <span aria-hidden="true" style={{ flexShrink: 0, color: item.resolved ? '#34d399' : '#94a3b8', fontWeight: 900 }}>
                  {item.resolved ? '✓' : '□'}
                </span>
                <span style={{ textDecoration: item.resolved ? 'line-through' : 'none', textDecorationColor: 'rgba(167,243,208,0.55)' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={arrowStyle} />
    </motion.div>,
    document.body,
  );
};

// 3 Pillars for Case 1
const PILLARS_CASE1: Pillar[] = [
  {
    id: 1,
    title: '1. Finalidad (Base y Fines)',
    principle: 'Licitud, Finalidad y Consentimiento',
    summary: 'Tratamiento lícito y con fines específicos. Se prohíbe tratar datos sensibles sin consentimiento.',
    question: '“¿Hay una razón válida para tratar este dato y se está usando para lo que corresponde?”',
    clues: [
      'La pista central está en Excel: busca una columna sobre la salud de los postulantes.',
      'También se relacionan las creencias personales y la copia enviada a un destinatario externo.'
    ]
  },
  {
    id: 2,
    title: '2. Necesidad (Minimización)',
    principle: 'Proporcionalidad y Conservación',
    summary: 'Tratamiento limitado a los datos adecuados, necesarios y pertinentes para el proceso.',
    question: '“¿Realmente necesitas este dato, en esta cantidad y durante tanto tiempo?”',
    clues: [
      'Busca en Excel datos que no aportan a evaluar un cargo técnico: convicciones personales e historial médico.',
      'Cualquiera de esos encabezados puede documentarse aquí.'
    ]
  },
  {
    id: 3,
    title: '3. Protección (Seguridad)',
    principle: 'Seguridad y Confidencialidad',
    summary: 'Deber de secreto y resguardo frente a accesos no autorizados o filtraciones externas.',
    question: '“¿Está protegido y solo acceden quienes realmente deberían?”',
    clues: [
      'Hay dos hallazgos: revisa en Excel qué identificador único está expuesto sin resguardo y arrastra su encabezado.',
      'Luego revisa el campo CC de Mail. Las columnas sensibles compartidas también se relacionan con este pilar.'
    ]
  }
];

// 4 Pillars for Case 2
const PILLARS_CASE2: Pillar[] = [
  {
    id: 1,
    title: '1. Finalidad (Base y Fines)',
    principle: 'Licitud, Finalidad y Consentimiento',
    summary: 'Tratamiento lícito y con fines específicos. Se prohíbe tratar datos sensibles sin consentimiento.',
    question: '“¿Hay una razón válida para tratar este dato y se está usando para lo que corresponde?”',
    clues: [
      'Chat, 09:07: Carolina no solo informa una ausencia; revela un diagnóstico clínico.',
      'El comentario sobre las deudas de Felipe también usa información personal para un fin ajeno al trabajo.'
    ]
  },
  {
    id: 2,
    title: '2. Necesidad (Minimización)',
    principle: 'Proporcionalidad y Conservación',
    summary: 'Tratamiento limitado a los datos adecuados, necesarios y pertinentes para el proceso.',
    question: '“¿Realmente necesitas este dato, en esta cantidad y durante tanto tiempo?”',
    clues: [
      'Busca el “déjala en el grupo por ahora” y el perfil que confirma que Javiera sigue con acceso.',
      'También sobran el diagnóstico, las deudas y la planilla completa compartida en el Chat.'
    ]
  },
  {
    id: 3,
    title: '3. Protección (Seguridad)',
    principle: 'Seguridad y Confidencialidad',
    summary: 'Deber de secreto y resguardo frente a accesos no autorizados o filtraciones externas.',
    question: '“¿Está protegido y solo acceden quienes realmente deberían?”',
    clues: [
      'Revisa accesos indebidos y datos expuestos: el perfil de Javiera, el diagnóstico, las deudas y el acceso libre de RRHH.',
      'La publicación de la planilla y el libro abierto en Excel son evidencias independientes.'
    ]
  },
  {
    id: 4,
    title: '4. Control (Derechos)',
    principle: 'Procedencia, Trazabilidad y Derechos ARCO',
    summary: 'El responsable debe saber de dónde provienen los datos, cómo se obtuvieron y garantizar que el titular pueda ejercer sus derechos.',
    question: '“¿Sabes de dónde vienen estos datos y el titular autorizó su uso?”',
    clues: [
      'Chat, 09:24: Andrés explica el origen de la planilla y admite que todo RRHH tiene acceso libre a todas las fichas.',
      'Arrastra ese mensaje; la pregunta anterior de Felipe aporta contexto, pero no es una infracción arrastrable.'
    ]
  }
];

// Case 1 relation mapping
interface Relation1 {
  ruleId: number;
  elementId: string;
  result: 'violation';
  evidenceId: string;
  explanation: string;
}

const COMPLIANCE_RELATIONS_CASE1: Relation1[] = [
  { ruleId: 1, elementId: 'col-historial_medico', result: 'violation', evidenceId: 'ev-sensitive-health', explanation: 'El historial clínico constituye un Dato Sensible de Salud. Tratarlo sin una base de consentimiento expreso vulnera el Pilar de Finalidad (Base y Fines).' },
  { ruleId: 2, elementId: 'col-religion', result: 'violation', evidenceId: 'ev-sensitive-religion', explanation: 'Las creencias religiosas son datos sensibles ideológicos y no son necesarias ni adecuadas para evaluar un cargo técnico, violando el Pilar de Necesidad (Minimización).' },
  { ruleId: 3, elementId: 'col-rut', result: 'violation', evidenceId: 'ev-personal-rut', explanation: 'Transmitir el RUT en texto plano sin cifrado ni resguardo de seguridad complementario vulnera el Pilar de Protección (Seguridad).' },
  { ruleId: 3, elementId: 'email-cc-header', result: 'violation', evidenceId: 'ev-cc-leak', explanation: 'Copiar a la casilla de distribución general "info@vendorservices.test" expone los datos de los postulantes a proveedores externos no autorizados, vulnerando el Pilar de Protección (Confidencialidad).' },
];

// Case 2 one-to-one evidence relationships
interface Relation2 {
  evidenceId: string;
  requiredRuleId: number;
  result: 'violation' | 'compliant' | 'unrelated';
  leadIdToUnlock?: string;
  explanation: string;
}

interface ComparisonResult {
  result: 'violation' | 'compliant' | 'insufficient' | 'unrelated';
  explanation: string;
  primaryRuleId?: number;
  relatedRuleIds?: number[];
  alreadyResolved?: boolean;
}

const PILLAR_NAMES: Record<number, string> = {
  1: 'Finalidad',
  2: 'Necesidad',
  3: 'Protección',
  4: 'Control',
};

const COMPLIANCE_RELATIONS_CASE2: Relation2[] = [
  // 1. Acceso de ex-trabajadora (Pilar 3)
  {
    evidenceId: CASE2_FINDING_EVIDENCE_IDS['lead-ex-worker-access-resolved'][0],
    requiredRuleId: CASE2_FINDING_RULE_IDS['lead-ex-worker-access-resolved'],
    result: 'violation',
    leadIdToUnlock: 'lead-ex-worker-access-resolved',
    explanation: 'El perfil muestra simultáneamente que Javiera es una ex-trabajadora inactiva y que conserva membresía activa en el Chat. Violación del Pilar de Protección (Acceso y Seguridad).'
  },
  // 2. Información médica innecesaria (Pilar 1)
  {
    evidenceId: CASE2_FINDING_EVIDENCE_IDS['lead-medical-disclosure-resolved'][0],
    requiredRuleId: CASE2_FINDING_RULE_IDS['lead-medical-disclosure-resolved'],
    result: 'violation',
    leadIdToUnlock: 'lead-medical-disclosure-resolved',
    explanation: 'Revelar el diagnóstico clínico de un empleado ("depresión severa") en un canal de chat general vulnera el Pilar de Finalidad (Datos Sensibles sin consentimiento).'
  },
  // 3. Información financiera/personal innecesaria (Pilar 3)
  {
    evidenceId: CASE2_FINDING_EVIDENCE_IDS['lead-financial-disclosure-resolved'][0],
    requiredRuleId: CASE2_FINDING_RULE_IDS['lead-financial-disclosure-resolved'],
    result: 'violation',
    leadIdToUnlock: 'lead-financial-disclosure-resolved',
    explanation: 'Compartir los problemas de deudas personales e historial financiero de un trabajador en un chat común viola el Pilar de Protección (Confidencialidad).'
  },
  // 4. Retención indefinida "por si acaso" (Pilar 2)
  {
    evidenceId: CASE2_FINDING_EVIDENCE_IDS['lead-retention-by-chance-resolved'][0],
    requiredRuleId: CASE2_FINDING_RULE_IDS['lead-retention-by-chance-resolved'],
    result: 'violation',
    leadIdToUnlock: 'lead-retention-by-chance-resolved',
    explanation: 'Mantener cuentas de ex-empleados activas "por si acaso necesitamos preguntarle algo" viola el Pilar de Necesidad (Conservación y Plazos).'
  },
  // 5. Mensaje que comparte una planilla de personal en el canal (Pilar 3)
  {
    evidenceId: CASE2_FINDING_EVIDENCE_IDS['lead-file-shared-in-chat-resolved'][0],
    requiredRuleId: CASE2_FINDING_RULE_IDS['lead-file-shared-in-chat-resolved'],
    result: 'violation',
    leadIdToUnlock: 'lead-file-shared-in-chat-resolved',
    explanation: 'Carolina comparte en un chat grupal una planilla de personal con datos de contacto y emergencia. Esta divulgación vulnera el Pilar de Protección (Confidencialidad).'
  },
  // 6. Contenido del libro expuesto (Pilar 3)
  {
    evidenceId: CASE2_FINDING_EVIDENCE_IDS['lead-workbook-exposure-resolved'][0],
    requiredRuleId: CASE2_FINDING_RULE_IDS['lead-workbook-exposure-resolved'],
    result: 'violation',
    leadIdToUnlock: 'lead-workbook-exposure-resolved',
    explanation: 'El libro personal_sucursal_agosto.xlsx contiene teléfonos, correos, contactos de emergencia y estado de licencia accesibles desde el canal. Violación del Pilar de Protección.'
  },
  // 7. Acceso irrestricto a fichas de RRHH (Pilar 4 - Control)
  {
    evidenceId: CASE2_FINDING_EVIDENCE_IDS['lead-control-orig-resolved'][0],
    requiredRuleId: CASE2_FINDING_RULE_IDS['lead-control-orig-resolved'],
    result: 'violation',
    leadIdToUnlock: 'lead-control-orig-resolved',
    explanation: 'Todos los empleados de RRHH tienen acceso libre e irrestricto a la totalidad de fichas de personal, sin trazabilidad ni autorización específica. Violación del Pilar de Control (Procedencia y Derechos).'
  }
];

const LegacyAelScanApp: React.FC = () => {
  const {
    state: gameState,
    foundEvidence,
    acknowledgeCase1Audit,
    setSelectedAuditElement,
    setSelectedRuleId,
    triggerNotification,
  } = useGameState();

  const [hoveredRuleId, setHoveredRuleId] = useState<number | null>(null);
  const [hoveredRect, setHoveredRect] = useState<AnchorRect | null>(null);

  const [comparisonState, setComparisonState] = useState<'idle' | 'checking' | 'resolved'>('idle');
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);

  // Case 2 Local Multi-evidence selection state
  const [selectedEvIds, setSelectedEvIds] = useState<string[]>([]);
  const [isDragOverCardId, setIsDragOverCardId] = useState<number | null>(null);
  const comparisonTimerRef = useRef<number | null>(null);
  const lastComparisonKeyRef = useRef<string | null>(null);

  const isDay2 = gameState.currentDay === 2;
  const ARTICLES = isDay2 ? PILLARS_CASE2 : PILLARS_CASE1;

  useEffect(() => {
    const pinEvidence = (event: Event) => {
      const evidenceId = (event as CustomEvent<string>).detail;
      if (isDay2 && CASE2_INFRACTION_EVIDENCE_IDS.includes(evidenceId)) {
        setSelectedEvIds([evidenceId]);
      } else {
        return;
      }
      setComparisonState('idle');
      setComparisonResult(null);
    };
    window.addEventListener(AELSCAN_PIN_EVIDENCE_EVENT, pinEvidence);
    return () => window.removeEventListener(AELSCAN_PIN_EVIDENCE_EVENT, pinEvidence);
  }, [isDay2]);

  useEffect(() => {
    if (comparisonTimerRef.current !== null) {
      window.clearTimeout(comparisonTimerRef.current);
      comparisonTimerRef.current = null;
    }
    lastComparisonKeyRef.current = null;
    setHoveredRuleId(null);
    setHoveredRect(null);
    setComparisonState('idle');
    setComparisonResult(null);
    setSelectedEvIds([]);
    setIsDragOverCardId(null);
    setSelectedAuditElement(null);
    setSelectedRuleId(null);
    delete document.documentElement.dataset.clueRule;
  }, [gameState.currentDay, setSelectedAuditElement, setSelectedRuleId]);

  useEffect(() => () => {
    if (comparisonTimerRef.current !== null) {
      window.clearTimeout(comparisonTimerRef.current);
    }
  }, []);

  // Day 2 Clues list
  const CASE2_LEADS = [
    { id: 'lead-ex-worker-access-resolved', label: 'Acceso de ex-trabajadora en chat', desc: 'Miembro con estado laboral inactivo que conserva acceso a datos personales compartidos.', primaryRuleId: CASE2_FINDING_RULE_IDS['lead-ex-worker-access-resolved'], resolved: gameState.evidenceFound.includes('lead-ex-worker-access-resolved') },
    { id: 'lead-medical-disclosure-resolved', label: 'Información médica innecesaria', desc: 'Divulgación de diagnósticos de salud mental en canales generales de coordinación.', primaryRuleId: CASE2_FINDING_RULE_IDS['lead-medical-disclosure-resolved'], resolved: gameState.evidenceFound.includes('lead-medical-disclosure-resolved') },
    { id: 'lead-financial-disclosure-resolved', label: 'Información financiera compartida', desc: 'Detalles sobre deudas y anticipos de trabajadores expuestos innecesariamente.', primaryRuleId: CASE2_FINDING_RULE_IDS['lead-financial-disclosure-resolved'], resolved: gameState.evidenceFound.includes('lead-financial-disclosure-resolved') },
    { id: 'lead-retention-by-chance-resolved', label: 'Retención de accesos "por si acaso"', desc: 'Mantener cuentas inactivas en canales activos sin finalidad operacional delimitada.', primaryRuleId: CASE2_FINDING_RULE_IDS['lead-retention-by-chance-resolved'], resolved: gameState.evidenceFound.includes('lead-retention-by-chance-resolved') },
    { id: 'lead-file-shared-in-chat-resolved', label: 'Planilla compartida en el Chat', desc: 'Mensaje que distribuye una planilla de personal en un canal grupal.', primaryRuleId: CASE2_FINDING_RULE_IDS['lead-file-shared-in-chat-resolved'], resolved: gameState.evidenceFound.includes('lead-file-shared-in-chat-resolved') },
    { id: 'lead-workbook-exposure-resolved', label: 'Contenido del libro expuesto', desc: 'El libro compartido contiene datos personales, contactos de emergencia y estado de licencia.', primaryRuleId: CASE2_FINDING_RULE_IDS['lead-workbook-exposure-resolved'], resolved: gameState.evidenceFound.includes('lead-workbook-exposure-resolved') },
    { id: 'lead-control-orig-resolved', label: 'Acceso irrestricto a fichas de RRHH', desc: 'Todos en RRHH acceden libremente a todas las fichas sin autorización ni trazabilidad.', primaryRuleId: CASE2_FINDING_RULE_IDS['lead-control-orig-resolved'], resolved: gameState.evidenceFound.includes('lead-control-orig-resolved') }
  ];

  // Case 1 resolved list for Resolutions tab
  const CASE1_LEADS = [
    { id: 'ev-personal-rut', label: 'RUT expuesto en la Planilla', primaryRuleId: 3, resolved: gameState.evidenceFound.includes('ev-personal-rut') },
    { id: 'ev-sensitive-health', label: 'Historial Médico en la Planilla', primaryRuleId: 1, resolved: gameState.evidenceFound.includes('ev-sensitive-health') },
    { id: 'ev-sensitive-religion', label: 'Creencias Religiosas en la Planilla', primaryRuleId: 2, resolved: gameState.evidenceFound.includes('ev-sensitive-religion') },
    { id: 'ev-cc-leak', label: 'Correo copiado a un destinatario externo', primaryRuleId: 3, resolved: gameState.evidenceFound.includes('ev-cc-leak') },
  ];

  const totalLeads = isDay2 ? CASE2_LEADS.length : scenario1.evidences.length;
  const foundLeadsCount = isDay2
    ? CASE2_LEADS.filter(lead => lead.resolved).length
    : gameState.evidenceFound.filter(id => id.startsWith('ev-') && !id.startsWith('ev-ch-') && !id.startsWith('ev-form-')).length;
  const activeLeads = isDay2 ? CASE2_LEADS : CASE1_LEADS;
  const getRuleProgressItems = (ruleId: number): RuleProgressItem[] => activeLeads
    .filter(lead => lead.primaryRuleId === ruleId)
    .map(({ id, label, resolved }) => ({ id, label, resolved }));

  const progressPct = Math.round((foundLeadsCount / totalLeads) * 100);

  const selectedRule = ARTICLES.find(a => a.id === gameState.selectedRuleId);
  const selectedEvidence = gameState.selectedAuditElement;
  const selectedRuleId = selectedRule?.id;
  const selectedEvidenceId = selectedEvidence?.elementId;

  // Run Confrontation Trigger automatically
  const handleConfront = useCallback((ruleId: number, elementIdOrEvId: string) => {
    if (comparisonTimerRef.current !== null) {
      window.clearTimeout(comparisonTimerRef.current);
    }
    setComparisonState('checking');

    comparisonTimerRef.current = window.setTimeout(() => {
      comparisonTimerRef.current = null;
      if (isDay2) {
        const match = COMPLIANCE_RELATIONS_CASE2.find(r => r.evidenceId === elementIdOrEvId);
        const validRuleIds = CASE2_INFRACTION_RULES_BY_EVIDENCE[elementIdOrEvId] ?? [];

        if (match && validRuleIds.includes(ruleId)) {
          const wasAlreadyResolved = Boolean(match.leadIdToUnlock && gameState.evidenceFound.includes(match.leadIdToUnlock));
          setComparisonResult({
            result: match.result,
            explanation: match.explanation,
            primaryRuleId: match.requiredRuleId,
            relatedRuleIds: validRuleIds.filter(id => id !== match.requiredRuleId),
            alreadyResolved: wasAlreadyResolved,
          });
          if (match.result === 'violation' && match.leadIdToUnlock) {
            if (!wasAlreadyResolved) {
              foundEvidence(match.leadIdToUnlock);
              playSound.success(gameState.soundEnabled);

              const nextFindingCount = new Set([
                ...gameState.evidenceFound.filter(id => id.startsWith('lead-')),
                match.leadIdToUnlock,
              ]).size;
              const isFinalFinding = nextFindingCount === COMPLIANCE_RELATIONS_CASE2.length;

              triggerNotification(isFinalFinding ? {
                id: 'milestone-case2-mitigation',
                title: '🎉 Auditoría completa · Actúa en el Chat',
                message: 'Documentaste las 7 evidencias y las 7 infracciones. Ahora aplica las medidas de mitigación interactivas en el Chat.',
                appToOpen: 'aelchat',
              } : {
                id: 'lead-resolved-' + Date.now(),
                title: '⚖️ Infracción Documentada',
                message: 'Confirmado en Reglamento: ' + match.explanation.slice(0, 50) + '...'
              });
            }
          } else {
            playSound.success(gameState.soundEnabled);
          }
          // Clear selections on success
          setSelectedEvIds([]);
        } else {
          setComparisonResult({
            result: 'unrelated',
            explanation: 'Esta evidencia sí puede documentarse, pero corresponde a otro pilar del Reglamento. Revisa la pista del artículo.'
          });
          playSound.warning(gameState.soundEnabled);
          setSelectedEvIds([]);
        }
      } else {
        // Case 1 comparison
        const match = COMPLIANCE_RELATIONS_CASE1.find(r => r.elementId === elementIdOrEvId);
        const validRuleIds = CASE1_INFRACTION_RULES_BY_ELEMENT[elementIdOrEvId] ?? [];

        if (match && validRuleIds.includes(ruleId)) {
          const wasAlreadyResolved = Boolean(match.evidenceId && gameState.evidenceFound.includes(match.evidenceId));
          setComparisonResult({
            result: match.result,
            explanation: match.explanation,
            primaryRuleId: match.ruleId,
            relatedRuleIds: validRuleIds.filter(id => id !== match.ruleId),
            alreadyResolved: wasAlreadyResolved,
          });
          if (match.result === 'violation' && match.evidenceId) {
            if (!wasAlreadyResolved) {
              foundEvidence(match.evidenceId);
              playSound.success(gameState.soundEnabled);

              const ev = scenario1.evidences.find(e => e.id === match.evidenceId);

              triggerNotification({
                id: 'ev-found-' + Date.now(),
                title: '🔍 Infracción Documentada',
                message: 'Registrado: ' + (ev ? ev.description : 'Infracción de Privacidad') + '.'
              });
            }
          } else {
            playSound.success(gameState.soundEnabled);
          }
        } else {
          setComparisonResult({
            result: 'unrelated',
            explanation: 'La evidencia seleccionada no infringe este pilar, o está más relacionada con otro tipo de cumplimiento.'
          });
          playSound.warning(gameState.soundEnabled);
        }
      }
      setComparisonState('resolved');
    }, 600);
  }, [foundEvidence, gameState.evidenceFound, gameState.soundEnabled, isDay2, triggerNotification]);

  // Case 1 supports selecting the evidence and the rule in either order.
  // The key prevents a drop from scheduling the same comparison twice.
  useEffect(() => {
    if (isDay2 || !selectedRuleId || !selectedEvidenceId) {
      if (!selectedRuleId || !selectedEvidenceId) lastComparisonKeyRef.current = null;
      return;
    }

    const comparisonKey = `${selectedRuleId}:${selectedEvidenceId}`;
    if (lastComparisonKeyRef.current === comparisonKey) return;
    lastComparisonKeyRef.current = comparisonKey;
    handleConfront(selectedRuleId, selectedEvidenceId);
  }, [handleConfront, isDay2, selectedEvidenceId, selectedRuleId]);

  const handleClearSelection = () => {
    const shouldAdvanceToReply = !isDay2
      && comparisonResult?.result === 'violation'
      && scenario1.evidences.every(evidence => gameState.evidenceFound.includes(evidence.id))
      && !gameState.flags.case1AuditAcknowledged;

    lastComparisonKeyRef.current = null;
    setSelectedAuditElement(null);
    setSelectedRuleId(null);
    setSelectedEvIds([]);
    setComparisonState('idle');
    setComparisonResult(null);

    if (shouldAdvanceToReply) {
      acknowledgeCase1Audit();
      triggerNotification({
        id: 'milestone-case1-reply',
        title: '🎉 Auditoría completa · Responde el correo',
        message: 'Confirmaste los 4 incumplimientos. Vuelve a Mail y elige una de las dos respuestas para Sofía.',
        appToOpen: 'mail',
      });
    }

    playSound.click(gameState.soundEnabled);
  };

  // HTML5 Drag and Drop events
  const handleDragOver = (e: React.DragEvent, ruleId: number) => {
    e.preventDefault();
    setIsDragOverCardId(ruleId);
  };

  const handleDragLeave = () => {
    setIsDragOverCardId(null);
  };

  const showRuleClue = (element: HTMLElement, ruleId: number) => {
    const rect = element.getBoundingClientRect();
    setHoveredRect({
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      height: rect.height,
      width: rect.width,
    });
    document.documentElement.dataset.clueRule = String(ruleId);
    setHoveredRuleId(ruleId);
  };

  const hideRuleClue = () => {
    delete document.documentElement.dataset.clueRule;
    setHoveredRect(null);
    setHoveredRuleId(null);
  };

  useEffect(() => () => {
    delete document.documentElement.dataset.clueRule;
  }, []);

  const handleDrop = (e: React.DragEvent, ruleId: number) => {
    e.preventDefault();
    setIsDragOverCardId(null);
    const draggedId = e.dataTransfer.getData('text/plain');
    if (!draggedId) return;

    if (isDay2 && !CASE2_INFRACTION_EVIDENCE_IDS.includes(draggedId)) {
      setSelectedEvIds([]);
      setComparisonState('resolved');
      setComparisonResult({
        result: 'unrelated',
        explanation: 'Este elemento aporta contexto, pero no constituye una infracción documentable del Caso 2.',
      });
      playSound.warning(gameState.soundEnabled);
      return;
    }

    setSelectedRuleId(ruleId);
    playSound.success(gameState.soundEnabled);

    if (isDay2) {
      // Case 2: every draggable item is a self-sufficient infringement.
      setSelectedEvIds([draggedId]);
      handleConfront(ruleId, draggedId);
    } else {
      // Case 1: Instant comparison
      setSelectedAuditElement({ sourceApp: 'mail', elementId: draggedId });
    }
  };

  return (
    <div className="ael-app aelscan-app" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc', overflow: 'hidden', position: 'relative' }}>
      {/* Header */}
      <div className="app-brandbar" style={{ background: 'linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 100%)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <ShieldAlert size={15} color="#60a5fa" />
        <div style={{ flex: 1 }}>
          <div style={{ color: 'white', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.5px' }}>AelScan</div>
          <div style={{ color: '#93c5fd', fontSize: '0.6rem' }}>Auditor de Privacidad · Ley 21.719</div>
        </div>
        <div
          title={isDay2 ? 'Cada una de las 7 evidencias confirma una infracción independiente' : 'Incumplimientos documentados'}
          style={{ background: foundLeadsCount === totalLeads ? '#34d399' : 'rgba(255,255,255,0.2)', color: foundLeadsCount === totalLeads ? '#1e3a8a' : 'white', padding: '3px 7px', borderRadius: '999px', fontSize: isDay2 ? '0.55rem' : '0.68rem', fontWeight: 800, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}
        >
          {isDay2 ? `${foundLeadsCount}/${totalLeads} RESUELTAS` : `${foundLeadsCount}/${totalLeads}`}
        </div>
      </div>

      {/* Progress bar */}
      <div className="aelscan-progress" style={{ height: '3px', background: '#e2e8f0', flexShrink: 0 }}>
        <div style={{ height: '100%', width: progressPct + '%', background: progressPct === 100 ? '#34d399' : isDay2 ? 'linear-gradient(90deg, #84cc16, #facc15)' : '#3b82f6', transition: 'width 0.4s ease' }} />
      </div>

      {/* Regulation contents */}
      <div
        className="aelscan-content"
        onScroll={hideRuleClue}
        style={{ flex: 1, overflowY: 'auto', padding: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}
      >

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>
            {ARTICLES.length} Pilares de la Ley 21.719
          </div>
          {ARTICLES.map(article => {
            const isRuleSelected = gameState.selectedRuleId === article.id;
            const isHovered = hoveredRuleId === article.id;
            const isDragOver = isDragOverCardId === article.id;
            const ruleBorder = isDragOver
              ? '2px dashed #3b82f6'
              : isRuleSelected
                ? '1.5px solid #3b82f6'
                : '1px solid #e2e8f0';

            return (
              <div
                id={'rule-card-' + article.id}
                key={article.id}
                tabIndex={0}
                aria-describedby={isHovered ? `rule-clue-${article.id}` : undefined}
                onMouseEnter={(e) => showRuleClue(e.currentTarget, article.id)}
                onMouseLeave={hideRuleClue}
                onFocus={(e) => showRuleClue(e.currentTarget, article.id)}
                onBlur={hideRuleClue}
                onDragOver={(e) => handleDragOver(e, article.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, article.id)}
                onClick={() => {
                  const nextRuleId = isRuleSelected ? null : article.id;
                  setSelectedRuleId(nextRuleId);
                  if (isDay2 && nextRuleId && selectedEvIds.length === 1) {
                    handleConfront(nextRuleId, selectedEvIds[0]);
                  }
                  playSound.click(gameState.soundEnabled);
                }}
                style={{
                  padding: '6px 8px',
                  background: isDragOver
                    ? '#eff6ff'
                    : isRuleSelected
                      ? 'rgba(59,130,246,0.04)'
                      : 'white',
                  borderTop: ruleBorder,
                  borderRight: ruleBorder,
                  borderBottom: ruleBorder,
                  borderLeft: '4px solid #3b82f6',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  boxShadow: isRuleSelected ? '0 1px 4px rgba(59,130,246,0.08)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 700, color: '#1e293b' }}>
                    {article.title}
                    <HelpCircle size={11} color="#64748b" aria-hidden="true" />
                  </div>
                  {isRuleSelected && (
                    <span style={{ fontSize: '0.52rem', background: '#3b82f6', color: 'white', padding: '0.5px 4px', borderRadius: '999px', fontWeight: 700 }}>
                      Sel
                    </span>
                  )}
                </div>

                <div style={{ fontStyle: 'italic', fontSize: '0.62rem', color: '#1e3a8a', background: '#eff6ff', padding: '3px 5px', borderRadius: '4px', margin: '3px 0' }}>
                  {article.question}
                </div>

                <p style={{ fontSize: '0.65rem', color: '#475569', lineHeight: '1.25', margin: 0 }}>{article.summary}</p>
              </div>
            );
          })}
        </div>

      </div>

      {/* FLOATING DIAGNOSTICS OVERLAY (PREVENTS HEIGHT SHIFTING) */}
      <AnimatePresence>
        {(comparisonState === 'checking' || comparisonState === 'resolved') && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px'
          }}>
            {comparisonState === 'checking' ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                style={{
                  background: '#1e3a8a',
                  color: 'white',
                  padding: '12px 18px',
                  borderRadius: '8px',
                  boxShadow: '0 6px 15px rgba(0,0,0,0.3)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                  textAlign: 'center'
                }}
              >
                🔄 COMPARANDO...
              </motion.div>
            ) : (
              comparisonResult && (
                <motion.div
                  initial={{ scale: 0.92, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.92, opacity: 0, y: 10 }}
                  style={{
                    background: comparisonResult.alreadyResolved ? '#ecfdf5' : comparisonResult.result === 'violation' ? '#fff1f2' : comparisonResult.result === 'compliant' ? '#ecfdf5' : comparisonResult.result === 'insufficient' ? '#fffbeb' : '#f8fafc',
                    border: '2px solid ' + (comparisonResult.alreadyResolved ? '#10b981' : comparisonResult.result === 'violation' ? '#f43f5e' : comparisonResult.result === 'compliant' ? '#10b981' : comparisonResult.result === 'insufficient' ? '#d6a828' : '#cbd5e1'),
                    borderRadius: '12px',
                    padding: '12px',
                    width: '230px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', fontSize: '0.8rem', color: comparisonResult.alreadyResolved ? '#047857' : comparisonResult.result === 'violation' ? '#e11d48' : comparisonResult.result === 'compliant' ? '#059669' : '#475569' }}>
                    {comparisonResult.alreadyResolved && '✓ Evidencia ya resuelta'}
                    {!comparisonResult.alreadyResolved && comparisonResult.result === 'violation' && '⚠️ Infracción Detectada'}
                    {comparisonResult.result === 'compliant' && '✅ Todo en orden'}
                    {comparisonResult.result === 'insufficient' && '◌ Evidencia insuficiente'}
                    {comparisonResult.result === 'unrelated' && '↔ Relación no sustentada'}
                  </div>

                  <div style={{ fontSize: '0.72rem', color: '#1e293b', lineHeight: '1.35' }}>
                    {comparisonResult.alreadyResolved ? (
                      <div style={{ marginBottom: '5px', padding: '5px 7px', borderRadius: '6px', background: '#d1fae5', color: '#065f46', fontWeight: 800 }}>
                        Este hallazgo ya figura como documentado. No suma progreso nuevamente.
                      </div>
                    ) : comparisonResult.result === 'violation' && (
                      <div style={{ marginBottom: '3px', fontWeight: 'bold' }}>Se ha constatado un incumplimiento en este elemento:</div>
                    )}
                    {comparisonResult.result === 'compliant' && (
                      <div style={{ marginBottom: '3px', fontWeight: 'bold' }}>Este elemento cumple con la norma:</div>
                    )}
                    {comparisonResult.result === 'unrelated' && (
                      <div style={{ marginBottom: '3px', fontWeight: 'bold' }}>Las piezas no sostienen esta comparación:</div>
                    )}
                    {comparisonResult.result === 'insufficient' && (
                      <div style={{ marginBottom: '3px', fontWeight: 'bold' }}>Falta contexto para concluir:</div>
                    )}
                    {comparisonResult.explanation}
                  </div>

                  {comparisonResult.result === 'violation' && comparisonResult.primaryRuleId && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontSize: '0.64rem' }}>
                      <span style={{ background: '#e11d48', color: 'white', borderRadius: '999px', padding: '3px 7px', fontWeight: 800 }}>
                        Principal · {PILLAR_NAMES[comparisonResult.primaryRuleId]}
                      </span>
                      {comparisonResult.relatedRuleIds?.map(id => (
                        <span key={id} style={{ background: '#fff', color: '#9f1239', border: '1px solid #fda4af', borderRadius: '999px', padding: '3px 7px', fontWeight: 700 }}>
                          Relacionado · {PILLAR_NAMES[id]}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleClearSelection}
                    className="retro-btn primary"
                    style={{
                      padding: '5px 12px',
                      fontSize: '0.74rem',
                      justifyContent: 'center',
                      marginTop: '2px',
                      background: comparisonResult.alreadyResolved ? '#10b981' : comparisonResult.result === 'violation' ? '#f43f5e' : comparisonResult.result === 'compliant' ? '#10b981' : undefined,
                      borderColor: comparisonResult.alreadyResolved ? '#10b981' : comparisonResult.result === 'violation' ? '#f43f5e' : comparisonResult.result === 'compliant' ? '#10b981' : undefined,
                    }}
                  >
                    Aceptar
                  </button>
                </motion.div>
              )
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Portaled overlay: it never changes AelScan dimensions or creates layout scroll. */}
      <AnimatePresence>
        {hoveredRuleId !== null && hoveredRect && (
          <RuleClueTooltip
            key={`${isDay2 ? 'case-2' : 'case-1'}-${hoveredRuleId}`}
            anchor={hoveredRect}
            ruleId={hoveredRuleId}
            clues={ARTICLES.find(article => article.id === hoveredRuleId)?.clues ?? []}
            progressItems={getRuleProgressItems(hoveredRuleId)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export const AelScanApp: React.FC = () => {
  const { state: gameState } = useGameState();
  return gameState.currentDay === 3 ? <Case3AelScan /> : <LegacyAelScanApp />;
};

export default AelScanApp;
