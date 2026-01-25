import { useEffect, useState, lazy, Suspense, useMemo, useCallback } from "react";
import Lenis from "@studio-freight/lenis";
import { Users, Clock, Star, RotateCw } from "lucide-react";
import { cargarDatos } from "./services/servicioDatos";
import Intro from "./sections/Intro";
import TransicionNarrativa from "./components/TransicionNarrativa";
import EstadisticaDestacada from "./components/EstadisticaDestacada";
import "./styles/global.css";

// Lazy loading de secciones pesadas
const ObjetivoUso = lazy(() => import(/* webpackChunkName: "objetivo-uso" */ "./sections/ObjetivoUso"));
const ObjetivoSatisfaccion = lazy(() => import(/* webpackChunkName: "objetivo-satisfaccion" */ "./sections/ObjetivoSatisfaccion"));
const ObjetivoReutilizacion = lazy(() => import(/* webpackChunkName: "objetivo-reutilizacion" */ "./sections/ObjetivoReutilizacion"));
const Conclusiones = lazy(() => import(/* webpackChunkName: "conclusiones" */ "./sections/Conclusiones"));
const TecnologiasUsadas = lazy(() => import(/* webpackChunkName: "tecnologias" */ "./sections/tegnologiaUsadas"));

const App = () => {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

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
      <Intro />

      {/* Contexto inicial con estadísticas */}
      {estadisticasGenerales && (
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
      )}

      {/* Transición narrativa al primer objetivo */}
      <TransicionNarrativa
        texto="Pero estas cifras solo rascan la superficie. La verdadera historia está en los patrones: ¿quiénes usan la IA y para qué?"
        estadistica={{
          numero: "3 niveles",
          descripcion: "Secundaria, Pregrado y Posgrado explorando la IA",
        }}
      />

      <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--color-fondo)' }} />}>
        <ObjetivoUso datos={datos} />
      </Suspense>

      {/* Transición al segundo objetivo */}
      <TransicionNarrativa
        texto="Ahora sabemos quiénes y para qué. Pero hay una pregunta crucial: ¿están realmente satisfechos con la experiencia?"
        contexto="La satisfacción no es solo un número, es la diferencia entre una herramienta útil y una frustración más."
      />

      <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--color-fondo-secundario)' }} />}>
        <ObjetivoSatisfaccion datos={datos} />
      </Suspense>

      {/* Transición al tercer objetivo */}
      <TransicionNarrativa
        estadistica={{
          numero: `${estadisticasGenerales.porcentajeReutilizacion}%`,
          descripcion: "de estudiantes volverían a usar la IA",
        }}
        texto="La verdadera prueba de fuego: ¿volverían a usar la IA? Pero más importante aún: ¿qué hace que un estudiante vuelva?"
      />

      <Suspense fallback={<div style={{ minHeight: '100vh', background: '#1a1f3a' }} />}>
        <ObjetivoReutilizacion datos={datos} />
      </Suspense>

      {/* Transición a conclusiones */}
      <TransicionNarrativa
        texto="Los datos han hablado. Ahora es momento de conectar los puntos y entender el panorama completo."
      />

      <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--color-fondo)' }} />}>
        <Conclusiones />
      </Suspense>

      <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--color-fondo)' }} />}>
        <TecnologiasUsadas />
      </Suspense>
    </div>
  );
};

export default App;
