import { useEffect, useRef, useState, memo } from "react";
import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";

/**
 * Gráfico Sankey que muestra el flujo de uso de IA:
 * Nivel Educativo → Tipo de Tarea → Resultado Final
 * Optimizado con memo para evitar re-renders innecesarios
 */
const SankeyChartFlujo = memo(({ datos, filtroNivel = null }) => {
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);
  const [dimensiones, setDimensiones] = useState({ width: 800, height: 500 });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const isMobile = window.innerWidth < 768;
        setDimensiones({
          width: Math.max(350, width - 40),
          height: isMobile ? 450 : 550,
        });
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
    d3.select(containerRef.current).selectAll("svg").remove();

    // Filtrar datos si hay filtro activo
    const datosFiltrados = filtroNivel
      ? datos.filter((d) => d.nivelEducativo === filtroNivel)
      : datos;

    // Crear nodos únicos
    const nivelesEducativos = [...new Set(datosFiltrados.map((d) => d.nivelEducativo))];
    const tiposTarea = [...new Set(datosFiltrados.map((d) => d.tipoTarea))];
    const resultados = [...new Set(datosFiltrados.map((d) => d.resultadoFinal))];

    const nodes = [
      ...nivelesEducativos.map((n) => ({ name: n, category: "nivel" })),
      ...tiposTarea.map((t) => ({ name: t, category: "tarea" })),
      ...resultados.map((r) => ({ name: r, category: "resultado" })),
    ];

    const nodeMap = new Map(nodes.map((n, i) => [n.name, i]));

    // Crear enlaces: nivel → tarea
    const enlacesNivelTarea = d3.rollup(
      datosFiltrados,
      (v) => v.length,
      (d) => d.nivelEducativo,
      (d) => d.tipoTarea
    );

    // Crear enlaces: tarea → resultado
    const enlacesTareaResultado = d3.rollup(
      datosFiltrados,
      (v) => v.length,
      (d) => d.tipoTarea,
      (d) => d.resultadoFinal
    );

    const links = [];

    enlacesNivelTarea.forEach((tareas, nivel) => {
      tareas.forEach((valor, tarea) => {
        links.push({
          source: nodeMap.get(nivel),
          target: nodeMap.get(tarea),
          value: valor,
        });
      });
    });

    enlacesTareaResultado.forEach((resultados, tarea) => {
      resultados.forEach((valor, resultado) => {
        links.push({
          source: nodeMap.get(tarea),
          target: nodeMap.get(resultado),
          value: valor,
        });
      });
    });

    const { width, height } = dimensiones;
    const margin = { top: 20, right: 150, bottom: 20, left: 20 };

    const svg = d3
      .select(containerRef.current)
      .append("svg")
      .attr("width", "100%")
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const sankeyGenerator = sankey()
      .nodeWidth(20)
      .nodePadding(15)
      .extent([
        [margin.left, margin.top],
        [width - margin.right, height - margin.bottom],
      ]);

    const { nodes: sankeyNodes, links: sankeyLinks } = sankeyGenerator({
      nodes: nodes.map((d) => ({ ...d })),
      links: links.map((d) => ({ ...d })),
    });

    // Colores por categoría
    const colorScale = d3.scaleOrdinal()
      .domain(["nivel", "tarea", "resultado"])
      .range(["#00d9ff", "#ff6b6b", "#6bcb77"]);

    const colorNodos = (d) => {
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

      return (
        coloresNivel[d.name] ||
        coloresTarea[d.name] ||
        coloresResultado[d.name] ||
        "#888"
      );
    };

    // Tooltip
    const tooltip = d3
      .select(containerRef.current)
      .append("div")
      .attr("class", "sankey-tooltip")
      .style("position", "absolute")
      .style("background", "rgba(0, 0, 0, 0.9)")
      .style("color", "#fff")
      .style("padding", "12px 16px")
      .style("border-radius", "8px")
      .style("font-size", "13px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 1000)
      .style("box-shadow", "0 4px 20px rgba(0,0,0,0.3)")
      .style("border", "1px solid rgba(255,255,255,0.1)");

    // Dibujar enlaces
    svg
      .append("g")
      .attr("class", "links")
      .selectAll("path")
      .data(sankeyLinks)
      .join("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("fill", "none")
      .attr("stroke", (d) => colorNodos(d.source))
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", (d) => Math.max(1, d.width))
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke-opacity", 0.8);

        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${d.source.name}</strong> → <strong>${d.target.name}</strong><br/>
            <span style="color: #00d9ff">${d.value.toLocaleString()}</span> sesiones`
          );
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", event.offsetX + 15 + "px")
          .style("top", event.offsetY - 10 + "px");
      })
      .on("mouseout", function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke-opacity", 0.4);
        tooltip.style("opacity", 0);
      });

    // Dibujar nodos
    const nodeGroup = svg
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(sankeyNodes)
      .join("g")
      .style("cursor", "pointer");

    nodeGroup
      .append("rect")
      .attr("x", (d) => d.x0)
      .attr("y", (d) => d.y0)
      .attr("height", (d) => Math.max(1, d.y1 - d.y0))
      .attr("width", (d) => d.x1 - d.x0)
      .attr("fill", colorNodos)
      .attr("rx", 4)
      .attr("opacity", 0.9)
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 1)
          .attr("transform", "scale(1.02)");

        const total = d.value;
        tooltip
          .style("opacity", 1)
          .html(
            `<strong>${d.name}</strong><br/>
            <span style="color: #00d9ff">${total.toLocaleString()}</span> sesiones totales`
          );
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", event.offsetX + 15 + "px")
          .style("top", event.offsetY - 10 + "px");
      })
      .on("mouseout", function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 0.9)
          .attr("transform", "scale(1)");
        tooltip.style("opacity", 0);
      });

    // Etiquetas de nodos
    nodeGroup
      .append("text")
      .attr("x", (d) => (d.x0 < width / 2 ? d.x1 + 8 : d.x0 - 8))
      .attr("y", (d) => (d.y1 + d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d) => (d.x0 < width / 2 ? "start" : "end"))
      .attr("fill", "#e0e0e0")
      .attr("font-size", "12px")
      .attr("font-weight", "500")
      .text((d) => d.name);

    // Leyenda de categorías
    const legendData = [
      { label: "Nivel Educativo", color: "#00d9ff" },
      { label: "Tipo de Tarea", color: "#ff6b6b" },
      { label: "Resultado", color: "#6bcb77" },
    ];

    const legend = svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - 140}, 30)`);

    legend
      .selectAll("g")
      .data(legendData)
      .join("g")
      .attr("transform", (d, i) => `translate(0, ${i * 25})`)
      .each(function (d) {
        const g = d3.select(this);
        g.append("rect")
          .attr("width", 16)
          .attr("height", 16)
          .attr("fill", d.color)
          .attr("rx", 3);
        g.append("text")
          .attr("x", 22)
          .attr("y", 12)
          .attr("fill", "#ccc")
          .attr("font-size", "11px")
          .text(d.label);
      });

    // Animación de entrada
    svg
      .selectAll("path")
      .attr("stroke-dasharray", function () {
        return this.getTotalLength();
      })
      .attr("stroke-dashoffset", function () {
        return this.getTotalLength();
      })
      .transition()
      .duration(1500)
      .ease(d3.easeCubicOut)
      .attr("stroke-dashoffset", 0);

    svg
      .selectAll("rect")
      .attr("opacity", 0)
      .transition()
      .duration(800)
      .delay((d, i) => i * 50)
      .attr("opacity", 0.9);
  };

  return (
    <div
      ref={containerRef}
      className="sankey-chart-container"
      style={{
        position: "relative",
        width: "100%",
        minHeight: "450px",
        background: "rgba(255,255,255,0.02)",
        borderRadius: "12px",
        padding: "20px",
      }}
    />
  );
});

export default SankeyChartFlujo;
