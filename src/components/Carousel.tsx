import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Globe,
  FileText,
  LayoutDashboard,
  Bot,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface SlideData {
  id: number;
  tag: string;
  badgeIcon: React.ReactNode;
  title: string;
  subtitle: string;
  image: string;
  imageAlt: string;
  utilities: {
    title: string;
    desc: string;
  }[];
}

const slides: SlideData[] = [
  {
    id: 1,
    tag: 'Páginas Web Profesionales',
    badgeIcon: <Globe size={16} />,
    title: 'Tu Negocio en Internet con una Web Moderna y Vendedora',
    subtitle:
      'Diseñamos páginas web profesionales, rápidas y adaptadas a celulares que transmiten confianza inmediata, posicionan tu marca y convierten visitas en clientes.',
    image: '/carousel-websites.jpg',
    imageAlt: 'Página web profesional y responsiva para negocios y PyMEs',
    utilities: [
      {
        title: 'Presencia digital de alto impacto',
        desc: 'Destaca frente a tus competidores con un diseño a la medida, confiable y accesible desde cualquier dispositivo.'
      },
      {
        title: 'Diseñada para convertir y vender',
        desc: 'Estructura clara con botones directos a WhatsApp, cotizadores y llamadas a la acción sin rodeos.'
      },
      {
        title: 'Velocidad ultra rápida y optimizada',
        desc: 'Carga instantánea con código ágil y moderno para que tus clientes locales te encuentren sin demoras.'
      }
    ]
  },
  {
    id: 2,
    tag: 'Formularios Inteligentes',
    badgeIcon: <FileText size={16} />,
    title: 'Captura de Pedidos y Clientes sin Complicaciones',
    subtitle:
      'Digitaliza la recepción de solicitudes, cotizaciones y pedidos en una interfaz rápida, intuitiva y accesible para tu emprendimiento.',
    image: '/carousel-forms.jpg',
    imageAlt: 'Formulario digital interactivo para recepción de pedidos y datos',
    utilities: [
      {
        title: 'Recepción 24/7 sin esperas',
        desc: 'Tus clientes pueden cotizar o enviar sus pedidos en cualquier momento sin perder la venta.'
      },
      {
        title: 'Cero errores de captura',
        desc: 'La información se valida en tiempo real y se envía directo a tu base de datos o correo.'
      },
      {
        title: 'Sin software costoso',
        desc: 'Una solución directa y a la medida que reemplaza procesos en papel o mensajes desordenados.'
      }
    ]
  },
  {
    id: 3,
    tag: 'Aplicaciones Operativas',
    badgeIcon: <LayoutDashboard size={16} />,
    title: 'El Control Diario de tu Negocio en tu Mano',
    subtitle:
      'Herramientas sencillas para gestionar ventas en mostrador, inventarios de productos y pedidos diarios sin sistemas complicados.',
    image: '/carousel-apps.jpg',
    imageAlt: 'Panel operativo de punto de venta y control de inventario',
    utilities: [
      {
        title: 'Inventario y stock al instante',
        desc: 'Conoce exactamente qué productos tienes disponibles y recibe alertas de reabastecimiento.'
      },
      {
        title: 'Punto de venta ágil',
        desc: 'Registra cobros, métodos de pago y pedidos de tus clientes en pocos segundos.'
      },
      {
        title: 'Métricas claras y útiles',
        desc: 'Visualiza cuánto has vendido hoy y qué productos son los favoritos de tus clientes.'
      }
    ]
  },
  {
    id: 4,
    tag: 'Bots de Atención (Web, WhatsApp y Telegram)',
    badgeIcon: <Bot size={16} />,
    title: 'Respuestas Instantáneas y Cierre de Ventas',
    subtitle:
      'Un asistente inteligente que atiende las dudas de tus prospectos en los canales donde ya se comunican y no deja escapar ninguna venta.',
    image: '/carousel-bots.jpg',
    imageAlt: 'Bot de atención multicanal en WhatsApp, Telegram y Web',
    utilities: [
      {
        title: 'Atención en WhatsApp y Telegram',
        desc: 'Responde automáticamente en las apps de mensajería más usadas por tus clientes.'
      },
      {
        title: 'Preguntas frecuentes resueltas al segundo',
        desc: 'Horarios, catálogos, formas de entrega, métodos de pago y detalles de tus servicios.'
      },
      {
        title: 'Pase a humano cuando toque cerrar',
        desc: 'El bot califica el interés y te avisa cuando el cliente requiere confirmación personalizada.'
      }
    ]
  }
];

