import React from 'react';
import { motion } from 'framer-motion';
import { Code2, ExternalLink, RotateCcw, Sparkles } from 'lucide-react';
import './CompletionScreen.css';

interface CompletionScreenProps {
  onRestart: () => void;
}

const CompletionScreen: React.FC<CompletionScreenProps> = ({ onRestart }) => (
  <motion.div
    className="completion-screen"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: .35 }}
  >
    <div className="completion-screen__dots" aria-hidden="true" />
    <motion.main
      className="completion-card"
      initial={{ opacity: 0, y: 34, rotate: -1, scale: .95 }}
      animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 170, damping: 19 }}
    >
      <section className="completion-card__message">
        <div className="completion-card__brand"><Sparkles size={24} /> AelOS</div>
        <span className="completion-card__spark" aria-hidden="true">✦</span>
        <h1>¡Gracias por jugar!</h1>
        <p>Espero que hayas disfrutado esta experiencia.</p>
      </section>

      <section className="completion-card__creator">
        <span>Creado por</span>
        <h2>Ael</h2>
        <p>AelStGermain</p>

        <nav className="completion-card__links" aria-label="Enlaces de la creadora">
          <a className="is-github" href="https://github.com/AelStGermain" target="_blank" rel="noreferrer">
            <Code2 size={21} />
            <span><small>Código y proyectos</small>Visitar GitHub</span>
            <ExternalLink size={16} />
          </a>
          <a className="is-portfolio" href="https://aelstgermain.github.io/Aelita/" target="_blank" rel="noreferrer">
            <Sparkles size={21} />
            <span><small>Conoce mi trabajo</small>Ver portafolio</span>
            <ExternalLink size={16} />
          </a>
        </nav>

        <button type="button" className="completion-card__restart" onClick={onRestart}>
          <RotateCcw size={16} /> Volver a jugar
        </button>
      </section>
    </motion.main>
  </motion.div>
);

export default CompletionScreen;
