import { getActiveBotKnowledge } from './botKnowledgeService';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  suggestAdvisor?: boolean;
  actionLink?: {
    url: string;
    label: string;
  };
}

export function buildDynamicSystemPrompt(): string {
  const kb = getActiveBotKnowledge();
  return `
Eres "Super-Bot", el asesor comercial y asistente inteligente oficial de SuperBot.
Tu misión es atender a los clientes, resolver sus dudas sobre nuestros servicios, explicar nuestro esquema de costos con total claridad y motivarlos a hacer crecer su negocio con nuestras soluciones.

1. PERSONALIDAD Y ACTITUD DE VENDEDOR:
   - Actúa siempre como un vendedor profesional: cordial, entusiasta, empático, seguro y enfocado en aportar valor al negocio del cliente.
   - Resalta siempre los beneficios reales y tangibles: más ventas, atención 24/7 sin descuidar tu tiempo personal, imagen moderna que genera confianza, y precios mucho más accesibles que cualquier agencia tradicional.
   - Cierra tus respuestas de cotización o explicación con una pregunta amable o llamado a la acción comercial (CTA) (por ejemplo: "¿Qué te parece esta opción para tu negocio?", "¿Te gustaría que iniciemos con tu proyecto?", "¿Quieres que te prepare una propuesta a tu medida?").

2. LENGUAJE CLARO Y CERO TECNICISMOS (REGLA FUNDAMENTAL):
   - Habla en lenguaje sencillo, cotidiano y 100% comprensible para cualquier emprendedor o dueño de negocio.
   - REGLA DE ORO: ${
     kb.rules.avoidTechnicalJargon
       ? 'EVITA TOTALMENTE LOS TECNICISMOS (no menciones microservicios, tokens, latencias, RAM, webhooks, TPM/RPM, arquitecturas cloud complejas o términos de ingeniería), a menos que el cliente te pregunte DIRECTAMENTE por un dato técnico específico.'
       : 'Puedes incluir datos técnicos si ayudan a clarificar la propuesta.'
   }
   - En lugar de tecnicismos, explica todo en términos de beneficios de negocio:
     * En vez de "servidor en CDN con SSL": "tu página estará siempre disponible en internet, abrirá súper rápido en celulares y tendrá su candadito de seguridad".
     * En vez de "Free Tier de ${kb.quotas.geminiFreeDaily} peticiones en Gemini": "te incluye hasta ${kb.quotas.geminiFreeDaily} mensajes o preguntas diarias de clientes gratis con Inteligencia Artificial".
     * En vez de "WABA service conversations": "WhatsApp te regala ${kb.quotas.whatsappFreeMonthly} conversaciones de clientes al mes sin cobrarte nada".
     * En vez de "base de datos NoSQL": "un sistema seguro para guardar tus pedidos, clientes e inventario en tiempo real".
   - EXCEPCIÓN ÚNICA: Si el cliente solicita explícitamente un dato técnico puntual (ejemplo: "¿cuántos tokens incluye?", "¿qué memoria RAM o servidor usan?", "¿cuál es el RPM/TPM?", "¿qué base de datos es?"), respóndele con los datos técnicos exactos de manera precisa y concisa.

3. REGLA ESTRICTA DE VERACIDAD:
   - IMPORTANTE: No hagas suposiciones ni inventes información bajo ninguna circunstancia.
   - Si el usuario te hace una pregunta que NO está en el catálogo, en los servicios descritos a continuación o en las dudas frecuentes, DEBES RESPONDER EXACTAMENTE:
     "No sé la respuesta, ¿quieres que te enlace con un asesor?"

4. ASISTENCIA SI EL CLIENTE PREGUNTA SI PUEDE HACER LA PÁGINA ÉL MISMO:
   - Si el cliente pregunta si puede hacer la página él mismo o si la IA le puede ayudar a crearla (ej. "¿puedo hacer mi página yo mismo?", "¿me puedes ayudar a hacer la página yo?", "¿cómo creo mi propia web?"):
   - Explícale con entusiasmo que la Inteligencia Artificial puede asistirlo y guiarlo paso a paso para redactar, diseñar y estructurar su propia página sin complicaciones.
   - Proporciónale el enlace para abrir Google Gemini en otra pestaña o ventana: https://gemini.google.com para que la IA lo asista de forma gratuita e interactiva.
   - Como buen vendedor, recuérdale con simpatía que si en algún momento prefiere ahorrar tiempo y esfuerzo para que nosotros se la entreguemos ya lista, bonita y optimizada desde solo $${kb.pricing.webBasic} MXN, ¡estaremos felices de apoyarlo!

5. BÚSQUEDA Y CONSULTAS EN LA WEB (APIs, capas gratuitas, competencia, utilidades):
   - Puedes buscar y referenciar datos de la web sobre:
     * APIs disponibles y cuotas dentro de capas gratuitas (Free Tiers) (ej. Google Gemini, AWS Bedrock, Meta WhatsApp Cloud API).
     * Costos y tarifas promedio de la competencia para dimensionar el ahorro de SuperBot.
     * Utilidades y casos de éxito de aplicaciones y bots en negocios.
   - REGLA DE CITAS: En TODOS los casos donde menciones datos de APIs, capas gratuitas, mercado o competencia, DEBES mostrar las fuentes y especificar textualmente que esa información fue consultada en la web (por ejemplo: "🌐 Información consultada en la web (Fuente: ...)").

6. MOTOR AUTÓNOMO DE COTIZACIONES (SIN INTERVENCIÓN DE ASESOR):
   - Super-Bot DEBE calcular cotizaciones y presupuestos inmediatamente por sí mismo cuando el usuario lo solicite, sin esperar ni derivar obligatoriamente a un asesor.
   - REGLAS DE COTIZACIÓN AUTÓNOMA:
     * Calcula y desglosa el costo inicial (pago único) y el costo mensual recurrente (si aplica).
     * Muestra siempre el comparativo frente a lo que cobra la competencia en el mercado (citando la fuente web) para evidenciar el ahorro que obtiene con SuperBot (siempre por debajo de la competencia).
     * Muestra la transparencia de los Free Tiers en la nube (ej. ${kb.quotas.geminiFreeDaily} mensajes diarios gratis en Google Gemini, ${kb.quotas.whatsappFreeMonthly} conversaciones de servicio gratis en WhatsApp Cloud API).
     * Si el cliente pide un paquete personalizado (ej. "web con bot de WhatsApp", "punto de venta con nube"), suma los conceptos con la tabla de tarifas y entrégale el total desglosado.
     * Al final de la cotización, invita al cliente a iniciar el proyecto o solicitar confirmación si está listo para contratar.

ESQUEMA OFICIAL DE COSTOS Y RANGOS EN VIVO:
1. PÁGINA WEB SENCILLA:
   - Costo base: Desde $${kb.pricing.webBasic} MXN (pago único inicial).
   - Modificaciones / Mantenimiento: $${kb.pricing.webAdjustment} MXN por cada ajuste solicitado.
2. APLICACIÓN WEB ESTÁTICA (Uso en 1 computadora / local):
   - Costo base: $${kb.pricing.appStatic} MXN (herramienta local para mostrador, inventario o registro sin servidor).
   - Funciones de backend o almacenamiento en la nube: Desde $${kb.pricing.appCloudMonthly} MXN mensuales.
3. BOTS DE ATENCIÓN INTELIGENTE (WhatsApp, Telegram, Web):
   - Renta del bot: $${kb.pricing.botMonthly} MXN mensuales.
   - Modo de infraestructura: Se configuran en las capas gratuitas (Free Tiers) de la nube de preferencia del cliente (Google Cloud / Gemini, AWS Bedrock, etc.).
   - Cuotas gratuitas y excedentes: Por ejemplo, Google incluye hasta ~${kb.quotas.geminiFreeDaily} mensajes/preguntas diarios gratis en su capa gratuita. Los costos derivados de rebasar la cuota gratuita corren por cuenta del cliente (centavos directos del proveedor sin sobreprecio).
4. BASES DE DATOS Y OTROS ARTEFACTOS:
   - Pueden tener costos adicionales variables según volumen de almacenamiento o infraestructura requerida.

${kb.customNotes ? `\nNOTAS Y PROMOCIONES ACTIVAS DEL ADMINISTRADOR:\n${kb.customNotes}\n` : ''}
${
  kb.knowledgeBlocks && kb.knowledgeBlocks.length > 0
    ? `\nOBJETOS Y PAQUETES MAESTROS CONFIGURADOS POR EL ENTRENADOR (FIRESTORE):\n${kb.knowledgeBlocks
        .filter((b) => b.status === 'active')
        .map((b, i) => `${i + 1}. [${b.category.toUpperCase()}] ${b.title}:\n   ${b.content}`)
        .join('\n\n')}\n`
    : ''
}

INFORMACIÓN DETALLADA DE CUOTAS DE IA, SERVIDORES Y PROVEEDORES EN LA NUBE:
* Inteligencia Artificial (Google Gemini 1.5 Flash):
  - Explicación sencilla (ventas): Incluye hasta ${kb.quotas.geminiFreeDaily} mensajes o preguntas diarias totalmente gratis. Cubre de sobra a todos los clientes de un día normal sin pagar nada extra. Si un día superas esa cuota, el costo adicional es de solo centavos (aprox. $1.50 a $3.00 MXN por cada 1,000 mensajes adicionales).
  - Dato técnico (si lo piden): Capa gratuita con 15 RPM (peticiones/minuto), 1 millón de TPM (tokens/minuto) y 1,500 RPD (peticiones/día). Excedentes Pay-As-You-Go a $0.075 USD / 1M tokens input y $0.30 USD / 1M tokens output (🌐 Fuente: ai.google.dev).
* Meta WhatsApp Cloud API:
  - Explicación sencilla: Meta te regala ${kb.quotas.whatsappFreeMonthly} conversaciones de atención al cliente gratis cada mes. Pasando esa cantidad, Meta cobra una pequeña tarifa por conversación (unos $0.70 a $1.20 MXN).
  - Dato técnico (si lo piden): 1,000 Service Conversations gratuitas al mes por cuenta WABA oficial. Mensajes salientes de mercadotecnia entre $0.035 y $0.063 USD por conversación en México (🌐 Fuente: developers.facebook.com).
* Telegram Bot API:
  - 100% gratuito e ilimitado para cualquier volumen de mensajes sin costos de licencia ni mensualidades.
* Servidores y Hosting Web:
  - Explicación sencilla: Tu página o sistema se aloja en servidores de alta velocidad en la nube con candado de seguridad SSL y protección continua contra caídas. No genera renta fija mensual de servidor en proyectos estándar porque la capacidad gratuita cubre decenas de miles de visitas al mes.
  - Dato técnico (si lo piden): Hosting en CDN global (Firebase Hosting / Cloudflare) con 10 GB de almacenamiento y 360 MB/día de transferencia gratuita. Servidores dedicados VPS (AWS EC2, Google Cloud Compute o DigitalOcean) entre $4 y $12 USD/mes ($80 a $240 MXN/mes).
* Bases de Datos en la Nube (Firestore / Cloud):
  - Explicación sencilla: Guarda todos tus clientes, productos y pedidos de forma segura. Incluye hasta 50,000 consultas diarias gratis, suficiente para operar diario sin costo de almacenamiento.
  - Dato técnico (si lo piden): Firebase Spark Plan con 50,000 lecturas y 20,000 escrituras diarias y 1 GB de almacenamiento gratuito (🌐 Fuente: firebase.google.com/pricing).

NUESTRO CATÁLOGO DE SERVICIOS:
1. PÁGINAS WEB PROFESIONALES (Desde $${kb.pricing.webBasic} MXN):
   - Para qué sirve: Tu negocio visible y vendiendo en internet con sitios web modernos, rápidos y optimizados para celulares que transmiten confianza y convierten visitas en clientes.
   - Beneficios para el negocio: Presencia digital de alto impacto, diseñada para vender con botones a WhatsApp y cotizadores, carga instantánea en celulares y optimizada para Google.
2. FORMULARIOS INTELIGENTES:
   - Para qué sirve: Digitaliza la recepción de pedidos, cotizaciones y solicitudes en una interfaz rápida e intuitiva.
   - Beneficios para el negocio: Recepción 24/7 sin esperas, cero errores de captura y conexión directa a correo o base de datos.
3. APLICACIONES OPERATIVAS (Desde $${kb.pricing.appStatic} MXN):
   - Para qué sirve: Herramientas sencillas para gestionar ventas en mostrador, inventarios de productos y pedidos diarios.
   - Beneficios para el negocio: Inventario al instante con alertas, punto de venta ágil para cobrar en segundos y métricas claras.
4. BOTS DE ATENCIÓN MULTICANAL ($${kb.pricing.botMonthly} MXN/mes):
   - Para qué sirve: Asistente con Inteligencia Artificial que atiende a tus prospectos en WhatsApp, Telegram y Web 24/7.
   - Beneficios para el negocio: Respuestas inmediatas a dudas frecuentes y traspaso a humano cuando el cliente está listo para comprar.
`;
}

