import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import PropTypes from "prop-types";

/**
 * Componente de Bar Chart vertical optimizado basado en D3 Gallery
 * Características:
 * - Animaciones suaves con D3 transitions
 * - Tooltips interactivos
 * - Responsive y adaptativo
 * - Gradientes y efectos visuales
 */
const BarChartOptimizado = ({
  datos,
  categoriaKey = "nivel",
  valorKey = "promedio",
  tituloX = "Categoría",
  tituloY = "Valor",
  height = 500,
  showValues = true,
  showReferenceLine = false,
  referenceValue = 4.0,
  referenceLabel = "Meta",
  colorScale = null,
  className = ""
}) => {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Manejar redimensionamiento
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      const width = containerRef.current.clientWidth;
      setDimensions({ width, height });
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [height]);

  // Crear gráfico
  useEffect(() => {
    if (!datos || datos.length === 0 || dimensions.width === 0) return;

    crearBarChart();
  }, [datos, dimensions, categoriaKey, valorKey]);

  const crearBarChart = () => {
    // Limpiar visualización previa
    d3.select(svgRef.current).selectAll("*").remove();

    // Configuración responsive
    const isMobile = dimensions.width < 768;
    const margin = isMobile
      ? { top: 30, right: 20, bottom: 80, left: 60 }
      : { top: 40, right: 40, bottom: 90, left: 80 };

    const width = dimensions.width - margin.left - margin.right;
    const chartHeight = dimensions.height - margin.top - margin.bottom;

    // Crear SVG
    const svg = d3
      .select(svgRef.current)
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Escalas
    const x = d3
      .scaleBand()
      .range([0, width])
      .domain(datos.map((d) => d[categoriaKey]))
      .padding(0.25);

    const maxValor = d3.max(datos, (d) => d[valorKey]);
    const y = d3
      .scaleLinear()
      .domain([0, Math.max(maxValor * 1.1, referenceValue * 1.1)])
      .range([chartHeight, 0])
      .nice();

    // Escala de colores (si no se proporciona una personalizada)
    const defaultColorScale = d3
      .scaleSequential()
      .domain([0, datos.length - 1])
      .interpolator(d3.interpolateViridis);

    const getColor = colorScale || ((d, i) => defaultColorScale(i));

    // Definir gradientes
    const defs = svg.append("defs");
    datos.forEach((d, i) => {
      const baseColor = getColor(d, i);
      const gradient = defs
        .append("linearGradient")
        .attr("id", `gradient-${i}`)
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");

      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", d3.rgb(baseColor).brighter(0.5));

      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", baseColor);
    });

    // Grid horizontal
    g.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.1)
      .call(
        d3
          .axisLeft(y)
          .tickSize(-width)
          .tickFormat("")
      )
      .selectAll("line")
      .style("stroke", "#fff");

    // Ejes
    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x));

    xAxis.selectAll("text")
      .style("font-size", isMobile ? "11px" : "13px")
      .style("fill", "#fff")
      .style("text-anchor", "middle");

    xAxis.selectAll("line, path")
      .style("stroke", "#fff")
      .style("stroke-width", 2);

    const yAxis = g.append("g").call(d3.axisLeft(y).ticks(5));

    yAxis.selectAll("text")
      .style("font-size", isMobile ? "11px" : "13px")
      .style("fill", "#fff");

    yAxis.selectAll("line, path")
      .style("stroke", "#fff")
      .style("stroke-width", 2);

    // Etiquetas de ejes
    g.append("text")
      .attr("x", width / 2)
      .attr("y", chartHeight + (isMobile ? 60 : 70))
      .style("text-anchor", "middle")
      .style("font-size", isMobile ? "12px" : "15px")
      .style("font-weight", "600")
      .style("fill", "#00d9ff")
      .text(tituloX);

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -(isMobile ? 45 : 60))
      .attr("x", -chartHeight / 2)
      .style("text-anchor", "middle")
      .style("font-size", isMobile ? "12px" : "15px")
      .style("font-weight", "600")
      .style("fill", "#00d9ff")
      .text(tituloY);

    // Línea de referencia (opcional)
    if (showReferenceLine) {
      g.append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", y(referenceValue))
        .attr("y2", y(referenceValue))
        .attr("stroke", "#00ff9f")
        .attr("stroke-width", 2.5)
        .attr("stroke-dasharray", "8,4")
        .attr("opacity", 0)
        .transition()
        .duration(1000)
        .delay(datos.length * 150 + 500)
        .attr("opacity", 0.7);

      g.append("text")
        .attr("x", width - 5)
        .attr("y", y(referenceValue) - 8)
        .attr("text-anchor", "end")
        .style("font-size", isMobile ? "11px" : "12px")
        .style("font-weight", "600")
        .style("fill", "#00ff9f")
        .style("opacity", 0)
        .text(`${referenceLabel}: ${referenceValue.toFixed(1)}`)
        .transition()
        .duration(800)
        .delay(datos.length * 150 + 700)
        .style("opacity", 1);
    }

    // Crear tooltip
    const tooltip = d3
      .select(containerRef.current)
      .append("div")
      .attr("class", "tooltip-bar-chart")
      .style("position", "absolute")
      .style("opacity", 0)
      .style("background", "rgba(0, 0, 0, 0.9)")
      .style("color", "#fff")
      .style("padding", "12px")
      .style("border-radius", "8px")
      .style("pointer-events", "none")
      .style("font-size", "13px")
      .style("border", "2px solid #00d9ff")
      .style("z-index", "1000")
      .style("box-shadow", "0 4px 6px rgba(0, 0, 0, 0.3)");

    // Crear barras con animación
    const barras = g
      .selectAll(".barra")
      .data(datos)
      .enter()
      .append("rect")
      .attr("class", "barra")
      .attr("x", (d) => x(d[categoriaKey]))
      .attr("width", x.bandwidth())
      .attr("y", chartHeight)
      .attr("height", 0)
      .attr("fill", (d, i) => `url(#gradient-${i})`)
      .attr("rx", 4)
      .attr("ry", 4)
      .style("cursor", "pointer")
      .attr("opacity", 0.85)
      .on("mouseenter", function (event, d) {
        const currentBar = d3.select(this);
        
        currentBar
          .transition()
          .duration(200)
          .attr("opacity", 1)
          .attr("y", y(d[valorKey]) - 5)
          .attr("height", chartHeight - y(d[valorKey]) + 5);

        tooltip.transition().duration(200).style("opacity", 0.95);
        
        const cantidad = d.cantidad || "";
        const cantidadText = cantidad ? `<br/>Estudiantes: <strong>${cantidad}</strong>` : "";
        const rating = d[valorKey] >= 4 ? '⭐⭐⭐⭐⭐' : 
                      d[valorKey] >= 3.5 ? '⭐⭐⭐⭐' : 
                      d[valorKey] >= 3 ? '⭐⭐⭐' : '⭐⭐';
        
        tooltip
          .html(
            `<strong>${d[categoriaKey]}</strong><br/>
             ${tituloY}: <strong>${d[valorKey].toFixed(2)}</strong>${cantidadText}<br/>
             <small>Rating: ${rating}</small>`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseleave", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 0.85)
          .attr("y", y(d[valorKey]))
          .attr("height", chartHeight - y(d[valorKey]));

        tooltip.transition().duration(200).style("opacity", 0);
      });

    // Animación de entrada con efecto escalonado
    barras
      .transition()
      .duration(1200)
      .delay((d, i) => i * 150)
      .attr("y", (d) => y(d[valorKey]))
      .attr("height", (d) => chartHeight - y(d[valorKey]))
      .ease(d3.easeCubicOut);

    // Valores en las barras (opcional)
    if (showValues) {
      g.selectAll(".etiqueta-valor")
        .data(datos)
        .enter()
        .append("text")
        .attr("class", "etiqueta-valor")
        .attr("x", (d) => x(d[categoriaKey]) + x.bandwidth() / 2)
        .attr("y", chartHeight)
        .attr("text-anchor", "middle")
        .style("font-size", isMobile ? "12px" : "14px")
        .style("font-weight", "700")
        .style("fill", "#fff")
        .style("opacity", 0)
        .style("text-shadow", "0 0 5px rgba(0,0,0,0.8)")
        .text((d) => d[valorKey].toFixed(2))
        .transition()
        .duration(800)
        .delay((d, i) => i * 150 + 600)
        .attr("y", (d) => y(d[valorKey]) - 12)
        .style("opacity", 1);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`bar-chart-container ${className}`}
      style={{ position: "relative", width: "100%", height: `${height}px` }}
    >
      <svg
        ref={svgRef}
        style={{
          display: "block",
        }}
      />
    </div>
  );
};

BarChartOptimizado.propTypes = {
  datos: PropTypes.array.isRequired,
  categoriaKey: PropTypes.string,
  valorKey: PropTypes.string,
  tituloX: PropTypes.string,
  tituloY: PropTypes.string,
  height: PropTypes.number,
  showValues: PropTypes.bool,
  showReferenceLine: PropTypes.bool,
  referenceValue: PropTypes.number,
  referenceLabel: PropTypes.string,
  colorScale: PropTypes.func,
  className: PropTypes.string,
};

export default BarChartOptimizado;
