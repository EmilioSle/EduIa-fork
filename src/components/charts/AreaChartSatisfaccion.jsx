import { useEffect, useRef } from "react";
import * as d3 from "d3";

/**
 * Area Chart que muestra la relación entre satisfacción y reutilización
 */
const AreaChartSatisfaccion = ({ datos, onReady }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!datos || !containerRef.current) return;
    crearGrafico();
  }, [datos]);

  const crearGrafico = () => {
    if (!containerRef.current) return;

    d3.select(containerRef.current).selectAll("*").remove();

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
    const containerWidth = containerRef.current.clientWidth;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    const margin = isMobile 
      ? { top: 30, right: 30, bottom: 100, left: 70 }
      : isTablet
      ? { top: 35, right: 40, bottom: 100, left: 80 }
      : { top: 40, right: 50, bottom: 100, left: 90 };
    
    const width = isMobile || isTablet 
      ? Math.max(300, containerWidth - 40) - margin.left - margin.right
      : 800 - margin.left - margin.right;
    const height = isMobile ? 400 : isTablet ? 450 : 500;

    const svg = d3
      .select(containerRef.current)
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
      .attr("id", "areaGradient-satisfaccion")
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
      .attr("y", height + 75)
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
      .select(containerRef.current)
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
      .attr("fill", "url(#areaGradient-satisfaccion)")
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

    // Sub-etiquetas (rangos numéricos) - separadas de las etiquetas principales
    svg.selectAll(".sub-etiqueta")
      .data(datosPorRango)
      .enter()
      .append("text")
      .attr("class", "sub-etiqueta")
      .attr("x", (d) => x(d.rango))
      .attr("y", height + 45)
      .attr("text-anchor", "middle")
      .style("font-size", isMobile ? "11px" : "13px")
      .style("font-weight", "500")
      .style("fill", "#888")
      .style("opacity", 0)
      .text((d) => `(${d.sublabel})`)
      .transition()
      .duration(600)
      .delay(1800)
      .style("opacity", 0.9);

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

    if (onReady) onReady();
  };

  return <div ref={containerRef} className="grafico"></div>;
};

export default AreaChartSatisfaccion;