export const SUPERBOT_SYSTEM_PROMPT = buildDynamicSystemPrompt();

export function getGeminiApiKey(): string {
  try {
    const envKey = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_GEMINI_API_KEY : '';
    if (envKey && envKey !== 'your_gemini_api_key_here') return envKey;
  } catch {
    // ignore
  }
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('superbot_gemini_api_key') || '';
    }
  } catch {
    // ignore
  }
  return '';
}

export function saveGeminiApiKey(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('superbot_gemini_api_key', key.trim());
    }
  } catch {
    // ignore
  }
}

export async function askGemini(
  conversationHistory: ChatMessage[],
  newMessage: string
): Promise<{ text: string; suggestAdvisor: boolean; actionLink?: { url: string; label: string } }> {
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
            parts: [{ text: buildDynamicSystemPrompt() }]
          },
          contents,
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            maxOutputTokens: 600
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

      const isSelfBuildOrGemini =
        trimmed.toLowerCase().includes('gemini.google.com') ||
        newMessage.toLowerCase().includes('yo mismo') ||
        newMessage.toLowerCase().includes('yo misma') ||
        newMessage.toLowerCase().includes('hacerla yo') ||
        newMessage.toLowerCase().includes('hacer mi propia');

      return {
        text: trimmed || 'No sé la respuesta, ¿quieres que te enlace con un asesor?',
        suggestAdvisor,
        actionLink: isSelfBuildOrGemini
          ? {
              url: 'https://gemini.google.com',
              label: '🚀 Abrir Google Gemini en otra pestaña'
            }
          : undefined
      };
    } catch (err) {
      console.warn('Error connecting to Gemini API, using built-in dynamic knowledge engine:', err);
    }
  }

  // Built-in intelligent engine adhering strictly to dynamic knowledge:
  return fallbackKnowledgeEngine(newMessage);
}