const ROTATION_INTERVAL = 4500; // 4.5 seconds per card

interface CarouselProps {
  onOpenContact?: () => void;
  isChatOpen?: boolean;
}

export const Carousel: React.FC<CarouselProps> = ({ onOpenContact, isChatOpen = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  // Continuous auto-rotation every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, ROTATION_INTERVAL);

    return () => clearInterval(timer);
  }, [currentIndex, nextSlide]);

  // Touch gesture support for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }
    touchStartX.current = null;
  };

  return (
    <section
      className={`carousel-section ${isChatOpen ? 'is-compact-mode' : ''}`}
      aria-label="Soluciones para pequeños negocios"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`carousel-container ${isChatOpen ? 'compact-container' : ''}`}>
        {/* Carousel Viewport / Sliding Window */}
        <div className="carousel-viewport">
          <div
            className="carousel-track"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {slides.map((slide, idx) => (
              <div
                className={`carousel-slide-card ${idx === currentIndex ? 'active-slide' : ''}`}
                key={slide.id}
                aria-hidden={idx !== currentIndex}
              >
                {/* Left / Info Column */}
                <div className="slide-content">
                  <div className="slide-badge">
                    <span className="slide-badge-icon">{slide.badgeIcon}</span>
                    <span className="slide-badge-text">{slide.tag}</span>
                  </div>

                  <h2 className="slide-title">{slide.title}</h2>
                  <p className="slide-subtitle">{slide.subtitle}</p>

                  {/* Utility points */}
                  <div className="slide-utilities-list">
                    {slide.utilities.map((item, uIdx) => (
                      <div className="utility-item" key={uIdx}>
                        <div className="utility-icon">
                          <CheckCircle2 size={18} />
                        </div>
                        <div className="utility-text">
                          <strong className="utility-heading">{item.title}</strong>
                          <span className="utility-desc">{item.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Slide Action */}
                  <div className="slide-action-row">
                    <button
                      type="button"
                      className="btn-slide-cta"
                      onClick={() => {
                        if (onOpenContact) onOpenContact();
                        window.dispatchEvent(new CustomEvent('superbot-focus-chat'));
                      }}
                    >
                      <span>Solicitar información</span>
                      <ArrowRight size={17} />
                    </button>
                    <div className="accessible-badge">
                      <Sparkles size={14} />
                      <span>Diseñado para emprendedores y PyMEs</span>
                    </div>
                  </div>
                </div>

                {/* Right / Image Column */}
                <div className="slide-visual">
                  <div className="image-frame">
                    <img
                      src={slide.image}
                      alt={slide.imageAlt}
                      className="slide-image"
                      loading={idx === 0 ? 'eager' : 'lazy'}
                    />
                    <div className="image-sheen"></div>
                    <div className="slide-counter-pill">
                      <span>{idx + 1}</span> / <span>{slides.length}</span>
                    </div>
                  </div>
                </div>

                {/* Floating Bot Chat Launcher inside active card, over the container (labels removed) */}
                {idx === currentIndex && (
                  <button
                    type="button"
                    className="card-chat-launcher"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenContact) onOpenContact();
                      window.dispatchEvent(new CustomEvent('superbot-focus-chat'));
                    }}
                    aria-label="Abrir chat con Super-Bot"
                    title="Pregúntale a Super-Bot"
                  >
                    <div className="card-launcher-icon-wrap">
                      <img src="/bot-icon.png" alt="Super-Bot" className="card-launcher-bot-img" />
                      <span className="card-launcher-online-dot"></span>
                    </div>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Navigation Bar */}
        <div className="carousel-nav-bar">
          <button
            type="button"
            className="carousel-arrow-btn prev-btn"
            onClick={prevSlide}
            aria-label="Diapositiva anterior"
            title="Anterior"
          >
            <ChevronLeft size={22} />
          </button>

          {/* Indicators / Progress Tabs */}
          <div className="carousel-indicators">
            {slides.map((slide, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  className={`indicator-dot ${isActive ? 'active' : ''}`}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Ir a diapositiva ${idx + 1}: ${slide.tag}`}
                >
                  <span className="indicator-progress-track">
                    <span
                      key={isActive ? `progress-${currentIndex}` : `idle-${idx}`}
                      className={`indicator-progress-fill ${isActive ? 'animating' : ''}`}
                    />
                  </span>
                  <span className="indicator-label">{slide.tag}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="carousel-arrow-btn next-btn"
            onClick={nextSlide}
            aria-label="Siguiente diapositiva"
            title="Siguiente"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </div>
    </section>
  );
};
