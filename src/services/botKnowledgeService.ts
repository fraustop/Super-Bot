import {
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface BotPricingConfig {
  webBasic: number;
  webAdjustment: number;
  appStatic: number;
  appCloudMonthly: number;
  botMonthly: number;
}

export interface BotQuotasConfig {
  geminiFreeDaily: number;
  whatsappFreeMonthly: number;
}

export interface BotRulesConfig {
  avoidTechnicalJargon: boolean;
  salespersonAttitude: boolean;
  selfBuildRedirectGemini: boolean;
}

export type BlockCategory =
  | 'product'
  | 'service'
  | 'instruction'
  | 'package'
  | 'pricing'
  | 'promotion'
  | 'quota'
  | 'rule'
  | 'custom';

export interface BotKnowledgeBlock {
  id: string;
  title: string;
  category: BlockCategory;
  summary: string;
  content: string; // The formatted markdown block injected into master prompt
  imageUrl?: string;
  publishedToHome?: boolean;
  structuredData?: {
    price?: number;
    adjustmentPrice?: number;
    monthlyPrice?: number;
    includes?: string;
    deliveryFormat?: string; // For products (e.g. Instalación local, Entrega web)
    frequency?: string; // For services (e.g. Mensual, Por ajuste)
    channels?: string; // For services (WhatsApp, Web, etc.)
    ruleType?: string; // For instructions (Tono, Restricción, Redirección)
    additionalPackages?: string;
    advisorInstructions?: string;
    imageUrl?: string;
    publishedToHome?: boolean;
    tag?: string;
    publicTitle?: string;
    utilities?: { title: string; desc: string }[];
    [key: string]: any;
  };
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
  authorEmail: string;
}

export interface BotKnowledgeConfig {
  pricing: BotPricingConfig;
  quotas: BotQuotasConfig;
  rules: BotRulesConfig;
  customNotes?: string;
  systemPromptText?: string;
  knowledgeBlocks: BotKnowledgeBlock[];
  lastUpdated?: string;
  updatedBy?: string;
}

export const DEFAULT_KNOWLEDGE_BLOCKS: BotKnowledgeBlock[] = [
  // 1. PRODUCTOS (Software empaquetado y licencias de pago único)
  {
    id: 'block-prod-web-basic',
    title: 'Página Web Sencilla Express ($300 MXN)',
    category: 'product',
    summary: 'Tu Negocio en Internet con una Web Moderna y Vendedora',
    imageUrl: '/carousel-websites.jpg',
    publishedToHome: true,
    content: `### PRODUCTO OFICIAL: PÁGINA WEB SENCILLA EXPRESS ($300 MXN)

- **Costo base oficial:** $300 MXN (pago único inicial, sin mensualidades forzosas).
- **Formato de entrega:** Despliegue web inmediato llave en mano en 24 a 48 horas.
- **Qué incluye:**
  - 1 sección principal moderna y responsiva (se adapta perfectamente a celulares, tablets y PC).
  - Alojamiento web de alta velocidad en la nube con candado de seguridad SSL (HTTPS).
  - Botón flotante directo a WhatsApp para que los clientes compren con un solo clic.
  - Formulario de contacto y catálogo de servicios/productos destacados.
- **Mantenimiento y cambios posteriores:** Póliza de ajustes por solo $100 MXN por solicitud (cambio de precios, promociones, fotos).
- **Consigna para el Asesor:** Presentar como la solución de entrada más accesible del mercado mexicano. Destacar que por solo $300 pesos el cliente ya tiene presencia formal en Google e internet sin pagar miles de pesos en agencias tradicionales.`,
    structuredData: {
      price: 300,
      deliveryFormat: 'Despliegue web en 24-48 hrs',
      includes: '1 sección responsiva, hosting cloud SSL, botón directo a WhatsApp, formulario',
      additionalPackages: 'Póliza de ajustes posteriores por $100 MXN c/u',
      advisorInstructions: 'Presentar como la opción más económica y rápida para empezar a vender en internet hoy mismo.',
      imageUrl: '/carousel-websites.jpg',
      publishedToHome: true,
      tag: 'Páginas Web Profesionales',
      utilities: [
        { title: 'Presencia digital de alto impacto', desc: 'Destaca frente a tus competidores con un diseño a la medida, confiable y accesible desde cualquier dispositivo.' },
        { title: 'Diseñada para convertir y vender', desc: 'Estructura clara con botones directos a WhatsApp, cotizadores y llamadas a la acción sin rodeos.' },
        { title: 'Velocidad ultra rápida y optimizada', desc: 'Carga instantánea con código ágil y moderno para que tus clientes locales te encuentren sin demoras.' }
      ]
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorEmail: 'sistema@superbot.ai'
  },
  {
    id: 'block-prod-form',
    title: 'Formulario Inteligente de Pedidos y Cotizaciones ($400 MXN)',
    category: 'product',
    summary: 'Captura de Pedidos y Clientes sin Complicaciones',
    imageUrl: '/carousel-forms.jpg',
    publishedToHome: true,
    content: `### PRODUCTO OFICIAL: FORMULARIO INTELIGENTE DE PEDIDOS ($400 MXN)

- **Costo base oficial:** $400 MXN (pago único inicial).
- **Formato de entrega:** Enlace web público personalizado o integrado directamente en la página web del cliente.
- **Qué incluye:**
  - Validación de datos en tiempo real (nombre, teléfono a 10 dígitos, dirección, opciones seleccionadas).
  - Cotizador automático integrado que suma productos, paquetes o costos de envío al instante.
  - Envío automático del resumen del pedido directo al WhatsApp del dueño del negocio y al correo del cliente.
  - Cero margen de error en pedidos y atención 24 horas aunque el negocio esté cerrado.
- **Consigna para el Asesor:** Recomendar a negocios que venden productos por catálogo, servicios con cotizaciones personalizadas o restaurantes/reposterías que reciben pedidos por redes sociales.`,
    structuredData: {
      price: 400,
      deliveryFormat: 'Enlace web personalizado o embebido en sitio web',
      includes: 'Validación automática de campos, cálculo de presupuestos, reenvío a WhatsApp y correo',
      additionalPackages: 'Integración con base de datos en tiempo real por $300 MXN/mes',
      advisorInstructions: 'Presentar como la mejor forma de recibir pedidos organizados sin errores ni tiempo perdido en chats.',
      imageUrl: '/carousel-forms.jpg',
      publishedToHome: true,
      tag: 'Formularios Inteligentes',
      utilities: [
        { title: 'Recepción 24/7 sin esperas', desc: 'Tus clientes pueden cotizar o enviar sus pedidos en cualquier momento sin perder la venta.' },
        { title: 'Cero errores de captura', desc: 'La información se valida en tiempo real y se envía directo a tu base de datos o correo.' },
        { title: 'Sin software costoso', desc: 'Una solución directa y a la medida que reemplaza procesos en papel o mensajes desordenados.' }
      ]
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorEmail: 'sistema@superbot.ai'
  },
  {
    id: 'block-prod-app-pos',
    title: 'Aplicación Web Estática / POS Mostrador ($500 MXN)',
    category: 'product',
    summary: 'El Control Diario de tu Negocio en tu Mano',
    imageUrl: '/carousel-apps.jpg',
    publishedToHome: true,
    content: `### PRODUCTO OFICIAL: APLICACIÓN WEB ESTÁTICA / POS MOSTRADOR ($500 MXN)

- **Costo base oficial:** $500 MXN (licencia local de pago único para 1 equipo).
- **Formato de entrega:** Instalación y configuración local lista para operar en caja o mostrador.
- **Qué incluye:**
  - Punto de venta ágil para cobro y registro rápido de ventas diarias.
  - Catálogo de productos con precios, categorías y control de inventario con alertas de stock bajo.
  - Funcionamiento 100% offline/local: no requiere pagar servidores ni mensualidades fijas para operar.
  - Reportes de venta del día descargables en Excel o PDF.
- **Opciones de expansión:** Sincronización multi-dispositivo y respaldo en la nube por $300 MXN/mes opcionales.
- **Consigna para el Asesor:** Ofrecer a dueños de tienditas, papelerías, talleres, cafeterías o negocios locales que buscan dejar de anotar en libretas y quieren un sistema formal sin pagar mensualidades obligatorias.`,
    structuredData: {
      price: 500,
      deliveryFormat: 'Instalación y configuración local para 1 equipo',
      includes: 'Punto de venta, control de inventario local, registro de ventas diarias, reportes',
      additionalPackages: 'Sincronización multi-dispositivo en la nube por $300 MXN/mes',
      advisorInstructions: 'Ideal para negocios locales que quieren cobrar rápido y controlar inventario sin mensualidades.',
      imageUrl: '/carousel-apps.jpg',
      publishedToHome: true,
      tag: 'Aplicaciones Operativas',
      utilities: [
        { title: 'Inventario y stock al instante', desc: 'Conoce exactamente qué productos tienes disponibles y recibe alertas de reabastecimiento.' },
        { title: 'Punto de venta ágil', desc: 'Registra cobros, métodos de pago y pedidos de tus clientes en pocos segundos.' },
        { title: 'Métricas claras y útiles', desc: 'Visualiza cuánto has vendido hoy y qué productos son los favoritos de tus clientes.' }
      ]
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorEmail: 'sistema@superbot.ai'
  },

  // 2. SERVICIOS (Rentas mensuales e infraestructura cloud continua)
  {
    id: 'block-serv-bot-monthly',
    title: 'Renta Mensual de Bot Inteligente Multicanal ($1,000 MXN/mes)',
    category: 'service',
    summary: 'Respuestas Instantáneas y Cierre de Ventas',
    imageUrl: '/carousel-bots.jpg',
    publishedToHome: true,
    content: `### SERVICIO OFICIAL: RENTA DE BOT INTELIGENTE MULTICANAL ($1,000 MXN/MES)

- **Tarifa oficial:** $1,000 MXN mensuales (sin plazos forzosos de permanencia).
- **Canales de operación:** WhatsApp Cloud API (oficial de Meta), Telegram Bot API y widget web flotante.
- **Alcance y cobertura incluida:**
  - Atención autónoma las 24 horas del día, los 7 días de la semana, sin descansos ni retrasos.
  - Resolución inmediata de preguntas frecuentes, explicación de productos, cotizaciones exactas y horarios.
  - Traspaso inteligente a asesor humano: cuando el prospecto está listo para comprar o requiere llamada, le envía una notificación al teléfono del dueño.
  - Alojado en capas gratuitas oficiales de Google Gemini (hasta 1,500 mensajes diarios gratis) y Meta (1,000 conversaciones gratuitas al mes).
  - Incluye mantenimiento continuo, ajustes al conocimiento del bot y monitoreo de disponibilidad.
- **Consigna para el Asesor:** Resaltar que un bot no duerme, no pide vacaciones y cuesta menos que un empleado de medio tiempo. Comparar con los $3,000 o $5,000 que cobran otras plataformas por bots limitados.`,
    structuredData: {
      monthlyPrice: 1000,
      frequency: 'Mensual recurrente',
      channels: 'WhatsApp Cloud API, Telegram, Sitio Web',
      includes: 'Atención 24/7, cotización automática, filtro y traspaso a llamada/WhatsApp, mantenimiento continuo',
      advisorInstructions: 'Comparar con el costo de un sueldo o recepcionista. Resaltar atención 24/7 sin perder ventas.',
      imageUrl: '/carousel-bots.jpg',
      publishedToHome: true,
      tag: 'Bots de Atención (Web, WhatsApp y Telegram)',
      utilities: [
        { title: 'Atención en WhatsApp y Telegram', desc: 'Responde automáticamente en las apps de mensajería más usadas por tus clientes.' },
        { title: 'Preguntas frecuentes resueltas al segundo', desc: 'Horarios, catálogos, formas de entrega, métodos de pago y detalles de tus servicios.' },
        { title: 'Pase a humano cuando toque cerrar', desc: 'El bot califica el interés y te avisa cuando el cliente requiere confirmación personalizada.' }
      ]
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorEmail: 'sistema@superbot.ai'
  },
  {
    id: 'block-serv-web-maintenance',
    title: 'Póliza de Ajustes y Mantenimiento Express ($100 MXN/ajuste)',
    category: 'service',
    summary: 'Modificaciones rápidas de precios, textos, imágenes, teléfonos o promociones con entrega en menos de 24 horas.',
    content: `### SERVICIO OFICIAL: AJUSTES Y MANTENIMIENTO EXPRESS ($100 MXN/AJUSTE)

- **Tarifa oficial:** $100 MXN por cada solicitud o cambio específico (sin mensualidad obligatoria).
- **Formato:** Por evento o solicitud a través de WhatsApp o correo.
- **Alcance y qué cubre cada ajuste:**
  - Actualización de listas de precios o menús.
  - Cambio de teléfonos de contacto, cuentas bancarias o enlaces de redes sociales.
  - Reemplazo de fotografías de productos o banners promocionales.
  - Publicación de avisos de temporada o promociones de fin de semana.
  - Tiempo de entrega: En menos de 24 horas hábiles.
- **Consigna para el Asesor:** Asegurarle al cliente que su sitio web nunca se quedará desactualizado ni abandonado, y que no necesita pagar costosas igualas mensuales de mantenimiento para hacer un cambio pequeño.`,
    structuredData: {
      adjustmentPrice: 100,
      frequency: 'Por evento / solicitud',
      includes: 'Cambio de precios, fotos, teléfonos, banners o textos en menos de 24 horas',
      advisorInstructions: 'Ofrecer como garantía de que el cliente tiene respaldo técnico constante sin pagar cuotas fijas altas.'
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorEmail: 'sistema@superbot.ai'
  },
  {
    id: 'block-serv-cloud-sync',
    title: 'Sincronización Cloud y Respaldo NoSQL ($300 MXN/mes)',
    category: 'service',
    summary: 'Base de datos en la nube (Firestore) para acceso multi-equipo, respaldo automático y seguridad de información.',
    content: `### SERVICIO OFICIAL: SINCRONIZACIÓN CLOUD Y RESPALDO ($300 MXN/MES)

- **Tarifa oficial:** $300 MXN mensuales.
- **Infraestructura:** Google Cloud Firestore (base de datos NoSQL de alta disponibilidad).
- **Alcance y cobertura:**
  - Sincronización en tiempo real para que varios cajeros, celulares o sucursales compartan el mismo catálogo e inventario.
  - Respaldo automático diario de toda la información de clientes, pedidos y ventas.
  - Acceso desde cualquier dispositivo con conexión a internet con candado de seguridad y cifrado.
  - Incluye hasta 50,000 lecturas diarias gratuitas de Firestore, suficiente para el flujo de miles de clientes diarios.
- **Consigna para el Asesor:** Recomendar a negocios que crecen y necesitan consultar inventario o ventas desde casa, sucursales adicionales o el celular del dueño.`,
    structuredData: {
      monthlyPrice: 300,
      frequency: 'Mensual recurrente',
      channels: 'Nube Google Cloud / Firestore',
      includes: 'Base de datos NoSQL, sincronización multi-dispositivo, respaldo diario automático',
      advisorInstructions: 'Ofrecer a negocios con varias sucursales o dueños que quieren ver sus ventas desde el celular.'
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorEmail: 'sistema@superbot.ai'
  },

  // 3. INSTRUCCIONES AL BOT ASESOR (Comportamiento comercial y reglas maestras)
  {
    id: 'block-inst-no-jargon',
    title: 'Regla: Cero Tecnicismos (Beneficios Reales)',
    category: 'instruction',
    summary: 'Hablar en lenguaje cotidiano de negocio y evitar tecnicismos de ingeniería.',
    content: `### INSTRUCCIÓN OBLIGATORIA: CERO TECNICISMOS (LENGUAJE DE NEGOCIO REAL)

- **Tipo de directriz:** Tono y Lenguaje Comercial.
- **Regla estricta:** Queda estrictamente prohibido usar tecnicismos complejos como "tokens", "latencia", "APIs", "webhooks", "arquitectura NoSQL", "endpoints" o "microservicios" en conversaciones con clientes, a menos que el cliente sea un programador o pregunte puntualmente por ello.
- **Traducción obligatoria a beneficios del cliente:**
  - En lugar de "base de datos NoSQL cloud": decir "tus datos respaldados y seguros para verlos en tu celular".
  - En lugar de "candado SSL y certificados TLS": decir "candadito verde de seguridad para que tus clientes confíen en ti".
  - En lugar de "cuota de tokens de Gemini": decir "capa gratuita de hasta 1,500 mensajes diarios gratis para no pagar de más".
  - En lugar de "diseño responsive": decir "se ve perfecto y rápido en cualquier celular".
- **Consigna para el Asesor:** Comunicar siempre ahorro, tranquilidad, rapidez y aumento de ventas en lenguaje claro y accesible.`,
    structuredData: {
      ruleType: 'Tono y Lenguaje',
      advisorInstructions: 'Traducir especificaciones técnicas en beneficios tangibles para el negocio del cliente.'
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorEmail: 'sistema@superbot.ai'
  },
  {
    id: 'block-inst-sales-cta',
    title: 'Consigna: Actitud Comercial Empática con Llamado a la Acción',
    category: 'instruction',
    summary: 'Responder con entusiasmo, seguridad y cerrar con una pregunta de avance comercial.',
    content: `### INSTRUCCIÓN OBLIGATORIA: ACTITUD COMERCIAL EMPÁTICA CON CTA

- **Tipo de directriz:** Actitud y Cierre de Ventas.
- **Regla estricta:** El Bot Asesor no debe limitarse a responder preguntas como una enciclopedia fría; debe actuar como un asesor comercial entusiasta, cercano y profesional.
- **Estructura de cada respuesta:**
  1. Validar la duda del cliente con amabilidad y calidez ("¡Excelente pregunta!", "Con gusto te explico", "Es una gran idea para tu negocio").
  2. Brindar la información o cotización de forma directa, sin rodeos y con transparencia total.
  3. Cerrar SIEMPRE con una pregunta de avance comercial o llamado a la acción (CTA) claro, por ejemplo:
     - "¿Qué tipo de negocio tienes para decirte cuál opción te conviene más?"
     - "¿Te gustaría que iniciemos con tu página web por solo $300 pesos?"
     - "¿Prefieres que agendemos una llamada rápida o te contactamos por WhatsApp para afinar los detalles?"`,
    structuredData: {
      ruleType: 'Actitud Comercial',
      advisorInstructions: 'Siempre cerrar con una pregunta de enganche comercial o llamado a la acción.'
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorEmail: 'sistema@superbot.ai'
  },
  {
    id: 'block-inst-autonomous-quoting',
    title: 'Consigna: Cotización Autónoma y Comparativo de Ahorro',
    category: 'instruction',
    summary: 'Calcular cotizaciones de inmediato desglosando pagos iniciales y recurrentes.',
    content: `### INSTRUCCIÓN OBLIGATORIA: COTIZACIÓN AUTÓNOMA Y COMPARATIVO DE AHORRO

- **Tipo de directriz:** Cotización y Precios Claros.
- **Regla estricta:** Nunca ocultar precios ni pedir correo electrónico antes de cotizar. Dar precios oficiales de inmediato:
  - Página Web Sencilla: $300 MXN (pago único inicial).
  - Ajustes o mantenimiento: $100 MXN por cambio.
  - Aplicación POS local: $500 MXN (pago único).
  - Renta de Bot Multicanal: $1,000 MXN/mes.
- **Comparativa de mercado:**
  - Destacar que una agencia de publicidad o desarrollo tradicional cobra entre $3,000 y $10,000 pesos por una página web básica y mensualidades obligatorias de mantenimiento.
  - En Super-Bot obtienen la misma calidad y rapidez por solo $300 pesos, ahorrando más del 80% de su presupuesto.`,
    structuredData: {
      ruleType: 'Cotización Inmediata',
      advisorInstructions: 'Desglosar pago inicial y mensual, comparando con agencias tradicionales.'
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorEmail: 'sistema@superbot.ai'
  },
  {
    id: 'block-inst-redirect-gemini',
    title: 'Redirección: Auto-construcción con Google Gemini',
    category: 'instruction',
    summary: 'Si el cliente quiere hacer su página él mismo, redirigirlo a Gemini y ofrecer apoyo.',
    content: `### INSTRUCCIÓN OBLIGATORIA: REDIRECCIÓN A GOOGLE GEMINI

- **Tipo de directriz:** Redirección Asistida.
- **Situación:** Cuando el cliente pregunte si él mismo puede programar o crear su propia página web o bot.
- **Respuesta obligatoria:**
  1. Felicitar su iniciativa y explicarle con entusiasmo que la Inteligencia Artificial hace posible construir código paso a paso.
  2. Proporcionarle el enlace oficial: https://gemini.google.com (indicándole que puede abrirlo para pedirle prompts y código paso a paso).
  3. Recordarle amablemente que si no cuenta con el tiempo para aprender a programar, depurar errores o configurar servidores, en Super-Bot se la entregamos lista y funcionando en 24-48 horas desde solo $300 pesos.`,
    structuredData: {
      ruleType: 'Redirección Asistida',
      advisorInstructions: 'Facilitar https://gemini.google.com y recordar la opción llave en mano de SuperBot.'
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorEmail: 'sistema@superbot.ai'
  },
  {
    id: 'block-inst-human-handoff',
    title: 'Consigna: Traspaso a Asesor Humano (WhatsApp / Llamada)',
    category: 'instruction',
    summary: 'Cuando el cliente esté listo para contratar o requiera llamada directa con Francisco Frausto.',
    content: `### INSTRUCCIÓN OBLIGATORIA: TRASPASO A ASESOR HUMANO (FRANCISCO FRAUSTO)

- **Tipo de directriz:** Cierre y Conversión.
- **Situación:** Cuando el cliente esté listo para contratar, tenga requerimientos especiales de software a medida o solicite hablar con una persona.
- **Procedimiento:**
  - Invitar al cliente a dar clic en el botón de WhatsApp o solicitar su número de teléfono celular para que Francisco Frausto lo contacte personalmente.
  - Confirmarle que el trato es directo, sin intermediarios, con entrega rápida y garantía de funcionamiento.
  - Mantener siempre un trato formal, cordial y respetuoso.`,
    structuredData: {
      ruleType: 'Cierre Comercial',
      advisorInstructions: 'Facilitar botón de WhatsApp o pedir número para contacto directo con Francisco Frausto.'
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorEmail: 'sistema@superbot.ai'
  }
];

export const DEFAULT_BOT_KNOWLEDGE: BotKnowledgeConfig = {
  pricing: {
    webBasic: 300,
    webAdjustment: 100,
    appStatic: 500,
    appCloudMonthly: 300,
    botMonthly: 1000
  },
  quotas: {
    geminiFreeDaily: 1500,
    whatsappFreeMonthly: 1000
  },
  rules: {
    avoidTechnicalJargon: true,
    salespersonAttitude: true,
    selfBuildRedirectGemini: true
  },
  customNotes: 'Enfocarse en pequeños comercios, tiendas, talleres y profesionales independientes.',
  knowledgeBlocks: DEFAULT_KNOWLEDGE_BLOCKS,
  lastUpdated: new Date().toISOString(),
  updatedBy: 'system'
};

const STORAGE_KEY = 'superbot_cached_knowledge_v5';
const KNOWLEDGE_DOC_PATH = { collection: 'bot_knowledge', docId: 'active_config' };

// Active local subscribers to bot knowledge
const knowledgeSubscribers = new Set<(config: BotKnowledgeConfig) => void>();

function notifyKnowledgeSubscribers(conf: BotKnowledgeConfig) {
  knowledgeSubscribers.forEach((cb) => {
    try {
      cb(conf);
    } catch (e) {
      console.warn('Error in knowledge subscriber callback:', e);
    }
  });
}

// In-memory active configuration
let currentActiveConfig: BotKnowledgeConfig = (() => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        ...DEFAULT_BOT_KNOWLEDGE,
        ...parsed,
        knowledgeBlocks: Array.isArray(parsed.knowledgeBlocks)
          ? parsed.knowledgeBlocks
          : []
      };
    }
  } catch {
    // ignore
  }
  return {
    ...DEFAULT_BOT_KNOWLEDGE,
    knowledgeBlocks: []
  };
})();

export function getActiveBotKnowledge(): BotKnowledgeConfig {
  return currentActiveConfig;
}

// Category filter helpers
export function isProductBlock(block: BotKnowledgeBlock): boolean {
  return block.category === 'product' || (block.category === 'package' && (!block.structuredData?.monthlyPrice || block.structuredData?.price !== undefined));
}

export function isServiceBlock(block: BotKnowledgeBlock): boolean {
  return block.category === 'service' || (block.category === 'package' && Boolean(block.structuredData?.monthlyPrice)) || block.category === 'quota';
}

export function isInstructionBlock(block: BotKnowledgeBlock): boolean {
  return block.category === 'instruction' || block.category === 'rule';
}

/**
 * Real-time subscription to Firestore bot knowledge document.
 */
export function subscribeToBotKnowledge(
  callback: (config: BotKnowledgeConfig) => void
): () => void {
  knowledgeSubscribers.add(callback);
  callback(currentActiveConfig);

  if (!db) {
    return () => {
      knowledgeSubscribers.delete(callback);
    };
  }

  try {
    const docRef = doc(db, KNOWLEDGE_DOC_PATH.collection, KNOWLEDGE_DOC_PATH.docId);
    const unsubscribeFirestore = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<BotKnowledgeConfig>;
          // CRITICAL: Respect explicit empty array [] from Firestore when items are deleted!
          // Only fallback to default sample blocks if knowledgeBlocks is completely undefined in Firestore.
          const firestoreBlocks = Array.isArray(data.knowledgeBlocks)
            ? data.knowledgeBlocks
            : DEFAULT_KNOWLEDGE_BLOCKS;

          currentActiveConfig = {
            pricing: { ...DEFAULT_BOT_KNOWLEDGE.pricing, ...data.pricing },
            quotas: { ...DEFAULT_BOT_KNOWLEDGE.quotas, ...data.quotas },
            rules: { ...DEFAULT_BOT_KNOWLEDGE.rules, ...data.rules },
            customNotes: data.customNotes || '',
            systemPromptText: data.systemPromptText || '',
            knowledgeBlocks: firestoreBlocks,
            lastUpdated: data.lastUpdated || new Date().toISOString(),
            updatedBy: data.updatedBy || 'admin'
          };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentActiveConfig));
          } catch {
            // ignore
          }
          notifyKnowledgeSubscribers(currentActiveConfig);
        } else {
          saveBotKnowledgeToFirestore(DEFAULT_BOT_KNOWLEDGE, 'init');
        }
      },
      (error) => {
        console.warn('Firestore subscription warning (using local bot knowledge):', error);
      }
    );

    return () => {
      knowledgeSubscribers.delete(callback);
      unsubscribeFirestore();
    };
  } catch (err) {
    console.warn('Could not establish Firestore listener for bot knowledge:', err);
    return () => {
      knowledgeSubscribers.delete(callback);
    };
  }
}

/**
 * Save updated bot knowledge document to Firestore master document.
 */
export async function saveBotKnowledgeToFirestore(
  config: BotKnowledgeConfig,
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  currentActiveConfig = {
    ...config,
    knowledgeBlocks: Array.isArray(config.knowledgeBlocks) ? config.knowledgeBlocks : [],
    lastUpdated: new Date().toISOString(),
    updatedBy: userEmail
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentActiveConfig));
  } catch {
    // ignore
  }

  // Broadcast change immediately to all active UI subscribers
  notifyKnowledgeSubscribers(currentActiveConfig);

  if (!db) {
    return {
      success: true,
      error: 'Guardado localmente. La base de datos de Firebase no está conectada actualmente.'
    };
  }

  try {
    const docRef = doc(db, KNOWLEDGE_DOC_PATH.collection, KNOWLEDGE_DOC_PATH.docId);
    // Explicit clean overwrite to ensure empty array [] is never corrupted by merge
    await setDoc(docRef, {
      pricing: currentActiveConfig.pricing,
      quotas: currentActiveConfig.quotas,
      rules: currentActiveConfig.rules,
      customNotes: currentActiveConfig.customNotes || '',
      systemPromptText: currentActiveConfig.systemPromptText || '',
      knowledgeBlocks: currentActiveConfig.knowledgeBlocks,
      lastUpdated: currentActiveConfig.lastUpdated,
      updatedBy: currentActiveConfig.updatedBy,
      serverTimestamp: serverTimestamp()
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error saving bot knowledge to Firestore:', err);
    return {
      success: false,
      error: err.message || 'Error al guardar en Firestore'
    };
  }
}

/**
 * Add or update a specific knowledge block and commit to Firestore master document.
 */
export async function addOrUpdateKnowledgeBlock(
  blockData: Omit<BotKnowledgeBlock, 'createdAt' | 'updatedAt'> & {
    createdAt?: string;
    updatedAt?: string;
  },
  userEmail: string
): Promise<{ success: boolean; block: BotKnowledgeBlock; error?: string }> {
  const now = new Date().toISOString();
  const existingIndex = currentActiveConfig.knowledgeBlocks.findIndex(b => b.id === blockData.id);

  const finalBlock: BotKnowledgeBlock = {
    ...blockData,
    createdAt: blockData.createdAt || (existingIndex >= 0 ? currentActiveConfig.knowledgeBlocks[existingIndex].createdAt : now),
    updatedAt: now,
    authorEmail: userEmail
  };

  const newBlocks = [...currentActiveConfig.knowledgeBlocks];
  if (existingIndex >= 0) {
    newBlocks[existingIndex] = finalBlock;
  } else {
    newBlocks.unshift(finalBlock);
  }

  // Synchronize numerical pricing if specified in block
  const newPricing = { ...currentActiveConfig.pricing };
  if (finalBlock.structuredData?.price) {
    const p = finalBlock.structuredData.price;
    const text = (finalBlock.title + ' ' + finalBlock.content).toLowerCase();
    if (text.includes('web') || text.includes('página') || text.includes('pagina')) {
      newPricing.webBasic = p;
    } else if (text.includes('app') || text.includes('pos')) {
      newPricing.appStatic = p;
    }
  }
  if (finalBlock.structuredData?.adjustmentPrice) {
    newPricing.webAdjustment = finalBlock.structuredData.adjustmentPrice;
  }
  if (finalBlock.structuredData?.monthlyPrice) {
    const mp = finalBlock.structuredData.monthlyPrice;
    const text = (finalBlock.title + ' ' + finalBlock.content).toLowerCase();
    if (text.includes('bot')) {
      newPricing.botMonthly = mp;
    } else if (text.includes('app') || text.includes('nube')) {
      newPricing.appCloudMonthly = mp;
    }
  }

  const updatedConfig: BotKnowledgeConfig = {
    ...currentActiveConfig,
    pricing: newPricing,
    knowledgeBlocks: newBlocks,
    lastUpdated: now,
    updatedBy: userEmail
  };

  const saveRes = await saveBotKnowledgeToFirestore(updatedConfig, userEmail);

  if (db) {
    try {
      const blockDocRef = doc(db, 'bot_knowledge_blocks', finalBlock.id);
      await setDoc(blockDocRef, {
        ...finalBlock,
        serverTimestamp: serverTimestamp()
      }, { merge: true });
    } catch (blockErr) {
      console.warn('Could not save individual block document to collection:', blockErr);
    }
  }

  return {
    success: saveRes.success,
    block: finalBlock,
    error: saveRes.error
  };
}

/**
 * Delete a knowledge block from master document and Firestore.
 */
export async function deleteKnowledgeBlock(
  blockId: string,
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  const currentList = Array.isArray(currentActiveConfig.knowledgeBlocks)
    ? currentActiveConfig.knowledgeBlocks
    : [];
  const filtered = currentList.filter(b => b.id !== blockId);
  const updatedConfig: BotKnowledgeConfig = {
    ...currentActiveConfig,
    knowledgeBlocks: filtered,
    lastUpdated: new Date().toISOString(),
    updatedBy: userEmail
  };

  const saveRes = await saveBotKnowledgeToFirestore(updatedConfig, userEmail);

  if (db) {
    try {
      const blockDocRef = doc(db, 'bot_knowledge_blocks', blockId);
      await deleteDoc(blockDocRef);
    } catch {
      // ignore
    }
  }

  return saveRes;
}

/**
 * Delete all knowledge blocks belonging to a specific category.
 */
export async function deleteBlocksByCategory(
  category: 'product' | 'service' | 'instruction',
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  const currentList = Array.isArray(currentActiveConfig.knowledgeBlocks)
    ? currentActiveConfig.knowledgeBlocks
    : [];

  let filtered: BotKnowledgeBlock[];
  if (category === 'product') {
    filtered = currentList.filter(b => !isProductBlock(b));
  } else if (category === 'service') {
    filtered = currentList.filter(b => !isServiceBlock(b));
  } else {
    filtered = currentList.filter(b => !isInstructionBlock(b));
  }

  const updatedConfig: BotKnowledgeConfig = {
    ...currentActiveConfig,
    knowledgeBlocks: filtered,
    lastUpdated: new Date().toISOString(),
    updatedBy: userEmail
  };

  return await saveBotKnowledgeToFirestore(updatedConfig, userEmail);
}

// ============================================================================
// Interactive Coach / Trainer Bot Engine (Products, Services, Instructions)
// ============================================================================

export interface TrainerChatMessage {
  id: string;
  sender: 'trainer' | 'admin';
  text: string;
  timestamp: string;
  proposedBlock?: BotKnowledgeBlock | null;
}

/**
 * Intelligent Coach engine that adapts questions depending on whether
 * we are configuring a PRODUCT, a SERVICE, or an INSTRUCTION.
 */
export async function interactWithTrainerBot(
  userInput: string,
  history: TrainerChatMessage[],
  _currentConfig: BotKnowledgeConfig,
  adminEmail: string,
  targetFocus?: 'product' | 'service' | 'instruction'
): Promise<{
  replyText: string;
  proposedBlock?: BotKnowledgeBlock | null;
}> {
  const text = userInput.trim();
  const lower = text.toLowerCase();

  // Detect category from explicit focus or text keywords
  let category: 'product' | 'service' | 'instruction' = targetFocus || 'product';
  if (
    lower.includes('servicio') ||
    lower.includes('renta') ||
    lower.includes('mensual') ||
    lower.includes('mantenimiento') ||
    lower.includes('póliza') ||
    lower.includes('cloud') ||
    lower.includes('bot de whatsapp')
  ) {
    category = 'service';
  } else if (
    lower.includes('instruccion') ||
    lower.includes('instrucción') ||
    lower.includes('regla') ||
    lower.includes('consigna') ||
    lower.includes('tono') ||
    lower.includes('vendedor') ||
    lower.includes('tecnicismo') ||
    lower.includes('evita') ||
    lower.includes('redireccion') ||
    lower.includes('gemini')
  ) {
    category = 'instruction';
  } else if (
    lower.includes('producto') ||
    lower.includes('precio') ||
    lower.includes('app local') ||
    lower.includes('pos') ||
    lower.includes('plantilla') ||
    lower.includes('formulario') ||
    lower.includes('pagina') ||
    lower.includes('página') ||
    lower.includes('pesos')
  ) {
    category = 'product';
  }

  // Check if admin is answering questions from previous turn
  const lastTrainerMsg = [...history].reverse().find(m => m.sender === 'trainer');
  const isAnsweringQuestions = Boolean(
    lastTrainerMsg && (
      lastTrainerMsg.text.includes('?') ||
      lastTrainerMsg.text.includes('1.') ||
      lastTrainerMsg.text.includes('indícame') ||
      lastTrainerMsg.text.includes('¿Qué') ||
      lastTrainerMsg.text.includes('¿Cuál')
    )
  );

  const numbers = lower.match(/\d+[\d,]*/g)?.map((n) => parseInt(n.replace(/,/g, ''), 10)) || [];
  const primaryNumber = numbers.length > 0 ? numbers[0] : null;

  // --------------------------------------------------------------------------
  // CASE 1: Admin is answering previous interview questions
  // --------------------------------------------------------------------------
  if (isAnsweringQuestions && history.length >= 2) {
    const firstAdminMsg = history.find(m => m.sender === 'admin')?.text || '';
    const combinedContext = `${firstAdminMsg} | Respuesta: ${text}`;
    const combinedLower = combinedContext.toLowerCase();
    const combinedNumbers = combinedLower.match(/\d+[\d,]*/g)?.map((n) => parseInt(n.replace(/,/g, ''), 10)) || [];
    const mainPrice = combinedNumbers.length > 0 ? combinedNumbers[0] : (primaryNumber || 300);

    const blockId = `block-${Date.now().toString(36)}`;

    // Build block according to category
    if (category === 'instruction') {
      const title = text.length > 40 ? `Consigna: ${text.slice(0, 35)}...` : `Consigna: ${text}`;
      const content = `INSTRUCCIÓN AL ASESOR:\n- Directriz: ${text}\n- Objetivo: Mejorar la experiencia y conversión de clientes.\n- Regla: Aplicar en todas las interacciones comerciales del Bot Asesor.`;

      const proposedBlock: BotKnowledgeBlock = {
        id: blockId,
        title,
        category: 'instruction',
        summary: `Instrucción de comportamiento: ${text.slice(0, 80)}...`,
        content,
        structuredData: {
          ruleType: 'Comportamiento y Ventas',
          advisorInstructions: text
        },
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authorEmail: adminEmail
      };

      return {
        replyText: `¡Excelente! He configurado la **Instrucción al Bot** a partir de tu indicación.\n\nRevisa el bloque propuesto a continuación y haz clic en **"Confirmar y Subir a Firestore"** para agregarlo a la pestaña de **Instrucciones al Bot** y al documento maestro en vivo.`,
        proposedBlock
      };
    } else if (category === 'service') {
      const isMonthly = combinedLower.includes('mensual') || combinedLower.includes('mes') || mainPrice >= 500;
      const title = isMonthly
        ? `Servicio de Bot / Nube ($${mainPrice} MXN/mes)`
        : `Servicio de Mantenimiento ($${mainPrice} MXN)`;

      const frequency = isMonthly ? 'Mensual recurrente' : 'Por evento / ajuste';
      const includes = text.replace(/^(incluye:?|es|tiene)/i, '').trim() || 'Atención en WhatsApp y Web 24/7 con IA';

      const content = `SERVICIO - ${title.toUpperCase()}:\n- Tarifa: $${mainPrice} MXN (${frequency}).\n- Alcance: ${includes}\n- Canales: WhatsApp Cloud API y Web.\n- Consigna para el Asesor: Ofrecer como solución continua para que el negocio nunca pierda un cliente.`;

      const proposedBlock: BotKnowledgeBlock = {
        id: blockId,
        title,
        category: 'service',
        summary: `Servicio con tarifa de $${mainPrice} MXN (${frequency}): ${includes.slice(0, 60)}...`,
        content,
        structuredData: {
          monthlyPrice: isMonthly ? mainPrice : undefined,
          adjustmentPrice: !isMonthly ? mainPrice : undefined,
          frequency,
          includes,
          advisorInstructions: `Ofrecer a clientes que buscan atención continua o mantenimiento sin esfuerzo.`
        },
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authorEmail: adminEmail
      };

      return {
        replyText: `¡Perfecto! He estructurado el **Servicio** con tus respuestas.\n\nA continuación tienes el bloque propuesto para la pestaña de **Servicios**. Haz clic en **"Confirmar y Subir a Firestore"** para subirlo al documento maestro.`,
        proposedBlock
      };
    } else {
      // PRODUCT
      const isWeb = combinedLower.includes('web') || combinedLower.includes('pagina') || combinedLower.includes('página') || mainPrice <= 400;
      const title = isWeb
        ? `Paquete Web Básico ($${mainPrice} MXN)`
        : `Producto de Software / App ($${mainPrice} MXN)`;

      let adjustmentPrice = 100;
      let botAddon = 500;
      if (combinedNumbers.length > 1) adjustmentPrice = combinedNumbers[1];
      if (combinedNumbers.length > 2) botAddon = combinedNumbers[2];

      const includes = text.replace(/^(incluye:?|es|tiene)/i, '').trim() || 'Diseño responsivo de 1 sección con botón directo a WhatsApp y hosting cloud.';
      const additionalPackages = `Ajustes por $${adjustmentPrice} MXN c/u. Bot de atención adicional por $${botAddon} MXN/mes.`;

      const content = `PRODUCTO - ${title.toUpperCase()}:\n- Costo base: $${mainPrice} MXN (pago único).\n- Qué incluye: ${includes}\n- Entrega: Despliegue web inmediato llave en mano.\n- Paquetes adicionales sugeridos: ${additionalPackages}\n- Consigna Asesor: Presentar como solución accesible de entrada para iniciar a vender en internet hoy mismo.`;

      const proposedBlock: BotKnowledgeBlock = {
        id: blockId,
        title,
        category: 'product',
        summary: `Producto empaquetado a $${mainPrice} MXN: ${includes.slice(0, 60)}...`,
        content,
        structuredData: {
          price: mainPrice,
          adjustmentPrice,
          deliveryFormat: 'Despliegue web inmediato',
          includes,
          additionalPackages,
          advisorInstructions: `Presentar como producto estrella accesible. Ofrecer adicionales tras confirmar el interés.`
        },
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authorEmail: adminEmail
      };

      return {
        replyText: `¡Listo! He completado el perfil del **Producto** con tus especificaciones.\n\nRevisa el bloque propuesto a continuación y haz clic en **"Confirmar y Subir a Firestore"** para añadirlo a la pestaña de **Productos** y activarlo en el Bot Asesor.`,
        proposedBlock
      };
    }
  }

  // --------------------------------------------------------------------------
  // CASE 2: New instruction - Asking tailored clarifying questions
  // --------------------------------------------------------------------------
  if (category === 'instruction') {
    return {
      replyText:
        `Entendido, vamos a configurar una **Instrucción al Bot Asesor**.\n\n` +
        `Para redactar la consigna con total claridad para su comportamiento en vivo, por favor indícame:\n\n` +
        `1. **¿Cuál es la regla o consigna exacta que debe seguir el bot?** *(por ejemplo: evitar tecnicismos, recomendar una herramienta, o cierta frase al cotizar)*\n` +
        `2. **¿Cómo debe expresarse ante el cliente?** *(¿qué palabras debe usar o qué debe evitar?)*\n` +
        `3. **¿Aplica para todos los clientes o en una situación específica?*`
    };
  }

  if (category === 'service') {
    const targetPrice = primaryNumber || 1000;
    return {
      replyText:
        `Entendido, configuremos un nuevo **Servicio** para el catálogo.\n\n` +
        `Por favor compleméntame estos detalles para estructurarlo:\n\n` +
        `1. **¿Qué tipo de servicio es y cuál será la tarifa?** *(¿renta mensual recurrente de $${targetPrice} MXN o costo por ajuste/evento?)*\n` +
        `2. **¿En qué canales opera y qué infraestructura/cuota incluye?** *(ej. WhatsApp, Telegram, Web, cuota de IA)*\n` +
        `3. **¿Cómo debe ofrecerlo el Bot Asesor a los clientes interesados?*`
    };
  }

  // Default: PRODUCT
  const targetPrice = primaryNumber || 300;
  return {
    replyText:
      `Entendido, configuremos un **Producto** con precio de **$${targetPrice} pesos**.\n\n` +
      `Para completar el perfil del producto y que el Bot Asesor pueda cotizarlo con exactitud, por favor indícame:\n\n` +
      `1. **¿Qué incluye exactamente el producto de $${targetPrice} pesos?** *(por ejemplo: ¿diseño de 1 sola sección, hosting, botón a WhatsApp, catálogo?)*\n` +
      `2. **¿Cómo se entrega o instala al cliente?** *(ej. despliegue web inmediato, instalación en 1 computadora local, etc.)*\n` +
      `3. **¿El Bot Asesor puede ofrecer otros productos o servicios complementarios?** *(ej. ajustes por $100, bot de WhatsApp por $500, etc.)*`
  };
}

/**
 * Legacy NLP parser kept for backward compatibility.
 */
export function processTrainerInstruction(
  instruction: string,
  current: BotKnowledgeConfig
): {
  updatedConfig: BotKnowledgeConfig;
  changesSummary: string[];
} {
  const text = instruction.toLowerCase().trim();
  const next: BotKnowledgeConfig = JSON.parse(JSON.stringify(current));
  const changes: string[] = [];

  const numbers = text.match(/\d+[\d,]*/g)?.map((n) => parseInt(n.replace(/,/g, ''), 10)) || [];

  if ((text.includes('web') || text.includes('pagina') || text.includes('página')) && numbers.length > 0) {
    const newPrice = numbers[0];
    if (newPrice !== next.pricing.webBasic) {
      changes.push(`Precio base de Página Web: $${next.pricing.webBasic} ➔ $${newPrice} MXN`);
      next.pricing.webBasic = newPrice;
    }
  }

  return {
    updatedConfig: next,
    changesSummary: changes
  };
}
