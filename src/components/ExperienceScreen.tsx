import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  FileSpreadsheet,
  Mail,
  MessageSquare,
  MousePointerClick,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import './ExperienceScreen.css';

type ExperienceTheme = 'intro' | 'case2' | 'complete';

export const SHOW_GAME_INTRO_EVENT = 'aelos:show-game-intro';

interface ExperienceMetric {
  value: string;
  label: string;
}

interface ExperienceScreenProps {
  theme: ExperienceTheme;
  eyebrow?: string;
  title: string;
  lead: string;
  caseLabel: string;
  caseTitle: string;
  description: string;
  steps: string[];
  tools: Array<'Mail' | 'Excel' | 'Chat' | 'AelScan'>;
  metrics: ExperienceMetric[];
  continueLabel: string;
  onContinue: () => void;
  result?: React.ReactNode;
  requireExplicitAction?: boolean;
  compact?: boolean;
  credit?: {
    name: string;
    label: string;
    href: string;
    portfolio?: {
      label: string;
      href: string;
    };
  };
}

const toolIcons = {
  Mail,
  Excel: FileSpreadsheet,
  Chat: MessageSquare,
  AelScan: ScanSearch,
};

export const ExperienceScreen: React.FC<ExperienceScreenProps> = ({
  theme,
  eyebrow,
  title,
  lead,
  caseLabel,
  caseTitle,
  description,
  steps,
  tools,
  metrics,
  continueLabel,
  onContinue,
  result,
  requireExplicitAction = false,
  compact = false,
  credit,
}) => {
  const [isLeaving, setIsLeaving] = useState(false);
  const isLeavingRef = useRef(false);

  const handleContinue = () => {
    if (isLeavingRef.current) return;
    isLeavingRef.current = true;
    setIsLeaving(true);
    // Advance in the same interaction. Waiting for the exit animation used to
    // leave only the wallpaper visible when the screen was remounted or its
    // timer was cancelled during the Case 2 -> Case 3 transition.
    onContinue();
  };

  const HeroIcon = theme === 'complete' ? ShieldCheck : theme === 'case2' ? MessageSquare : Sparkles;

  return (
    <motion.div
      className={`experience-screen experience-screen--${theme}${compact ? ' experience-screen--compact' : ''}`}
      role={requireExplicitAction ? undefined : 'button'}
      tabIndex={requireExplicitAction ? -1 : 0}
      aria-label={requireExplicitAction ? undefined : continueLabel}
      onClick={requireExplicitAction ? undefined : handleContinue}
      onKeyDown={(event) => {
        if (requireExplicitAction) return;
        if (event.target !== event.currentTarget) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleContinue();
        }
      }}
      initial={{ opacity: 0 }}
      animate={isLeaving
        ? { opacity: 0, x: '-100vw', scale: 0.96, rotate: -1.5 }
        : { opacity: 1, x: 0, scale: 1, rotate: 0 }}
      transition={isLeaving
        ? { duration: 0.55, ease: [0.76, 0, 0.24, 1] }
        : { duration: 0.35 }}
    >
      <div className="experience-screen__aurora" aria-hidden="true" />
      <div className="experience-screen__grid" aria-hidden="true" />
      <div className="experience-screen__orb experience-screen__orb--one" aria-hidden="true" />
      <div className="experience-screen__orb experience-screen__orb--two" aria-hidden="true" />

      {[0, 1, 2, 3, 4, 5].map(index => (
        <motion.span
          key={index}
          className={`experience-screen__spark experience-screen__spark--${index + 1}`}
          aria-hidden="true"
          animate={{ y: [0, -14 - index * 2, 0], rotate: [0, 30, -12, 0], opacity: [0.3, 0.95, 0.3] }}
          transition={{ duration: 2.3 + index * 0.24, repeat: Infinity, delay: index * 0.16 }}
        >
          {index % 2 ? '●' : '✦'}
        </motion.span>
      ))}

      <motion.main
        className="experience-card"
        initial={{ y: 55, opacity: 0, scale: 0.94 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 150, damping: 18, delay: 0.12 }}
      >
        <section className="experience-card__hero">
          <div className="experience-card__brand">
            <motion.div
              className="experience-card__logo"
              animate={{ rotate: [0, 3, -3, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 3.4, repeat: Infinity }}
            >
              <HeroIcon size={32} strokeWidth={2.2} />
            </motion.div>
            <div>
              <div className="experience-card__product">Ael<span>OS</span></div>
              <div className="experience-card__product-note">Simulador de privacidad</div>
            </div>
          </div>

          {eyebrow && <div className="experience-card__eyebrow">{eyebrow}</div>}
          <h1>{title}</h1>
          <p className="experience-card__lead">{lead}</p>

          {metrics.length > 0 && <div className="experience-card__metrics">
            {metrics.map(metric => (
              <div key={metric.label} className="experience-card__metric">
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>}
        </section>

        <section className="experience-card__briefing">
          <div className="experience-card__case-label">{caseLabel}</div>
          <h2>{caseTitle}</h2>
          <p className="experience-card__description">{description}</p>

          {result}

          {steps.length > 0 && <div className="experience-card__steps">
            {steps.map((step, index) => (
              <motion.div
                key={step}
                className="experience-card__step"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.11 }}
              >
                <span>{index + 1}</span>
                <p>{step}</p>
              </motion.div>
            ))}
          </div>}

          {tools.length > 0 && <div className="experience-card__tools" aria-label="Aplicaciones del caso">
            {tools.map(tool => {
              const ToolIcon = toolIcons[tool];
              return (
                <span key={tool}>
                  <ToolIcon size={14} /> {tool}
                </span>
              );
            })}
          </div>}

          {credit && (
            <div className="experience-card__credit" onClick={event => event.stopPropagation()}>
              Creado por <strong>{credit.name}</strong>
              <span aria-hidden="true">·</span>
              <a href={credit.href} target="_blank" rel="noreferrer">
                GitHub: {credit.label}
              </a>
              {credit.portfolio && (
                <>
                  <span aria-hidden="true">·</span>
                  <a href={credit.portfolio.href} target="_blank" rel="noreferrer">
                    {credit.portfolio.label}
                  </a>
                </>
              )}
            </div>
          )}

          <motion.button
            type="button"
            className="experience-card__continue"
            disabled={isLeaving}
            onClick={(event) => {
              event.stopPropagation();
              handleContinue();
            }}
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 1.25, repeat: Infinity }}
          >
            <MousePointerClick size={17} />
            <span>{continueLabel}</span>
            <ArrowRight size={17} />
          </motion.button>
        </section>
      </motion.main>
    </motion.div>
  );
};

export default ExperienceScreen;
