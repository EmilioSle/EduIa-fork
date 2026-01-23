import { useEffect, useRef } from "react";
import * as d3 from "d3";

/**
 * Lollipop Chart que muestra la reutilización según el resultado final
 */
const LollipopChartResultado = ({ datos, onReady }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!datos || !containerRef.current) return;
    crearGrafico();
  }, [datos]);

  const crearGrafico = () => {
    if (!containerRef.current) return;

    d3.select(containerRef.current).selectAll("*").remove();

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
    const containerWidth = containerRef.current.clientWidth;
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
      .select(containerRef.current)
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
      .select(containerRef.current)
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
      .text(`Meta: ${referenciaLinea}%`)
      .transition()
      .duration(800)
      .delay(1600)
      .style("opacity", 1);

    if (onReady) onReady();
  };

  return <div ref={containerRef} className="grafico"></div>;
};

export default LollipopChartResultado;
