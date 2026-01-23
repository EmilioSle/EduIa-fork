import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as d3 from "d3";
import { Search, CheckCircle, Target } from "lucide-react";
import imagen7 from "../assets/images/imagen7.png";
import imagen6 from "../assets/images/imagen6.png";
import { OBJETIVOS_ANALITICOS } from "../utils/objetivos";
import "../styles/objetivo.css";

gsap.registerPlugin(ScrollTrigger);

const ObjetivoReutilizacion = ({ datos }) => {
  const seccionRef = useRef(null);
  const graficoSatisfaccionRef = useRef(null);
  const graficoResultadoRef = useRef(null);
  const [graficosCreados, setGraficosCreados] = useState(false);

  const objetivo = OBJETIVOS_ANALITICOS[2];

  useEffect(() => {
    if (!datos || graficosCreados) return;

    const ctx = gsap.context(() => {
      gsap.from(".titulo-objetivo-3", {
        scrollTrigger: {
          trigger: seccionRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
        opacity: 0,
        scale: 0.7,
        rotationZ: 10,
        filter: "blur(18px)",
        duration: 1.4,
        ease: "back.out(2)",
      });

      // Efecto de glitch más pronunciado
      gsap.to(".titulo-objetivo-3", {
        scrollTrigger: {
          trigger: seccionRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
        skewX: 4,
        duration: 0.1,
        repeat: 3,
        yoyo: true,
        delay: 1.4,
        ease: "steps(2)",
      });

      ScrollTrigger.create({
        trigger: graficoSatisfaccionRef.current,
        start: "top 70%",
        onEnter: () => {
          if (graficoSatisfaccionRef.current && !graficosCreados) {
            crearGraficoSatisfaccion();
          }
        },
      });

      ScrollTrigger.create({
        trigger: graficoResultadoRef.current,
        start: "top 70%",
        onEnter: () => {
          if (graficoResultadoRef.current && !graficosCreados) {
            crearGraficoResultado();
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
          crearGraficoSatisfaccion();
          crearGraficoResultado();
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

  const crearGraficoSatisfaccion = () => {
    if (!graficoSatisfaccionRef.current) return;

    d3.select(graficoSatisfaccionRef.current).selectAll("*").remove();

    // Agrupar por satisfacción y uso posterior
    const datosValidos = datos.filter((d) => d.satisfaccion > 0);
    
    const rangos = [
      { min: 0, max: 2, label: "Baja", sublabel: "0-1.9" },
      { min: 2, max: 3.5, label: "Media", sublabel: "2-3.4" },
      { min: 3.5, max: 5.1, label: "Alta", sublabel: "3.5-5" },
    ];

    const datosPorRango = rangos.map((rango, index) => {
      const enRango = datosValidos.filter((d) => {
        if (index === rangos.length - 1) {
          return d.satisfaccion >= rango.min && d.satisfaccion <= 5;
        }
        return d.satisfaccion >= rango.min && d.satisfaccion < rango.max;
      });
      const reutilizan = enRango.filter((d) => d.usoPosterior === "Sí").length;
      const total = enRango.length;
      return {
        rango: rango.label,
        sublabel: rango.sublabel,
        porcentaje: total > 0 ? (reutilizan / total) * 100 : 0,
        total,
        reutilizan,
      };
    });

    // Configuración responsiva mejorada
    const containerWidth = graficoSatisfaccionRef.current.clientWidth;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    const margin = isMobile 
      ? { top: 30, right: 30, bottom: 80, left: 70 }
      : isTablet
      ? { top: 35, right: 40, bottom: 80, left: 80 }
      : { top: 40, right: 50, bottom: 80, left: 90 };
    
    const width = isMobile || isTablet 
      ? Math.max(300, containerWidth - 40) - margin.left - margin.right
      : 800 - margin.left - margin.right;
    const height = isMobile ? 400 : isTablet ? 450 : 500;

    const svg = d3
      .select(graficoSatisfaccionRef.current)
      .append("svg")
      .attr("width", isMobile || isTablet ? "100%" : width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Escalas para Area Chart
    const x = d3
      .scalePoint()
      .range([0, width])
      .domain(datosPorRango.map((d) => d.rango))
      .padding(0.5);

    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0])
      .nice();

    // Colores para el área
    const areaColor = "#00d9ff";
    const lineColor = "#00ffff";

    // Definir gradiente para el área
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "areaGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", areaColor)
      .attr("stop-opacity", 0.8);
    
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", areaColor)
      .attr("stop-opacity", 0.1);

    // Agregar grid horizontal
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

    // Eje X
    const xAxis = svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSizeOuter(0));

    xAxis.selectAll("text")
      .style("text-anchor", "middle")
      .style("font-size", isMobile ? "13px" : "15px")
      .style("font-weight", "700")
      .style("fill", "#fff");

    xAxis.selectAll("line, path")
      .style("stroke", "#fff")
      .style("stroke-width", 2);

    // Eje Y
    const yAxis = svg.append("g")
      .call(d3.axisLeft(y).ticks(10).tickSizeOuter(0));

    yAxis.selectAll("text")
      .style("font-size", "13px")
      .style("font-weight", "500")
      .style("fill", "#fff");

    yAxis.selectAll("line, path")
      .style("stroke", "#fff")
      .style("stroke-width", 2);

    // Etiquetas de ejes
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + 55)
      .style("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "600")
      .style("fill", "#00d9ff")
      .text("Nivel de Satisfacción");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -60)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "600")
      .style("fill", "#00d9ff")
      .text("% de Reutilización");

    // Crear tooltip
    const tooltip = d3
      .select(graficoSatisfaccionRef.current)
      .append("div")
      .attr("class", "tooltip-grafico")
      .style("opacity", 0);

    // Crear generador de área
    const area = d3.area()
      .x((d) => x(d.rango))
      .y0(height)
      .y1((d) => y(d.porcentaje))
      .curve(d3.curveMonotoneX);

    // Crear generador de línea
    const line = d3.line()
      .x((d) => x(d.rango))
      .y((d) => y(d.porcentaje))
      .curve(d3.curveMonotoneX);

    // Dibujar área con animación
    const areaPath = svg.append("path")
      .datum(datosPorRango)
      .attr("class", "area")
      .attr("fill", "url(#areaGradient)")
      .attr("d", d3.area()
        .x((d) => x(d.rango))
        .y0(height)
        .y1(height)
        .curve(d3.curveMonotoneX)
      );

    areaPath.transition()
      .duration(1500)
      .ease(d3.easeCubicOut)
      .attr("d", area);

    // Dibujar línea con animación
    const linePath = svg.append("path")
      .datum(datosPorRango)
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", lineColor)
      .attr("stroke-width", 4)
      .style("filter", "drop-shadow(0 0 8px rgba(0, 255, 255, 0.6))");

    const totalLength = width * 2;
    linePath
      .attr("stroke-dasharray", totalLength)
      .attr("stroke-dashoffset", totalLength)
      .attr("d", line)
      .transition()
      .duration(1500)
      .ease(d3.easeCubicOut)
      .attr("stroke-dashoffset", 0);

    // Agregar puntos en cada categoría
    const puntos = svg.selectAll(".punto")
      .data(datosPorRango)
      .enter()
      .append("circle")
      .attr("class", "punto")
      .attr("cx", (d) => x(d.rango))
      .attr("cy", height)
      .attr("r", 0)
      .attr("fill", lineColor)
      .attr("stroke", "#fff")
      .attr("stroke-width", 3)
      .style("cursor", "pointer")
      .style("filter", "drop-shadow(0 0 10px rgba(0, 255, 255, 0.8))")
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", isMobile ? 14 : 18)
          .style("filter", "drop-shadow(0 0 15px rgba(0, 255, 255, 1))");
        
        tooltip.transition().duration(200).style("opacity", 0.95);
        tooltip
          .html(
            `<strong>Satisfacción ${d.rango}</strong> (${d.sublabel})<br/>
             Total estudiantes: <strong>${d.total}</strong><br/>
             Reutilizan: <strong>${d.reutilizan}</strong> (${d.porcentaje.toFixed(1)}%)<br/>
             No reutilizan: <strong>${d.total - d.reutilizan}</strong>`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseleave", function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", isMobile ? 10 : 12)
          .style("filter", "drop-shadow(0 0 10px rgba(0, 255, 255, 0.8))");
        
        tooltip.transition().duration(200).style("opacity", 0);
      });

    puntos.transition()
      .duration(800)
      .delay((d, i) => 1200 + i * 200)
      .attr("cy", (d) => y(d.porcentaje))
      .attr("r", isMobile ? 10 : 12)
      .ease(d3.easeBackOut);

    // Etiquetas de valores
    svg.selectAll(".etiqueta-valor")
      .data(datosPorRango)
      .enter()
      .append("text")
      .attr("class", "etiqueta-valor")
      .attr("x", (d) => x(d.rango))
      .attr("y", height)
      .attr("text-anchor", "middle")
      .style("font-size", isMobile ? "13px" : "16px")
      .style("font-weight", "700")
      .style("fill", "#fff")
      .style("opacity", 0)
      .style("text-shadow", "0 0 8px rgba(0,0,0,0.9)")
      .text((d) => `${d.porcentaje.toFixed(1)}%`)
      .transition()
      .duration(800)
      .delay((d, i) => 1400 + i * 200)
      .attr("y", (d) => y(d.porcentaje) - 22)
      .style("opacity", 1);

    // Sub-etiquetas (rangos)
    svg.selectAll(".sub-etiqueta")
      .data(datosPorRango)
      .enter()
      .append("text")
      .attr("class", "sub-etiqueta")
      .attr("x", (d) => x(d.rango))
      .attr("y", height + 25)
      .attr("text-anchor", "middle")
      .style("font-size", isMobile ? "10px" : "12px")
      .style("font-weight", "500")
      .style("fill", "#999")
      .style("opacity", 0)
      .text((d) => d.sublabel)
      .transition()
      .duration(600)
      .delay(1800)
      .style("opacity", 0.8);

    // Línea de referencia en 50%
    const referenciaLinea = 50;
    
    svg.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", y(referenciaLinea))
      .attr("y2", y(referenciaLinea))
      .attr("stroke", "#ff0066")
      .attr("stroke-width", 2.5)
      .attr("stroke-dasharray", "8,4")
      .attr("opacity", 0)
      .transition()
      .duration(1000)
      .delay(1600)
      .attr("opacity", 0.7);

    svg.append("text")
      .attr("x", width - 5)
      .attr("y", y(referenciaLinea) - 8)
      .attr("text-anchor", "end")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", "#ff0066")
      .style("opacity", 0)
      .text(`Meta: ${referenciaLinea}%`)
      .transition()
      .duration(800)
      .delay(1800)
      .style("opacity", 1);
  };

  const crearGraficoResultado = () => {
    if (!graficoResultadoRef.current) return;

    d3.select(graficoResultadoRef.current).selectAll("*").remove();

    // Agrupar por resultado final
    const datosPorResultado = d3.rollup(
      datos,
      (v) => ({
        total: v.length,
        reutilizan: v.filter((d) => d.usoPosterior === "Sí").length,
      }),
      (d) => d.resultadoFinal
    );

    const datosArray = Array.from(
      datosPorResultado,
      ([resultado, stats]) => ({
        resultado,
        porcentaje: (stats.reutilizan / stats.total) * 100,
        total: stats.total,
        reutilizan: stats.reutilizan,
      })
    ).sort((a, b) => b.porcentaje - a.porcentaje);

    // Configuración responsiva mejorada
    const containerWidth = graficoResultadoRef.current.clientWidth;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    const margin = isMobile 
      ? { top: 30, right: 50, bottom: 60, left: 180 }
      : isTablet
      ? { top: 35, right: 60, bottom: 60, left: 220 }
      : { top: 40, right: 80, bottom: 60, left: 260 };
    
    const width = isMobile || isTablet 
      ? Math.max(300, containerWidth - 40) - margin.left - margin.right
      : 850 - margin.left - margin.right;
    const height = isMobile ? 300 : isTablet ? 350 : 400;

    const svg = d3
      .select(graficoResultadoRef.current)
      .append("svg")
      .attr("width", isMobile || isTablet ? "100%" : width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Escalas para Lollipop Chart horizontal
    const y = d3
      .scaleBand()
      .range([0, height])
      .domain(datosArray.map((d) => d.resultado))
      .padding(0.4);

    const x = d3.scaleLinear()
      .domain([0, 100])
      .range([0, width])
      .nice();

    // Colores para los puntos (dot plot)
    const coloresDots = [
      "#00d9ff",  // Cyan brillante
      "#00ff9f",  // Verde neón
      "#ff8c42",  // Naranja
      "#9d4edd",  // Púrpura vibrante
      "#ff6b6b",  // Coral
      "#ffd93d",  // Amarillo dorado
    ];

    // Agregar grid vertical
    svg.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.1)
      .call(
        d3.axisBottom(x)
          .tickSize(height)
          .tickFormat("")
      )
      .selectAll("line")
      .style("stroke", "#fff");

    // Eje Y (categorías) con mejor manejo de texto
    const yAxis = svg
      .append("g")
      .call(d3.axisLeft(y).tickSizeOuter(0));

    yAxis.selectAll("text")
      .style("font-size", isMobile ? "11px" : "13px")
      .style("font-weight", "600")
      .style("fill", "#fff")
      .each(function(d) {
        const texto = d;
        const maxLength = isMobile ? 18 : isTablet ? 25 : 35;
        if (texto.length > maxLength) {
          d3.select(this).text(texto.substring(0, maxLength - 3) + "...");
        }
      });

    yAxis.selectAll("line, path")
      .style("stroke", "#fff")
      .style("stroke-width", 2);

    // Eje X
    const xAxis = svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(10).tickSizeOuter(0));

    xAxis.selectAll("text")
      .style("font-size", "13px")
      .style("font-weight", "500")
      .style("fill", "#fff");

    xAxis.selectAll("line, path")
      .style("stroke", "#fff")
      .style("stroke-width", 2);

    // Etiquetas de ejes
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + 45)
      .style("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "600")
      .style("fill", "#00d9ff")
      .text("% de Reutilización");

    // Crear tooltip
    const tooltip = d3
      .select(graficoResultadoRef.current)
      .append("div")
      .attr("class", "tooltip-grafico")
      .style("opacity", 0);

    // Líneas del lollipop (stems)
    svg.selectAll(".lollipop-line")
      .data(datosArray)
      .enter()
      .append("line")
      .attr("class", "lollipop-line")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", (d) => y(d.resultado) + y.bandwidth() / 2)
      .attr("y2", (d) => y(d.resultado) + y.bandwidth() / 2)
      .attr("stroke", (d, i) => coloresDots[i % coloresDots.length])
      .attr("stroke-width", 3)
      .attr("opacity", 0.6)
      .style("filter", "drop-shadow(0 0 4px rgba(0,217,255,0.3))")
      .transition()
      .duration(1200)
      .delay((d, i) => i * 120)
      .attr("x2", (d) => x(d.porcentaje))
      .ease(d3.easeCubicOut);

    // Puntos (dots) del lollipop
    const dots = svg.selectAll(".lollipop-dot")
      .data(datosArray)
      .enter()
      .append("circle")
      .attr("class", "lollipop-dot")
      .attr("cx", 0)
      .attr("cy", (d) => y(d.resultado) + y.bandwidth() / 2)
      .attr("r", 0)
      .attr("fill", (d, i) => coloresDots[i % coloresDots.length])
      .attr("stroke", "#fff")
      .attr("stroke-width", 3)
      .style("cursor", "pointer")
      .style("filter", "drop-shadow(0 0 8px rgba(0,217,255,0.5))")
      .on("mouseenter", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", isMobile ? 16 : 20)
          .style("filter", "drop-shadow(0 0 15px rgba(0,217,255,1))");
        
        tooltip.transition().duration(200).style("opacity", 0.95);
        const dotIndex = datosArray.findIndex(item => item.resultado === d.resultado);
        tooltip
          .html(
            `<strong style="color: ${coloresDots[dotIndex % coloresDots.length]}">${d.resultado}</strong><br/>
             Total estudiantes: <strong>${d.total}</strong><br/>
             Reutilizan: <strong>${d.reutilizan}</strong> (${d.porcentaje.toFixed(1)}%)<br/>
             No reutilizan: <strong>${d.total - d.reutilizan}</strong>`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseleave", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", isMobile ? 12 : 14)
          .style("filter", "drop-shadow(0 0 8px rgba(0,217,255,0.5))");
        
        tooltip.transition().duration(200).style("opacity", 0);
      });

    dots.transition()
      .duration(1200)
      .delay((d, i) => i * 120)
      .attr("cx", (d) => x(d.porcentaje))
      .attr("r", isMobile ? 12 : 14)
      .ease(d3.easeCubicOut);

    // Valores al lado de cada punto
    svg.selectAll(".etiqueta-valor")
      .data(datosArray)
      .enter()
      .append("text")
      .attr("class", "etiqueta-valor")
      .attr("x", 0)
      .attr("y", (d) => y(d.resultado) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "start")
      .style("font-size", isMobile ? "12px" : "14px")
      .style("font-weight", "700")
      .style("fill", "#fff")
      .style("opacity", 0)
      .style("text-shadow", "0 0 5px rgba(0,0,0,0.8)")
      .text((d) => `${d.porcentaje.toFixed(1)}%`)
      .transition()
      .duration(800)
      .delay((d, i) => i * 120 + 800)
      .attr("x", (d) => x(d.porcentaje) + 22)
      .style("opacity", 1);

    // Destacar el punto con mayor porcentaje
    const maxPorcentaje = d3.max(datosArray, d => d.porcentaje);
    const mejorResultado = datosArray.find(d => d.porcentaje === maxPorcentaje);
    
    if (mejorResultado) {
      svg.append("text")
        .attr("x", x(mejorResultado.porcentaje) + 55)
        .attr("y", y(mejorResultado.resultado) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "start")
        .style("font-size", "12px")
        .style("font-weight", "700")
        .style("fill", "#00ff9f")
        .style("opacity", 0)
        .text("⭐ Mayor éxito")
        .transition()
        .duration(800)
        .delay(1600)
        .style("opacity", 1);
    }

    // Línea de referencia en 70% (alto rendimiento)
    const referenciaLinea = 70;
    
    svg.append("line")
      .attr("x1", x(referenciaLinea))
      .attr("x2", x(referenciaLinea))
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#00ff9f")
      .attr("stroke-width", 2.5)
      .attr("stroke-dasharray", "8,4")
      .attr("opacity", 0)
      .transition()
      .duration(1000)
      .delay(1400)
      .attr("opacity", 0.6);

    svg.append("text")
      .attr("x", x(referenciaLinea))
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", "#00ff9f")
      .style("opacity", 0)
      .text(`Alto rendimiento: ${referenciaLinea}%`)
      .transition()
      .duration(800)
      .delay(1600)
      .style("opacity", 1);

    setGraficosCreados(true);
  };

  return (
    <section ref={seccionRef} className="seccion-objetivo objetivo-3">
      <div className="contenido-objetivo">
        <div className="encabezado-objetivo">
          <h2 className="titulo-objetivo titulo-objetivo-3">{objetivo.titulo}</h2>
          <p className="descripcion-objetivo">
            Aquí llegamos al momento decisivo. Las métricas y gráficos son útiles, 
            pero hay una pregunta que lo resume todo: después de usar la IA, 
            ¿el estudiante vuelve? Esta decisión revela qué factores realmente 
            importan para generar lealtad.
          </p>
        </div>

        <div className="grafico-contenedor">
          <h3 className="titulo-grafico">Satisfacción vs Reutilización: Un Hallazgo Sorprendente</h3>
          <div ref={graficoSatisfaccionRef} className="grafico"></div>
          <img src={imagen6} alt="Satisfacción vs Reutilización" className="imagen-grafico" />
          <p className="explicacion-grafico">
            <Search className="icono-inline" size={20} strokeWidth={1.5} /> <strong>Resultado contraintuitivo:</strong> La reutilización se mantiene 
            sorprendentemente estable (≈70%) independientemente del nivel de satisfacción. 
            Las diferencias son mínimas (±2%), lo que sugiere que la satisfacción, por sí 
            sola, no es el único factor decisivo. Esto nos indica que hay otros elementos 
            en juego: quizás la necesidad académica, la falta de alternativas, o el costo 
            hundido de aprendizaje de la herramienta.
          </p>
        </div>

        <div className="grafico-contenedor">
          <h3 className="titulo-grafico">El Verdadero Predictor: Resultados Exitosos</h3>
          <div ref={graficoResultadoRef} className="grafico"></div>
          <img src={imagen7} alt="Resultados exitosos" className="imagen-grafico" />
          <p className="explicacion-grafico">
            <CheckCircle className="icono-inline" size={20} strokeWidth={1.5} /> <strong>Aquí está el factor clave:</strong> A diferencia de la satisfacción, 
            el resultado final sí muestra una relación clara. Cuando los estudiantes logran 
            completar sus tareas exitosamente, la probabilidad de reutilización aumenta 
            significativamente. El éxito tangible supera a la satisfacción subjetiva. 
            Los estudiantes vuelven cuando la IA les ayuda a <em>lograr algo concreto</em>, 
            no solo cuando "se sienten bien" con ella.
          </p>
        </div>

        <div className="conclusion-seccion">
          <Target className="icono-conclusion-seccion" size={40} strokeWidth={1.5} />
          <p className="texto-conclusion">
            <strong>La Verdad Revelada:</strong> Los datos desafían nuestra intuición. 
            La reutilización no depende tanto de cuán satisfechos se sienten los estudiantes, 
            sino de si obtuvieron resultados concretos. Esto es crítico: la IA educativa 
            debe enfocarse en <strong>efectividad medible</strong> más que en "experiencia 
            del usuario" abstracta. Los estudiantes perdonan imperfecciones si obtienen 
            resultados, pero no volverán aunque la experiencia sea agradable si no resuelve 
            su problema real. Aquellos que encuentran éxito son los que vuelven una 
            y otra vez. La IA ha ganado su lugar en la educación.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ObjetivoReutilizacion;
