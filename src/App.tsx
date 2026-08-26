import React, { useState, useEffect } from 'react';
import { GameStateProvider, useGameState } from './game/GameStateContext';
import { WindowManagerProvider, useWindowManager } from './game/WindowManagerContext';
import Desktop from './desktop/Desktop';
import MailApp from './applications/mail/MailApp';
import SpreadsheetApp from './applications/spreadsheet/SpreadsheetApp';
import AelScanApp from './applications/aelscan/AelScanApp';
import AelChatApp from './applications/aelchat/AelChatApp';
import SplashScreen from './components/SplashScreen';
import ExperienceScreen, { SHOW_GAME_INTRO_EVENT } from './components/ExperienceScreen';
import { Mail, FileSpreadsheet, ShieldAlert, Volume2, VolumeX, RefreshCw, MessageSquare } from 'lucide-react';
import { playSound } from './components/sound';
import { getCaseProgressPosition, isApplicationAvailableInCase } from './desktop/caseApplications';
import { Case4Provider } from './game/Case4Context';

type MobileAppId = 'mail' | 'spreadsheet' | 'aelscan' | 'aelchat';

const ResponsiveLayout: React.FC = () => {
  const { state: gameState, toggleSound, resetGame, progressDay } = useGameState();
  const { openWindow } = useWindowManager();
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<MobileAppId>('mail');
  const [hasEntered, setHasEntered] = useState<boolean>(false);

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
            onClick={() => { resetGame(); setHasEntered(false); }}
            title="Reiniciar Simulación"
          >
            <RefreshCw size={12} />
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

      {/* Mobile case transition — one click anywhere advances. */}
      {gameState.workdayStatus === 'transitioning' && (
        gameState.currentDay === 1 ? (
          <ExperienceScreen
            theme="case2"
            eyebrow="MedVibe · Segundo día"
            title="Te agregaron a un grupo."
            lead="Eres parte del equipo de MedVibe y acabas de entrar al grupo de Administración. Mientras lees la conversación, notas que se comentan asuntos personales y que hay personas que quizá ya no deberían tener acceso."
            caseLabel="Caso 2 · Comunicación y acceso"
            caseTitle="Una conversación que parecía rutinaria."
            description="Carolina está reorganizando turnos y comparte una planilla de personal. Lee lo que ocurrió, revisa quiénes siguen en el grupo y comprueba qué información quedó disponible."
            steps={[
              'Lee los mensajes y revisa los perfiles y archivos del grupo.',
              'Abre la planilla compartida y lleva los 7 hallazgos a AelScan.',
              'Cuando termines, vuelve al Chat y realiza las 3 acciones disponibles.',
            ]}
            tools={['Chat', 'Excel', 'AelScan']}
            metrics={[
              { value: '7', label: 'evidencias' },
              { value: '4', label: 'pilares' },
              { value: '3', label: 'acciones finales' },
            ]}
            continueLabel="Haz clic para entrar al Caso 2"
            onContinue={() => {
              progressDay(2, null, { workdayProgressed: true });
              setActiveTab('aelchat');
              openWindow('aelchat');
              playSound.chime(gameState.soundEnabled);
            }}
          />
        ) : gameState.currentDay === 2 ? (
          <ExperienceScreen
            theme="case2"
            eyebrow="MedVibe · Último minuto"
            title="Evita que este correo salga mal."
            lead="RRHH está por enviar un aviso de pago a todo el personal. Hay tres cosas extrañas que debes encontrar antes de enviarlo."
            caseLabel="Caso 4 · El correo equivocado"
            caseTitle="Una revisión rápida antes de enviar."
            description="Primero puedes mirar con calma. Cuando estés listo, inicia la revisión y comprueba quién lo recibirá, qué contiene y quién podrá verlo."
            steps={[
              'Haz clic en los destinatarios y busca una dirección extraña.',
              'Decide si 238 personas deben ver las direcciones de los demás.',
              'Abre los dos adjuntos y conserva solo lo necesario.',
            ]}
            tools={['Mail', 'Excel', 'AelScan']}
            metrics={[
              { value: '90 s', label: 'revisión normal' },
              { value: '3', label: 'problemas ocultos' },
              { value: '2', label: 'adjuntos' },
            ]}
            continueLabel="Haz clic para abrir el correo pendiente"
            onContinue={() => {
              progressDay(4, {
                id: 'case4-scheduled-mail',
                title: 'Envío programado pendiente de revisión',
                message: 'RRHH programó una comunicación masiva. AelMail espera tu revisión antes de iniciar la cuenta regresiva.',
                appToOpen: 'mail',
              }, { case4Started: true });
              setActiveTab('mail');
              openWindow('mail');
              playSound.chime(gameState.soundEnabled);
            }}
          />
        ) : (
          <ExperienceScreen
            theme="complete"
            eyebrow="Auditoría finalizada"
            title="Terminaste tu jornada."
            lead="Revisaste información compartida, accesos desactualizados y un correo programado que podía exponer datos personales."
            caseLabel="Simulación completada"
            caseTitle="¡Completaste todas las simulaciones!"
            description="La mejor respuesta reduce la exposición, deja registro y activa a quienes pueden corregir el problema."
            result={<div className="experience-result"><strong>✓ Medidas registradas</strong>Los hallazgos y las acciones correctivas quedaron documentados.</div>}
            steps={[
              'Reconociste situaciones que comprometían más de un pilar.',
              'Documentaste cada evidencia una sola vez.',
              'Completaste acciones aplicables al trabajo diario.',
            ]}
            tools={[]}
            metrics={[
              { value: '3/3', label: 'casos completados' },
              { value: '14', label: 'evidencias revisadas' },
              { value: '100%', label: 'bitácora cerrada' },
            ]}
            credit={{
              name: 'Sofía Gómez',
              label: 'AelStGermain',
              href: 'https://github.com/AelStGermain',
              portfolio: {
                label: 'Ver portafolio',
                href: 'https://aelstgermain.github.io/Aelita/',
              },
            }}
            continueLabel="Haz clic para volver a jugar"
            onContinue={() => {
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
      <Case4Provider>
        <WindowManagerProvider>
          <ResponsiveLayout />
        </WindowManagerProvider>
      </Case4Provider>
    </GameStateProvider>
  );
};

export default App;
