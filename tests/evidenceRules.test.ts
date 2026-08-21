import { describe, expect, it } from 'vitest';
import {
  CASE1_INFRACTION_RULE_BY_ELEMENT,
  CASE1_INFRACTION_RULES_BY_ELEMENT,
  CASE2_EVIDENCE_CATALOG,
  CASE2_FINDING_EVIDENCE_IDS,
  CASE2_FINDING_IDS,
  CASE2_FINDING_RULE_IDS,
  CASE2_INFRACTION_EVIDENCE_IDS,
  CASE2_INFRACTION_RULES_BY_EVIDENCE,
  CASE2_MITIGATION_FINDING_IDS,
  getDocumentedCase2EvidenceIds,
} from '../src/content/evidenceRules';
import { scenario2 } from '../src/content/scenario_2';

describe('canonical evidence-Regulation relationships', () => {
  it('contains only the four confirmed Case 1 infringements', () => {
    expect(CASE1_INFRACTION_RULE_BY_ELEMENT).toEqual({
      'col-historial_medico': 1,
      'col-religion': 2,
      'col-rut': 3,
      'email-cc-header': 3,
    });
    expect(CASE1_INFRACTION_RULES_BY_ELEMENT).toEqual({
      'col-historial_medico': [1, 2, 3],
      'col-religion': [2, 1, 3],
      'col-rut': [3],
      'email-cc-header': [3, 1],
    });
  });

  it('maps every confirmed Case 2 evidence to its applicable Regulation', () => {
    expect(CASE2_INFRACTION_RULES_BY_EVIDENCE).toEqual({
      'ev-ch-msg-depression': [1, 2, 3],
      'ev-ch-msg-dejala': [2, 3],
      'ev-ch-profile-javiera-inactive': [3, 2],
      'ev-ch-msg-file-shared': [3, 2],
      'ev-ch-file-agosto': [3, 2],
      'ev-ch-msg-deudas': [3, 2, 1],
      'ev-ch-msg-control-orig': [4, 3],
    });
  });

  it('keeps one primary pillar while allowing strong secondary relationships', () => {
    Object.entries(CASE1_INFRACTION_RULE_BY_ELEMENT).forEach(([evidenceId, primaryRuleId]) => {
      const ruleIds = CASE1_INFRACTION_RULES_BY_ELEMENT[evidenceId];
      expect(ruleIds[0]).toBe(primaryRuleId);
      expect(new Set(ruleIds).size).toBe(ruleIds.length);
    });

    Object.entries(CASE2_FINDING_EVIDENCE_IDS).forEach(([findingId, evidenceIds]) => {
      evidenceIds.forEach(evidenceId => {
        const ruleIds = CASE2_INFRACTION_RULES_BY_EVIDENCE[evidenceId];
        expect(ruleIds[0]).toBe(CASE2_FINDING_RULE_IDS[findingId]);
        expect(new Set(ruleIds).size).toBe(ruleIds.length);
      });
    });
  });

  it('does not classify the operational absence message as an infringement', () => {
    expect(CASE2_INFRACTION_RULES_BY_EVIDENCE['ev-ch-msg-ausente']).toBeUndefined();
  });

  it('uses seven self-sufficient evidences for seven independently documentable findings', () => {
    expect(CASE2_INFRACTION_EVIDENCE_IDS).toHaveLength(7);
    expect(CASE2_FINDING_IDS).toHaveLength(7);
    expect(getDocumentedCase2EvidenceIds(CASE2_FINDING_IDS)).toHaveLength(7);
    Object.values(CASE2_FINDING_EVIDENCE_IDS).forEach(evidenceIds => {
      expect(evidenceIds).toHaveLength(1);
    });
  });

  it('makes the retention message and the combined Javiera profile resolve separately', () => {
    expect(CASE2_FINDING_EVIDENCE_IDS['lead-retention-by-chance-resolved']).toEqual(['ev-ch-msg-dejala']);
    expect(CASE2_FINDING_EVIDENCE_IDS['lead-ex-worker-access-resolved']).toEqual(['ev-ch-profile-javiera-inactive']);
  });

  it('maps every finding evidence to the same Regulation advertised by its draggable source', () => {
    Object.entries(CASE2_FINDING_EVIDENCE_IDS).forEach(([findingId, evidenceIds]) => {
      const ruleId = CASE2_FINDING_RULE_IDS[findingId];
      expect(ruleId).toBeDefined();
      evidenceIds.forEach(evidenceId => {
        expect(CASE2_EVIDENCE_CATALOG[evidenceId]).toBeDefined();
        expect(CASE2_EVIDENCE_CATALOG[evidenceId].ruleIds).toContain(ruleId);
      });
    });
  });

  it('marks only actual chat-message infringements as draggable messages', () => {
    const draggableMessageIds = scenario2.messages
      .map(message => message.evidenceId)
      .filter((id): id is string => !!id);

    expect(draggableMessageIds).toHaveLength(5);
    draggableMessageIds.forEach(evidenceId => {
      expect(CASE2_EVIDENCE_CATALOG[evidenceId]?.source).toBe('chat-message');
    });
    expect(scenario2.messages.find(message => message.id === 'ch-m5')?.evidenceId).toBe('ev-ch-msg-file-shared');
    expect(scenario2.messages.find(message => message.id === 'ch-m5')?.attachmentId).toBe('ev-ch-file-agosto');
  });

  it('covers all seven findings with the three corrective actions exactly once', () => {
    const coveredFindings = Object.values(CASE2_MITIGATION_FINDING_IDS).flat().sort();
    expect(coveredFindings).toEqual([...CASE2_FINDING_IDS].sort());
  });
});
