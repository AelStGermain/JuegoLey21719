export type Case3Pillar = 'FINALIDAD' | 'NECESIDAD';
export type Case3CorrectionAction = 'remove' | 'make_optional';

export interface Case3FieldObjection {
  pillar: Case3Pillar;
  title: string;
  reason: string;
  action: Case3CorrectionAction;
  actionLabel: string;
}

export interface Case3FormField {
  id: string;
  label: string;
  type: 'text' | 'date' | 'select' | 'textarea';
  required: boolean;
  section: 'administrative' | 'activities';
  purpose: string;
  placeholder?: string;
  existingAdministrativeRecord?: boolean;
  objection?: Case3FieldObjection;
}

export const CASE3_REVIEW_FIELD_ID = 'religion';
export const CASE3_RELIGION_FINDING_ID = 'lead-form-religion-resolved';

export const scenario3 = {
  title: 'Actualización de Datos y Bienestar 2026',
  description: 'RRHH prepara un formulario para actualizar registros y organizar beneficios y actividades internas.',
  request: 'Hemos preparado el nuevo formulario de actualización de datos. ¿Puedes revisar las preguntas objetables antes de que lo enviemos mañana a toda la empresa?',
  purpose: 'Selecciona una pregunta. Si presenta un riesgo, elige la corrección que explica qué pilar está comprometido.',
  fields: [
    {
      id: 'name',
      label: 'Nombre completo',
      type: 'text',
      required: true,
      section: 'administrative',
      purpose: 'Identificar y actualizar el registro del trabajador',
      placeholder: 'Nombre y apellidos',
      existingAdministrativeRecord: true,
    },
    {
      id: 'birthdate',
      label: 'Fecha de nacimiento',
      type: 'date',
      required: true,
      section: 'administrative',
      purpose: 'Actualizar el registro administrativo existente',
      existingAdministrativeRecord: true,
    },
    {
      id: CASE3_REVIEW_FIELD_ID,
      label: 'Religión',
      type: 'select',
      required: true,
      section: 'activities',
      purpose: 'Organizar actividades internas',
      objection: {
        pillar: 'NECESIDAD',
        title: 'Dato sensible que no hace falta para esta tarea',
        reason: 'Organizar actividades generales no requiere conocer las creencias religiosas del trabajador.',
        action: 'remove',
        actionLabel: 'Eliminar porque no es necesario para la finalidad',
      },
    },
    {
      id: 'medication',
      label: 'Medicamentos de uso permanente',
      type: 'textarea',
      required: true,
      section: 'activities',
      purpose: 'Organizar actividades internas',
      objection: {
        pillar: 'NECESIDAD',
        title: 'Se solicita más información de la necesaria',
        reason: 'El detalle de medicamentos permanentes excede lo requerido para organizar actividades generales.',
        action: 'remove',
        actionLabel: 'Eliminar porque solicita información excesiva',
      },
    },
    {
      id: 'emergency',
      label: 'Contacto de emergencia',
      type: 'text',
      required: true,
      section: 'administrative',
      purpose: 'Contactar a una persona ante una emergencia',
      existingAdministrativeRecord: true,
    },
    {
      id: 'diet',
      label: 'Preferencia alimentaria',
      type: 'select',
      required: true,
      section: 'activities',
      purpose: 'Organizar alimentación en actividades internas',
      objection: {
        pillar: 'FINALIDAD',
        title: 'La finalidad es válida, pero participar debe ser voluntario',
        reason: 'La preferencia puede ayudar a organizar alimentación, siempre que el trabajador pueda omitirla si no participa.',
        action: 'make_optional',
        actionLabel: 'Hacer voluntaria porque depende de la participación',
      },
    },
    {
      id: 'address',
      label: 'Dirección particular',
      type: 'text',
      required: true,
      section: 'administrative',
      purpose: 'Actualizar el registro administrativo existente',
      placeholder: 'Dirección registrada',
      existingAdministrativeRecord: true,
    },
    {
      id: 'instagram',
      label: 'Instagram',
      type: 'text',
      required: false,
      section: 'activities',
      purpose: 'Sin finalidad definida',
      placeholder: '@usuario',
      objection: {
        pillar: 'FINALIDAD',
        title: 'No se explica para qué se solicita',
        reason: 'RRHH no definió una finalidad concreta que justifique recopilar una cuenta personal.',
        action: 'remove',
        actionLabel: 'Eliminar porque no tiene una finalidad definida',
      },
    },
  ] satisfies Case3FormField[],
};

export const CASE3_OBJECTED_FIELD_IDS = scenario3.fields
  .filter(field => field.objection)
  .map(field => field.id);
