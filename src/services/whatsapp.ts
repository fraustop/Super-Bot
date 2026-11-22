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

  const nowFormatted =
    dateStr ||
    new Date().toLocaleString('es-MX', {
      timeZone: 'America/Monterrey',
      dateStyle: 'medium',
      timeStyle: 'short'
    });

  const preferenceTitle =
    preference === 'call'
      ? '📞 QUIERE RECIBIR UNA LLAMADA TELEFÓNICA'
      : '💬 QUIERE RECIBIR UN MENSAJE DE WHATSAPP';

  const bodySpanish = [
    '🤖 *¡NUEVA SOLICITUD DE ASESOR EN SUPERBOT!* 🚀',
    '',
    `📌 *Preferencia:* ${preferenceTitle}`,
    `📱 *Teléfono del cliente:* ${clientPhone}`,
    `👤 *Nombre / Negocio:* ${clientName?.trim() ? clientName.trim() : 'No especificado'}`,
    requestId ? `🆔 *ID en Firebase:* ${requestId}` : null,
    `📅 *Fecha y hora:* ${nowFormatted}`,
    '',
    preference === 'call'
      ? '👉 *Acción sugerida:* Marcarle al cliente para brindarle atención.'
      : '👉 *Acción sugerida:* Enviarle un mensaje de WhatsApp para resolver sus dudas.'
  ]
    .filter(Boolean)
    .join('\n');

  const url = `https://graph.facebook.com/v21.0/${WHATSAPP_CONFIG.phoneNumberId}/messages`;
  const headers = {
    Authorization: `Bearer ${WHATSAPP_CONFIG.token}`,
    'Content-Type': 'application/json'
  };

  try {
    // 1. Intentar primero con la plantilla oficial en español si ya fue aprobada por Meta
    try {
      const templateResponse = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: WHATSAPP_CONFIG.advisorPhone,
          type: 'template',
          template: {
            name: 'alerta_solicitud_asesor_v1',
            language: { code: 'es_MX' },
            components: [
              {
                type: 'body',
                parameters: [
                  {
                    type: 'text',
                    text:
                      preference === 'call'
                        ? 'Llamada telefónica'
                        : 'Mensaje de WhatsApp'
                  },
                  { type: 'text', text: clientPhone },
                  {
                    type: 'text',
                    text: clientName?.trim() || 'Cliente interesado'
                  }
                ]
              }
            ]
          }
        })
      });

      if (templateResponse.ok) {
        const tData = await templateResponse.json();
        return { success: true, messageId: tData.messages?.[0]?.id };
      }
    } catch (tErr) {
      console.warn('Plantilla en español en revisión por Meta, enviando mensaje directo en español:', tErr);
    }

    // 2. Envío directo del mensaje completo en español
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: WHATSAPP_CONFIG.advisorPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: bodySpanish
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error al enviar WhatsApp en español:', data);
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
    console.error('Error de red enviando WhatsApp:', err);
    return {
      success: false,
      error: err.message || 'Error de conexión con WhatsApp API'
    };
  }
}
