export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  suggestAdvisor?: boolean;
}

export const SUPERBOT_SYSTEM_PROMPT = `
Eres "Super-Bot", el asistente oficial con inteligencia artificial de SuperBot.
Vas a resolver las dudas sobre nuestro servicio.

REGLAS FUNDAMENTALES Y OBLIGATORIAS:
1. Responde de manera cordial, profesional, ágil y concisa en español.
2. IMPORTANTE: No hagas suposiciones ni inventes información bajo ninguna circunstancia.
3. Si el usuario te hace una pregunta que NO está en el catálogo, en los servicios descritos a continuación o en las dudas frecuentes, DEBES RESPONDER EXACTAMENTE:
"No sé la respuesta, ¿quieres que te enlace con un asesor?"
4. No des costos o precios fijos inventados. Explica que son soluciones a costo muy accesible y adaptadas a la medida de cada emprendimiento, e invita a solicitar cotización con un asesor.

NUESTRO CATÁLOGO DE SERVICIOS:
1. FORMULARIOS INTELIGENTES:
   - Para qué sirve: Digitaliza la recepción de solicitudes, cotizaciones y pedidos en una interfaz rápida, intuitiva y accesible para tu emprendimiento.
   - Utilidades para negocios:
     * Recepción 24/7 sin esperas: los clientes cotizan o envían pedidos en cualquier momento sin perder la venta.
     * Cero errores de captura: la información se valida en tiempo real y se envía directo a tu base de datos, correo o Google Sheets.
     * Sin software costoso: solución directa a la medida que reemplaza procesos en papel o chats desordenados.

2. APLICACIONES OPERATIVAS:
   - Para qué sirve: Herramientas sencillas para gestionar ventas en mostrador, inventarios de productos y pedidos diarios sin sistemas complicados.
   - Utilidades para negocios:
     * Inventario y stock al instante: visibilidad en tiempo real de existencias con alertas de reabastecimiento.
     * Punto de venta (POS) ágil: registro rápido de cobros, métodos de pago y comandas en pocos segundos.
     * Métricas claras y útiles: panel para revisar ventas del día y productos más solicitados desde cualquier celular o PC.

3. BOTS DE ATENCIÓN MULTICANAL (Web, WhatsApp y Telegram):
   - Para qué sirve: Un asistente inteligente que atiende las dudas de tus prospectos en los canales donde ya se comunican y no deja escapar ninguna venta.
   - Utilidades para negocios:
     * Atención en WhatsApp, Telegram y chat Web 24/7.
     * Dudas frecuentes resueltas al segundo: horarios, catálogos, formas de entrega, métodos de pago y servicios.
     * Pase a humano: el bot califica el interés y te avisa cuando el cliente requiere confirmación o está listo para cerrar la compra.
`;

export function getGeminiApiKey(): string {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey !== 'your_gemini_api_key_here') return envKey;
  return localStorage.getItem('superbot_gemini_api_key') || '';
}

export function saveGeminiApiKey(key: string): void {
  localStorage.setItem('superbot_gemini_api_key', key.trim());
}

export async function askGemini(
  conversationHistory: ChatMessage[],
  newMessage: string
): Promise<{ text: string; suggestAdvisor: boolean }> {
  const apiKey = getGeminiApiKey();

  // If live API key is configured, invoke Gemini API endpoint
  if (apiKey) {
    try {
      const contents = [
        ...conversationHistory.slice(-8).map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        })),
        {
          role: 'user',
          parts: [{ text: newMessage }]
        }
      ];

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SUPERBOT_SYSTEM_PROMPT }]
          },
          contents,
          generationConfig: {
            temperature: 0.2, // Low temperature for high adherence to knowledge base without hallucinations
            topP: 0.8,
            maxOutputTokens: 500
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Gemini API returned error status:', response.status, errorData);
        throw new Error(errorData?.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const trimmed = rawText.trim();

      const suggestAdvisor =
        trimmed.toLowerCase().includes('enlace con un asesor') ||
        trimmed.toLowerCase().includes('asesor') ||
        trimmed.toLowerCase().includes('no sé la respuesta');

      return {
        text: trimmed || 'No sé la respuesta, ¿quieres que te enlace con un asesor?',
        suggestAdvisor
      };
    } catch (err) {
      console.warn('Error connecting to Gemini API, using built-in knowledge engine:', err);
    }
  }

  // Built-in intelligent engine adhering strictly to user prompt rules:
  return fallbackKnowledgeEngine(newMessage);
}

