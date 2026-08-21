# Technical Architecture - AelCase

This document details the software architecture for AelCase, an interactive privacy decision simulator based on Chile's Personal Data Protection Law (Ley 21.719).

## Tech Stack & Core Decisions
1. **Frontend Core**: React 19, TypeScript, Vite.
2. **Styling**: Vanilla CSS with global design tokens and component-specific stylesheets.
3. **Deployment**: GitHub Pages (fully static, zero backend dependencies).
4. **State Management**: Dual Context Providers to separate UI state from Game state.
5. **Testing**: Vitest + React Testing Library (for logic and UI verification).

---

## Architectural Layers

AelCase separates concerns into four major layers:

```
┌──────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│   (Desktop Container, Interactive Application Views)     │
└─────────────┬──────────────────────────────┬─────────────┘
              │                              │
              ▼                              ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│  WindowManager Context   │    │    GameState Context     │
│ (Window positions, focus,│    │(Evidence, decisions,     │
│  min/max, active lists)  │    │ consequences, notifications)
└──────────────────────────┘    └────────────┬─────────────┘
                                             │
                                             ▼
                                ┌──────────────────────────┐
                                │  Privacy Analysis Layer  │
                                │(Detection Engine, Rules) │
                                └────────────┬─────────────┘
                                             │
                                             ▼
                                ┌──────────────────────────┐
                                │      Content Layer       │
                                │(Campaign, legal facts)   │
                                └──────────────────────────┘
```

### 1. Presentation Layer
Responsible for rendering the simulated OS environment and routing user interactions.
* **Desktop Component**: Renders the desktop wallpaper, taskbar, system clock, shortcuts, and active notification panel.
* **Simulated Apps**: App components (`MailApp`, `SpreadsheetApp`, `AelScanApp`) consume state from both Contexts and render within a generic `Window` wrapper.

### 2. WindowManager Context (UI State Domain)
Manages desktop-specific layouts and interactions. By isolating this state, window-dragging or minimizing doesn't trigger re-renders or updates in the core gameplay engine:
* Tracks which windows are open, minimized, or maximized.
* Tracks window position coordinate offsets.
* Manages Z-index focus stack.

### 3. GameState Context (Core Gameplay Domain)
Coordinates progression, found evidence, player choices, and narrative consequences:
* **Evidence Tracker**: Checklist of discovered evidence.
* **Decision Register**: Saves player choices (e.g. sanitizing vs sending unredacted data).
* **Consequence Flags**: State keys representing the world's status (e.g., `exposedApplicants: true`).
* **Sound Config**: User preferences for system volume and mute options.
* **Workflow Progression**: Manages the diegetic step transitions (e.g. sending the email triggers a workday shift, which loads the next narrative step).

### 4. Privacy Analysis Layer
Handles the automated scanning of text and datasets.
* **Decoupled Architecture**: All scanner components talk to a abstract `PrivacyDetectionEngine` interface.
* **Rule-Based Prototype (Phase 1)**: Employs regex and keyword analysis. Represents a deterministic prototype. Can be swapped for a real LLM/local model in Phase 2 without changing UI components.

### 5. Content Layer
Stateless data defining the scenarios, text files, emails, and legal rule explanations.

---

## Folder Structure

```text
aelcase/
├── docs/                     # Design and technical documentation
│   ├── architecture.md
│   ├── ux-design.md
│   ├── game-design.md
│   ├── ai-design.md
│   └── legal-scope.md
├── src/
│   ├── components/           # Reusable controls (Buttons, Window, Toggle)
│   ├── content/              # Scenario definitions, copy, legal details
│   │   ├── scenario_1.ts     # HR incident scenario definition
│   │   ├── scenario_2.ts     # Chat and access scenario definition
│   │   └── scenario_3.ts     # Form-review scenario definition
│   ├── desktop/              # OS container, desktop grid, taskbar, clock
│   ├── applications/         # Specific application modules
│   │   ├── mail/             # Email client
│   │   ├── spreadsheet/      # Spreadsheet inspector
│   │   ├── aelscan/          # Scanner panel, explainable details
│   │   ├── aelchat/          # Group chat and mitigation flow
│   │   └── aelforms/         # Form editor and preview flow
│   ├── game/                 # Game logic, state providers
│   │   ├── GameStateContext.tsx     # Game state provider
│   │   ├── gameStateReducer.ts      # Game action reducer
│   │   ├── WindowManagerContext.tsx # UI window state provider
│   │   └── types.ts                 # Type definitions
│   ├── privacy/              # Scanning interfaces and rule engine
│   │   ├── detection.ts      # PrivacyDetectionEngine interface
│   │   └── ruleDetector.ts   # Deterministic rules-based scanner
│   ├── index.css             # Global theme and desktop/application styles
│   └── main.tsx              # Application bootstrap
└── tests/                    # Vitest spec files
```
