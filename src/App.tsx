import React, { useCallback, useState, useEffect } from 'react';
import { GameStateProvider, useGameState } from './game/GameStateContext';
import { WindowManagerProvider, useWindowManager } from './game/WindowManagerContext';
import Desktop from './desktop/Desktop';
import MailApp from './applications/mail/MailApp';
import SpreadsheetApp from './applications/spreadsheet/SpreadsheetApp';
import AelScanApp from './applications/aelscan/AelScanApp';
import AelChatApp from './applications/aelchat/AelChatApp';
import SplashScreen from './components/SplashScreen';
import ExperienceScreen, { SHOW_GAME_INTRO_EVENT } from './components/ExperienceScreen';
import { Mail, FileSpreadsheet, ShieldAlert, Volume2, VolumeX, RefreshCw, MessageSquare, CircleHelp } from 'lucide-react';
import { playSound } from './components/sound';
import { getCaseProgressPosition, isApplicationAvailableInCase } from './desktop/caseApplications';
import { Case3Provider } from './game/Case3Context';
import CaseTutorial, { type CaseTutorialStep } from './components/CaseTutorial';
import CompletionScreen from './components/CompletionScreen';

type MobileAppId = 'mail' | 'spreadsheet' | 'aelscan' | 'aelchat';

const ResponsiveLayout: React.FC = () => {
  const { state: gameState, toggleSound, resetGame, progressDay, completeTutorial } = useGameState();
  const { openWindow, prepareCaseWorkspace } = useWindowManager();
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<MobileAppId>('mail');
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  const tutorialSeen = Boolean(gameState.flags[`tutorialCase${gameState.currentDay}Seen`]);

  // Detect mobile viewport size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 800);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const showIntro = () => setHasEntered(false);
    window.addEventListener(SHOW_GAME_INTRO_EVENT, showIntro);
    return () => window.removeEventListener(SHOW_GAME_INTRO_EVENT, showIntro);
  }, []);

  // Sync activeTab with WindowManager actions in mobile
  const handleTabChange = (tabId: MobileAppId) => {
    setActiveTab(tabId);
    if (tabId !== 'aelscan') {
      openWindow(tabId); // Keep movable application windows in sync.
    }
    playSound.click(gameState.soundEnabled);
  };

  useEffect(() => {
    setActiveTab(gameState.currentDay === 2 ? 'aelchat' : 'mail');
  }, [gameState.currentDay]);

  useEffect(() => {
    if (!hasEntered || !isMobile || gameState.workdayStatus !== 'active') {
      setTutorialOpen(false);
      return;
    }
    setTutorialOpen(!tutorialSeen);
  }, [gameState.currentDay, gameState.workdayStatus, hasEntered, isMobile, tutorialSeen]);

  const handleMobileTutorialStep = useCallback((step: CaseTutorialStep) => {
    if (!step.appId) return;
    setActiveTab(step.appId);
    if (step.appId !== 'aelscan') openWindow(step.appId);
  }, [openWindow]);

  const handleMobileTutorialComplete = useCallback(() => {
    completeTutorial(gameState.currentDay);
    setTutorialOpen(false);
    const startingApp: MobileAppId = gameState.currentDay === 2 ? 'aelchat' : 'mail';
    setActiveTab(startingApp);
    openWindow(startingApp);
    playSound.chime(gameState.soundEnabled);
  }, [completeTutorial, gameState.currentDay, gameState.soundEnabled, openWindow]);

  // If not mobile, render the full multi-window desktop
  if (!hasEntered) {
    return <SplashScreen onEnter={() => setHasEntered(true)} />;
  }

  if (!isMobile) {
    return <Desktop />;
  }

  // Mobile navigation interface (single active app layout)
  return (
    <div
      className={`mobile-shell day-${gameState.currentDay}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        background: '#1e293b',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Mobile Header Bar */}
      <div
        className="bevel-raised mobile-topbar"
        style={{
          padding: '8px 12px',
          background: 'var(--chrome-base)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid var(--chrome-light)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 'bold', fontSize: '1rem', color: 'var(--bg-slate-dark)' }}>AelOS Mobile</span>
          <span style={{ fontSize: '0.7rem', color: '#475569' }}>
            Caso {gameState.currentDay} · Etapa {getCaseProgressPosition(gameState.currentDay)} / 3
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {/* Sound Toggle */}
          <button
            className={`retro-btn ${gameState.soundEnabled ? 'primary' : ''}`}
            style={{ padding: '4px 8px' }}
            onClick={() => toggleSound()}
          >
            {gameState.soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
          </button>

          {/* Reset button */}
          <button
            className="retro-btn primary"
            style={{ padding: '4px 8px' }}
            onClick={() => { prepareCaseWorkspace(1); resetGame(); setHasEntered(false); }}
            title="Reiniciar Simulación"
          >
            <RefreshCw size={12} />
          </button>

          <button
            className="retro-btn tutorial-replay-button"
            style={{ padding: '4px 8px' }}
            onClick={() => {
              setTutorialOpen(true);
              playSound.click(gameState.soundEnabled);
            }}
            title={`Ver guía del Caso ${gameState.currentDay}`}
            aria-label={`Ver guía del Caso ${gameState.currentDay}`}
          >
            <CircleHelp size={13} />
          </button>
        </div>
      </div>

      {/* Main view container */}
      <div className="mobile-app-stage" style={{ flex: 1, overflow: 'hidden', background: 'white', position: 'relative' }}>
        {isApplicationAvailableInCase(gameState.currentDay, 'mail') && (
          <div hidden={activeTab !== 'mail'} style={{ width: '100%', height: '100%' }}><MailApp /></div>
        )}
        {isApplicationAvailableInCase(gameState.currentDay, 'spreadsheet') && (
          <div hidden={activeTab !== 'spreadsheet'} style={{ width: '100%', height: '100%' }}><SpreadsheetApp /></div>
        )}
        <div hidden={activeTab !== 'aelscan'} style={{ width: '100%', height: '100%' }}><AelScanApp /></div>
        {isApplicationAvailableInCase(gameState.currentDay, 'aelchat') && (
          <div hidden={activeTab !== 'aelchat'} style={{ width: '100%', height: '100%' }}><AelChatApp /></div>
        )}
      </div>

      {/* Mobile Tab Navigator */}
      <div
        className="bevel-raised mobile-nav"
        style={{
          height: '56px',
          background: 'var(--chrome-base)',
          borderTop: '2px solid var(--chrome-light)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '4px',
        }}
      >
        {isApplicationAvailableInCase(gameState.currentDay, 'mail') && <button
          data-tutorial-target="mail"
          onClick={() => handleTabChange('mail')}
          style={{
            flex: 1,
            height: '100%',
            background: activeTab === 'mail' ? 'var(--color-cyan)' : 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            fontSize: '0.75rem',
            fontWeight: activeTab === 'mail' ? 'bold' : 'normal',
            color: 'var(--text-dark)',
          }}
        >
          <Mail size={16} />
          <span>Correo</span>
        </button>}

        {isApplicationAvailableInCase(gameState.currentDay, 'spreadsheet') && <button
          data-tutorial-target="spreadsheet"
          onClick={() => handleTabChange('spreadsheet')}
          style={{
            flex: 1,
            height: '100%',
            background: activeTab === 'spreadsheet' ? 'var(--color-pistachio)' : 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            fontSize: '0.75rem',
            fontWeight: activeTab === 'spreadsheet' ? 'bold' : 'normal',
            color: 'var(--text-dark)',
          }}
        >
          <FileSpreadsheet size={16} />
          <span>Planilla</span>
        </button>}

        <button
          data-tutorial-target="aelscan"
          onClick={() => handleTabChange('aelscan')}
          style={{
            flex: 1,
            height: '100%',
            background: activeTab === 'aelscan' ? 'var(--color-yellow)' : 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            fontSize: '0.75rem',
            fontWeight: activeTab === 'aelscan' ? 'bold' : 'normal',
            color: 'var(--text-dark)',
          }}
        >
          <ShieldAlert size={16} />
          <span>AelScan</span>
        </button>

        {isApplicationAvailableInCase(gameState.currentDay, 'aelchat') && <button
          data-tutorial-target="aelchat"
          onClick={() => handleTabChange('aelchat')}
          style={{
            flex: 1,
            height: '100%',
            background: activeTab === 'aelchat' ? 'var(--color-indigo)' : 'transparent',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            fontSize: '0.75rem',
            fontWeight: activeTab === 'aelchat' ? 'bold' : 'normal',
            color: activeTab === 'aelchat' ? 'white' : 'var(--text-dark)',
          }}
        >
          <MessageSquare size={16} />
          <span>Chat</span>
        </button>}
      </div>

      <CaseTutorial
        caseId={gameState.currentDay}
        open={tutorialOpen && gameState.workdayStatus === 'active'}
        onComplete={handleMobileTutorialComplete}
        onStepChange={handleMobileTutorialStep}
      />

      {/* Mobile case transition — one click anywhere advances. */}
      {gameState.workdayStatus === 'transitioning' && (
        gameState.currentDay === 1 ? (
          <ExperienceScreen
            theme="case2"
            title="Algo discuten en el grupo."
            lead="En el Chat de Administración se compartieron datos personales y hay accesos que podrían estar desactualizados."
            caseLabel="Caso 2 · Comunicación y acceso"
            caseTitle="Una conversación que parecía rutinaria."
            description="Entra al escritorio. El tutorial te mostrará por dónde comenzar."
            steps={[]}
            tools={[]}
            metrics={[]}
            compact
            continueLabel="Comenzar Caso 2"
            onContinue={() => {
              prepareCaseWorkspace(2);
              progressDay(2, null, { workdayProgressed: true });
              setActiveTab('aelchat');
              openWindow('aelchat');
              playSound.chime(gameState.soundEnabled);
            }}
          />
        ) : gameState.currentDay === 2 ? (
          <ExperienceScreen
            theme="case2"
            title="Un correo saldrá en 30 segundos."
            lead="RRHH programó un envío masivo. Hay tres riesgos que deben corregirse antes de que termine la cuenta regresiva."
            caseLabel="Caso 3 · El correo equivocado"
            caseTitle="Revisa antes del envío."
            description="Al cerrar el tutorial comenzará inmediatamente el tiempo."
            steps={[]}
            tools={[]}
            metrics={[]}
            compact
            continueLabel="Abrir tutorial del Caso 3"
            onContinue={() => {
              prepareCaseWorkspace(3);
              progressDay(3, {
                id: 'case3-scheduled-mail',
                title: 'Envío programado pendiente de revisión',
                message: 'RRHH programó una comunicación masiva. AelMail espera tu revisión antes de iniciar la cuenta regresiva.',
                appToOpen: 'mail',
              }, { case3Started: true });
              setActiveTab('mail');
              openWindow('mail');
              playSound.chime(gameState.soundEnabled);
            }}
          />
        ) : (
          <CompletionScreen
            onRestart={() => {
              prepareCaseWorkspace(1);
              resetGame();
              setHasEntered(false);
              playSound.chime(gameState.soundEnabled);
            }}
          />
        )
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <GameStateProvider>
      <Case3Provider>
        <WindowManagerProvider>
          <ResponsiveLayout />
        </WindowManagerProvider>
      </Case3Provider>
    </GameStateProvider>
  );
};

export default App;
