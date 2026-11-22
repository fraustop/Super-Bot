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
  Boxes,
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
  interactWithTrainerBot
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
  const [activeTab, setActiveTab] = useState<'trainer' | 'objects' | 'pricing' | 'raw'>('trainer');
  const [objectCategoryFilter, setObjectCategoryFilter] = useState<'all' | 'package' | 'pricing' | 'promotion' | 'rule'>('all');

  // Interactive Trainer Chat
  const [chatMessages, setChatMessages] = useState<TrainerChatMessage[]>([
    {
      id: 'init-msg',
      sender: 'trainer',
      text: '¡Hola! Soy tu **Bot Entrenador**. Mi consigna es ayudarte a definir y complementar cambios para el Bot Asesor mediante preguntas interactivas.\n\nPor ejemplo, si me dices: *"cambia el precio a 300 pesos"*, te preguntaré qué incluye el paquete, si puede ofrecer paquetes adicionales, etc., para armar el bloque maestro y subirlo a Firestore.',
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

  // Send message to Trainer Bot
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || userInput).trim();
    if (!textToSend || trainerLoading) return;

    setUserInput('');
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
      const result = await interactWithTrainerBot(textToSend, newHistory, config, adminEmail);

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
      setSaveStatus({
        type: 'success',
        message: `¡Bloque "${blockToUpload.title}" confirmado y subido con éxito al documento maestro de Firestore!`
      });

      // Add confirmation message to chat
      setChatMessages(prev => [
        ...prev,
        {
          id: `confirmed-${Date.now()}`,
          sender: 'trainer',
          text: `🎉 **¡Bloque confirmado y subido con éxito a Firestore!**\n\nEl objeto **"${blockToUpload.title}"** ya forma parte de los documentos maestros. El Bot Asesor comercial ya lo tiene incorporado en sus respuestas y cotizaciones en vivo.`,
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
    if (!window.confirm(`¿Estás seguro de eliminar el objeto "${blockTitle}" de los documentos maestros de Firestore?`)) {
      return;
    }

    setSaving(true);
    const res = await deleteKnowledgeBlock(blockId, adminEmail);
    setSaving(false);

    if (res.success) {
      setSaveStatus({
        type: 'success',
        message: `Objeto "${blockTitle}" eliminado de Firestore.`
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
  const handleRefineBlockWithTrainer = (block: BotKnowledgeBlock) => {
    setActiveTab('trainer');
    setActiveProposedBlock(block);
    const text = `Quiero modificar el objeto "${block.title}". Precio actual: $${block.structuredData?.price || 0} MXN. ¿Qué cambios podemos hacerle?`;
    handleSendMessage(text);
  };

  // Filtered blocks list
  const filteredBlocks = (config.knowledgeBlocks || []).filter(b => {
    if (objectCategoryFilter === 'all') return true;
    return b.category === objectCategoryFilter;
  });

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
              Entrenamiento interactivo con preguntas, objetos maestros y sincronización en vivo con Firestore
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
              <button
                type="button"
                className={`admin-nav-tab-btn ${activeTab === 'trainer' ? 'active' : ''}`}
                onClick={() => setActiveTab('trainer')}
              >
                <Sparkles size={17} />
                <div className="nav-tab-label-group">
                  <span>Bot Entrenador</span>
                  <span className="nav-tab-badge-sub">Preguntas & Bloques</span>
                </div>
              </button>

              <button
                type="button"
                className={`admin-nav-tab-btn ${activeTab === 'objects' ? 'active' : ''}`}
                onClick={() => setActiveTab('objects')}
              >
                <Boxes size={17} />
                <div className="nav-tab-label-group">
                  <span>Objetos Creados</span>
                  <span className="nav-tab-badge-count">{config.knowledgeBlocks?.length || 0}</span>
                </div>
              </button>

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

          <div className="admin-firestore-status-card">
            <div className="firestore-status-header">
              <span className="status-dot-live"></span>
              <span className="status-label">Firestore: <code>bot_knowledge</code></span>
            </div>
            <p className="firestore-meta-text">
              <strong>Objetos en Documento Maestro:</strong><br />
              <span className="text-emerald-400 font-semibold">{config.knowledgeBlocks?.length || 0} objetos activos</span>
            </p>
            <p className="firestore-meta-text">
              <strong>Última sincronización:</strong><br />
              {config.lastUpdated ? new Date(config.lastUpdated).toLocaleString('es-MX') : 'Sesión activa'}
            </p>
            <p className="firestore-meta-text">
              <strong>Precio Web actual:</strong> ${config.pricing.webBasic} MXN
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
          {/* TAB 1: INTERACTIVE TRAINER BOT (Questions, Interview & Blocks)     */}
          {/* ================================================================= */}
          {activeTab === 'trainer' && (
            <div className="admin-trainer-layout">
              {/* Left Column: Chat Conversation with Coach */}
              <div className="trainer-chat-column">
                <div className="trainer-chat-header">
                  <div className="trainer-avatar-box">
                    <Sparkles size={20} className="text-amber-400" />
                  </div>
                  <div>
                    <h3 className="trainer-chat-title">Bot Entrenador Interactivo</h3>
                    <p className="trainer-chat-desc">
                      Hazle una petición y te formulará preguntas para complementar el perfil del cambio antes de agregarlo a Firestore.
                    </p>
                  </div>
                </div>

                {/* Quick Prompts */}
                <div className="trainer-quick-chips">
                  <span className="quick-chips-label">Prueba con:</span>
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
                    onClick={() => handleSendMessage('crea un paquete de pagina web con bot de whatsapp')}
                  >
                    "Crear paquete Web + Bot"
                  </button>
                  <button
                    type="button"
                    className="quick-chip-btn"
                    onClick={() => handleSendMessage('agrega una promocion de 20% en aplicaciones')}
                  >
                    "Promoción en Apps"
                  </button>
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
                              <span className="inline-block-cat-badge">{msg.proposedBlock.category}</span>
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
                        <span className="text-xs text-muted">El Bot Entrenador está analizando tu respuesta...</span>
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
                    placeholder="Escribe tu instrucción o responde las preguntas del entrenador..."
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
                      <Package size={18} className="text-cyan-400" />
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
                        <span className="proposed-category-badge">{activeProposedBlock.category}</span>
                      </div>

                      <div className="proposed-details-grid">
                        {activeProposedBlock.structuredData?.price !== undefined && (
                          <div className="proposed-detail-item">
                            <span className="detail-label">Precio Base:</span>
                            <span className="detail-value text-emerald-400 font-bold">
                              ${activeProposedBlock.structuredData.price} MXN
                            </span>
                          </div>
                        )}
                        {activeProposedBlock.structuredData?.adjustmentPrice !== undefined && (
                          <div className="proposed-detail-item">
                            <span className="detail-label">Costo por Ajuste:</span>
                            <span className="detail-value">
                              ${activeProposedBlock.structuredData.adjustmentPrice} MXN
                            </span>
                          </div>
                        )}
                        {activeProposedBlock.structuredData?.includes && (
                          <div className="proposed-detail-item full">
                            <span className="detail-label">Qué Incluye el Paquete:</span>
                            <span className="detail-value">{activeProposedBlock.structuredData.includes}</span>
                          </div>
                        )}
                        {activeProposedBlock.structuredData?.additionalPackages && (
                          <div className="proposed-detail-item full">
                            <span className="detail-label">Paquetes Complementarios / Adicionales:</span>
                            <span className="detail-value">{activeProposedBlock.structuredData.additionalPackages}</span>
                          </div>
                        )}
                        {activeProposedBlock.structuredData?.advisorInstructions && (
                          <div className="proposed-detail-item full">
                            <span className="detail-label">Instrucción de Venta para el Asesor:</span>
                            <span className="detail-value text-amber-300">
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
                        Escribe en el chat del Bot Entrenador (por ejemplo: <em>"cambia el precio a 300 pesos"</em>).
                        El bot te hará preguntas para armar el perfil de cambios y te mostrará el bloque aquí para que lo confirmes antes de subirlo a Firestore.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: OBJETOS CREADOS EN FIRESTORE                                */}
          {/* ================================================================= */}
          {activeTab === 'objects' && (
            <div className="admin-objects-section">
              <div className="objects-header-bar">
                <div>
                  <h3 className="section-title">Objetos Creados en Documentos Maestros</h3>
                  <p className="section-desc">
                    Colección de paquetes, reglas y promociones activas que el Bot Asesor consulta en Firestore en tiempo real.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-create-new-object"
                  onClick={() => {
                    setActiveTab('trainer');
                    setUserInput('Quiero crear un nuevo paquete para el Bot Asesor');
                  }}
                >
                  <PlusCircle size={16} />
                  <span>Crear Nuevo Objeto con el Bot</span>
                </button>
              </div>

              {/* Filter Pills */}
              <div className="objects-filter-pills">
                <button
                  type="button"
                  className={`filter-pill ${objectCategoryFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setObjectCategoryFilter('all')}
                >
                  Todos ({config.knowledgeBlocks?.length || 0})
                </button>
                <button
                  type="button"
                  className={`filter-pill ${objectCategoryFilter === 'package' ? 'active' : ''}`}
                  onClick={() => setObjectCategoryFilter('package')}
                >
                  Paquetes ({config.knowledgeBlocks?.filter(b => b.category === 'package').length || 0})
                </button>
                <button
                  type="button"
                  className={`filter-pill ${objectCategoryFilter === 'rule' ? 'active' : ''}`}
                  onClick={() => setObjectCategoryFilter('rule')}
                >
                  Reglas de Asesor ({config.knowledgeBlocks?.filter(b => b.category === 'rule').length || 0})
                </button>
              </div>

              {/* Grid of Objects */}
              <div className="objects-cards-grid">
                {filteredBlocks.map((block) => (
                  <div key={block.id} className="object-card">
                    <div className="object-card-header">
                      <div className="object-title-group">
                        <h4 className="object-title">{block.title}</h4>
                        <span className={`object-category-pill ${block.category}`}>
                          {block.category}
                        </span>
                      </div>
                      {block.structuredData?.price !== undefined && (
                        <div className="object-price-tag">
                          <DollarSign size={14} />
                          <span>${block.structuredData.price} MXN</span>
                        </div>
                      )}
                    </div>

                    <p className="object-summary">{block.summary}</p>

                    <div className="object-details-box">
                      {block.structuredData?.includes && (
                        <div className="object-detail-row">
                          <strong>Incluye:</strong> {block.structuredData.includes}
                        </div>
                      )}
                      {block.structuredData?.additionalPackages && (
                        <div className="object-detail-row">
                          <strong>Adicionales:</strong> {block.structuredData.additionalPackages}
                        </div>
                      )}
                    </div>

                    <div className="object-meta-footer">
                      <span className="object-date">
                        Actualizado: {new Date(block.updatedAt).toLocaleDateString('es-MX')}
                      </span>
                      <div className="object-card-actions">
                        <button
                          type="button"
                          className="btn-card-action edit"
                          onClick={() => handleRefineBlockWithTrainer(block)}
                          title="Refinar con el Bot Entrenador"
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
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: BASE PRICING & QUOTAS CONTROLS                             */}
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
          {/* TAB 4: RAW MASTER FIRESTORE DOCUMENT                               */}
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
