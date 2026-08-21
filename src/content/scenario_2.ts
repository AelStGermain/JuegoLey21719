import { SpreadsheetColumn } from '../game/types';

export interface ChatMessage {
  id: string;
  sender: 'Carolina' | 'Andrés' | 'Martín' | 'Javiera' | 'Felipe';
  senderRole: string;
  text: string;
  timestamp: string;
  evidenceId?: string; // If collectible as evidence
  evidenceLabel?: string;
  attachmentId?: string; // Opens the real evidence source; it is not itself draggable
}

export interface ChatMember {
  id: string;
  name: string;
  role: string;
  status: 'Activo' | 'Inactivo';
  termDate?: string;
  joinDate: string;
  chatStatus: 'Miembro activo del chat' | 'Inactivo';
  profileEvidenceId?: string; // ID if collected as profile evidence
}

export interface Scenario2Data {
  id: string;
  title: string;
  description: string;
  spreadsheet: {
    name: string;
    columns: SpreadsheetColumn[];
    rows: Array<Record<string, any>>;
  };
  messages: ChatMessage[];
  members: ChatMember[];
}

export const scenario2: Scenario2Data = {
  id: 'scenario-chat-access',
  title: 'Fuga de Información en Mensajería Laboral',
  description: 'Un equipo administrativo comparte planillas de personal y diagnósticos médicos en un chat grupal al que todavía tiene acceso una ex-trabajadora.',
  spreadsheet: {
    name: 'personal_sucursal_agosto.xlsx',
    columns: [
      { key: 'nombre', label: 'Nombre', category: 'personal_data', categoryLabel: 'Dato Identificador' },
      { key: 'telefono', label: 'Teléfono', category: 'personal_data', categoryLabel: 'Dato de Contacto' },
      { key: 'correo_personal', label: 'Correo Personal', category: 'personal_data', categoryLabel: 'Dato de Contacto' },
      { key: 'contacto_emergencia', label: 'Contacto de Emergencia', category: 'personal_data', categoryLabel: 'Contacto Relacionado' },
      { key: 'cargo', label: 'Cargo', category: 'general', categoryLabel: 'Dato Laboral' },
      { key: 'estado_licencia', label: 'Estado de Licencia', category: 'sensitive_data', categoryLabel: 'Dato de Salud (Sensible)' }
    ],
    rows: [
      { nombre: 'Camila Valdés', telefono: '+56 9 8888 1111', correo_personal: 'c.valdes@correo.test', contacto_emergencia: 'Mamá (+56 9 7777 2222)', cargo: 'Administración', estado_licencia: 'Licencia Médica' },
      { nombre: 'Paula Ríos', telefono: '+56 9 8888 2222', correo_personal: 'p.rios@correo.test', contacto_emergencia: 'Hermano (+56 9 7777 3333)', cargo: 'Administración', estado_licencia: 'Activo' },
      { nombre: 'Felipe Castro', telefono: '+56 9 8888 3333', correo_personal: 'f.castro@correo.test', contacto_emergencia: 'Esposa (+56 9 7777 4444)', cargo: 'Soporte', estado_licencia: 'Activo' },
      { nombre: 'Martín Herrera', telefono: '+56 9 8888 4444', correo_personal: 'm.herrera@correo.test', contacto_emergencia: 'Padre (+56 9 7777 5555)', cargo: 'Supervisor', estado_licencia: 'Activo' }
    ]
  },
  members: [
    {
      id: 'carolina',
      name: 'Carolina Vega',
      role: 'Jefatura de Administración',
      status: 'Activo',
      joinDate: '15/01/2022',
      chatStatus: 'Miembro activo del chat'
    },
    {
      id: 'andres',
      name: 'Andrés Molina',
      role: 'RRHH',
      status: 'Activo',
      joinDate: '10/05/2023',
      chatStatus: 'Miembro activo del chat'
    },
    {
      id: 'martin',
      name: 'Martín Herrera',
      role: 'Supervisor',
      status: 'Activo',
      joinDate: '01/03/2024',
      chatStatus: 'Miembro activo del chat'
    },
    {
      id: 'paula',
      name: 'Paula Ríos',
      role: 'Administración',
      status: 'Activo',
      joinDate: '01/08/2024',
      chatStatus: 'Miembro activo del chat'
    },
    {
      id: 'felipe-mora',
      name: 'Felipe Mora',
      role: 'Operaciones',
      status: 'Activo',
      joinDate: '2023-08-15',
      chatStatus: 'Miembro activo del chat'
    },
    {
      id: 'javiera-soto',
      name: 'Javiera Soto',
      role: 'Administración (Ex-trabajadora)',
      status: 'Inactivo',
      termDate: '2025-06-15',
      joinDate: '2022-03-01',
      chatStatus: 'Miembro activo del chat',
      profileEvidenceId: 'ev-ch-profile-javiera-inactive'
    }
  ],
  messages: [
    {
      id: 'ch-m1',
      sender: 'Carolina',
      senderRole: 'Jefatura de Administración',
      text: '¡Buenos días, equipo! ☀️ Camila no vendrá mañana, así que tenemos que reorganizar los turnos de la sucursal de inmediato. 🛠️',
      timestamp: '09:04'
    },
    {
      id: 'ch-m2',
      sender: 'Martín',
      senderRole: 'Supervisor',
      text: '¡Uh! 😮 ¿Solo mañana, o es por más tiempo?',
      timestamp: '09:06'
    },
    {
      id: 'ch-m3',
      sender: 'Carolina',
      senderRole: 'Jefatura de Administración',
      text: 'Por ahora tiene licencia hasta el 18. Volvió a pedir licencia médica por depresión severa... 😔 Así que es probable que se extienda más.',
      timestamp: '09:07',
      evidenceId: 'ev-ch-msg-depression',
      evidenceLabel: 'Mensaje Carolina: licencia por depresión'
    },
    {
      id: 'ch-m4',
      sender: 'Andrés',
      senderRole: 'RRHH',
      text: 'Noo qué lata! Por cierto, Felipe también me pidió otro anticipo de sueldo de urgencia. Dice que sigue súper complicado con deudas acumuladas y cobradores. 💸',
      timestamp: '09:11',
      evidenceId: 'ev-ch-msg-deudas',
      evidenceLabel: 'Mensaje Andrés: deudas de Felipe'
    },
    {
      id: 'ch-m5',
      sender: 'Carolina',
      senderRole: 'Jefatura de Administración',
      text: 'Qué complicado... :( Les dejo por aquí la planilla de personal actualizada con datos de contacto y emergencias por si necesitan coordinar algo. 👇',
      timestamp: '09:14',
      evidenceId: 'ev-ch-msg-file-shared',
      evidenceLabel: 'Mensaje Carolina: comparte planilla de personal',
      attachmentId: 'ev-ch-file-agosto'
    },
    {
      id: 'ch-m6',
      sender: 'Javiera',
      senderRole: 'Administración',
      text: 'Hola a todos... disculpen la molestia, pero ¿por qué sigo en este grupo de chat? 🤔 Yo dejé de trabajar en la empresa en junio...',
      timestamp: '09:18'
    },
    {
      id: 'ch-m7',
      sender: 'Javiera',
      senderRole: 'Administración',
      text: 'Además, acabo de leer los detalles de Camila...  ¿Por qué están ventilando información de salud tan delicada en un grupo común?',
      timestamp: '09:19'
    },
    {
      id: 'ch-m8',
      sender: 'Carolina',
      senderRole: 'Jefatura de Administración',
      text: '¡Uy! Qué descuido... Pensé que ya te habían sacado del grupo, Javiera.',
      timestamp: '09:21'
    },
    {
      id: 'ch-m9',
      sender: 'Andrés',
      senderRole: 'RRHH',
      text: '¡Tranqui, no pasa nada! Después te elimino del chat grupal.',
      timestamp: '09:22'
    },
    {
      id: 'ch-m9b',
      sender: 'Felipe',
      senderRole: 'Operaciones',
      text: 'De dónde sacaron esa planilla?? Tiene mis datos de contacto de emergencia... yo nunca autoricé que subieran eso a ningún chat.',
      timestamp: '09:23'
    },
    {
      id: 'ch-m9c',
      sender: 'Andrés',
      senderRole: 'RRHH',
      text: 'La bajé de la base general de RRHH, Felipe. Ahí están las fichas de todos los que han pasado por la empresa. Todos los de RRHH tenemos acceso libre. 🤷‍♂️',
      timestamp: '09:24',
      evidenceId: 'ev-ch-msg-control-orig',
      evidenceLabel: 'Mensaje Andrés: acceso libre a fichas RRHH'
    },
    {
      id: 'ch-m10',
      sender: 'Carolina',
      senderRole: 'Jefatura de Administración',
      text: 'Sí, de hecho déjala en el grupo por ahora por si acaso necesitamos preguntarle algo de las entregas anteriores. 🤷‍♀️',
      timestamp: '09:22',
      evidenceId: 'ev-ch-msg-dejala',
      evidenceLabel: 'Mensaje Carolina: mantener por si acaso'
    }
  ]
};
