/**
 * Canonical evidence-to-Regulation mapping.
 * Only elements listed here are confirmed privacy infringements and may be dragged.
 */
export const CASE1_INFRACTION_RULE_BY_ELEMENT: Record<string, number> = {
  'col-historial_medico': 1,
  'col-religion': 2,
  'col-rut': 3,
  'email-cc-header': 3,
};

export const CASE1_INFRACTION_RULES_BY_ELEMENT: Record<string, number[]> = {
  'col-historial_medico': [1, 2, 3],
  'col-religion': [2, 1, 3],
  'col-rut': [3],
  'email-cc-header': [3, 1],
};

export interface Case2EvidenceDefinition {
  label: string;
  source: 'chat-message' | 'chat-profile' | 'chat-membership' | 'excel-workbook';
  ruleIds: number[];
}

/** Only these seven elements are draggable infringements in Case 2. */
export const CASE2_EVIDENCE_CATALOG: Record<string, Case2EvidenceDefinition> = {
  'ev-ch-msg-depression': {
    label: 'Mensaje que revela el diagnóstico de depresión de Camila',
    source: 'chat-message',
    ruleIds: [1, 2, 3],
  },
  'ev-ch-msg-dejala': {
    label: 'Mensaje que propone conservar a Javiera “por si acaso”',
    source: 'chat-message',
    ruleIds: [2, 3],
  },
  'ev-ch-profile-javiera-inactive': {
    label: 'Perfil que muestra a Javiera inactiva pero aún como miembro activo del Chat',
    source: 'chat-profile',
    ruleIds: [3, 2],
  },
  'ev-ch-msg-file-shared': {
    label: 'Mensaje donde Carolina comparte la planilla de personal en el Chat',
    source: 'chat-message',
    ruleIds: [3, 2],
  },
  'ev-ch-file-agosto': {
    label: 'Nombre del libro personal_sucursal_agosto.xlsx abierto en Excel',
    source: 'excel-workbook',
    ruleIds: [3, 2],
  },
  'ev-ch-msg-deudas': {
    label: 'Mensaje que revela las deudas personales de Felipe',
    source: 'chat-message',
    ruleIds: [3, 2, 1],
  },
  'ev-ch-msg-control-orig': {
    label: 'Mensaje que admite acceso libre de RRHH a todas las fichas',
    source: 'chat-message',
    ruleIds: [4, 3],
  },
};

export const CASE2_INFRACTION_RULES_BY_EVIDENCE: Record<string, number[]> = Object.fromEntries(
  Object.entries(CASE2_EVIDENCE_CATALOG).map(([evidenceId, definition]) => [evidenceId, definition.ruleIds]),
);

/** Seven self-sufficient evidences map one-to-one to seven documented findings. */
export const CASE2_FINDING_EVIDENCE_IDS: Record<string, string[]> = {
  'lead-ex-worker-access-resolved': ['ev-ch-profile-javiera-inactive'],
  'lead-medical-disclosure-resolved': ['ev-ch-msg-depression'],
  'lead-financial-disclosure-resolved': ['ev-ch-msg-deudas'],
  'lead-retention-by-chance-resolved': ['ev-ch-msg-dejala'],
  'lead-file-shared-in-chat-resolved': ['ev-ch-msg-file-shared'],
  'lead-workbook-exposure-resolved': ['ev-ch-file-agosto'],
  'lead-control-orig-resolved': ['ev-ch-msg-control-orig'],
};

export const CASE2_FINDING_RULE_IDS: Record<string, number> = {
  'lead-ex-worker-access-resolved': 3,
  'lead-medical-disclosure-resolved': 1,
  'lead-financial-disclosure-resolved': 3,
  'lead-retention-by-chance-resolved': 2,
  'lead-file-shared-in-chat-resolved': 3,
  'lead-workbook-exposure-resolved': 3,
  'lead-control-orig-resolved': 4,
};

export const CASE2_INFRACTION_EVIDENCE_IDS = Object.keys(CASE2_INFRACTION_RULES_BY_EVIDENCE);
export const CASE2_FINDING_IDS = Object.keys(CASE2_FINDING_EVIDENCE_IDS);

/** Each corrective action explicitly covers the findings it resolves. */
export const CASE2_MITIGATION_FINDING_IDS: Record<string, string[]> = {
  'javiera-disculpa': [
    'lead-ex-worker-access-resolved',
    'lead-retention-by-chance-resolved',
  ],
  'aviso-grupal': [
    'lead-medical-disclosure-resolved',
    'lead-financial-disclosure-resolved',
  ],
  'eliminar-archivo': [
    'lead-file-shared-in-chat-resolved',
    'lead-workbook-exposure-resolved',
    'lead-control-orig-resolved',
  ],
};

export const getDocumentedCase2EvidenceIds = (resolvedIds: string[]) => (
  Array.from(new Set(
    Object.entries(CASE2_FINDING_EVIDENCE_IDS)
      .filter(([findingId]) => resolvedIds.includes(findingId))
      .flatMap(([, evidenceIds]) => evidenceIds),
  ))
);

export const getCase2FindingIdForEvidence = (evidenceId: string) => (
  Object.entries(CASE2_FINDING_EVIDENCE_IDS)
    .find(([, evidenceIds]) => evidenceIds.includes(evidenceId))?.[0]
);

export const isCase2EvidenceResolved = (evidenceId: string, resolvedIds: string[]) => {
  const findingId = getCase2FindingIdForEvidence(evidenceId);
  return Boolean(findingId && resolvedIds.includes(findingId));
};

export const getRuleTokens = (ruleIds: number[] | undefined) => ruleIds?.join(' ');
