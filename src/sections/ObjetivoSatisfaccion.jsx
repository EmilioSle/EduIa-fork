import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as d3 from "d3";
import { Clock, Target, Search } from "lucide-react";
import imagen4 from "../assets/images/imagen4.png";
import imagen5 from "../assets/images/imagen5.png";
import { OBJETIVOS_ANALITICOS } from "../utils/objetivos";
import BarChartOptimizado from "../components/charts/BarChartOptimizado";
import "../styles/objetivo.css";

gsap.registerPlugin(ScrollTrigger);

const ObjetivoSatisfaccion = ({ datos }) => {
  const seccionRef = useRef(null);
  const graficoScatterRef = useRef(null);
  const [graficosCreados, setGraficosCreados] = useState(false);

  const objetivo = OBJETIVOS_ANALITICOS[1];

  // Preparar datos para el gráfico de barras
  const datosBarras = datos ? (() => {
    const datosValidos = datos.filter((d) => d.satisfaccion > 0);
    const promediosPorAsistencia = d3.rollup(
      datosValidos,
      (v) => ({
        promedio: d3.mean(v, (d) => d.satisfaccion),
        cantidad: v.length
      }),
      (d) => d.nivelAsistenciaIA
    );
    return Array.from(
      promediosPorAsistencia,
      ([nivel, datos]) => ({
        nivel: `Nivel ${nivel}`,
        promedio: datos.promedio,
        cantidad: datos.cantidad,
      })
    ).sort((a, b) => {
      const nivelA = parseInt(a.nivel.replace('Nivel ', ''));
      const nivelB = parseInt(b.nivel.replace('Nivel ', ''));
      return nivelA - nivelB;
    });
  })() : [];

  useEffect(() => {
    if (!datos || graficosCreados) return;

    const ctx = gsap.context(() => {
      gsap.from(".titulo-objetivo-2", {
        scrollTrigger: {
          trigger: seccionRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
        opacity: 0,
        x: 100,
        duration: 1,
        ease: "power3.out",
      });

      ScrollTrigger.create({
        trigger: graficoScatterRef.current,
        start: "top 70%",
        onEnter: () => {
          if (graficoScatterRef.current && !graficosCreados) {
            crearGraficoScatter();
          }
        },
      });
    }, seccionRef);

    // Listener para redimensionamiento de ventana
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (graficosCreados) {
          crearGraficoScatter();
        }
      }, 250);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      ctx.revert();
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [datos, graficosCreados]);

  const crearGraficoScatter = () => {
    if (!graficoScatterRef.current) return;

    d3.select(graficoScatterRef.current).selectAll("*").remove();

    // Filtrar datos válidos
    const datosValidos = datos.filter(
      (d) => d.duracionMinutos > 0 && d.satisfaccion > 0
    );

    // Configuración responsiva
    const containerWidth = graficoScatterRef.current.clientWidth;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    const margin = isMobile 
      ? { top: 30, right: 25, bottom: 70, left: 50 }
      : isTablet
      ? { top: 30, right: 30, bottom: 70, left: 60 }
      : { top: 30, right: 30, bottom: 70, left: 70 };
    
    // Desktop: tamaño fijo original, móvil/tablet: responsivo
    const width = isMobile || isTablet 
      ? Math.max(300, containerWidth - 40) - margin.left - margin.right
      : 700 - margin.left - margin.right;
    const height = isMobile ? 350 : isTablet ? 400 : 450;

    const svg = d3
      .select(graficoScatterRef.current)
      .append("svg")
      .attr("width", isMobile || isTablet ? "100%" : width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Escalas
    const x = d3
      .scaleLinear()
      .domain([0, d3.max(datosValidos, (d) => d.duracionMinutos) * 1.1])
      .range([0, width])
      .nice();

    const y = d3.scaleLinear()
      .domain([0, 5])
      .range([height, 0])
      .nice();

    // Escala de color basada en satisfacción (gradiente)
    const colorScale = d3.scaleSequential()
      .domain([1, 5])
      .interpolator(d3.interpolateViridis);

    // Agregar grid para mejor referencia visual
    svg.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.1)
      .call(
        d3.axisLeft(y)
          .tickSize(-width)
          .tickFormat("")
      )
      .selectAll("line")
      .style("stroke", "#fff");

    svg.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.1)
      .attr("transform", `translate(0,${height})`)
      .call(
        d3.axisBottom(x)
          .tickSize(-height)
          .tickFormat("")
      )
      .selectAll("line")
      .style("stroke", "#fff");

    // Ejes principales
    const xAxis = svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(isMobile ? 5 : 8));

    xAxis.selectAll("text")
      .style("font-size", "13px")
      .style("fill", "#fff");

    xAxis.selectAll("line, path")
      .style("stroke", "#fff")
      .style("stroke-width", 2);

    const yAxis = svg.append("g")
      .call(d3.axisLeft(y).ticks(5));

    yAxis.selectAll("text")
      .style("font-size", "13px")
      .style("fill", "#fff");

    yAxis.selectAll("line, path")
      .style("stroke", "#fff")
      .style("stroke-width", 2);

    // Etiquetas de ejes
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + 50)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .style("fill", "#00d9ff")
      .text("Duración de la Sesión (minutos)");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .style("fill", "#00d9ff")
      .text("Nivel de Satisfacción");

    // Calcular línea de tendencia (regresión lineal)
    const xMean = d3.mean(datosValidos, d => d.duracionMinutos);
    const yMean = d3.mean(datosValidos, d => d.satisfaccion);
    
    let numerator = 0;
    let denominator = 0;
    datosValidos.forEach(d => {
      numerator += (d.duracionMinutos - xMean) * (d.satisfaccion - yMean);
      denominator += (d.duracionMinutos - xMean) ** 2;
    });
    
    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;

    // Dibujar línea de tendencia
    const lineData = [
      { x: 0, y: intercept },
      { x: d3.max(datosValidos, d => d.duracionMinutos), y: intercept + slope * d3.max(datosValidos, d => d.duracionMinutos) }
    ];

    svg.append("path")
      .datum(lineData)
      .attr("fill", "none")
      .attr("stroke", "#ff0066")
      .attr("stroke-width", 2.5)
      .attr("stroke-dasharray", "8,4")
      .attr("opacity", 0)
      .attr("d", d3.line()
        .x(d => x(d.x))
        .y(d => y(d.y))
      )
      .transition()
      .duration(1500)
      .delay(1000)
      .attr("opacity", 0.8);

    // Crear tooltip
    const tooltip = d3
      .select(graficoScatterRef.current)
      .append("div")
      .attr("class", "tooltip-grafico")
      .style("opacity", 0);

    // Puntos con animación y color según satisfacción
    svg
      .selectAll(".punto")
      .data(datosValidos)
      .enter()
      .append("circle")
      .attr("class", "punto")
      .attr("cx", (d) => x(d.duracionMinutos))
      .attr("cy", (d) => y(d.satisfaccion))
      .attr("r", 0)
      .attr("fill", d => colorScale(d.satisfaccion))
      .attr("opacity", 0.7)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 10)
          .attr("opacity", 1)
          .attr("stroke-width", 2.5);
        
        tooltip.transition().duration(200).style("opacity", 0.95);
        tooltip
          .html(
            `<strong>Duración:</strong> ${d.duracionMinutos.toFixed(1)} min<br/>
             <strong>Satisfacción:</strong> ${d.satisfaccion.toFixed(1)}/5<br/>
             <strong>Nivel:</strong> ${d.nivelEducativo}<br/>
             <strong>Tarea:</strong> ${d.tipoTarea}`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseleave", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", isMobile ? 4 : 5)
          .attr("opacity", 0.7)
          .attr("stroke-width", 1.5);
        tooltip.transition().duration(200).style("opacity", 0);
      })
      .transition()
      .duration(1200)
      .delay((d, i) => i * 2)
      .attr("r", isMobile ? 4 : 5)
      .ease(d3.easeCubicOut);

    // Agregar leyenda de colores
    const legendWidth = isMobile ? 150 : 200;
    const legendHeight = 10;
    
    const legendGroup = svg.append("g")
      .attr("transform", `translate(${width - legendWidth - 10}, -5)`);

    const legendScale = d3.scaleLinear()
      .domain([1, 5])
      .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5)
      .tickSize(0);

    // Crear gradiente para la leyenda
    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
      .attr("id", "legend-gradient");

    linearGradient.selectAll("stop")
      .data(d3.range(0, 1.01, 0.1))
      .enter().append("stop")
      .attr("offset", d => `${d * 100}%`)
      .attr("stop-color", d => colorScale(1 + d * 4));

    legendGroup.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)")
      .attr("rx", 3);

    legendGroup.append("g")
      .attr("transform", `translate(0, ${legendHeight})`)
      .call(legendAxis)
      .selectAll("text")
      .style("fill", "#fff")
      .style("font-size", "11px");

    legendGroup.append("text")
      .attr("x", legendWidth / 2)
      .attr("y", -8)
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#fff")
      .style("font-weight", "500")
      .text("Satisfacción");
    
    setGraficosCreados(true);
  };

  return (
    <section ref={seccionRef} className="seccion-objetivo objetivo-2">
      <div className="contenido-objetivo">
        <div className="encabezado-objetivo">
          <h2 className="titulo-objetivo titulo-objetivo-2">{objetivo.titulo}</h2>
          <p className="descripcion-objetivo">
            Conocer los números es importante, pero la satisfacción cuenta la 
            historia real. ¿Qué hace que un estudiante termine su sesión sintiéndose 
            ayudado versus frustrado? Los datos revelan patrones sorprendentes...
          </p>
        </div>

        <div className="grafico-contenedor">
          <h3 className="titulo-grafico">El Mito del "Más es Mejor"</h3>
          <div ref={graficoScatterRef} className="grafico"></div>
          <img src={imagen4} alt="Relación duración y satisfacción" className="imagen-grafico imagen-grafico-pequena" />
          <p className="explicacion-grafico">
            <Clock className="icono-inline" size={20} strokeWidth={1.5} /> <strong>Descubrimiento contraintuitivo:</strong> Las sesiones más 
            largas no garantizan mayor satisfacción. De hecho, la relación es más 
            compleja. Los estudiantes más satisfechos tienden a tener sesiones 
            enfocadas y eficientes, no necesariamente las más largas. ¿La lección? 
            La calidad supera a la cantidad.
          </p>
        </div>

        <div className="grafico-contenedor">
          <h3 className="titulo-grafico">El Factor Decisivo: Nivel de Asistencia</h3>
          <BarChartOptimizado
            datos={datosBarras}
            categoriaKey="nivel"
            valorKey="promedio"
            tituloX="Nivel de Asistencia de la IA"
            tituloY="Satisfacción Promedio"
            height={500}
            showValues={true}
            showReferenceLine={true}
            referenceValue={4.0}
            referenceLabel="Meta"
            className="grafico-barras-optimizado"
          />
          <img src={imagen5} alt="Nivel de asistencia y satisfacción" className="imagen-grafico" />
          <p className="explicacion-grafico">
            <Target className="icono-inline" size={20} strokeWidth={1.5} /> <strong>La correlación que importa:</strong> Cuando la IA realmente 
            ayuda (niveles de asistencia altos), la satisfacción se dispara. Esto 
            valida algo fundamental: los estudiantes no buscan que la IA haga su 
            trabajo, buscan que los ayude a hacerlo mejor.
          </p>
        </div>

        <div className="conclusion-seccion">
          <Search className="icono-conclusion-seccion" size={40} strokeWidth={1.5} />
          <p className="texto-conclusion">
            <strong>La Verdad Revelada:</strong> La satisfacción no se trata de 
            interacciones largas o respuestas rápidas. Se trata de asistencia 
            efectiva que verdaderamente ayuda al estudiante a alcanzar sus objetivos 
            académicos.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ObjetivoSatisfaccion;
