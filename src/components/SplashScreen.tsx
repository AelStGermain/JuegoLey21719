import React from 'react';
import ExperienceScreen from './ExperienceScreen';

interface SplashScreenProps {
  onEnter: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter }) => (
  <ExperienceScreen
    theme="intro"
    title="Bienvenido al simulador de cumplimiento"
    lead="Entra a mi simulador AelOS. Tu misión es convertirte en un agente cumplidor de la ley de protección de datos... ¡comencemos!"
    caseLabel="Caso 1"
    caseTitle="RRHH te solicita algo"
    description="Tienes un correo y una planilla pendientes de revisión. Al entrar verás una guía breve."
    steps={[]}
    tools={[]}
    metrics={[]}
    requireExplicitAction
    compact
    credit={{
      name: 'Sofía Gómez',
      label: 'AelStGermain',
      href: 'https://github.com/AelStGermain',
    }}
    continueLabel="Comenzar Caso 1"
    onContinue={onEnter}
  />
);

export default SplashScreen;