function fallbackKnowledgeEngine(query: string): { text: string; suggestAdvisor: boolean } {
  const q = query.toLowerCase().trim();

  // Direct advisor request
  if (q.includes('asesor') || q.includes('humano') || q.includes('hablar con') || q.includes('contacto') || q.includes('llamada') || q.includes('telefono') || q.includes('teléfono')) {
    return {
      text: '¡Con gusto te enlazo con nuestro equipo! Puedes elegir si prefieres recibir una llamada telefónica o un mensaje por WhatsApp.',
      suggestAdvisor: true
    };
  }

  // Price or cost inquiries
  if (q.includes('precio') || q.includes('costo') || q.includes('cuanto cuesta') || q.includes('cuánto cuesta') || q.includes('tarifa')) {
    return {
      text: 'Nuestras soluciones (formularios, aplicaciones operativas y bots) se adaptan a la medida de tu negocio con costos sumamente accesibles para emprendimientos y PyMEs. No manejamos costos fijos rígidos, ¿quieres que te enlace con un asesor para darte una cotización a tu medida?',
      suggestAdvisor: true
    };
  }

  // Forms inquiries
  if (q.includes('formulario') || q.includes('intake') || q.includes('cotizacion') || q.includes('cotización') || q.includes('pedido')) {
    return {
      text: 'Nuestros Formularios Inteligentes permiten digitalizar la recepción de solicitudes, cotizaciones y pedidos 24/7 sin esperas. Evitan errores manuales validando la información en tiempo real y conectándose directo a tu base de datos o correo, sin necesidad de software costoso.',
      suggestAdvisor: false
    };
  }

  // Operational apps inquiries
  if (q.includes('aplicacion') || q.includes('aplicación') || q.includes('app') || q.includes('inventario') || q.includes('pos') || q.includes('punto de venta') || q.includes('stock')) {
    return {
      text: 'Nuestras Aplicaciones Operativas están diseñadas para pequeños negocios: te permiten controlar inventarios y existencias en tiempo real con alertas de reabastecimiento, operar un punto de venta (POS) ágil para cobrar en segundos y consultar métricas claras de tus ventas diarias desde tu celular o computadora.',
      suggestAdvisor: false
    };
  }

  // Bots inquiries (WhatsApp, Telegram, Web)
  if (q.includes('bot') || q.includes('whatsapp') || q.includes('telegram') || q.includes('pregunta') || q.includes('atencion') || q.includes('atención') || q.includes('chat')) {
    return {
      text: 'Nuestros Bots de Atención atienden en WhatsApp, Telegram y en tu sitio Web 24/7. Resuelven dudas frecuentes al instante (horarios, catálogos, métodos de pago, envíos) y cuando el cliente está listo para comprar o necesita atención especial, te transfieren la conversación para cerrar la venta.',
      suggestAdvisor: false
    };
  }

  // General services question
  if (q.includes('que hacen') || q.includes('qué hacen') || q.includes('que ofrecen') || q.includes('qué ofrecen') || q.includes('servicios') || q.includes('hola') || q.includes('saludos')) {
    return {
      text: '¡Hola! En SuperBot ofrecemos 3 soluciones accesibles para pequeños negocios y emprendimientos:\n1. 📋 Formularios Inteligentes para pedidos y cotizaciones 24/7.\n2. 📱 Aplicaciones Operativas para punto de venta, inventario y métricas.\n3. 🤖 Bots de Atención en WhatsApp, Telegram y Web para resolver dudas frecuentes y capturar ventas.',
      suggestAdvisor: false
    };
  }

  // STRICT RULE: If it's not in the catalog or FAQ:
  return {
    text: 'No sé la respuesta, ¿quieres que te enlace con un asesor?',
    suggestAdvisor: true
  };
}
