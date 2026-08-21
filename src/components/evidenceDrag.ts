import type { DragEvent } from 'react';

let activeSource: HTMLElement | null = null;

export const beginEvidenceDrag = (event: DragEvent<HTMLElement>, label: string) => {
  const source = event.currentTarget;
  activeSource?.classList.remove('drag-source-active');
  activeSource = source;

  source.classList.add('drag-source-active');
  document.documentElement.classList.add('is-dragging-evidence');
  event.dataTransfer.effectAllowed = 'copy';

  const preview = document.createElement('div');
  preview.className = 'evidence-drag-preview';

  const icon = document.createElement('span');
  icon.className = 'evidence-drag-preview__icon';
  icon.textContent = '🔎';

  const copy = document.createElement('span');
  copy.className = 'evidence-drag-preview__copy';

  const eyebrow = document.createElement('strong');
  eyebrow.textContent = 'EVIDENCIA AGARRADA';

  const description = document.createElement('span');
  description.textContent = label;

  copy.append(eyebrow, description);
  preview.append(icon, copy);
  document.body.appendChild(preview);
  event.dataTransfer.setDragImage(preview, 28, 28);

  requestAnimationFrame(() => preview.remove());
};

export const endEvidenceDrag = () => {
  activeSource?.classList.remove('drag-source-active');
  activeSource = null;
  document.documentElement.classList.remove('is-dragging-evidence');
};
