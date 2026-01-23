import { useEffect, useRef } from "react";
import * as d3 from "d3";

/**
 * Gráfico donut que muestra la distribución de sesiones por tipo de tarea
 */
const DonutChartTipoTarea = ({ datos, onReady }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!datos || !containerRef.current) return;
    crearGrafico();
  }, [datos]);

  const crearGrafico = () => {
    if (!containerRef.current) return;

    // Limpiar contenido previo
    d3.select(containerRef.current).selectAll("*").remove();

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
    const containerWidth = containerRef.current.clientWidth;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    const donutSize = isMobile 
      ? Math.min(320, containerWidth - 40) 
      : isTablet 
      ? 420 
      : 500;
    
    const legendHeight = isMobile ? 180 : isTablet ? 120 : 100;
    const width = isMobile ? donutSize : isTablet ? 550 : 650;
    const height = donutSize + legendHeight;
    const radius = donutSize / 2 - (isMobile ? 35 : 45);
    const innerRadiusRatio = 0.65;
    const fontSize = isMobile ? "11px" : isTablet ? "12px" : "13px";

    const svgElement = d3
      .select(containerRef.current)
      .append("svg")
      .attr("width", "100%")
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const svg = svgElement
      .append("g")
      .attr("transform", `translate(${width / 2},${donutSize / 2})`);

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
      .select(containerRef.current)
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
    const legendGroup = svgElement
      .append("g")
      .attr("transform", `translate(0, ${donutSize + 40})`);

    const itemsPerRow = isMobile ? 1 : isTablet ? 2 : 3;
    const itemWidth = width / itemsPerRow;
    const rowHeight = 30;

    datosArray.forEach((d, i) => {
      const row = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;
      
      const xPosition = isMobile 
        ? width / 2 - 100
        : col * itemWidth + 20;
      
      const legendItem = legendGroup
        .append("g")
        .attr("transform", `translate(${xPosition}, ${row * rowHeight})`);

      legendItem
        .append("rect")
        .attr("width", 16)
        .attr("height", 16)
        .attr("rx", 3)
        .attr("fill", color(d.tarea))
        .attr("opacity", 0.9)
        .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.3))");

      legendItem
        .append("text")
        .attr("x", isMobile ? 20 : 24)
        .attr("y", 8)
        .attr("dy", "0.35em")
        .style("font-size", fontSize)
        .style("fill", "#fff")
        .style("font-weight", "500")
        .text(() => {
          const texto = `${d.tarea} (${d.porcentaje}%)`;
          const maxLength = isMobile ? 22 : isTablet ? 28 : 35;
          return texto.length > maxLength ? texto.substring(0, maxLength - 3) + "..." : texto;
        });
    });

    if (onReady) onReady();
  };

  return <div ref={containerRef} className="grafico"></div>;
};

export default DonutChartTipoTarea;
