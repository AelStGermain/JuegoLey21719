import React from 'react';
import { useGameState } from '../game/GameStateContext';
import { COMPLIANCE_PRACTICAL_TIPS } from '../content/complianceGuidance';
import ComplianceSummary from './ComplianceSummary';

interface FeedbackModalProps {
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose }) => {
  const { state: gameState } = useGameState();
  const isProtectedDecision = gameState.decisionsMade['decision-hr-send'] === 'choice-send-sanitized';

  return (
    <div className="feedback-modal-backdrop compliance-modal-backdrop">
      <ComplianceSummary
        caseLabel="Caso 1"
        tone={isProtectedDecision ? 'success' : 'warning'}
        title={isProtectedDecision ? 'Compartiste solo lo necesario' : 'La respuesta mantuvo una exposición innecesaria'}
        summary={isProtectedDecision
          ? 'La planilla quedó limitada y protegida antes de salir de RRHH.'
          : 'La información sensible no debe enviarse a terceros ni mantenerse cuando no aporta al proceso de selección.'}
        tips={[...COMPLIANCE_PRACTICAL_TIPS.case1]}
        actions={<button type="button" onClick={onClose}>Continuar al Caso 2</button>}
      />
    </div>
  );
};

export default FeedbackModal;
