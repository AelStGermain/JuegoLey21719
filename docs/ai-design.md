# AI Design & Extensible Scanner - AelCase

This document details the architecture of **AelScan / Privacy Scanner**, including the decoupled API interfaces and the rule-based simulation of AI behaviors.

## AI Transparency: Deterministic Prototype
In Phase 1, **AelScan does not run a machine learning model**. It is a deterministic, rule-based scanning tool designed to simulate the user experience of AI-assisted privacy analysis. We do not represent regex matching or static scenario mappings as actual AI in the user-facing documentation or engineering logs.

Instead, we use a clean code abstraction so that a true AI service can be dropped in later.

---

## Decoupled Architecture (`PrivacyDetectionEngine`)

The user interface interacts exclusively with a TypeScript interface. This separates scanning mechanics from UI rendering.

### Engine Interfaces:

```typescript
export interface PrivacyScanInput {
  text: string;
  contextType: 'email' | 'spreadsheet' | 'document' | 'form';
}

export interface PrivacyDetection {
  id: string; // unique scan detection item id
  field: string; // e.g. "RUT", "Religión", "Historial Médico"
  category: 'personal_data' | 'sensitive_data' | 'contextual_risk';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  whyFlagged: string; // Explanation of the classification
  suggestedAction: string; // e.g. "Eliminar columna", "Cifrar campo"
  startIndex?: number; // Position in text
  endIndex?: number;
}

export interface PrivacyScanResult {
  detections: PrivacyDetection[];
  riskScore: number; // 0 to 100 based on severity weightings
}

export interface PrivacyDetectionEngine {
  analyze(input: PrivacyScanInput): Promise<PrivacyScanResult>;
}
```

---

## Phase 1 Engine Implementation

We implement two engine adapters for Phase 1:

1. **`RuleBasedPrivacyDetector`**:
   * Applies regular expressions to scan text inputs.
   * Detects Chilean RUTs, standard email domains, and generic phone formats.
   * Matches semantic keywords (e.g. "salud", "diagnóstico", "creencias", "sindicato") to classify sensitive data fields.
2. **`MockAIDetector`**:
   * Returns a pre-configured list of detections for the specific document or spreadsheet active in the current scenario.
   * This is used to simulate complex contextual alerts (e.g. indicating that an CC recipient is external) without running a full natural language model.

---

## Explainable AI & Human-in-the-Loop Review

The AelScan interface highlights detections in a review dashboard:

```text
[ Detección: Historial Médico ]
Categoría: Dato Sensible (Salud)
Confianza: ALTA
Explicación: Este campo contiene información sobre el estado de salud física o mental de personas identificables. La Ley 21.719 prohíbe su tratamiento sin consentimiento expreso por escrito.

[ Aceptar Recomendación ]   [ Rechazar Recomendación ]
```

### Gameplay Interactions (Detección Errors):
* **Falsos Positivos**: AelScan flags the word "Cruz" in a name as a religious indicator. The player should select `[Rechazar Recomendación]`.
* **Falsos Negativos**: AelScan fails to detect a column labeled "Afiliación Política". The player must manually highlight this column to secure the discovery points.
* **Review Scoring**: The game tracks "Human Review Accuracy", showing the player that automated scanners are aids, and human verification remains necessary for compliance.
