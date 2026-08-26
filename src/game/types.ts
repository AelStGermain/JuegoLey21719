export interface WindowState {
  id: string; // e.g. 'mail', 'spreadsheet', 'aelchat'
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size?: { width: number | string; height: number | string };
}

export interface WindowManagerState {
  windows: WindowState[];
  activeWindowId: string | null;
}

export interface Evidence {
  id: string;
  sourceApp: 'mail' | 'spreadsheet';
  targetElementId: string; // The DOM element ID or logical target
  description: string; // e.g. "CC externo"
  category: 'personal_data' | 'sensitive_data' | 'contextual_risk';
  explanation: string; // Detailed educational feedback in Spanish
}

export interface DecisionChoice {
  id: string;
  text: string;
  consequences: {
    setFlags: Record<string, any>;
    educationalFeedback: {
      title: string;
      description: string;
      exposureLevel: 'Alto' | 'Medio' | 'Bajo';
      affectedRecipients: string;
      sensitiveDataHandled: string;
      securityMeasures: string;
      recommendations: string;
    };
  };
}

export interface ScenarioDecision {
  id: string;
  prompt: string;
  choices: DecisionChoice[];
}

export interface Email {
  id: string;
  sender: string;
  recipient: string;
  cc: string;
  subject: string;
  body: string;
  dateStr: string;
  attachment?: {
    name: string;
    type: 'spreadsheet';
    contentId: string;
  };
}

export interface SpreadsheetColumn {
  key: string;
  label: string;
  category: 'personal_data' | 'sensitive_data' | 'general';
  categoryLabel: string; // e.g. "Dato Identificador", "Dato de Salud"
}

export interface SpreadsheetData {
  columns: SpreadsheetColumn[];
  rows: Record<string, any>[];
}

export interface ScenarioConsequence {
  triggerFlag: string;
  activeNotification: {
    id: string;
    title: string;
    message: string;
    appToOpen?: string;
  };
  followUpEmail?: Email;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  emails: Email[];
  spreadsheets: Record<string, SpreadsheetData>;
  evidences: Evidence[];
  decision: ScenarioDecision;
  consequences: ScenarioConsequence[];
}

export interface GameState {
  currentDay: number;
  workdayStatus: 'active' | 'transitioning' | 'finished';
  evidenceFound: string[]; // IDs of discovered evidence
  decisionsMade: Record<string, string>; // decisionId -> choiceId
  flags: Record<string, any>;
  soundEnabled: boolean;
  activeNotification: {
    id: string;
    title: string;
    message: string;
    appToOpen?: string;
  } | null;
  selectedAuditElement: { sourceApp: 'mail' | 'spreadsheet'; elementId: string } | null;
  selectedRuleId: number | null;
}

export interface PrivacyScanInput {
  text: string;
  contextType: 'email' | 'spreadsheet' | 'document' | 'form';
}

export interface PrivacyDetection {
  id: string;
  field: string;
  category: 'personal_data' | 'sensitive_data' | 'contextual_risk';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  whyFlagged: string;
  suggestedAction: string;
  startIndex?: number;
  endIndex?: number;
}

export interface PrivacyScanResult {
  detections: PrivacyDetection[];
  riskScore: number;
}
