import React from 'react';
import { Lightbulb, ShieldAlert, ShieldCheck } from 'lucide-react';
import './ComplianceSummary.css';

interface ComplianceSummaryProps {
  caseLabel: string;
  title: string;
  summary: string;
  tips: string[];
  tone?: 'success' | 'warning';
  actions: React.ReactNode;
}

const ComplianceSummary: React.FC<ComplianceSummaryProps> = ({
  caseLabel: _caseLabel,
  title,
  summary,
  tips,
  tone = 'success',
  actions,
}) => {
  const StatusIcon = tone === 'success' ? ShieldCheck : ShieldAlert;

  return (
    <section className={`compliance-summary is-${tone}`}>
      <header className="compliance-summary__header">
        <div className="compliance-summary__stamp"><StatusIcon size={28} strokeWidth={2.7} /></div>
        <div>
          <h2>{title}</h2>
        </div>
      </header>

      <p className="compliance-summary__result">{summary}</p>

      <div className="compliance-summary__tips">
        <strong><Lightbulb size={17} /> Para aplicarlo en tu oficina</strong>
        <ul>
          {tips.map(tip => <li key={tip}>{tip}</li>)}
        </ul>
      </div>

      <footer className="compliance-summary__actions">{actions}</footer>
    </section>
  );
};

export default ComplianceSummary;
