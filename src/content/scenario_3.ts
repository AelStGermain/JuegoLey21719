import type { SpreadsheetColumn } from '../game/types';

export type Case3RecipientBucket = 'to' | 'cc' | 'bcc';
export type Case3RecipientKind = 'internal' | 'unknown-domain';
export type Case3ArtifactId = 'suspicious-recipient' | 'audience-privacy' | 'payroll' | null;

export interface Case3Recipient {
  id: string;
  name: string;
  email: string;
  bucket: Case3RecipientBucket;
  kind: Case3RecipientKind;
  count: number;
  active: boolean;
  note: string;
}

export interface Case3Attachment {
  id: string;
  name: string;
  type: 'spreadsheet' | 'pdf';
  kind: 'payroll' | 'notice';
  active: boolean;
  summary: string;
}

export interface Case3EvaluationCheck {
  id: 'recipient' | 'privacy' | 'attachment';
  label: string;
  passed: boolean;
  detail: string;
  pillar: 'PROTECCIÓN' | 'NECESIDAD';
}

export interface Case3Evaluation {
  level: 'perfect' | 'partial' | 'critical';
  title: string;
  summary: string;
  checks: Case3EvaluationCheck[];
  correctedCount: number;
  recipientCount: number;
  visibleCcCount: number;
  attachmentCount: number;
}

const shuffle = <T,>(items: T[]) => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

const typoDomains = ['medvlbe.test', 'medvibe-cl.test', 'medvibee.test'];
const payrollNames = ['nomina_agosto.xlsx', 'nomina_pagos_agosto.xlsx', 'remuneraciones_agosto.xlsx'];

export const scenario3 = {
  id: 'scenario-scheduled-mail',
  title: 'El correo equivocado',
  alertTitle: 'Evita que este correo salga mal',
  purpose: 'Informar que el pago se realizará el viernes 28 de agosto.',
  sender: 'rrhh@medvibe.test',
  subject: 'Cambio de fecha de pago',
  body: `Estimadas y estimados:\n\nEl proceso de pago de este mes se realizará el viernes 28 de agosto.\n\nAdjuntamos el aviso con la fecha actualizada.\n\nSaludos,\nRecursos Humanos`,
  safePdfBody: `AVISO DE PAGO · AGOSTO\n\nEl proceso de pago se realizará el viernes 28 de agosto.\n\nNo es necesario realizar ninguna gestión.`,
  spreadsheet: {
    columns: [
      { key: 'nombre', label: 'Nombre', category: 'personal_data', categoryLabel: 'Identificación' },
      { key: 'rut', label: 'RUT', category: 'personal_data', categoryLabel: 'Identificador nacional' },
      { key: 'sueldo', label: 'Sueldo', category: 'personal_data', categoryLabel: 'Dato financiero' },
      { key: 'banco', label: 'Banco', category: 'personal_data', categoryLabel: 'Dato financiero' },
      { key: 'cuenta', label: 'Cuenta', category: 'personal_data', categoryLabel: 'Dato bancario' },
    ] satisfies SpreadsheetColumn[],
    rows: [
      { nombre: 'Camila Valdés', rut: '18.452.932-K', sueldo: '$2.350.000', banco: 'Banco Estado', cuenta: '0198845721' },
      { nombre: 'Tomás Ossa', rut: '19.012.384-2', sueldo: '$2.790.000', banco: 'Banco de Chile', cuenta: '7710402388' },
      { nombre: 'Francisca Cruz', rut: '16.892.411-8', sueldo: '$2.180.000', banco: 'Santander', cuenta: '5488210934' },
      { nombre: 'Renato Díaz', rut: '15.932.102-K', sueldo: '$2.610.000', banco: 'Bci', cuenta: '2288447102' },
      { nombre: 'Gabriela Soto', rut: '17.221.493-5', sueldo: '$2.420.000', banco: 'Itaú', cuenta: '4409815270' },
    ],
  },
};

