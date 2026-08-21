import { PrivacyDetection, PrivacyScanInput, PrivacyScanResult } from '../game/types';
import { PrivacyDetectionEngine } from './detection';

export class RuleBasedPrivacyDetector implements PrivacyDetectionEngine {
  async analyze(input: PrivacyScanInput): Promise<PrivacyScanResult> {
    const text = input.text;
    const detections: PrivacyDetection[] = [];
    
    // 1. Check Chilean RUT: (\d{1,2}(?:\.\d{3}){2}-[\dkK])
    const rutRegex = /(\d{1,2}(?:\.\d{3}){2}-[\dkK])/g;
    let match;
    let rutCount = 0;
    while ((match = rutRegex.exec(text)) !== null) {
      rutCount++;
      detections.push({
        id: `det-rut-${rutCount}-${match.index}`,
        field: match[0],
        category: 'personal_data',
        confidence: 'HIGH',
        whyFlagged: `Se detectó un RUN/RUT chileno. La Ley 21.719 exige la protección estricta de los números de identificación nacional para evitar riesgos de suplantación de identidad.`,
        suggestedAction: 'Cifrar el identificador o removerlo del documento compartido.',
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }

    // 2. Check Emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    let emailCount = 0;
    while ((match = emailRegex.exec(text)) !== null) {
      emailCount++;
      detections.push({
        id: `det-email-${emailCount}-${match.index}`,
        field: match[0],
        category: 'personal_data',
        confidence: 'HIGH',
        whyFlagged: `Se identificó una dirección de correo electrónico, la cual constituye un dato personal identificador básico.`,
        suggestedAction: 'Anonimizar o verificar que la transmisión posea canales seguros.',
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }

    // 3. Check for Health keywords (Sensitive Data)
    const healthKeywords = [
      { word: 'historial médico', label: 'Historial Médico' },
      { word: 'tratamiento', label: 'Tratamiento Médico' },
      { word: 'depresión', label: 'Tratamiento Psiquiátrico' },
      { word: 'hipertensión', label: 'Condición de Salud (Hipertensión)' },
      { word: 'diabetes', label: 'Condición de Salud (Diabetes)' }
    ];

    healthKeywords.forEach((kw, index) => {
      const regex = new RegExp(`\\b${kw.word}\\b`, 'gi');
      while ((match = regex.exec(text)) !== null) {
        detections.push({
          id: `det-health-${index}-${match.index}`,
          field: match[0],
          category: 'sensitive_data',
          confidence: 'HIGH',
          whyFlagged: `Se identificaron términos asociados al estado de salud física o mental. Bajo la Ley 21.719, el historial médico y clínico constituye un "Dato Sensible" cuyo tratamiento está prohibido sin consentimiento expreso por escrito del titular.`,
          suggestedAction: 'Eliminar esta columna/campo o recopilar consentimiento firmado.',
          startIndex: match.index,
          endIndex: match.index + match[0].length
        });
      }
    });

    // 4. Check for Religion keywords (Sensitive Data)
    const religionKeywords = [
      { word: 'religión', label: 'Religión' },
      { word: 'católico', label: 'Credo Religioso' },
      { word: 'evangélico', label: 'Credo Religioso' }
    ];

    religionKeywords.forEach((kw, index) => {
      const regex = new RegExp(`\\b${kw.word}\\b`, 'gi');
      while ((match = regex.exec(text)) !== null) {
        detections.push({
          id: `det-religion-${index}-${match.index}`,
          field: match[0],
          category: 'sensitive_data',
          confidence: 'HIGH',
          whyFlagged: `Se detectaron referencias a credos o afiliaciones religiosas. La Ley 21.719 clasifica las creencias ideológicas y religiosas como datos sensibles cuya divulgación requiere consentimiento explícito.`,
          suggestedAction: 'Remover la columna/campo por carecer de proporcionalidad laboral.',
          startIndex: match.index,
          endIndex: match.index + match[0].length
        });
      }
    });

    // 5. INTRODUCE GAMEPLAY FALSE POSITIVE (The word "Cruz")
    // If the text contains the candidate surname "Cruz", the rules engine tags it
    // with LOW confidence as a potential religious symbol, allowing the player to reject it.
    const falsePositiveRegex = /\bCruz\b/gi;
    while ((match = falsePositiveRegex.exec(text)) !== null) {
      detections.push({
        id: `det-fp-cruz-${match.index}`,
        field: match[0],
        category: 'sensitive_data',
        confidence: 'LOW',
        whyFlagged: `[Simulación de Falso Positivo] Se detectó el término 'Cruz'. El detector asume que podría referirse a simbología o afiliaciones religiosas (Datos Sensibles). Requiere validación humana.`,
        suggestedAction: 'Rechazar recomendación si corresponde a un apellido o término común.',
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }

    // Calculate simulated risk score based on detections
    let score = 0;
    detections.forEach(d => {
      if (d.category === 'sensitive_data' && d.confidence === 'HIGH') {
        score += 30; // Heavy weight for health/religion
      } else if (d.category === 'personal_data') {
        score += 10; // Light weight for RUT/emails
      } else {
        score += 5; // Low confidence items
      }
    });

    return {
      detections,
      riskScore: Math.min(score, 100)
    };
  }
}
