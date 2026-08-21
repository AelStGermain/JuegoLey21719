import { describe, it, expect } from 'vitest';
import { gameStateReducer, initialGameState } from '../src/game/gameStateReducer';

describe('AelOS Gameplay & Audit Linking Logic', () => {
  it('should handle selecting an element for audit', () => {
    const action = {
      type: 'SELECT_AUDIT_ELEMENT' as const,
      payload: { sourceApp: 'mail' as const, elementId: 'email-cc-header' }
    };
    
    const state = gameStateReducer(initialGameState, action);
    expect(state.selectedAuditElement).toEqual({ sourceApp: 'mail', elementId: 'email-cc-header' });
  });

  it('should handle clearing the selected audit element', () => {
    let state = gameStateReducer(initialGameState, {
      type: 'SELECT_AUDIT_ELEMENT',
      payload: { sourceApp: 'spreadsheet', elementId: 'col-rut' }
    });
    
    expect(state.selectedAuditElement).not.toBeNull();
    
    state = gameStateReducer(state, {
      type: 'SELECT_AUDIT_ELEMENT',
      payload: null
    });
    
    expect(state.selectedAuditElement).toBeNull();
  });
});
