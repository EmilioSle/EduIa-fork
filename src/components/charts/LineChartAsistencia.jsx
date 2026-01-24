import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

/**
 * Line chart interactivo con comparativa por nivel educativo
 */
const LineChartAsistencia = ({ datos, onReady }) => {
  const containerRef = useRef(null);
  const [modoComparacion, setModoComparacion] = useState(false);
  const [nivelSeleccionado, setNivelSeleccionado] = useState(null);

  useEffect(() => {
    if (!datos || !containerRef.current) return;
    crearGrafico();
  }, [datos, modoComparacion, nivelSeleccionado]);

  const crearGrafico = () => {
    if (!containerRef.current) return;

    d3.select(containerRef.current).selectAll("*").remove();

    // Preparar datos
    const datosValidos = datos.filter((d) => d.satisfaccion > 0);
    const nivelesEducativos = [...new Set(datosValidos.map(d => d.nivelEducativo))];
    
    // Wrapper
    const wrapper = d3.select(containerRef.current)
      .append("div")
      .style("position", "relative");

    // Controles
    const controles = wrapper.append("div")
      .style("display", "flex")
      .style("gap", "12px")
      .style("margin-bottom", "15px")
      .style("flex-wrap", "wrap")
      .style("align-items", "center");

    // Toggle comparación
    controles.append("button")
      .html(modoComparacion ? "📊 Vista Simple" : "📈 Comparar Niveles")
      .style("padding", "8px 16px")
      .style("border-radius", "10px")
      .style("border", `1px solid ${modoComparacion ? "#00ff9f" : "rgba(255,255,255,0.2)"}`)
      .style("background", modoComparacion ? "rgba(0, 255, 159, 0.15)" : "rgba(255,255,255,0.05)")
      .style("color", modoComparacion ? "#00ff9f" : "#aaa")
      .style("font-size", "13px")
      .style("font-weight", "500")
      .style("cursor", "pointer")
      .on("click", () => setModoComparacion(!modoComparacion));

    // Botones de nivel si está en modo comparación
    if (modoComparacion) {
      const coloresNivel = {
        "Pregrado": "#00d9ff",
        "Posgrado": "#9d4edd", 
        "Secundaria": "#ffd93d"
      };

      controles.append("span")
        .style("color", "#666")
        .style("font-size", "12px")
        .style("margin-left", "10px")
        .text("Destacar:");

      nivelesEducativos.forEach(nivel => {
        controles.append("button")
          .text(nivel)
          .style("padding", "6px 12px")
          .style("border-radius", "8px")
          .style("border", `1px solid ${nivelSeleccionado === nivel ? coloresNivel[nivel] : "rgba(255,255,255,0.15)"}`)
          .style("background", nivelSeleccionado === nivel ? `${coloresNivel[nivel]}22` : "transparent")
          .style("color", nivelSeleccionado === nivel ? coloresNivel[nivel] : "#888")
          .style("font-size", "12px")
          .style("cursor", "pointer")
          .on("click", () => setNivelSeleccionado(nivelSeleccionado === nivel ? null : nivel));
      });
    }

    // Procesar datos según modo
    let datosLinea;
    let datosPorNivel = {};
    
    if (modoComparacion) {
      nivelesEducativos.forEach(nivel => {
        const datosNivel = datosValidos.filter(d => d.nivelEducativo === nivel);
        const promedios = d3.rollup(
          datosNivel,
          (v) => ({ promedio: d3.mean(v, d => d.satisfaccion), cantidad: v.length }),
          (d) => d.nivelAsistenciaIA
        );
        datosPorNivel[nivel] = Array.from(promedios, ([asist, data]) => ({
          nivel: parseInt(asist),
          promedio: data.promedio,
          cantidad: data.cantidad,
          nivelEducativo: nivel
        })).sort((a, b) => a.nivel - b.nivel);
      });
    }
    
    const promediosPorAsistencia = d3.rollup(
      datosValidos,
      (v) => ({ promedio: d3.mean(v, (d) => d.satisfaccion), cantidad: v.length }),
      (d) => d.nivelAsistenciaIA
    );
    
    datosLinea = Array.from(promediosPorAsistencia, ([nivel, data]) => ({
      nivel: parseInt(nivel),
      nivelLabel: `Nivel ${nivel}`,
      promedio: data.promedio,
      cantidad: data.cantidad,
    })).sort((a, b) => a.nivel - b.nivel);

    if (datosLinea.length === 0) return;

    // Configuración responsiva
    const containerWidth = containerRef.current.clientWidth;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    const margin = isMobile 
      ? { top: 40, right: 30, bottom: 80, left: 60 }
      : { top: 50, right: 50, bottom: 80, left: 80 };
    
    const width = isMobile || isTablet 
      ? Math.max(300, containerWidth - 40) - margin.left - margin.right
      : 750 - margin.left - margin.right;
    const height = isMobile ? 380 : isTablet ? 420 : 480;

    const svgContainer = wrapper.append("div")
      .style("position", "relative");

    const svg = svgContainer
      .append("svg")
      .attr("width", isMobile || isTablet ? "100%" : width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Escalas
    const x = d3.scaleLinear()
      .domain([d3.min(datosLinea, d => d.nivel), d3.max(datosLinea, d => d.nivel)])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, 5])
      .range([height, 0])
      .nice();

    const coloresNivel = {
      "Pregrado": "#00d9ff",
      "Posgrado": "#9d4edd",
      "Secundaria": "#ffd93d"
    };

    // Gradiente
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "lineAreaGradient-asistencia")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "0%").attr("y2", "100%");
    
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#00ff9f").attr("stop-opacity", 0.4);
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#00ff9f").attr("stop-opacity", 0.05);

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
      .call(d3.axisBottom(x).ticks(datosLinea.length).tickFormat(d => `Nivel ${d}`).tickSizeOuter(0));
    
    xAxis.selectAll("text").style("font-size", isMobile ? "11px" : "13px").style("font-weight", "600").style("fill", "#fff");
    xAxis.selectAll("line, path").style("stroke", "#fff").style("stroke-width", 2);

    const yAxis = svg.append("g").call(d3.axisLeft(y).ticks(5).tickSizeOuter(0));
    yAxis.selectAll("text").style("font-size", "13px").style("font-weight", "500").style("fill", "#fff");
    yAxis.selectAll("line, path").style("stroke", "#fff").style("stroke-width", 2);

    // Etiquetas
    svg.append("text")
      .attr("x", width / 2).attr("y", height + 55)
      .style("text-anchor", "middle").style("font-size", "14px").style("font-weight", "600").style("fill", "#00d9ff")
      .text("Nivel de Asistencia de la IA");

    svg.append("text")
      .attr("transform", "rotate(-90)").attr("y", -60).attr("x", -height / 2)
      .style("text-anchor", "middle").style("font-size", "14px").style("font-weight", "600").style("fill", "#00d9ff")
      .text("Satisfacción Promedio");

    // Tooltip
    const tooltip = svgContainer.append("div")
      .style("position", "absolute")
      .style("opacity", 0)
      .style("pointer-events", "none")
      .style("z-index", "100");

    const line = d3.line().x(d => x(d.nivel)).y(d => y(d.promedio)).curve(d3.curveMonotoneX);
    const area = d3.area().x(d => x(d.nivel)).y0(height).y1(d => y(d.promedio)).curve(d3.curveMonotoneX);

    if (modoComparacion) {
      // Dibujar líneas por nivel educativo
      nivelesEducativos.forEach((nivel, i) => {
        const datos = datosPorNivel[nivel];
        if (!datos || datos.length === 0) return;

        const isHighlighted = !nivelSeleccionado || nivelSeleccionado === nivel;
        const opacity = isHighlighted ? 1 : 0.2;

        // Línea
        svg.append("path")
          .datum(datos)
          .attr("fill", "none")
          .attr("stroke", coloresNivel[nivel])
          .attr("stroke-width", nivelSeleccionado === nivel ? 4 : 3)
          .attr("opacity", opacity)
          .style("filter", isHighlighted ? `drop-shadow(0 0 8px ${coloresNivel[nivel]})` : "none")
          .attr("d", line)
          .attr("stroke-dasharray", function() { return this.getTotalLength(); })
          .attr("stroke-dashoffset", function() { return this.getTotalLength(); })
          .transition()
          .duration(1200)
          .delay(i * 200)
          .attr("stroke-dashoffset", 0);

        // Puntos
        svg.selectAll(`.punto-${nivel}`)
          .data(datos)
          .enter()
          .append("circle")
          .attr("class", `punto-${nivel}`)
          .attr("cx", d => x(d.nivel))
          .attr("cy", height)
          .attr("r", 0)
          .attr("fill", coloresNivel[nivel])
          .attr("stroke", "#fff")
          .attr("stroke-width", 2)
          .attr("opacity", opacity)
          .style("cursor", "pointer")
          .on("mouseenter", function(event, d) {
            d3.select(this).transition().duration(150).attr("r", 12);
            tooltip.transition().duration(150).style("opacity", 1);
            tooltip.html(`
              <div style="padding: 12px; background: rgba(10, 14, 39, 0.98); border-radius: 12px; border: 2px solid ${coloresNivel[nivel]}; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
                <div style="font-size: 14px; font-weight: 700; color: ${coloresNivel[nivel]}; margin-bottom: 8px;">${nivel}</div>
                <div style="font-size: 12px; color: #888;">Asistencia: <strong style="color:#fff">Nivel ${d.nivel}</strong></div>
                <div style="font-size: 12px; color: #888;">Satisfacción: <strong style="color:#ffd93d">⭐ ${d.promedio.toFixed(2)}/5</strong></div>
                <div style="font-size: 12px; color: #888;">Estudiantes: <strong style="color:#fff">${d.cantidad}</strong></div>
              </div>
            `);
            // Ajustar posición para no salirse del contenedor
            const containerRect = containerRef.current.getBoundingClientRect();
            const tooltipWidth = 220;
            let leftPos = event.offsetX + 15;
            if (event.offsetX + tooltipWidth > containerRect.width - 20) {
              leftPos = event.offsetX - tooltipWidth - 15;
            }
            tooltip.style("left", leftPos + "px").style("top", (event.offsetY - 10) + "px");
          })
          .on("mousemove", function(event) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const tooltipWidth = 220;
            let leftPos = event.offsetX + 15;
            if (event.offsetX + tooltipWidth > containerRect.width - 20) {
              leftPos = event.offsetX - tooltipWidth - 15;
            }
            tooltip.style("left", leftPos + "px").style("top", (event.offsetY - 10) + "px");
          })
          .on("mouseleave", function() {
            d3.select(this).transition().duration(150).attr("r", 8);
            tooltip.transition().duration(150).style("opacity", 0);
          })
          .transition()
          .duration(600)
          .delay((d, j) => 800 + i * 200 + j * 100)
          .attr("cy", d => y(d.promedio))
          .attr("r", 8);
      });

      // Leyenda
      const legend = svg.append("g").attr("transform", `translate(${width - 150}, -30)`);
      nivelesEducativos.forEach((nivel, i) => {
        const item = legend.append("g")
          .attr("transform", `translate(0, ${i * 22})`)
          .style("cursor", "pointer")
          .on("click", () => setNivelSeleccionado(nivelSeleccionado === nivel ? null : nivel));

        item.append("line")
          .attr("x1", 0).attr("x2", 20)
          .attr("y1", 0).attr("y2", 0)
          .attr("stroke", coloresNivel[nivel])
          .attr("stroke-width", 3);

        item.append("circle")
          .attr("cx", 10).attr("cy", 0).attr("r", 5)
          .attr("fill", coloresNivel[nivel]);

        item.append("text")
          .attr("x", 28).attr("y", 4)
          .style("font-size", "12px")
          .style("fill", nivelSeleccionado === nivel ? "#fff" : "#aaa")
          .style("font-weight", nivelSeleccionado === nivel ? "600" : "400")
          .text(nivel);
      });

    } else {
      // Vista simple
      svg.append("path")
        .datum(datosLinea)
        .attr("fill", "url(#lineAreaGradient-asistencia)")
        .attr("d", d3.area().x(d => x(d.nivel)).y0(height).y1(height).curve(d3.curveMonotoneX))
        .transition()
        .duration(1500)
        .attr("d", area);

      svg.append("path")
        .datum(datosLinea)
        .attr("fill", "none")
        .attr("stroke", "#00ff9f")
        .attr("stroke-width", 4)
        .style("filter", "drop-shadow(0 0 10px rgba(0, 255, 159, 0.7))")
        .attr("d", line)
        .attr("stroke-dasharray", function() { return this.getTotalLength(); })
        .attr("stroke-dashoffset", function() { return this.getTotalLength(); })
        .transition()
        .duration(1500)
        .attr("stroke-dashoffset", 0);

      // Puntos
      svg.selectAll(".punto")
        .data(datosLinea)
        .enter()
        .append("circle")
        .attr("class", "punto")
        .attr("cx", d => x(d.nivel))
        .attr("cy", height)
        .attr("r", 0)
        .attr("fill", "#00ff9f")
        .attr("stroke", "#fff")
        .attr("stroke-width", 3)
        .style("cursor", "pointer")
        .style("filter", "drop-shadow(0 0 10px rgba(0, 255, 159, 0.8))")
        .on("mouseenter", function(event, d) {
          d3.select(this).transition().duration(150).attr("r", 16);
          tooltip.transition().duration(150).style("opacity", 1);
          tooltip.html(`
            <div style="padding: 14px; background: rgba(10, 14, 39, 0.98); border-radius: 12px; border: 2px solid #00ff9f; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
              <div style="font-size: 15px; font-weight: 700; color: #00ff9f; margin-bottom: 10px;">${d.nivelLabel}</div>
              <div style="display: grid; gap: 6px;">
                <div style="display: flex; justify-content: space-between; gap: 20px;">
                  <span style="color: #888;">⭐ Satisfacción:</span>
                  <span style="color: #ffd93d; font-weight: 700;">${d.promedio.toFixed(2)}/5</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #888;">👥 Estudiantes:</span>
                  <span style="color: #fff; font-weight: 600;">${d.cantidad.toLocaleString()}</span>
                </div>
              </div>
            </div>
          `);
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
        .transition()
        .duration(800)
        .delay((d, i) => 1200 + i * 150)
        .attr("cy", d => y(d.promedio))
        .attr("r", 12);

      // Etiquetas de valor
      svg.selectAll(".etiqueta-valor")
        .data(datosLinea)
        .enter()
        .append("text")
        .attr("x", d => x(d.nivel))
        .attr("y", height)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "700")
        .style("fill", "#fff")
        .style("opacity", 0)
        .text(d => d.promedio.toFixed(2))
        .transition()
        .duration(800)
        .delay((d, i) => 1400 + i * 150)
        .attr("y", d => y(d.promedio) - 22)
        .style("opacity", 1);
    }

    // Línea de referencia
    svg.append("line")
      .attr("x1", 0).attr("x2", width)
      .attr("y1", y(4)).attr("y2", y(4))
      .attr("stroke", "#ff0066")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "6,4")
      .attr("opacity", 0)
      .transition()
      .duration(800)
      .delay(1800)
      .attr("opacity", 0.6);

    svg.append("text")
      .attr("x", width - 5).attr("y", y(4) - 8)
      .attr("text-anchor", "end")
      .style("font-size", "11px")
      .style("fill", "#ff0066")
      .style("opacity", 0)
      .text("Meta: 4.0")
      .transition()
      .duration(800)
      .delay(2000)
      .style("opacity", 1);

    // Tendencia
    const primerValor = datosLinea[0].promedio;
    const ultimoValor = datosLinea[datosLinea.length - 1].promedio;
    const cambio = ((ultimoValor - primerValor) / primerValor * 100);
    const colorTendencia = cambio > 0 ? "#00ff9f" : cambio < 0 ? "#ff6b6b" : "#ffd93d";
    
    svg.append("text")
      .attr("x", 10).attr("y", -20)
      .style("font-size", "13px")
      .style("font-weight", "600")
      .style("fill", colorTendencia)
      .style("opacity", 0)
      .text(`Tendencia: ${cambio > 0 ? "↑" : cambio < 0 ? "↓" : "→"} ${Math.abs(cambio).toFixed(1)}%`)
      .transition()
      .duration(800)
      .delay(2200)
      .style("opacity", 1);

    if (onReady) onReady();
  };

  return <div ref={containerRef} className="grafico"></div>;
};

export default LineChartAsistencia;
