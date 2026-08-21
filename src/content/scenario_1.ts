import { Scenario } from '../game/types';

export const scenario1: Scenario = {
  id: 'scenario-hr-data',
  title: 'Incidente de Datos en Recursos Humanos',
  description: 'Un reclutador intenta compartir información sensible de candidatos con un proveedor externo sin consentimiento y a través de una lista de distribución pública.',
  emails: [
    {
      id: 'email-hr-request',
      sender: 'sofia.valenzuela@medvibe.test',
      recipient: 'martin.reyes@agency-digital.test',
      cc: 'info@vendorservices.test',
      subject: 'Perfiles postulantes para Consultor de Salud Senior',
      body: `Estimado Martín,

Adjunto los perfiles de los 15 postulantes preseleccionados para el cargo de Consultor de Salud Senior en MedVibe. 

Necesito que realices el análisis de reputación pública y background check de estos perfiles a la brevedad. He copiado a nuestra lista de proveedores generales de servicios (info@vendorservices.test) para que estén al tanto de la orden de compra.

Quedo atenta a tus comentarios sobre los perfiles.

Saludos cordiales,
Sofía Valenzuela
Recursos Humanos, MedVibe`,
      dateStr: '13 Ago 2026, 09:15',
      attachment: {
        name: 'postulantes_2026_q3.xlsx',
        type: 'spreadsheet',
        contentId: 'sheet-hr-applicants'
      }
    }
  ],
  spreadsheets: {
    'sheet-hr-applicants': {
      columns: [
        { key: 'nombre', label: 'Nombre', category: 'personal_data', categoryLabel: 'Dato Identificador' },
        { key: 'email', label: 'Email', category: 'personal_data', categoryLabel: 'Dato Identificador' },
        { key: 'rut', label: 'RUT', category: 'personal_data', categoryLabel: 'Dato Identificador' },
        { key: 'historial_medico', label: 'Historial Médico', category: 'sensitive_data', categoryLabel: 'Dato de Salud (Sensible)' },
        { key: 'religion', label: 'Religión', category: 'sensitive_data', categoryLabel: 'Dato Ideológico (Sensible)' },
        { key: 'sueldo_pretendido', label: 'Sueldo Pretendido', category: 'personal_data', categoryLabel: 'Dato Financiero / Personal' }
      ],
      rows: [
        { nombre: 'Camilo Fuentes', email: 'c.fuentes@correo.test', rut: '18.452.932-K', historial_medico: 'Hipertensión controlada', religion: 'Católico', sueldo_pretendido: '2.500.000' },
        { nombre: 'Gabriela Soto', email: 'g.soto@correo.test', rut: '17.221.493-5', historial_medico: 'Ninguno informado', religion: 'Ninguna', sueldo_pretendido: '2.600.000' },
        { nombre: 'Tomás Ossa', email: 't.ossa@correo.test', rut: '19.012.384-2', historial_medico: 'Diabetes Tipo 2', religion: 'Evangélico', sueldo_pretendido: '2.400.000' },
        { nombre: 'Francisca Cruz', email: 'f.cruz@correo.test', rut: '16.892.411-8', historial_medico: 'Tratamiento por depresión', religion: 'Católico', sueldo_pretendido: '2.800.000' },
        { nombre: 'Renato Díaz', email: 'r.diaz@correo.test', rut: '15.932.102-K', historial_medico: 'Alergia al gluten alimentaria', religion: 'Ninguna', sueldo_pretendido: '2.500.000' }
      ]
    }
  },
  evidences: [
    {
      id: 'ev-cc-leak',
      sourceApp: 'mail',
      targetElementId: 'email-cc-header',
      description: 'Filtración por Copia Oculta/Pública',
      category: 'contextual_risk',
      explanation: 'Copiar a la casilla de distribución general "info@vendorservices.test" expone los datos de los postulantes a proveedores externos no autorizados, vulnerando el Principio de Confidencialidad y Seguridad de la Ley 21.719.'
    },
    {
      id: 'ev-sensitive-health',
      sourceApp: 'spreadsheet',
      targetElementId: 'col-historial_medico',
      description: 'Tratamiento de Datos Sensibles de Salud',
      category: 'sensitive_data',
      explanation: 'El historial clínico de los postulantes constituye "Datos de Salud" según la Ley 21.719. Su tratamiento está prohibido a menos que exista consentimiento expreso e informado del titular por escrito, lo cual no aplica en esta selección.'
    },
    {
      id: 'ev-sensitive-religion',
      sourceApp: 'spreadsheet',
      targetElementId: 'col-religion',
      description: 'Tratamiento de Datos Sensibles de Creencias',
      category: 'sensitive_data',
      explanation: 'Las creencias religiosas son consideradas Datos Sensibles de carácter ideológico. Compartir esta información con una agencia externa viola el Principio de Finalidad y Proporcionalidad, ya que no guarda relación con la evaluación técnica del cargo.'
    },
    {
      id: 'ev-personal-rut',
      sourceApp: 'spreadsheet',
      targetElementId: 'col-rut',
      description: 'Exposición de Identificador Nacional (RUT)',
      category: 'personal_data',
      explanation: 'El RUT es un dato personal identificador único en Chile. Transmitirlo en texto plano sin cifrado ni medidas de seguridad complementarias expone a los postulantes a riesgos de suplantación y vulnera el estándar de seguridad.'
    }
  ],
  decision: {
    id: 'decision-hr-send',
    prompt: 'Sofía Valenzuela está esperando tu respuesta para proceder. ¿Qué acción decides tomar en el sistema corporativo?',
    choices: [
      {
        id: 'choice-send-raw',
        text: 'Enviar planilla completa tal como fue solicitada (Mantener destinatarios y adjunto original)',
        consequences: {
          setFlags: { exposedApplicants: true, actionTaken: 'send-raw' },
          educationalFeedback: {
            title: 'Análisis de Exposición: Alto Riesgo Comercial y Regulatorio',
            description: 'Has decidido enviar los datos completos sin aplicar filtros. Esto expone directamente información íntima de las personas.',
            exposureLevel: 'Alto',
            affectedRecipients: '3 direcciones de correo (incluyendo una lista pública de proveedores contratados).',
            sensitiveDataHandled: 'Historial de salud física/mental y creencias religiosas de 15 postulantes.',
            securityMeasures: 'Ninguna. Se envió el archivo XLSX plano vía correo tradicional.',
            recommendations: 'Debes sanitizar las planillas de datos sensibles antes de transmitirlas y restringir los envíos solo a destinatarios con justificación contractual directa.'
          }
        }
      },
      {
        id: 'choice-send-sanitized',
        text: 'Responder con una versión editada y educar a Sofía (Remover CC externo y columnas de Salud/Religión/RUT, explicando por qué)',
        consequences: {
          setFlags: { exposedApplicants: false, actionTaken: 'send-sanitized' },
          educationalFeedback: {
            title: 'Análisis de Exposición: Riesgo Mitigado de Forma Efectiva',
            description: 'Aplicaste el principio de minimización y explicaste a la emisora por qué esos datos y destinatarios no correspondían. El proveedor recibe solo lo necesario y el equipo aprende a prevenir una nueva exposición.',
            exposureLevel: 'Bajo',
            affectedRecipients: '1 destinatario directo y verificado (Martín Reyes). Se removió la lista pública.',
            sensitiveDataHandled: 'Ningún dato sensible expuesto. Se eliminaron las columnas de Salud y Religión.',
            securityMeasures: 'Minimización estricta. Se enviaron únicamente campos identificadores mínimos requeridos.',
            recommendations: 'Procedimiento excelente. Editar el archivo resuelve el riesgo inmediato y explicar el criterio a Sofía mejora las futuras prácticas del equipo.'
          }
        }
      }
    ]
  },
  consequences: [
    {
      triggerFlag: 'exposedApplicants',
      activeNotification: {
        id: 'notif-leak-incident',
        title: '⚠️ ALERTA DE INCIDENTE: Exposición de Datos',
        message: 'Área de Seguridad reporta posible filtración de planilla con datos de salud en servidor compartido del proveedor.',
        appToOpen: 'aelchat'
      },
      followUpEmail: {
        id: 'email-consequence-leak',
        sender: 'seguridad.informatica@medvibe.test',
        recipient: 'usuario@medvibe.test',
        cc: 'oficial.cumplimiento@medvibe.test',
        subject: 'URGENTE: Filtración de datos de candidatos / Reporte de Incidente',
        body: `Estimado Equipo,

Nuestra central de monitoreo ha detectado que la planilla "postulantes_2026_q3.xlsx" ha sido expuesta de forma pública desde los servidores de Agency Digital, debido a una vulnerabilidad en su lista de correo de proveedores compartidos.

Hemos corroborado que el archivo contiene datos de salud y religión de 15 personas. La Agencia de Protección de Datos Personales chilena iniciará un proceso de investigación sumario debido a la distribución no autorizada de Datos Sensibles sin consentimiento legal.

Por favor, presentarse en la oficina de Oficialía de Cumplimiento a primera hora.

Atentamente,
Departamento de Seguridad de la Información`,
        dateStr: '14 Ago 2026, 08:30'
      }
    },
    {
      triggerFlag: 'hiringDelayed',
      activeNotification: {
        id: 'notif-legal-hold',
        title: '💼 NOTIFICACIÓN: Trámite Legal Iniciado',
        message: 'Oficina Legal ha aprobado la plantilla de consentimiento obligatorio para postulaciones.',
        appToOpen: 'aelchat'
      },
      followUpEmail: {
        id: 'email-consequence-hold',
        sender: 'oficina.legal@medvibe.test',
        recipient: 'usuario@medvibe.test',
        cc: 'sofia.valenzuela@medvibe.test',
        subject: 'Nueva plantilla de Consentimiento de Datos para Selección de Personal',
        body: `Hola,

En relación al bloqueo preventivo que reportaron el día de ayer sobre la base de datos de postulantes para el rol de Consultor de Salud, hemos redactado la cláusula de consentimiento obligatorio.

A partir de hoy, todo postulante deberá firmar digitalmente la autorización de tratamiento de datos al cargar su postulación en nuestro portal. Esto nos permitirá realizar los análisis de reputación y verificar antecedentes de salud con proveedores externos bajo total cumplimiento de la Ley 21.719.

Agradecemos su rigurosidad en la detención del envío no regulado.

Saludos,
Área Legal MedVibe`,
        dateStr: '14 Ago 2026, 09:00'
      }
    },
    {
      triggerFlag: 'actionTaken', // fallback/default choice-send-sanitized
      activeNotification: {
        id: 'notif-success-hire',
        title: '✅ NOTIFICACIÓN: Verificación Finalizada',
        message: 'Proveedor externo reporta background check correcto de postulantes.',
        appToOpen: 'aelchat'
      },
      followUpEmail: {
        id: 'email-consequence-success',
        sender: 'martin.reyes@agency-digital.test',
        recipient: 'sofia.valenzuela@medvibe.test',
        cc: 'usuario@medvibe.test',
        subject: 'Re: Perfiles postulantes para Consultor de Salud Senior - Resultados',
        body: `Hola Sofía,

Gracias por enviarnos la versión filtrada de la base de candidatos conteniendo únicamente Nombres y Correos de contacto.

Hemos completado satisfactoriamente los análisis de reputación en redes abiertas profesionales. En base a los datos suministrados, sugerimos avanzar con los postulantes Tomás Ossa y Francisca Cruz.

Valoramos la confidencialidad en el proceso de reclutamiento al omitir datos personales adicionales o clínicos irrelevantes.

Saludos cordiales,
Martín Reyes
Director de Cuentas, Agency Digital`,
        dateStr: '14 Ago 2026, 09:45'
      }
    }
  ]
};
