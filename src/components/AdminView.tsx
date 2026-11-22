import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Bot,
  Sparkles,
  Send,
  Sliders,
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
  LogOut,
  Package,
  Wrench,
  Brain,
  Trash2,
  ArrowRight,
  RefreshCw,
  Tag,
  Check,
  DollarSign,
  Edit3,
  X,
  Plus,
  Save,
  RotateCcw,
  Sun,
  Moon,
  Bold,
  Italic,
  Heading2,
  List,
  Code
} from 'lucide-react';
import {
  type BotKnowledgeConfig,
  type BotKnowledgeBlock,
  type TrainerChatMessage,
  DEFAULT_BOT_KNOWLEDGE,
  subscribeToBotKnowledge,
  saveBotKnowledgeToFirestore,
  addOrUpdateKnowledgeBlock,
  deleteKnowledgeBlock,
  interactWithTrainerBot,
  isProductBlock,
  isServiceBlock,
  isInstructionBlock
} from '../services/botKnowledgeService';
import type { AppUser } from '../firebase/config';

interface AdminViewProps {
  currentUser: AppUser | null;
  onLogout: () => void;
  onViewPublicSite: () => void;
  onOpenChat: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  onLogout,
  onViewPublicSite,
  onOpenChat,
  theme = 'dark',
  onToggleTheme
}) => {
  const [config, setConfig] = useState<BotKnowledgeConfig>(DEFAULT_BOT_KNOWLEDGE);
  const [activeTab, setActiveTab] = useState<'trainer' | 'products' | 'services' | 'instructions' | 'pricing' | 'raw'>('trainer');
  const [trainerFocus, setTrainerFocus] = useState<'product' | 'service' | 'instruction'>('product');

  // Manual Block Editing Modal State
  const [editingBlock, setEditingBlock] = useState<BotKnowledgeBlock | null>(null);
  const [isNewManualBlock, setIsNewManualBlock] = useState<boolean>(false);
  const [promptViewMode, setPromptViewMode] = useState<'edit' | 'preview'>('edit');

  // Interactive Trainer Chat
  const [chatMessages, setChatMessages] = useState<TrainerChatMessage[]>([
    {
      id: 'init-msg',
      sender: 'trainer',
      text: '¡Hola! Soy tu **Bot Entrenador**.\n\nPuedo ayudarte a crear y configurar tres tipos de objetos maestros para el Bot Asesor:\n1. 📦 **Productos**: Software empaquetado y licencias de pago único.\n2. 🛠️ **Servicios**: Rentas mensuales de bots, pólizas de mantenimiento e infraestructura cloud.\n3. 🧠 **Instrucciones al Bot**: Reglas de lenguaje, consignas de venta, redirecciones y cotizaciones.\n\nTambién puedes **modificar cualquier objeto manualmente** usando el botón "Editar" en sus respectivas pestañas con panel de detalles a la izquierda (25%) y el prompt con markdown a la derecha (75%).',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [trainerLoading, setTrainerLoading] = useState(false);
  const [activeProposedBlock, setActiveProposedBlock] = useState<BotKnowledgeBlock | null>(null);

  // Status & notifications
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToBotKnowledge((freshConfig) => {
      setConfig(freshConfig);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (activeTab === 'trainer') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const adminEmail = currentUser?.email || 'admin@superbot.ai';

  // Categorized blocks
  const productBlocks = (config.knowledgeBlocks || []).filter(isProductBlock);
  const serviceBlocks = (config.knowledgeBlocks || []).filter(isServiceBlock);
  const instructionBlocks = (config.knowledgeBlocks || []).filter(isInstructionBlock);

  // Helper to compile a clean markdown prompt block from structured data
  const generateContentFromBlock = (b: BotKnowledgeBlock): string => {
    if (b.category === 'instruction') {
      const ruleType = b.structuredData?.ruleType || 'Directriz de Asesor';
      const advice = b.structuredData?.advisorInstructions || b.summary || 'Cumplir en toda interacción comercial';
      return `### INSTRUCCIÓN OBLIGATORIA AL ASESOR: ${b.title.toUpperCase()}\n\n- **Tipo de directriz:** ${ruleType}\n- **Directriz oficial:** ${advice}\n- **Regla estricta:** Aplicar de forma obligatoria en todas las respuestas y cotizaciones comerciales del Bot Asesor comercial Super-Bot.`;
    }
    if (b.category === 'service') {
      const isMonthly = Boolean(b.structuredData?.monthlyPrice);
      const priceText = isMonthly ? `$${b.structuredData?.monthlyPrice} MXN/mes` : `$${b.structuredData?.adjustmentPrice || 100} MXN por ajuste`;
      const freq = b.structuredData?.frequency || (isMonthly ? 'Mensual recurrente' : 'Por evento');
      const channels = b.structuredData?.channels || 'WhatsApp Cloud API y Web';
      const inc = b.structuredData?.includes || b.summary || 'Atención y soporte continuo';
      const advice = b.structuredData?.advisorInstructions || 'Ofrecer a prospectos que buscan solución continua para su negocio.';
      return `### SERVICIO OFICIAL: ${b.title.toUpperCase()}\n\n- **Tarifa oficial:** ${priceText} (${freq})\n- **Canales de operación:** ${channels}\n- **Alcance y cobertura:** ${inc}\n- **Consigna para el Asesor:** ${advice}`;
    }
    // Product
    const price = b.structuredData?.price || 300;
    const format = b.structuredData?.deliveryFormat || 'Despliegue web inmediato';
    const inc = b.structuredData?.includes || b.summary || 'Entrega completa llave en mano';
    const addOns = b.structuredData?.additionalPackages || 'Póliza de ajustes posteriores por $100 MXN';
    const advice = b.structuredData?.advisorInstructions || 'Presentar como solución de entrada para iniciar a vender de inmediato.';
    return `### PRODUCTO OFICIAL DEL CATÁLOGO: ${b.title.toUpperCase()}\n\n- **Costo base:** $${price} MXN (pago único inicial)\n- **Formato de entrega:** ${format}\n- **Qué incluye:** ${inc}\n- **Paquetes complementarios:** ${addOns}\n- **Consigna para el Asesor:** ${advice}`;
  };

  // Open modal to manually edit an existing block
  const handleOpenManualEdit = (block: BotKnowledgeBlock) => {
    setEditingBlock(JSON.parse(JSON.stringify(block)));
    setIsNewManualBlock(false);
    setPromptViewMode('edit');
  };

  // Open modal to manually create a new block
  const handleOpenManualCreate = (cat: 'product' | 'service' | 'instruction') => {
    const newBlock: BotKnowledgeBlock = {
      id: `block-${Date.now().toString(36)}`,
      title: cat === 'product' ? 'Nuevo Producto' : cat === 'service' ? 'Nuevo Servicio' : 'Nueva Instrucción al Bot',
      category: cat,
      summary: '',
      content: '',
      structuredData: {
        price: cat === 'product' ? 300 : undefined,
        monthlyPrice: cat === 'service' ? 1000 : undefined,
        adjustmentPrice: cat === 'service' ? 100 : undefined,
        deliveryFormat: cat === 'product' ? 'Despliegue web inmediato' : undefined,
        frequency: cat === 'service' ? 'Mensual recurrente' : undefined,
        channels: cat === 'service' ? 'WhatsApp Cloud API, Web' : undefined,
        ruleType: cat === 'instruction' ? 'Tono y Lenguaje' : undefined,
        includes: '',
        additionalPackages: '',
        advisorInstructions: ''
      },
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorEmail: adminEmail
    };
    newBlock.content = generateContentFromBlock(newBlock);
    setEditingBlock(newBlock);
    setIsNewManualBlock(true);
    setPromptViewMode('edit');
  };

  // Save manual block directly to Firestore
  const handleSaveManualBlock = async () => {
    if (!editingBlock) return;
    if (!editingBlock.title.trim()) {
      alert('Por favor especifica un título para el objeto.');
      return;
    }

    const blockToSave: BotKnowledgeBlock = {
      ...editingBlock,
      summary: editingBlock.summary.trim() || editingBlock.structuredData?.includes || editingBlock.title,
      content: editingBlock.content.trim() || generateContentFromBlock(editingBlock),
      updatedAt: new Date().toISOString(),
      authorEmail: adminEmail
    };

    setSaving(true);
    setSaveStatus(null);
    const res = await addOrUpdateKnowledgeBlock(blockToSave, adminEmail);
    setSaving(false);

    if (res.success) {
      const categoryLabel = isProductBlock(blockToSave)
        ? 'Productos'
        : isServiceBlock(blockToSave)
          ? 'Servicios'
          : 'Instrucciones al Bot';

      setSaveStatus({
        type: 'success',
        message: `¡"${blockToSave.title}" guardado y sincronizado en Firestore en ${categoryLabel}!`
      });
      setEditingBlock(null);
      setTimeout(() => setSaveStatus(null), 5000);
    } else {
      setSaveStatus({
        type: 'error',
        message: res.error || 'Error al guardar manualmente en Firestore.'
      });
    }
  };

  // Helper to insert markdown tags at cursor position
  const handleInsertMarkdownTag = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('modal-prompt-textarea') as HTMLTextAreaElement | null;
    if (!textarea || !editingBlock) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = editingBlock.content || '';
    const selected = current.substring(start, end);
    const replacement = selected ? `${prefix}${selected}${suffix}` : `${prefix}texto${suffix}`;
    const newContent = current.substring(0, start) + replacement + current.substring(end);
    setEditingBlock({ ...editingBlock, content: newContent });
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 5));
    }, 50);
  };

  // Render formatted markdown preview
  const renderInlineMarkdown = (line: string): React.ReactNode[] => {
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="md-bold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="md-italic">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="md-code">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  const renderMarkdownPreview = (text: string, category: string) => {
    const lines = (text || '').split('\n');
    return (
      <div className={`markdown-preview-container ${category}`}>
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="md-spacer" />;
          }
          if (trimmed.startsWith('### ')) {
            return <h4 key={idx} className="md-h3">{renderInlineMarkdown(trimmed.replace(/^###\s*/, ''))}</h4>;
          }
          if (trimmed.startsWith('## ')) {
            return <h3 key={idx} className="md-h2">{renderInlineMarkdown(trimmed.replace(/^##\s*/, ''))}</h3>;
          }
          if (trimmed.startsWith('# ')) {
            return <h2 key={idx} className="md-h1">{renderInlineMarkdown(trimmed.replace(/^#\s*/, ''))}</h2>;
          }
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
            const itemText = trimmed.replace(/^[-*•]\s*/, '');
            return (
              <div key={idx} className="md-list-item">
                <span className="md-bullet">•</span>
                <div className="md-list-content">{renderInlineMarkdown(itemText)}</div>
              </div>
            );
          }
          if (trimmed.startsWith('> ')) {
            return (
              <blockquote key={idx} className="md-blockquote">
                {renderInlineMarkdown(trimmed.replace(/^>\s*/, ''))}
              </blockquote>
            );
          }
          return <p key={idx} className="md-paragraph">{renderInlineMarkdown(trimmed)}</p>;
        })}
      </div>
    );
  };

  // Send message to Trainer Bot
  const handleSendMessage = async (customPrompt?: string, overrideFocus?: 'product' | 'service' | 'instruction') => {
    const textToSend = (customPrompt || userInput).trim();
    if (!textToSend || trainerLoading) return;

    setUserInput('');
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const effectiveFocus = overrideFocus || trainerFocus;

    const userMsg: TrainerChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'admin',
      text: textToSend,
      timestamp: nowTime
    };

    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setTrainerLoading(true);

    try {
      const result = await interactWithTrainerBot(textToSend, newHistory, config, adminEmail, effectiveFocus);

      const botMsg: TrainerChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'trainer',
        text: result.replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        proposedBlock: result.proposedBlock || null
      };

      setChatMessages(prev => [...prev, botMsg]);
      if (result.proposedBlock) {
        setActiveProposedBlock(result.proposedBlock);
      }
    } catch {
      setChatMessages(prev => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'trainer',
          text: 'Ocurrió un error al procesar tu instrucción. Por favor intenta de nuevo.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setTrainerLoading(false);
    }
  };

  // Confirm proposed block and upload to Firestore
  const handleConfirmAndUploadBlock = async (blockToUpload: BotKnowledgeBlock) => {
    setSaving(true);
    setSaveStatus(null);

    const res = await addOrUpdateKnowledgeBlock(blockToUpload, adminEmail);
    setSaving(false);

    if (res.success) {
      const categoryLabel = isProductBlock(blockToUpload)
        ? 'Productos'
        : isServiceBlock(blockToUpload)
          ? 'Servicios'
          : 'Instrucciones al Bot';

      setSaveStatus({
        type: 'success',
        message: `¡"${blockToUpload.title}" confirmado y sincronizado con Firestore en ${categoryLabel}!`
      });

      // Add confirmation message to chat
      setChatMessages(prev => [
        ...prev,
        {
          id: `confirmed-${Date.now()}`,
          sender: 'trainer',
          text: `🎉 **¡Bloque confirmado y subido con éxito a Firestore!**\n\nEl objeto **"${blockToUpload.title}"** ya forma parte de los documentos maestros en **${categoryLabel}**. El Bot Asesor comercial ya lo tiene incorporado en sus respuestas y cotizaciones en vivo.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      setActiveProposedBlock(null);
      setTimeout(() => setSaveStatus(null), 6000);
    } else {
      setSaveStatus({
        type: 'error',
        message: res.error || 'Error al subir el bloque a Firestore.'
      });
    }
  };

  // Delete an existing knowledge block
  const handleDeleteBlock = async (blockId: string, blockTitle: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${blockTitle}" de los documentos maestros de Firestore?`)) {
      return;
    }

    setSaving(true);
    const res = await deleteKnowledgeBlock(blockId, adminEmail);
    setSaving(false);

    if (res.success) {
      setSaveStatus({
        type: 'success',
        message: `"${blockTitle}" eliminado de Firestore.`
      });
      setTimeout(() => setSaveStatus(null), 4000);
    } else {
      setSaveStatus({
        type: 'error',
        message: res.error || 'Error al eliminar de Firestore'
      });
    }
  };

  // Load an existing block into the Trainer Chat to refine it
  const handleRefineBlockWithTrainer = (
    block: BotKnowledgeBlock,
    focus: 'product' | 'service' | 'instruction'
  ) => {
    setActiveTab('trainer');
    setTrainerFocus(focus);
    setActiveProposedBlock(block);
    let prompt = '';
    if (focus === 'product') {
      prompt = `Quiero modificar el producto "${block.title}". Precio actual: $${block.structuredData?.price || 0} MXN. ¿Qué cambios podemos hacerle?`;
    } else if (focus === 'service') {
      prompt = `Quiero actualizar el servicio "${block.title}". Tarifa actual: $${block.structuredData?.monthlyPrice || block.structuredData?.adjustmentPrice || 0} MXN. ¿Qué ajustes realizamos?`;
    } else {
      prompt = `Quiero refinar la instrucción al bot "${block.title}". Regla actual: ${block.structuredData?.advisorInstructions || block.summary}. ¿Cómo la ajustamos?`;
    }
    handleSendMessage(prompt, focus);
  };

  // Switch to Trainer Bot from any category tab
  const handleStartTrainingCategory = (focus: 'product' | 'service' | 'instruction') => {
    setActiveTab('trainer');
    setTrainerFocus(focus);
    let initialPrompt = '';
    if (focus === 'product') {
      initialPrompt = 'Quiero registrar un nuevo Producto en el catálogo de venta';
    } else if (focus === 'service') {
      initialPrompt = 'Quiero configurar un nuevo Servicio recurrente para el Bot Asesor';
    } else {
      initialPrompt = 'Quiero agregar una nueva regla o instrucción de comportamiento para el Bot Asesor';
    }
    handleSendMessage(initialPrompt, focus);
  };

  return (
    <div className="admin-dashboard-container">
      {/* Top Banner / High-Contrast Navigation Header */}
      <header className="admin-header-bar">
        <div className="admin-header-brand">
          <div className="admin-badge-icon">
            <ShieldCheck size={24} className="text-emerald-400" />
          </div>
          <div>
            <div className="admin-title-row">
              <h2 className="admin-title">Panel de Control: Bot Entrenador</h2>
              <span className="admin-role-pill">Administrador</span>
            </div>
            <p className="admin-subtitle">
              Configura Productos, Servicios e Instrucciones al Bot con edición manual directa o entrenamiento interactivo
            </p>
          </div>
        </div>

        <div className="admin-header-controls">
          {onToggleTheme && (
            <button
              type="button"
              className="btn-admin-theme"
              onClick={onToggleTheme}
              title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
            </button>
          )}
          <button
            type="button"
            className="btn-admin-preview"
            onClick={onViewPublicSite}
            title="Ver catálogo público como cliente"
          >
            <Eye size={16} />
            <span>Ver Catálogo Público</span>
          </button>
          <button
            type="button"
            className="btn-admin-test-chat"
            onClick={onOpenChat}
            title="Probar respuestas del Bot Asesor"
          >
            <Bot size={16} />
            <span>Probar Bot Asesor</span>
          </button>
          <button
            type="button"
            className="btn-admin-logout"
            onClick={onLogout}
            title="Cerrar sesión"
          >
            <LogOut size={16} />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* Main Admin Workspace */}
      <div className="admin-workspace-grid">
        {/* Left Side: Navigation Tabs & Firestore Live Status */}
        <aside className="admin-sidebar-nav">
          <div className="admin-nav-card">
            <h4 className="admin-nav-heading">Módulos del Sistema</h4>
            <div className="admin-nav-tabs">
              {/* Tab 1: Bot Entrenador */}
              <button
                type="button"
                className={`admin-nav-tab-btn ${activeTab === 'trainer' ? 'active' : ''}`}
                onClick={() => setActiveTab('trainer')}
              >
                <Sparkles size={17} className="text-amber-400" />
                <div className="nav-tab-label-group">
                  <span>Bot Entrenador</span>
                  <span className="nav-tab-badge-sub">Preguntas & Bloques</span>
                </div>
              </button>

              {/* Tab 2: Productos */}
              <button
                type="button"
                className={`admin-nav-tab-btn ${activeTab === 'products' ? 'active product-active' : ''}`}
                onClick={() => setActiveTab('products')}
              >
                <Package size={17} className="text-emerald-400" />
                <div className="nav-tab-label-group">
                  <span>Productos</span>
                  <span className="nav-tab-badge-count green">{productBlocks.length}</span>
                </div>
              </button>

              {/* Tab 3: Servicios */}
              <button
                type="button"
                className={`admin-nav-tab-btn ${activeTab === 'services' ? 'active service-active' : ''}`}
                onClick={() => setActiveTab('services')}
              >
                <Wrench size={17} className="text-cyan-400" />
                <div className="nav-tab-label-group">
                  <span>Servicios</span>
                  <span className="nav-tab-badge-count cyan">{serviceBlocks.length}</span>
                </div>
              </button>

              {/* Tab 4: Instrucciones al Bot */}
              <button
                type="button"
                className={`admin-nav-tab-btn ${activeTab === 'instructions' ? 'active instruction-active' : ''}`}
                onClick={() => setActiveTab('instructions')}
              >
                <Brain size={17} className="text-purple-400" />
                <div className="nav-tab-label-group">
                  <span>Instrucciones al Bot</span>
                  <span className="nav-tab-badge-count purple">{instructionBlocks.length}</span>
                </div>
              </button>

              {/* Tab 5: Tarifas y Cuotas */}
              <button
                type="button"
                className={`admin-nav-tab-btn ${activeTab === 'pricing' ? 'active' : ''}`}
                onClick={() => setActiveTab('pricing')}
              >
                <Sliders size={17} />
                <div className="nav-tab-label-group">
                  <span>Tarifas y Cuotas</span>
                  <span className="nav-tab-badge-sub">Cotizador Base</span>
                </div>
              </button>

              {/* Tab 6: Documento Maestro */}
              <button
                type="button"
                className={`admin-nav-tab-btn ${activeTab === 'raw' ? 'active' : ''}`}
                onClick={() => setActiveTab('raw')}
              >
                <FileText size={17} />
                <div className="nav-tab-label-group">
                  <span>Documento Maestro</span>
                  <span className="nav-tab-badge-sub">JSON Firestore</span>
                </div>
              </button>
            </div>
          </div>

          {/* Firestore Connection Badge */}
          <div className="admin-firestore-status-card">
            <div className="firestore-status-header">
              <span className="status-dot-live"></span>
              <span className="status-label">Firestore: <code>bot_knowledge</code></span>
            </div>
            <div className="firestore-summary-metrics">
              <div className="metric-row">
                <span className="metric-name">📦 Productos:</span>
                <span className="text-emerald-400 font-bold">{productBlocks.length}</span>
              </div>
              <div className="metric-row">
                <span className="metric-name">🛠️ Servicios:</span>
                <span className="text-cyan-400 font-bold">{serviceBlocks.length}</span>
              </div>
              <div className="metric-row">
                <span className="metric-name">🧠 Instrucciones:</span>
                <span className="text-purple-400 font-bold">{instructionBlocks.length}</span>
              </div>
            </div>
            <p className="firestore-meta-text">
              <strong>Sincronización activa:</strong><br />
              {config.lastUpdated ? new Date(config.lastUpdated).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : 'En línea'}
            </p>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="admin-content-panel">
          {saveStatus && (
            <div className={`admin-notification-toast ${saveStatus.type}`}>
              {saveStatus.type === 'success' ? (
                <CheckCircle2 size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <span>{saveStatus.message}</span>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 1: INTERACTIVE TRAINER BOT (Categorized Coaching & Blocks)    */}
          {/* ================================================================= */}
          {activeTab === 'trainer' && (
            <div className="admin-trainer-layout">
              {/* Left Column: Chat Conversation with Coach */}
              <div className="trainer-chat-column">
                <div className="trainer-chat-header">
                  <div className="trainer-avatar-box">
                    <Sparkles size={20} className="text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="trainer-chat-title">Bot Entrenador Interactivo</h3>
                      <span className="text-xs text-muted">Firestore en tiempo real</span>
                    </div>
                    <p className="trainer-chat-desc">
                      Hazle una indicación y te formulará preguntas para estructurar el perfil del cambio antes de agregarlo a Firestore.
                    </p>
                  </div>
                </div>

                {/* Training Focus Switcher */}
                <div className="trainer-focus-bar">
                  <span className="focus-bar-label">¿Qué deseas entrenar hoy?</span>
                  <div className="focus-buttons-group">
                    <button
                      type="button"
                      className={`focus-pill-btn product ${trainerFocus === 'product' ? 'active' : ''}`}
                      onClick={() => setTrainerFocus('product')}
                    >
                      <Package size={14} />
                      <span>📦 Producto</span>
                    </button>
                    <button
                      type="button"
                      className={`focus-pill-btn service ${trainerFocus === 'service' ? 'active' : ''}`}
                      onClick={() => setTrainerFocus('service')}
                    >
                      <Wrench size={14} />
                      <span>🛠️ Servicio</span>
                    </button>
                    <button
                      type="button"
                      className={`focus-pill-btn instruction ${trainerFocus === 'instruction' ? 'active' : ''}`}
                      onClick={() => setTrainerFocus('instruction')}
                    >
                      <Brain size={14} />
                      <span>🧠 Instrucción al Bot</span>
                    </button>
                  </div>
                </div>

                {/* Quick Prompts Contextual to Active Focus */}
                <div className="trainer-quick-chips">
                  <span className="quick-chips-label">Prueba con:</span>
                  {trainerFocus === 'product' && (
                    <>
                      <button
                        type="button"
                        className="quick-chip-btn"
                        onClick={() => handleSendMessage('cambia el precio a 300 pesos')}
                      >
                        "Cambia el precio a 300 pesos"
                      </button>
                      <button
                        type="button"
                        className="quick-chip-btn"
                        onClick={() => handleSendMessage('crea un producto de tienda web express de $400 pesos')}
                      >
                        "Tienda Web Express ($400)"
                      </button>
                      <button
                        type="button"
                        className="quick-chip-btn"
                        onClick={() => handleSendMessage('agrega un producto de app POS mostrador con cobro ágil')}
                      >
                        "App POS mostrador local"
                      </button>
                    </>
                  )}

                  {trainerFocus === 'service' && (
                    <>
                      <button
                        type="button"
                        className="quick-chip-btn"
                        onClick={() => handleSendMessage('crea una renta de bot de whatsapp por 1000 pesos mensuales')}
                      >
                        "Renta Bot WhatsApp ($1,000/mes)"
                      </button>
                      <button
                        type="button"
                        className="quick-chip-btn"
                        onClick={() => handleSendMessage('agrega poliza de mantenimiento web por 100 pesos por cambio')}
                      >
                        "Póliza de Ajustes ($100/ajuste)"
                      </button>
                      <button
                        type="button"
                        className="quick-chip-btn"
                        onClick={() => handleSendMessage('servicio de sincronizacion cloud y respaldo de datos por 300 pesos al mes')}
                      >
                        "Sincronización Cloud ($300/mes)"
                      </button>
                    </>
                  )}

                  {trainerFocus === 'instruction' && (
                    <>
                      <button
                        type="button"
                        className="quick-chip-btn"
                        onClick={() => handleSendMessage('regla: prohibido usar tecnicismos complejos con clientes')}
                      >
                        "Regla: Cero Tecnicismos"
                      </button>
                      <button
                        type="button"
                        className="quick-chip-btn"
                        onClick={() => handleSendMessage('consigna: si el cliente pregunta si puede hacer la pagina el mismo redirigir a google gemini')}
                      >
                        "Redirección a Google Gemini"
                      </button>
                      <button
                        type="button"
                        className="quick-chip-btn"
                        onClick={() => handleSendMessage('consigna: siempre actuar con actitud de vendedor y cerrar con llamada a la accion comercial')}
                      >
                        "Actitud de Venta con CTA"
                      </button>
                    </>
                  )}
                </div>

                {/* Messages Container */}
                <div className="trainer-messages-container">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`trainer-bubble-wrap ${msg.sender}`}>
                      <div className="bubble-avatar">
                        {msg.sender === 'trainer' ? (
                          <Bot size={16} className="text-amber-400" />
                        ) : (
                          <ShieldCheck size={16} className="text-emerald-400" />
                        )}
                      </div>
                      <div className="bubble-content-box">
                        <div className="bubble-sender-meta">
                          <span className="bubble-sender-name">
                            {msg.sender === 'trainer' ? 'Bot Entrenador' : 'Administrador'}
                          </span>
                          <span className="bubble-time">{msg.timestamp}</span>
                        </div>
                        <div className="bubble-text">
                          {msg.text.split('\n\n').map((paragraph, idx) => (
                            <p key={idx} className="bubble-paragraph">
                              {paragraph}
                            </p>
                          ))}
                        </div>

                        {/* Inline block preview if attached to this message */}
                        {msg.proposedBlock && (
                          <div className="bubble-inline-block-card">
                            <div className="inline-block-header">
                              <Tag size={14} className="text-cyan-400" />
                              <span className="font-semibold">{msg.proposedBlock.title}</span>
                              <span className={`inline-block-cat-badge ${msg.proposedBlock.category}`}>
                                {msg.proposedBlock.category}
                              </span>
                            </div>
                            <p className="inline-block-summary">{msg.proposedBlock.summary}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                type="button"
                                className="btn-inspect-block-inline"
                                onClick={() => setActiveProposedBlock(msg.proposedBlock!)}
                              >
                                <span>Ver Propuesta</span>
                                <ArrowRight size={13} />
                              </button>
                              <button
                                type="button"
                                className="btn-edit-manual-inline"
                                onClick={() => handleOpenManualEdit(msg.proposedBlock!)}
                              >
                                <Edit3 size={12} />
                                <span>Editar Manual</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {trainerLoading && (
                    <div className="trainer-bubble-wrap trainer loading">
                      <div className="bubble-avatar">
                        <Bot size={16} className="text-amber-400 animate-spin" />
                      </div>
                      <div className="bubble-content-box">
                        <span className="text-xs text-muted">El Bot Entrenador está analizando tu indicación...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Field */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="trainer-chat-input-bar"
                >
                  <input
                    type="text"
                    placeholder={`Escribe tu indicación o responde las preguntas para configurar este ${trainerFocus === 'product' ? 'Producto' : trainerFocus === 'service' ? 'Servicio' : 'Instrucción'}...`}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    disabled={trainerLoading}
                    className="trainer-text-input"
                  />
                  <button
                    type="submit"
                    className="btn-send-trainer"
                    disabled={trainerLoading || !userInput.trim()}
                  >
                    <Send size={16} />
                    <span>Enviar</span>
                  </button>
                </form>
              </div>

              {/* Right Column: Proposed Block for Firestore */}
              <div className="trainer-proposed-column">
                <div className="proposed-block-panel">
                  <div className="proposed-panel-header">
                    <div className="flex items-center gap-2">
                      <Tag size={18} className="text-cyan-400" />
                      <h4 className="proposed-panel-title">Bloque Propuesto para Firestore</h4>
                    </div>
                    {activeProposedBlock && (
                      <span className="proposed-badge-status">Listo para confirmación</span>
                    )}
                  </div>

                  {activeProposedBlock ? (
                    <div className="proposed-block-card">
                      <div className="proposed-card-top">
                        <h4 className="proposed-block-title">{activeProposedBlock.title}</h4>
                        <span className={`proposed-category-badge ${activeProposedBlock.category}`}>
                          {activeProposedBlock.category.toUpperCase()}
                        </span>
                      </div>

                      <div className="proposed-details-grid">
                        {/* Price details */}
                        {activeProposedBlock.structuredData?.price !== undefined && (
                          <div className="proposed-detail-item">
                            <span className="detail-label">Precio Único Base:</span>
                            <span className="detail-value text-emerald-400 font-bold">
                              ${activeProposedBlock.structuredData.price} MXN
                            </span>
                          </div>
                        )}
                        {activeProposedBlock.structuredData?.monthlyPrice !== undefined && (
                          <div className="proposed-detail-item">
                            <span className="detail-label">Renta Mensual:</span>
                            <span className="detail-value text-cyan-400 font-bold">
                              ${activeProposedBlock.structuredData.monthlyPrice} MXN/mes
                            </span>
                          </div>
                        )}
                        {activeProposedBlock.structuredData?.adjustmentPrice !== undefined && (
                          <div className="proposed-detail-item">
                            <span className="detail-label">Costo por Ajuste:</span>
                            <span className="detail-value text-amber-400 font-bold">
                              ${activeProposedBlock.structuredData.adjustmentPrice} MXN
                            </span>
                          </div>
                        )}

                        {/* Format / Frequency / Channels */}
                        {activeProposedBlock.structuredData?.deliveryFormat && (
                          <div className="proposed-detail-item">
                            <span className="detail-label">Formato de Entrega:</span>
                            <span className="detail-value">{activeProposedBlock.structuredData.deliveryFormat}</span>
                          </div>
                        )}
                        {activeProposedBlock.structuredData?.frequency && (
                          <div className="proposed-detail-item">
                            <span className="detail-label">Frecuencia:</span>
                            <span className="detail-value">{activeProposedBlock.structuredData.frequency}</span>
                          </div>
                        )}
                        {activeProposedBlock.structuredData?.channels && (
                          <div className="proposed-detail-item">
                            <span className="detail-label">Canales de Operación:</span>
                            <span className="detail-value">{activeProposedBlock.structuredData.channels}</span>
                          </div>
                        )}
                        {activeProposedBlock.structuredData?.ruleType && (
                          <div className="proposed-detail-item">
                            <span className="detail-label">Tipo de Directriz:</span>
                            <span className="detail-value text-purple-300 font-semibold">{activeProposedBlock.structuredData.ruleType}</span>
                          </div>
                        )}

                        {/* Includes & Addons */}
                        {activeProposedBlock.structuredData?.includes && (
                          <div className="proposed-detail-item full">
                            <span className="detail-label">Qué Incluye / Cobertura:</span>
                            <span className="detail-value">{activeProposedBlock.structuredData.includes}</span>
                          </div>
                        )}
                        {activeProposedBlock.structuredData?.additionalPackages && (
                          <div className="proposed-detail-item full">
                            <span className="detail-label">Adicionales / Complementarios:</span>
                            <span className="detail-value">{activeProposedBlock.structuredData.additionalPackages}</span>
                          </div>
                        )}
                        {activeProposedBlock.structuredData?.advisorInstructions && (
                          <div className="proposed-detail-item full">
                            <span className="detail-label">Instrucción para el Bot Asesor:</span>
                            <span className="detail-value text-amber-300 font-medium">
                              {activeProposedBlock.structuredData.advisorInstructions}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Code / Markdown representation of the block */}
                      <div className="proposed-content-preview">
                        <span className="code-preview-label">Formato que se inyectará en los Documentos Maestros:</span>
                        <pre className="proposed-pre-box">
                          <code>{activeProposedBlock.content}</code>
                        </pre>
                      </div>

                      {/* Confirm and Upload Button */}
                      <div className="proposed-actions-bar">
                        <button
                          type="button"
                          className="btn-confirm-upload-block"
                          onClick={() => handleConfirmAndUploadBlock(activeProposedBlock)}
                          disabled={saving}
                        >
                          <Check size={18} />
                          <span>{saving ? 'Subiendo a Firestore...' : 'Confirmar y Subir a Firestore'}</span>
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="btn-edit-manual-outline"
                            onClick={() => handleOpenManualEdit(activeProposedBlock)}
                          >
                            <Edit3 size={14} />
                            <span>Ajustar Manualmente</span>
                          </button>
                          <button
                            type="button"
                            className="btn-dismiss-block"
                            onClick={() => setActiveProposedBlock(null)}
                          >
                            <span>Descartar propuesta</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="proposed-empty-state">
                      <div className="empty-icon-wrap">
                        <Bot size={32} className="text-cyan-400" />
                      </div>
                      <h5>No hay ningún bloque propuesto aún</h5>
                      <p>
                        Selecciona arriba si quieres configurar un <strong>Producto</strong>, <strong>Servicio</strong> o <strong>Instrucción</strong>.
                        Escribe en el chat y el entrenador formulará preguntas para armar el bloque y mostrártelo aquí antes de subirlo a Firestore.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: PRODUCTOS (Catálogo empaquetado de software/web)           */}
          {/* ================================================================= */}
          {activeTab === 'products' && (
            <div className="admin-category-section">
              <div className="category-section-header">
                <div>
                  <div className="flex items-center gap-2">
                    <Package size={22} className="text-emerald-400" />
                    <h3 className="category-section-title">Catálogo de Productos</h3>
                    <span className="category-count-badge green">{productBlocks.length} activos</span>
                  </div>
                  <p className="category-section-desc">
                    Productos de software empaquetado y licencias de pago único (páginas web, apps para 1 PC de mostrador y formularios inteligentes).
                  </p>
                </div>
                <div className="category-header-actions">
                  <button
                    type="button"
                    className="btn-category-manual green"
                    onClick={() => handleOpenManualCreate('product')}
                    title="Crear producto manualmente llenando el formulario"
                  >
                    <Plus size={15} />
                    <span>Crear Manualmente</span>
                  </button>
                  <button
                    type="button"
                    className="btn-category-create green"
                    onClick={() => handleStartTrainingCategory('product')}
                    title="Crear con el Bot Entrenador interactivo"
                  >
                    <Sparkles size={15} />
                    <span>Crear con Bot Entrenador</span>
                  </button>
                </div>
              </div>

              {productBlocks.length > 0 ? (
                <div className="category-cards-grid">
                  {productBlocks.map((block) => (
                    <div key={block.id} className="category-card product-card">
                      <div className="category-card-header">
                        <div className="category-title-group">
                          <h4 className="category-card-title">{block.title}</h4>
                          <span className="category-tag-pill green">PRODUCTO</span>
                        </div>
                        {block.structuredData?.price !== undefined && (
                          <div className="category-price-tag green">
                            <DollarSign size={14} />
                            <span>${block.structuredData.price} MXN</span>
                          </div>
                        )}
                      </div>

                      {block.structuredData?.deliveryFormat && (
                        <div className="category-format-badge">
                          <span>🚚 Entrega: {block.structuredData.deliveryFormat}</span>
                        </div>
                      )}

                      <p className="category-card-summary">{block.summary}</p>

                      <div className="category-details-box">
                        {block.structuredData?.includes && (
                          <div className="detail-entry">
                            <strong>Qué incluye:</strong> {block.structuredData.includes}
                          </div>
                        )}
                        {block.structuredData?.additionalPackages && (
                          <div className="detail-entry">
                            <strong>Adicionales:</strong> {block.structuredData.additionalPackages}
                          </div>
                        )}
                        {block.structuredData?.advisorInstructions && (
                          <div className="detail-entry highlight-instruction">
                            <strong>Instrucción Asesor:</strong> {block.structuredData.advisorInstructions}
                          </div>
                        )}
                      </div>

                      <div className="category-card-footer">
                        <span className="card-timestamp">
                          Actualizado: {new Date(block.updatedAt).toLocaleDateString('es-MX')}
                        </span>
                        <div className="card-action-buttons">
                          <button
                            type="button"
                            className="btn-card-action manual-edit"
                            onClick={() => handleOpenManualEdit(block)}
                            title="Modificar manualmente este producto"
                          >
                            <Edit3 size={14} />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            className="btn-card-action edit"
                            onClick={() => handleRefineBlockWithTrainer(block, 'product')}
                            title="Refinar este producto con el Bot Entrenador"
                          >
                            <Sparkles size={14} />
                            <span>Refinar</span>
                          </button>
                          <button
                            type="button"
                            className="btn-card-action delete"
                            onClick={() => handleDeleteBlock(block.id, block.title)}
                            title="Eliminar de Firestore"
                          >
                            <Trash2 size={14} />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="category-empty-state">
                  <Package size={48} className="text-emerald-400 opacity-60" />
                  <h4>No hay productos registrados</h4>
                  <p>Crea tu primer producto empaquetado manualmente o con el Bot Entrenador.</p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      className="btn-category-manual green"
                      onClick={() => handleOpenManualCreate('product')}
                    >
                      <Plus size={16} />
                      <span>Crear Manualmente</span>
                    </button>
                    <button
                      type="button"
                      className="btn-category-create green"
                      onClick={() => handleStartTrainingCategory('product')}
                    >
                      <Sparkles size={16} />
                      <span>Crear con Bot Entrenador</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: SERVICIOS (Rentas, mantenimiento e infra cloud recurrente)  */}
          {/* ================================================================= */}
          {activeTab === 'services' && (
            <div className="admin-category-section">
              <div className="category-section-header">
                <div>
                  <div className="flex items-center gap-2">
                    <Wrench size={22} className="text-cyan-400" />
                    <h3 className="category-section-title">Servicios y Modalidades Recurrentes</h3>
                    <span className="category-count-badge cyan">{serviceBlocks.length} activos</span>
                  </div>
                  <p className="category-section-desc">
                    Servicios de valor continuo: rentas mensuales de bots de WhatsApp, pólizas de mantenimiento web e infraestructura de sincronización cloud.
                  </p>
                </div>
                <div className="category-header-actions">
                  <button
                    type="button"
                    className="btn-category-manual cyan"
                    onClick={() => handleOpenManualCreate('service')}
                    title="Crear servicio manualmente llenando el formulario"
                  >
                    <Plus size={15} />
                    <span>Crear Manualmente</span>
                  </button>
                  <button
                    type="button"
                    className="btn-category-create cyan"
                    onClick={() => handleStartTrainingCategory('service')}
                    title="Crear con el Bot Entrenador interactivo"
                  >
                    <Sparkles size={15} />
                    <span>Crear con Bot Entrenador</span>
                  </button>
                </div>
              </div>

              {serviceBlocks.length > 0 ? (
                <div className="category-cards-grid">
                  {serviceBlocks.map((block) => (
                    <div key={block.id} className="category-card service-card">
                      <div className="category-card-header">
                        <div className="category-title-group">
                          <h4 className="category-card-title">{block.title}</h4>
                          <span className="category-tag-pill cyan">SERVICIO</span>
                        </div>
                        {block.structuredData?.monthlyPrice !== undefined && (
                          <div className="category-price-tag cyan">
                            <DollarSign size={14} />
                            <span>${block.structuredData.monthlyPrice} MXN/mes</span>
                          </div>
                        )}
                        {block.structuredData?.adjustmentPrice !== undefined && (
                          <div className="category-price-tag amber">
                            <DollarSign size={14} />
                            <span>${block.structuredData.adjustmentPrice} MXN/ajuste</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {block.structuredData?.frequency && (
                          <div className="category-format-badge">
                            <span>🔄 {block.structuredData.frequency}</span>
                          </div>
                        )}
                        {block.structuredData?.channels && (
                          <div className="category-format-badge">
                            <span>💬 Canales: {block.structuredData.channels}</span>
                          </div>
                        )}
                      </div>

                      <p className="category-card-summary">{block.summary}</p>

                      <div className="category-details-box">
                        {block.structuredData?.includes && (
                          <div className="detail-entry">
                            <strong>Alcance / Qué incluye:</strong> {block.structuredData.includes}
                          </div>
                        )}
                        {block.structuredData?.advisorInstructions && (
                          <div className="detail-entry highlight-instruction">
                            <strong>Consigna Asesor:</strong> {block.structuredData.advisorInstructions}
                          </div>
                        )}
                      </div>

                      <div className="category-card-footer">
                        <span className="card-timestamp">
                          Actualizado: {new Date(block.updatedAt).toLocaleDateString('es-MX')}
                        </span>
                        <div className="card-action-buttons">
                          <button
                            type="button"
                            className="btn-card-action manual-edit"
                            onClick={() => handleOpenManualEdit(block)}
                            title="Modificar manualmente este servicio"
                          >
                            <Edit3 size={14} />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            className="btn-card-action edit"
                            onClick={() => handleRefineBlockWithTrainer(block, 'service')}
                            title="Refinar este servicio con el Bot Entrenador"
                          >
                            <Sparkles size={14} />
                            <span>Refinar</span>
                          </button>
                          <button
                            type="button"
                            className="btn-card-action delete"
                            onClick={() => handleDeleteBlock(block.id, block.title)}
                            title="Eliminar de Firestore"
                          >
                            <Trash2 size={14} />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="category-empty-state">
                  <Wrench size={48} className="text-cyan-400 opacity-60" />
                  <h4>No hay servicios registrados</h4>
                  <p>Configura rentas mensuales o pólizas de mantenimiento manualmente o con el Bot Entrenador.</p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      className="btn-category-manual cyan"
                      onClick={() => handleOpenManualCreate('service')}
                    >
                      <Plus size={16} />
                      <span>Crear Manualmente</span>
                    </button>
                    <button
                      type="button"
                      className="btn-category-create cyan"
                      onClick={() => handleStartTrainingCategory('service')}
                    >
                      <Sparkles size={16} />
                      <span>Crear con Bot Entrenador</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 4: INSTRUCCIONES AL BOT (Reglas, tono, redirección y cotizar)  */}
          {/* ================================================================= */}
          {activeTab === 'instructions' && (
            <div className="admin-category-section">
              <div className="category-section-header">
                <div>
                  <div className="flex items-center gap-2">
                    <Brain size={22} className="text-purple-400" />
                    <h3 className="category-section-title">Instrucciones al Bot Asesor</h3>
                    <span className="category-count-badge purple">{instructionBlocks.length} directrices activas</span>
                  </div>
                  <p className="category-section-desc">
                    Reglas de comportamiento y consignas obligatorias: cero tecnicismos, tono de vendedor empático, redirección a Gemini y cotizaciones autónomas.
                  </p>
                </div>
                <div className="category-header-actions">
                  <button
                    type="button"
                    className="btn-category-manual purple"
                    onClick={() => handleOpenManualCreate('instruction')}
                    title="Crear instrucción manualmente llenando el formulario"
                  >
                    <Plus size={15} />
                    <span>Crear Manualmente</span>
                  </button>
                  <button
                    type="button"
                    className="btn-category-create purple"
                    onClick={() => handleStartTrainingCategory('instruction')}
                    title="Crear con el Bot Entrenador interactivo"
                  >
                    <Sparkles size={15} />
                    <span>Crear con Bot Entrenador</span>
                  </button>
                </div>
              </div>

              {instructionBlocks.length > 0 ? (
                <div className="category-cards-grid">
                  {instructionBlocks.map((block) => (
                    <div key={block.id} className="category-card instruction-card">
                      <div className="category-card-header">
                        <div className="category-title-group">
                          <h4 className="category-card-title">{block.title}</h4>
                          <span className="category-tag-pill purple">INSTRUCCIÓN OBLIGATORIA</span>
                        </div>
                        {block.structuredData?.ruleType && (
                          <div className="category-rule-badge">
                            <span>🎯 {block.structuredData.ruleType}</span>
                          </div>
                        )}
                      </div>

                      <p className="category-card-summary">{block.summary}</p>

                      <div className="category-details-box instruction-box">
                        <div className="detail-entry">
                          <strong>Directriz oficial inyectada en el prompt maestro:</strong>
                          <pre className="instruction-pre-code">
                            <code>{block.content}</code>
                          </pre>
                        </div>
                        {block.structuredData?.advisorInstructions && (
                          <div className="detail-entry highlight-instruction">
                            <strong>Objetivo en ventas:</strong> {block.structuredData.advisorInstructions}
                          </div>
                        )}
                      </div>

                      <div className="category-card-footer">
                        <span className="card-timestamp">
                          Actualizado: {new Date(block.updatedAt).toLocaleDateString('es-MX')}
                        </span>
                        <div className="card-action-buttons">
                          <button
                            type="button"
                            className="btn-card-action manual-edit"
                            onClick={() => handleOpenManualEdit(block)}
                            title="Modificar manualmente esta instrucción"
                          >
                            <Edit3 size={14} />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            className="btn-card-action edit"
                            onClick={() => handleRefineBlockWithTrainer(block, 'instruction')}
                            title="Refinar esta instrucción con el Bot Entrenador"
                          >
                            <Sparkles size={14} />
                            <span>Refinar</span>
                          </button>
                          <button
                            type="button"
                            className="btn-card-action delete"
                            onClick={() => handleDeleteBlock(block.id, block.title)}
                            title="Eliminar de Firestore"
                          >
                            <Trash2 size={14} />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="category-empty-state">
                  <Brain size={48} className="text-purple-400 opacity-60" />
                  <h4>No hay instrucciones registradas</h4>
                  <p>Agrega reglas de tono o comportamiento manualmente o con el Bot Entrenador.</p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      className="btn-category-manual purple"
                      onClick={() => handleOpenManualCreate('instruction')}
                    >
                      <Plus size={16} />
                      <span>Crear Manualmente</span>
                    </button>
                    <button
                      type="button"
                      className="btn-category-create purple"
                      onClick={() => handleStartTrainingCategory('instruction')}
                    >
                      <Sparkles size={16} />
                      <span>Crear con Bot Entrenador</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 5: BASE PRICING & QUOTAS CONTROLS                             */}
          {/* ================================================================= */}
          {activeTab === 'pricing' && (
            <div className="admin-pricing-section">
              <div className="section-title-box">
                <Sliders size={22} className="text-cyan-400" />
                <div>
                  <h3 className="section-title">Tarifas y Cuotas Base</h3>
                  <p className="section-desc">
                    Valores numéricos base para el motor de cotizaciones automáticas del Super-Bot.
                  </p>
                </div>
              </div>

              <div className="pricing-grid-cards">
                <div className="pricing-config-card">
                  <h4>Página Web Sencilla</h4>
                  <div className="card-input-row">
                    <label>Precio Base (MXN):</label>
                    <input
                      type="number"
                      value={config.pricing.webBasic}
                      onChange={(e) => setConfig({
                        ...config,
                        pricing: { ...config.pricing, webBasic: Number(e.target.value) }
                      })}
                      className="pricing-num-input"
                    />
                  </div>
                  <div className="card-input-row">
                    <label>Costo por ajuste / cambio (MXN):</label>
                    <input
                      type="number"
                      value={config.pricing.webAdjustment}
                      onChange={(e) => setConfig({
                        ...config,
                        pricing: { ...config.pricing, webAdjustment: Number(e.target.value) }
                      })}
                      className="pricing-num-input"
                    />
                  </div>
                </div>

                <div className="pricing-config-card">
                  <h4>Aplicación Web Operativa (POS)</h4>
                  <div className="card-input-row">
                    <label>Precio Local 1 PC (MXN):</label>
                    <input
                      type="number"
                      value={config.pricing.appStatic}
                      onChange={(e) => setConfig({
                        ...config,
                        pricing: { ...config.pricing, appStatic: Number(e.target.value) }
                      })}
                      className="pricing-num-input"
                    />
                  </div>
                  <div className="card-input-row">
                    <label>Nube mensual (MXN/mes):</label>
                    <input
                      type="number"
                      value={config.pricing.appCloudMonthly}
                      onChange={(e) => setConfig({
                        ...config,
                        pricing: { ...config.pricing, appCloudMonthly: Number(e.target.value) }
                      })}
                      className="pricing-num-input"
                    />
                  </div>
                </div>

                <div className="pricing-config-card">
                  <h4>Bots de Atención</h4>
                  <div className="card-input-row">
                    <label>Renta mensual (MXN/mes):</label>
                    <input
                      type="number"
                      value={config.pricing.botMonthly}
                      onChange={(e) => setConfig({
                        ...config,
                        pricing: { ...config.pricing, botMonthly: Number(e.target.value) }
                      })}
                      className="pricing-num-input"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  className="btn-confirm-upload-block"
                  onClick={async () => {
                    setSaving(true);
                    const res = await saveBotKnowledgeToFirestore(config, adminEmail);
                    setSaving(false);
                    if (res.success) {
                      setSaveStatus({ type: 'success', message: 'Tarifas guardadas en Firestore.' });
                      setTimeout(() => setSaveStatus(null), 4000);
                    }
                  }}
                  disabled={saving}
                >
                  <RefreshCw size={16} />
                  <span>{saving ? 'Guardando...' : 'Guardar Tarifas en Firestore'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 6: RAW MASTER FIRESTORE DOCUMENT                               */}
          {/* ================================================================= */}
          {activeTab === 'raw' && (
            <div className="admin-raw-section">
              <div className="section-title-box">
                <FileText size={22} className="text-cyan-400" />
                <div>
                  <h3 className="section-title">Documento Maestro en Firestore</h3>
                  <p className="section-desc">
                    Estructura JSON completa sincronizada en tiempo real con <code>bot_knowledge/active_config</code>.
                  </p>
                </div>
              </div>

              <pre className="raw-json-viewer">
                <code>{JSON.stringify(config, null, 2)}</code>
              </pre>
            </div>
          )}
        </main>
      </div>

      {/* ===================================================================== */}
      {/* MANUAL OBJECT EDIT / CREATE MODAL (25% Details Left | 75% Prompt Right) */}
      {/* ===================================================================== */}
      {editingBlock && (
        <div className="manual-edit-modal-backdrop" onClick={() => setEditingBlock(null)}>
          <div
            className="manual-edit-modal split-view"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className={`modal-cat-icon-wrap ${editingBlock.category}`}>
                  {editingBlock.category === 'product' ? (
                    <Package size={22} className="text-emerald-400" />
                  ) : editingBlock.category === 'service' ? (
                    <Wrench size={22} className="text-cyan-400" />
                  ) : (
                    <Brain size={22} className="text-purple-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="modal-title">
                      {isNewManualBlock ? 'Crear Nuevo Objeto' : 'Modificar Objeto'}
                    </h3>
                    <span className={`modal-header-cat-pill ${editingBlock.category}`}>
                      {editingBlock.category.toUpperCase()}
                    </span>
                  </div>
                  <p className="modal-subtitle">
                    Configura los detalles en el panel izquierdo (25%) y edita o previsualiza el prompt con Markdown a la derecha (75%).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Status Toggle */}
                <button
                  type="button"
                  className={`btn-status-toggle ${editingBlock.status === 'active' ? 'active' : 'archived'}`}
                  onClick={() => setEditingBlock({
                    ...editingBlock,
                    status: editingBlock.status === 'active' ? 'archived' : 'active'
                  })}
                  title="Cambiar estado del objeto para el asesor"
                >
                  <span className="status-indicator-dot"></span>
                  <span>{editingBlock.status === 'active' ? 'Activo en Asesor' : 'Archivado'}</span>
                </button>

                <button
                  type="button"
                  className="btn-modal-close"
                  onClick={() => setEditingBlock(null)}
                  title="Cerrar ventana"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body: Split Layout (25% Left | 75% Right) */}
            <div className="modal-body-split">
              {/* ----------------------------------------------------------- */}
              {/* LEFT PANEL (~25% width): Structured Details                 */}
              {/* ----------------------------------------------------------- */}
              <aside className="modal-left-details-panel">
                <div className="left-panel-header">
                  <span className="panel-section-title">📋 Detalles del Objeto (25%)</span>
                  <span className="text-xs text-muted">Datos para el sistema</span>
                </div>

                {/* Category Switcher Pills */}
                <div className="left-field-group">
                  <label className="field-label-compact">Categoría:</label>
                  <div className="category-switch-pills-compact">
                    <button
                      type="button"
                      className={`switch-pill-compact ${editingBlock.category === 'product' ? 'active green' : ''}`}
                      onClick={() => {
                        const updated: BotKnowledgeBlock = {
                          ...editingBlock,
                          category: 'product',
                          structuredData: {
                            ...editingBlock.structuredData,
                            price: editingBlock.structuredData?.price || 300,
                            deliveryFormat: editingBlock.structuredData?.deliveryFormat || 'Despliegue web inmediato'
                          }
                        };
                        updated.content = generateContentFromBlock(updated);
                        setEditingBlock(updated);
                      }}
                    >
                      <Package size={12} />
                      <span>Producto</span>
                    </button>
                    <button
                      type="button"
                      className={`switch-pill-compact ${editingBlock.category === 'service' ? 'active cyan' : ''}`}
                      onClick={() => {
                        const updated: BotKnowledgeBlock = {
                          ...editingBlock,
                          category: 'service',
                          structuredData: {
                            ...editingBlock.structuredData,
                            monthlyPrice: editingBlock.structuredData?.monthlyPrice || 1000,
                            frequency: editingBlock.structuredData?.frequency || 'Mensual recurrente',
                            channels: editingBlock.structuredData?.channels || 'WhatsApp Cloud API, Web'
                          }
                        };
                        updated.content = generateContentFromBlock(updated);
                        setEditingBlock(updated);
                      }}
                    >
                      <Wrench size={12} />
                      <span>Servicio</span>
                    </button>
                    <button
                      type="button"
                      className={`switch-pill-compact ${editingBlock.category === 'instruction' ? 'active purple' : ''}`}
                      onClick={() => {
                        const updated: BotKnowledgeBlock = {
                          ...editingBlock,
                          category: 'instruction',
                          structuredData: {
                            ...editingBlock.structuredData,
                            ruleType: editingBlock.structuredData?.ruleType || 'Tono y Lenguaje'
                          }
                        };
                        updated.content = generateContentFromBlock(updated);
                        setEditingBlock(updated);
                      }}
                    >
                      <Brain size={12} />
                      <span>Instrucción</span>
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div className="left-field-group">
                  <label className="field-label-compact">Nombre del Objeto:</label>
                  <input
                    type="text"
                    value={editingBlock.title}
                    onChange={(e) => setEditingBlock({ ...editingBlock, title: e.target.value })}
                    placeholder="Ej. Página Web Sencilla ($300 MXN)"
                    className="field-input-compact font-bold"
                  />
                </div>

                {/* Short Summary */}
                <div className="left-field-group">
                  <label className="field-label-compact">Resumen corto (tarjeta):</label>
                  <textarea
                    rows={2}
                    value={editingBlock.summary}
                    onChange={(e) => setEditingBlock({ ...editingBlock, summary: e.target.value })}
                    placeholder="Descripción resumida para el catálogo"
                    className="field-textarea-compact"
                  />
                </div>

                {/* Specifics for PRODUCT */}
                {editingBlock.category === 'product' && (
                  <div className="category-compact-box green">
                    <div className="left-field-group">
                      <label className="field-label-compact">Precio Único ($ MXN):</label>
                      <input
                        type="number"
                        value={editingBlock.structuredData?.price ?? 300}
                        onChange={(e) => setEditingBlock({
                          ...editingBlock,
                          structuredData: {
                            ...editingBlock.structuredData,
                            price: Number(e.target.value)
                          }
                        })}
                        className="field-input-compact text-emerald-400 font-bold"
                      />
                    </div>

                    <div className="left-field-group">
                      <label className="field-label-compact">Formato de Entrega:</label>
                      <input
                        type="text"
                        value={editingBlock.structuredData?.deliveryFormat || ''}
                        onChange={(e) => setEditingBlock({
                          ...editingBlock,
                          structuredData: {
                            ...editingBlock.structuredData,
                            deliveryFormat: e.target.value
                          }
                        })}
                        placeholder="Ej. Despliegue web inmediato"
                        className="field-input-compact"
                      />
                    </div>

                    <div className="left-field-group">
                      <label className="field-label-compact">Qué Incluye:</label>
                      <textarea
                        rows={2}
                        value={editingBlock.structuredData?.includes || ''}
                        onChange={(e) => setEditingBlock({
                          ...editingBlock,
                          structuredData: {
                            ...editingBlock.structuredData,
                            includes: e.target.value
                          }
                        })}
                        placeholder="1 sección responsiva, SSL, botón WhatsApp"
                        className="field-textarea-compact"
                      />
                    </div>

                    <div className="left-field-group">
                      <label className="field-label-compact">Paquetes Adicionales:</label>
                      <input
                        type="text"
                        value={editingBlock.structuredData?.additionalPackages || ''}
                        onChange={(e) => setEditingBlock({
                          ...editingBlock,
                          structuredData: {
                            ...editingBlock.structuredData,
                            additionalPackages: e.target.value
                          }
                        })}
                        placeholder="Ajustes por $100 MXN c/u"
                        className="field-input-compact"
                      />
                    </div>

                    <div className="left-field-group">
                      <label className="field-label-compact">Instrucción Asesor:</label>
                      <input
                        type="text"
                        value={editingBlock.structuredData?.advisorInstructions || ''}
                        onChange={(e) => setEditingBlock({
                          ...editingBlock,
                          structuredData: {
                            ...editingBlock.structuredData,
                            advisorInstructions: e.target.value
                          }
                        })}
                        placeholder="Presentar como solución accesible de entrada"
                        className="field-input-compact text-amber-300"
                      />
                    </div>
                  </div>
                )}

                {/* Specifics for SERVICE */}
                {editingBlock.category === 'service' && (
                  <div className="category-compact-box cyan">
                    <div className="left-field-group">
                      <label className="field-label-compact">Renta Mensual ($ MXN/mes):</label>
                      <input
                        type="number"
                        value={editingBlock.structuredData?.monthlyPrice ?? ''}
                        onChange={(e) => setEditingBlock({
                          ...editingBlock,
                          structuredData: {
                            ...editingBlock.structuredData,
                            monthlyPrice: e.target.value ? Number(e.target.value) : undefined
                          }
                        })}
                        placeholder="Ej. 1000"
                        className="field-input-compact text-cyan-400 font-bold"
                      />
                    </div>

                    <div className="left-field-group">
                      <label className="field-label-compact">O Costo por Ajuste ($ MXN):</label>
                      <input
                        type="number"
                        value={editingBlock.structuredData?.adjustmentPrice ?? ''}
                        onChange={(e) => setEditingBlock({
                          ...editingBlock,
                          structuredData: {
                            ...editingBlock.structuredData,
                            adjustmentPrice: e.target.value ? Number(e.target.value) : undefined
                          }
                        })}
                        placeholder="Ej. 100"
                        className="field-input-compact text-amber-400 font-bold"
                      />
                    </div>

                    <div className="left-field-group">
                      <label className="field-label-compact">Frecuencia:</label>
                      <input
                        type="text"
                        value={editingBlock.structuredData?.frequency || ''}
                        onChange={(e) => setEditingBlock({
                          ...editingBlock,
                          structuredData: {
                            ...editingBlock.structuredData,
                            frequency: e.target.value
                          }
                        })}
                        placeholder="Ej. Mensual recurrente"
                        className="field-input-compact"
                      />
                    </div>

                    <div className="left-field-group">
                      <label className="field-label-compact">Canales de Operación:</label>
                      <input
                        type="text"
                        value={editingBlock.structuredData?.channels || ''}
                        onChange={(e) => setEditingBlock({
                          ...editingBlock,
                          structuredData: {
                            ...editingBlock.structuredData,
                            channels: e.target.value
                          }
                        })}
                        placeholder="WhatsApp Cloud API, Telegram, Web"
                        className="field-input-compact"
                      />
                    </div>

                    <div className="left-field-group">
                      <label className="field-label-compact">Alcance / Cobertura:</label>
                      <textarea
                        rows={2}
                        value={editingBlock.structuredData?.includes || ''}
                        onChange={(e) => setEditingBlock({
                          ...editingBlock,
                          structuredData: {
                            ...editingBlock.structuredData,
                            includes: e.target.value
                          }
                        })}
                        placeholder="Atención 24/7, hasta 1,500 mensajes diarios gratis"
                        className="field-textarea-compact"
                      />
                    </div>

                    <div className="left-field-group">
                      <label className="field-label-compact">Consigna Comercial Asesor:</label>
                      <input
                        type="text"
                        value={editingBlock.structuredData?.advisorInstructions || ''}
                        onChange={(e) => setEditingBlock({
                          ...editingBlock,
                          structuredData: {
                            ...editingBlock.structuredData,
                            advisorInstructions: e.target.value
                          }
                        })}
                        placeholder="Ofrecer a clientes que quieren no perder ventas"
                        className="field-input-compact text-cyan-300"
                      />
                    </div>
                  </div>
                )}

                {/* Specifics for INSTRUCTION */}
                {editingBlock.category === 'instruction' && (
                  <div className="category-compact-box purple">
                    <div className="left-field-group">
                      <label className="field-label-compact">Tipo de Directriz:</label>
                      <input
                        type="text"
                        value={editingBlock.structuredData?.ruleType || ''}
                        onChange={(e) => setEditingBlock({
                          ...editingBlock,
                          structuredData: {
                            ...editingBlock.structuredData,
                            ruleType: e.target.value
                          }
                        })}
                        placeholder="Ej. Tono y Lenguaje, Actitud Comercial"
                        className="field-input-compact text-purple-300 font-semibold"
                      />
                    </div>

                    <div className="left-field-group">
                      <label className="field-label-compact">Objetivo en Ventas:</label>
                      <textarea
                        rows={3}
                        value={editingBlock.structuredData?.advisorInstructions || ''}
                        onChange={(e) => setEditingBlock({
                          ...editingBlock,
                          structuredData: {
                            ...editingBlock.structuredData,
                            advisorInstructions: e.target.value
                          }
                        })}
                        placeholder="Objetivo concreto que debe lograr el bot con esta directriz"
                        className="field-textarea-compact"
                      />
                    </div>
                  </div>
                )}

                {/* Quick Auto-compile prompt button */}
                <div className="mt-auto pt-2">
                  <button
                    type="button"
                    className="btn-sync-to-prompt"
                    onClick={() => {
                      const generated = generateContentFromBlock(editingBlock);
                      setEditingBlock({ ...editingBlock, content: generated });
                    }}
                    title="Compilar y pasar estos detalles al prompt maestro de la derecha"
                  >
                    <RotateCcw size={13} />
                    <span>⚡ Sincronizar Detalles ➔ Prompt</span>
                  </button>
                </div>
              </aside>

              {/* ----------------------------------------------------------- */}
              {/* RIGHT PANEL (~75% width): Main Master Prompt & Markdown     */}
              {/* ----------------------------------------------------------- */}
              <section className="modal-right-prompt-panel">
                {/* Prompt Top Header */}
                <div className="prompt-panel-topbar">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText size={18} className="text-cyan-400" />
                      <h4 className="prompt-panel-title">
                        Prompt Maestro Oficial para el Bot Asesor (75% del ancho)
                      </h4>
                    </div>
                    <p className="prompt-panel-desc">
                      Este es el texto exacto que el Bot Asesor comercial consulta en tiempo real en Firestore para cotizar y orientar al cliente.
                    </p>
                  </div>

                  {/* Mode Switcher: Edit Mode vs Formatted Preview Mode */}
                  <div className="prompt-mode-tabs">
                    <button
                      type="button"
                      className={`prompt-mode-tab ${promptViewMode === 'edit' ? 'active' : ''}`}
                      onClick={() => setPromptViewMode('edit')}
                    >
                      <Edit3 size={14} />
                      <span>Modo Edición (Markdown)</span>
                    </button>
                    <button
                      type="button"
                      className={`prompt-mode-tab ${promptViewMode === 'preview' ? 'active' : ''}`}
                      onClick={() => setPromptViewMode('preview')}
                    >
                      <Eye size={14} />
                      <span>Vista Previa Formateada</span>
                    </button>
                  </div>
                </div>

                {/* Markdown Quick Formatting Toolbar (Available in Edit Mode) */}
                {promptViewMode === 'edit' && (
                  <div className="markdown-toolbar">
                    <span className="toolbar-label">Herramientas Markdown:</span>
                    <button
                      type="button"
                      className="btn-toolbar-tool"
                      onClick={() => handleInsertMarkdownTag('**', '**')}
                      title="Texto en negrita (**texto**)"
                    >
                      <Bold size={13} />
                      <span>Negrita</span>
                    </button>
                    <button
                      type="button"
                      className="btn-toolbar-tool"
                      onClick={() => handleInsertMarkdownTag('*', '*')}
                      title="Texto en cursiva (*texto*)"
                    >
                      <Italic size={13} />
                      <span>Cursiva</span>
                    </button>
                    <button
                      type="button"
                      className="btn-toolbar-tool"
                      onClick={() => handleInsertMarkdownTag('## ')}
                      title="Encabezado H2 (## Título)"
                    >
                      <Heading2 size={13} />
                      <span>Título H2</span>
                    </button>
                    <button
                      type="button"
                      className="btn-toolbar-tool"
                      onClick={() => handleInsertMarkdownTag('### ')}
                      title="Subtítulo H3 (### Subtítulo)"
                    >
                      <span>H3</span>
                    </button>
                    <button
                      type="button"
                      className="btn-toolbar-tool"
                      onClick={() => handleInsertMarkdownTag('- ')}
                      title="Punto de lista (- Elemento)"
                    >
                      <List size={13} />
                      <span>Lista</span>
                    </button>
                    <button
                      type="button"
                      className="btn-toolbar-tool"
                      onClick={() => handleInsertMarkdownTag('- **Directriz oficial:** ')}
                      title="Directriz clave"
                    >
                      <span>✓ Directriz</span>
                    </button>
                    <button
                      type="button"
                      className="btn-toolbar-tool"
                      onClick={() => handleInsertMarkdownTag('- **Costo:** $', ' MXN')}
                      title="Precio en pesos"
                    >
                      <span>💲 Precio</span>
                    </button>
                    <button
                      type="button"
                      className="btn-toolbar-tool"
                      onClick={() => handleInsertMarkdownTag('`', '`')}
                      title="Insignia de código (`etiqueta`)"
                    >
                      <Code size={13} />
                      <span>Insignia</span>
                    </button>
                  </div>
                )}

                {/* Prompt Main Workspace */}
                <div className="prompt-editor-workspace">
                  {promptViewMode === 'edit' ? (
                    <textarea
                      id="modal-prompt-textarea"
                      rows={16}
                      value={editingBlock.content}
                      onChange={(e) => setEditingBlock({ ...editingBlock, content: e.target.value })}
                      placeholder="Escribe el bloque en formato Markdown enriquecido con títulos, viñetas y consignas para el asesor..."
                      className="prompt-full-textarea"
                    />
                  ) : (
                    <div className="prompt-preview-scrollbox">
                      {editingBlock.content ? (
                        renderMarkdownPreview(editingBlock.content, editingBlock.category)
                      ) : (
                        <div className="prompt-empty-preview">
                          <p>El prompt está vacío actualmente. Escribe en el editor o pulsa "⚡ Sincronizar Detalles" en el panel izquierdo.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Prompt Status / Metrics Footer */}
                <div className="prompt-panel-footer">
                  <div className="prompt-metrics-row">
                    <span className="metric-pill">
                      <strong>Caracteres:</strong> {(editingBlock.content || '').length}
                    </span>
                    <span className="metric-pill">
                      <strong>Palabras:</strong> {(editingBlock.content || '').trim().split(/\s+/).filter(Boolean).length}
                    </span>
                    <span className="metric-pill">
                      <strong>Líneas:</strong> {(editingBlock.content || '').split('\n').length}
                    </span>
                  </div>
                  <span className="prompt-sync-notice">
                    🟢 Este bloque se inyectará en tiempo real en los documentos maestros de Firestore.
                  </span>
                </div>
              </section>
            </div>

            {/* Modal Bottom Actions Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setEditingBlock(null)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-modal-save"
                onClick={handleSaveManualBlock}
                disabled={saving || !editingBlock.title.trim()}
              >
                <Save size={16} />
                <span>{saving ? 'Guardando en Firestore...' : 'Guardar y Sincronizar en Firestore'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
