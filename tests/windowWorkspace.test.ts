import { describe, expect, it } from 'vitest';
import { createDefaultWindows, prepareWindowsForCase } from '../src/game/windowWorkspace';

describe('prepareWindowsForCase', () => {
  it('opens a clean and visible Mail workspace for Case 3', () => {
    const staleWindows = createDefaultWindows().map(window => ({
      ...window,
      isOpen: window.id !== 'mail',
      isMinimized: window.id === 'mail',
      isMaximized: window.id === 'mail',
      position: window.id === 'mail' ? { x: 5000, y: 5000 } : window.position,
      zIndex: window.id === 'mail' ? 99 : window.zIndex,
    }));

    const prepared = prepareWindowsForCase(staleWindows, 3);
    const mail = prepared.find(window => window.id === 'mail');

    expect(mail).toMatchObject({
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      position: { x: 50, y: 50 },
    });
    expect(prepared.filter(window => window.id !== 'mail').every(window => !window.isOpen)).toBe(true);
  });

  it('opens Chat instead of reusing Mail when Case 2 begins', () => {
    const prepared = prepareWindowsForCase(createDefaultWindows(), 2);

    expect(prepared.find(window => window.id === 'aelchat')?.isOpen).toBe(true);
    expect(prepared.find(window => window.id === 'mail')?.isOpen).toBe(false);
  });
});
