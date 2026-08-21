import React from 'react';
import ExperienceScreen from './ExperienceScreen';

interface SplashScreenProps {
  onEnter: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onEnter }) => (
  <ExperienceScreen
    theme="intro"
    eyebrow="Bienvenido · Introducción"
    title="Aprende a actuar frente a los datos personales."
    lead="Este simulador te pone en situaciones laborales cotidianas para practicar cómo reconocer un riesgo, relacionarlo con la Ley 21.719 y tomar una decisión responsable."
    caseLabel="¿Cómo se juega?"
    caseTitle="Observa, relaciona y actúa."
    description="Investiga el entorno, usa las pistas del reglamento y decide qué harías en cada situación."
    steps={[
      'Explora correos, planillas y conversaciones de trabajo.',
      'Detecta incumplimientos y relaciónalos con los pilares aplicables de la ley.',
      'Elige acciones que reduzcan el riesgo sin detener el trabajo.',
    ]}
    tools={[]}
    metrics={[]}
    requireExplicitAction
    credit={{
      name: 'Sofía Gómez',
      label: 'AelStGermain',
      href: 'https://github.com/AelStGermain',
    }}
    continueLabel="Haz clic para comenzar"
    onContinue={onEnter}
  />
);

export default SplashScreen;