function fallbackKnowledgeEngine(query: string): {
  text: string;
  suggestAdvisor: boolean;
  actionLink?: { url: string; label: string };
} {
  const q = query.toLowerCase().trim();
  const kb = getActiveBotKnowledge();

  // 1. Direct advisor request
  if (
    q.includes('asesor') ||
    q.includes('humano') ||
    q.includes('hablar con') ||
    q.includes('contacto') ||
    q.includes('llamada') ||
    q.includes('telefono') ||
    q.includes('teléfono')
  ) {
    return {
      text: '¡Con gusto te enlazo con nuestro equipo comercial! Puedes elegir si prefieres recibir una llamada telefónica o un mensaje por WhatsApp para revisar tu proyecto sin compromiso.',
      suggestAdvisor: true
    };
  }

  // 2. Client asks to make the webpage themselves (Redirect to Gemini in new tab)
  const isSelfBuild =
    q.includes('yo mismo') ||
    q.includes('yo misma') ||
    q.includes('hacerla yo') ||
    q.includes('hacerlo yo') ||
    q.includes('hacer mi propia') ||
    q.includes('crear mi propia') ||
    q.includes('hacer una pagina yo') ||
    q.includes('hacer una página yo') ||
    q.includes('puedo hacer mi') ||
    q.includes('puedo crear mi') ||
    q.includes('hacerla por mi cuenta') ||
    q.includes('hacerlo por mi cuenta') ||
    (q.includes('ayud') &&
      (q.includes('hacer') || q.includes('crear') || q.includes('programar') || q.includes('diseñar')) &&
      (q.includes('pagina') || q.includes('página') || q.includes('web') || q.includes('sitio')));

  if (isSelfBuild) {
    return {
      text:
        '¡Claro que sí! Tú mismo puedes crear tu página web con el apoyo de la Inteligencia Artificial. La IA te puede ir guiando paso a paso, redactar tus textos, sugerirte diseños y estructurar tu código de forma muy sencilla sin que tengas que ser programador.\n\n' +
        'Te recomendamos usar **Google Gemini**, que es gratuito, amigable y muy potente para ayudarte a crear tu sitio en tiempo real.\n\n' +
        `👉 *Consejo:* Si en cualquier momento prefieres ahorrar tiempo y esfuerzo para que nosotros te la entreguemos ya lista, profesional y vendiendo desde solo *$${kb.pricing.webBasic} MXN*, ¡con gusto te apoyamos!\n\n` +
        'Haz clic en el botón de abajo para abrir Google Gemini en otra pestaña y comenzar:',
      suggestAdvisor: false,
      actionLink: {
        url: 'https://gemini.google.com',
        label: '🚀 Abrir Google Gemini en otra pestaña'
      }
    };
  }

  // 3. Autonomous Quotation Engine (Dynamic prices from Firestore / Active Knowledge)
  const isQuoting =
    q.includes('cotiz') ||
    q.includes('presupuesto') ||
    q.includes('cuanto me sal') ||
    q.includes('cuánto me sal') ||
    q.includes('cuanto cuesta') ||
    q.includes('cuánto cuesta') ||
    q.includes('costo') ||
    q.includes('precio') ||
    q.includes('tarifa') ||
    q.includes('paquete');

  if (isQuoting) {
    // 3.1 Combo / Paquete integral (Web + Bot o POS + Bot)
    if (
      (q.includes('bot') || q.includes('whatsapp')) &&
      (q.includes('web') || q.includes('pagina') || q.includes('página') || q.includes('pos') || q.includes('app') || q.includes('combo') || q.includes('todo'))
    ) {
      return {
        text:
          '📋 *COTIZACIÓN ESTIMADA: PAQUETE INTEGRAL DIGITAL*\n\n' +
          `• 🌐 *Página Web Profesional:* $${kb.pricing.webBasic} MXN (pago único inicial).\n` +
          `• 🤖 *Bot de Atención en WhatsApp con IA:* $${kb.pricing.botMonthly} MXN / mes.\n` +
          `• ☁️ *Infraestructura Cloud:* $0 adicionales en cuota gratuita (incluye hasta ${kb.quotas.geminiFreeDaily} mensajes diarios con Google Gemini y ${kb.quotas.whatsappFreeMonthly} conversaciones de atención en WhatsApp al mes).\n\n` +
          '💰 *TOTAL DE LA PROPUESTA:*\n' +
          `• *Pago único de inicio:* $${kb.pricing.webBasic} MXN\n` +
          `• *Renta mensual:* $${kb.pricing.botMonthly} MXN / mes (sin contratos forzosos)\n\n` +
          '📊 *Comparativa de mercado (🌐 Fuente web: Estudios de agencias digitales en México 2024):*\n' +
          '• En agencias tradicionales este combo cuesta entre $7,500 y $15,000 MXN de setup + más de $3,500 MXN/mes.\n' +
          '👉 *¡Con SuperBot ahorras más del 80% comparado con la competencia!* ¿Qué te parece si arrancamos con tu paquete integral esta misma semana?',
        suggestAdvisor: true
      };
    }

    // 3.2 Cotización de Página Web
    if (q.includes('web') || q.includes('pagina') || q.includes('página') || q.includes('landing') || q.includes('sitio')) {
      return {
        text:
          '📋 *COTIZACIÓN ESTIMADA: PÁGINA WEB PROFESIONAL*\n\n' +
          `• 🌐 *Página Web de Alto Impacto:* Desde $${kb.pricing.webBasic} MXN (pago único).\n` +
          '  - Incluye: Diseño responsivo para celulares, optimización SEO para Google y botón directo a WhatsApp.\n' +
          `• 🛠️ *Ajustes o secciones adicionales:* $${kb.pricing.webAdjustment} MXN por cada cambio o sección extra.\n\n` +
          `💰 *TOTAL DE LA PROPUESTA:* Desde *$${kb.pricing.webBasic} MXN* (pago único, sin mensualidades obligatorias).\n\n` +
          '📊 *Comparativa de mercado (🌐 Fuente web: Artech & Nebugrama 2024):*\n' +
          '• El precio promedio de una web básica en México oscila entre $4,000 y $9,000 MXN.\n' +
          '👉 *¡En SuperBot obtienes presencia profesional garantizada por una fracción del costo!* ¿Te gustaría que comencemos a diseñarla hoy mismo?',
        suggestAdvisor: true
      };
    }

    // 3.3 Cotización de Aplicación Web Operativa / POS / Inventario
    if (
      q.includes('aplicacion') ||
      q.includes('aplicación') ||
      q.includes('app') ||
      q.includes('pos') ||
      q.includes('inventario') ||
      q.includes('punto de venta')
    ) {
      const needsCloud = q.includes('nube') || q.includes('servidor') || q.includes('backend') || q.includes('sucursal') || q.includes('celular');
      return {
        text:
          '📋 *COTIZACIÓN ESTIMADA: APLICACIÓN OPERATIVA / POS*\n\n' +
          `• 🖥️ *Versión Local (1 computadora / mostrador):* $${kb.pricing.appStatic} MXN (pago único, sin mensualidades).\n` +
          `• ☁️ *Versión Cloud con Base de Datos:* $${kb.pricing.appStatic} MXN inicial + desde $${kb.pricing.appCloudMonthly} MXN / mes (permite ver inventarios y ventas en tiempo real desde tu celular o varias computadoras).\n\n` +
          `💰 *TOTAL DE LA PROPUESTA:* ${needsCloud ? `$${kb.pricing.appStatic} MXN inicial + $${kb.pricing.appCloudMonthly} MXN/mes` : `$${kb.pricing.appStatic} MXN pago único`}.\n\n` +
          '📊 *Comparativa de mercado (🌐 Fuente web: Siigo & Alegra México 2024):*\n' +
          '• Los sistemas POS en la nube comerciales cobran entre $600 y $1,500 MXN mensuales por caja o sucursal.\n' +
          '👉 *¡Con SuperBot ahorras más del 60% mensual y tienes el control total de tu negocio!* ¿Te gustaría que activemos tu aplicación operativa?',
        suggestAdvisor: true
      };
    }

    // 3.4 Cotización de Bot de Atención
    if (q.includes('bot') || q.includes('whatsapp') || q.includes('telegram')) {
      return {
        text:
          '📋 *COTIZACIÓN ESTIMADA: BOT DE ATENCIÓN INTELIGENTE*\n\n' +
          `• 🤖 *Renta de Software del Bot:* $${kb.pricing.botMonthly} MXN / mes.\n` +
          `• ☁️ *Consumo de IA y Mensajes:* $0 adicionales en cuota gratuita (Google Gemini incluye hasta ~${kb.quotas.geminiFreeDaily} mensajes diarios y Meta WhatsApp ${kb.quotas.whatsappFreeMonthly} conversaciones de clientes gratis al mes).\n` +
          '• 📈 *Sin sobreprecios:* Si superas la cuota gratuita, solo cubres el consumo neto directo del proveedor (centavos por mensaje).\n\n' +
          `💰 *TOTAL DE LA PROPUESTA:* *$${kb.pricing.botMonthly} MXN / mes* (sin costos ocultos ni plazos forzosos).\n\n` +
          '📊 *Comparativa de mercado (🌐 Fuente web: Kosmo IA & Uniamos 2024):*\n' +
          '• Las agencias de chatbots en México cobran desde $2,500 hasta $8,000 MXN mensuales + instalación de más de $10,000 MXN.\n' +
          '👉 *¡Con SuperBot tienes IA de última generación atendiendo a tus clientes 24/7 a un tercio del costo!* ¿Deseas configurarlo para tu número de WhatsApp?',
        suggestAdvisor: true
      };
    }

    // 3.5 Cotización General / Resumen de tarifas
    return {
      text:
        '📋 *COTIZADOR AUTÓNOMO SUPERBOT: RANGOS DE PRECIOS*\n\n' +
        `• 🌐 *Página Web Profesional:* Desde $${kb.pricing.webBasic} MXN (ajustes a $${kb.pricing.webAdjustment} MXN c/u).\n` +
        `• 📱 *Aplicación Web Estática (1 PC):* $${kb.pricing.appStatic} MXN pago único (con sincronización en la nube: desde $${kb.pricing.appCloudMonthly} MXN/mes).\n` +
        `• 🤖 *Bot de Atención Inteligente:* $${kb.pricing.botMonthly} MXN/mes aprovechando cuotas gratuitas (ej. Google Gemini con hasta ${kb.quotas.geminiFreeDaily} mensajes diarios gratis).\n` +
        '• 🗄️ *Bases de datos y artefactos:* Variables según requerimientos de almacenamiento.\n\n' +
        '📊 *Comparativa de mercado (🌐 Fuente web: Estudios de desarrollo web y software en México 2024):*\n' +
        '• En agencias tradicionales los costos van de $4,000 a $15,000 MXN. En SuperBot nuestros precios son siempre transparentes, justos y accesibles.\n\n' +
        '¿Qué solución le vendría mejor a tu negocio en este momento?',
      suggestAdvisor: true
    };
  }

  // 4. Server, cloud quotas, hosting, technical inquiries
  const isTechnical =
    q.includes('token') ||
    q.includes('tokens') ||
    q.includes('ram') ||
    q.includes('tpm') ||
    q.includes('rpm') ||
    q.includes('vps') ||
    q.includes('latencia') ||
    q.includes('webhook') ||
    q.includes('microservicio') ||
    q.includes('dato tecnico') ||
    q.includes('dato técnico') ||
    q.includes('especificacion') ||
    q.includes('especificación') ||
    q.includes('firestore tecnico');

  const isServerOrQuota =
    q.includes('servidor') ||
    q.includes('servidores') ||
    q.includes('hosting') ||
    q.includes('alojamiento') ||
    q.includes('nube') ||
    q.includes('cloud') ||
    q.includes('cuota') ||
    q.includes('capa gratuita') ||
    q.includes('free tier') ||
    q.includes('limite gratuito') ||
    q.includes('límite gratuito') ||
    q.includes('proveedor') ||
    q.includes('bedrock') ||
    q.includes('google cloud') ||
    isTechnical;

  if (isServerOrQuota) {
    if (isTechnical) {
      return {
        text:
          '🌐 *Especificaciones Técnicas de Infraestructura Cloud:*\n\n' +
          `• 🤖 *Google Gemini 1.5 Flash:* Capa gratuita de 15 RPM, 1,000,000 TPM y ${kb.quotas.geminiFreeDaily} peticiones/día. Costo en plan Pay-As-You-Go: $0.075 USD por 1M tokens de entrada y $0.30 USD por 1M tokens de salida (🌐 Fuente: ai.google.dev/pricing).\n\n` +
          `• 💬 *Meta WhatsApp Cloud API:* ${kb.quotas.whatsappFreeMonthly} Service Conversations mensuales gratuitas por WABA oficial. Mensajes salientes de utilidad/marketing entre $0.035 y $0.063 USD por conversación en México (🌐 Fuente: developers.facebook.com).\n\n` +
          '• ☁️ *Alojamiento y CDN:* Firebase Hosting / Global Edge CDN con 10 GB de almacenamiento, 360 MB/día de transferencia gratuita y certificado SSL TLS automático. Servidores VPS dedicados opcionales desde $4 USD/mes en AWS EC2 o GCP.\n\n' +
          '• 🗄️ *Base de datos NoSQL:* Firestore Spark Plan con 50,000 lecturas y 20,000 escrituras diarias y 1 GB de almacenamiento gratuito (🌐 Fuente: firebase.google.com).\n\n' +
          '¿Deseas que adaptemos esta infraestructura para el proyecto de tu negocio?',
        suggestAdvisor: true
      };
    }

    // Default: Friendly salesperson explanation, zero jargon, clear business value
    return {
      text:
        '¡Con gusto te explico! En SuperBot aprovechamos la mejor tecnología en la nube para que tengas máxima velocidad y el mejor precio sin costos ocultos ni letras chiquitas:\n\n' +
        `• 🤖 *Inteligencia Artificial para tu Bot:* Google Gemini te incluye hasta *${kb.quotas.geminiFreeDaily} mensajes o preguntas diarias totalmente gratis*. Esto cubre de sobra a todos los clientes que te escriban en un día normal. Si tu negocio crece y superas esa cuota, el costo adicional es de solo centavos (alrededor de $1.50 MXN por cada 1,000 mensajes extra).\n\n` +
        `• 💬 *WhatsApp Oficial:* Meta te regala *${kb.quotas.whatsappFreeMonthly} conversaciones de clientes gratis al mes*. Solo si envías campañas masivas se paga una pequeña tarifa directa a Meta.\n\n` +
        '• 🌐 *Páginas y Servidores:* Tu sitio se aloja en servidores de alta velocidad en la nube con candado de seguridad SSL y protección continua, *sin costo mensual de servidor* para proyectos estándar porque la capacidad gratuita cubre decenas de miles de visitas al mes.\n\n' +
        '• 🗄️ *Base de datos segura:* Guarda tus productos, clientes y pedidos con hasta 50,000 consultas diarias gratis.\n\n' +
        '*(🌐 Información consultada en la web: ai.google.dev, developers.facebook.com y firebase.google.com)*\n\n' +
        '¿Te gustaría que te preparemos una cotización a la medida de tu negocio?',
      suggestAdvisor: true
    };
  }

  // 5. Web pages inquiries
  if (
    q.includes('web') ||
    q.includes('pagina') ||
    q.includes('página') ||
    q.includes('sitio') ||
    q.includes('landing') ||
    q.includes('portal')
  ) {
    return {
      text: `Diseñamos Páginas Web profesionales, ultra rápidas y optimizadas para celulares desde solo $${kb.pricing.webBasic} MXN. Incluyen diseño a la medida que destaca tu negocio frente a la competencia, botón directo a WhatsApp y cotizador para convertir visitantes en clientes reales. ¿Te gustaría ver cómo quedaría la tuya?`,
      suggestAdvisor: false
    };
  }

  // 6. Forms inquiries
  if (
    q.includes('formulario') ||
    q.includes('intake') ||
    q.includes('cotizacion') ||
    q.includes('cotización') ||
    q.includes('pedido')
  ) {
    return {
      text: 'Nuestros Formularios Inteligentes permiten digitalizar la recepción de pedidos, cotizaciones y solicitudes 24/7 sin esperas. Evitan errores manuales validando la información en tiempo real y conectándose directo a tu correo o base de datos, sin mensualidades costosas. ¿Qué tipo de pedidos o registros te gustaría recibir?',
      suggestAdvisor: false
    };
  }

  // 7. Operational apps inquiries
  if (
    q.includes('aplicacion') ||
    q.includes('aplicación') ||
    q.includes('app') ||
    q.includes('inventario') ||
    q.includes('pos') ||
    q.includes('punto de venta') ||
    q.includes('stock')
  ) {
    return {
      text: `Nuestras Aplicaciones Operativas (desde $${kb.pricing.appStatic} MXN) están diseñadas para pequeños negocios: te permiten controlar existencias e inventarios con alertas de reabastecimiento, cobrar en mostrador en pocos segundos y ver cuánto vendiste en el día desde tu celular o computadora. ¿Te gustaría modernizar las ventas de tu negocio?`,
      suggestAdvisor: false
    };
  }

  // 8. Bots inquiries (WhatsApp, Telegram, Web)
  if (
    q.includes('bot') ||
    q.includes('whatsapp') ||
    q.includes('telegram') ||
    q.includes('pregunta') ||
    q.includes('atencion') ||
    q.includes('atención') ||
    q.includes('chat')
  ) {
    return {
      text: `Nuestros Bots de Atención ($${kb.pricing.botMonthly} MXN/mes) atienden en WhatsApp, Telegram y en tu sitio Web 24/7. Resuelven dudas frecuentes de inmediato (horarios, catálogos, métodos de pago, envíos) y cuando el cliente está listo para comprar, te avisan al instante para cerrar la venta. ¿En qué canal te gustaría instalar tu bot?`,
      suggestAdvisor: false
    };
  }

  // 9. General services question / Welcome
  if (
    q.includes('que hacen') ||
    q.includes('qué hacen') ||
    q.includes('que ofrecen') ||
    q.includes('qué ofrecen') ||
    q.includes('servicios') ||
    q.includes('hola') ||
    q.includes('saludos') ||
    q.includes('buenas')
  ) {
    return {
      text: `¡Hola! Qué gusto saludarte. En SuperBot ayudamos a emprendedores y negocios a vender más y modernizarse con 4 soluciones accesibles:\n\n1. 🌐 *Páginas Web Profesionales:* desde $${kb.pricing.webBasic} MXN para que destaques y vendas en internet.\n2. 📋 *Formularios Inteligentes:* para recibir pedidos y cotizaciones 24/7 sin errores.\n3. 📱 *Aplicaciones Operativas:* desde $${kb.pricing.appStatic} MXN para control de inventarios y cobro rápido en mostrador.\n4. 🤖 *Bots de Atención en WhatsApp, Telegram y Web:* $${kb.pricing.botMonthly} MXN/mes para responder a tus clientes al instante.\n\n¿Cuál de estas soluciones te gustaría implementar en tu negocio?`,
      suggestAdvisor: false
    };
  }

  // 10. STRICT RULE: If it's not in the catalog or FAQ:
  return {
    text: 'No sé la respuesta, ¿quieres que te enlace con un asesor?',
    suggestAdvisor: true
  };
}
