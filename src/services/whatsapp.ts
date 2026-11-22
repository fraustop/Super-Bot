// WhatsApp Cloud API Service for Super-Bot Advisor Notifications
// Verified Phone Number: +52 1 81 4955 0863 (ID: 1408787295658370)
// WABA ID: 1692502295795134

export const WHATSAPP_CONFIG = {
  phoneNumberId: import.meta.env.VITE_WHATSAPP_PHONE_ID || '1408787295658370',
  wabaId: import.meta.env.VITE_WHATSAPP_WABA_ID || '1692502295795134',
  token:
    import.meta.env.VITE_WHATSAPP_TOKEN ||
    'EAAbOu8gwjJwBTLp7Fe4S0MmBmJm49fyYanW2SW1dDDTARFLdFMm1ScXZA55o69z0vIJIwdwNqsgHGkmkYkNCRFQFpFvOx6C1YwZA2qQUxKKZBKTPpkCmrJVZBbySnsYb1rOn6cVo9CsccH3573899BqbUcI5dV7YfCPgC9PdZBKi3m8QjJqYCZBeG49KEVdwZDZD',
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
    // 1. Intentar primero con plantilla en español si está activa
    try {
      const templateResponse = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: WHATSAPP_CONFIG.advisorPhone,
          type: 'template',
          template: {
            name: 'alerta_asesor_superbot',
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
    } catch {
      // Continuar con envío directo de texto
    }

    // 2. Envío directo del mensaje completo en español desde tu número verificado
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
