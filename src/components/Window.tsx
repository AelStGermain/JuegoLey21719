import React, { useEffect, useRef } from 'react';
import { useWindowManager } from '../game/WindowManagerContext';
import { X, Minus, Square, Minimize2 } from 'lucide-react';
import { playSound } from './sound';
import { useGameState } from '../game/GameStateContext';

interface WindowProps {
  id: string;
  children: React.ReactNode;
}

export const Window: React.FC<WindowProps> = ({ id, children }) => {
  const { state: wmState, closeWindow, minimizeWindow, maximizeWindow, focusWindow, updateWindowPosition } = useWindowManager();
  const { state: gameState } = useGameState();
  const dragRef = useRef<HTMLDivElement>(null);
  const hasOpenedRef = useRef(false);
  const removeDragListenersRef = useRef<(() => void) | null>(null);

  useEffect(() => () => {
    removeDragListenersRef.current?.();
  }, []);
  
  const win = wmState.windows.find(w => w.id === id);

  if (win?.isOpen) hasOpenedRef.current = true;
  if (!win || !hasOpenedRef.current) return null;

  const isActive = wmState.activeWindowId === id;
  const isHidden = !win.isOpen || win.isMinimized;

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // If clicking close/minimize buttons, don't drag
    if ((e.target as HTMLElement).closest('.window-btn')) return;
    
    focusWindow(id);
    playSound.click(gameState.soundEnabled);

    if (win.isMaximized) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = win.position.x;
    const initialY = win.position.y;

    removeDragListenersRef.current?.();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      // Keep inside bounds roughly
      const newX = Math.max(0, Math.min(window.innerWidth - 100, initialX + dx));
      const newY = Math.max(0, Math.min(window.innerHeight - 80, initialY + dy));
      
      updateWindowPosition(id, newX, newY);
    };

    const removeDragListeners = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      removeDragListenersRef.current = null;
    };

    const handleMouseUp = () => removeDragListeners();

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    removeDragListenersRef.current = removeDragListeners;
  };

  const handleDoubleClickTitle = () => {
    maximizeWindow(id);
  };

  // Styles based on maximized state
  const windowStyle: React.CSSProperties = win.isMaximized
    ? {
        position: 'absolute',
        top: '40px', // Taskbar offset/workspace top
        left: 0,
        width: '100%',
        height: 'calc(100% - 80px)', // taskbar + header height
        zIndex: win.zIndex,
      }
    : {
        position: 'absolute',
        left: `${win.position.x}px`,
        top: `${win.position.y}px`,
        width: win.size?.width || '600px',
        height: win.size?.height || '400px',
        zIndex: win.zIndex,
      };

  // App color profiles
  const activeGradients: Record<string, string> = {
    mail: 'linear-gradient(105deg, #0ea5e9 0%, #6366f1 100%)',
    spreadsheet: 'linear-gradient(105deg, #10b981 0%, #22c55e 55%, #84cc16 100%)',
    aelchat: 'linear-gradient(105deg, #8b5cf6 0%, #ec4899 100%)',
  };

  const activeShadows: Record<string, string> = {
    mail: '0 8px 32px rgba(14, 165, 233, 0.35)',
    spreadsheet: '0 8px 32px rgba(16, 185, 129, 0.35)',
    aelchat: '0 8px 32px rgba(139, 92, 246, 0.35)',
  };

  const activeBorders: Record<string, string> = {
    mail: '2px solid #0284c7',
    spreadsheet: '2px solid #059669',
    aelchat: '2px solid #7c3aed',
  };

  return (
    <div
      className={`bevel-raised animate-open app-window app-window--${id} ${win.isMaximized ? 'is-maximized' : ''}`}
      style={{
        ...windowStyle,
        display: isHidden ? 'none' : 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: isActive ? (activeShadows[id] || '0 8px 24px rgba(0,0,0,0.25)') : 'var(--shadow-retro)',
        border: isActive ? (activeBorders[id] || '2px solid #3b82f6') : '2px solid #94a3b8',
        borderRadius: '18px',
        pointerEvents: 'auto',
      }}
      onClick={() => focusWindow(id)}
    >
      {/* Title bar */}
      <div
        ref={dragRef}
        className={`window-titlebar ${isActive ? 'active' : ''}`}
        style={{
          background: isActive ? (activeGradients[id] || 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)') : 'linear-gradient(90deg, #e2e8f0, #f8fafc)',
          color: isActive ? 'white' : '#64748b',
          transition: 'all 0.2s ease',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 10px',
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClickTitle}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', pointerEvents: 'none', fontWeight: 'bold', fontSize: '0.8rem' }}>
          {win.title}
        </span>
        <div className="window-controls" style={{ display: 'flex', gap: '3px' }}>
          <button
            className="window-btn"
            title="Minimizar"
            onClick={(event) => {
              event.stopPropagation();
              playSound.click(gameState.soundEnabled);
              minimizeWindow(id);
            }}
          >
            <Minus size={10} strokeWidth={3} />
          </button>
          <button
            className="window-btn"
            title={win.isMaximized ? 'Restaurar' : 'Maximizar'}
            onClick={(event) => {
              event.stopPropagation();
              playSound.click(gameState.soundEnabled);
              maximizeWindow(id);
            }}
          >
            {win.isMaximized ? <Minimize2 size={10} strokeWidth={3} /> : <Square size={8} strokeWidth={3} />}
          </button>
          <button
            className="window-btn"
            style={{ marginLeft: '4px' }}
            title="Cerrar"
            onClick={(event) => {
              event.stopPropagation();
              playSound.click(gameState.soundEnabled);
              closeWindow(id);
            }}
          >
            <X size={10} strokeWidth={3} />
          </button>
        </div>
      </div>
      
      {/* Inner client area */}
      <div
        className="bevel-inset"
        style={{
          flex: 1,
          overflow: 'auto',
          background: 'var(--bg-slate-light)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    </div>
  );
};
export default Window;
