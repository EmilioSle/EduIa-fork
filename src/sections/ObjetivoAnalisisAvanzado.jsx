import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BarChart3, Radar, LayoutGrid, Sparkles } from "lucide-react";
import { OBJETIVOS_ANALITICOS } from "../utils/objetivos";
import {
  StackedBarChartFlujo,
  RadarChartPatrones,
  TreemapTareas,
} from "../components/charts";
import ControlesInteractivos from "../components/ControlesInteractivos";
import "../styles/objetivo.css";

gsap.registerPlugin(ScrollTrigger);

/**
 * Sección de análisis avanzado con gráficos interactivos:
 * - Barras Apiladas: Distribución por nivel educativo
 * - Radar: Comparación de patrones entre niveles
 * - Treemap: Distribución jerárquica de tareas
 */
const ObjetivoAnalisisAvanzado = ({ datos }) => {
  const seccionRef = useRef(null);
  const sunburstRef = useRef(null);
  const radarRef = useRef(null);
  const treemapRef = useRef(null);

  const [sunburstVisible, setSunburstVisible] = useState(false);
  const [radarVisible, setRadarVisible] = useState(false);
  const [treemapVisible, setTreemapVisible] = useState(false);

  const [datosFiltrados, setDatosFiltrados] = useState(null);
  const [filtrosActivos, setFiltrosActivos] = useState({});

  useEffect(() => {
    if (datos) {
      setDatosFiltrados(datos);
    }
  }, [datos]);

  useEffect(() => {
    if (!datos) return;

    const ctx = gsap.context(() => {
      // Animación del título
      gsap.from(".titulo-avanzado", {
        scrollTrigger: {
          trigger: seccionRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
        opacity: 0,
        y: 60,
        duration: 1,
        ease: "power3.out",
      });

      // Trigger para Sunburst
      ScrollTrigger.create({
        trigger: sunburstRef.current,
        start: "top 85%",
        onEnter: () => {
          if (!sunburstVisible) setSunburstVisible(true);
        },
      });

      // Trigger para Radar
      ScrollTrigger.create({
        trigger: radarRef.current,
        start: "top 85%",
        onEnter: () => {
          if (!radarVisible) setRadarVisible(true);
        },
      });

      // Trigger para Treemap
      ScrollTrigger.create({
        trigger: treemapRef.current,
        start: "top 85%",
        onEnter: () => {
          if (!treemapVisible) setTreemapVisible(true);
        },
      });
    }, seccionRef);

    return () => ctx.revert();
  }, [datos, sunburstVisible, radarVisible, treemapVisible]);

  const handleFiltrosChange = ({ filtros, datosFiltrados: nuevosDatos }) => {
    setFiltrosActivos(filtros);
    setDatosFiltrados(nuevosDatos);
  };

  const datosActuales = datosFiltrados || datos;

  return (
    <section ref={seccionRef} className="seccion-objetivo seccion-avanzado">
      <div className="contenido-objetivo">
        <div className="encabezado-objetivo">
          <h2 className="titulo-objetivo titulo-avanzado">
            <Sparkles className="icono-titulo" size={32} />
            Análisis Avanzado: Visualizaciones Interactivas
          </h2>
          <p className="descripcion-objetivo">
            Exploremos los datos desde múltiples perspectivas. Estos gráficos avanzados
            revelan patrones ocultos y conexiones que no son evidentes a simple vista.
            <strong> Interactúa con ellos</strong> para descubrir insights personalizados.
          </p>
        </div>

        {/* Controles Interactivos */}
        {datos && (
          <ControlesInteractivos
            datos={datos}
            onFiltrosChange={handleFiltrosChange}
            mostrarFiltroNivel={true}
            mostrarFiltroFecha={true}
            mostrarToggleComparar={true}
          />
        )}

        {/* Gráfico de Barras Apiladas */}
        <div className="grafico-contenedor grafico-avanzado">
          <h3 className="titulo-grafico">
            <BarChart3 size={24} className="icono-grafico" />
            ¿Qué Hacen los Estudiantes con la IA?
          </h3>
          <p className="subtitulo-grafico">
            Compara cómo cada nivel educativo usa la IA. Usa los botones para ver 
            la distribución por tipo de tarea o por resultado obtenido.
          </p>
          <div ref={sunburstRef} className="grafico-wrapper grafico-wrapper-grande">
            {sunburstVisible && datosActuales && (
              <div className="grafico-entrada">
                <StackedBarChartFlujo
                  datos={datosActuales}
                  filtroNivel={filtrosActivos.nivel}
                />
              </div>
            )}
          </div>
          <p className="explicacion-grafico">
            📊 <strong>Cómo leerlo:</strong> Cada barra horizontal representa un nivel educativo. 
            Los colores muestran la proporción de cada categoría. Pasa el cursor sobre 
            las barras para ver los números exactos y porcentajes.
          </p>
        </div>

        {/* Gráfico Radar */}
        <div className="grafico-contenedor grafico-avanzado">
          <h3 className="titulo-grafico">
            <Radar size={24} className="icono-grafico" />
            Perfil Comparativo: ¿Cómo Difieren los Niveles Educativos?
          </h3>
          <p className="subtitulo-grafico">
            Cada eje representa una métrica clave del uso de IA. Compara visualmente
            cómo cada nivel educativo se desempeña en diferentes dimensiones.
          </p>
          <div ref={radarRef} className="grafico-wrapper">
            {radarVisible && datosActuales && (
              <div className="grafico-entrada">
                <RadarChartPatrones
                  datos={datosActuales}
                  nivelesSeleccionados={
                    filtrosActivos.modoComparar && filtrosActivos.nivelesComparar?.length > 0
                      ? filtrosActivos.nivelesComparar
                      : null
                  }
                />
              </div>
            )}
          </div>
          <p className="explicacion-grafico">
            📐 <strong>Interpretación:</strong> Mientras más cerca del borde exterior,
            mejor es el desempeño en esa métrica. Los estudiantes de posgrado muestran
            mayor satisfacción, mientras que pregrado destaca en volumen de uso.
          </p>
        </div>

        {/* Gráfico Treemap */}
        <div className="grafico-contenedor grafico-avanzado">
          <h3 className="titulo-grafico">
            <LayoutGrid size={24} className="icono-grafico" />
            Mapa de Tareas: La Proporción de Cada Uso
          </h3>
          <p className="subtitulo-grafico">
            El tamaño de cada rectángulo es proporcional al número de sesiones.
            A mayor área, mayor es el uso de la IA para ese tipo de tarea.
          </p>
          <div ref={treemapRef} className="grafico-wrapper grafico-wrapper-grande">
            {treemapVisible && datosActuales && (
              <div className="grafico-entrada">
                <TreemapTareas
                  datos={datosActuales}
                  mostrarSubdivisiones={!filtrosActivos.nivel}
                />
              </div>
            )}
          </div>
          <p className="explicacion-grafico">
            🗺️ <strong>Descubrimiento:</strong> La redacción y el estudio dominan
            el paisaje del uso de IA. Haz clic en los filtros arriba para ver cómo
            cambia la distribución según el nivel educativo o el período de tiempo.
          </p>
        </div>

        {/* Conclusión de la sección */}
        <div className="conclusion-seccion conclusion-avanzado">
          <Sparkles className="icono-conclusion-seccion" size={40} strokeWidth={1.5} />
          <p className="texto-conclusion">
            <strong>Insight Avanzado:</strong> Los gráficos interactivos revelan que
            no existe un "usuario típico" de IA educativa. Cada nivel educativo tiene
            su propio patrón de uso, preferencias de tareas y resultados. La clave
            está en la personalización: la IA se adapta a las necesidades específicas
            de cada estudiante.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ObjetivoAnalisisAvanzado;
