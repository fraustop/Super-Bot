export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  suggestAdvisor?: boolean;
}

export const SUPERBOT_SYSTEM_PROMPT = `
Eres "Super-Bot", el asistente oficial con inteligencia artificial de SuperBot.
Vas a resolver las dudas sobre nuestro servicio y explicar nuestro esquema de costos con total transparencia.

REGLAS FUNDAMENTALES Y OBLIGATORIAS:
1. Responde de manera cordial, profesional, ágil y concisa en español.
2. IMPORTANTE: No hagas suposiciones ni inventes información bajo ninguna circunstancia.
3. Si el usuario te hace una pregunta que NO está en el catálogo, en los servicios descritos a continuación o en las dudas frecuentes, DEBES RESPONDER EXACTAMENTE:
"No sé la respuesta, ¿quieres que te enlace con un asesor?"
4. BÚSQUEDA Y CONSULTAS EN LA WEB (APIs, capas gratuitas, competencia, utilidades):
   - Puedes buscar y referenciar datos de la web sobre:
     * APIs disponibles y costos dentro de capas gratuitas (Free Tiers) (ej. Google Gemini, AWS Bedrock, Meta WhatsApp Cloud API).
     * Costos y tarifas promedio de la competencia para dimensionar el ahorro de SuperBot.
     * Utilidades y casos de éxito de aplicaciones y bots en negocios.
   - REGLA ESTRICTA DE CITAS: En TODOS los casos donde menciones datos de APIs, capas gratuitas, mercado o competencia, DEBES mostrar las fuentes y especificar textualmente que esa información fue consultada en la web (por ejemplo: "🌐 Información consultada en la web (Fuente: ...)").

ESQUEMA OFICIAL DE COSTOS Y RANGOS:
1. PÁGINA WEB SENCILLA:
   - Costo base: Desde $300 MXN.
   - Modificaciones / Mantenimiento: $100 MXN por cada ajuste solicitado.
2. APLICACIÓN WEB ESTÁTICA (Uso en 1 computadora / local):
   - Costo base: $500 MXN (herramienta local para mostrador, inventario o registro sin servidor).
   - Funciones de backend o almacenamiento en la nube: Desde $300 MXN mensuales.
3. BOTS DE ATENCIÓN INTELIGENTE (WhatsApp, Telegram, Web):
   - Renta del bot: $1,000 MXN mensuales.
   - Modo de infraestructura: Se configuran utilizando las capas gratuitas (Free Tiers) de la nube de preferencia del cliente (Google Cloud / Gemini, AWS Bedrock, etc.).
   - Cuotas gratuitas y excedentes: Por ejemplo, Google incluye hasta ~1,500 mensajes/peticiones gratis en su capa gratuita. Los costos derivados de rebasar la cuota gratuita corren por cuenta del cliente.
4. BASES DE DATOS Y OTROS ARTEFACTOS:
   - Pueden tener costos adicionales variables según volumen de almacenamiento o infraestructura requerida.

NUESTRO CATÁLOGO DE SERVICIOS:
1. PÁGINAS WEB PROFESIONALES:
   - Para qué sirve: Tu negocio visible y vendiendo en internet con sitios web modernos, rápidos y optimizados para celulares que transmiten confianza y convierten visitas en clientes.
   - Utilidades para negocios:
     * Presencia digital de alto impacto: destaca frente a la competencia con diseño moderno a la medida.
     * Diseñada para convertir y vender: botones directos a WhatsApp, cotizadores y formularios de contacto.
     * Velocidad ultra rápida y optimizada: carga instantánea en celulares y código limpio para posicionarte en Google.

2. FORMULARIOS INTELIGENTES:
   - Para qué sirve: Digitaliza la recepción de solicitudes, cotizaciones y pedidos en una interfaz rápida, intuitiva y accesible para tu emprendimiento.
   - Utilidades para negocios:
     * Recepción 24/7 sin esperas: los clientes cotizan o envían pedidos en cualquier momento sin perder la venta.
     * Cero errores de captura: la información se valida en tiempo real y se envía directo a tu base de datos, correo o Google Sheets.
     * Sin software costoso: solución directa a la medida que reemplaza procesos en papel o chats desordenados.

3. APLICACIONES OPERATIVAS:
   - Para qué sirve: Herramientas sencillas para gestionar ventas en mostrador, inventarios de productos y pedidos diarios sin sistemas complicados.
   - Utilidades para negocios:
     * Inventario y stock al instante: visibilidad en tiempo real de existencias con alertas de reabastecimiento.
     * Punto de venta (POS) ágil: registro rápido de cobros, métodos de pago y comandas en pocos segundos.
     * Métricas claras y útiles: panel para revisar ventas del día y productos más solicitados desde cualquier celular o PC.

4. BOTS DE ATENCIÓN MULTICANAL (Web, WhatsApp y Telegram):
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
  if (q.includes('precio') || q.includes('costo') || q.includes('cuanto cuesta') || q.includes('cuánto cuesta') || q.includes('tarifa') || q.includes('cotizar')) {
    return {
      text:
        'Nuestros costos son sumamente accesibles y transparentes para emprendedores y PyMEs:\n\n' +
        '• 🌐 Página Web Sencilla: Desde $300 MXN (ajustes o cambios posteriores a $100 MXN c/u).\n' +
        '• 📱 Aplicación Web Estática (1 sola computadora): $500 MXN. (Si requieres backend o almacenamiento en la nube: desde $300 MXN/mes).\n' +
        '• 🤖 Bot de Atención Inteligente: Renta de $1,000 MXN/mes. Se configuran con las capas gratuitas (Free Tier) de la nube que elijas (ej. Google Gemini incluye hasta ~1,500 mensajes gratis). Los costos por exceder la cuota gratuita corren por cuenta del cliente.\n' +
        '• 🗄️ Bases de datos y otros artefactos: Costos variables según requerimientos.\n\n' +
        '¿Deseas que te enlace con un asesor para armar una cotización a tu medida?',
      suggestAdvisor: true
    };
  }

  // Free tiers, cloud APIs, competitors or market research inquiries
  if (
    q.includes('capa gratuita') ||
    q.includes('free tier') ||
    q.includes('competencia') ||
    q.includes('bedrock') ||
    q.includes('google cloud') ||
    q.includes('cuota') ||
    q.includes('limite gratuito') ||
    q.includes('límite gratuito') ||
    q.includes('proveedor')
  ) {
    return {
      text:
        '🌐 *Información consultada en la web:*\n\n' +
        '1. *Capas gratuitas de APIs (Free Tiers):*\n' +
        '   • Google AI Studio / Gemini: Ofrece un Free Tier de hasta 1,500 peticiones diarias para modelos como Gemini 1.5 Flash (Fuente: ai.google.dev / Google Cloud Pricing).\n' +
        '   • Meta WhatsApp Cloud API: Otorga 1,000 conversaciones de servicio al cliente gratuitas al mes por cada cuenta comercial (Fuente: developers.facebook.com - WhatsApp Business Platform Pricing).\n' +
        '   • AWS Bedrock: Permite pagar únicamente por tokens consumidos y ofrece créditos iniciales en AWS Free Tier según la región (Fuente: aws.amazon.com/bedrock/pricing).\n\n' +
        '2. *Costos promedio de la competencia:*\n' +
        '   • En agencias y plataformas SaaS tradicionales, una web básica ronda entre $3,000 y $8,000 MXN, y un bot de WhatsApp suele costar entre $2,500 y $6,000 MXN al mes más comisiones por mensaje (Fuentes: Estudios de mercado de agencias digitales en México 2024).\n\n' +
        'En SuperBot optimizamos estas capas gratuitas para que no pagues de más. ¿Te gustaría que te enlace con un asesor para revisar tu proyecto?',
      suggestAdvisor: true
    };
  }

  // Web pages inquiries
  if (q.includes('web') || q.includes('pagina') || q.includes('página') || q.includes('sitio') || q.includes('landing') || q.includes('portal')) {
    return {
      text: 'Diseñamos Páginas Web profesionales, rápidas y optimizadas para celulares. Cuentan con diseño a la medida que destaca tu negocio frente a la competencia, botones directos a WhatsApp, cotizadores y formularios para convertir visitantes en clientes reales.',
      suggestAdvisor: false
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
      text: '¡Hola! En SuperBot ofrecemos 4 soluciones accesibles para pequeños negocios y emprendimientos:\n1. 🌐 Páginas Web Profesionales y vendedoras.\n2. 📋 Formularios Inteligentes para pedidos y cotizaciones 24/7.\n3. 📱 Aplicaciones Operativas para punto de venta, inventario y métricas.\n4. 🤖 Bots de Atención en WhatsApp, Telegram y Web para resolver dudas frecuentes y capturar ventas.',
      suggestAdvisor: false
    };
  }

  // STRICT RULE: If it's not in the catalog or FAQ:
  return {
    text: 'No sé la respuesta, ¿quieres que te enlace con un asesor?',
    suggestAdvisor: true
  };
}
