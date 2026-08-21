import { describe, it, expect } from 'vitest';
import { RuleBasedPrivacyDetector } from '../src/privacy/ruleDetector';

describe('RuleBasedPrivacyDetector', () => {
  const detector = new RuleBasedPrivacyDetector();

  it('should detect Chilean RUT format numbers', async () => {
    const text = 'El postulante tiene el RUT 18.452.932-K y otro RUT alternativo 9.876.543-2.';
    const result = await detector.analyze({ text, contextType: 'spreadsheet' });

    const ruts = result.detections.filter(d => d.id.startsWith('det-rut-'));
    expect(ruts.length).toBe(2);
    expect(ruts[0].field).toBe('18.452.932-K');
    expect(ruts[0].category).toBe('personal_data');
    expect(ruts[1].field).toBe('9.876.543-2');
  });

  it('should detect Email addresses', async () => {
    const text = 'Enviar reportes a carlos.soto@empresa.test y a info@correo.cl.';
    const result = await detector.analyze({ text, contextType: 'email' });

    const emails = result.detections.filter(d => d.id.startsWith('det-email-'));
    expect(emails.length).toBe(2);
    expect(emails[0].field).toBe('carlos.soto@empresa.test');
    expect(emails[1].field).toBe('info@correo.cl');
  });

  it('should detect sensitive health-related terms', async () => {
    const text = 'Ficha del paciente detalla antecedentes de hipertensión y diagnóstico de diabetes.';
    const result = await detector.analyze({ text, contextType: 'spreadsheet' });

    const healthDetections = result.detections.filter(d => d.id.startsWith('det-health-'));
    expect(healthDetections.length).toBe(2);
    expect(healthDetections.some(d => d.field.toLowerCase() === 'hipertensión')).toBe(true);
    expect(healthDetections.some(d => d.field.toLowerCase() === 'diabetes')).toBe(true);
    expect(healthDetections.every(d => d.category === 'sensitive_data')).toBe(true);
  });

  it('should flag the false positive word "Cruz" as a low confidence sensitive item', async () => {
    const text = 'Candidato: Francisca Cruz. Empresa: MedVibe.';
    const result = await detector.analyze({ text, contextType: 'spreadsheet' });

    const fp = result.detections.find(d => d.id.startsWith('det-fp-cruz-'));
    expect(fp).toBeDefined();
    expect(fp?.field).toBe('Cruz');
    expect(fp?.confidence).toBe('LOW');
    expect(fp?.category).toBe('sensitive_data');
  });

  it('should calculate weighted risk scores correctly', async () => {
    // 1 RUT (+10) + 1 Email (+10) + 1 Health sensitive (+30) + 1 False positive (+5) = 55%
    const text = 'Contacto: juan@correo.cl, RUT 19.332.112-9. Nota: padece de depresión de la Sra. Cruz.';
    const result = await detector.analyze({ text, contextType: 'spreadsheet' });

    expect(result.riskScore).toBeGreaterThanOrEqual(50);
    expect(result.riskScore).toBeLessThanOrEqual(70);
  });
});
