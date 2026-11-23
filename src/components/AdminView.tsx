import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Bot,
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
  RefreshCw,
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
  Code,
  Globe,
  Upload,
  Link
} from 'lucide-react';
import {
  type BotKnowledgeConfig,
  type BotKnowledgeBlock,
  DEFAULT_BOT_KNOWLEDGE,
  getActiveBotKnowledge,
  subscribeToBotKnowledge,
  saveBotKnowledgeToFirestore,
  addOrUpdateKnowledgeBlock,
  deleteKnowledgeBlock,
  deleteBlocksByCategory,
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
  const [config, setConfig] = useState<BotKnowledgeConfig>(getActiveBotKnowledge());
  const [activeTab, setActiveTab] = useState<'products' | 'services' | 'instructions' | 'pricing' | 'raw'>('products');

  // Manual Block Editing Modal State
  const [editingBlock, setEditingBlock] = useState<BotKnowledgeBlock | null>(null);
  const [isNewManualBlock, setIsNewManualBlock] = useState<boolean>(false);
  const [promptViewMode, setPromptViewMode] = useState<'edit' | 'preview'>('edit');

  // Status & notifications
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Image upload and mode state
  const [imageSourceMode, setImageSourceMode] = useState<'upload' | 'url'>('upload');
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToBotKnowledge((freshConfig) => {
      setConfig(freshConfig);
    });
    return () => unsubscribe();
  }, []);

  const adminEmail = currentUser?.email || 'admin@superbot.ai';

  // Categorized blocks
  const productBlocks = (config.knowledgeBlocks || []).filter(isProductBlock);
  const serviceBlocks = (config.knowledgeBlocks || []).filter(isServiceBlock);
  const instructionBlocks = (config.knowledgeBlocks || []).filter(isInstructionBlock);

  // Helper to compile a clean markdown prompt block from structured data
  const generateContentFromBlock = (b: BotKnowledgeBlock): string => {
    if (b.category === 'instruction') {
      const ruleType = b.structuredData?.ruleType || 'Directriz';
      const advice = b.structuredData?.advisorInstructions || b.summary || '';
      const lines = [`### INSTRUCCIÓN OFICIAL AL ASESOR: ${(b.title || 'NUEVA DIRECTRIZ').toUpperCase()}`];
      lines.push(`- **Tipo:** ${ruleType}`);
      if (advice) lines.push(`- **Directriz:** ${advice}`);
      return lines.join('\n\n');
    }
    if (b.category === 'service') {
      const priceText = b.structuredData?.monthlyPrice !== undefined
        ? `$${b.structuredData.monthlyPrice} MXN/mes`
        : b.structuredData?.adjustmentPrice !== undefined
          ? `$${b.structuredData.adjustmentPrice} MXN por ajuste`
          : '';
      const freq = b.structuredData?.frequency || '';
      const channels = b.structuredData?.channels || '';
      const inc = b.structuredData?.includes || b.summary || '';
      const advice = b.structuredData?.advisorInstructions || '';
      const lines = [`### SERVICIO OFICIAL: ${(b.title || 'NUEVO SERVICIO').toUpperCase()}`];
      if (priceText || freq) lines.push(`- **Tarifa oficial:** ${priceText}${freq ? ` (${freq})` : ''}`.trim());
      if (channels) lines.push(`- **Canales de operación:** ${channels}`);
      if (inc) lines.push(`- **Alcance y cobertura:** ${inc}`);
      if (advice) lines.push(`- **Consigna para el Asesor:** ${advice}`);
      if (Array.isArray(b.structuredData?.utilities)) {
        const validUtils = b.structuredData.utilities.filter((u) => u.title?.trim());
        if (validUtils.length > 0) {
          const utilsText = validUtils.map((u) => `  - **${u.title.trim()}:** ${u.desc?.trim() || ''}`).join('\n');
          lines.push(`- **Beneficios clave en catálogo:**\n${utilsText}`);
        }
      }
      return lines.join('\n\n');
    }
    // Product
    const priceText = b.structuredData?.price !== undefined ? `$${b.structuredData.price} MXN (pago único)` : '';
    const format = b.structuredData?.deliveryFormat || '';
    const inc = b.structuredData?.includes || b.summary || '';
    const addOns = b.structuredData?.additionalPackages || '';
    const advice = b.structuredData?.advisorInstructions || '';
    const lines = [`### PRODUCTO OFICIAL DEL CATÁLOGO: ${(b.title || 'NUEVO PRODUCTO').toUpperCase()}`];
    if (priceText) lines.push(`- **Costo base:** ${priceText}`);
    if (format) lines.push(`- **Formato de entrega:** ${format}`);
    if (inc) lines.push(`- **Qué incluye:** ${inc}`);
    if (addOns) lines.push(`- **Paquetes complementarios:** ${addOns}`);
    if (advice) lines.push(`- **Consigna para el Asesor:** ${advice}`);
    if (Array.isArray(b.structuredData?.utilities)) {
      const validUtils = b.structuredData.utilities.filter((u) => u.title?.trim());
      if (validUtils.length > 0) {
        const utilsText = validUtils.map((u) => `  - **${u.title.trim()}:** ${u.desc?.trim() || ''}`).join('\n');
        lines.push(`- **Beneficios clave en catálogo:**\n${utilsText}`);
      }
    }
    return lines.join('\n\n');
  };

  // Helper to optimize and convert an uploaded file into a compact, fast-loading Data URL
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingBlock) return;

    if (!file.type.startsWith('image/')) {
      setImageUploadError('Por favor selecciona un archivo de imagen válido (.png, .jpg, .webp).');
      return;
    }

    setImageUploadError(null);
    setUploadingImage(true);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const maxWidth = 1000;
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(event.target?.result as string);
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            let result = canvas.toDataURL('image/webp', 0.85);
            if (!result.startsWith('data:image/webp')) {
              result = canvas.toDataURL('image/jpeg', 0.85);
            }
            resolve(result);
          };
          img.onerror = () => reject(new Error('No se pudo procesar la imagen seleccionada.'));
          img.src = event.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo en tu dispositivo.'));
        reader.readAsDataURL(file);
      });

      setEditingBlock({
        ...editingBlock,
        imageUrl: dataUrl,
        structuredData: {
          ...editingBlock.structuredData,
          imageUrl: dataUrl
        }
      });
    } catch (err: any) {
      setImageUploadError(err.message || 'Error al procesar la imagen.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = () => {
    if (!editingBlock) return;
    setEditingBlock({
      ...editingBlock,
      imageUrl: '',
      structuredData: {
        ...editingBlock.structuredData,
        imageUrl: ''
      }
    });
  };

  // Open modal to manually edit an existing block
  const handleOpenManualEdit = (block: BotKnowledgeBlock) => {
    const cloned: BotKnowledgeBlock = JSON.parse(JSON.stringify(block));
    if (!cloned.structuredData) {
      cloned.structuredData = {};
    }

    if (cloned.category === 'product' || cloned.category === 'service') {
      if (!cloned.structuredData.publicTitle) {
        cloned.structuredData.publicTitle = cloned.summary || cloned.title;
      }
      if (!cloned.structuredData.publicSubtitle) {
        if (cloned.id === 'block-prod-app-pos') {
          cloned.structuredData.publicSubtitle = 'Herramientas sencillas para gestionar ventas en mostrador, inventarios de productos y pedidos diarios sin sistemas complicados.';
        } else if (cloned.id === 'block-prod-web-basic') {
          cloned.structuredData.publicSubtitle = 'Diseño profesional, rápido y optimizado para celulares con botón directo a WhatsApp para que nunca pierdas una venta.';
        } else if (cloned.id === 'block-prod-form') {
          cloned.structuredData.publicSubtitle = 'Digitaliza la recepción de solicitudes, cotizaciones y pedidos en una interfaz rápida, intuitiva y accesible para tu emprendimiento.';
        } else if (cloned.id === 'block-serv-bot-monthly') {
          cloned.structuredData.publicSubtitle = 'Un asistente inteligente que atiende las dudas de tus prospectos en los canales donde ya se comunican y no deja escapar ninguna venta.';
        } else {
          cloned.structuredData.publicSubtitle = cloned.structuredData.advisorInstructions || cloned.summary || '';
        }
      }

      if (!Array.isArray(cloned.structuredData.utilities) || cloned.structuredData.utilities.length === 0) {
        if (cloned.id === 'block-prod-app-pos') {
          cloned.structuredData.utilities = [
            { title: 'Inventario y stock al instante', desc: 'Conoce exactamente qué productos tienes disponibles y recibe alertas de reabastecimiento.' },
            { title: 'Punto de venta ágil', desc: 'Registra cobros, métodos de pago y pedidos de tus clientes en pocos segundos.' },
            { title: 'Métricas claras y útiles', desc: 'Visualiza cuánto has vendido hoy y qué productos son los favoritos de tus clientes.' }
          ];
        } else if (cloned.id === 'block-prod-web-basic') {
          cloned.structuredData.utilities = [
            { title: 'Presencia digital de alto impacto', desc: 'Destaca frente a tus competidores con un diseño a la medida, confiable y accesible desde cualquier dispositivo.' },
            { title: 'Diseñada para convertir y vender', desc: 'Estructura clara con botones directos a WhatsApp, cotizadores y llamadas a la acción sin rodeos.' },
            { title: 'Velocidad ultra rápida y optimizada', desc: 'Carga instantánea con código ágil y moderno para que tus clientes locales te encuentren sin demoras.' }
          ];
        } else if (cloned.id === 'block-prod-form') {
          cloned.structuredData.utilities = [
            { title: 'Recepción 24/7 sin esperas', desc: 'Tus clientes pueden cotizar o enviar sus pedidos en cualquier momento sin perder la venta.' },
            { title: 'Cero errores de captura', desc: 'La información se valida en tiempo real y se envía directo a tu base de datos o correo.' },
            { title: 'Sin software costoso', desc: 'Una solución directa y a la medida que reemplaza procesos en papel o mensajes desordenados.' }
          ];
        } else if (cloned.id === 'block-serv-bot-monthly') {
          cloned.structuredData.utilities = [
            { title: 'Atención en WhatsApp y Telegram', desc: 'Responde automáticamente en las apps de mensajería más usadas por tus clientes.' },
            { title: 'Preguntas frecuentes resueltas al segundo', desc: 'Horarios, catálogos, formas de entrega, métodos de pago y detalles de tus servicios.' },
            { title: 'Pase a humano cuando toque cerrar', desc: 'El bot califica el interés y te avisa cuando el cliente requiere confirmación personalizada.' }
          ];
        } else {
          cloned.structuredData.utilities = [
            { title: '', desc: '' },
            { title: '', desc: '' },
            { title: '', desc: '' }
          ];
        }
      }
    }

    setEditingBlock(cloned);
    setIsNewManualBlock(false);
    setPromptViewMode('edit');
    const img = cloned.imageUrl || cloned.structuredData?.imageUrl || '';
    setImageSourceMode(img.startsWith('data:image/') ? 'upload' : 'url');
    setImageUploadError(null);
  };

  // Open modal to manually create a new block (CLEAN: No dummy/example data and no undefined values)
  const handleOpenManualCreate = (cat: 'product' | 'service' | 'instruction') => {
    const newBlock: BotKnowledgeBlock = {
      id: `block-${Date.now().toString(36)}`,
      title: '',
      category: cat,
      summary: '',
      content: '',
      imageUrl: '',
      publishedToHome: true,
      structuredData: {
        deliveryFormat: '',
        frequency: '',
        channels: '',
        includes: '',
        additionalPackages: '',
        advisorInstructions: '',
        imageUrl: '',
        publishedToHome: true,
        tag: cat === 'product' ? 'Páginas Web' : cat === 'service' ? 'Bots de Atención' : 'Directriz',
        publicTitle: '',
        publicSubtitle: '',
        utilities: cat === 'product' || cat === 'service' ? [
          { title: '', desc: '' },
          { title: '', desc: '' },
          { title: '', desc: '' }
        ] : []
      },
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorEmail: adminEmail
    };
    if (cat === 'instruction') {
      newBlock.structuredData!.ruleType = 'Directriz General';
    }
    setEditingBlock(newBlock);
    setIsNewManualBlock(true);
    setPromptViewMode('edit');
    setImageSourceMode('upload');
    setImageUploadError(null);
  };

  // Save manual block directly to Firestore
  const handleSaveManualBlock = async () => {
    if (!editingBlock) return;
    if (!editingBlock.title.trim()) {
      alert('Por favor especifica un título para el objeto.');
      return;
    }

    const imgUrl = editingBlock.imageUrl?.trim() || editingBlock.structuredData?.imageUrl?.trim() || '';
    const isPub = editingBlock.publishedToHome ?? editingBlock.structuredData?.publishedToHome ?? true;

    // Filter out undefined values completely so Firestore setDoc never rejects the payload
    const cleanedStructured: Record<string, any> = {};
    if (editingBlock.structuredData) {
      for (const [key, val] of Object.entries(editingBlock.structuredData)) {
        if (val !== undefined) {
          cleanedStructured[key] = val;
        }
      }
    }
    cleanedStructured.imageUrl = imgUrl;
    cleanedStructured.publishedToHome = isPub;

    // Preserve public card title and subtitle
    if (editingBlock.structuredData?.publicTitle !== undefined) {
      cleanedStructured.publicTitle = (editingBlock.structuredData.publicTitle || '').trim();
    }
    if (editingBlock.structuredData?.publicSubtitle !== undefined) {
      cleanedStructured.publicSubtitle = (editingBlock.structuredData.publicSubtitle || '').trim();
    }

    // Clean utilities array
    if (Array.isArray(editingBlock.structuredData?.utilities)) {
      cleanedStructured.utilities = editingBlock.structuredData.utilities
        .map((u) => ({
          title: (u.title || '').trim(),
          desc: (u.desc || '').trim()
        }))
        .filter((u) => u.title !== '' || u.desc !== '');
    }

    // Ensure prompt content is preserved
    const promptContent = editingBlock.content?.trim() || generateContentFromBlock(editingBlock);

    const blockToSave: BotKnowledgeBlock = {
      ...editingBlock,
      imageUrl: imgUrl,
      publishedToHome: isPub,
      structuredData: cleanedStructured,
      summary: editingBlock.summary.trim() || editingBlock.structuredData?.includes || editingBlock.title,
      content: promptContent,
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

  // Quick toggle publication to home page directly from the card
  const handleTogglePublishHome = async (block: BotKnowledgeBlock) => {
    const isCurrentlyPublished = block.publishedToHome ?? block.structuredData?.publishedToHome ?? false;
    const nextVal = !isCurrentlyPublished;
    const updatedBlock: BotKnowledgeBlock = {
      ...block,
      publishedToHome: nextVal,
      structuredData: {
        ...block.structuredData,
        publishedToHome: nextVal
      },
      updatedAt: new Date().toISOString()
    };

    // Update local state immediately
    setConfig(prev => ({
      ...prev,
      knowledgeBlocks: (prev.knowledgeBlocks || []).map(b => b.id === block.id ? updatedBlock : b)
    }));

    await addOrUpdateKnowledgeBlock(updatedBlock, adminEmail);
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

  // Delete an existing knowledge block
  const handleDeleteBlock = async (blockId: string, blockTitle: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${blockTitle}" de Firestore? No volverá a aparecer.`)) {
      return;
    }

    // Immediately remove from UI state
    setConfig(prev => ({
      ...prev,
      knowledgeBlocks: (prev.knowledgeBlocks || []).filter(b => b.id !== blockId)
    }));

    setSaving(true);
    const res = await deleteKnowledgeBlock(blockId, adminEmail);
    setSaving(false);

    if (res.success) {
      setSaveStatus({
        type: 'success',
        message: `"${blockTitle}" eliminado permanentemente.`
      });
      setTimeout(() => setSaveStatus(null), 3500);
    } else {
      setSaveStatus({
        type: 'error',
        message: res.error || 'Error al eliminar de Firestore'
      });
    }
  };

  // Delete all knowledge blocks belonging to a category
  const handleDeleteCategoryAll = async (category: 'product' | 'service' | 'instruction') => {
    const label = category === 'product' ? 'todos los Productos' : category === 'service' ? 'todos los Servicios' : 'todas las Instrucciones';
    if (!window.confirm(`¿Estás seguro de eliminar ${label}? Esta acción los removerá permanentemente de Firestore.`)) {
      return;
    }

    setConfig(prev => {
      let filtered = prev.knowledgeBlocks || [];
      if (category === 'product') filtered = filtered.filter(b => !isProductBlock(b));
      else if (category === 'service') filtered = filtered.filter(b => !isServiceBlock(b));
      else filtered = filtered.filter(b => !isInstructionBlock(b));
      return { ...prev, knowledgeBlocks: filtered };
    });

    setSaving(true);
    const res = await deleteBlocksByCategory(category, adminEmail);
    setSaving(false);

    if (res.success) {
      setSaveStatus({
        type: 'success',
        message: `Se eliminaron ${label} de Firestore.`
      });
      setTimeout(() => setSaveStatus(null), 3500);
    } else {
      setSaveStatus({
        type: 'error',
        message: res.error || 'Error al eliminar de Firestore'
      });
    }
  };

  // Reset all knowledge blocks to corrected master defaults in Firestore
  const handleResetToOfficialDefaults = async () => {
    if (!window.confirm('¿Deseas restablecer todos los productos, servicios e instrucciones a las versiones maestras oficiales corregidas? Esto sincronizará Firestore de inmediato.')) {
      return;
    }
    setSaving(true);
    setSaveStatus(null);
    const res = await saveBotKnowledgeToFirestore(DEFAULT_BOT_KNOWLEDGE, adminEmail);
    setSaving(false);
    if (res.success) {
      setConfig(DEFAULT_BOT_KNOWLEDGE);
      setSaveStatus({
        type: 'success',
        message: '¡Catálogo oficial y directrices maestras sincronizadas con éxito en Firestore!'
      });
      setTimeout(() => setSaveStatus(null), 5000);
    } else {
      setSaveStatus({
        type: 'error',
        message: res.error || 'Error al restablecer valores oficiales en Firestore.'
      });
    }
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
              <h2 className="admin-title">Panel de Control: Super-Bot</h2>
              <span className="admin-role-pill">Administrador</span>
            </div>
            <p className="admin-subtitle">
              Gestión directa de Productos, Servicios e Instrucciones para el Bot Asesor en Firestore
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
              {/* Tab 1: Productos */}
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

              {/* Tab 2: Servicios */}
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

              {/* Tab 3: Instrucciones al Bot */}
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

              {/* Tab 4: Tarifas y Cuotas */}
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

              {/* Tab 5: Documento Maestro */}
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

          {/* Firestore Connection Badge & Quick Restore */}
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

            <button
              type="button"
              className="btn-admin-reset-defaults"
              onClick={handleResetToOfficialDefaults}
              disabled={saving}
              title="Restablecer productos, servicios e instrucciones a las versiones maestras oficiales"
            >
              <RotateCcw size={14} />
              <span>{saving ? 'Sincronizando...' : 'Restablecer Prompts Oficiales'}</span>
            </button>
            <p className="sidebar-action-hint">
              Sincroniza en Firestore los prompts maestros corregidos ($300 web, $500 POS, $1,000 bot).
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
          {/* TAB 1: PRODUCTOS (Catálogo empaquetado de software/web)           */}
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
                  {productBlocks.length > 0 && (
                    <button
                      type="button"
                      className="btn-category-clear-all"
                      onClick={() => handleDeleteCategoryAll('product')}
                      title="Eliminar todos los productos de Firestore"
                    >
                      <Trash2 size={14} />
                      <span>Vaciar Productos</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-category-manual green"
                    onClick={() => handleOpenManualCreate('product')}
                    title="Crear un nuevo producto en el catálogo"
                  >
                    <Plus size={15} />
                    <span>+ Nuevo Producto</span>
                  </button>
                </div>
              </div>

              {productBlocks.length > 0 ? (
                <div className="category-cards-grid">
                  {productBlocks.map((block) => (
                    <div key={block.id} className="category-card product-card">
                      {(block.imageUrl || block.structuredData?.imageUrl) && (
                        <div className="category-card-thumb-banner">
                          <img
                            src={block.imageUrl || block.structuredData?.imageUrl}
                            alt={block.title}
                            className="card-thumb-img"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      <div className="category-card-header">
                        <div className="category-title-group">
                          <h4 className="category-card-title">{block.title || 'Sin título'}</h4>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="category-tag-pill green">PRODUCTO</span>
                            <button
                              type="button"
                              className={`publication-pill ${(block.publishedToHome ?? block.structuredData?.publishedToHome) ? 'published' : 'hidden'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePublishHome(block);
                              }}
                              title={(block.publishedToHome ?? block.structuredData?.publishedToHome) ? 'Publicado en Inicio (Haz clic para ocultar)' : 'Oculto en Inicio (Haz clic para publicar)'}
                            >
                              <Globe size={11} />
                              <span>{(block.publishedToHome ?? block.structuredData?.publishedToHome) ? '🌐 En Inicio' : '⚪ Oculto'}</span>
                            </button>
                          </div>
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
                  <p>Crea tu primer producto empaquetado para el catálogo del Bot Asesor.</p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      className="btn-category-manual green"
                      onClick={() => handleOpenManualCreate('product')}
                    >
                      <Plus size={16} />
                      <span>+ Crear Producto</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: SERVICIOS (Rentas, mantenimiento e infra cloud recurrente)  */}
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
                  {serviceBlocks.length > 0 && (
                    <button
                      type="button"
                      className="btn-category-clear-all"
                      onClick={() => handleDeleteCategoryAll('service')}
                      title="Eliminar todos los servicios de Firestore"
                    >
                      <Trash2 size={14} />
                      <span>Vaciar Servicios</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-category-manual cyan"
                    onClick={() => handleOpenManualCreate('service')}
                    title="Crear un nuevo servicio en el catálogo"
                  >
                    <Plus size={15} />
                    <span>+ Nuevo Servicio</span>
                  </button>
                </div>
              </div>

              {serviceBlocks.length > 0 ? (
                <div className="category-cards-grid">
                  {serviceBlocks.map((block) => (
                    <div key={block.id} className="category-card service-card">
                      {(block.imageUrl || block.structuredData?.imageUrl) && (
                        <div className="category-card-thumb-banner">
                          <img
                            src={block.imageUrl || block.structuredData?.imageUrl}
                            alt={block.title}
                            className="card-thumb-img"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      <div className="category-card-header">
                        <div className="category-title-group">
                          <h4 className="category-card-title">{block.title || 'Sin título'}</h4>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="category-tag-pill cyan">SERVICIO</span>
                            <button
                              type="button"
                              className={`publication-pill ${(block.publishedToHome ?? block.structuredData?.publishedToHome) ? 'published' : 'hidden'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePublishHome(block);
                              }}
                              title={(block.publishedToHome ?? block.structuredData?.publishedToHome) ? 'Publicado en Inicio (Haz clic para ocultar)' : 'Oculto en Inicio (Haz clic para publicar)'}
                            >
                              <Globe size={11} />
                              <span>{(block.publishedToHome ?? block.structuredData?.publishedToHome) ? '🌐 En Inicio' : '⚪ Oculto'}</span>
                            </button>
                          </div>
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
                  <p>Configura rentas mensuales o pólizas de mantenimiento para el Bot Asesor.</p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      className="btn-category-manual cyan"
                      onClick={() => handleOpenManualCreate('service')}
                    >
                      <Plus size={16} />
                      <span>+ Crear Servicio</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: INSTRUCCIONES AL BOT (Reglas, tono, redirección y cotizar)  */}
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
                  {instructionBlocks.length > 0 && (
                    <button
                      type="button"
                      className="btn-category-clear-all"
                      onClick={() => handleDeleteCategoryAll('instruction')}
                      title="Eliminar todas las instrucciones de Firestore"
                    >
                      <Trash2 size={14} />
                      <span>Vaciar Instrucciones</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-category-manual purple"
                    onClick={() => handleOpenManualCreate('instruction')}
                    title="Crear una nueva instrucción para el bot asesor"
                  >
                    <Plus size={15} />
                    <span>+ Nueva Instrucción</span>
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
                  <p>Agrega reglas de tono o comportamiento para el Bot Asesor.</p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      className="btn-category-manual purple"
                      onClick={() => handleOpenManualCreate('instruction')}
                    >
                      <Plus size={16} />
                      <span>+ Crear Instrucción</span>
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
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`modal-cat-icon-wrap ${editingBlock.category}`}>
                  {editingBlock.category === 'product' ? (
                    <Package size={17} className="text-emerald-400" />
                  ) : editingBlock.category === 'service' ? (
                    <Wrench size={17} className="text-cyan-400" />
                  ) : (
                    <Brain size={17} className="text-purple-400" />
                  )}
                </div>
                <div className="min-w-0 flex items-center gap-2 flex-wrap">
                  <h3 className="modal-title truncate">
                    {isNewManualBlock ? 'Crear Objeto' : 'Editar Objeto'}: <span className="text-cyan-300 font-semibold">{editingBlock.title || 'Sin título'}</span>
                  </h3>
                  <span className={`modal-header-cat-pill ${editingBlock.category}`}>
                    {editingBlock.category.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
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
                  <span>{editingBlock.status === 'active' ? 'Activo' : 'Pausado'}</span>
                </button>

                <button
                  type="button"
                  className="btn-modal-close"
                  onClick={() => setEditingBlock(null)}
                  title="Cerrar ventana"
                >
                  <X size={18} />
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
                  <span className="panel-section-title">📋 Parámetros</span>
                  <span className="text-xs text-muted">Panel Izquierdo</span>
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
                            price: editingBlock.structuredData?.price,
                            deliveryFormat: editingBlock.structuredData?.deliveryFormat || ''
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
                            monthlyPrice: editingBlock.structuredData?.monthlyPrice,
                            frequency: editingBlock.structuredData?.frequency || '',
                            channels: editingBlock.structuredData?.channels || ''
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
                            ruleType: editingBlock.structuredData?.ruleType || 'Directriz General'
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
                    placeholder={editingBlock.category === 'product' ? 'Ej. Página Web Sencilla ($300 MXN)' : editingBlock.category === 'service' ? 'Ej. Renta de Bot ($1,000 MXN/mes)' : 'Ej. Responder con tono comercial'}
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
                        value={editingBlock.structuredData?.price !== undefined ? editingBlock.structuredData.price : ''}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          const nextStructured = { ...editingBlock.structuredData };
                          if (val !== '') {
                            nextStructured.price = Number(val);
                          } else {
                            delete nextStructured.price;
                          }
                          setEditingBlock({
                            ...editingBlock,
                            structuredData: nextStructured
                          });
                        }}
                        placeholder="Ej. 300"
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
                        value={editingBlock.structuredData?.monthlyPrice !== undefined ? editingBlock.structuredData.monthlyPrice : ''}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          const nextStructured = { ...editingBlock.structuredData };
                          if (val !== '') {
                            nextStructured.monthlyPrice = Number(val);
                          } else {
                            delete nextStructured.monthlyPrice;
                          }
                          setEditingBlock({
                            ...editingBlock,
                            structuredData: nextStructured
                          });
                        }}
                        placeholder="Ej. 1000"
                        className="field-input-compact text-cyan-400 font-bold"
                      />
                    </div>

                    <div className="left-field-group">
                      <label className="field-label-compact">O Costo por Ajuste ($ MXN):</label>
                      <input
                        type="number"
                        value={editingBlock.structuredData?.adjustmentPrice !== undefined ? editingBlock.structuredData.adjustmentPrice : ''}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          const nextStructured = { ...editingBlock.structuredData };
                          if (val !== '') {
                            nextStructured.adjustmentPrice = Number(val);
                          } else {
                            delete nextStructured.adjustmentPrice;
                          }
                          setEditingBlock({
                            ...editingBlock,
                            structuredData: nextStructured
                          });
                        }}
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

                {/* 🌐 Publicación en Página de Inicio (Carrusel) */}
                {(editingBlock.category === 'product' || editingBlock.category === 'service') && (
                  <div className="category-compact-box home-publish-box">
                    <div className="publish-header-row">
                      <span className="field-label-compact flex items-center gap-1.5 text-cyan-300">
                        <Globe size={13} />
                        <span>🌐 Publicar en Inicio (Carrusel)</span>
                      </span>
                      <label className="switch-toggle-label">
                        <input
                          type="checkbox"
                          checked={editingBlock.publishedToHome ?? editingBlock.structuredData?.publishedToHome ?? false}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setEditingBlock({
                              ...editingBlock,
                              publishedToHome: val,
                              structuredData: {
                                ...editingBlock.structuredData,
                                publishedToHome: val
                              }
                            });
                          }}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="left-field-group mt-1">
                      <label className="field-label-compact">Etiqueta en Carrusel:</label>
                      <input
                        type="text"
                        value={editingBlock.structuredData?.tag || ''}
                        onChange={(e) => setEditingBlock({
                          ...editingBlock,
                          structuredData: {
                            ...editingBlock.structuredData,
                            tag: e.target.value
                          }
                        })}
                        placeholder={editingBlock.category === 'product' ? 'Ej. Páginas Web Profesionales' : 'Ej. Bots de Atención'}
                        className="field-input-compact text-cyan-200"
                      />
                    </div>

                    <div className="left-field-group">
                      <label className="field-label-compact">Título en Tarjeta de Inicio:</label>
                      <input
                        type="text"
                        value={editingBlock.structuredData?.publicTitle || ''}
                        onChange={(e) => setEditingBlock({
                          ...editingBlock,
                          structuredData: {
                            ...editingBlock.structuredData,
                            publicTitle: e.target.value
                          }
                        })}
                        placeholder={editingBlock.summary || editingBlock.title || 'Ej. El Control Diario de tu Negocio en tu Mano'}
                        className="field-input-compact font-bold text-cyan-200"
                      />
                    </div>

                    <div className="left-field-group">
                      <label className="field-label-compact">Subtítulo en Tarjeta de Inicio:</label>
                      <textarea
                        rows={2}
                        value={editingBlock.structuredData?.publicSubtitle || ''}
                        onChange={(e) => setEditingBlock({
                          ...editingBlock,
                          structuredData: {
                            ...editingBlock.structuredData,
                            publicSubtitle: e.target.value
                          }
                        })}
                        placeholder="Ej. Herramientas sencillas para gestionar ventas en mostrador, inventarios de productos y pedidos diarios."
                        className="field-textarea-compact"
                      />
                    </div>

                    {/* Las 3 tarjetas de beneficios / utilidades */}
                    <div className="left-field-group">
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="field-label-compact flex items-center gap-1 text-cyan-300">
                          <CheckCircle2 size={12} />
                          <span>Tarjetas de Detalles (Beneficios en Inicio):</span>
                        </label>
                        <button
                          type="button"
                          className="btn-add-utility-tiny"
                          onClick={() => {
                            const currentUtils = editingBlock.structuredData?.utilities || [];
                            setEditingBlock({
                              ...editingBlock,
                              structuredData: {
                                ...editingBlock.structuredData,
                                utilities: [...currentUtils, { title: '', desc: '' }]
                              }
                            });
                          }}
                          title="Agregar otra tarjeta"
                        >
                          <Plus size={11} />
                          <span>Agregar</span>
                        </button>
                      </div>
                      <span className="file-upload-hint mb-1">
                        Modifica las tarjetas que aparecen en el inicio (ej. Inventario y stock, Punto de venta, Métricas):
                      </span>

                      <div className="utilities-editor-list">
                        {(editingBlock.structuredData?.utilities || []).map((util, uIdx) => (
                          <div key={uIdx} className="utility-editor-card">
                            <div className="utility-editor-card-header">
                              <span className="utility-badge-number">Tarjeta #{uIdx + 1}</span>
                              {(editingBlock.structuredData?.utilities || []).length > 1 && (
                                <button
                                  type="button"
                                  className="btn-remove-utility-tiny"
                                  onClick={() => {
                                    const nextUtils = [...(editingBlock.structuredData?.utilities || [])];
                                    nextUtils.splice(uIdx, 1);
                                    setEditingBlock({
                                      ...editingBlock,
                                      structuredData: {
                                        ...editingBlock.structuredData,
                                        utilities: nextUtils
                                      }
                                    });
                                  }}
                                  title="Eliminar esta tarjeta"
                                >
                                  <Trash2 size={10} />
                                </button>
                              )}
                            </div>
                            <div className="flex flex-col gap-1 mt-1">
                              <input
                                type="text"
                                value={util.title}
                                onChange={(e) => {
                                  const nextUtils = [...(editingBlock.structuredData?.utilities || [])];
                                  nextUtils[uIdx] = { ...nextUtils[uIdx], title: e.target.value };
                                  setEditingBlock({
                                    ...editingBlock,
                                    structuredData: {
                                      ...editingBlock.structuredData,
                                      utilities: nextUtils
                                    }
                                  });
                                }}
                                placeholder={`Título (ej. ${uIdx === 0 ? 'Inventario y stock al instante' : uIdx === 1 ? 'Punto de venta ágil' : 'Métricas claras y útiles'})`}
                                className="field-input-compact font-bold text-cyan-200"
                              />
                              <textarea
                                rows={2}
                                value={util.desc}
                                onChange={(e) => {
                                  const nextUtils = [...(editingBlock.structuredData?.utilities || [])];
                                  nextUtils[uIdx] = { ...nextUtils[uIdx], desc: e.target.value };
                                  setEditingBlock({
                                    ...editingBlock,
                                    structuredData: {
                                      ...editingBlock.structuredData,
                                      utilities: nextUtils
                                    }
                                  });
                                }}
                                placeholder="Descripción concisa de este beneficio o utilidad"
                                className="field-textarea-compact text-xs"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="left-field-group">
                      <div className="flex items-center justify-between mb-1">
                        <label className="field-label-compact">Imagen para el Carrusel:</label>
                        {/* Tab Switcher between File Upload and URL */}
                        <div className="img-source-switch-tabs">
                          <button
                            type="button"
                            className={`btn-img-tab ${imageSourceMode === 'upload' ? 'active' : ''}`}
                            onClick={() => setImageSourceMode('upload')}
                            title="Subir archivo desde tu equipo"
                          >
                            <Upload size={11} />
                            <span>Subir Archivo</span>
                          </button>
                          <button
                            type="button"
                            className={`btn-img-tab ${imageSourceMode === 'url' ? 'active' : ''}`}
                            onClick={() => setImageSourceMode('url')}
                            title="Ingresar URL absoluta o web"
                          >
                            <Link size={11} />
                            <span>URL Web</span>
                          </button>
                        </div>
                      </div>

                      {/* Mode A: Upload File */}
                      {imageSourceMode === 'upload' && (
                        <div className="img-upload-dropzone">
                          <label htmlFor="admin-modal-file-upload" className="btn-file-upload-trigger">
                            <Upload size={14} />
                            <span>{uploadingImage ? 'Procesando imagen...' : '📁 Elegir archivo de imagen'}</span>
                          </label>
                          <input
                            id="admin-modal-file-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileUpload}
                            disabled={uploadingImage}
                            className="hidden-file-input"
                          />
                          <span className="file-upload-hint">PNG, JPG, WEBP (se optimiza automáticamente)</span>
                          {imageUploadError && (
                            <span className="file-upload-error">{imageUploadError}</span>
                          )}
                        </div>
                      )}

                      {/* Mode B: Absolute URL */}
                      {imageSourceMode === 'url' && (
                        <div className="img-url-input-wrap">
                          <input
                            type="text"
                            value={editingBlock.imageUrl || editingBlock.structuredData?.imageUrl || ''}
                            onChange={(e) => {
                              const url = e.target.value;
                              setEditingBlock({
                                ...editingBlock,
                                imageUrl: url,
                                structuredData: {
                                  ...editingBlock.structuredData,
                                  imageUrl: url
                                }
                              });
                            }}
                            placeholder="https://ejemplo.com/foto.jpg o /carousel-websites.jpg"
                            className="field-input-compact"
                          />
                          <span className="file-upload-hint">URL absoluta (https://...) o ruta local (/carousel-...)</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Image Presets */}
                    <div className="image-presets-row">
                      <span className="text-[10px] text-muted block mb-1">Preajustes rápidos:</span>
                      <div className="preset-buttons-group">
                        <button
                          type="button"
                          className="btn-preset-img"
                          onClick={() => {
                            setEditingBlock({
                              ...editingBlock,
                              imageUrl: '/carousel-websites.jpg',
                              structuredData: {
                                ...editingBlock.structuredData,
                                imageUrl: '/carousel-websites.jpg',
                                tag: editingBlock.structuredData?.tag || 'Páginas Web Profesionales'
                              }
                            });
                          }}
                          title="Usar imagen de Páginas Web"
                        >
                          🌐 Webs
                        </button>
                        <button
                          type="button"
                          className="btn-preset-img"
                          onClick={() => {
                            setEditingBlock({
                              ...editingBlock,
                              imageUrl: '/carousel-forms.jpg',
                              structuredData: {
                                ...editingBlock.structuredData,
                                imageUrl: '/carousel-forms.jpg',
                                tag: editingBlock.structuredData?.tag || 'Formularios Inteligentes'
                              }
                            });
                          }}
                          title="Usar imagen de Formularios"
                        >
                          📋 Form
                        </button>
                        <button
                          type="button"
                          className="btn-preset-img"
                          onClick={() => {
                            setEditingBlock({
                              ...editingBlock,
                              imageUrl: '/carousel-apps.jpg',
                              structuredData: {
                                ...editingBlock.structuredData,
                                imageUrl: '/carousel-apps.jpg',
                                tag: editingBlock.structuredData?.tag || 'Aplicaciones Operativas'
                              }
                            });
                          }}
                          title="Usar imagen de Apps / POS"
                        >
                          💻 Apps
                        </button>
                        <button
                          type="button"
                          className="btn-preset-img"
                          onClick={() => {
                            setEditingBlock({
                              ...editingBlock,
                              imageUrl: '/carousel-bots.jpg',
                              structuredData: {
                                ...editingBlock.structuredData,
                                imageUrl: '/carousel-bots.jpg',
                                tag: editingBlock.structuredData?.tag || 'Bots de Atención'
                              }
                            });
                          }}
                          title="Usar imagen de Bots"
                        >
                          🤖 Bots
                        </button>
                      </div>
                    </div>

                    {/* Live Preview Thumbnail in Modal */}
                    {(editingBlock.imageUrl || editingBlock.structuredData?.imageUrl) && (
                      <div className="modal-img-preview-box">
                        <img
                          src={editingBlock.imageUrl || editingBlock.structuredData?.imageUrl}
                          alt="Vista previa"
                          className="modal-preview-img"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="modal-preview-bar">
                          <span className="modal-preview-source-badge">
                            {(editingBlock.imageUrl || '').startsWith('data:image/') ? '📁 Archivo Subido' : '🌐 URL Absoluta'}
                          </span>
                          <button
                            type="button"
                            className="btn-remove-img-preview"
                            onClick={handleRemoveImage}
                            title="Quitar esta imagen"
                          >
                            <Trash2 size={11} />
                            <span>Quitar</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Auto-compile prompt button */}
                <div className="mt-auto pt-1">
                  <button
                    type="button"
                    className="btn-sync-to-prompt"
                    onClick={() => {
                      const generated = generateContentFromBlock(editingBlock);
                      setEditingBlock({ ...editingBlock, content: generated });
                    }}
                    title="Compilar y pasar estos detalles al prompt maestro"
                  >
                    <RotateCcw size={12} />
                    <span>⚡ Sincronizar al Prompt</span>
                  </button>
                </div>
              </aside>

              {/* ----------------------------------------------------------- */}
              {/* RIGHT PANEL (~75% width): Main Master Prompt & Markdown     */}
              {/* ----------------------------------------------------------- */}
              <section className="modal-right-prompt-panel">
                {/* Prompt Top Header */}
                <div className="prompt-panel-topbar">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={16} className="text-cyan-400 flex-shrink-0" />
                    <h4 className="prompt-panel-title truncate">
                      Prompt Maestro Oficial para el Bot Asesor
                    </h4>
                  </div>

                  {/* Mode Switcher: Edit Mode vs Formatted Preview Mode */}
                  <div className="prompt-mode-tabs flex-shrink-0">
                    <button
                      type="button"
                      className={`prompt-mode-tab ${promptViewMode === 'edit' ? 'active' : ''}`}
                      onClick={() => setPromptViewMode('edit')}
                    >
                      <Edit3 size={12} />
                      <span>✏️ Edición Markdown</span>
                    </button>
                    <button
                      type="button"
                      className={`prompt-mode-tab ${promptViewMode === 'preview' ? 'active' : ''}`}
                      onClick={() => setPromptViewMode('preview')}
                    >
                      <Eye size={12} />
                      <span>👁️ Vista Previa</span>
                    </button>
                  </div>
                </div>

                {/* Markdown Quick Formatting Toolbar (Available in Edit Mode) */}
                {promptViewMode === 'edit' && (
                  <div className="markdown-toolbar">
                    <span className="toolbar-label">Formato:</span>
                    <button
                      type="button"
                      className="btn-toolbar-tool"
                      onClick={() => handleInsertMarkdownTag('**', '**')}
                      title="Texto en negrita (**texto**)"
                    >
                      <Bold size={12} />
                      <span>Negrita</span>
                    </button>
                    <button
                      type="button"
                      className="btn-toolbar-tool"
                      onClick={() => handleInsertMarkdownTag('*', '*')}
                      title="Texto en cursiva (*texto*)"
                    >
                      <Italic size={12} />
                      <span>Cursiva</span>
                    </button>
                    <button
                      type="button"
                      className="btn-toolbar-tool"
                      onClick={() => handleInsertMarkdownTag('## ')}
                      title="Encabezado H2 (## Título)"
                    >
                      <Heading2 size={12} />
                      <span>H2</span>
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
                      <List size={12} />
                      <span>Lista</span>
                    </button>
                    <button
                      type="button"
                      className="btn-toolbar-tool"
                      onClick={() => handleInsertMarkdownTag('- **Directriz oficial:** ')}
                      title="Directriz clave"
                    >
                      <span>Directriz</span>
                    </button>
                    <button
                      type="button"
                      className="btn-toolbar-tool"
                      onClick={() => handleInsertMarkdownTag('- **Costo:** $', ' MXN')}
                      title="Precio en pesos"
                    >
                      <span>$ Precio</span>
                    </button>
                    <button
                      type="button"
                      className="btn-toolbar-tool"
                      onClick={() => handleInsertMarkdownTag('`', '`')}
                      title="Insignia de código (`etiqueta`)"
                    >
                      <Code size={12} />
                      <span>Código</span>
                    </button>
                  </div>
                )}

                {/* Prompt Main Workspace */}
                <div className="prompt-editor-workspace">
                  {promptViewMode === 'edit' ? (
                    <textarea
                      id="modal-prompt-textarea"
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
                          <p>El prompt está vacío. Escribe en el editor o pulsa "⚡ Sincronizar al Prompt".</p>
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
                    🟢 Firestore en vivo
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
                <Save size={14} />
                <span>{saving ? 'Guardando...' : 'Guardar en Firestore'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
