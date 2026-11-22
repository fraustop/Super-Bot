import {
  doc,
  setDoc,
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

export interface BotKnowledgeConfig {
  pricing: BotPricingConfig;
  quotas: BotQuotasConfig;
  rules: BotRulesConfig;
  customNotes?: string;
  systemPromptText?: string;
  lastUpdated?: string;
  updatedBy?: string;
}

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
  lastUpdated: new Date().toISOString(),
  updatedBy: 'system'
};

const STORAGE_KEY = 'superbot_cached_knowledge_v1';
const KNOWLEDGE_DOC_PATH = { collection: 'bot_knowledge', docId: 'active_config' };

// In-memory active configuration
let currentActiveConfig: BotKnowledgeConfig = (() => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      return { ...DEFAULT_BOT_KNOWLEDGE, ...JSON.parse(cached) };
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
  // Call immediately with cached or default
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
          const data = snapshot.data() as BotKnowledgeConfig;
          currentActiveConfig = {
            pricing: { ...DEFAULT_BOT_KNOWLEDGE.pricing, ...data.pricing },
            quotas: { ...DEFAULT_BOT_KNOWLEDGE.quotas, ...data.quotas },
            rules: { ...DEFAULT_BOT_KNOWLEDGE.rules, ...data.rules },
            customNotes: data.customNotes || '',
            systemPromptText: data.systemPromptText || '',
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
          // If document does not exist yet in Firestore, initialize it
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
 * Save updated bot knowledge document to Firestore.
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
 * Intelligent Trainer Engine:
 * Analyzes natural language instructions from the admin (e.g. "Sube la página a $400 y agrega promo de $200")
 * and computes the updated parameters with human-readable change logs.
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

  // Match numbers in instructions (e.g. 400, $500, 1200)
  const numbers = text.match(/\d+[\d,]*/g)?.map((n) => parseInt(n.replace(/,/g, ''), 10)) || [];

  // 1. Web price changes
  if ((text.includes('web') || text.includes('pagina') || text.includes('página')) && (text.includes('precio') || text.includes('costo') || text.includes('sube') || text.includes('baja') || text.includes('cambia') || numbers.length > 0)) {
    if (numbers.length > 0 && !text.includes('ajuste') && !text.includes('seccion')) {
      const newPrice = numbers[0];
      if (newPrice !== next.pricing.webBasic) {
        changes.push(`Precio base de Página Web: $${next.pricing.webBasic} ➔ $${newPrice} MXN`);
        next.pricing.webBasic = newPrice;
      }
    }
  }

  // 2. Web adjustment changes
  if ((text.includes('ajuste') || text.includes('seccion') || text.includes('sección') || text.includes('modificacion')) && numbers.length > 0) {
    const newAdj = numbers[numbers.length - 1];
    if (newAdj !== next.pricing.webAdjustment) {
      changes.push(`Costo por ajuste de Página Web: $${next.pricing.webAdjustment} ➔ $${newAdj} MXN`);
      next.pricing.webAdjustment = newAdj;
    }
  }

  // 3. Static App price changes
  if ((text.includes('app') || text.includes('aplicacion') || text.includes('aplicación') || text.includes('pos') || text.includes('estatica')) && (text.includes('local') || text.includes('computadora') || text.includes('base') || text.includes('estatica'))) {
    if (numbers.length > 0) {
      const newPrice = numbers[0];
      if (newPrice !== next.pricing.appStatic) {
        changes.push(`Precio de App Estática (1 PC): $${next.pricing.appStatic} ➔ $${newPrice} MXN`);
        next.pricing.appStatic = newPrice;
      }
    }
  }

  // 4. Cloud monthly price changes
  if ((text.includes('nube') || text.includes('cloud') || text.includes('backend') || text.includes('mensual')) && (text.includes('app') || text.includes('sistema'))) {
    if (numbers.length > 0) {
      const newPrice = numbers[numbers.length - 1];
      if (newPrice !== next.pricing.appCloudMonthly) {
        changes.push(`Mensualidad de App en Nube: $${next.pricing.appCloudMonthly} ➔ $${newPrice} MXN/mes`);
        next.pricing.appCloudMonthly = newPrice;
      }
    }
  }

  // 5. Bot rental monthly price changes
  if (text.includes('bot') || text.includes('whatsapp') || text.includes('asistente') || text.includes('renta')) {
    if (numbers.length > 0) {
      const newPrice = numbers[numbers.length - 1];
      if (newPrice >= 500 && newPrice !== next.pricing.botMonthly) {
        changes.push(`Renta mensual de Bot: $${next.pricing.botMonthly} ➔ $${newPrice} MXN/mes`);
        next.pricing.botMonthly = newPrice;
      }
    }
  }

  // 6. Gemini quota
  if (text.includes('gemini') || text.includes('mensaje') || text.includes('peticion') || text.includes('cuota ia')) {
    if (numbers.length > 0) {
      const newQuota = numbers[0];
      if (newQuota >= 500 && newQuota !== next.quotas.geminiFreeDaily) {
        changes.push(`Cuota diaria gratuita de Gemini: ${next.quotas.geminiFreeDaily} ➔ ${newQuota} mensajes/día`);
        next.quotas.geminiFreeDaily = newQuota;
      }
    }
  }

  // 7. Rule toggles
  if (text.includes('tecnicismo') || text.includes('tecnico') || text.includes('técnico')) {
    if (text.includes('no') || text.includes('evita') || text.includes('quita') || text.includes('sin')) {
      next.rules.avoidTechnicalJargon = true;
      changes.push('Regla de lenguaje: Evitar tecnicismos activada.');
    } else if (text.includes('permite') || text.includes('activa') || text.includes('usa')) {
      next.rules.avoidTechnicalJargon = false;
      changes.push('Regla de lenguaje: Permitir datos técnicos activada.');
    }
  }

  if (text.includes('vendedor') || text.includes('ventas') || text.includes('comercial')) {
    next.rules.salespersonAttitude = true;
    changes.push('Actitud de vendedor activada.');
  }

  // 8. Custom instructions / notes
  if (changes.length === 0 || text.includes('agrega nota') || text.includes('instruccion') || text.includes('nota') || text.includes('recuerda')) {
    const cleanNote = instruction.replace(/^(agrega nota|nota|recuerda|instruccion:?)/i, '').trim();
    if (cleanNote) {
      next.customNotes = (next.customNotes ? `${next.customNotes}\n- ` : '- ') + cleanNote;
      changes.push(`Nueva nota de entrenamiento agregada: "${cleanNote}"`);
    }
  }

  return {
    updatedConfig: next,
    changesSummary: changes
  };
}
