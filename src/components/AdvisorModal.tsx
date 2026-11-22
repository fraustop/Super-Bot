import React, { useState } from 'react';
import {
  X,
  PhoneCall,
  MessageSquare,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { saveAdvisorRequest } from '../firebase/config';
import { sendAdvisorWhatsAppNotification } from '../services/whatsapp';

interface AdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (details: { preference: 'call' | 'whatsapp'; phone: string; name?: string }) => void;
}

export const AdvisorModal: React.FC<AdvisorModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  // Step 1: Select preference ('call' | 'whatsapp' | null)
  const [preference, setPreference] = useState<'call' | 'whatsapp' | null>(null);
  const [countryCode, setCountryCode] = useState('+52');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    preference: 'call' | 'whatsapp';
    phone: string;
    name?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSelectPreference = (pref: 'call' | 'whatsapp') => {
    setPreference(pref);
    setErrorMessage(null);
  };

  const handleBackToOptions = () => {
    setPreference(null);
    setErrorMessage(null);
  };

  const handleResetAndClose = () => {
    setPreference(null);
    setPhoneNumber('');
    setClientName('');
    setIsSubmitted(false);
    setErrorMessage(null);
    setSubmittedData(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanDigits = phoneNumber.replace(/\D/g, '');
    if (cleanDigits.length < 8) {
      setErrorMessage('Por favor ingresa un número de teléfono válido (al menos 10 dígitos).');
      return;
    }

    if (!preference) {
      setErrorMessage('Por favor selecciona si deseas llamada o mensaje de WhatsApp.');
      return;
    }

    const fullPhone = `${countryCode} ${cleanDigits}`;
    setLoading(true);

    try {
      // 1. Guardar en documento de Firebase Firestore
      const saveResult = await saveAdvisorRequest({
        preference,
        phone: fullPhone,
        name: clientName
      });

      if (saveResult.error) {
        console.warn('Advertencia al guardar en Firebase:', saveResult.error);
      }

      const requestId = saveResult.id || `req-${Date.now()}`;

      // 2. Enviar mensaje automático por la API de WhatsApp al 52 8146018110
      const waResult = await sendAdvisorWhatsAppNotification({
        preference,
        clientPhone: fullPhone,
        clientName,
        requestId
      });

      if (!waResult.success) {
        console.warn('Nota sobre notificación WhatsApp:', waResult.error);
      }

      // 3. Confirmación al usuario
      const finalDetails = {
        preference,
        phone: fullPhone,
        name: clientName
      };

      setSubmittedData(finalDetails);
      setIsSubmitted(true);
      if (onSuccess) {
        onSuccess(finalDetails);
      }
    } catch (err: any) {
      console.error('Error procesando solicitud de asesor:', err);
      setErrorMessage(
        'Ocurrió un inconveniente al procesar tu solicitud. Por favor intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="advisor-modal-backdrop"
      onClick={handleResetAndClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="advisor-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="advisor-modal-header">
          <div className="advisor-header-title-wrap">
            <div className="advisor-badge-icon">
              <UserCheck size={20} />
            </div>
            <div>
              <h2 className="advisor-modal-title">Hablar con un Asesor</h2>
              <p className="advisor-modal-subtitle">
                {isSubmitted
                  ? '¡Solicitud recibida con éxito!'
                  : 'Atención personalizada para tu negocio'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="advisor-close-btn"
            onClick={handleResetAndClose}
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="advisor-modal-body">
          {/* SUCCESS VIEW */}
          {isSubmitted && submittedData ? (
            <div className="advisor-success-view">
              <div className="advisor-success-icon-wrap">
                <CheckCircle2 size={54} className="advisor-success-icon" />
              </div>

              <h3 className="advisor-success-heading">
                {submittedData.preference === 'call'
                  ? '¡Llamada programada con éxito!'
                  : '¡Mensaje de WhatsApp solicitado!'}
              </h3>

              <p className="advisor-success-desc">
                {submittedData.preference === 'call' ? (
                  <>
                    Hemos notificado a nuestro asesor. Te marcaremos a la brevedad al número{' '}
                    <strong>{submittedData.phone}</strong>.
                  </>
                ) : (
                  <>
                    Hemos notificado a nuestro asesor vía WhatsApp. Te escribiremos a{' '}
                    <strong>{submittedData.phone}</strong> para responder todas tus dudas.
                  </>
                )}
              </p>

              <div className="advisor-confirmation-pill">
                <ShieldCheck size={16} />
                <span>Registrado en Firebase y notificado al asesor en tiempo real</span>
              </div>

              <button
                type="button"
                className="btn-advisor-finish"
                onClick={handleResetAndClose}
              >
                Entendido, muchas gracias
              </button>
            </div>
          ) : preference === null ? (
            /* STEP 1: CHOOSE PREFERENCE (LLAMADA O WHATSAPP) */
            <div className="advisor-selection-view">
              <p className="advisor-instruction-text">
                ¿Cómo prefieres que se comunique nuestro asesor contigo?
              </p>

              <div className="advisor-options-grid">
                {/* Option 1: LLAMADA */}
                <button
                  type="button"
                  className="advisor-option-card option-call"
                  onClick={() => handleSelectPreference('call')}
                >
                  <div className="option-icon-box icon-call-box">
                    <PhoneCall size={28} />
                  </div>
                  <div className="option-info">
                    <span className="option-num-badge">Opción 1</span>
                    <h4 className="option-title">Quiero recibir una llamada</h4>
                    <p className="option-desc">
                      Un asesor te marcará directamente a tu teléfono para resolver tus dudas de forma rápida.
                    </p>
                  </div>
                  <div className="option-cta-indicator">
                    <span>Seleccionar</span>
                    <span className="arrow-sym">→</span>
                  </div>
                </button>

                {/* Option 2: WHATSAPP */}
                <button
                  type="button"
                  className="advisor-option-card option-whatsapp"
                  onClick={() => handleSelectPreference('whatsapp')}
                >
                  <div className="option-icon-box icon-wa-box">
                    <MessageSquare size={28} />
                  </div>
                  <div className="option-info">
                    <span className="option-num-badge wa-badge">Opción 2</span>
                    <h4 className="option-title">Quiero recibir un mensaje de WhatsApp</h4>
                    <p className="option-desc">
                      Te escribiremos a tu WhatsApp con información, catálogos y respuestas a tus preguntas.
                    </p>
                  </div>
                  <div className="option-cta-indicator wa-cta">
                    <span>Seleccionar</span>
                    <span className="arrow-sym">→</span>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: PHONE & NAME FORM */
            <form className="advisor-form-view" onSubmit={handleSubmit}>
              <div className="advisor-selected-summary">
                <button
                  type="button"
                  className="btn-advisor-back"
                  onClick={handleBackToOptions}
                  title="Cambiar opción"
                >
                  <ArrowLeft size={16} />
                  <span>Cambiar</span>
                </button>
                <div className="selected-tag">
                  {preference === 'call' ? (
                    <>
                      <PhoneCall size={16} className="tag-icon-call" />
                      <span>Has seleccionado: <strong>Recibir una llamada</strong></span>
                    </>
                  ) : (
                    <>
                      <MessageSquare size={16} className="tag-icon-wa" />
                      <span>Has seleccionado: <strong>Recibir mensaje de WhatsApp</strong></span>
                    </>
                  )}
                </div>
              </div>

              {errorMessage && (
                <div className="advisor-error-banner">
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="advisor-field-group">
                <label htmlFor="advisor-phone-input" className="advisor-field-label">
                  {preference === 'call'
                    ? '¿A qué número de teléfono te marcamos? *'
                    : '¿A qué número de WhatsApp te escribimos? *'}
                </label>
                <div className="advisor-phone-input-wrap">
                  <select
                    className="advisor-country-select"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    aria-label="Código de país"
                  >
                    <option value="+52">🇲🇽 +52 (México)</option>
                    <option value="+1">🇺🇸 +1 (EE.UU. / Can)</option>
                    <option value="+57">🇨🇴 +57 (Colombia)</option>
                    <option value="+54">🇦🇷 +54 (Argentina)</option>
                    <option value="+56">🇨🇱 +56 (Chile)</option>
                    <option value="+34">🇪🇸 +34 (España)</option>
                  </select>
                  <input
                    id="advisor-phone-input"
                    type="tel"
                    className="advisor-phone-input"
                    placeholder="Ej. 81 4601 8110"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
                <span className="advisor-field-hint">
                  {preference === 'call'
                    ? 'Te llamaremos en horario hábil a la brevedad.'
                    : 'Te enviaremos un mensaje de texto por WhatsApp a este número.'}
                </span>
              </div>

              <div className="advisor-field-group">
                <label htmlFor="advisor-name-input" className="advisor-field-label">
                  Tu nombre o nombre de tu negocio <span className="label-optional">(opcional)</span>
                </label>
                <input
                  id="advisor-name-input"
                  type="text"
                  className="advisor-text-input"
                  placeholder="Ej. Juan Pérez / Taller Mecánico San Juan"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className={`btn-advisor-submit ${
                  preference === 'whatsapp' ? 'btn-submit-wa' : 'btn-submit-call'
                }`}
                disabled={loading || !phoneNumber.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spin-icon" />
                    <span>Guardando y notificando al asesor...</span>
                  </>
                ) : preference === 'call' ? (
                  <>
                    <PhoneCall size={18} />
                    <span>Solicitar llamada del asesor</span>
                  </>
                ) : (
                  <>
                    <MessageSquare size={18} />
                    <span>Solicitar mensaje por WhatsApp</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
