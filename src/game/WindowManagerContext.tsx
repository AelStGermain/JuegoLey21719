import React, { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import { WindowState, WindowManagerState } from './types';
import { createDefaultWindows, DEFAULT_WINDOWS, prepareWindowsForCase } from './windowWorkspace';

interface WindowManagerContextProps {
  state: WindowManagerState;
  openWindow: (id: string, title?: string) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  autoArrange: () => void;
  prepareCaseWorkspace: (day: number) => void;
}

const WindowManagerContext = createContext<WindowManagerContextProps | undefined>(undefined);

export const WindowManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<WindowState[]>(createDefaultWindows);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);

  const openWindow = useCallback((id: string, title?: string) => {
    if (!DEFAULT_WINDOWS.some(window => window.id === id)) return;

    setWindows(prev => {
      const nextZIndex = Math.max(...prev.map(w => w.zIndex), 0) + 1;
      const registeredWindow = prev.find(w => w.id === id);

      if (!registeredWindow) {
        const defaultWindow = DEFAULT_WINDOWS.find(w => w.id === id);
        if (!defaultWindow) return prev;

        return [
          ...prev,
          {
            ...defaultWindow,
            title: title || defaultWindow.title,
            isOpen: true,
            isMinimized: false,
            zIndex: nextZIndex,
          },
        ];
      }

      return prev.map(w => {
        if (w.id === id) {
          return {
            ...w,
            isOpen: true,
            isMinimized: false,
            zIndex: nextZIndex,
            title: title || w.title
          };
        }
        return w;
      });
    });
    setActiveWindowId(id);
  }, []);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev =>
      prev.map(w => {
        if (w.id === id) {
          return { ...w, isOpen: false };
        }
        return w;
      })
    );
    setActiveWindowId(activeId => activeId === id ? null : activeId);
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev =>
      prev.map(w => {
        if (w.id === id) {
          return { ...w, isMinimized: true };
        }
        return w;
      })
    );
    setActiveWindowId(activeId => activeId === id ? null : activeId);
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setWindows(prev => {
      const nextZIndex = Math.max(...prev.map(window => window.zIndex), 0) + 1;
      return prev.map(w => {
        if (w.id === id) {
          return { ...w, isMaximized: !w.isMaximized, isMinimized: false, zIndex: nextZIndex };
        }
        return w;
      });
    });
    setActiveWindowId(id);
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindows(prev => {
      const nextZIndex = Math.max(...prev.map(window => window.zIndex), 0) + 1;
      return prev.map(w => {
        if (w.id === id) {
          return { ...w, zIndex: nextZIndex, isMinimized: false };
        }
        return w;
      });
    });
    setActiveWindowId(id);
  }, []);

  const updateWindowPosition = useCallback((id: string, x: number, y: number) => {
    setWindows(prev =>
      prev.map(w => {
        if (w.id === id) {
          return { ...w, position: { x, y } };
        }
        return w;
      })
    );
  }, []);

  const autoArrange = useCallback(() => {
    setWindows(prev =>
      prev.map((w, index) => ({
        ...w,
        isMaximized: false,
        isMinimized: false,
        position: { x: 40 + index * 40, y: 40 + index * 40 }
      }))
    );
  }, []);

  const prepareCaseWorkspace = useCallback((day: number) => {
    setWindows(prev => prepareWindowsForCase(prev, day));
    setActiveWindowId(day === 2 ? 'aelchat' : 'mail');
  }, []);

  const value = useMemo<WindowManagerContextProps>(() => ({
    state: { windows, activeWindowId },
    openWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    focusWindow,
    updateWindowPosition,
    autoArrange,
    prepareCaseWorkspace,
  }), [
    windows,
    activeWindowId,
    openWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    focusWindow,
    updateWindowPosition,
    autoArrange,
    prepareCaseWorkspace,
  ]);

  return (
    <WindowManagerContext.Provider value={value}>
      {children}
    </WindowManagerContext.Provider>
  );
};

// Kept with the provider so the window API remains a single, explicit module.
// oxlint-disable-next-line react/only-export-components
export const useWindowManager = () => {
  const context = useContext(WindowManagerContext);
  if (!context) {
    throw new Error('useWindowManager must be used within a WindowManagerProvider');
  }
  return context;
};
