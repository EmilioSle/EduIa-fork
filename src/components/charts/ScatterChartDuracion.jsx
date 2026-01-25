import { useEffect, useRef, useState, useMemo, memo } from "react";
import * as d3 from "d3";

// Número de puntos por defecto a renderizar
const PUNTOS_DEFAULT = 1000;
const PUNTOS_MIN = 100;
const PUNTOS_MAX = 5000;

/**
 * Función de sampling estratificado para mantener representatividad
 */
const sampleData = (datos, maxPuntos) => {
  if (datos.length <= maxPuntos) return datos;
  
  // Sampling estratificado por nivel de satisfacción para mantener distribución
  const grupos = d3.group(datos, d => Math.round(d.satisfaccion));
  const puntosPerGrupo = Math.floor(maxPuntos / grupos.size);
  
  const sampled = [];
  grupos.forEach((grupo) => {
    // Shuffle y tomar muestra del grupo
    const shuffled = d3.shuffle([...grupo]);
    sampled.push(...shuffled.slice(0, puntosPerGrupo));
  });
  
  // Si faltan puntos, agregar aleatoriamente
  if (sampled.length < maxPuntos) {
    const remaining = datos.filter(d => !sampled.includes(d));
    const shuffled = d3.shuffle([...remaining]);
    sampled.push(...shuffled.slice(0, maxPuntos - sampled.length));
  }
  
  return sampled;
};

/**
 * Scatter plot interactivo con zoom, brush y selección
 * Optimizado con sampling para datasets grandes
 * Ahora con control de cantidad de puntos
 */
