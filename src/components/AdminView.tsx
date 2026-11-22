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
  PlusCircle,
  RefreshCw,
  Tag,
  Check,
  DollarSign
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
}

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  onLogout,
  onViewPublicSite,
  onOpenChat
}) => {
  const [config, setConfig] = useState<BotKnowledgeConfig>(DEFAULT_BOT_KNOWLEDGE);
  const [activeTab, setActiveTab] = useState<'trainer' | 'products' | 'services' | 'instructions' | 'pricing' | 'raw'>('trainer');
  const [trainerFocus, setTrainerFocus] = useState<'product' | 'service' | 'instruction'>('product');

  // Interactive Trainer Chat
  const [chatMessages, setChatMessages] = useState<TrainerChatMessage[]>([
    {
      id: 'init-msg',
      sender: 'trainer',
      text: '¡Hola! Soy tu **Bot Entrenador**.\n\nPuedo ayudarte a crear y configurar tres tipos de objetos maestros para el Bot Asesor:\n1. 📦 **Productos**: Software empaquetado y licencias de pago único.\n2. 🛠️ **Servicios**: Rentas mensuales de bots, pólizas de mantenimiento e infraestructura cloud.\n3. 🧠 **Instrucciones al Bot**: Reglas de lenguaje, consignas de venta, redirecciones y cotizaciones.\n\nElige el tipo de objeto arriba o hazme una indicación y te haré preguntas interactivas para armar el bloque maestro y sincronizarlo con Firestore.',
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
        message: `¡"${blockToUpload.title}" confirmado y sincronizado con Firestore en la pestaña de ${categoryLabel}!`
      });

      // Add confirmation message to chat
      setChatMessages(prev => [
        ...prev,
        {
          id: `confirmed-${Date.now()}`,
          sender: 'trainer',
          text: `🎉 **¡Bloque confirmado y subido con éxito a Firestore!**\n\nEl objeto **"${blockToUpload.title}"** ya forma parte de los documentos maestros en la pestaña de **${categoryLabel}**. El Bot Asesor comercial ya lo tiene incorporado en sus respuestas y cotizaciones en vivo.`,
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
      {/* Top Banner / Navigation */}
      <header className="admin-header-bar">
        <div className="admin-header-brand">
          <div className="admin-badge-icon">
            <ShieldCheck size={22} className="text-emerald-400" />
          </div>
          <div>
            <div className="admin-title-row">
              <h2 className="admin-title">Panel de Control: Bot Entrenador</h2>
              <span className="admin-role-pill">Administrador</span>
            </div>
            <p className="admin-subtitle">
              Configura Productos, Servicios e Instrucciones al Bot con entrenamiento interactivo y sincronización en Firestore
            </p>
          </div>
        </div>

        <div className="admin-header-controls">
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
                            <button
                              type="button"
                              className="btn-inspect-block-inline"
                              onClick={() => setActiveProposedBlock(msg.proposedBlock!)}
                            >
                              <span>Ver Bloque Completo a la Derecha</span>
                              <ArrowRight size={13} />
                            </button>
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
                        <button
                          type="button"
                          className="btn-dismiss-block"
                          onClick={() => setActiveProposedBlock(null)}
                        >
                          <span>Descartar propuesta</span>
                        </button>
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
                <button
                  type="button"
                  className="btn-category-create green"
                  onClick={() => handleStartTrainingCategory('product')}
                >
                  <PlusCircle size={16} />
                  <span>Crear Producto con el Bot Entrenador</span>
                </button>
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
                            className="btn-card-action edit"
                            onClick={() => handleRefineBlockWithTrainer(block, 'product')}
                            title="Refinar este producto con el Bot Entrenador"
                          >
                            <Sparkles size={14} />
                            <span>Refinar con Bot</span>
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
                  <p>Crea tu primer producto empaquetado interactuando con el Bot Entrenador.</p>
                  <button
                    type="button"
                    className="btn-category-create green"
                    onClick={() => handleStartTrainingCategory('product')}
                  >
                    <PlusCircle size={16} />
                    <span>Crear Producto con el Bot Entrenador</span>
                  </button>
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
                <button
                  type="button"
                  className="btn-category-create cyan"
                  onClick={() => handleStartTrainingCategory('service')}
                >
                  <PlusCircle size={16} />
                  <span>Crear Servicio con el Bot Entrenador</span>
                </button>
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
                            className="btn-card-action edit"
                            onClick={() => handleRefineBlockWithTrainer(block, 'service')}
                            title="Refinar este servicio con el Bot Entrenador"
                          >
                            <Sparkles size={14} />
                            <span>Refinar con Bot</span>
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
                  <p>Configura rentas mensuales o pólizas de mantenimiento con el Bot Entrenador.</p>
                  <button
                    type="button"
                    className="btn-category-create cyan"
                    onClick={() => handleStartTrainingCategory('service')}
                  >
                    <PlusCircle size={16} />
                    <span>Crear Servicio con el Bot Entrenador</span>
                  </button>
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
                <button
                  type="button"
                  className="btn-category-create purple"
                  onClick={() => handleStartTrainingCategory('instruction')}
                >
                  <PlusCircle size={16} />
                  <span>Crear Instrucción con el Bot Entrenador</span>
                </button>
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
                            className="btn-card-action edit"
                            onClick={() => handleRefineBlockWithTrainer(block, 'instruction')}
                            title="Refinar esta instrucción con el Bot Entrenador"
                          >
                            <Sparkles size={14} />
                            <span>Refinar con Bot</span>
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
                  <p>Agrega reglas de tono o comportamiento con el Bot Entrenador.</p>
                  <button
                    type="button"
                    className="btn-category-create purple"
                    onClick={() => handleStartTrainingCategory('instruction')}
                  >
                    <PlusCircle size={16} />
                    <span>Crear Instrucción con el Bot Entrenador</span>
                  </button>
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
    </div>
  );
};
