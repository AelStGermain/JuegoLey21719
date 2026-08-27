import type { WindowState } from './types';

export const DEFAULT_WINDOWS: readonly WindowState[] = [
  {
    id: 'mail',
    title: 'AelMail - Correo Corporativo',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    zIndex: 1,
    position: { x: 50, y: 50 },
    size: { width: 760, height: 530 },
  },
  {
    id: 'spreadsheet',
    title: 'AelSheet - Editor de Planillas',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    zIndex: 1,
    position: { x: 90, y: 80 },
    size: { width: 780, height: 480 },
  },
  {
    id: 'aelchat',
    title: 'AelChat - Mensajería Corporativa',
    isOpen: false,
    isMinimized: false,
    isMaximized: false,
    zIndex: 1,
    position: { x: 140, y: 100 },
    size: { width: 680, height: 540 },
  },
];

const getPrimaryWindowId = (day: number) => day === 2 ? 'aelchat' : 'mail';

export const createDefaultWindows = (): WindowState[] => DEFAULT_WINDOWS.map(window => ({
  ...window,
  position: { ...window.position },
  size: window.size ? { ...window.size } : undefined,
}));

/**
 * Creates a deterministic workspace for a case. Besides opening the correct
 * application, this deliberately clears stale minimized/maximized and dragged
 * positions left by the preceding case.
 */
export const prepareWindowsForCase = (windows: WindowState[], day: number): WindowState[] => {
  const primaryWindowId = getPrimaryWindowId(day);
  const nextZIndex = Math.max(...windows.map(window => window.zIndex), 0) + 1;

  return createDefaultWindows().map(window => ({
    ...window,
    isOpen: window.id === primaryWindowId,
    zIndex: window.id === primaryWindowId ? nextZIndex : 1,
  }));
};
