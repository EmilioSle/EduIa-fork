import { useEffect, useRef, useState, memo } from "react";
import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";

/**
 * Gráfico Sankey que muestra la paradoja: Satisfacción → Reutilización
 * Visualiza el flujo de estudiantes desde niveles de satisfacción hacia reutilización
 */
const SankeyParadojaChart = memo(({ datos, onReady }) => {
  const containerRef = useRef(null);
  const [dimensiones, setDimensiones] = useState({ width: 700, height: 400 });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const isMobile = window.innerWidth < 768;
        setDimensiones({
          width: Math.max(320, width - 20),
          height: isMobile ? 380 : 420,
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
  }, [datos, dimensiones]);

  const crearGrafico = () => {
    if (!containerRef.current) return;

    d3.select(containerRef.current).selectAll("*").remove();

    const datosValidos = datos.filter((d) => d.satisfaccion > 0 && d.usoPosterior);

    // Crear rangos de satisfacción
    const getRangoSatisfaccion = (sat) => {
      if (sat <= 2) return "😟 Insatisfecho (1-2)";
      if (sat <= 3) return "😐 Neutral (2-3)";
      if (sat <= 4) return "🙂 Satisfecho (3-4)";
      return "😍 Muy Satisfecho (4-5)";
    };

    // Agrupar datos
    const flujos = d3.rollup(
      datosValidos,
      (v) => v.length,
      (d) => getRangoSatisfaccion(d.satisfaccion),
      (d) => d.usoPosterior === "Sí" ? "✅ Sí Reutiliza" : "❌ No Reutiliza"
    );

    // Crear nodos
    const rangos = ["😟 Insatisfecho (1-2)", "😐 Neutral (2-3)", "🙂 Satisfecho (3-4)", "😍 Muy Satisfecho (4-5)"];
    const reutilizaciones = ["✅ Sí Reutiliza", "❌ No Reutiliza"];

    const nodes = [
      ...rangos.map((r) => ({ name: r, category: "satisfaccion" })),
      ...reutilizaciones.map((r) => ({ name: r, category: "reutilizacion" })),
    ];

    const nodeMap = new Map(nodes.map((n, i) => [n.name, i]));

    // Crear enlaces
    const links = [];
    flujos.forEach((destinos, origen) => {
      destinos.forEach((valor, destino) => {
        if (nodeMap.has(origen) && nodeMap.has(destino)) {
          links.push({
            source: nodeMap.get(origen),
            target: nodeMap.get(destino),
            value: valor,
          });
        }
      });
    });

    const { width, height } = dimensiones;
    const isMobile = window.innerWidth < 768;
    const margin = { top: 30, right: isMobile ? 10 : 20, bottom: 30, left: isMobile ? 10 : 20 };

    // Wrapper
    const wrapper = d3.select(containerRef.current)
      .append("div")
      .style("position", "relative");

    // Calcular correlación y stats
    const satisfacciones = datosValidos.map(d => d.satisfaccion);
    const reutilizacionesNum = datosValidos.map(d => d.usoPosterior === "Sí" ? 1 : 0);
    const correlacion = calcularCorrelacion(satisfacciones, reutilizacionesNum);
    
    // Stats header
    const statsHeader = wrapper.append("div")
      .style("display", "flex")
      .style("justify-content", "space-between")
      .style("align-items", "center")
      .style("margin-bottom", "15px")
      .style("flex-wrap", "wrap")
      .style("gap", "10px");

    statsHeader.append("div")
      .style("font-size", "12px")
      .style("color", "#888")
      .style("display", "flex")
      .style("align-items", "center")
      .style("gap", "8px")
      .html(`
        <span style="background: linear-gradient(90deg, #ff6b6b, #ffd93d, #6bcb77, #00d9ff); padding: 4px 12px; border-radius: 20px; font-weight: 600; color: #0a0e27;">
          Satisfacción
        </span>
        <span style="color: #555;">→</span>
        <span style="background: linear-gradient(90deg, #6bcb77, #ff6b6b); padding: 4px 12px; border-radius: 20px; font-weight: 600; color: #0a0e27;">
          Reutilización
        </span>
      `);

    statsHeader.append("div")
      .style("font-size", "12px")
      .style("padding", "6px 14px")
      .style("background", "rgba(255,255,255,0.05)")
      .style("border-radius", "20px")
      .style("border", `1px solid ${Math.abs(correlacion) < 0.2 ? '#ffd93d' : '#00d9ff'}`)
      .html(`
        Correlación: <strong style="color: ${Math.abs(correlacion) < 0.2 ? '#ffd93d' : '#00d9ff'}">${correlacion.toFixed(3)}</strong>
        <span style="color: #666; font-size: 10px; margin-left: 4px;">${Math.abs(correlacion) < 0.2 ? '(sin relación)' : ''}</span>
      `);

    const svgContainer = wrapper.append("div").style("position", "relative");

    const svg = svgContainer
      .append("svg")
      .attr("width", "100%")
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    // Gradiente de fondo
    const defs = svg.append("defs");
    
    const bgGradient = defs.append("linearGradient")
      .attr("id", "bg-gradient-paradoja")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "100%").attr("y2", "100%");
    bgGradient.append("stop").attr("offset", "0%").attr("stop-color", "rgba(0,217,255,0.03)");
    bgGradient.append("stop").attr("offset", "100%").attr("stop-color", "rgba(255,107,157,0.03)");

    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "url(#bg-gradient-paradoja)")
      .attr("rx", 12);

    const sankeyGenerator = sankey()
      .nodeWidth(isMobile ? 18 : 24)
      .nodePadding(isMobile ? 20 : 30)
      .extent([
        [margin.left + 10, margin.top],
        [width - margin.right - 10, height - margin.bottom],
      ]);

    const { nodes: sankeyNodes, links: sankeyLinks } = sankeyGenerator({
      nodes: nodes.map((d) => ({ ...d })),
      links: links.map((d) => ({ ...d })),
    });

    // Colores para nodos
    const coloresSatisfaccion = {
      "😟 Insatisfecho (1-2)": "#ff6b6b",
      "😐 Neutral (2-3)": "#ffd93d",
      "🙂 Satisfecho (3-4)": "#6bcb77",
      "😍 Muy Satisfecho (4-5)": "#00d9ff",
    };

    const coloresReutilizacion = {
      "✅ Sí Reutiliza": "#6bcb77",
      "❌ No Reutiliza": "#ff6b6b",
    };

    const getColor = (d) => coloresSatisfaccion[d.name] || coloresReutilizacion[d.name] || "#888";

    // Crear gradientes para los enlaces
    sankeyLinks.forEach((link, i) => {
      const gradient = defs.append("linearGradient")
        .attr("id", `link-gradient-${i}`)
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", link.source.x1)
        .attr("x2", link.target.x0);

      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", getColor(link.source));

      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", getColor(link.target));
    });

    // Tooltip
    const tooltip = svgContainer
      .append("div")
      .style("position", "absolute")
      .style("opacity", 0)
      .style("pointer-events", "none")
      .style("z-index", "100");

    // Dibujar enlaces
    const linksGroup = svg.append("g").attr("fill", "none");

    linksGroup
      .selectAll("path")
      .data(sankeyLinks)
      .enter()
      .append("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke", (d, i) => `url(#link-gradient-${i})`)
      .attr("stroke-width", (d) => Math.max(2, d.width))
      .attr("opacity", 0)
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("opacity", 0.9);
        
        const porcentaje = ((d.value / datosValidos.length) * 100).toFixed(1);
        const sourceTotal = sankeyLinks
          .filter(l => l.source.name === d.source.name)
          .reduce((sum, l) => sum + l.value, 0);
        const porcentajeDelGrupo = ((d.value / sourceTotal) * 100).toFixed(1);

        tooltip.transition().duration(150).style("opacity", 1);
        tooltip.html(`
          <div style="padding: 12px; background: rgba(10,14,39,0.98); border-radius: 10px; border: 1px solid rgba(255,255,255,0.2); min-width: 180px;">
            <div style="font-size: 13px; margin-bottom: 8px; color: #fff;">
              <span style="color: ${getColor(d.source)}">${d.source.name.split(' ')[0]}</span>
              → 
              <span style="color: ${getColor(d.target)}">${d.target.name.split(' ')[0]}</span>
            </div>
            <div style="font-size: 22px; font-weight: 700; color: ${getColor(d.target)}; margin-bottom: 6px;">
              ${d.value.toLocaleString()} estudiantes
            </div>
            <div style="font-size: 11px; color: #888;">
              ${porcentajeDelGrupo}% del grupo • ${porcentaje}% del total
            </div>
          </div>
        `)
          .style("left", `${event.offsetX + 10}px`)
          .style("top", `${event.offsetY - 10}px`);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", `${event.offsetX + 10}px`)
          .style("top", `${event.offsetY - 10}px`);
      })
      .on("mouseleave", function () {
        d3.select(this).attr("opacity", 0.6);
        tooltip.transition().duration(200).style("opacity", 0);
      })
      .transition()
      .duration(1000)
      .delay((d, i) => i * 80)
      .attr("opacity", 0.6);

    // Dibujar nodos
    const nodesGroup = svg.append("g");

    nodesGroup
      .selectAll("rect")
      .data(sankeyNodes)
      .enter()
      .append("rect")
      .attr("x", (d) => d.x0)
      .attr("y", (d) => d.y0)
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", 0)
      .attr("fill", (d) => getColor(d))
      .attr("rx", 6)
      .attr("stroke", "#0a0e27")
      .attr("stroke-width", 2)
      .style("filter", "drop-shadow(0 4px 12px rgba(0,0,0,0.3))")
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        d3.select(this).style("filter", "drop-shadow(0 6px 20px rgba(0,0,0,0.5)) brightness(1.2)");
        
        const total = d.value;
        const porcentaje = ((total / datosValidos.length) * 100).toFixed(1);

        tooltip.transition().duration(150).style("opacity", 1);
        tooltip.html(`
          <div style="padding: 12px; background: rgba(10,14,39,0.98); border-radius: 10px; border: 2px solid ${getColor(d)};">
            <div style="font-size: 14px; font-weight: 600; color: ${getColor(d)}; margin-bottom: 8px;">
              ${d.name}
            </div>
            <div style="font-size: 20px; font-weight: 700; color: #fff;">
              ${total.toLocaleString()}
            </div>
            <div style="font-size: 11px; color: #888;">
              ${porcentaje}% del total
            </div>
          </div>
        `)
          .style("left", `${event.offsetX + 10}px`)
          .style("top", `${event.offsetY - 10}px`);
      })
      .on("mouseleave", function () {
        d3.select(this).style("filter", "drop-shadow(0 4px 12px rgba(0,0,0,0.3))");
        tooltip.transition().duration(200).style("opacity", 0);
      })
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .attr("height", (d) => Math.max(d.y1 - d.y0, 8));

    // Etiquetas de nodos
    nodesGroup
      .selectAll("text")
      .data(sankeyNodes)
      .enter()
      .append("text")
      .attr("x", (d) => (d.x0 < width / 2 ? d.x0 - 8 : d.x1 + 8))
      .attr("y", (d) => (d.y0 + d.y1) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d) => (d.x0 < width / 2 ? "end" : "start"))
      .style("font-size", isMobile ? "11px" : "13px")
      .style("font-weight", "600")
      .style("fill", (d) => getColor(d))
      .style("opacity", 0)
      .text((d) => {
        const porcentaje = ((d.value / datosValidos.length) * 100).toFixed(0);
        return isMobile ? d.name.split(' ')[0] : `${d.name.split('(')[0].trim()} (${porcentaje}%)`;
      })
      .transition()
      .duration(600)
      .delay((d, i) => i * 100 + 500)
      .style("opacity", 1);

    // Porcentajes en los nodos
    nodesGroup
      .selectAll(".node-value")
      .data(sankeyNodes)
      .enter()
      .append("text")
      .attr("class", "node-value")
      .attr("x", (d) => (d.x0 + d.x1) / 2)
      .attr("y", (d) => (d.y0 + d.y1) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .style("font-size", isMobile ? "10px" : "11px")
      .style("font-weight", "700")
      .style("fill", "#0a0e27")
      .style("opacity", 0)
      .text((d) => d.value.toLocaleString())
      .transition()
      .duration(600)
      .delay((d, i) => i * 100 + 700)
      .style("opacity", 1);

    // Mensaje de paradoja
    wrapper.append("div")
      .style("margin-top", "15px")
      .style("padding", "14px 18px")
      .style("background", "linear-gradient(135deg, rgba(255,215,61,0.1), rgba(0,217,255,0.1))")
      .style("border-radius", "12px")
      .style("border", "1px solid rgba(255,215,61,0.3)")
      .style("text-align", "center")
      .html(`
        <span style="font-size: 16px;">💡</span>
        <span style="font-size: 13px; color: #ffd93d; font-weight: 600;"> ¡Sorprendente!</span>
        <span style="font-size: 12px; color: #aaa;"> Los flujos son casi idénticos en grosor desde cada nivel de satisfacción. 
        <strong style="color: #00d9ff;">La satisfacción no determina si vuelven a usar la IA.</strong></span>
      `);

    if (onReady) onReady();
  };

  const calcularCorrelacion = (x, y) => {
    const n = x.length;
    const sumX = d3.sum(x);
    const sumY = d3.sum(y);
    const sumXY = d3.sum(x.map((xi, i) => xi * y[i]));
    const sumX2 = d3.sum(x.map((xi) => xi * xi));
    const sumY2 = d3.sum(y.map((yi) => yi * yi));

    const numerador = n * sumXY - sumX * sumY;
    const denominador = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominador === 0 ? 0 : numerador / denominador;
  };

  return (
    <div
      ref={containerRef}
      className="grafico"
      style={{
        background: "rgba(255,255,255,0.02)",
        borderRadius: "16px",
        padding: "20px",
      }}
    />
  );
});

export default SankeyParadojaChart;
