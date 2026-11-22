// WhatsApp Cloud API Service for Super-Bot Advisor Notifications

export const WHATSAPP_CONFIG = {
  phoneNumberId: import.meta.env.VITE_WHATSAPP_PHONE_ID || '1385905787947208',
  wabaId: import.meta.env.VITE_WHATSAPP_WABA_ID || '1073870509001853',
  token:
    import.meta.env.VITE_WHATSAPP_TOKEN ||
    'EAAbOu8gwjJwBTDGjT5JhIZAappDIgnHL0U9zZCURU87diLi8LdRhKQcLodYmeakno4zXx0x7ONsk9yeialHSaZCzeSFRRHRHVlcrsoxZCAr526nZBGc1OuRbbXlAbOuLaTYeF8ZCUGNkMzEbcz1ZCYnMZCaNvC236JQk0PWWNNL1U5kyilX16kyeBuWVv73ZCZBUgiZCxji1eli10iRrFWZCdpEGIMtVwcyZCYAUtCCUzWMKAVK6xN1bvyafXlzU7YpUYTAGOBhgo02vseTpUeJm165Jn',
  advisorPhone: import.meta.env.VITE_ADVISOR_PHONE || '528146018110'
};

export interface SendAdvisorNotificationParams {
  preference: 'call' | 'whatsapp';
  clientPhone: string;
  clientName?: string;
  requestId?: string;
  dateStr?: string;
}

export async function sendAdvisorWhatsAppNotification(
  params: SendAdvisorNotificationParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { preference, clientPhone, clientName, requestId, dateStr } = params;

  const nowFormatted = dateStr || new Date().toLocaleString('es-MX', {
    timeZone: 'America/Monterrey',
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const preferenceTitle =
    preference === 'call'
      ? '📞 QUIERE RECIBIR UNA LLAMADA TELEFÓNICA'
      : '💬 QUIERE RECIBIR UN MENSAJE DE WHATSAPP';

  const body = [
    '🤖 *¡NUEVA SOLICITUD DE ASESOR EN SUPERBOT!* 🚀',
    '',
    `📌 *Preferencia:* ${preferenceTitle}`,
    `📱 *Teléfono del cliente:* ${clientPhone}`,
    `👤 *Nombre / Negocio:* ${clientName?.trim() ? clientName.trim() : 'No especificado'}`,
    requestId ? `🆔 *ID en Firebase:* ${requestId}` : null,
    `📅 *Fecha y hora:* ${nowFormatted}`,
    '',
    preference === 'call'
      ? '👉 *Acción:* Marcarle al cliente para brindarle atención.'
      : '👉 *Acción:* Enviarle un mensaje de WhatsApp para resolver sus dudas.'
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${WHATSAPP_CONFIG.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WHATSAPP_CONFIG.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: WHATSAPP_CONFIG.advisorPhone,
          type: 'text',
          text: {
            preview_url: false,
            body
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Error from WhatsApp Cloud API:', data);
      return {
        success: false,
        error: data.error?.message || `HTTP ${response.status}: Error al enviar mensaje`
      };
    }

    const messageId = data.messages?.[0]?.id;
    return {
      success: true,
      messageId
    };
  } catch (err: any) {
    console.error('Network error sending WhatsApp notification:', err);
    return {
      success: false,
      error: err.message || 'Error de conexión con WhatsApp API'
    };
  }
}
