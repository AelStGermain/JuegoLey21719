import React, { useState } from 'react';
import { useGameState } from '../game/GameStateContext';
import { scenario1 } from '../content/scenario_1';
import { X, ChevronDown, ChevronUp, BookOpen, ShieldCheck, ShieldAlert } from 'lucide-react';

interface FeedbackModalProps {
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose }) => {
  const { state: gameState } = useGameState();
  const [showLegalContext, setShowLegalContext] = useState(false);

  const decisionChoiceId = gameState.decisionsMade['decision-hr-send'];
  if (!decisionChoiceId) return null;

  const choice = scenario1.decision.choices.find(c => c.id === decisionChoiceId);
  if (!choice) return null;

  const fb = choice.consequences.educationalFeedback;
  const exposureLevel = fb.exposureLevel;

  // Render headers based on exact choice IDs
  let statusBanner = null;
  if (choice.id === 'choice-send-sanitized') {
    statusBanner = (
      <div style={{ background: '#ecfdf5', border: '1px solid #10b981', color: '#065f46', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <ShieldCheck size={20} color="#10b981" />
        <div>
          <div>✓ DECISIÓN CORRECTA: AUDITORÍA EXITOSA</div>
          <div style={{ fontSize: '0.72rem', fontWeight: 'normal', marginTop: '2px', color: '#047857' }}>Has protegido de forma efectiva los datos confidenciales y sensibles de los postulantes de acuerdo con la Ley 21.719.</div>
        </div>
      </div>
    );
  } else {
    statusBanner = (
      <div style={{ background: '#fff1f2', border: '1px solid #f43f5e', color: '#9f1239', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <ShieldAlert size={20} color="#f43f5e" />
        <div>
          <div>🚨 DECISIÓN INCORRECTA: INFRACCIÓN CRÍTICA</div>
          <div style={{ fontSize: '0.72rem', fontWeight: 'normal', marginTop: '2px', color: '#be123c' }}>Transmitiste datos sensibles de salud y religión a proveedores externos sin consentimiento. Esto causará una filtración.</div>
        </div>
      </div>
    );
  }

  const legalConcepts = [
    { name: 'Proporcionalidad', desc: 'Los datos tratados deben ser adecuados y limitados a lo necesario para la finalidad declarada.', relevant: exposureLevel !== 'Bajo' },
    { name: 'Finalidad', desc: 'Los datos solo pueden usarse para los fines para los que fueron recopilados. El análisis de reputación no es un fin declarado en el proceso de postulación.', relevant: true },
    { name: 'Seguridad', desc: 'El responsable debe adoptar medidas técnicas y organizativas para evitar exposición no autorizada.', relevant: exposureLevel === 'Alto' },
    { name: 'Datos Sensibles', desc: 'Historial médico y creencias religiosas son categorías especialmente protegidas bajo la Ley 21.719.', relevant: true },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 5000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'windowOpen 0.2s ease',
      }}
    >
      <div
        className="bevel-raised"
        style={{
          width: '560px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflow: 'auto',
          background: 'var(--chrome-base)',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Title bar */}
        <div
          style={{
            background: 'linear-gradient(90deg, #1e2d4d 0%, #0f1a2e 100%)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'white',
            fontSize: '0.85rem',
            fontWeight: 'bold',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Evaluación de Compliance — Resultado Final</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '2px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto' }}>
          
          {/* Decision Prominent Status Banner */}
          {statusBanner}

          {/* Decision echo */}
          <div
            style={{ padding: '10px 12px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8rem', color: '#475569', lineHeight: '1.4' }}
          >
            <strong>Tu decisión:</strong> {choice.text}
          </div>

          {/* Description */}
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', marginBottom: '4px' }}>
              {fb.title}
            </div>
            <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: '1.5', margin: 0 }}>
              {fb.description}
            </p>
          </div>

          {/* Metrics grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { label: 'Destinatarios afectados', value: fb.affectedRecipients },
              { label: 'Datos sensibles expuestos', value: fb.sensitiveDataHandled },
              { label: 'Medidas de protección', value: fb.securityMeasures },
            ].map(metric => (
              <div
                key={metric.label}
                style={{
                  padding: '8px 10px',
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  gridColumn: metric.label === 'Medidas de protección' ? 'span 2' : 'auto',
                }}
              >
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px', letterSpacing: '0.5px' }}>
                  {metric.label}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#1e293b', lineHeight: '1.4' }}>
                  {metric.value}
                </div>
              </div>
            ))}
          </div>

          {/* Recommendation */}
          <div
            style={{
              padding: '10px 12px',
              borderLeft: '3px solid var(--color-indigo)',
              background: 'rgba(99,102,241,0.04)',
              borderRadius: '6px',
              fontSize: '0.78rem',
              lineHeight: '1.5',
              color: '#334155',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '2px', color: 'var(--color-indigo)' }}>
              Recomendación del Auditor Legal:
            </div>
            {fb.recommendations}
          </div>

          {/* Legal context */}
          <div>
            <button
              className="retro-btn"
              style={{ width: '100%', justifyContent: 'space-between', fontSize: '0.78rem' }}
              onClick={() => setShowLegalContext(v => !v)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={13} />
                Ver Bases Legales de la Ley 21.719
              </span>
              {showLegalContext ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {showLegalContext && (
              <div
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                {legalConcepts
                  .filter(c => c.relevant)
                  .map(concept => (
                    <div key={concept.name} style={{ borderLeft: '2px solid var(--color-indigo)', paddingLeft: '10px' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--color-indigo)' }}>
                        Principio de {concept.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b', lineHeight: '1.45', marginTop: '2px' }}>
                        {concept.desc}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            className="retro-btn primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '4px', padding: '10px' }}
            onClick={onClose}
          >
            Entendido. Avanzar al Día 2
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
