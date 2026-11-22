import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  RotateCcw,
  UserCheck,
  Bot,
  User,
  Sparkles
} from 'lucide-react';
import {
  askGemini,
  type ChatMessage
} from '../services/gemini';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onContactAdvisor?: () => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  onContactAdvisor
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: '¡Hola! 👋 Soy Super-Bot. Estoy aquí para resolver tus dudas sobre nuestros servicios de formularios, aplicaciones operativas y bots de atención para pequeños negocios. ¿En qué puedo ayudarte?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 250);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose, messages]);

  useEffect(() => {
    const handleFocus = () => {
      inputRef.current?.focus();
    };
    window.addEventListener('superbot-focus-chat', handleFocus);
    return () => window.removeEventListener('superbot-focus-chat', handleFocus);
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response = await askGemini(messages, text);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestAdvisor: response.suggestAdvisor
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: 'No sé la respuesta, ¿quieres que te enlace con un asesor?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestAdvisor: true
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'bot',
        text: 'Conversación reiniciada. ¿En qué duda sobre nuestros servicios te puedo apoyar?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const quickQuestions = [
    '¿Qué servicios ofrecen?',
    '¿Cómo funciona el bot de WhatsApp?',
    '¿Para qué sirve un formulario?',
    '¿Qué incluye una app operativa?',
    '¿Cuáles son los costos?'
  ];

  if (!isOpen) return null;

  return (
    <div className="chat-drawer-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="chat-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="chat-drawer-header">
          <div className="chat-header-brand">
            <div className="chat-bot-avatar-wrap">
              <img src="/bot-icon.png" alt="Super-Bot" className="chat-bot-avatar" />
              <span className="chat-online-dot" title="En línea"></span>
            </div>
            <div className="chat-title-group">
              <div className="chat-title-row">
                <h3 className="chat-title">Super-Bot</h3>
                <span className="chat-ai-badge">
                  <Sparkles size={11} />
                  <span>Gemini IA</span>
                </span>
              </div>
              <p className="chat-subtitle">Resolución de dudas sobre servicios</p>
            </div>
          </div>

          <div className="chat-header-actions">
            <button
              type="button"
              className="chat-header-btn"
              onClick={handleClearChat}
              title="Reiniciar chat"
              aria-label="Reiniciar chat"
            >
              <RotateCcw size={17} />
            </button>
            <button
              type="button"
              className="chat-header-btn btn-close-chat"
              onClick={onClose}
              title="Cerrar panel de chat"
              aria-label="Cerrar panel"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="chat-messages-container">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-message-row ${msg.sender === 'user' ? 'user-row' : 'bot-row'}`}
            >
              {msg.sender === 'bot' && (
                <div className="message-avatar bot-avatar-mini">
                  <Bot size={16} />
                </div>
              )}

              <div className="message-bubble-wrapper">
                <div className={`message-bubble ${msg.sender === 'user' ? 'bubble-user' : 'bubble-bot'}`}>
                  <p className="message-text">{msg.text}</p>

                  {/* Suggest human advisor button when bot doesn't know */}
                  {msg.suggestAdvisor && (
                    <div className="advisor-action-box">
                      <button
                        type="button"
                        className="btn-connect-advisor"
                        onClick={onContactAdvisor || onClose}
                      >
                        <UserCheck size={16} />
                        <span>Hablar con un asesor (Llamada o WhatsApp)</span>
                      </button>
                    </div>
                  )}
                </div>
                <span className="message-timestamp">{msg.timestamp}</span>
              </div>

              {msg.sender === 'user' && (
                <div className="message-avatar user-avatar-mini">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="chat-message-row bot-row">
              <div className="message-avatar bot-avatar-mini">
                <Bot size={16} />
              </div>
              <div className="message-bubble bubble-bot typing-indicator">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="chat-quick-suggestions">
          <span className="quick-suggestions-label">Preguntas sugeridas:</span>
          <div className="quick-pills-row">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                className="quick-pill-btn"
                onClick={() => handleSendMessage(q)}
                disabled={loading}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form
          className="chat-input-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <div className="chat-input-wrap">
            <input
              ref={inputRef}
              type="text"
              placeholder="Hazle una pregunta a Super-Bot..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={loading}
              className="chat-input-field"
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!inputText.trim() || loading}
              aria-label="Enviar pregunta"
            >
              <Send size={18} />
            </button>
          </div>
          <span className="chat-disclaimer">
            Super-Bot responde con información oficial del catálogo y preguntas frecuentes.
          </span>
        </form>
      </div>
    </div>
  );
};
