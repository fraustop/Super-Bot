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
  // 1. PRODUCTOS
  {
    id: 'block-prod-web-basic',
    title: 'Página Web Sencilla ($300 MXN)',
    category: 'product',
    summary: 'Página web de 1 sola sección para presencia digital inmediata con botón a WhatsApp.',
    content: 'PRODUCTO - PÁGINA WEB SENCILLA: $300 MXN (pago único inicial). Incluye diseño responsivo de 1 sección, alojamiento en la nube de alta velocidad con candado SSL y botón directo a WhatsApp. Entrega inmediata.',
    structuredData: {
      price: 300,
      deliveryFormat: 'Despliegue web inmediato',
      includes: '1 sección responsiva, hosting cloud SSL, botón directo a WhatsApp',
      additionalPackages: 'Póliza de ajustes posteriores por $100 MXN c/u'
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorEmail: 'sistema@superbot.ai'
  },
  {
    id: 'block-prod-app-pos',
    title: 'Aplicación Web Estática POS ($500 MXN)',
    category: 'product',
    summary: 'Software para 1 computadora de mostrador para registro de productos, inventario y cobro.',
    content: 'PRODUCTO - APLICACIÓN WEB ESTÁTICA POS: $500 MXN (licencia local). Diseñada para operar en mostrador sin mensualidad de servidor. Control de productos, inventario básico y cobro ágil en caja.',
    structuredData: {
      price: 500,
      deliveryFormat: 'Instalación local en 1 equipo',
      includes: 'Control de inventario, punto de venta local, catálogo de productos',
      additionalPackages: 'Sincronización en la nube desde $300 MXN/mes'
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorEmail: 'sistema@superbot.ai'
  },
  {
    id: 'block-prod-form',
    title: 'Formulario Inteligente de Pedidos ($400 MXN)',
    category: 'product',
    summary: 'Formulario web validado para recepción de pedidos y solicitudes 24/7.',
    content: 'PRODUCTO - FORMULARIO INTELIGENTE: $400 MXN (pago único). Valida datos del cliente, calcula presupuestos y envía la orden directa al correo o WhatsApp del negocio.',
    structuredData: {
      price: 400,
      deliveryFormat: 'Enlace web directo integrado',
      includes: 'Validación en vivo de datos, cotización autónoma, envío a WhatsApp/correo'
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorEmail: 'sistema@superbot.ai'
  },

  // 2. SERVICIOS
  {
    id: 'block-serv-bot-monthly',
    title: 'Renta Mensual de Bot Inteligente ($1,000 MXN/mes)',
    category: 'service',
    summary: 'Asistente 24/7 en WhatsApp, Telegram y Web en capas gratuitas de nube.',
    content: 'SERVICIO - BOTS DE ATENCIÓN INTELIGENTE: $1,000 MXN/mes de renta recurrente. Atención 24/7 en WhatsApp, Telegram y Web. Se monta en Free Tiers de Google Gemini (hasta 1,500 mensajes/día gratis) y WhatsApp (1,000 conversaciones/mes gratis).',
    structuredData: {
      monthlyPrice: 1000,
      frequency: 'Mensual recurrente',
      channels: 'WhatsApp Cloud API, Telegram, Sitio Web',
      includes: 'Atención 24/7, resolución de dudas, filtro de clientes y traspaso a asesor'
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorEmail: 'sistema@superbot.ai'
  },
  {
    id: 'block-serv-web-maintenance',
    title: 'Póliza de Ajustes y Mantenimiento Web ($100 MXN/ajuste)',
    category: 'service',
    summary: 'Modificaciones y actualizaciones de textos, fotos o precios en sitios web.',
    content: 'SERVICIO - AJUSTES Y MANTENIMIENTO: $100 MXN por cada cambio o ajuste solicitado. Actualización de promociones, cambios de fotos, teléfonos o catálogos.',
    structuredData: {
      adjustmentPrice: 100,
      frequency: 'Por evento / solicitud',
      includes: 'Actualización de textos, fotos, precios o enlaces en 24 hrs'
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorEmail: 'sistema@superbot.ai'
  },
  {
    id: 'block-serv-cloud-sync',
    title: 'Sincronización Cloud y Respaldo ($300 MXN/mes)',
    category: 'service',
    summary: 'Infraestructura de base de datos NoSQL y respaldo en la nube para apps operativas.',
    content: 'SERVICIO - INFRAESTRUCTURA CLOUD: Desde $300 MXN/mes. Respaldo en tiempo real en Firestore, acceso multi-dispositivo y seguridad en la nube.',
    structuredData: {
      monthlyPrice: 300,
      frequency: 'Mensual recurrente',
      includes: 'Base de datos NoSQL, respaldo continuo, sincronización entre dispositivos'
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorEmail: 'sistema@superbot.ai'
  },

  // 3. INSTRUCCIONES AL BOT
  {
    id: 'block-inst-no-jargon',
    title: 'Regla: Cero Tecnicismos (Beneficios Reales)',
    category: 'instruction',
    summary: 'Hablar en lenguaje cotidiano de negocio y evitar tecnicismos de ingeniería.',
    content: 'INSTRUCCIÓN AL ASESOR - CERO TECNICISMOS: Prohibido usar tecnicismos (latencias, RAM, tokens, webhooks, microservicios, arquitecturas) a menos que el cliente pregunte puntualmente por un dato técnico. Hablar siempre de más ventas, tiempo libre, rapidez en celulares y candadito de seguridad.',
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
    title: 'Consigna: Actitud de Vendedor Empático con CTA',
    category: 'instruction',
    summary: 'Responder con entusiasmo, seguridad y cerrar con una pregunta de avance comercial.',
    content: 'INSTRUCCIÓN AL ASESOR - ACTITUD DE VENTA: Actuar siempre como un vendedor profesional y seguro. Cada respuesta explicativa o de cotización debe concluir con un llamado a la acción comercial (ej. "¿Qué te parece esta opción para tu negocio?", "¿Quieres que iniciemos con tu proyecto?").',
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
    id: 'block-inst-redirect-gemini',
    title: 'Redirección: Auto-construcción con Google Gemini',
    category: 'instruction',
    summary: 'Si el cliente quiere hacer su página él mismo, redirigirlo a Gemini y ofrecer apoyo.',
    content: 'INSTRUCCIÓN AL ASESOR - REDIRECCIÓN A GEMINI: Si el cliente pregunta si puede hacer la página él mismo, explicarle con entusiasmo que la IA puede guiarlo y proporcionarle el enlace https://gemini.google.com en otra pestaña. Recordarle con simpatía que si prefiere ahorrar tiempo nosotros se la entregamos lista desde $300 MXN.',
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
    id: 'block-inst-autonomous-quoting',
    title: 'Consigna: Motor Autónomo de Cotizaciones',
    category: 'instruction',
    summary: 'Calcular cotizaciones de inmediato desglosando pagos iniciales y recurrentes.',
    content: 'INSTRUCCIÓN AL ASESOR - COTIZACIÓN AUTÓNOMA: Calcular presupuestos inmediatamente desglosando costo único y costo mensual. Mostrar siempre el comparativo frente a lo que cobra la competencia en el mercado para evidenciar el ahorro que obtiene con SuperBot.',
    structuredData: {
      ruleType: 'Cotización Inmediata',
      advisorInstructions: 'Desglosar pago inicial y mensual, comparando con agencias tradicionales.'
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

const STORAGE_KEY = 'superbot_cached_knowledge_v3';
const KNOWLEDGE_DOC_PATH = { collection: 'bot_knowledge', docId: 'active_config' };

// In-memory active configuration
let currentActiveConfig: BotKnowledgeConfig = (() => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        ...DEFAULT_BOT_KNOWLEDGE,
        ...parsed,
        knowledgeBlocks: Array.isArray(parsed.knowledgeBlocks) && parsed.knowledgeBlocks.length > 0
          ? parsed.knowledgeBlocks
          : DEFAULT_KNOWLEDGE_BLOCKS
      };
    }
  } catch {
    // ignore
  }
  return DEFAULT_BOT_KNOWLEDGE;
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
  callback(currentActiveConfig);

  if (!db) {
    return () => {};
  }

  try {
    const docRef = doc(db, KNOWLEDGE_DOC_PATH.collection, KNOWLEDGE_DOC_PATH.docId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<BotKnowledgeConfig>;
          currentActiveConfig = {
            pricing: { ...DEFAULT_BOT_KNOWLEDGE.pricing, ...data.pricing },
            quotas: { ...DEFAULT_BOT_KNOWLEDGE.quotas, ...data.quotas },
            rules: { ...DEFAULT_BOT_KNOWLEDGE.rules, ...data.rules },
            customNotes: data.customNotes || '',
            systemPromptText: data.systemPromptText || '',
            knowledgeBlocks: Array.isArray(data.knowledgeBlocks) && data.knowledgeBlocks.length > 0
              ? data.knowledgeBlocks
              : (currentActiveConfig.knowledgeBlocks?.length > 0 ? currentActiveConfig.knowledgeBlocks : DEFAULT_KNOWLEDGE_BLOCKS),
            lastUpdated: data.lastUpdated || new Date().toISOString(),
            updatedBy: data.updatedBy || 'admin'
          };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentActiveConfig));
          } catch {
            // ignore
          }
          callback(currentActiveConfig);
        } else {
          saveBotKnowledgeToFirestore(DEFAULT_BOT_KNOWLEDGE, 'init');
        }
      },
      (error) => {
        console.warn('Firestore subscription warning (using local bot knowledge):', error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Could not establish Firestore listener for bot knowledge:', err);
    return () => {};
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
    lastUpdated: new Date().toISOString(),
    updatedBy: userEmail
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentActiveConfig));
  } catch {
    // ignore
  }

  if (!db) {
    return {
      success: true,
      error: 'Guardado localmente. La base de datos de Firebase no está conectada actualmente.'
    };
  }

  try {
    const docRef = doc(db, KNOWLEDGE_DOC_PATH.collection, KNOWLEDGE_DOC_PATH.docId);
    await setDoc(docRef, {
      ...currentActiveConfig,
      serverTimestamp: serverTimestamp()
    }, { merge: true });

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
  const filtered = currentActiveConfig.knowledgeBlocks.filter(b => b.id !== blockId);
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
