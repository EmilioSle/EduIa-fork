import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as d3 from "d3";
import { Clock, Target, Search } from "lucide-react";
import imagen4 from "../assets/images/imagen4.png";
import imagen5 from "../assets/images/imagen5.png";
import { OBJETIVOS_ANALITICOS } from "../utils/objetivos";
import "../styles/objetivo.css";

gsap.registerPlugin(ScrollTrigger);

const ObjetivoSatisfaccion = ({ datos }) => {
  const seccionRef = useRef(null);
  const graficoScatterRef = useRef(null);
  const graficoBarrasRef = useRef(null);
  const [graficosCreados, setGraficosCreados] = useState(false);

  const objetivo = OBJETIVOS_ANALITICOS[1];

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

      ScrollTrigger.create({
        trigger: graficoBarrasRef.current,
        start: "top 70%",
        onEnter: () => {
          if (graficoBarrasRef.current && !graficosCreados) {
            crearGraficoBarras();
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
          crearGraficoBarras();
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
      : 600 - margin.left - margin.right;
    const height = isMobile ? 350 : isTablet ? 380 : 400;

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
      .range([0, width]);

    const y = d3.scaleLinear().domain([0, 5]).range([height, 0]);

    // Ejes
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(8))
      .selectAll("text")
      .style("font-size", "13px")
      .style("fill", "#fff");

    svg.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .style("font-size", "13px")
      .style("fill", "#fff");

    // Etiquetas
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + 50)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#fff")
      .text("Duración de la Sesión (minutos)");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#fff")
      .text("Nivel de Satisfacción");

    // Crear tooltip
    const tooltip = d3
      .select(graficoScatterRef.current)
      .append("div")
      .attr("class", "tooltip-grafico")
      .style("opacity", 0);

    // Puntos con animación
    svg
      .selectAll(".punto")
      .data(datosValidos)
      .enter()
      .append("circle")
      .attr("class", "punto")
      .attr("cx", (d) => x(d.duracionMinutos))
      .attr("cy", (d) => y(d.satisfaccion))
      .attr("r", 0)
      .attr("fill", "#00ff9f")
      .attr("opacity", 0.6)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        d3.select(this).transition().duration(200).attr("r", 8).attr("opacity", 1);
        
        tooltip.transition().duration(200).style("opacity", 0.95);
        tooltip
          .html(
            `<strong>Duración:</strong> ${d.duracionMinutos.toFixed(1)} min<br/>
             <strong>Satisfacción:</strong> ${d.satisfaccion.toFixed(1)}/5<br/>
             <strong>Nivel:</strong> ${d.nivelEducativo}`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseleave", function (event, d) {
        d3.select(this).transition().duration(200).attr("r", 5).attr("opacity", 0.6);
        tooltip.transition().duration(200).style("opacity", 0);
      })
      .transition()
      .duration(1000)
      .delay((d, i) => i * 3)
      .attr("r", 5);
  };

  const crearGraficoBarras = () => {
    if (!graficoBarrasRef.current) return;

    d3.select(graficoBarrasRef.current).selectAll("*").remove();

    // Calcular satisfacción promedio por nivel de asistencia
    const datosValidos = datos.filter((d) => d.satisfaccion > 0);
    
    const promediosPorAsistencia = d3.rollup(
      datosValidos,
      (v) => d3.mean(v, (d) => d.satisfaccion),
      (d) => d.nivelAsistenciaIA
    );

    const datosArray = Array.from(
      promediosPorAsistencia,
      ([nivel, promedio]) => ({
        nivel: `Nivel ${nivel}`,
        promedio,
      })
    ).sort((a, b) => a.nivel.localeCompare(b.nivel));

    // Configuración responsiva
    const containerWidth = graficoBarrasRef.current.clientWidth;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    const margin = isMobile 
      ? { top: 30, right: 20, bottom: 90, left: 60 }
      : isTablet
      ? { top: 35, right: 30, bottom: 90, left: 70 }
      : { top: 40, right: 40, bottom: 90, left: 80 };
    
    // Desktop: tamaño fijo original, móvil/tablet: responsivo
    const width = isMobile || isTablet 
      ? Math.max(300, containerWidth - 40) - margin.left - margin.right
      : 700 - margin.left - margin.right;
    const height = isMobile ? 350 : isTablet ? 400 : 450;

    const svg = d3
      .select(graficoBarrasRef.current)
      .append("svg")
      .attr("width", isMobile || isTablet ? "100%" : width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .range([0, width])
      .domain(datosArray.map((d) => d.nivel))
      .padding(0.3);

    const y = d3.scaleLinear().domain([0, 5]).range([height, 0]);

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "middle")
      .style("font-size", "13px")
      .style("fill", "#fff");

    svg.append("g").call(d3.axisLeft(y).ticks(5));

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + 50)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#fff")
      .text("Nivel de Asistencia de la IA");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#fff")
      .text("Satisfacción Promedio");

    // Crear barras
    svg
      .selectAll(".barra")
      .data(datosArray)
      .enter()
      .append("rect")
      .attr("class", "barra")
      .attr("x", (d) => x(d.nivel))
      .attr("width", x.bandwidth())
      .attr("y", height)
      .attr("height", 0)
      .attr("fill", "#ff00ff")
      .attr("opacity", 0.8)
      .transition()
      .duration(1500)
      .delay((d, i) => i * 200)
      .attr("y", (d) => y(d.promedio))
      .attr("height", (d) => height - y(d.promedio))
      .ease(d3.easeBounceOut);

    // Valores
    svg
      .selectAll(".etiqueta-valor")
      .data(datosArray)
      .enter()
      .append("text")
      .attr("class", "etiqueta-valor")
      .attr("x", (d) => x(d.nivel) + x.bandwidth() / 2)
      .attr("y", height)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", "#fff")
      .style("opacity", 0)
      .text((d) => d.promedio.toFixed(1))
      .transition()
      .duration(1000)
      .delay((d, i) => i * 200 + 500)
      .attr("y", (d) => y(d.promedio) - 10)
      .style("opacity", 1);

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
          <div ref={graficoBarrasRef} className="grafico"></div>
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
