# UX/UI Design & Micro-interactions - AelCase

This document details the visual style, interactive concept, layout strategy, and micro-interactions of the AelCase environment.

## Design Aesthetic: "Retro-Modern Corporate Software"
AelCase uses a clean, tactile early-2000s/late-90s OS style combined with sharp, modern product design. We avoid generic, heavy glassmorphism.

### Visual Pillars:
1. **Beveled Solid Surfaces**: Windows and panels use solid backgrounds with classic retro borders (double-bevel borders with highlight and shadow edges) that feel physical and structured.
2. **Selective Glass Effects**: Glassmorphism is used sparingly—only for transient overlays, like desktop notification alerts or context menus, to create depth without bloating the screen.
3. **Structured Typography**: High-readability fonts. Monospaced elements for data displays (e.g., JetBrains Mono) combined with a premium, geometric sans-serif for UI headers and body text (e.g., Outfit or Inter).
4. **Purposeful Contrast**: Vibrant lime, pistachio, cyan, yellow, and fuchsia elements used strictly for data labeling, alerts, and hotspots. Text and structural frames use deep charcoal/slate and crisp off-whites.

---

## Palette Tokens

| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Pistachio Green** | `#A3E635` | Accent, safe data indicators, success feedback. |
| **Cyan Blue** | `#22D3EE` | Active selection, information lens overlay, primary actions. |
| **Fuchsia Pink** | `#F43F5E` | Sensitive data, security alerts, exposure indicators. |
| **Bright Yellow** | `#FBBF24` | Warning, medium-risk items, attention indicators. |
| **Slate Dark** | `#0F172A` | Background base, deep Y2K-theme headers. |
| **Slate Light** | `#F8FAFC` | Main application content area, spreadsheet grid background. |
| **Chrome Gray** | `#E2E8F0` | Bevels, window frames, borders, disabled elements. |

---

## The Desktop Interface Layout & Window Actions
* **Drag-and-Drop handles**: Clicking and holding the beveled title bar moves the window.
* **Z-Index Focus**: Clicking inside a window raises it to the top.
* **Minimize / Restore**: Expands a window to fill the simulator area or scales it back to default size.
* **Close**: Hides the window.

---

## Privacy Lens vs. AelScan

To make the gameplay educational and challenging, we split automated assistance from human inspection:

### 1. Privacy Lens (Human Exploration Aid)
* **What it does**: When toggled ON, the Privacy Lens overlays generic classification colors over data fields to help the user identify categories (e.g., coloring names/emails in Cyan as *Dato Identificador*, and medical history in Fuchsia as *Dato Relacionado a la Salud*).
* **What it DOES NOT do**: It does not highlight which columns are "wrong" or represent a leak. It only reveals data classifications. The player must still analyze the context (e.g., "Is sharing this specific category of data with this external CC recipient proportional to the task?") to find the actual evidence.

### 2. AelScan (Automated Detection Prototype)
* **What it does**: Executes a simulated scan, yielding a diagnostic report listing identified anomalies (e.g., "3 personal identifiers, 2 sensitive fields").
* **Explainability**: Explains the logic of the rule-based flags.
* **Human-in-the-Loop**: The player must review each finding, deciding to *Accept* or *Reject* it (managing false positives).

---

## Responsive Layout Strategy

* **Desktop/Tablet Screen**: Full window-manager interface. Floating windows are draggable, stackable, and resizable.
* **Mobile Screen**: The UI automatically pivots to a single-app tab system. Instead of floating windows overlapping, the user runs the applications available for the current case full-screen. AelScan is available in Cases 1 and 2; Case 3 is completed entirely inside AelForms.

---

## Optional Audio Constraints
* **Web Audio API Synth**: Audio synthesis runs dynamically in the browser (no external files).
* **Mute Control**: A clear speaker icon is positioned in the desktop taskbar. The simulator defaults to **Muted** or respects the user's initial toggle state.
* **No Critical Audio Dependency**: Every audio cue (chime, warning sweep) has a corresponding visual feedback indicator (flashing alerts, status banners, or icon animations) so that the game can be fully played and understood without sound.
