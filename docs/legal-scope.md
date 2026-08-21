# Legal Scope (Chilean Law 21.719) - AelCase

This document details the legal principles from Chile's Personal Data Protection Law (Ley 21.719) integrated into AelCase, alongside the educational strategy and outcome terminology.

## Key Law 21.719 Concepts in Scenario 1

Chile's Ley 21.719 updates the legal framework for personal data processing, introducing strict rules and establishing a supervising authority (Agencia de Protección de Datos Personales).

1. **Dato Personal (Personal Data)**:
   * *Definition*: Information relating to an identified or identifiable natural person.
   * *In-game representation*: Names, personal emails, and Chilean National ID (RUT) in the HR spreadsheet.
2. **Dato Personal Sensible (Sensitive Personal Data)**:
   * *Definition*: Data referring to physical/mental health, biological/genetic data, ideology, religion, union membership, or sexual life. Under Ley 21.719, processing sensitive data is prohibited unless authorized by law, or with explicit, informed, written consent.
   * *In-game representation*: The "Historial Médico" and "Religión" fields in the applicant spreadsheet.
3. **Principio de Finalidad (Purpose Limitation)**:
   * *Definition*: Personal data must be collected for specific, explicit, and legitimate purposes, and cannot be processed for purposes incompatible with those.
   * *In-game representation*: HR is sending applicant data to a marketing vendor to run reputation tests, which goes beyond the original purpose of recruiting.
4. **Principio de Proporcionalidad (Proportionality/Data Minimization)**:
   * *Definition*: Only personal data that is adequate, relevant, and strictly limited to what is necessary for the purposes of the processing may be collected/shared.
   * *In-game representation*: The recruitment firm only needs to send candidate names and resumes/portfolios to recruiters, not their detailed medical histories or religious beliefs.
5. **Principio de Seguridad y Confidencialidad (Security & Confidentiality)**:
   * *Definition*: Implement appropriate technical and organizational measures to protect data from unauthorized access or accidental leaks.
   * *In-game representation*: CCing a generic, external vendor list exposes the applicants' data, constituting a confidentiality breach.

---

## Outcome Terminology (No Legal Verdicts)

AelCase avoids definitive binary verdicts like "Compliant" (Cumple) or "Non-Compliant" (Incumple). Legal status is complex and contextual. Instead, the simulation displays **observable, objective metrics of privacy posture**:

* **Exposición de Datos**: High / Medium / Low (indicating if sensitive data columns were transmitted).
* **Nivel de Proporcionalidad**: Calculated based on the ratio of necessary data fields shared vs. unnecessary fields sent.
* **Destinatarios Autorizados**: Verification of whether the message recipients had a legitimate business need to access the information.
* **Medidas de Seguridad**: Detects if encryption, anonymization, or pseudonymization was applied before transmission.
* **Recomendación de Auditoría**: Suggests legal reviews or administrative changes required to align with industry best practices.

### Example Outcome Interface:

```text
┌──────────────────────────────────────────────────────────┐
│ 📊 Métrica de Impacto de la Decisión                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│   • Destinatarios expuestos: 3 (incluye 1 lista externa) │
│   • Registros de datos sensibles enviados: 15            │
│   • Tipo de datos expuestos: Salud y Religión            │
│   • Estado de consentimiento: No verificado              │
│                                                          │
│   Recomendación: Se sugiere revisión de procesos de      │
│   reclutamiento externos y firma de acuerdos de          │
│   confidencialidad con proveedores.                      │
│                                                          │
│ [ Continuar ]                                            │
└──────────────────────────────────────────────────────────┘
```

---

## Legal Disclaimer

AelCase is an educational game designed for portfolio demonstration and privacy training. It features a clear footer disclaimer in all screens:

> **Educativo y de Simulación**: *Este simulador se presenta exclusivamente con fines formativos y de portafolio. Las situaciones representadas son ficticias y no constituyen asesoría legal o jurídica formal bajo la Ley 21.719 u otras normativas.*
