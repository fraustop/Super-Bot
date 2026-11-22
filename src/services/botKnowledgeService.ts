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

export interface BotKnowledgeBlock {
  id: string;
  title: string;
  category: 'package' | 'pricing' | 'promotion' | 'quota' | 'rule' | 'custom';
  summary: string;
  content: string; // The formatted markdown block injected into master prompt
  structuredData?: {
    price?: number;
    adjustmentPrice?: number;
    monthlyPrice?: number;
    includes?: string;
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
  {
    id: 'block-web-basic',
    title: 'Página Web Sencilla ($300 MXN)',
    category: 'package',
    summary: 'Página de 1 sola sección con hosting en la nube y botón directo a WhatsApp.',
    content: 'PÁGINA WEB SENCILLA: Desde $300 MXN (pago único inicial). Incluye diseño responsivo de 1 sección, alojamiento en la nube de alta velocidad con candado SSL y botón directo a WhatsApp. Mantenimiento y modificaciones: $100 MXN por cada ajuste solicitado posterior.',
    structuredData: {
      price: 300,
      adjustmentPrice: 100,
      includes: '1 sección responsiva, hosting cloud SSL, botón directo a WhatsApp',
      additionalPackages: 'Ajustes posteriores por $100 MXN c/u'
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorEmail: 'sistema@superbot.ai'
  },
  {
    id: 'block-app-pos',
    title: 'Aplicación Web Estática POS ($500 MXN)',
    category: 'package',
    summary: 'Herramienta para mostrador, inventario y cobro rápido en 1 computadora local.',
    content: 'APLICACIÓN WEB ESTÁTICA POS: $500 MXN. Diseñada para operar en 1 sola computadora de mostrador para registro de productos, inventario y cobro sin mensualidad de servidor. Funciones de backend o nube opcionales desde $300 MXN/mes.',
    structuredData: {
      price: 500,
      monthlyPrice: 300,
      includes: 'Control de inventario, punto de venta local para 1 PC',
      additionalPackages: 'Sincronización en la nube desde $300 MXN/mes'
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorEmail: 'sistema@superbot.ai'
  },
  {
    id: 'block-bot-monthly',
    title: 'Bot de Atención Inteligente ($1,000 MXN/mes)',
    category: 'package',
    summary: 'Asistente 24/7 en WhatsApp, Telegram y Web en capas gratuitas de nube.',
    content: 'BOTS DE ATENCIÓN INTELIGENTE: Renta de $1,000 MXN mensuales. Se configuran en las capas gratuitas (Free Tiers) de Google Gemini (hasta 1,500 mensajes/día gratis) y WhatsApp Cloud API (1,000 conversaciones/mes gratis). Resuelven dudas 24/7 y cierran ventas.',
    structuredData: {
      monthlyPrice: 1000,
      geminiDailyFree: 1500,
      whatsappMonthlyFree: 1000,
      includes: 'Atención 24/7 en WhatsApp, Telegram y Web'
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorEmail: 'sistema@superbot.ai'
  },
  {
    id: 'block-rule-sales',
    title: 'Regla: Cero Tecnicismos y Actitud de Venta',
    category: 'rule',
    summary: 'Explicar siempre en lenguaje de beneficios reales y evitar términos de ingeniería.',
    content: 'REGLA DE VENTAJE Y LENGUAJE: Hablar siempre en términos cotidianos de negocio (más clientes, ahorro de tiempo, presencia 24/7, candadito de seguridad). Evitar tecnicismos (latencias, RAM, tokens, webhooks, microservicios) a menos que el cliente pregunte puntualmente por un dato técnico.',
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

const STORAGE_KEY = 'superbot_cached_knowledge_v2';
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

/**
 * Real-time subscription to Firestore bot knowledge document.
 * Keeps the bot advisor instantly updated without re-deploying!
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
          // Initialize in Firestore if doesn't exist
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

  // Update base pricing if structured data specifies pricing
  const newPricing = { ...currentActiveConfig.pricing };
  if (finalBlock.structuredData?.price) {
    const p = finalBlock.structuredData.price;
    const cat = finalBlock.category;
    const text = (finalBlock.title + ' ' + finalBlock.content).toLowerCase();
    if (cat === 'package' || cat === 'pricing') {
      if (text.includes('web') || text.includes('página') || text.includes('pagina')) {
        newPricing.webBasic = p;
      } else if (text.includes('app') || text.includes('pos')) {
        newPricing.appStatic = p;
      }
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

  // Also write individual block document in collection 'bot_knowledge_blocks'
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
// Interactive Coach / Trainer Bot Engine
// ============================================================================

export interface TrainerChatMessage {
  id: string;
  sender: 'trainer' | 'admin';
  text: string;
  timestamp: string;
  proposedBlock?: BotKnowledgeBlock | null;
}

/**
 * Intelligent Coach engine that asks questions to complete a profile of changes
 * and constructs the ready-to-commit master document block.
 */
export async function interactWithTrainerBot(
  userInput: string,
  history: TrainerChatMessage[],
  _currentConfig: BotKnowledgeConfig,
  adminEmail: string
): Promise<{
  replyText: string;
  proposedBlock?: BotKnowledgeBlock | null;
}> {
  const text = userInput.trim();
  const lower = text.toLowerCase();

  // Find previous context in chat history to know if the admin is answering our questions
  const lastTrainerMsg = [...history].reverse().find(m => m.sender === 'trainer');
  const isAnsweringQuestions = Boolean(
    lastTrainerMsg && (
      lastTrainerMsg.text.includes('?') ||
      lastTrainerMsg.text.includes('1.') ||
      lastTrainerMsg.text.includes('¿Qué incluye') ||
      lastTrainerMsg.text.includes('indícame')
    )
  );

  // Extract numbers (e.g. 300, 500, 100)
  const numbers = lower.match(/\d+[\d,]*/g)?.map((n) => parseInt(n.replace(/,/g, ''), 10)) || [];
  const primaryNumber = numbers.length > 0 ? numbers[0] : null;

  // STEP 1: Admin is answering previous clarifying questions
  if (isAnsweringQuestions && history.length >= 2) {
    const firstAdminMsg = history.find(m => m.sender === 'admin')?.text || '';
    const combinedContext = `${firstAdminMsg} | Respuesta: ${text}`;
    const combinedLower = combinedContext.toLowerCase();

    // Determine target price
    const combinedNumbers = combinedLower.match(/\d+[\d,]*/g)?.map((n) => parseInt(n.replace(/,/g, ''), 10)) || [];
    const mainPrice = combinedNumbers.length > 0 ? combinedNumbers[0] : (primaryNumber || 300);

    // Identify details from the user's answer
    const includesText = text.replace(/^(incluye:?|es|tiene)/i, '').trim();

    // Secondary prices (e.g. ajustes por 100, bot por 500)
    let adjustmentPrice = 100;
    let botExtraPrice = 500;
    if (combinedNumbers.length > 1) {
      adjustmentPrice = combinedNumbers[1];
    }
    if (combinedNumbers.length > 2) {
      botExtraPrice = combinedNumbers[2];
    }

    const blockId = `block-${Date.now().toString(36)}`;
    const isWeb = combinedLower.includes('web') || combinedLower.includes('pagina') || combinedLower.includes('página') || mainPrice <= 400;

    const title = isWeb
      ? `Paquete Web Básico ($${mainPrice} MXN)`
      : `Solución Comercial Personalizada ($${mainPrice} MXN)`;

    const structuredData: Record<string, any> = {
      price: mainPrice,
      adjustmentPrice: adjustmentPrice,
      includes: includesText || 'Diseño responsivo de 1 sección, botón directo a WhatsApp y hosting en la nube.',
      additionalPackages: `Ajustes posteriores por $${adjustmentPrice} MXN c/u. Bot de atención adicional por $${botExtraPrice} MXN/mes.`,
      advisorInstructions: `Ofrecer con entusiasmo a emprendedores y negocios locales. Enfatizar que por $${mainPrice} MXN obtienen presencia digital profesional lista para vender, y sugerir como adicional el bot o ajustes.`
    };

    const contentMarkdown = `### ${title.toUpperCase()}\n` +
      `- Costo base: $${mainPrice} MXN (pago único inicial).\n` +
      `- Incluye: ${structuredData.includes}\n` +
      `- Paquetes complementarios / Adicionales: ${structuredData.additionalPackages}\n` +
      `- Consigna para el Bot Asesor: ${structuredData.advisorInstructions}`;

    const proposedBlock: BotKnowledgeBlock = {
      id: blockId,
      title,
      category: 'package',
      summary: `Paquete configurado a $${mainPrice} MXN con ${structuredData.includes.slice(0, 75)}...`,
      content: contentMarkdown,
      structuredData,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorEmail: adminEmail
    };

    return {
      replyText: `¡Excelente! He compilado el perfil completo de cambios a partir de tus respuestas.\n\nA continuación tienes el **bloque propuesto** que se incorporará a los documentos maestros de Firestore. Revisa los detalles en la tarjeta y haz clic en **"Confirmar y Subir a Firestore"** para que el Bot Asesor empiece a cotizarlo de inmediato.`,
      proposedBlock
    };
  }

  // STEP 2: Initial instruction received (e.g. "cambia el precio a 300 pesos")
  if (lower.includes('precio') || lower.includes('costo') || lower.includes('pesos') || lower.includes('cambia') || numbers.length > 0) {
    const targetPrice = primaryNumber || 300;

    // Build a draft proposed block in progress
    const draftBlock: BotKnowledgeBlock = {
      id: `draft-${Date.now().toString(36)}`,
      title: `Propuesta de Paquete ($${targetPrice} MXN)`,
      category: 'package',
      summary: `Ajuste de precio base a $${targetPrice} MXN (en espera de especificación de paquete).`,
      content: `PAQUETE EN ELABORACIÓN: Precio de $${targetPrice} MXN. En espera de confirmación de qué incluye y paquetes complementarios.`,
      structuredData: {
        price: targetPrice,
        status: 'draft_in_progress'
      },
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorEmail: adminEmail
    };

    return {
      replyText:
        `Entendido, quieres fijar el precio en **$${targetPrice} pesos**.\n\n` +
        `Para completar el perfil de este cambio y que el Bot Asesor pueda cotizar y argumentar la venta adecuadamente, por favor indícame:\n\n` +
        `1. **¿Qué incluye exactamente el paquete de $${targetPrice} pesos?** *(por ejemplo: ¿diseño de 1 sola sección, hosting, botón a WhatsApp, cotizador?)*\n` +
        `2. **¿Este precio sustituye al paquete básico o es una promoción / paquete especial?**\n` +
        `3. **¿El bot asesor puede ofrecer otros paquetes o adicionales?** *(por ejemplo: ajustes por $100, dominio propio, bot de WhatsApp por $500, etc.)*`,
      proposedBlock: draftBlock
    };
  }

  // STEP 3: Request to add a new bot or service
  if (lower.includes('bot') || lower.includes('whatsapp') || lower.includes('servicio') || lower.includes('paquete')) {
    const draftBlock: BotKnowledgeBlock = {
      id: `draft-${Date.now().toString(36)}`,
      title: `Nuevo Servicio de Bot / Asistente`,
      category: 'package',
      summary: 'Configuración de nuevo paquete de atención automatizada.',
      content: 'NUEVO SERVICIO DE ATENCIÓN: Integración con IA y mensajería en la nube.',
      structuredData: {
        category: 'bot'
      },
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorEmail: adminEmail
    };

    return {
      replyText:
        `¡Excelente! Vamos a diseñar este nuevo servicio para el Bot Asesor.\n\n` +
        `Por favor compleméntame estos datos clave:\n\n` +
        `1. **¿Cuál será la tarifa y modalidad?** *(¿pago único o renta mensual?)*\n` +
        `2. **¿En qué canales operará?** *(¿WhatsApp, Telegram, Web o todos?)*\n` +
        `3. **¿Qué cuota gratuita de mensajes incluirá y cómo debe ofrecerlo el asesor?*`,
      proposedBlock: draftBlock
    };
  }

  // STEP 4: Rule or communication guideline
  if (lower.includes('regla') || lower.includes('consigna') || lower.includes('tecnicismo') || lower.includes('vender') || lower.includes('tono')) {
    const draftBlock: BotKnowledgeBlock = {
      id: `draft-${Date.now().toString(36)}`,
      title: `Nueva Consigna de Comunicación`,
      category: 'rule',
      summary: 'Pauta de lenguaje y comportamiento para el Bot Asesor.',
      content: `REGLA DE CONVERSACIÓN: ${text}`,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorEmail: adminEmail
    };

    return {
      replyText:
        `Perfecto, configuremos una nueva directriz para el Bot Asesor.\n\n` +
        `1. **¿Cómo debe reflejarse esto en las respuestas al cliente?** *(¿algún ejemplo de frase clave?)*\n` +
        `2. **¿Debe aplicarse a todos los servicios o solo a cotizaciones específicas?*`,
      proposedBlock: draftBlock
    };
  }

  // STEP 5: Default assistance
  return {
    replyText:
      `¡Hola! Soy tu **Bot Entrenador**. Mi consigna es ayudarte a definir y complementar cambios para el Bot Asesor.\n\n` +
      `Puedes indicarme por ejemplo:\n` +
      `• *"Cambia el precio a 300 pesos"*\n` +
      `• *"Crea un paquete de Web con Bot de WhatsApp"*\n` +
      `• *"Agrega una promoción de descuento para negocios locales"*\n\n` +
      `Te haré unas breves preguntas para completar el perfil del cambio y generaré el bloque maestro para subirlo a Firestore.`
  };
}

/**
 * Legacy NLP parser kept for quick slider/text backwards compatibility.
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
