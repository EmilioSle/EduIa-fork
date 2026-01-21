import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as d3 from "d3";
import { OBJETIVOS_ANALITICOS } from "../utils/objetivos";
import "../styles/objetivo.css";

gsap.registerPlugin(ScrollTrigger);

const ObjetivoUso = ({ datos }) => {
  const seccionRef = useRef(null);
  const graficoBarrasRef = useRef(null);
  const graficoDonutRef = useRef(null);
  const [graficosCreados, setGraficosCreados] = useState(false);

  const objetivo = OBJETIVOS_ANALITICOS[0];

  useEffect(() => {
    if (!datos || graficosCreados) return;

    const ctx = gsap.context(() => {
      // Animación del título al entrar
      gsap.from(".titulo-objetivo", {
        scrollTrigger: {
          trigger: seccionRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
        opacity: 0,
        x: -100,
        duration: 1,
        ease: "power3.out",
      });

      // Animación del gráfico de barras
      ScrollTrigger.create({
        trigger: graficoBarrasRef.current,
        start: "top 70%",
        onEnter: () => {
          if (graficoBarrasRef.current && !graficosCreados) {
            crearGraficoBarras();
          }
        },
      });

      // Animación del gráfico donut
      ScrollTrigger.create({
        trigger: graficoDonutRef.current,
        start: "top 70%",
        onEnter: () => {
          if (graficoDonutRef.current && !graficosCreados) {
            crearGraficoDonut();
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
          crearGraficoBarras();
          crearGraficoDonut();
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

  const crearGraficoBarras = () => {
    if (!graficoBarrasRef.current || graficosCreados) return;

    // Limpiar contenido previo
    d3.select(graficoBarrasRef.current).selectAll("*").remove();

    // Procesar datos: contar estudiantes por nivel educativo
    const datosPorNivel = d3.rollup(
      datos,
      (v) => v.length,
      (d) => d.nivelEducativo
    );

    const datosArray = Array.from(datosPorNivel, ([nivel, cantidad]) => ({
      nivel,
      cantidad,
    })).sort((a, b) => b.cantidad - a.cantidad);

    // Configuración responsiva del gráfico
    const containerWidth = graficoBarrasRef.current.clientWidth;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    const margin = isMobile 
      ? { top: 30, right: 20, bottom: 100, left: 60 }
      : isTablet
      ? { top: 35, right: 30, bottom: 100, left: 70 }
      : { top: 40, right: 40, bottom: 100, left: 80 };
    
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

    // Escalas
    const x = d3
      .scaleBand()
      .range([0, width])
      .domain(datosArray.map((d) => d.nivel))
      .padding(0.3);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(datosArray, (d) => d.cantidad)])
      .range([height, 0]);

    // Ejes
    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size", "13px")
      .style("fill", "#fff")
      .attr("dx", "-0.5em")
      .attr("dy", "0.15em");

    svg.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("font-size", "13px")
      .style("fill", "#fff");

    // Etiquetas de ejes
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + 70)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#fff")
      .text("Nivel Educativo");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#fff")
      .text("Número de Estudiantes");

    // Crear barras con animación
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
      .attr("fill", "#00d9ff")
      .attr("opacity", 0.8)
      .transition()
      .duration(1500)
      .delay((d, i) => i * 100)
      .attr("y", (d) => y(d.cantidad))
      .attr("height", (d) => height - y(d.cantidad))
      .ease(d3.easeBounceOut);

    // Agregar valores encima de las barras
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
      .text((d) => d.cantidad)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100 + 500)
      .attr("y", (d) => y(d.cantidad) - 10)
      .style("opacity", 1);
  };

  const crearGraficoDonut = () => {
    if (!graficoDonutRef.current) return;

    // Limpiar contenido previo
    d3.select(graficoDonutRef.current).selectAll("*").remove();

    // Procesar datos: contar por tipo de tarea
    const datosPorTarea = d3.rollup(
      datos,
      (v) => v.length,
      (d) => d.tipoTarea
    );

    const datosArray = Array.from(datosPorTarea, ([tarea, cantidad]) => ({
      tarea,
      cantidad,
    }));

    // Calcular total y porcentajes
    const total = d3.sum(datosArray, d => d.cantidad);
    datosArray.forEach(d => {
      d.porcentaje = ((d.cantidad / total) * 100).toFixed(1);
    });

    // Configuración responsiva
    const containerWidth = graficoDonutRef.current.clientWidth;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    // Desktop: tamaño fijo original con espacio para leyenda abajo
    const donutSize = isMobile 
      ? Math.min(300, containerWidth - 40) 
      : isTablet 
      ? 400 
      : 450;
    
    const legendHeight = isMobile ? 120 : isTablet ? 100 : 90;
    const width = isMobile ? donutSize : isTablet ? 550 : 650;
    const height = donutSize + legendHeight;
    const radius = donutSize / 2 - (isMobile ? 30 : 40);

    const svg = d3
      .select(graficoDonutRef.current)
      .append("svg")
      .attr("width", "100%")
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Escala de colores
    const color = d3
      .scaleOrdinal()
      .domain(datosArray.map((d) => d.tarea))
      .range(["#00d9ff", "#00ff9f", "#ff00ff", "#ffaa00", "#ff0066"]);

    // Crear arcos
    const pie = d3
      .pie()
      .value((d) => d.cantidad)
      .sort(null);

    const arc = d3
      .arc()
      .innerRadius(radius * 0.6)
      .outerRadius(radius);

    const arcHover = d3
      .arc()
      .innerRadius(radius * 0.6)
      .outerRadius(radius * 1.08);

    // Dibujar arcos con animación
    const arcos = svg
      .selectAll(".arco")
      .data(pie(datosArray))
      .enter()
      .append("g")
      .attr("class", "arco");

    arcos
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => color(d.data.tarea))
      .attr("opacity", 0.85)
      .attr("stroke", "#0a0e27")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arcHover)
          .attr("opacity", 1);
      })
      .on("mouseleave", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arc)
          .attr("opacity", 0.85);
      })
      .transition()
      .duration(1500)
      .delay((d, i) => i * 150)
      .attrTween("d", function (d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function (t) {
          return arc(interpolate(t));
        };
      });

    // Agregar porcentajes dentro del donut
    arcos
      .append("text")
      .attr("transform", (d) => `translate(${arc.centroid(d)})`)
      .attr("dy", "0.35em")
      .style("text-anchor", "middle")
      .style("font-size", isMobile ? "11px" : isTablet ? "13px" : "14px")
      .style("font-weight", "bold")
      .style("fill", "#fff")
      .style("text-shadow", "0 0 3px rgba(0,0,0,0.8)")
      .style("opacity", 0)
      .text((d) => `${d.data.porcentaje}%`)
      .transition()
      .duration(800)
      .delay(1500)
      .style("opacity", 1);

    // Leyenda horizontal abajo
    const legendGroup = d3
      .select(graficoDonutRef.current)
      .select("svg")
      .append("g")
      .attr("transform", `translate(0, ${donutSize + 20})`);

    const itemsPerRow = isMobile ? 1 : isTablet ? 2 : 3;
    const itemWidth = width / itemsPerRow;

    datosArray.forEach((d, i) => {
      const row = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;
      
      const legendItem = legendGroup
        .append("g")
        .attr("transform", `translate(${col * itemWidth + 20}, ${row * 30})`);

      legendItem
        .append("rect")
        .attr("width", 16)
        .attr("height", 16)
        .attr("rx", 3)
        .attr("fill", color(d.tarea))
        .attr("opacity", 0.85);

      legendItem
        .append("text")
        .attr("x", 24)
        .attr("y", 8)
        .attr("dy", "0.35em")
        .style("font-size", isMobile ? "11px" : isTablet ? "12px" : "13px")
        .style("fill", "#fff")
        .style("font-weight", "500")
        .text(() => {
          const texto = `${d.tarea} (${d.porcentaje}%)`;
          const maxLength = isMobile ? 25 : isTablet ? 35 : 40;
          return texto.length > maxLength ? texto.substring(0, maxLength - 3) + "..." : texto;
        });
    });

    setGraficosCreados(true);
  };

  return (
    <section ref={seccionRef} className="seccion-objetivo">
      <div className="contenido-objetivo">
        <div className="encabezado-objetivo">
          <h2 className="titulo-objetivo">{objetivo.titulo}</h2>
          <p className="descripcion-objetivo">
            Los datos revelan un patrón claro: la IA ya no es una herramienta 
            experimental. Se ha convertido en parte integral del día a día académico. 
            Pero no todos los estudiantes la usan de la misma manera...
          </p>
        </div>

        <div className="grafico-contenedor">
          <h3 className="titulo-grafico">El Perfil del Usuario: Quién Usa la IA</h3>
          <div ref={graficoBarrasRef} className="grafico"></div>
          <p className="explicacion-grafico">
            📊 <strong>La historia comienza aquí:</strong> Los estudiantes de pregrado 
            dominan el uso de IA, representando la gran mayoría de las sesiones. 
            Están en un punto crítico de su formación, donde la presión académica 
            se encuentra con la curiosidad tecnológica.
          </p>
        </div>

        <div className="grafico-contenedor">
          <h3 className="titulo-grafico">El Propósito: Para Qué Recurren a la IA</h3>
          <div ref={graficoDonutRef} className="grafico"></div>
          <p className="explicacion-grafico">
            💡 <strong>Una revelación interesante:</strong> Aunque muchos piensan 
            que la IA solo se usa para escribir ensayos, los datos muestran una 
            diversidad sorprendente. Desde estudiar conceptos difíciles hasta 
            depurar código, la IA se ha convertido en un asistente multifacético.
          </p>
        </div>

        <div className="conclusion-seccion">
          <div className="icono-conclusion-seccion">💭</div>
          <p className="texto-conclusion">
            <strong>Insight Clave:</strong> La IA no está reemplazando el aprendizaje, 
            está democratizándolo. Estudiantes de todos los niveles la usan como un 
            tutor personal disponible 24/7, adaptándose a sus necesidades específicas.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ObjetivoUso;
