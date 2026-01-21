import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as d3 from "d3";
import { BarChart3, Lightbulb, Brain } from "lucide-react";
import imagen2 from "../assets/images/imagen2.png";
import imagen3 from "../assets/images/imagen3.png";
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
      ? { top: 30, right: 20, bottom: 100, left: 70 }
      : isTablet
      ? { top: 35, right: 30, bottom: 100, left: 80 }
      : { top: 40, right: 40, bottom: 100, left: 90 };
    
    // Desktop: tamaño fijo original, móvil/tablet: responsivo
    const width = isMobile || isTablet 
      ? Math.max(300, containerWidth - 40) - margin.left - margin.right
      : 800 - margin.left - margin.right;
    const height = isMobile ? 400 : isTablet ? 450 : 500;

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
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(datosArray, (d) => d.cantidad)])
      .range([height, 0])
      .nice();

    // Escala de color basada en cantidad
    const colorScale = d3.scaleSequential()
      .domain([0, d3.max(datosArray, d => d.cantidad)])
      .interpolator(d3.interpolateTurbo);

    // Agregar grid horizontal para mejor legibilidad
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

    // Eje X con mejor estilo
    const xAxis = svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSizeOuter(0));

    xAxis.selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size", isMobile ? "11px" : "13px")
      .style("font-weight", "500")
      .style("fill", "#fff")
      .attr("dx", "-0.5em")
      .attr("dy", "0.15em");

    xAxis.selectAll("line, path")
      .style("stroke", "#fff")
      .style("stroke-width", 2);

    // Eje Y con mejor estilo
    const yAxis = svg.append("g")
      .call(d3.axisLeft(y).ticks(isMobile ? 5 : 8).tickSizeOuter(0));

    yAxis.selectAll("text")
      .style("font-size", "13px")
      .style("font-weight", "500")
      .style("fill", "#fff");

    yAxis.selectAll("line, path")
      .style("stroke", "#fff")
      .style("stroke-width", 2);

    // Etiquetas de ejes con mejor estilo
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + 80)
      .style("text-anchor", "middle")
      .style("font-size", "15px")
      .style("font-weight", "600")
      .style("fill", "#00d9ff")
      .text("Nivel Educativo");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -60)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .style("font-size", "15px")
      .style("font-weight", "600")
      .style("fill", "#00d9ff")
      .text("Número de Estudiantes");

    // Crear tooltip mejorado
    const tooltip = d3
      .select(graficoBarrasRef.current)
      .append("div")
      .attr("class", "tooltip-grafico")
      .style("opacity", 0);

    // Crear barras con gradientes y animación suave
    const barras = svg
      .selectAll(".barra")
      .data(datosArray)
      .enter()
      .append("rect")
      .attr("class", "barra")
      .attr("x", (d) => x(d.nivel))
      .attr("width", x.bandwidth())
      .attr("y", height)
      .attr("height", 0)
      .attr("fill", d => colorScale(d.cantidad))
      .attr("rx", 4)
      .attr("ry", 4)
      .style("cursor", "pointer")
      .on("mouseenter", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 1)
          .attr("y", y(d.cantidad) - 5)
          .attr("height", height - y(d.cantidad) + 5);

        tooltip.transition().duration(200).style("opacity", 0.95);
        tooltip
          .html(
            `<strong>${d.nivel}</strong><br/>
             Estudiantes: <strong>${d.cantidad}</strong><br/>
             Porcentaje: <strong>${((d.cantidad / d3.sum(datosArray, d => d.cantidad)) * 100).toFixed(1)}%</strong>`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseleave", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 0.85)
          .attr("y", y(d.cantidad))
          .attr("height", height - y(d.cantidad));

        tooltip.transition().duration(200).style("opacity", 0);
      });

    // Animación de entrada con easing suave
    barras
      .attr("opacity", 0.85)
      .transition()
      .duration(1200)
      .delay((d, i) => i * 80)
      .attr("y", (d) => y(d.cantidad))
      .attr("height", (d) => height - y(d.cantidad))
      .ease(d3.easeCubicOut);

    // Agregar valores encima de las barras con mejor estilo
    svg
      .selectAll(".etiqueta-valor")
      .data(datosArray)
      .enter()
      .append("text")
      .attr("class", "etiqueta-valor")
      .attr("x", (d) => x(d.nivel) + x.bandwidth() / 2)
      .attr("y", height)
      .attr("text-anchor", "middle")
      .style("font-size", isMobile ? "11px" : "13px")
      .style("font-weight", "700")
      .style("fill", "#fff")
      .style("opacity", 0)
      .style("text-shadow", "0 0 5px rgba(0,0,0,0.8)")
      .text((d) => d.cantidad)
      .transition()
      .duration(800)
      .delay((d, i) => i * 80 + 600)
      .attr("y", (d) => y(d.cantidad) - 12)
      .style("opacity", 1);

    // Agregar línea de promedio
    const promedio = d3.mean(datosArray, d => d.cantidad);
    
    svg.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", y(promedio))
      .attr("y2", y(promedio))
      .attr("stroke", "#ff0066")
      .attr("stroke-width", 2.5)
      .attr("stroke-dasharray", "8,4")
      .attr("opacity", 0)
      .transition()
      .duration(1000)
      .delay(1200)
      .attr("opacity", 0.8);

    svg.append("text")
      .attr("x", width - 5)
      .attr("y", y(promedio) - 8)
      .attr("text-anchor", "end")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", "#ff0066")
      .style("opacity", 0)
      .text(`Promedio: ${promedio.toFixed(0)}`)
      .transition()
      .duration(800)
      .delay(1400)
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
    })).sort((a, b) => b.cantidad - a.cantidad);

    // Calcular total y porcentajes
    const total = d3.sum(datosArray, d => d.cantidad);
    datosArray.forEach(d => {
      d.porcentaje = ((d.cantidad / total) * 100).toFixed(1);
    });

    // Configuración responsiva
    const containerWidth = graficoDonutRef.current.clientWidth;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    // Desktop: tamaño mejorado con espacio para leyenda
    const donutSize = isMobile 
      ? Math.min(320, containerWidth - 40) 
      : isTablet 
      ? 420 
      : 500;
    
    const legendHeight = isMobile ? 140 : isTablet ? 120 : 110;
    const width = isMobile ? donutSize : isTablet ? 580 : 700;
    const height = donutSize + legendHeight;
    const radius = donutSize / 2 - (isMobile ? 35 : 45);
    const innerRadiusRatio = 0.65;

    const svg = d3
      .select(graficoDonutRef.current)
      .append("svg")
      .attr("width", "100%")
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${width / 2},${donutSize / 2 + 20})`);

    // Escala de colores mejorada con paleta vibrante
    const color = d3
      .scaleOrdinal()
      .domain(datosArray.map((d) => d.tarea))
      .range(["#00d9ff", "#00ff9f", "#ff00ff", "#ffaa00", "#ff0066", "#7c3aed", "#10b981"]);

    // Crear arcos con bordes más suaves
    const pie = d3
      .pie()
      .value((d) => d.cantidad)
      .sort(null)
      .padAngle(0.02);

    const arc = d3
      .arc()
      .innerRadius(radius * innerRadiusRatio)
      .outerRadius(radius)
      .cornerRadius(4);

    const arcHover = d3
      .arc()
      .innerRadius(radius * innerRadiusRatio - 5)
      .outerRadius(radius * 1.1)
      .cornerRadius(4);

    // Crear tooltip mejorado
    const tooltip = d3
      .select(graficoDonutRef.current)
      .append("div")
      .attr("class", "tooltip-grafico")
      .style("opacity", 0);

    // Dibujar arcos con animación mejorada
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
      .attr("opacity", 0.9)
      .attr("stroke", "#0a0e27")
      .attr("stroke-width", 3)
      .style("cursor", "pointer")
      .style("filter", "drop-shadow(0 4px 6px rgba(0,0,0,0.3))")
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .transition()
          .duration(250)
          .attr("d", arcHover)
          .attr("opacity", 1)
          .style("filter", "drop-shadow(0 8px 12px rgba(0,0,0,0.5))");

        tooltip.transition().duration(200).style("opacity", 0.95);
        tooltip
          .html(
            `<strong style="color: ${color(d.data.tarea)}">${d.data.tarea}</strong><br/>
             Sesiones: <strong>${d.data.cantidad}</strong><br/>
             Porcentaje: <strong>${d.data.porcentaje}%</strong><br/>
             <small>Del total de ${total} sesiones</small>`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseleave", function (event, d) {
        d3.select(this)
          .transition()
          .duration(250)
          .attr("d", arc)
          .attr("opacity", 0.9)
          .style("filter", "drop-shadow(0 4px 6px rgba(0,0,0,0.3))");
        
        tooltip.transition().duration(200).style("opacity", 0);
      })
      .transition()
      .duration(1400)
      .delay((d, i) => i * 120)
      .ease(d3.easeCubicOut)
      .attrTween("d", function (d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function (t) {
          return arc(interpolate(t));
        };
      });

    // Agregar porcentajes dentro del donut con mejor posicionamiento
    arcos
      .append("text")
      .attr("transform", (d) => {
        const centroid = arc.centroid(d);
        return `translate(${centroid})`;
      })
      .attr("dy", "0.35em")
      .style("text-anchor", "middle")
      .style("font-size", isMobile ? "12px" : isTablet ? "14px" : "16px")
      .style("font-weight", "700")
      .style("fill", "#fff")
      .style("text-shadow", "0 0 8px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.9)")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .text((d) => `${d.data.porcentaje}%`)
      .transition()
      .duration(800)
      .delay(1600)
      .style("opacity", 1);

    // Agregar texto central con estadística destacada
    const centerGroup = svg.append("g")
      .attr("class", "center-text")
      .style("opacity", 0);

    centerGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.5em")
      .style("font-size", isMobile ? "28px" : "36px")
      .style("font-weight", "900")
      .style("fill", "#00d9ff")
      .text(total);

    centerGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.2em")
      .style("font-size", isMobile ? "12px" : "14px")
      .style("font-weight", "600")
      .style("fill", "#fff")
      .style("opacity", 0.8)
      .text("Sesiones Totales");

    centerGroup
      .transition()
      .duration(1000)
      .delay(1800)
      .style("opacity", 1);

    // Leyenda mejorada con mejor layout
    const legendGroup = d3
      .select(graficoDonutRef.current)
      .select("svg")
      .append("g")
      .attr("transform", `translate(0, ${donutSize + 40})`);

    const itemsPerRow = isMobile ? 1 : isTablet ? 2 : 3;
    const itemWidth = width / itemsPerRow;
    const itemHeight = 35;

    datosArray.forEach((d, i) => {
      const row = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;
      
      const legendItem = legendGroup
        .append("g")
        .attr("transform", `translate(${col * itemWidth + 25}, ${row * itemHeight})`)
        .style("cursor", "pointer")
        .style("opacity", 0);

      legendItem
        .append("circle")
        .attr("cx", 8)
        .attr("cy", 8)
        .attr("r", 8)
        .attr("fill", color(d.tarea))
        .attr("opacity", 0.9)
        .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.3))");

      const legendText = legendItem
        .append("text")
        .attr("x", 24)
        .attr("y", 8)
        .attr("dy", "0.35em")
        .style("font-size", isMobile ? "11px" : isTablet ? "12px" : "13px")
        .style("fill", "#fff")
        .style("font-weight", "600");

      const texto = `${d.tarea} (${d.porcentaje}%)`;
      const maxLength = isMobile ? 28 : isTablet ? 38 : 45;
      legendText.text(texto.length > maxLength ? texto.substring(0, maxLength - 3) + "..." : texto);

      // Animación de entrada para leyenda
      legendItem
        .transition()
        .duration(600)
        .delay(2000 + i * 80)
        .style("opacity", 1);
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
          <img src={imagen2} alt="Perfil de usuario" className="imagen-grafico imagen-grafico-grande" />
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
          <img src={imagen3} alt="Propósito de uso" className="imagen-grafico" />
          <p className="explicacion-grafico">
            <Lightbulb className="icono-inline" size={20} strokeWidth={1.5} /> <strong>Una revelación interesante:</strong> Aunque muchos piensan 
            que la IA solo se usa para escribir ensayos, los datos muestran una 
            diversidad sorprendente. Desde estudiar conceptos difíciles hasta 
            depurar código, la IA se ha convertido en un asistente multifacético.
          </p>
        </div>

        <div className="conclusion-seccion">
          <Brain className="icono-conclusion-seccion" size={40} strokeWidth={1.5} />
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
