import { useEffect, useState, lazy, Suspense, useMemo, useCallback, useRef } from "react";
import Lenis from "@studio-freight/lenis";
import { Users, Clock, Star, RotateCw } from "lucide-react";
import { cargarDatos } from "./services/servicioDatos";
import Intro from "./sections/Intro";
import TransicionNarrativa from "./components/TransicionNarrativa";
import EstadisticaDestacada from "./components/EstadisticaDestacada";
import MenuInteractivo from "./components/MenuInteractivo";
import "./styles/global.css";

// Lazy loading de secciones pesadas
const ObjetivoUso = lazy(() => import(/* webpackChunkName: "objetivo-uso" */ "./sections/ObjetivoUso"));
const ObjetivoSatisfaccion = lazy(() => import(/* webpackChunkName: "objetivo-satisfaccion" */ "./sections/ObjetivoSatisfaccion"));
const ObjetivoReutilizacion = lazy(() => import(/* webpackChunkName: "objetivo-reutilizacion" */ "./sections/ObjetivoReutilizacion"));
const Conclusiones = lazy(() => import(/* webpackChunkName: "conclusiones" */ "./sections/Conclusiones"));
const TecnologiasUsadas = lazy(() => import(/* webpackChunkName: "tecnologias" */ "./sections/tegnologiaUsadas"));

// Constantes para el almacenamiento de posición (usar localStorage para persistencia)
const SCROLL_POSITION_KEY = "eduia_scroll_position";
const CURRENT_SECTION_KEY = "eduia_current_section";
const SCROLL_PERCENTAGE_KEY = "eduia_scroll_percentage";
const LAST_VISIT_KEY = "eduia_last_visit";
const CACHE_EXPIRY_HOURS = 24; // Expirar caché después de 24 horas