const ScatterChartDuracion = memo(({ datos, onReady }) => {
  const containerRef = useRef(null);
  const [filtroNivel, setFiltroNivel] = useState("todos");
  const [cantidadPuntos, setCantidadPuntos] = useState(PUNTOS_DEFAULT);

  useEffect(() => {
    if (!datos || !containerRef.current) return;
    crearGrafico();
  }, [datos, filtroNivel, cantidadPuntos]);

  const crearGrafico = () => {
    if (!containerRef.current) return;

    d3.select(containerRef.current).selectAll("*").remove();

    // Filtrar datos válidos
    let datosValidos = datos.filter(
      (d) => d.duracionMinutos > 0 && d.satisfaccion > 0
    );

    if (filtroNivel !== "todos") {
      datosValidos = datosValidos.filter(d => d.nivelEducativo === filtroNivel);
    }

    // Guardar total para mostrar en stats
    const totalPuntos = datosValidos.length;
    
    // Aplicar sampling según la cantidad de puntos seleccionada
    const puntosAMostrar = Math.min(cantidadPuntos, totalPuntos);
    const usandoSampling = datosValidos.length > puntosAMostrar;
    if (usandoSampling) {
      datosValidos = sampleData(datosValidos, puntosAMostrar);
    }

    // Obtener niveles únicos
    const nivelesUnicos = [...new Set(datos.map(d => d.nivelEducativo))];

    // Configuración responsiva
    const containerWidth = containerRef.current.clientWidth;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    const margin = isMobile 
      ? { top: 60, right: 25, bottom: 70, left: 50 }
      : isTablet
      ? { top: 60, right: 30, bottom: 70, left: 60 }
      : { top: 60, right: 30, bottom: 70, left: 70 };
    
    const width = isMobile || isTablet 
      ? Math.max(300, containerWidth - 40) - margin.left - margin.right
      : 700 - margin.left - margin.right;
    const height = isMobile ? 350 : isTablet ? 400 : 450;

    // Wrapper con controles
    const wrapper = d3.select(containerRef.current)
      .append("div")
      .style("position", "relative");

    // Controles de filtro
    const controles = wrapper.append("div")
      .style("display", "flex")
      .style("gap", "10px")
      .style("margin-bottom", "15px")
      .style("flex-wrap", "wrap")
      .style("align-items", "center");

    controles.append("span")
      .style("color", "#888")
      .style("font-size", "13px")
      .text("Filtrar por nivel:");

    const coloresNivel = {
      "todos": "#00d9ff",
      "Pregrado": "#00d9ff",
      "Posgrado": "#9d4edd",
      "Secundaria": "#ffd93d"
    };

    ["todos", ...nivelesUnicos].forEach(nivel => {
      controles.append("button")
        .text(nivel === "todos" ? "Todos" : nivel)
        .style("padding", "6px 14px")
        .style("border-radius", "8px")
        .style("border", `1px solid ${filtroNivel === nivel ? coloresNivel[nivel] : "rgba(255,255,255,0.2)"}`)
        .style("background", filtroNivel === nivel ? `${coloresNivel[nivel]}22` : "rgba(255,255,255,0.05)")
        .style("color", filtroNivel === nivel ? coloresNivel[nivel] : "#888")
        .style("font-size", "12px")
        .style("font-weight", filtroNivel === nivel ? "600" : "400")
        .style("cursor", "pointer")
        .style("transition", "all 0.2s")
        .on("click", () => setFiltroNivel(nivel))
        .on("mouseenter", function() {
          if (filtroNivel !== nivel) {
            d3.select(this)
              .style("border-color", coloresNivel[nivel])
              .style("color", "#fff");
          }
        })
        .on("mouseleave", function() {
          if (filtroNivel !== nivel) {
            d3.select(this)
              .style("border-color", "rgba(255,255,255,0.2)")
              .style("color", "#888");
          }
        });
    });

    // Control de cantidad de puntos
    const controlPuntos = wrapper.append("div")
      .style("display", "flex")
      .style("gap", "15px")
      .style("margin-bottom", "15px")
      .style("align-items", "center")
      .style("background", "linear-gradient(135deg, rgba(0, 217, 255, 0.08), rgba(255, 0, 255, 0.08))")
      .style("padding", "12px 18px")
      .style("border-radius", "12px")
      .style("border", "1px solid rgba(0, 217, 255, 0.2)");

    controlPuntos.append("span")
      .style("color", "#00d9ff")
      .style("font-size", "13px")
      .style("font-weight", "600")
      .style("display", "flex")
      .style("align-items", "center")
      .style("gap", "6px")
      .html(`<span style="font-size: 16px">📊</span> Cantidad de puntos:`);

    const sliderContainer = controlPuntos.append("div")
      .style("display", "flex")
      .style("align-items", "center")
      .style("gap", "12px")
      .style("flex", "1");

    sliderContainer.append("span")
      .style("color", "#666")
      .style("font-size", "11px")
      .text(PUNTOS_MIN);

    const slider = sliderContainer.append("input")
      .attr("type", "range")
      .attr("min", PUNTOS_MIN)
      .attr("max", Math.min(PUNTOS_MAX, totalPuntos))
      .attr("value", cantidadPuntos)
      .attr("step", 100)
      .style("flex", "1")
      .style("height", "6px")
      .style("border-radius", "3px")
      .style("background", `linear-gradient(to right, #00d9ff 0%, #ff00ff ${(cantidadPuntos / Math.min(PUNTOS_MAX, totalPuntos)) * 100}%, rgba(255,255,255,0.1) ${(cantidadPuntos / Math.min(PUNTOS_MAX, totalPuntos)) * 100}%)`)
      .style("appearance", "none")
      .style("-webkit-appearance", "none")
      .style("cursor", "pointer")
      .on("input", function() {
        const valor = +this.value;
        setCantidadPuntos(valor);
      });

    sliderContainer.append("span")
      .style("color", "#666")
      .style("font-size", "11px")
      .text(Math.min(PUNTOS_MAX, totalPuntos).toLocaleString());

    const valorActual = controlPuntos.append("div")
      .style("display", "flex")
      .style("flex-direction", "column")
      .style("align-items", "center")
      .style("background", "rgba(0, 217, 255, 0.15)")
      .style("padding", "8px 16px")
      .style("border-radius", "10px")
      .style("min-width", "80px");

    valorActual.append("span")
      .style("color", "#00d9ff")
      .style("font-size", "20px")
      .style("font-weight", "700")
      .text(datosValidos.length.toLocaleString());

    valorActual.append("span")
      .style("color", "#888")
      .style("font-size", "10px")
      .style("text-transform", "uppercase")
      .text("puntos");

    // Botones rápidos
    const botonesRapidos = controlPuntos.append("div")
      .style("display", "flex")
      .style("gap", "6px");

    [500, 1000, 2000, 5000].forEach(cantidad => {
      if (cantidad <= totalPuntos) {
        botonesRapidos.append("button")
          .text(cantidad >= 1000 ? `${cantidad/1000}K` : cantidad)
          .style("padding", "6px 10px")
          .style("border-radius", "6px")
          .style("border", `1px solid ${cantidadPuntos === cantidad ? "#ff00ff" : "rgba(255,255,255,0.15)"}`)
          .style("background", cantidadPuntos === cantidad ? "rgba(255, 0, 255, 0.2)" : "rgba(255,255,255,0.05)")
          .style("color", cantidadPuntos === cantidad ? "#ff00ff" : "#888")
          .style("font-size", "11px")
          .style("font-weight", cantidadPuntos === cantidad ? "600" : "400")
          .style("cursor", "pointer")
          .style("transition", "all 0.2s")
          .on("click", () => setCantidadPuntos(cantidad))
          .on("mouseenter", function() {
            d3.select(this)
              .style("border-color", "#ff00ff")
              .style("color", "#fff");
          })
          .on("mouseleave", function() {
            if (cantidadPuntos !== cantidad) {
              d3.select(this)
                .style("border-color", "rgba(255,255,255,0.15)")
                .style("color", "#888");
            }
          });
      }
    });

    // Estadísticas en tiempo real
    const statsBox = controles.append("div")
      .style("margin-left", "auto")
      .style("display", "flex")
      .style("gap", "16px")
      .style("background", "rgba(255,255,255,0.03)")
      .style("padding", "8px 14px")
      .style("border-radius", "8px");

    const avgSatisfaccion = d3.mean(datosValidos, d => d.satisfaccion);
    const avgDuracion = d3.mean(datosValidos, d => d.duracionMinutos);

    statsBox.append("span")
      .style("font-size", "12px")
      .style("color", "#888")
      .html(`<span style="color:#ffd93d">⭐</span> Satisfacción promedio: <strong style="color:#fff">${avgSatisfaccion.toFixed(2)}</strong>`);

    statsBox.append("span")
      .style("font-size", "12px")
      .style("color", "#888")
      .html(`<span style="color:#00d9ff">⏱️</span> Duración promedio: <strong style="color:#fff">${avgDuracion.toFixed(0)} min</strong>`);

    statsBox.append("span")
      .style("font-size", "12px")
      .style("color", "#888")
      .html(`<span style="color:#6bcb77">📊</span> Puntos: <strong style="color:#fff">${usandoSampling ? `${datosValidos.length} de ${totalPuntos.toLocaleString()}` : totalPuntos.toLocaleString()}</strong>${usandoSampling ? ' <span style="color:#ffd93d;font-size:10px">(muestra)</span>' : ''}`);

    const svgContainer = wrapper.append("div")
      .style("position", "relative");

    const svg = svgContainer
      .append("svg")
      .attr("width", isMobile || isTablet ? "100%" : width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Clip path para zoom
    svg.append("defs").append("clipPath")
      .attr("id", "clip-scatter")
      .append("rect")
      .attr("width", width)
      .attr("height", height);

    // Escalas
    const x = d3.scaleLinear()
      .domain([0, d3.max(datosValidos, (d) => d.duracionMinutos) * 1.1])
      .range([0, width])
      .nice();

    const y = d3.scaleLinear()
      .domain([0, 5])
      .range([height, 0])
      .nice();

    // Color por nivel educativo
    const colorByLevel = d3.scaleOrdinal()
      .domain(nivelesUnicos)
      .range(["#00d9ff", "#9d4edd", "#ffd93d"]);

    // Grid
    g.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.1)
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(""))
      .selectAll("line")
      .style("stroke", "#fff");

    g.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.1)
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(-height).tickFormat(""))
      .selectAll("line")
      .style("stroke", "#fff");

    // Ejes
    const xAxis = g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(isMobile ? 5 : 8));

    xAxis.selectAll("text").style("font-size", "12px").style("fill", "#fff");
    xAxis.selectAll("line, path").style("stroke", "#fff").style("stroke-width", 2);

    const yAxis = g.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(y).ticks(5));

    yAxis.selectAll("text").style("font-size", "12px").style("fill", "#fff");
    yAxis.selectAll("line, path").style("stroke", "#fff").style("stroke-width", 2);

    // Etiquetas
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + 50)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .style("fill", "#00d9ff")
      .text("Duración de la Sesión (minutos)");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .style("fill", "#00d9ff")
      .text("Nivel de Satisfacción");

    // Línea de tendencia
    const xMean = d3.mean(datosValidos, d => d.duracionMinutos);
    const yMean = d3.mean(datosValidos, d => d.satisfaccion);
    
    let numerator = 0, denominator = 0;
    datosValidos.forEach(d => {
      numerator += (d.duracionMinutos - xMean) * (d.satisfaccion - yMean);
      denominator += (d.duracionMinutos - xMean) ** 2;
    });
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    const maxX = d3.max(datosValidos, d => d.duracionMinutos);
    const lineData = [
      { x: 0, y: Math.max(0, Math.min(5, intercept)) },
      { x: maxX, y: Math.max(0, Math.min(5, intercept + slope * maxX)) }
    ];

    g.append("path")
      .datum(lineData)
      .attr("fill", "none")
      .attr("stroke", "#ff0066")
      .attr("stroke-width", 2.5)
      .attr("stroke-dasharray", "8,4")
      .attr("opacity", 0)
      .attr("d", d3.line().x(d => x(d.x)).y(d => y(d.y)))
      .transition()
      .duration(1500)
      .delay(1000)
      .attr("opacity", 0.7);

    // Etiqueta de tendencia
    g.append("text")
      .attr("x", width - 10)
      .attr("y", y(intercept + slope * maxX) - 10)
      .style("text-anchor", "end")
      .style("font-size", "11px")
      .style("fill", "#ff0066")
      .style("opacity", 0)
      .text(`Tendencia: ${slope > 0 ? "+" : ""}${(slope * 100).toFixed(2)}%`)
      .transition()
      .duration(800)
      .delay(1700)
      .style("opacity", 1);

    // Tooltip
    const tooltip = svgContainer
      .append("div")
      .style("position", "absolute")
      .style("opacity", 0)
      .style("pointer-events", "none")
      .style("z-index", "100");

    // Contenedor de puntos (con clip)
    const pointsGroup = g.append("g")
      .attr("clip-path", "url(#clip-scatter)");

    // Puntos interactivos
    const puntos = pointsGroup.selectAll(".punto")
      .data(datosValidos)
      .enter()
      .append("circle")
      .attr("class", "punto")
      .attr("cx", (d) => x(d.duracionMinutos))
      .attr("cy", (d) => y(d.satisfaccion))
      .attr("r", 0)
      .attr("fill", d => filtroNivel === "todos" ? colorByLevel(d.nivelEducativo) : coloresNivel[filtroNivel])
      .attr("opacity", 0.75)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .style("cursor", "pointer")
      .on("mouseenter", function(event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", 12)
          .attr("opacity", 1)
          .attr("stroke-width", 3);

        tooltip.transition().duration(150).style("opacity", 1);
        tooltip.html(`
          <div style="padding: 12px; background: rgba(10, 14, 39, 0.98); border-radius: 12px; border: 2px solid ${colorByLevel(d.nivelEducativo)}; box-shadow: 0 10px 40px rgba(0,0,0,0.5); min-width: 180px;">
            <div style="font-size: 13px; font-weight: 700; color: ${colorByLevel(d.nivelEducativo)}; margin-bottom: 8px;">${d.nivelEducativo}</div>
            <div style="display: grid; gap: 4px; font-size: 12px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">⏱️ Duración:</span>
                <span style="color: #fff; font-weight: 600;">${d.duracionMinutos.toFixed(0)} min</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">⭐ Satisfacción:</span>
                <span style="color: #ffd93d; font-weight: 600;">${d.satisfaccion}/5</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">📝 Tarea:</span>
                <span style="color: #fff; font-weight: 500;">${d.tipoTarea}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">🔄 Volvería:</span>
                <span style="color: ${d.usoPosterior === "Sí" ? "#6bcb77" : "#ff6b6b"}; font-weight: 500;">${d.usoPosterior}</span>
              </div>
            </div>
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
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", isMobile ? 4 : 5)
          .attr("opacity", 0.75)
          .attr("stroke-width", 1);
        tooltip.transition().duration(150).style("opacity", 0);
      });

    // Animación de entrada
    puntos.transition()
      .duration(1000)
      .delay((d, i) => Math.min(i * 0.5, 500))
      .attr("r", isMobile ? 4 : 5)
      .ease(d3.easeCubicOut);

    // Zoom
    const zoom = d3.zoom()
      .scaleExtent([1, 10])
      .extent([[0, 0], [width, height]])
      .on("zoom", zoomed);

    function zoomed(event) {
      const newX = event.transform.rescaleX(x);
      const newY = event.transform.rescaleY(y);

      xAxis.call(d3.axisBottom(newX).ticks(isMobile ? 5 : 8));
      yAxis.call(d3.axisLeft(newY).ticks(5));

      xAxis.selectAll("text").style("font-size", "12px").style("fill", "#fff");
      yAxis.selectAll("text").style("font-size", "12px").style("fill", "#fff");

      puntos
        .attr("cx", d => newX(d.duracionMinutos))
        .attr("cy", d => newY(d.satisfaccion));
    }

    svg.call(zoom);

    // Instrucciones de zoom
    wrapper.append("div")
      .style("text-align", "center")
      .style("margin-top", "10px")
      .style("font-size", "11px")
      .style("color", "#666")
      .html("🔍 Usa scroll o pinch para hacer zoom • Arrastra para mover");

    // Leyenda
    if (filtroNivel === "todos") {
      const legendWidth = isMobile ? width : 280;
      const legendX = isMobile ? 0 : width - 100;
      const legendY = isMobile ? -45 : -30;
      
      const legend = g.append("g")
        .attr("transform", `translate(${legendX}, ${legendY})`);

      const itemSpacing = isMobile ? Math.min(90, width / nivelesUnicos.length) : 95;

      nivelesUnicos.forEach((nivel, i) => {
        const item = legend.append("g")
          .attr("transform", `translate(${i * itemSpacing}, 0)`);

        item.append("circle")
          .attr("r", isMobile ? 4 : 5)
          .attr("fill", colorByLevel(nivel));

        item.append("text")
          .attr("x", isMobile ? 8 : 10)
          .attr("y", 4)
          .style("font-size", isMobile ? "10px" : "11px")
          .style("fill", "#fff")
          .text(isMobile ? nivel.substring(0, 7) : nivel);
      });
    }

    if (onReady) onReady();
  };

  return <div ref={containerRef} className="grafico"></div>;
});

export default ScatterChartDuracion;
