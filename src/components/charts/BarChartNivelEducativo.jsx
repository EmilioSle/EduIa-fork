import { useEffect, useRef } from "react";
import * as d3 from "d3";

/**
 * Gráfico de barras que muestra la distribución de estudiantes por nivel educativo
 */
const BarChartNivelEducativo = ({ datos, onReady }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!datos || !containerRef.current) return;
    crearGrafico();
  }, [datos]);

  const crearGrafico = () => {
    if (!containerRef.current) return;

    // Limpiar contenido previo
    d3.select(containerRef.current).selectAll("*").remove();

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
    const containerWidth = containerRef.current.clientWidth;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    const margin = isMobile 
      ? { top: 30, right: 20, bottom: 100, left: 70 }
      : isTablet
      ? { top: 35, right: 30, bottom: 100, left: 80 }
      : { top: 40, right: 40, bottom: 100, left: 90 };
    
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

    // Colores únicos y distintivos para cada barra
    const coloresBarras = [
      "#00d9ff",  // Cyan brillante
      "#ff6b6b",  // Coral/Rojo
      "#ffd93d",  // Amarillo dorado
      "#6bcb77",  // Verde menta
      "#9d4edd",  // Púrpura vibrante
      "#ff8c42",  // Naranja
      "#4ecdc4",  // Turquesa
      "#f72585",  // Rosa fuerte
    ];

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
      .select(containerRef.current)
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
      .attr("fill", (d, i) => coloresBarras[i % coloresBarras.length])
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

    if (onReady) onReady();
  };

  return <div ref={containerRef} className="grafico"></div>;
};

export default BarChartNivelEducativo;
