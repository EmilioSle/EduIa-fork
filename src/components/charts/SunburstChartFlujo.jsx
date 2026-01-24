import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

/**
 * Gráfico Sunburst que muestra la jerarquía:
 * Centro: Total → Nivel Educativo → Tipo de Tarea → Resultado Final
 * Permite hacer zoom al hacer clic en cada segmento
 */
const SunburstChartFlujo = ({ datos, filtroNivel = null }) => {
  const containerRef = useRef(null);
  const [dimensiones, setDimensiones] = useState({ width: 600, height: 600 });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const isMobile = window.innerWidth < 768;
        const size = isMobile ? Math.min(400, width - 40) : Math.min(600, width - 40);
        setDimensiones({ width: size, height: size });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!datos || !containerRef.current) return;
    crearGrafico();
  }, [datos, dimensiones, filtroNivel]);

  const crearGrafico = () => {
    if (!containerRef.current) return;

    // Limpiar contenido previo
    d3.select(containerRef.current).selectAll("*").remove();

    // Filtrar datos si hay filtro activo
    const datosFiltrados = filtroNivel
      ? datos.filter((d) => d.nivelEducativo === filtroNivel)
      : datos;

    // Construir estructura jerárquica
    const jerarquia = {
      name: "Uso de IA",
      children: [],
    };

    // Agrupar por nivel educativo
    const porNivel = d3.group(datosFiltrados, (d) => d.nivelEducativo);

    porNivel.forEach((datosPorNivel, nivel) => {
      const nivelNode = {
        name: nivel,
        children: [],
      };

      // Agrupar por tipo de tarea
      const porTarea = d3.group(datosPorNivel, (d) => d.tipoTarea);

      porTarea.forEach((datosPorTarea, tarea) => {
        const tareaNode = {
          name: tarea,
          children: [],
        };

        // Agrupar por resultado
        const porResultado = d3.group(datosPorTarea, (d) => d.resultadoFinal);

        porResultado.forEach((datosResultado, resultado) => {
          tareaNode.children.push({
            name: resultado,
            value: datosResultado.length,
          });
        });

        nivelNode.children.push(tareaNode);
      });

      jerarquia.children.push(nivelNode);
    });

    const { width, height } = dimensiones;
    const radius = Math.min(width, height) / 2;

    // Colores por categoría
    const coloresNivel = {
      Pregrado: "#00d9ff",
      Posgrado: "#9d4edd",
      Secundaria: "#ffd93d",
    };

    const coloresTarea = {
      Estudio: "#ff6b6b",
      Programación: "#00ff9f",
      Redacción: "#ff8c42",
      "Lluvia de ideas": "#4ecdc4",
      "Ayuda en tareas": "#f72585",
      Investigación: "#7c3aed",
    };

    const coloresResultado = {
      "Tarea completada": "#6bcb77",
      "Idea desarrollada": "#00d9ff",
      Confundido: "#ffd93d",
      Abandonó: "#ff6b6b",
    };

    const getColor = (d) => {
      if (d.depth === 0) return "#1a1f3a";
      if (d.depth === 1) return coloresNivel[d.data.name] || "#888";
      if (d.depth === 2) return coloresTarea[d.data.name] || "#888";
      if (d.depth === 3) return coloresResultado[d.data.name] || "#888";
      return "#888";
    };

    // Crear SVG
    const svg = d3
      .select(containerRef.current)
      .append("svg")
      .attr("width", "100%")
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Crear partición
    const root = d3
      .hierarchy(jerarquia)
      .sum((d) => d.value)
      .sort((a, b) => b.value - a.value);

    const partition = d3.partition().size([2 * Math.PI, radius]);

    partition(root);

    // Generador de arcos
    const arc = d3
      .arc()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius / 2)
      .innerRadius((d) => d.y0)
      .outerRadius((d) => d.y1 - 1);

    // Tooltip
    const tooltip = d3
      .select(containerRef.current)
      .append("div")
      .attr("class", "sunburst-tooltip")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.95)")
      .style("color", "#fff")
      .style("padding", "14px 18px")
      .style("border-radius", "10px")
      .style("font-size", "13px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 1000)
      .style("box-shadow", "0 8px 32px rgba(0,0,0,0.4)")
      .style("border", "1px solid rgba(255,255,255,0.1)")
      .style("max-width", "220px");

    // Variable para zoom
    let currentFocus = root;

    // Función para hacer zoom
    const clicked = (event, p) => {
      if (!p || p === currentFocus) {
        // Zoom out al centro
        currentFocus = root;
      } else {
        currentFocus = p;
      }

      root.each(
        (d) =>
          (d.target = {
            x0: Math.max(0, Math.min(1, (d.x0 - currentFocus.x0) / (currentFocus.x1 - currentFocus.x0))) * 2 * Math.PI,
            x1: Math.max(0, Math.min(1, (d.x1 - currentFocus.x0) / (currentFocus.x1 - currentFocus.x0))) * 2 * Math.PI,
            y0: Math.max(0, d.y0 - currentFocus.y0),
            y1: Math.max(0, d.y1 - currentFocus.y0),
          })
      );

      const t = svg.transition().duration(750);

      path
        .transition(t)
        .tween("data", (d) => {
          const i = d3.interpolate(d.current, d.target);
          return (t) => (d.current = i(t));
        })
        .attrTween("d", (d) => () => arc(d.current))
        .attr("fill-opacity", (d) =>
          arcVisible(d.target) ? (d.children ? 0.85 : 0.7) : 0
        );

      label
        .transition(t)
        .attr("fill-opacity", (d) => (+labelVisible(d.target) ? 1 : 0))
        .attrTween("transform", (d) => () => labelTransform(d.current));
    };

    // Funciones de visibilidad
    const arcVisible = (d) => d.y1 <= radius && d.y0 >= 0 && d.x1 > d.x0;

    const labelVisible = (d) => d.y1 <= radius && d.y0 >= 0 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;

    const labelTransform = (d) => {
      const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
      const y = (d.y0 + d.y1) / 2;
      return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    };

    // Dibujar arcos
    const path = svg
      .append("g")
      .selectAll("path")
      .data(root.descendants().filter((d) => d.depth))
      .join("path")
      .attr("fill", getColor)
      .attr("fill-opacity", (d) => (d.children ? 0.85 : 0.7))
      .attr("d", arc)
      .style("cursor", "pointer")
      .each(function (d) {
        d.current = d;
      });

    // Eventos de interacción
    path
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("fill-opacity", 1)
          .style("filter", "brightness(1.2)");

        const porcentaje = ((d.value / root.value) * 100).toFixed(1);
        const ancestors = d.ancestors().reverse().slice(1);
        const breadcrumb = ancestors.map((a) => a.data.name).join(" → ");

        tooltip
          .style("opacity", 1)
          .html(
            `<div style="margin-bottom: 8px; color: ${getColor(d)}; font-weight: bold; font-size: 14px;">
              ${d.data.name}
            </div>
            <div style="color: #888; font-size: 11px; margin-bottom: 6px;">
              ${breadcrumb}
            </div>
            <div style="display: flex; justify-content: space-between; gap: 16px;">
              <span>📊 Sesiones:</span>
              <strong style="color: #00d9ff;">${d.value.toLocaleString()}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 16px;">
              <span>📈 Del total:</span>
              <strong style="color: #ffd93d;">${porcentaje}%</strong>
            </div>
            <div style="margin-top: 10px; color: #666; font-size: 11px; text-align: center;">
              Clic para hacer zoom
            </div>`
          );
      })
      .on("mousemove", function (event) {
        const rect = containerRef.current.getBoundingClientRect();
        tooltip
          .style("left", event.clientX - rect.left + 15 + "px")
          .style("top", event.clientY - rect.top - 10 + "px");
      })
      .on("mouseout", function (d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("fill-opacity", (d) => (d.children ? 0.85 : 0.7))
          .style("filter", "brightness(1)");

        tooltip.style("opacity", 0);
      })
      .on("click", clicked);

    // Etiquetas
    const label = svg
      .append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .selectAll("text")
      .data(root.descendants().filter((d) => d.depth && labelVisible(d)))
      .join("text")
      .attr("transform", labelTransform)
      .attr("dy", "0.35em")
      .attr("fill", "#fff")
      .attr("font-size", (d) => (d.depth === 1 ? "11px" : "9px"))
      .attr("font-weight", (d) => (d.depth === 1 ? "600" : "400"))
      .style("text-shadow", "0 1px 3px rgba(0,0,0,0.8)")
      .text((d) => {
        const name = d.data.name;
        return name.length > 12 ? name.slice(0, 10) + "..." : name;
      });

    // Centro con información
    svg
      .append("circle")
      .attr("r", radius * 0.18)
      .attr("fill", "#0d1117")
      .attr("stroke", "rgba(0, 217, 255, 0.3)")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("click", (event) => clicked(event, root));

    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.5em")
      .attr("fill", "#fff")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .text("Total");

    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1em")
      .attr("fill", "#00d9ff")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .text(root.value.toLocaleString());

    // Animación de entrada
    path
      .attr("opacity", 0)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 10)
      .attr("opacity", 1);

    // Leyenda
    const legendData = [
      { title: "Nivel Educativo", items: Object.entries(coloresNivel) },
      { title: "Tipo de Tarea", items: Object.entries(coloresTarea).slice(0, 4) },
      { title: "Resultado", items: Object.entries(coloresResultado) },
    ];

    const legendContainer = d3
      .select(containerRef.current)
      .append("div")
      .attr("class", "sunburst-legend")
      .style("display", "flex")
      .style("flex-wrap", "wrap")
      .style("justify-content", "center")
      .style("gap", "24px")
      .style("margin-top", "20px")
      .style("padding", "16px")
      .style("background", "rgba(0,0,0,0.2)")
      .style("border-radius", "10px");

    legendData.forEach((group) => {
      const groupDiv = legendContainer
        .append("div")
        .style("text-align", "center");

      groupDiv
        .append("div")
        .style("color", "#888")
        .style("font-size", "11px")
        .style("margin-bottom", "8px")
        .style("text-transform", "uppercase")
        .style("letter-spacing", "0.5px")
        .text(group.title);

      const itemsDiv = groupDiv
        .append("div")
        .style("display", "flex")
        .style("flex-wrap", "wrap")
        .style("gap", "8px")
        .style("justify-content", "center");

      group.items.forEach(([name, color]) => {
        const item = itemsDiv
          .append("div")
          .style("display", "flex")
          .style("align-items", "center")
          .style("gap", "4px")
          .style("font-size", "11px")
          .style("color", "#ccc");

        item
          .append("span")
          .style("width", "10px")
          .style("height", "10px")
          .style("border-radius", "2px")
          .style("background", color);

        item.append("span").text(name);
      });
    });
  };

  return (
    <div
      ref={containerRef}
      className="sunburst-chart-container"
      style={{
        position: "relative",
        width: "100%",
        minHeight: "500px",
        background: "rgba(255,255,255,0.02)",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    />
  );
};

export default SunburstChartFlujo;
