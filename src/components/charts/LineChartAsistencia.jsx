import { useEffect, useRef } from "react";
import * as d3 from "d3";

/**
 * Line chart que muestra la tendencia de satisfacción según nivel de asistencia de IA
 */
const LineChartAsistencia = ({ datos, onReady }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!datos || !containerRef.current) return;
    crearGrafico();
  }, [datos]);

  const crearGrafico = () => {
    if (!containerRef.current) return;

    d3.select(containerRef.current).selectAll("*").remove();

    // Preparar datos
    const datosValidos = datos.filter((d) => d.satisfaccion > 0);
    const promediosPorAsistencia = d3.rollup(
      datosValidos,
      (v) => ({
        promedio: d3.mean(v, (d) => d.satisfaccion),
        cantidad: v.length
      }),
      (d) => d.nivelAsistenciaIA
    );
    
    const datosLinea = Array.from(
      promediosPorAsistencia,
      ([nivel, datos]) => ({
        nivel: parseInt(nivel),
        nivelLabel: `Nivel ${nivel}`,
        promedio: datos.promedio,
        cantidad: datos.cantidad,
      })
    ).sort((a, b) => a.nivel - b.nivel);

    if (datosLinea.length === 0) return;

    // Configuración responsiva
    const containerWidth = containerRef.current.clientWidth;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    const margin = isMobile 
      ? { top: 40, right: 30, bottom: 80, left: 60 }
      : isTablet
      ? { top: 45, right: 40, bottom: 80, left: 70 }
      : { top: 50, right: 50, bottom: 80, left: 80 };
    
    const width = isMobile || isTablet 
      ? Math.max(300, containerWidth - 40) - margin.left - margin.right
      : 750 - margin.left - margin.right;
    const height = isMobile ? 380 : isTablet ? 420 : 480;

    const svg = d3
      .select(containerRef.current)
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
      .domain([d3.min(datosLinea, d => d.nivel), d3.max(datosLinea, d => d.nivel)])
      .range([0, width]);

    const y = d3
      .scaleLinear()
      .domain([0, 5])
      .range([height, 0])
      .nice();

    // Colores
    const lineColor = "#00ff9f";
    const areaColor = "#00ff9f";

    // Definir gradiente para el área bajo la línea
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "lineAreaGradient-asistencia")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", areaColor)
      .attr("stop-opacity", 0.4);
    
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", areaColor)
      .attr("stop-opacity", 0.05);

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
      .call(d3.axisBottom(x)
        .ticks(datosLinea.length)
        .tickFormat(d => `Nivel ${d}`)
        .tickSizeOuter(0));

    xAxis.selectAll("text")
      .style("font-size", isMobile ? "11px" : "13px")
      .style("font-weight", "600")
      .style("fill", "#fff");

    xAxis.selectAll("line, path")
      .style("stroke", "#fff")
      .style("stroke-width", 2);

    // Eje Y
    const yAxis = svg.append("g")
      .call(d3.axisLeft(y).ticks(5).tickSizeOuter(0));

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
      .style("font-size", isMobile ? "13px" : "15px")
      .style("font-weight", "600")
      .style("fill", "#00d9ff")
      .text("Nivel de Asistencia de la IA");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -(isMobile ? 45 : 60))
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .style("font-size", isMobile ? "13px" : "15px")
      .style("font-weight", "600")
      .style("fill", "#00d9ff")
      .text("Satisfacción Promedio");

    // Crear tooltip
    const tooltip = d3
      .select(containerRef.current)
      .append("div")
      .attr("class", "tooltip-grafico")
      .style("opacity", 0);

    // Crear generador de área
    const area = d3.area()
      .x((d) => x(d.nivel))
      .y0(height)
      .y1((d) => y(d.promedio))
      .curve(d3.curveMonotoneX);

    // Crear generador de línea
    const line = d3.line()
      .x((d) => x(d.nivel))
      .y((d) => y(d.promedio))
      .curve(d3.curveMonotoneX);

    // Dibujar área con animación
    const areaPath = svg.append("path")
      .datum(datosLinea)
      .attr("class", "area")
      .attr("fill", "url(#lineAreaGradient-asistencia)")
      .attr("d", d3.area()
        .x((d) => x(d.nivel))
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
      .datum(datosLinea)
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", lineColor)
      .attr("stroke-width", 4)
      .style("filter", "drop-shadow(0 0 10px rgba(0, 255, 159, 0.7))");

    const totalLength = width * 2;
    linePath
      .attr("stroke-dasharray", totalLength)
      .attr("stroke-dashoffset", totalLength)
      .attr("d", line)
      .transition()
      .duration(1500)
      .ease(d3.easeCubicOut)
      .attr("stroke-dashoffset", 0);

    // Agregar puntos en cada nivel
    const puntos = svg.selectAll(".punto")
      .data(datosLinea)
      .enter()
      .append("circle")
      .attr("class", "punto")
      .attr("cx", (d) => x(d.nivel))
      .attr("cy", height)
      .attr("r", 0)
      .attr("fill", lineColor)
      .attr("stroke", "#fff")
      .attr("stroke-width", 3)
      .style("cursor", "pointer")
      .style("filter", "drop-shadow(0 0 10px rgba(0, 255, 159, 0.8))")
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", isMobile ? 14 : 18)
          .style("filter", "drop-shadow(0 0 15px rgba(0, 255, 159, 1))");
        
        tooltip.transition().duration(200).style("opacity", 0.95);
        tooltip
          .html(
            `<strong style="color: ${lineColor}">${d.nivelLabel}</strong><br/>
             Satisfacción promedio: <strong>${d.promedio.toFixed(2)}/5</strong><br/>
             Estudiantes: <strong>${d.cantidad}</strong>`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseleave", function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", isMobile ? 10 : 12)
          .style("filter", "drop-shadow(0 0 10px rgba(0, 255, 159, 0.8))");
        
        tooltip.transition().duration(200).style("opacity", 0);
      });

    puntos.transition()
      .duration(800)
      .delay((d, i) => 1200 + i * 150)
      .attr("cy", (d) => y(d.promedio))
      .attr("r", isMobile ? 10 : 12)
      .ease(d3.easeBackOut);

    // Etiquetas de valores
    svg.selectAll(".etiqueta-valor")
      .data(datosLinea)
      .enter()
      .append("text")
      .attr("class", "etiqueta-valor")
      .attr("x", (d) => x(d.nivel))
      .attr("y", height)
      .attr("text-anchor", "middle")
      .style("font-size", isMobile ? "12px" : "14px")
      .style("font-weight", "700")
      .style("fill", "#fff")
      .style("opacity", 0)
      .style("text-shadow", "0 0 8px rgba(0,0,0,0.9)")
      .text((d) => d.promedio.toFixed(2))
      .transition()
      .duration(800)
      .delay((d, i) => 1400 + i * 150)
      .attr("y", (d) => y(d.promedio) - 20)
      .style("opacity", 1);

    // Línea de referencia en 4.0 (Meta)
    const referenciaLinea = 4.0;
    
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
      .delay(1800)
      .attr("opacity", 0.7);

    svg.append("text")
      .attr("x", width - 5)
      .attr("y", y(referenciaLinea) - 8)
      .attr("text-anchor", "end")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", "#ff0066")
      .style("opacity", 0)
      .text(`Meta: ${referenciaLinea}`)
      .transition()
      .duration(800)
      .delay(2000)
      .style("opacity", 1);

    // Indicador de tendencia
    const primerValor = datosLinea[0].promedio;
    const ultimoValor = datosLinea[datosLinea.length - 1].promedio;
    const tendencia = ultimoValor > primerValor ? "↑" : ultimoValor < primerValor ? "↓" : "→";
    const colorTendencia = ultimoValor > primerValor ? "#00ff9f" : ultimoValor < primerValor ? "#ff6b6b" : "#ffd93d";
    
    svg.append("text")
      .attr("x", width - 10)
      .attr("y", 20)
      .attr("text-anchor", "end")
      .style("font-size", "16px")
      .style("font-weight", "700")
      .style("fill", colorTendencia)
      .style("opacity", 0)
      .text(`Tendencia: ${tendencia} ${((ultimoValor - primerValor) / primerValor * 100).toFixed(1)}%`)
      .transition()
      .duration(800)
      .delay(2200)
      .style("opacity", 1);

    if (onReady) onReady();
  };

  return <div ref={containerRef} className="grafico"></div>;
};

export default LineChartAsistencia;
