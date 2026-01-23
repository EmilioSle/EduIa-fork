import { useEffect, useRef } from "react";
import * as d3 from "d3";

/**
 * Scatter plot que muestra la relación entre duración de sesión y satisfacción
 */
const ScatterChartDuracion = ({ datos, onReady }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!datos || !containerRef.current) return;
    crearGrafico();
  }, [datos]);

  const crearGrafico = () => {
    if (!containerRef.current) return;

    d3.select(containerRef.current).selectAll("*").remove();

    // Filtrar datos válidos
    const datosValidos = datos.filter(
      (d) => d.duracionMinutos > 0 && d.satisfaccion > 0
    );

    // Configuración responsiva
    const containerWidth = containerRef.current.clientWidth;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    const margin = isMobile 
      ? { top: 30, right: 25, bottom: 70, left: 50 }
      : isTablet
      ? { top: 30, right: 30, bottom: 70, left: 60 }
      : { top: 30, right: 30, bottom: 70, left: 70 };
    
    const width = isMobile || isTablet 
      ? Math.max(300, containerWidth - 40) - margin.left - margin.right
      : 700 - margin.left - margin.right;
    const height = isMobile ? 350 : isTablet ? 400 : 450;

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
      .select(containerRef.current)
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
      .attr("id", "legend-gradient-scatter");

    linearGradient.selectAll("stop")
      .data(d3.range(0, 1.01, 0.1))
      .enter().append("stop")
      .attr("offset", d => `${d * 100}%`)
      .attr("stop-color", d => colorScale(1 + d * 4));

    legendGroup.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient-scatter)")
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

    if (onReady) onReady();
  };

  return <div ref={containerRef} className="grafico"></div>;
};

export default ScatterChartDuracion;
