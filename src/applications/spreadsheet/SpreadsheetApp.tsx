import React, { useState } from 'react';
import { useGameState } from '../../game/GameStateContext';
import { scenario1 } from '../../content/scenario_1';
import { scenario2 } from '../../content/scenario_2';
import { Check } from 'lucide-react';
import { playSound } from '../../components/sound';
import { beginEvidenceDrag, endEvidenceDrag } from '../../components/evidenceDrag';
import {
  CASE1_INFRACTION_RULES_BY_ELEMENT,
  CASE2_INFRACTION_RULES_BY_EVIDENCE,
  getRuleTokens,
  isCase2EvidenceResolved,
} from '../../content/evidenceRules';
import { pinEvidenceInAelScan } from '../../components/aelScanNavigation';
import { scenario3 } from '../../content/scenario_3';
import { useCase3 } from '../../game/Case3Context';

export const SpreadsheetApp: React.FC = () => {
  const { state: gameState, setSelectedAuditElement } = useGameState();
  const { state: case3State, selectArtifact } = useCase3();
  const [selectedCell, setSelectedCell] = useState<{ rowIdx: number; colKey: string } | null>(null);

  const isDay2 = gameState.currentDay === 2;
  const isDay3 = gameState.currentDay === 3;
  const isDay1 = gameState.currentDay === 1;
  const isWorkbookResolved = isDay2 && isCase2EvidenceResolved('ev-ch-file-agosto', gameState.evidenceFound);

  // Retrieve correct sheet details based on day
  const sheetName = isDay3
    ? case3State.attachments.find(attachment => attachment.kind === 'payroll')?.name ?? 'nomina_agosto.xlsx'
    : isDay2
      ? scenario2.spreadsheet.name
      : 'postulantes_2026_q3.xlsx';
  const columns = isDay3
    ? scenario3.spreadsheet.columns
    : isDay2
      ? scenario2.spreadsheet.columns
      : scenario1.spreadsheets['sheet-hr-applicants'].columns;
  const rows: Array<Record<string, any>> = isDay3
    ? scenario3.spreadsheet.rows
    : isDay2
      ? scenario2.spreadsheet.rows
      : scenario1.spreadsheets['sheet-hr-applicants'].rows;

  // Map of column keys to evidence IDs for Day 1
  const evidenceMapping: Record<string, string> = {
    'historial_medico': 'ev-sensitive-health',
    'religion': 'ev-sensitive-religion',
    'rut': 'ev-personal-rut',
  };

  const handleHeaderClick = (colKey: string) => {
    if (!isDay1) return; // Column audit elements only in Case 1.

    const targetElementId = 'col-' + colKey;
    if (!CASE1_INFRACTION_RULES_BY_ELEMENT[targetElementId]) return;
    const evidenceId = evidenceMapping[colKey];
    
    // Check if this evidence is already found/documented
    const isDiscovered = evidenceId && gameState.evidenceFound.includes(evidenceId);
    if (isDiscovered) return;

    const isAuditing = gameState.selectedAuditElement?.elementId === targetElementId;

    if (isAuditing) {
      setSelectedAuditElement(null);
    } else {
      setSelectedAuditElement({ sourceApp: 'spreadsheet', elementId: targetElementId });
    }
    playSound.click(gameState.soundEnabled);
  };

  const handleDragStart = (e: React.DragEvent<HTMLElement>, colKey: string, label: string) => {
    if (!isDay1) return;
    const targetElementId = 'col-' + colKey;
    if (!CASE1_INFRACTION_RULES_BY_ELEMENT[targetElementId]) return;
    e.dataTransfer.setData('text/plain', targetElementId);
    beginEvidenceDrag(e, `Columna de Excel · ${label}`);
    setSelectedAuditElement({ sourceApp: 'spreadsheet', elementId: targetElementId });
    playSound.click(gameState.soundEnabled);
  };

  const handleWorkbookDragStart = (e: React.DragEvent<HTMLElement>) => {
    if (!isDay2) return;
    e.dataTransfer.setData('text/plain', 'ev-ch-file-agosto');
    beginEvidenceDrag(e, `Libro de Excel · ${sheetName}`);
    playSound.click(gameState.soundEnabled);
  };

  const handleWorkbookClick = () => {
    if (isDay3) {
      selectArtifact('payroll');
      playSound.click(gameState.soundEnabled);
      return;
    }
    if (!isDay2) return;
    pinEvidenceInAelScan('ev-ch-file-agosto');
    playSound.click(gameState.soundEnabled);
  };

  const handleCellClick = (rowIdx: number, colKey: string) => {
    setSelectedCell({ rowIdx, colKey });
    playSound.click(gameState.soundEnabled);
  };

  return (
    <div className="ael-app sheet-app" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Spreadsheet Toolbar */}
      <div
        className="app-brandbar"
        style={{
          padding: '10px 14px',
          background: '#e2e8f0',
          borderBottom: '1px solid #cbd5e1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#1e3a8a' }}>Libro:</span>
          <span
            draggable={isDay2}
            onClick={handleWorkbookClick}
            onDragStart={handleWorkbookDragStart}
            onDragEnd={endEvidenceDrag}
            data-rule-ids={isDay2 ? getRuleTokens(CASE2_INFRACTION_RULES_BY_EVIDENCE['ev-ch-file-agosto']) : undefined}
            className={isDay2 ? 'draggable-evidence workbook-evidence' : isDay3 ? 'case3-workbook' : undefined}
            aria-label={isDay2 ? `Evidencia: libro ${sheetName}` : isDay3 ? `Inspeccionar libro ${sheetName} con AelScan` : undefined}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', background: isWorkbookResolved ? '#d1fae5' : 'white', padding: '2px 8px', border: `1px solid ${isWorkbookResolved ? '#34d399' : '#cbd5e1'}`, borderRadius: '4px', color: isWorkbookResolved ? '#047857' : '#1e3a8a', fontWeight: 'bold', cursor: isDay2 ? 'grab' : isDay3 ? 'pointer' : 'default' }}
          >
            {sheetName}{isWorkbookResolved ? '  ✓ resuelta' : ''}
          </span>
        </div>
      </div>

      {/* Main Workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Table View */}
        <div
          className="sheet-canvas"
          data-tutorial-target={isDay2 ? 'case2-sheet' : undefined}
          style={{ flex: 1, overflow: 'auto', padding: '8px', background: '#f1f5f9' }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.85rem',
              background: 'white',
              border: '2px solid #cbd5e1',
              borderRadius: '6px',
            }}
          >
            <thead data-tutorial-target={isDay1 ? 'case1-sheet' : undefined}>
              <tr style={{ background: '#f8fafc' }}>
                <th
                  style={{
                    border: '1px solid #cbd5e1',
                    width: '35px',
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    color: '#64748b',
                  }}
                ></th>
                {columns.map(col => {
                  const targetElementId = 'col-' + col.key;
                  const evidenceId = isDay1 ? evidenceMapping[col.key] : undefined;
                  const ruleIds = isDay1 ? CASE1_INFRACTION_RULES_BY_ELEMENT[targetElementId] : undefined;
                  const isConfirmedInfraction = !!ruleIds;
                  
                  const isDiscovered = evidenceId && gameState.evidenceFound.includes(evidenceId);
                  const isAuditing = isDay1 && gameState.selectedAuditElement?.elementId === targetElementId;

                  return (
                    <th
                      key={col.key}
                      id={targetElementId}
                      onClick={() => handleHeaderClick(col.key)}
                      draggable={!isDiscovered && isDay1 && isConfirmedInfraction}
                      onDragStart={(e) => handleDragStart(e, col.key, col.label)}
                      onDragEnd={endEvidenceDrag}
                      data-rule-ids={getRuleTokens(ruleIds)}
                      style={{
                        border: '1px solid #cbd5e1',
                        padding: '8px 10px',
                        cursor: !isDiscovered && isDay1 && isConfirmedInfraction ? 'grab' : 'default',
                        background: isAuditing 
                          ? 'rgba(59, 130, 246, 0.08)' 
                          : isDiscovered 
                            ? 'rgba(16, 185, 129, 0.05)'
                            : 'transparent',
                        borderBottom: isAuditing 
                          ? '3px solid #3b82f6' 
                          : isDiscovered 
                            ? '3px solid #10b981' 
                            : '1px solid #cbd5e1',
                        position: 'relative',
                        transition: 'all 0.2s',
                        color: isAuditing ? '#3b82f6' : 'inherit'
                      }}
                      className={!isDiscovered && isDay1 && isConfirmedInfraction ? 'selectable-hotspot draggable-evidence' : ''}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', width: '100%', justifyContent: 'space-between', gap: '4px' }}>
                          <span style={{ fontWeight: isAuditing ? 'bold' : 'normal' }}>
                            {col.label}
                          </span>
                          
                          {isDiscovered && (
                            <span style={{ fontSize: '0.62rem', background: '#d1fae5', color: '#065f46', padding: '1px 5px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 'bold' }}>
                              <Check size={10} /> {evidenceId === 'ev-unnecessary-sueldo' ? 'Verificado' : 'Infracción'}
                            </span>
                          )}
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr key={rowIdx} style={{ background: rowIdx % 2 === 0 ? 'white' : '#f8fafc' }}>
                  <td
                    style={{
                      border: '1px solid #cbd5e1',
                      background: '#f1f5f9',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      color: '#64748b',
                      fontWeight: 'bold',
                    }}
                  >
                    {rowIdx + 1}
                  </td>
                  {columns.map(col => {
                    const isSelected = selectedCell?.rowIdx === rowIdx && selectedCell?.colKey === col.key;
                    return (
                      <td
                        key={col.key}
                        onClick={() => handleCellClick(rowIdx, col.key)}
                        style={{
                          border: '1px solid #cbd5e1',
                          padding: '8px 10px',
                          background: isSelected ? '#e0f2fe' : 'transparent',
                          outline: isSelected ? '2px solid #3b82f6' : 'none',
                          cursor: 'cell',
                        }}
                      >
                        {row[col.key]}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SpreadsheetApp;
