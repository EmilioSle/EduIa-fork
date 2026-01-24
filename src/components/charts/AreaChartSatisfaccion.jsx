import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

/**
 * Area Chart interactivo con comparativa por tipo de tarea
 */
const AreaChartSatisfaccion = ({ datos, onReady }) => {
  const containerRef = useRef(null);
  const [modoDetalle, setModoDetalle] = useState(false);
  const [rangoSeleccionado, setRangoSeleccionado] = useState(null);

  useEffect(() => {
    if (!datos || !containerRef.current) return;
    crearGrafico();
  }, [datos, modoDetalle, rangoSeleccionado]);

  const crearGrafico = () => {
    if (!containerRef.current) return;

    d3.select(containerRef.current).selectAll("*").remove();

    // Agrupar por satisfacción y uso posterior
    const datosValidos = datos.filter((d) => d.satisfaccion > 0);
    const tiposTarea = [...new Set(datosValidos.map(d => d.tipoTarea))];
    
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
      
      // Desglose por tipo de tarea
      const porTarea = {};
      tiposTarea.forEach(tarea => {
        const enTarea = enRango.filter(d => d.tipoTarea === tarea);
        const reutTarea = enTarea.filter(d => d.usoPosterior === "Sí").length;
        porTarea[tarea] = {
          total: enTarea.length,
          reutilizan: reutTarea,
          porcentaje: enTarea.length > 0 ? (reutTarea / enTarea.length) * 100 : 0
        };
      });
      
      return {
        rango: rango.label,
        sublabel: rango.sublabel,
        porcentaje: total > 0 ? (reutilizan / total) * 100 : 0,
        total,
        reutilizan,
        porTarea
      };
    });

    // Wrapper
    const wrapper = d3.select(containerRef.current)
      .append("div")
      .style("position", "relative");

    // Controles interactivos
    const controles = wrapper.append("div")
      .style("display", "flex")
      .style("gap", "12px")
      .style("margin-bottom", "15px")
      .style("flex-wrap", "wrap")
      .style("align-items", "center");

    controles.append("button")
      .html(modoDetalle ? "📊 Vista Simple" : "🔍 Ver por Tarea")
      .style("padding", "8px 16px")
      .style("border-radius", "10px")
      .style("border", `1px solid ${modoDetalle ? "#00d9ff" : "rgba(255,255,255,0.2)"}`)
      .style("background", modoDetalle ? "rgba(0, 217, 255, 0.15)" : "rgba(255,255,255,0.05)")
      .style("color", modoDetalle ? "#00d9ff" : "#aaa")
      .style("font-size", "13px")
      .style("font-weight", "500")
      .style("cursor", "pointer")
      .on("click", () => {
        setModoDetalle(!modoDetalle);
        setRangoSeleccionado(null);
      });

    // Botones de rango si está en modo detalle
    if (modoDetalle) {
      controles.append("span")
        .style("color", "#666")
        .style("font-size", "12px")
        .style("margin-left", "10px")
        .text("Analizar:");

      const coloresRango = { "Baja": "#ff6b6b", "Media": "#ffd93d", "Alta": "#00ff9f" };
      
      rangos.forEach(rango => {
        controles.append("button")
          .text(rango.label)
          .style("padding", "6px 12px")
          .style("border-radius", "8px")
          .style("border", `1px solid ${rangoSeleccionado === rango.label ? coloresRango[rango.label] : "rgba(255,255,255,0.15)"}`)
          .style("background", rangoSeleccionado === rango.label ? `${coloresRango[rango.label]}22` : "transparent")
          .style("color", rangoSeleccionado === rango.label ? coloresRango[rango.label] : "#888")
          .style("font-size", "12px")
          .style("cursor", "pointer")
          .on("click", () => setRangoSeleccionado(rangoSeleccionado === rango.label ? null : rango.label));
      });
    }

    // Configuración responsiva mejorada
    const containerWidth = containerRef.current.clientWidth;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    const margin = isMobile 
      ? { top: 30, right: 30, bottom: 100, left: 70 }
      : { top: 40, right: 50, bottom: 100, left: 90 };
    
    const width = isMobile || isTablet 
      ? Math.max(300, containerWidth - 40) - margin.left - margin.right
      : 800 - margin.left - margin.right;
    const height = isMobile ? 400 : isTablet ? 450 : 500;

    const svgContainer = wrapper.append("div").style("position", "relative");

    const svg = svgContainer
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

    // Colores
    const coloresRango = { "Baja": "#ff6b6b", "Media": "#ffd93d", "Alta": "#00ff9f" };
    const coloresTarea = {
      "Escritura académica": "#00d9ff",
      "Investigación": "#9d4edd",
      "Resolución de problemas": "#ff8c42",
      "Programación": "#00ff9f",
      "Estudio para exámenes": "#ffd93d"
    };

    // Definir gradiente para el área
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "areaGradient-satisfaccion")
      .attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
    
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#00d9ff").attr("stop-opacity", 0.8);
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#00d9ff").attr("stop-opacity", 0.1);

    // Grid
    svg.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.1)
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(""))
      .selectAll("line")
      .style("stroke", "#fff");

    // Ejes
    const xAxis = svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSizeOuter(0));

    xAxis.selectAll("text").style("font-size", "15px").style("font-weight", "700").style("fill", "#fff");
    xAxis.selectAll("line, path").style("stroke", "#fff").style("stroke-width", 2);

    const yAxis = svg.append("g").call(d3.axisLeft(y).ticks(10).tickSizeOuter(0));
    yAxis.selectAll("text").style("font-size", "13px").style("font-weight", "500").style("fill", "#fff");
    yAxis.selectAll("line, path").style("stroke", "#fff").style("stroke-width", 2);

    // Etiquetas
    svg.append("text")
      .attr("x", width / 2).attr("y", height + 75)
      .style("text-anchor", "middle").style("font-size", "16px").style("font-weight", "600").style("fill", "#00d9ff")
      .text("Nivel de Satisfacción");

    svg.append("text")
      .attr("transform", "rotate(-90)").attr("y", -60).attr("x", -height / 2)
      .style("text-anchor", "middle").style("font-size", "16px").style("font-weight", "600").style("fill", "#00d9ff")
      .text("% de Reutilización");

    // Tooltip
    const tooltip = svgContainer.append("div")
      .style("position", "absolute")
      .style("opacity", 0)
      .style("pointer-events", "none")
      .style("z-index", "100");

    const line = d3.line().x(d => x(d.rango)).y(d => y(d.porcentaje)).curve(d3.curveMonotoneX);
    const area = d3.area().x(d => x(d.rango)).y0(height).y1(d => y(d.porcentaje)).curve(d3.curveMonotoneX);

    // Dibujar área
    svg.append("path")
      .datum(datosPorRango)
      .attr("fill", "url(#areaGradient-satisfaccion)")
      .attr("d", d3.area().x(d => x(d.rango)).y0(height).y1(height).curve(d3.curveMonotoneX))
      .transition()
      .duration(1500)
      .attr("d", area);

    // Dibujar línea
    svg.append("path")
      .datum(datosPorRango)
      .attr("fill", "none")
      .attr("stroke", "#00ffff")
      .attr("stroke-width", 4)
      .style("filter", "drop-shadow(0 0 8px rgba(0, 255, 255, 0.6))")
      .attr("d", line)
      .attr("stroke-dasharray", function() { return this.getTotalLength(); })
      .attr("stroke-dashoffset", function() { return this.getTotalLength(); })
      .transition()
      .duration(1500)
      .attr("stroke-dashoffset", 0);

    // Puntos interactivos
    svg.selectAll(".punto")
      .data(datosPorRango)
      .enter()
      .append("circle")
      .attr("class", "punto")
      .attr("cx", d => x(d.rango))
      .attr("cy", height)
      .attr("r", 0)
      .attr("fill", d => coloresRango[d.rango])
      .attr("stroke", "#fff")
      .attr("stroke-width", 3)
      .style("cursor", "pointer")
      .style("filter", d => `drop-shadow(0 0 10px ${coloresRango[d.rango]})`)
      .on("mouseenter", function(event, d) {
        d3.select(this).transition().duration(150).attr("r", 18);
        
        let htmlTooltip = `
          <div style="padding: 14px; background: rgba(10, 14, 39, 0.98); border-radius: 12px; border: 2px solid ${coloresRango[d.rango]}; box-shadow: 0 10px 40px rgba(0,0,0,0.5); min-width: 200px;">
            <div style="font-size: 16px; font-weight: 700; color: ${coloresRango[d.rango]}; margin-bottom: 10px;">
              Satisfacción ${d.rango} (${d.sublabel})
            </div>
            <div style="display: grid; gap: 6px; margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">👥 Total:</span>
                <span style="color: #fff; font-weight: 600;">${d.total.toLocaleString()}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">✅ Reutilizan:</span>
                <span style="color: #00ff9f; font-weight: 700;">${d.reutilizan.toLocaleString()} (${d.porcentaje.toFixed(1)}%)</span>
              </div>
            </div>`;
        
        if (modoDetalle) {
          htmlTooltip += `<div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px; margin-top: 4px;">
            <div style="font-size: 11px; color: #888; margin-bottom: 6px;">Por Tipo de Tarea:</div>`;
          
          Object.entries(d.porTarea).slice(0, 4).forEach(([tarea, data]) => {
            if (data.total > 0) {
              htmlTooltip += `<div style="display: flex; justify-content: space-between; font-size: 11px; margin: 3px 0;">
                <span style="color: ${coloresTarea[tarea] || '#aaa'};">${tarea.substring(0, 20)}</span>
                <span style="color: #fff;">${data.porcentaje.toFixed(0)}%</span>
              </div>`;
            }
          });
          htmlTooltip += `</div>`;
        }
        
        htmlTooltip += `</div>`;
        
        tooltip.transition().duration(150).style("opacity", 1);
        tooltip.html(htmlTooltip);
        // Ajustar posición para no salirse del contenedor
        const containerRect = containerRef.current.getBoundingClientRect();
        const tooltipWidth = 250;
        let leftPos = event.offsetX + 15;
        if (event.offsetX + tooltipWidth > containerRect.width - 20) {
          leftPos = event.offsetX - tooltipWidth - 15;
        }
        tooltip.style("left", leftPos + "px").style("top", (event.offsetY - 10) + "px");
      })
      .on("mousemove", function(event) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const tooltipWidth = 250;
        let leftPos = event.offsetX + 15;
        if (event.offsetX + tooltipWidth > containerRect.width - 20) {
          leftPos = event.offsetX - tooltipWidth - 15;
        }
        tooltip.style("left", leftPos + "px").style("top", (event.offsetY - 10) + "px");
      })
      .on("mouseleave", function() {
        d3.select(this).transition().duration(150).attr("r", 12);
        tooltip.transition().duration(150).style("opacity", 0);
      })
      .on("click", function(event, d) {
        if (modoDetalle) {
          setRangoSeleccionado(rangoSeleccionado === d.rango ? null : d.rango);
        }
      })
      .transition()
      .duration(800)
      .delay((d, i) => 1200 + i * 200)
      .attr("cy", d => y(d.porcentaje))
      .attr("r", 12);

    // Etiquetas de valores
    svg.selectAll(".etiqueta-valor")
      .data(datosPorRango)
      .enter()
      .append("text")
      .attr("x", d => x(d.rango))
      .attr("y", height)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "700")
      .style("fill", "#fff")
      .style("opacity", 0)
      .text(d => `${d.porcentaje.toFixed(1)}%`)
      .transition()
      .duration(800)
      .delay((d, i) => 1400 + i * 200)
      .attr("y", d => y(d.porcentaje) - 22)
      .style("opacity", 1);

    // Sub-etiquetas
    svg.selectAll(".sub-etiqueta")
      .data(datosPorRango)
      .enter()
      .append("text")
      .attr("x", d => x(d.rango))
      .attr("y", height + 45)
      .attr("text-anchor", "middle")
      .style("font-size", "13px")
      .style("fill", "#888")
      .style("opacity", 0)
      .text(d => `(${d.sublabel})`)
      .transition()
      .duration(600)
      .delay(1800)
      .style("opacity", 0.9);

    // Panel de detalle si hay rango seleccionado
    if (rangoSeleccionado && modoDetalle) {
      const datosRango = datosPorRango.find(d => d.rango === rangoSeleccionado);
      if (datosRango) {
        const panel = wrapper.append("div")
          .style("margin-top", "20px")
          .style("padding", "20px")
          .style("background", "rgba(0,0,0,0.3)")
          .style("border-radius", "16px")
          .style("border", `2px solid ${coloresRango[rangoSeleccionado]}`)
          .style("animation", "fadeIn 0.3s ease");

        panel.append("div")
          .style("font-size", "16px")
          .style("font-weight", "700")
          .style("color", coloresRango[rangoSeleccionado])
          .style("margin-bottom", "15px")
          .text(`📊 Desglose: Satisfacción ${rangoSeleccionado} (${datosRango.sublabel})`);

        const grid = panel.append("div")
          .style("display", "grid")
          .style("grid-template-columns", "repeat(auto-fit, minmax(180px, 1fr))")
          .style("gap", "12px");

        Object.entries(datosRango.porTarea)
          .filter(([, data]) => data.total > 0)
          .sort((a, b) => b[1].porcentaje - a[1].porcentaje)
          .forEach(([tarea, data]) => {
            const card = grid.append("div")
              .style("padding", "15px")
              .style("background", "rgba(255,255,255,0.03)")
              .style("border-radius", "12px")
              .style("border", `1px solid ${coloresTarea[tarea] || "#555"}55`);

            card.append("div")
              .style("font-size", "13px")
              .style("font-weight", "600")
              .style("color", coloresTarea[tarea] || "#aaa")
              .style("margin-bottom", "8px")
              .text(tarea);

            card.append("div")
              .style("font-size", "28px")
              .style("font-weight", "700")
              .style("color", "#fff")
              .text(`${data.porcentaje.toFixed(1)}%`);

            card.append("div")
              .style("font-size", "11px")
              .style("color", "#888")
              .style("margin-top", "4px")
              .text(`${data.reutilizan} de ${data.total} estudiantes`);

            // Mini barra de progreso
            const barContainer = card.append("div")
              .style("margin-top", "8px")
              .style("height", "4px")
              .style("background", "rgba(255,255,255,0.1)")
              .style("border-radius", "2px")
              .style("overflow", "hidden");

            barContainer.append("div")
              .style("width", `${data.porcentaje}%`)
              .style("height", "100%")
              .style("background", coloresTarea[tarea] || "#aaa")
              .style("border-radius", "2px");
          });
      }
    }

    // Línea de referencia
    svg.append("line")
      .attr("x1", 0).attr("x2", width)
      .attr("y1", y(50)).attr("y2", y(50))
      .attr("stroke", "#ff0066")
      .attr("stroke-width", 2.5)
      .attr("stroke-dasharray", "8,4")
      .attr("opacity", 0)
      .transition()
      .duration(1000)
      .delay(1600)
      .attr("opacity", 0.7);

    svg.append("text")
      .attr("x", width - 5).attr("y", y(50) - 8)
      .attr("text-anchor", "end")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", "#ff0066")
      .style("opacity", 0)
      .text("Meta: 50%")
      .transition()
      .duration(800)
      .delay(1800)
      .style("opacity", 1);

    if (onReady) onReady();
  };

  return <div ref={containerRef} className="grafico"></div>;
};

export default AreaChartSatisfaccion;