export const createCase3Recipients = (): Case3Recipient[] => {
  const typoDomain = typoDomains[Math.floor(Math.random() * typoDomains.length)];
  const copiedRecipients: Case3Recipient[] = [
    {
      id: 'accounting',
      name: 'Contabilidad',
      email: 'contabilidad@medvibe.test',
      bucket: 'cc',
      kind: 'internal',
      count: 1,
      active: true,
      note: 'Dirección interna reconocida.',
    },
    {
      id: 'payroll-team',
      name: 'Remuneraciones',
      email: 'remuneraciones@medvibe.test',
      bucket: 'cc',
      kind: 'internal',
      count: 1,
      active: true,
      note: 'Dirección interna reconocida.',
    },
    {
      id: 'mistyped-payroll',
      name: 'Remuneraciones',
      email: `remuneraciones@${typoDomain}`,
      bucket: 'cc',
      kind: 'unknown-domain',
      count: 1,
      active: true,
      note: 'Dirección no reconocida.',
    },
  ];

  return [
    {
      id: 'staff-list',
      name: 'Personal MedVibe',
      email: '238 personas',
      bucket: 'to',
      kind: 'internal',
      count: 238,
      active: true,
      note: 'Las direcciones todavía son visibles entre destinatarios.',
    },
    ...shuffle(copiedRecipients),
  ];
};

export const createCase3Attachments = (): Case3Attachment[] => shuffle([
  {
    id: 'payment-notice',
    name: 'aviso_pago.pdf',
    type: 'pdf',
    kind: 'notice',
    active: true,
    summary: 'Fecha de pago e instrucciones generales.',
  },
  {
    id: 'payroll-sheet',
    name: payrollNames[Math.floor(Math.random() * payrollNames.length)],
    type: 'spreadsheet',
    kind: 'payroll',
    active: true,
    summary: 'Nombre, RUT, sueldo, banco y cuenta.',
  },
]);

export const getCase3CorrectedCount = (
  recipients: Case3Recipient[],
  attachments: Case3Attachment[],
) => {
  const suspiciousRemoved = !recipients.some(recipient => recipient.active && recipient.kind === 'unknown-domain');
  const staff = recipients.find(recipient => recipient.id === 'staff-list');
  const audienceProtected = staff?.bucket === 'bcc';
  const payrollRemoved = !attachments.some(attachment => attachment.active && attachment.kind === 'payroll');
  return [suspiciousRemoved, audienceProtected, payrollRemoved].filter(Boolean).length;
};

export const evaluateCase3Draft = (
  recipients: Case3Recipient[],
  attachments: Case3Attachment[],
): Case3Evaluation => {
  const activeRecipients = recipients.filter(recipient => recipient.active);
  const activeAttachments = attachments.filter(attachment => attachment.active);
  const suspiciousPresent = activeRecipients.some(recipient => recipient.kind === 'unknown-domain');
  const staff = recipients.find(recipient => recipient.id === 'staff-list');
  const audienceProtected = staff?.bucket === 'bcc';
  const payrollPresent = activeAttachments.some(attachment => attachment.kind === 'payroll');

  const checks: Case3EvaluationCheck[] = [
    {
      id: 'recipient',
      label: 'Destinatario equivocado',
      passed: !suspiciousPresent,
      detail: suspiciousPresent
        ? 'Una dirección no reconocida recibió el correo.'
        : 'Evitaste que una dirección incorrecta recibiera información.',
      pillar: 'PROTECCIÓN',
    },
    {
      id: 'privacy',
      label: 'Direcciones visibles',
      passed: Boolean(audienceProtected),
      detail: audienceProtected
        ? 'Las direcciones de 238 personas quedaron ocultas con CCO.'
        : 'Los trabajadores pudieron ver las direcciones de los demás.',
      pillar: 'PROTECCIÓN',
    },
    {
      id: 'attachment',
      label: 'Nómina innecesaria',
      passed: !payrollPresent,
      detail: payrollPresent
        ? 'La nómina con sueldos y cuentas fue enviada a todos.'
        : 'Retiraste información que no hacía falta para comunicar una fecha.',
      pillar: 'NECESIDAD',
    },
  ];

  const correctedCount = checks.filter(check => check.passed).length;
  const level: Case3Evaluation['level'] = correctedCount === 3 ? 'perfect' : correctedCount === 0 ? 'critical' : 'partial';

  return {
    level,
    title: level === 'perfect' ? 'ENVÍO COMPLETADO' : 'CORREO ENVIADO CON PROBLEMAS',
    summary: level === 'perfect'
      ? 'Correo enviado a 238 trabajadores. Evitaste 3 riesgos.'
      : `El correo salió con ${3 - correctedCount} ${3 - correctedCount === 1 ? 'problema pendiente' : 'problemas pendientes'}.`,
    checks,
    correctedCount,
    recipientCount: activeRecipients.reduce((total, recipient) => total + recipient.count, 0),
    visibleCcCount: audienceProtected ? 0 : 238,
    attachmentCount: activeAttachments.length,
  };
};
