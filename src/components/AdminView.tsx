import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Bot,
  Sparkles,
  Save,
  RotateCcw,
  Sliders,
  MessageSquare,
  FileText,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Eye,
  LogOut
} from 'lucide-react';
import {
  type BotKnowledgeConfig,
  DEFAULT_BOT_KNOWLEDGE,
  subscribeToBotKnowledge,
  saveBotKnowledgeToFirestore,
  processTrainerInstruction
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
  const [activeTab, setActiveTab] = useState<'trainer' | 'pricing' | 'raw'>('trainer');
  const [trainerInput, setTrainerInput] = useState('');
  const [lastChanges, setLastChanges] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToBotKnowledge((freshConfig) => {
      setConfig(freshConfig);
    });
    return () => unsubscribe();
  }, []);

  const handleApplyTrainerInstruction = (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = trainerInput.trim();
    if (!prompt) return;

    const result = processTrainerInstruction(prompt, config);
    setConfig(result.updatedConfig);
    setLastChanges(result.changesSummary);
    setTrainerInput('');

    if (result.changesSummary.length > 0) {
      setSaveStatus({
        type: 'success',
        message: 'Cambios interpretados. Haz clic en "Guardar en Firestore" para aplicarlos al bot en vivo.'
      });
    }
  };

  const handleSaveToFirestore = async () => {
    setSaving(true);
    setSaveStatus(null);
    const userEmail = currentUser?.email || 'gffraustop@gmail.com';
    const res = await saveBotKnowledgeToFirestore(config, userEmail);
    setSaving(false);

    if (res.success) {
      setSaveStatus({
        type: 'success',
        message: '¡Contexto guardado y sincronizado con éxito en Firestore! El Super-Bot en vivo ya utiliza estos datos.'
      });
      setTimeout(() => setSaveStatus(null), 6000);
    } else {
      setSaveStatus({
        type: 'error',
        message: res.error || 'Error al guardar en Firestore'
      });
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('¿Deseas restablecer todos los valores del bot a los valores oficiales por defecto?')) {
      setConfig(DEFAULT_BOT_KNOWLEDGE);
      setLastChanges(['Valores restablecidos a los valores por defecto del sistema.']);
    }
  };

  return (
    <div className="admin-dashboard-container">
      {/* Top Banner / Navigation */}
      <div className="admin-header-bar">
        <div className="admin-header-brand">
          <div className="admin-badge-icon">
            <ShieldCheck size={22} className="text-emerald-400" />
          </div>
          <div>
            <div className="admin-title-row">
              <h2 className="admin-title">Panel de Control: SuperBot Admin</h2>
              <span className="admin-role-pill">Administrador</span>
            </div>
            <p className="admin-subtitle">
              Configuración en vivo del Bot Asesor y Bot Entrenador sincronizado con Firestore
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
            title="Probar respuestas de Super-Bot"
          >
            <Bot size={16} />
            <span>Probar Chat Bot</span>
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
      </div>

      {/* Main Admin Workspace */}
      <div className="admin-workspace-grid">
        {/* Left Side: Navigation Tabs & Firestore Status */}
        <aside className="admin-sidebar-nav">
          <div className="admin-nav-card">
            <h4 className="admin-nav-heading">Módulos del Bot</h4>
            <div className="admin-nav-tabs">
              <button
                type="button"
                className={`admin-nav-tab-btn ${activeTab === 'trainer' ? 'active' : ''}`}
                onClick={() => setActiveTab('trainer')}
              >
                <Sparkles size={17} />
                <span>Bot Entrenador (Chat)</span>
              </button>
              <button
                type="button"
                className={`admin-nav-tab-btn ${activeTab === 'pricing' ? 'active' : ''}`}
                onClick={() => setActiveTab('pricing')}
              >
                <Sliders size={17} />
                <span>Tarifas y Cuotas</span>
              </button>
              <button
                type="button"
                className={`admin-nav-tab-btn ${activeTab === 'raw' ? 'active' : ''}`}
                onClick={() => setActiveTab('raw')}
              >
                <FileText size={17} />
                <span>Reglas y Notas</span>
              </button>
            </div>
          </div>

          <div className="admin-firestore-status-card">
            <div className="firestore-status-header">
              <span className="status-dot-live"></span>
              <span className="status-label">Firestore: <code>bot_knowledge</code></span>
            </div>
            <p className="firestore-meta-text">
              <strong>Última sincronización:</strong><br />
              {config.lastUpdated ? new Date(config.lastUpdated).toLocaleString('es-MX') : 'En sesión local'}
            </p>
            <p className="firestore-meta-text">
              <strong>Actualizado por:</strong> {config.updatedBy || 'gffraustop@gmail.com'}
            </p>
            <button
              type="button"
              className="btn-save-firestore-primary"
              onClick={handleSaveToFirestore}
              disabled={saving}
            >
              <Save size={16} />
              <span>{saving ? 'Guardando...' : 'Guardar en Firestore'}</span>
            </button>
          </div>
        </aside>

        {/* Right Content Area */}
        <div className="admin-content-panel">
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

          {/* TAB 1: Conversational Trainer Bot */}
          {activeTab === 'trainer' && (
            <div className="admin-tab-section">
              <div className="section-title-box">
                <div className="section-icon-wrap">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="section-title">Bot Entrenador Conversacional</h3>
                  <p className="section-desc">
                    Escribe instrucciones en lenguaje cotidiano para modificar los precios, cuotas y comportamiento del Super-Bot.
                  </p>
                </div>
              </div>

              {/* Training Prompt Input */}
              <form onSubmit={handleApplyTrainerInstruction} className="trainer-input-form">
                <div className="trainer-input-wrapper">
                  <MessageSquare size={18} className="trainer-input-icon" />
                  <input
                    type="text"
                    value={trainerInput}
                    onChange={(e) => setTrainerInput(e.target.value)}
                    placeholder="Ejemplo: 'Sube la página web a $350 y agrega ajuste de $150' o 'Recuerda responder amablemente los domingos'"
                    className="trainer-text-field"
                  />
                  <button type="submit" className="btn-train-action">
                    <Sparkles size={16} />
                    <span>Interpretar y Aplicar</span>
                  </button>
                </div>
              </form>

              {/* Suggestions */}
              <div className="trainer-quick-hints">
                <span className="hints-label">Prueba con órdenes como:</span>
                <div className="hints-chips">
                  <button
                    type="button"
                    className="hint-chip"
                    onClick={() => setTrainerInput('Cambia el precio de la página web a $350')}
                  >
                    "Cambia página web a $350"
                  </button>
                  <button
                    type="button"
                    className="hint-chip"
                    onClick={() => setTrainerInput('La renta del bot ahora cuesta $1,200')}
                  >
                    "Renta de bot a $1,200"
                  </button>
                  <button
                    type="button"
                    className="hint-chip"
                    onClick={() => setTrainerInput('Aumenta la cuota de Gemini a 2,000 mensajes diarios')}
                  >
                    "Gemini a 2,000 mensajes"
                  </button>
                </div>
              </div>

              {/* Summary of Detected Changes */}
              {lastChanges.length > 0 && (
                <div className="trainer-changes-box">
                  <h4 className="changes-title">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span>Cambios detectados y listos para guardar:</span>
                  </h4>
                  <ul className="changes-list">
                    {lastChanges.map((change, idx) => (
                      <li key={idx} className="change-item">
                        {change}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="btn-confirm-save"
                    onClick={handleSaveToFirestore}
                    disabled={saving}
                  >
                    <Save size={16} />
                    <span>Confirmar y Guardar en Firestore</span>
                  </button>
                </div>
              )}

              {/* Current Live Snapshot Summary */}
              <div className="active-parameters-overview">
                <h4 className="overview-title">Parámetros actuales del Bot en vivo:</h4>
                <div className="parameters-grid">
                  <div className="param-card">
                    <span className="param-label">Página Web Sencilla</span>
                    <span className="param-value">${config.pricing.webBasic} MXN</span>
                  </div>
                  <div className="param-card">
                    <span className="param-label">Ajuste / Sección Extra</span>
                    <span className="param-value">${config.pricing.webAdjustment} MXN</span>
                  </div>
                  <div className="param-card">
                    <span className="param-label">App Estática (1 PC)</span>
                    <span className="param-value">${config.pricing.appStatic} MXN</span>
                  </div>
                  <div className="param-card">
                    <span className="param-label">Renta Mensual de Bot</span>
                    <span className="param-value">${config.pricing.botMonthly} MXN/mes</span>
                  </div>
                  <div className="param-card">
                    <span className="param-label">Mensajes Gratis Gemini</span>
                    <span className="param-value">{config.quotas.geminiFreeDaily} / día</span>
                  </div>
                  <div className="param-card">
                    <span className="param-label">Conversaciones WhatsApp</span>
                    <span className="param-value">{config.quotas.whatsappFreeMonthly} / mes</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Manual Pricing & Quotas Editor */}
          {activeTab === 'pricing' && (
            <div className="admin-tab-section">
              <div className="section-title-box">
                <div className="section-icon-wrap">
                  <DollarSign size={24} />
                </div>
                <div>
                  <h3 className="section-title">Ajuste Manual de Tarifas y Cuotas</h3>
                  <p className="section-desc">
                    Modifica directamente los valores numéricos de tu catálogo y cuotas en la nube.
                  </p>
                </div>
              </div>

              <div className="admin-forms-grid">
                {/* Precios de Servicios */}
                <div className="admin-form-group-card">
                  <h4 className="group-card-title">Precios de Soluciones</h4>
                  
                  <div className="admin-field-row">
                    <label>Página Web Sencilla ($ MXN)</label>
                    <input
                      type="number"
                      value={config.pricing.webBasic}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          pricing: { ...config.pricing, webBasic: Number(e.target.value) }
                        })
                      }
                      className="admin-number-input"
                    />
                  </div>

                  <div className="admin-field-row">
                    <label>Ajuste por sección / cambio ($ MXN)</label>
                    <input
                      type="number"
                      value={config.pricing.webAdjustment}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          pricing: { ...config.pricing, webAdjustment: Number(e.target.value) }
                        })
                      }
                      className="admin-number-input"
                    />
                  </div>

                  <div className="admin-field-row">
                    <label>App Estática Local 1 PC ($ MXN)</label>
                    <input
                      type="number"
                      value={config.pricing.appStatic}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          pricing: { ...config.pricing, appStatic: Number(e.target.value) }
                        })
                      }
                      className="admin-number-input"
                    />
                  </div>

                  <div className="admin-field-row">
                    <label>App Nube con Backend ($ MXN/mes)</label>
                    <input
                      type="number"
                      value={config.pricing.appCloudMonthly}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          pricing: { ...config.pricing, appCloudMonthly: Number(e.target.value) }
                        })
                      }
                      className="admin-number-input"
                    />
                  </div>

                  <div className="admin-field-row">
                    <label>Renta Mensual de Bot ($ MXN/mes)</label>
                    <input
                      type="number"
                      value={config.pricing.botMonthly}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          pricing: { ...config.pricing, botMonthly: Number(e.target.value) }
                        })
                      }
                      className="admin-number-input"
                    />
                  </div>
                </div>

                {/* Cuotas Gratuitas de Nube */}
                <div className="admin-form-group-card">
                  <h4 className="group-card-title">Cuotas Gratuitas de Nube (Free Tier)</h4>

                  <div className="admin-field-row">
                    <label>Google Gemini: Mensajes diarios gratis</label>
                    <input
                      type="number"
                      value={config.quotas.geminiFreeDaily}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          quotas: { ...config.quotas, geminiFreeDaily: Number(e.target.value) }
                        })
                      }
                      className="admin-number-input"
                    />
                  </div>

                  <div className="admin-field-row">
                    <label>Meta WhatsApp: Conversaciones mensuales gratis</label>
                    <input
                      type="number"
                      value={config.quotas.whatsappFreeMonthly}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          quotas: { ...config.quotas, whatsappFreeMonthly: Number(e.target.value) }
                        })
                      }
                      className="admin-number-input"
                    />
                  </div>

                  <h4 className="group-card-title mt-4">Comportamiento del Bot</h4>
                  <div className="admin-toggle-row">
                    <div>
                      <span className="toggle-title">Actitud de Vendedor</span>
                      <p className="toggle-desc">Resalta valor y beneficios de negocio con llamados a la acción.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.rules.salespersonAttitude}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          rules: { ...config.rules, salespersonAttitude: e.target.checked }
                        })
                      }
                      className="admin-switch"
                    />
                  </div>

                  <div className="admin-toggle-row">
                    <div>
                      <span className="toggle-title">Evitar Tecnicismos</span>
                      <p className="toggle-desc">Habla en lenguaje cotidiano sin tokens ni microservicios.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.rules.avoidTechnicalJargon}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          rules: { ...config.rules, avoidTechnicalJargon: e.target.checked }
                        })
                      }
                      className="admin-switch"
                    />
                  </div>

                  <div className="admin-toggle-row">
                    <div>
                      <span className="toggle-title">Redirigir a Gemini para Autoconstrucción</span>
                      <p className="toggle-desc">Ofrece botón directo a Google Gemini si el cliente quiere hacer su web él mismo.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.rules.selfBuildRedirectGemini}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          rules: { ...config.rules, selfBuildRedirectGemini: e.target.checked }
                        })
                      }
                      className="admin-switch"
                    />
                  </div>
                </div>
              </div>

              <div className="admin-actions-footer">
                <button
                  type="button"
                  className="btn-save-firestore-primary"
                  onClick={handleSaveToFirestore}
                  disabled={saving}
                >
                  <Save size={16} />
                  <span>{saving ? 'Guardando...' : 'Guardar Cambios en Firestore'}</span>
                </button>
                <button
                  type="button"
                  className="btn-admin-reset"
                  onClick={handleResetDefaults}
                >
                  <RotateCcw size={16} />
                  <span>Restablecer Valores Iniciales</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Raw Context & Custom Notes */}
          {activeTab === 'raw' && (
            <div className="admin-tab-section">
              <div className="section-title-box">
                <div className="section-icon-wrap">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="section-title">Instrucciones Adicionales del Bot</h3>
                  <p className="section-desc">
                    Agrega promociones especiales, políticas temporales o notas que el bot debe tener siempre en cuenta.
                  </p>
                </div>
              </div>

              <div className="admin-form-group-card">
                <label className="block mb-2 font-semibold text-sm">
                  Notas personalizadas para el Bot Asesor (Promociones, horarios, condiciones):
                </label>
                <textarea
                  rows={8}
                  value={config.customNotes || ''}
                  onChange={(e) => setConfig({ ...config, customNotes: e.target.value })}
                  placeholder="- Por temporada: 10% de descuento en el primer mes de renta del bot.&#10;- Si el cliente tiene dudas sobre facturación, recordar que emitimos factura CFDI."
                  className="admin-textarea"
                />
              </div>

              <div className="admin-actions-footer">
                <button
                  type="button"
                  className="btn-save-firestore-primary"
                  onClick={handleSaveToFirestore}
                  disabled={saving}
                >
                  <Save size={16} />
                  <span>{saving ? 'Guardando...' : 'Guardar en Firestore'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
