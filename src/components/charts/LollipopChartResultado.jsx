import { useEffect, useRef, useState, memo } from "react";
import * as d3 from "d3";

/**
 * Lollipop Chart interactivo con selección y comparativas
 * Optimizado con memo para evitar re-renders innecesarios
 */
const LollipopChartResultado = memo(({ datos, onReady }) => {
  const containerRef = useRef(null);
  const [ordenActivo, setOrdenActivo] = useState("porcentaje");
  const [resultadoSeleccionado, setResultadoSeleccionado] = useState(null);

  useEffect(() => {
    if (!datos || !containerRef.current) return;
    crearGrafico();
  }, [datos, ordenActivo, resultadoSeleccionado]);

  const crearGrafico = () => {
    if (!containerRef.current) return;

    d3.select(containerRef.current).selectAll("*").remove();

    // Agrupar por resultado final con más detalle
    const nivelesEducativos = [...new Set(datos.map(d => d.nivelEducativo))];
    
    const datosPorResultado = d3.rollup(
      datos,
      (v) => {
        const porNivel = {};
        nivelesEducativos.forEach(nivel => {
          const datosNivel = v.filter(d => d.nivelEducativo === nivel);
          porNivel[nivel] = {
            total: datosNivel.length,
            reutilizan: datosNivel.filter(d => d.usoPosterior === "Sí").length
          };
        });
        return {
          total: v.length,
          reutilizan: v.filter((d) => d.usoPosterior === "Sí").length,
          satisfaccionProm: d3.mean(v, d => d.satisfaccion),
          duracionProm: d3.mean(v, d => d.duracionMinutos),
          porNivel
        };
      },
      (d) => d.resultadoFinal
    );

    let datosArray = Array.from(
      datosPorResultado,
      ([resultado, stats]) => ({
        resultado,
        porcentaje: (stats.reutilizan / stats.total) * 100,
        total: stats.total,
        reutilizan: stats.reutilizan,
        satisfaccionProm: stats.satisfaccionProm,
        duracionProm: stats.duracionProm,
        porNivel: stats.porNivel
      })
    );

    // Ordenar según criterio activo
    if (ordenActivo === "porcentaje") {
      datosArray.sort((a, b) => b.porcentaje - a.porcentaje);
    } else if (ordenActivo === "total") {
      datosArray.sort((a, b) => b.total - a.total);
    } else if (ordenActivo === "alfabetico") {
      datosArray.sort((a, b) => a.resultado.localeCompare(b.resultado));
    }

    // Configuración responsiva (definir primero)
    const containerWidth = containerRef.current.clientWidth || 350;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

    // Wrapper
    const wrapper = d3.select(containerRef.current)
      .append("div")
      .style("position", "relative")
      .style("overflow", "visible");

    // Controles
    const controles = wrapper.append("div")
      .style("display", "flex")
      .style("gap", isMobile ? "8px" : "12px")
      .style("margin-bottom", "15px")
      .style("flex-wrap", "wrap")
      .style("align-items", "center")
      .style("justify-content", isMobile ? "center" : "flex-start");

    controles.append("span")
      .style("color", "#888")
      .style("font-size", isMobile ? "11px" : "13px")
      .style("width", isMobile ? "100%" : "auto")
      .style("text-align", isMobile ? "center" : "left")
      .style("margin-bottom", isMobile ? "5px" : "0")
      .text("Ordenar por:");

    const opciones = [
      { id: "porcentaje", label: isMobile ? "📊 %" : "📊 % Reutilización", color: "#00ff9f" },
      { id: "total", label: isMobile ? "👥 Cant." : "👥 Cantidad", color: "#00d9ff" },
      { id: "alfabetico", label: "🔤 Alfabético", color: "#9d4edd" }
    ];

    opciones.forEach(opcion => {
      controles.append("button")
        .text(opcion.label)
        .style("padding", isMobile ? "6px 10px" : "8px 14px")
        .style("border-radius", "10px")
        .style("border", `1px solid ${ordenActivo === opcion.id ? opcion.color : "rgba(255,255,255,0.15)"}`)
        .style("background", ordenActivo === opcion.id ? `${opcion.color}22` : "transparent")
        .style("color", ordenActivo === opcion.id ? opcion.color : "#888")
        .style("font-size", isMobile ? "11px" : "12px")
        .style("font-weight", "500")
        .style("cursor", "pointer")
        .on("click", () => setOrdenActivo(opcion.id));
    });

    // Márgenes del gráfico
    const margin = isMobile 
      ? { top: 30, right: 60, bottom: 50, left: 120 }
      : isTablet
      ? { top: 35, right: 70, bottom: 55, left: 180 }
      : { top: 40, right: 80, bottom: 60, left: 260 };
    
    const width = Math.max(200, containerWidth - margin.left - margin.right - 20);
    const height = isMobile ? 280 : isTablet ? 340 : 400;

    const svgContainer = wrapper.append("div").style("position", "relative");

    const svg = svgContainer
      .append("svg")
      .attr("width", isMobile || isTablet ? "100%" : width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Escalas
    const y = d3.scaleBand()
      .range([0, height])
      .domain(datosArray.map((d) => d.resultado))
      .padding(0.4);

    const x = d3.scaleLinear()
      .domain([0, 100])
      .range([0, width])
      .nice();

    // Colores
    const coloresDots = ["#00d9ff", "#00ff9f", "#ff8c42", "#9d4edd", "#ff6b6b", "#ffd93d"];
    const coloresNivel = {
      "Pregrado": "#00d9ff",
      "Posgrado": "#9d4edd",
      "Secundaria": "#ffd93d"
    };

    // Grid
    svg.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.1)
      .call(d3.axisBottom(x).tickSize(height).tickFormat(""))
      .selectAll("line")
      .style("stroke", "#fff");

    // Eje Y
    const yAxis = svg.append("g").call(d3.axisLeft(y).tickSizeOuter(0));
    yAxis.selectAll("text")
      .style("font-size", isMobile ? "10px" : isTablet ? "11px" : "13px")
      .style("font-weight", "600")
      .style("fill", d => resultadoSeleccionado === d ? "#fff" : "#aaa")
      .style("cursor", "pointer")
      .each(function(d) {
        const maxLength = isMobile ? 14 : isTablet ? 20 : 35;
        if (d.length > maxLength) {
          d3.select(this).text(d.substring(0, maxLength - 3) + "...");
        }
      })
      .on("click", function(event, d) {
        setResultadoSeleccionado(resultadoSeleccionado === d ? null : d);
      });

    yAxis.selectAll("line, path").style("stroke", "#fff").style("stroke-width", 2);

    // Eje X
    const xAxis = svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(isMobile ? 5 : 10).tickSizeOuter(0));

    xAxis.selectAll("text")
      .style("font-size", isMobile ? "10px" : "13px")
      .style("font-weight", "500")
      .style("fill", "#fff");
    xAxis.selectAll("line, path").style("stroke", "#fff").style("stroke-width", 2);

    svg.append("text")
      .attr("x", width / 2).attr("y", height + (isMobile ? 35 : 45))
      .style("text-anchor", "middle")
      .style("font-size", isMobile ? "12px" : "16px")
      .style("font-weight", "600")
      .style("fill", "#00d9ff")
      .text("% de Reutilización");

    // Tooltip
    const tooltip = svgContainer.append("div")
      .style("position", "absolute")
      .style("opacity", 0)
      .style("pointer-events", "none")
      .style("z-index", "100");

    // Líneas del lollipop
    svg.selectAll(".lollipop-line")
      .data(datosArray)
      .enter()
      .append("line")
      .attr("class", "lollipop-line")
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", d => y(d.resultado) + y.bandwidth() / 2)
      .attr("y2", d => y(d.resultado) + y.bandwidth() / 2)
      .attr("stroke", (d, i) => coloresDots[i % coloresDots.length])
      .attr("stroke-width", isMobile ? 2 : 3)
      .attr("opacity", d => resultadoSeleccionado && resultadoSeleccionado !== d.resultado ? 0.2 : 0.6)
      .transition()
      .duration(1200)
      .delay((d, i) => i * 100)
      .attr("x2", d => x(d.porcentaje));

    // Puntos interactivos
    svg.selectAll(".lollipop-dot")
      .data(datosArray)
      .enter()
      .append("circle")
      .attr("class", "lollipop-dot")
      .attr("cx", 0)
      .attr("cy", d => y(d.resultado) + y.bandwidth() / 2)
      .attr("r", 0)
      .attr("fill", (d, i) => coloresDots[i % coloresDots.length])
      .attr("stroke", "#fff")
      .attr("stroke-width", 3)
      .style("cursor", "pointer")
      .attr("opacity", d => resultadoSeleccionado && resultadoSeleccionado !== d.resultado ? 0.3 : 1)
      .on("mouseenter", function(event, d) {
        const idx = datosArray.findIndex(item => item.resultado === d.resultado);
        d3.select(this).transition().duration(150).attr("r", 20);
        
        tooltip.transition().duration(150).style("opacity", 1);
        tooltip.html(`
          <div style="padding: 14px; background: rgba(10, 14, 39, 0.98); border-radius: 12px; border: 2px solid ${coloresDots[idx % coloresDots.length]}; box-shadow: 0 10px 40px rgba(0,0,0,0.5); min-width: 220px;">
            <div style="font-size: 15px; font-weight: 700; color: ${coloresDots[idx % coloresDots.length]}; margin-bottom: 10px;">${d.resultado}</div>
            <div style="display: grid; gap: 6px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">👥 Total:</span>
                <span style="color: #fff; font-weight: 600;">${d.total.toLocaleString()}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">✅ Reutilizan:</span>
                <span style="color: #00ff9f; font-weight: 700;">${d.reutilizan.toLocaleString()} (${d.porcentaje.toFixed(1)}%)</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">⭐ Satisfacción:</span>
                <span style="color: #ffd93d; font-weight: 600;">${d.satisfaccionProm.toFixed(2)}/5</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">⏱️ Duración prom:</span>
                <span style="color: #fff;">${d.duracionProm.toFixed(0)} min</span>
              </div>
            </div>
            <div style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 10px; padding-top: 8px;">
              <div style="font-size: 11px; color: #888; margin-bottom: 6px;">Click para ver detalles</div>
            </div>
          </div>
        `);
        // Ajustar posición para no salirse del contenedor
        const containerRect = containerRef.current.getBoundingClientRect();
        const tooltipWidth = 260;
        let leftPos = event.offsetX + 15;
        if (event.offsetX + tooltipWidth > containerRect.width - 20) {
          leftPos = event.offsetX - tooltipWidth - 15;
        }
        tooltip.style("left", leftPos + "px").style("top", (event.offsetY - 10) + "px");
      })
      .on("mousemove", function(event) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const tooltipWidth = 260;
        let leftPos = event.offsetX + 15;
        if (event.offsetX + tooltipWidth > containerRect.width - 20) {
          leftPos = event.offsetX - tooltipWidth - 15;
        }
        tooltip.style("left", leftPos + "px").style("top", (event.offsetY - 10) + "px");
      })
      .on("mouseleave", function() {
        d3.select(this).transition().duration(150).attr("r", isMobile ? 10 : 14);
        tooltip.transition().duration(150).style("opacity", 0);
      })
      .on("click", function(event, d) {
        setResultadoSeleccionado(resultadoSeleccionado === d.resultado ? null : d.resultado);
      })
      .transition()
      .duration(1200)
      .delay((d, i) => i * 100)
      .attr("cx", d => x(d.porcentaje))
      .attr("r", isMobile ? 10 : 14);

    // Etiquetas de valor
    svg.selectAll(".etiqueta-valor")
      .data(datosArray)
      .enter()
      .append("text")
      .attr("x", 0)
      .attr("y", d => y(d.resultado) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .style("font-size", isMobile ? "11px" : "14px")
      .style("font-weight", "700")
      .style("fill", "#fff")
      .style("opacity", 0)
      .text(d => `${d.porcentaje.toFixed(1)}%`)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100 + 800)
      .attr("x", d => x(d.porcentaje) + (isMobile ? 15 : 22))
      .style("opacity", d => resultadoSeleccionado && resultadoSeleccionado !== d.resultado ? 0.3 : 1);

    // Destacar mejor resultado (solo en desktop)
    const maxPorcentaje = d3.max(datosArray, d => d.porcentaje);
    const mejorResultado = datosArray.find(d => d.porcentaje === maxPorcentaje);
    
    if (mejorResultado && !resultadoSeleccionado && !isMobile) {
      svg.append("text")
        .attr("x", x(mejorResultado.porcentaje) + 55)
        .attr("y", y(mejorResultado.resultado) + y.bandwidth() / 2)
        .attr("dy", "0.35em")
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

    // Panel de detalle si hay selección
    if (resultadoSeleccionado) {
      const datosResultado = datosArray.find(d => d.resultado === resultadoSeleccionado);
      if (datosResultado) {
        const idx = datosArray.findIndex(d => d.resultado === resultadoSeleccionado);
        
        const panel = wrapper.append("div")
          .style("margin-top", "20px")
          .style("padding", "20px")
          .style("background", "rgba(0,0,0,0.3)")
          .style("border-radius", "16px")
          .style("border", `2px solid ${coloresDots[idx % coloresDots.length]}`)
          .style("animation", "fadeIn 0.3s ease");

        panel.append("div")
          .style("display", "flex")
          .style("justify-content", "space-between")
          .style("align-items", "center")
          .style("margin-bottom", "15px")
          .html(`
            <span style="font-size: 16px; font-weight: 700; color: ${coloresDots[idx % coloresDots.length]};">
              📊 ${resultadoSeleccionado}
            </span>
            <span style="font-size: 12px; color: #888; cursor: pointer;" onclick="this.parentElement.parentElement.remove()">✕ Cerrar</span>
          `);

        // Estadísticas generales
        const stats = panel.append("div")
          .style("display", "grid")
          .style("grid-template-columns", "repeat(4, 1fr)")
          .style("gap", "15px")
          .style("margin-bottom", "20px");

        const statsData = [
          { label: "Reutilización", value: `${datosResultado.porcentaje.toFixed(1)}%`, color: "#00ff9f" },
          { label: "Estudiantes", value: datosResultado.total.toLocaleString(), color: "#00d9ff" },
          { label: "Satisfacción", value: `${datosResultado.satisfaccionProm.toFixed(2)}/5`, color: "#ffd93d" },
          { label: "Duración Prom", value: `${datosResultado.duracionProm.toFixed(0)} min`, color: "#9d4edd" }
        ];

        statsData.forEach(stat => {
          const card = stats.append("div")
            .style("text-align", "center")
            .style("padding", "12px")
            .style("background", "rgba(255,255,255,0.03)")
            .style("border-radius", "10px");

          card.append("div")
            .style("font-size", "24px")
            .style("font-weight", "700")
            .style("color", stat.color)
            .text(stat.value);

          card.append("div")
            .style("font-size", "11px")
            .style("color", "#888")
            .style("margin-top", "4px")
            .text(stat.label);
        });

        // Desglose por nivel educativo
        panel.append("div")
          .style("font-size", "13px")
          .style("font-weight", "600")
          .style("color", "#fff")
          .style("margin-bottom", "12px")
          .text("Reutilización por Nivel Educativo:");

        const nivelesGrid = panel.append("div")
          .style("display", "grid")
          .style("grid-template-columns", "repeat(3, 1fr)")
          .style("gap", "12px");

        Object.entries(datosResultado.porNivel).forEach(([nivel, data]) => {
          const pct = data.total > 0 ? (data.reutilizan / data.total * 100) : 0;
          
          const nivelCard = nivelesGrid.append("div")
            .style("padding", "12px")
            .style("background", `${coloresNivel[nivel]}11`)
            .style("border", `1px solid ${coloresNivel[nivel]}44`)
            .style("border-radius", "10px");

          nivelCard.append("div")
            .style("font-size", "12px")
            .style("color", coloresNivel[nivel])
            .style("font-weight", "600")
            .style("margin-bottom", "6px")
            .text(nivel);

          nivelCard.append("div")
            .style("font-size", "22px")
            .style("font-weight", "700")
            .style("color", "#fff")
            .text(`${pct.toFixed(1)}%`);

          nivelCard.append("div")
            .style("font-size", "10px")
            .style("color", "#888")
            .text(`${data.reutilizan} de ${data.total}`);

          // Mini barra
          const bar = nivelCard.append("div")
            .style("margin-top", "8px")
            .style("height", "4px")
            .style("background", "rgba(255,255,255,0.1)")
            .style("border-radius", "2px");

          bar.append("div")
            .style("width", `${pct}%`)
            .style("height", "100%")
            .style("background", coloresNivel[nivel])
            .style("border-radius", "2px");
        });
      }
    }

    // Línea de referencia
    svg.append("line")
      .attr("x1", x(70)).attr("x2", x(70))
      .attr("y1", 0).attr("y2", height)
      .attr("stroke", "#00ff9f")
      .attr("stroke-width", 2.5)
      .attr("stroke-dasharray", "8,4")
      .attr("opacity", 0)
      .transition()
      .duration(1000)
      .delay(1400)
      .attr("opacity", 0.6);

    svg.append("text")
      .attr("x", x(70)).attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", "#00ff9f")
      .style("opacity", 0)
      .text("Meta: 70%")
      .transition()
      .duration(800)
      .delay(1600)
      .style("opacity", 1);

    if (onReady) onReady();
  };

  return <div ref={containerRef} className="grafico"></div>;
});

export default LollipopChartResultado;