const App = () => {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [scrollRestaurado, setScrollRestaurado] = useState(false);
  const [seccionesListas, setSeccionesListas] = useState(0);
  const lenisRef = useRef(null);
  const observerRef = useRef(null);
  const seccionActualRef = useRef(null);

  // Verificar si el caché es válido (no expirado)
  const esCacheValido = useCallback(() => {
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
    if (!lastVisit) return false;
    
    const horasTranscurridas = (Date.now() - parseInt(lastVisit, 10)) / (1000 * 60 * 60);
    return horasTranscurridas < CACHE_EXPIRY_HOURS;
  }, []);

  // Limpiar caché expirado
  const limpiarCacheExpirado = useCallback(() => {
    if (!esCacheValido()) {
      localStorage.removeItem(SCROLL_POSITION_KEY);
      localStorage.removeItem(CURRENT_SECTION_KEY);
      localStorage.removeItem(SCROLL_PERCENTAGE_KEY);
      localStorage.removeItem(LAST_VISIT_KEY);
    }
  }, [esCacheValido]);

  // Memoizar cálculo de estadísticas para evitar recálculos innecesarios
  const estadisticasGenerales = useMemo(() => {
    if (!datos) return null;
    
    const totalSesiones = datos.length;
    const satisfaccionPromedio = (
      datos.reduce((sum, d) => sum + (d.satisfaccion || 0), 0) / totalSesiones
    ).toFixed(1);
    const duracionPromedio = (
      datos.reduce((sum, d) => sum + (d.duracionMinutos || 0), 0) / totalSesiones
    ).toFixed(0);
    const porcentajeReutilizacion = (
      (datos.filter((d) => d.usoPosterior === "Sí").length / totalSesiones) * 100
    ).toFixed(0);

    return {
      totalSesiones,
      satisfaccionPromedio,
      duracionPromedio,
      porcentajeReutilizacion,
    };
  }, [datos]);

  // Guardar posición de scroll periódicamente (usar localStorage para persistencia)
  const guardarPosicionScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercentage = documentHeight > 0 ? (scrollY / documentHeight) * 100 : 0;
    
    localStorage.setItem(SCROLL_POSITION_KEY, scrollY.toString());
    localStorage.setItem(SCROLL_PERCENTAGE_KEY, scrollPercentage.toString());
    localStorage.setItem(LAST_VISIT_KEY, Date.now().toString());
    
    // Detectar sección actual basándose en las secciones visibles
    const secciones = document.querySelectorAll('[data-seccion]');
    let seccionActual = '';
    let mejorVisibilidad = 0;
    
    secciones.forEach((seccion) => {
      const rect = seccion.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // Calcular qué porcentaje de la sección es visible
      const visibleTop = Math.max(0, rect.top);
      const visibleBottom = Math.min(viewportHeight, rect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const visibilityRatio = visibleHeight / viewportHeight;
      
      // También considerar si el centro de la sección está visible
      const centroSeccion = rect.top + rect.height / 2;
      const estaCentrada = centroSeccion >= 0 && centroSeccion <= viewportHeight;
      
      if (visibilityRatio > mejorVisibilidad || (estaCentrada && visibilityRatio >= 0.3)) {
        mejorVisibilidad = visibilityRatio;
        seccionActual = seccion.getAttribute('data-seccion');
      }
    });
    
    if (seccionActual && seccionActual !== seccionActualRef.current) {
      seccionActualRef.current = seccionActual;
      localStorage.setItem(CURRENT_SECTION_KEY, seccionActual);
    }
  }, []);

  // Restaurar posición de scroll al cargar (mejorado)
  const restaurarPosicionScroll = useCallback(() => {
    if (!esCacheValido()) {
      setScrollRestaurado(true);
      return;
    }

    const savedSection = localStorage.getItem(CURRENT_SECTION_KEY);
    const savedPercentage = localStorage.getItem(SCROLL_PERCENTAGE_KEY);
    
    if (!savedSection && !savedPercentage) {
      setScrollRestaurado(true);
      return;
    }

    // Función para intentar restaurar la posición
    const intentarRestaurar = (intentos = 0) => {
      const maxIntentos = 10;
      
      // Primero intentar ir a la sección guardada
      if (savedSection) {
        const seccionElement = document.querySelector(`[data-seccion="${savedSection}"]`);
        
        if (seccionElement) {
          // Verificar que la sección tenga contenido cargado (altura > mínimo)
          const rect = seccionElement.getBoundingClientRect();
          
          if (rect.height > 100 || intentos >= maxIntentos) {
            // Deshabilitar Lenis temporalmente para evitar interferencias
            if (lenisRef.current) {
              lenisRef.current.stop();
            }
            
            // Scroll instantáneo a la sección
            seccionElement.scrollIntoView({ behavior: 'instant', block: 'start' });
            
            // Si tenemos porcentaje guardado, hacer ajuste fino
            if (savedPercentage) {
              const percentage = parseFloat(savedPercentage);
              const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
              const targetPosition = (percentage / 100) * documentHeight;
              
              // Solo ajustar si estamos cerca de la posición correcta
              setTimeout(() => {
                window.scrollTo({ top: targetPosition, behavior: 'instant' });
                
                // Reactivar Lenis
                setTimeout(() => {
                  if (lenisRef.current) {
                    lenisRef.current.start();
                  }
                  setScrollRestaurado(true);
                }, 100);
              }, 50);
            } else {
              // Reactivar Lenis
              setTimeout(() => {
                if (lenisRef.current) {
                  lenisRef.current.start();
                }
                setScrollRestaurado(true);
              }, 100);
            }
            return;
          }
        }
      }
      
      // Si no encontramos la sección o no tiene altura, reintentar
      if (intentos < maxIntentos) {
        setTimeout(() => intentarRestaurar(intentos + 1), 200);
      } else {
        // Fallback: usar porcentaje de scroll
        if (savedPercentage) {
          const percentage = parseFloat(savedPercentage);
          const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
          const targetPosition = (percentage / 100) * documentHeight;
          window.scrollTo({ top: targetPosition, behavior: 'instant' });
        }
        setScrollRestaurado(true);
      }
    };

    // Iniciar restauración después de un pequeño delay
    setTimeout(() => intentarRestaurar(0), 100);
  }, [esCacheValido]);

  // Efecto para manejar eventos de guardado antes de salir
  useEffect(() => {
    // Limpiar caché expirado al inicio
    limpiarCacheExpirado();

    const handleBeforeUnload = () => {
      guardarPosicionScroll();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        guardarPosicionScroll();
      }
    };

    // Throttle para el evento de scroll (cada 100ms máximo)
    let scrollTimeout;
    const handleScroll = () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        guardarPosicionScroll();
        scrollTimeout = null;
      }, 100);
    };

    // Guardar posición cada 3 segundos mientras el usuario navega
    const intervalId = setInterval(guardarPosicionScroll, 3000);

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // También escuchar pagehide para móviles
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      clearInterval(intervalId);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [guardarPosicionScroll, limpiarCacheExpirado]);

  useEffect(() => {
    // Configurar scroll suave con Lenis (optimizado)
    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.2,
      touchMultiplier: 2,
      infinite: false,
    });

    lenisRef.current = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Cargar datos (ahora con cache)
    const inicializar = async () => {
      try {
        const datosCSV = await cargarDatos();
        setDatos(datosCSV);
        setCargando(false);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setCargando(false);
      }
    };

    inicializar();

    return () => {
      lenis.destroy();
    };
  }, []);

  // Restaurar scroll después de que los datos estén cargados y las secciones renderizadas
  useEffect(() => {
    if (!cargando && datos && !scrollRestaurado) {
      // Usar MutationObserver para detectar cuando el DOM está estable
      const observer = new MutationObserver((mutations, obs) => {
        // Verificar si las secciones principales ya tienen contenido
        const secciones = document.querySelectorAll('[data-seccion]');
        let seccionesCargadas = 0;
        
        secciones.forEach((seccion) => {
          if (seccion.getBoundingClientRect().height > 50) {
            seccionesCargadas++;
          }
        });
        
        // Si la mayoría de secciones están cargadas, restaurar scroll
        if (seccionesCargadas >= Math.min(secciones.length, 3)) {
          obs.disconnect();
          restaurarPosicionScroll();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false
      });

      observerRef.current = observer;

      // Timeout de seguridad: restaurar después de 2 segundos máximo
      const timeoutId = setTimeout(() => {
        observer.disconnect();
        if (!scrollRestaurado) {
          restaurarPosicionScroll();
        }
      }, 2000);

      return () => {
        observer.disconnect();
        clearTimeout(timeoutId);
      };
    }
  }, [cargando, datos, scrollRestaurado, restaurarPosicionScroll]);

  if (cargando) {
    return (
      <div className="cargando">
        <div className="spinner"></div>
        <p>Cargando la historia de los datos...</p>
      </div>
    );
  }

  return (
    <div className="contenedor-principal">
      {/* Menú interactivo con música */}
      <MenuInteractivo />

      <section data-seccion="intro">
        <Intro />
      </section>

      {/* Contexto inicial con estadísticas */}
      {estadisticasGenerales && (
        <section data-seccion="estadisticas">
          <EstadisticaDestacada
            items={[
              {
                icono: Users,
                numero: estadisticasGenerales.totalSesiones,
                etiqueta: "Sesiones Analizadas",
                descripcion: "Estudiantes reales compartiendo su experiencia",
              },
              {
                icono: Clock,
                numero: `${estadisticasGenerales.duracionPromedio} min`,
                etiqueta: "Duración Promedio",
                descripcion: "Tiempo invertido por sesión",
              },
              {
                icono: Star,
                numero: `${estadisticasGenerales.satisfaccionPromedio}/5`,
                etiqueta: "Satisfacción Media",
                descripcion: "Nivel general de satisfacción",
              },
              {
                icono: RotateCw,
                numero: `${estadisticasGenerales.porcentajeReutilizacion}%`,
                etiqueta: "Volverían a Usar",
                descripcion: "Estudiantes que confían en la IA",
              },
            ]}
          />
        </section>
      )}

      {/* Transición narrativa al primer objetivo */}
      <TransicionNarrativa
        texto="Pero estas cifras solo rascan la superficie. La verdadera historia está en los patrones: ¿quiénes usan la IA y para qué?"
        estadistica={{
          numero: "3 niveles",
          descripcion: "Secundaria, Pregrado y Posgrado explorando la IA",
        }}
      />

      <section data-seccion="objetivo-uso">
        <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--color-fondo)' }} />}>
          <ObjetivoUso datos={datos} />
        </Suspense>
      </section>

      {/* Transición al segundo objetivo */}
      <TransicionNarrativa
        texto="Ahora sabemos quiénes y para qué. Pero hay una pregunta crucial: ¿están realmente satisfechos con la experiencia?"
        contexto="La satisfacción no es solo un número, es la diferencia entre una herramienta útil y una frustración más."
      />

      <section data-seccion="objetivo-satisfaccion">
        <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--color-fondo-secundario)' }} />}>
          <ObjetivoSatisfaccion datos={datos} />
        </Suspense>
      </section>

      {/* Transición al tercer objetivo */}
      <TransicionNarrativa
        estadistica={{
          numero: `${estadisticasGenerales.porcentajeReutilizacion}%`,
          descripcion: "de estudiantes volverían a usar la IA",
        }}
        texto="La verdadera prueba de fuego: ¿volverían a usar la IA? Pero más importante aún: ¿qué hace que un estudiante vuelva?"
      />

      <section data-seccion="objetivo-reutilizacion">
        <Suspense fallback={<div style={{ minHeight: '100vh', background: '#1a1f3a' }} />}>
          <ObjetivoReutilizacion datos={datos} />
        </Suspense>
      </section>

      {/* Transición a conclusiones */}
      <TransicionNarrativa
        texto="Los datos han hablado. Ahora es momento de conectar los puntos y entender el panorama completo."
      />

      <section data-seccion="conclusiones">
        <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--color-fondo)' }} />}>
          <Conclusiones />
        </Suspense>
      </section>

      <section data-seccion="tecnologias">
        <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--color-fondo)' }} />}>
          <TecnologiasUsadas />
        </Suspense>
      </section>
    </div>
  );
};

export default App;
