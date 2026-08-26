# Game Design & Scenario Engine - AelCase

This document details the game state, the structure of the Scenario Engine, evidence mechanics, and the narrative consequence engine.

## Separation of States

To maintain a clean and performant architecture, state is divided into two contexts:

### 1. WindowManager State
Tracks layout configurations only. Re-renders in this context do not trigger checks in the scenario engine.
```typescript
export interface WindowState {
  id: string; // 'mail', 'spreadsheet', 'aelchat'
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
}

export interface WindowManagerState {
  windows: WindowState[];
  activeWindowId: string | null;
}
```

### 2. GameState
Tracks simulation progression, settings, and player inputs.
```typescript
export interface GameState {
  currentDay: number; // Day 1, Day 2, etc.
  workdayStatus: 'active' | 'transitioning' | 'finished';
  evidenceFound: string[]; // IDs of discovered evidence
  decisionsMade: Record<string, string>; // decisionId -> choiceId
  flags: Record<string, any>; // Persistent consequences: { applicantArchiveExists: true }
  soundEnabled: boolean;
  activeNotification: {
    id: string;
    title: string;
    message: string;
    appToOpen?: string;
  } | null;
}
```

---

## Diegetic Workday Progression

We avoid non-diegetic game buttons like "Next Day" or "Finish Level". Progression happens naturally through simulated work actions:

```
[ User reviews Mail ] ──► [ Inspects Spreadsheet ] ──► [ Executes AelScan ]
                                                              │
                                                              ▼
[ New incoming Mail/Chat Alert ] ◄── [ Day 2: Login Banner ] ◄── [ Cierre de Jornada (Lock Screen) ] ◄── [ User clicks 'Responder' / Sends Email ]
```

### Action Cycle:
1. **The Brief**: Day begins with an email/chat notification from a colleague requesting data sharing.
2. **Investigation**: User hunts for evidence and runs AelScan inside the workplace simulator.
3. **Resolution**: The user replies to the email or resolves the work ticket. In the reply panel, they choose how to act (e.g. send the raw sheet, send a cleaned version, or refuse/escalate).
4. **Shutdown Transition**: Clicking "Enviar Respuesta" triggers a simulated workday shutdown overlay ("Cierre de Jornada... Guardando bitácora de cumplimiento...").
5. **Consequence Loading**: The screen transitions to a login screen or a "Siguiente Jornada" banner. The player logs in again, receiving new emails reflecting the consequences of their previous day's decision.

---

## Scenario 1 Layout: The HR Data Incident

### Backstory
A recruiter (Sofía) at the healthcare startup **MedVibe** wants to share the applicant profiles for a senior role with an external marketing agency manager (Martín) to check their public reputation. She CCs the email to an external vendor list and attaches an unencrypted spreadsheet containing candidate profiles.

### Document 1: Email in `MailApp`
* **From**: `sofia.valenzuela@medvibe.test`
* **To**: `martin.reyes@agency-digital.test`
* **Cc**: `info@vendorservices.test` (An external generic vendor list! **RISK**)
* **Subject**: Perfiles postulantes para Consultor de Salud Senior
* **Attachment**: `postulantes_2026_q3.xlsx`

### Document 2: Spreadsheet `postulantes_2026_q3.xlsx` in `SpreadsheetApp`
Contains:
1. `Nombre` (Personal Data)
2. `Email` (Personal Data)
3. `RUT` (National ID - Personal Data)
4. `Historial Médico` (Sensitive Personal Data - Health details. **HIGH RISK**)
5. `Religión` (Sensitive Personal Data. **HIGH RISK**)
6. `Sueldo Pretendido` (Personal Data)

### Evidences to Locate:
1. **Email CC**: Exposes applicant records to unauthorized third parties (`info@vendorservices.test`).
2. **Spreadsheet Columns (Historial Médico & Religión)**: Sensitive personal data shared without consent or purpose.
3. **Spreadsheet Column (RUT)**: National ID sent in clear text to external providers without security controls.

### Decision Choices:
* **Choice 1: Enviar planilla completa (como fue solicitada).**
  * *Consequence*: Set `flags.exposedApplicants = true`. Day 2 Email Alert: "Incidente de Filtración: Se detecta que datos médicos de 15 postulantes se filtraron en foros externos. La empresa enfrenta una auditoría interna de la Agencia de Datos."
* **Choice 2: Enviar versión sanitizada y corregir destinatarios (enviar solo Nombre/Email a Martín).**
  * *Consequence*: Set `flags.exposedApplicants = false`. Day 2 Email Alert: "Contratación exitosa de consultor. Se felicita al área por aplicar buenas prácticas de minimización de datos."
* **Choice 3: Rechazar envío por falta de consentimiento explícito.**
  * *Consequence*: Set `flags.hiringDelayed = true`. Day 2 Email Alert: "Proceso de contratación retrasado temporalmente. El área legal implementa el formulario de consentimiento obligatorio para el próximo trimestre."
