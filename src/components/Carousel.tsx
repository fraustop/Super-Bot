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
  ArrowRight,
  Package
} from 'lucide-react';

import {
  subscribeToBotKnowledge,
  isProductBlock,
  isServiceBlock,
  type BotKnowledgeBlock
} from '../services/botKnowledgeService';

export interface SlideData {
  id: string | number;
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

const FALLBACK_SLIDES: SlideData[] = [
  {
    id: 'slide-1',
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
    id: 'slide-2',
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
    id: 'slide-3',
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
    id: 'slide-4',
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

function getSlideIcon(block: BotKnowledgeBlock): React.ReactNode {
  const text = `${block.structuredData?.tag || ''} ${block.title || ''} ${block.summary || ''}`.toLowerCase();
  if (text.includes('web') || text.includes('página') || text.includes('pagina') || text.includes('sitio')) {
    return <Globe size={16} />;
  }
  if (text.includes('form') || text.includes('pedido') || text.includes('cotiza') || text.includes('captura')) {
    return <FileText size={16} />;
  }
  if (text.includes('app') || text.includes('pos') || text.includes('mostrador') || text.includes('inventario') || text.includes('operat')) {
    return <LayoutDashboard size={16} />;
  }
  if (text.includes('bot') || text.includes('whatsapp') || text.includes('telegram') || text.includes('asistente') || text.includes('chat')) {
    return <Bot size={16} />;
  }
  return isProductBlock(block) ? <Package size={16} /> : <Sparkles size={16} />;
}

function blockToSlide(block: BotKnowledgeBlock, index: number): SlideData {
  const imageUrl = block.imageUrl || block.structuredData?.imageUrl || '/carousel-websites.jpg';
  const tag =
    block.structuredData?.tag?.trim() ||
    (isProductBlock(block) ? 'Producto Digital' : 'Servicio Especializado');

  // Title: prefer publicTitle, then summary if it's punchy, then title
  const title = block.structuredData?.publicTitle?.trim() || block.summary?.trim() || block.title;

  // Subtitle: use includes, advisorInstructions, or summary
  let subtitle = '';
  if (block.structuredData?.advisorInstructions) {
    subtitle = block.structuredData.advisorInstructions;
  } else if (block.structuredData?.includes) {
    subtitle = `Incluye: ${block.structuredData.includes}`;
  } else {
    subtitle = block.summary || 'Solución digital lista para operar e impulsar las ventas de tu negocio.';
  }

  // Utilities list
  let utilities = block.structuredData?.utilities;
  if (!utilities || utilities.length === 0) {
    const includesList = block.structuredData?.includes
      ? block.structuredData.includes.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    if (includesList.length >= 2) {
      utilities = includesList.slice(0, 3).map((item) => ({
        title: item,
        desc: 'Configurado e integrado a la medida para tu negocio.'
      }));
    } else {
      utilities = [
        { title: 'Presencia e impacto inmediato', desc: 'Diseñado a la medida para convertir visitantes en clientes.' },
        { title: 'Atención directa y sin rodeos', desc: 'Canales optimizados con enlace directo a WhatsApp y cotizaciones.' },
        { title: 'Soporte y acompañamiento', desc: 'Garantía técnica y asistencia para mantener tu solución siempre activa.' }
      ];
    }
  }

  return {
    id: block.id || `slide-${index + 1}`,
    tag,
    badgeIcon: getSlideIcon(block),
    title,
    subtitle,
    image: imageUrl,
    imageAlt: block.title,
    utilities
  };
}

const ROTATION_INTERVAL = 4500; // 4.5 seconds per card

interface CarouselProps {
  onOpenContact?: () => void;
  isChatOpen?: boolean;
}

export const Carousel: React.FC<CarouselProps> = ({ onOpenContact, isChatOpen = false }) => {
  const [slides, setSlides] = useState<SlideData[]>(FALLBACK_SLIDES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  // Subscribe in real-time to knowledge blocks from Firestore/Service
  useEffect(() => {
    const unsubscribe = subscribeToBotKnowledge((config) => {
      const blocks = config.knowledgeBlocks || [];
      const published = blocks.filter(
        (b) =>
          b.status !== 'archived' &&
          (isProductBlock(b) || isServiceBlock(b)) &&
          (b.publishedToHome === true || b.structuredData?.publishedToHome === true)
      );

      if (published.length > 0) {
        setSlides(published.map(blockToSlide));
      } else {
        // If all items are temporarily unpublished, display fallback catalog
        setSlides(FALLBACK_SLIDES);
      }
    });

    return () => unsubscribe();
  }, []);

  // Ensure currentIndex stays within bounds when slides count changes
  useEffect(() => {
    if (slides.length > 0 && currentIndex >= slides.length) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  const nextSlide = useCallback(() => {
    setSlides((current) => {
      if (current.length === 0) return current;
      setCurrentIndex((prev) => (prev + 1) % current.length);
      return current;
    });
  }, []);

  const prevSlide = useCallback(() => {
    setSlides((current) => {
      if (current.length === 0) return current;
      setCurrentIndex((prev) => (prev - 1 + current.length) % current.length);
      return current;
    });
  }, []);

  // Continuous auto-rotation every 4.5 seconds (only if multiple slides exist)
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      nextSlide();
    }, ROTATION_INTERVAL);

    return () => clearInterval(timer);
  }, [currentIndex, nextSlide, slides.length]);

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
