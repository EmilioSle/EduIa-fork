import { useEffect, useRef, useState, memo } from "react";
import * as d3 from "d3";

/**
 * Scatter Chart que muestra la paradoja: Satisfacción ≠ Lealtad (Reutilización)
 * Visualiza que no hay correlación clara entre satisfacción y reutilización
 */
const ScatterParadojaChart = memo(({ datos, onReady }) => {
  const containerRef = useRef(null);
  const [vistaAgrupada, setVistaAgrupada] = useState(true);

  useEffect(() => {
    if (!datos || !containerRef.current) return;
    crearGrafico();
  }, [datos, vistaAgrupada]);

  const crearGrafico = () => {
    if (!containerRef.current) return;

    d3.select(containerRef.current).selectAll("*").remove();

    // Filtrar datos válidos
    const datosValidos = datos.filter(
      (d) => d.satisfaccion > 0 && d.usoPosterior
    );

    // Configuración responsiva
    const containerWidth = containerRef.current.clientWidth;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

    const margin = isMobile
      ? { top: 60, right: 30, bottom: 80, left: 60 }
      : isTablet
      ? { top: 60, right: 40, bottom: 80, left: 70 }
      : { top: 60, right: 50, bottom: 80, left: 80 };

    const width = Math.max(300, containerWidth - 40) - margin.left - margin.right;
    const height = isMobile ? 350 : isTablet ? 400 : 450;

    // Wrapper con controles
    const wrapper = d3
      .select(containerRef.current)
      .append("div")
      .style("position", "relative");

    // Controles
    const controles = wrapper
      .append("div")
      .style("display", "flex")
      .style("gap", "12px")
      .style("margin-bottom", "15px")
      .style("flex-wrap", "wrap")
      .style("align-items", "center");

    controles
      .append("button")
      .html(vistaAgrupada ? "📊 Vista Agrupada" : "🔍 Puntos Individuales")
      .style("padding", "8px 16px")
      .style("border-radius", "10px")
      .style("border", `1px solid ${vistaAgrupada ? "#00d9ff" : "#ff6b9d"}`)
      .style("background", vistaAgrupada ? "rgba(0,217,255,0.15)" : "rgba(255,107,157,0.15)")
      .style("color", vistaAgrupada ? "#00d9ff" : "#ff6b9d")
      .style("font-size", "13px")
      .style("font-weight", "500")
      .style("cursor", "pointer")
      .on("click", () => setVistaAgrupada(!vistaAgrupada));

    // Estadísticas rápidas
    const totalReutilizan = datosValidos.filter((d) => d.usoPosterior === "Sí").length;
    const porcentajeTotal = ((totalReutilizan / datosValidos.length) * 100).toFixed(1);
    
    // Calcular correlación
    const satisfacciones = datosValidos.map(d => d.satisfaccion);
    const reutilizaciones = datosValidos.map(d => d.usoPosterior === "Sí" ? 1 : 0);
    const correlacion = calcularCorrelacion(satisfacciones, reutilizaciones);

    const statsBox = controles
      .append("div")
      .style("margin-left", "auto")
      .style("display", "flex")
      .style("gap", "20px")
      .style("background", "rgba(255,255,255,0.03)")
      .style("padding", "8px 16px")
      .style("border-radius", "10px");

    statsBox
      .append("span")
      .style("font-size", "12px")
      .style("color", "#888")
      .html(
        `📈 Reutilización global: <strong style="color:#00d9ff">${porcentajeTotal}%</strong>`
      );

    statsBox
      .append("span")
      .style("font-size", "12px")
      .style("color", "#888")
      .html(
        `🔗 Correlación: <strong style="color:${Math.abs(correlacion) < 0.3 ? '#ffd93d' : '#00d9ff'}">${correlacion.toFixed(3)}</strong> ${Math.abs(correlacion) < 0.3 ? '(débil)' : ''}`
      );

    const svgContainer = wrapper.append("div").style("position", "relative");

    const svg = svgContainer
      .append("svg")
      .attr("width", "100%")
      .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    if (vistaAgrupada) {
      // VISTA AGRUPADA: Barras comparativas por rango de satisfacción
      crearVistaAgrupada(g, datosValidos, width, height, margin, svgContainer);
    } else {
      // VISTA PUNTOS: Scatter plot con jitter
      crearVistaPuntos(g, datosValidos, width, height, margin, svgContainer, isMobile);
    }

    // Mensaje de paradoja
    wrapper
      .append("div")
      .style("text-align", "center")
      .style("margin-top", "15px")
      .style("padding", "12px 20px")
      .style("background", "linear-gradient(135deg, rgba(255,107,157,0.1), rgba(0,217,255,0.1))")
      .style("border-radius", "12px")
      .style("border", "1px solid rgba(255,255,255,0.1)")
      .html(`
        <span style="font-size: 14px; color: #ffd93d;">⚠️ <strong>La Paradoja:</strong></span>
        <span style="font-size: 13px; color: #aaa;"> La correlación de <strong style="color:#ff6b9d">${correlacion.toFixed(3)}</strong> indica que la satisfacción 
        <strong style="color:#00d9ff">no predice</strong> la reutilización. Estudiantes insatisfechos vuelven casi igual que los satisfechos.</span>
      `);

    if (onReady) onReady();
  };

  const crearVistaAgrupada = (g, datos, width, height, margin, svgContainer) => {
    // Agrupar por rangos de satisfacción
    const rangos = [
      { min: 1, max: 2, label: "Muy Baja", sublabel: "1-2", color: "#ff4757" },
      { min: 2, max: 3, label: "Baja", sublabel: "2-3", color: "#ff6b6b" },
      { min: 3, max: 4, label: "Media", sublabel: "3-4", color: "#ffd93d" },
      { min: 4, max: 5, label: "Alta", sublabel: "4-5", color: "#6bcb77" },
      { min: 5, max: 5.1, label: "Máxima", sublabel: "5", color: "#00d9ff" },
    ];

    const datosPorRango = rangos.map((rango) => {
      const enRango = datos.filter(
        (d) => d.satisfaccion >= rango.min && d.satisfaccion < rango.max
      );
      const reutilizan = enRango.filter((d) => d.usoPosterior === "Sí").length;
      const noReutilizan = enRango.length - reutilizan;
      return {
        ...rango,
        total: enRango.length,
        reutilizan,
        noReutilizan,
        porcentaje: enRango.length > 0 ? (reutilizan / enRango.length) * 100 : 0,
      };
    }).filter(d => d.total > 0);

    // Escalas
    const x = d3
      .scaleBand()
      .domain(datosPorRango.map((d) => d.label))
      .range([0, width])
      .padding(0.3);

    const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

    // Grid horizontal
    g.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.1)
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(""))
      .selectAll("line")
      .style("stroke", "#fff");

    // Línea de referencia (promedio general)
    const promedioGeneral = d3.mean(datosPorRango, (d) => d.porcentaje);
    
    g.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", y(promedioGeneral))
      .attr("y2", y(promedioGeneral))
      .attr("stroke", "#ff6b9d")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "8,4")
      .attr("opacity", 0.8);

    g.append("text")
      .attr("x", width - 5)
      .attr("y", y(promedioGeneral) - 8)
      .attr("text-anchor", "end")
      .style("font-size", "11px")
      .style("fill", "#ff6b9d")
      .text(`Promedio: ${promedioGeneral.toFixed(1)}%`);

    // Tooltip
    const tooltip = svgContainer
      .append("div")
      .style("position", "absolute")
      .style("opacity", 0)
      .style("pointer-events", "none")
      .style("z-index", "100");

    // Barras con gradiente
    const barras = g
      .selectAll(".barra")
      .data(datosPorRango)
      .enter()
      .append("rect")
      .attr("class", "barra")
      .attr("x", (d) => x(d.label))
      .attr("width", x.bandwidth())
      .attr("y", height)
      .attr("height", 0)
      .attr("rx", 6)
      .attr("fill", (d) => d.color)
      .attr("opacity", 0.85)
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("opacity", 1).attr("filter", "brightness(1.2)");

        tooltip.transition().duration(150).style("opacity", 1);
        tooltip.html(`
          <div style="padding: 14px; background: rgba(10,14,39,0.98); border-radius: 12px; border: 2px solid ${d.color}; min-width: 200px;">
            <div style="font-weight: 700; color: ${d.color}; margin-bottom: 10px; font-size: 15px;">
              Satisfacción ${d.label} (${d.sublabel})
            </div>
            <div style="display: grid; gap: 8px; font-size: 13px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #888;">Total estudiantes:</span>
                <span style="color: #fff; font-weight: 600;">${d.total.toLocaleString()}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6bcb77;">✓ Reutilizan:</span>
                <span style="color: #6bcb77; font-weight: 600;">${d.reutilizan.toLocaleString()} (${d.porcentaje.toFixed(1)}%)</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #ff6b6b;">✗ No reutilizan:</span>
                <span style="color: #ff6b6b; font-weight: 600;">${d.noReutilizan.toLocaleString()} (${(100 - d.porcentaje).toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        `)
          .style("left", `${event.offsetX + 15}px`)
          .style("top", `${event.offsetY - 10}px`);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", `${event.offsetX + 15}px`)
          .style("top", `${event.offsetY - 10}px`);
      })
      .on("mouseleave", function () {
        d3.select(this).attr("opacity", 0.85).attr("filter", "none");
        tooltip.transition().duration(200).style("opacity", 0);
      });

    // Animación de entrada
    barras
      .transition()
      .duration(800)
      .delay((d, i) => i * 100)
      .ease(d3.easeCubicOut)
      .attr("y", (d) => y(d.porcentaje))
      .attr("height", (d) => height - y(d.porcentaje));

    // Etiquetas de porcentaje
    g.selectAll(".label")
      .data(datosPorRango)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", (d) => x(d.label) + x.bandwidth() / 2)
      .attr("y", (d) => y(d.porcentaje) - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "700")
      .style("fill", (d) => d.color)
      .style("opacity", 0)
      .text((d) => `${d.porcentaje.toFixed(1)}%`)
      .transition()
      .duration(800)
      .delay((d, i) => i * 100 + 400)
      .style("opacity", 1);

    // Indicadores de cantidad
    g.selectAll(".cantidad")
      .data(datosPorRango)
      .enter()
      .append("text")
      .attr("class", "cantidad")
      .attr("x", (d) => x(d.label) + x.bandwidth() / 2)
      .attr("y", (d) => Math.min(y(d.porcentaje) + 25, height - 10))
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "#fff")
      .style("opacity", 0)
      .text((d) => `n=${d.total}`)
      .transition()
      .duration(600)
      .delay((d, i) => i * 100 + 600)
      .style("opacity", 0.7);

    // Ejes
    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    xAxis.selectAll("text")
      .style("font-size", "12px")
      .style("font-weight", "500")
      .style("fill", "#fff");
    xAxis.selectAll("line, path").style("stroke", "#fff").style("stroke-width", 2);

    const yAxis = g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat((d) => `${d}%`));
    yAxis.selectAll("text").style("font-size", "12px").style("fill", "#fff");
    yAxis.selectAll("line, path").style("stroke", "#fff").style("stroke-width", 2);

    // Etiquetas de ejes
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + 50)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .style("fill", "#00d9ff")
      .text("Nivel de Satisfacción");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -55)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .style("fill", "#00d9ff")
      .text("% que Reutiliza la IA");
  };

  const crearVistaPuntos = (g, datos, width, height, margin, svgContainer, isMobile) => {
    // Sampling para rendimiento
    const MAX_PUNTOS = 800;
    let datosPlot = datos;
    if (datos.length > MAX_PUNTOS) {
      datosPlot = d3.shuffle([...datos]).slice(0, MAX_PUNTOS);
    }

    // Escalas
    const x = d3.scaleLinear().domain([0.5, 5.5]).range([0, width]);
    const y = d3.scaleBand()
      .domain(["Sí", "No"])
      .range([0, height])
      .padding(0.4);

    // Grid
    g.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.1)
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(""))
      .selectAll("line")
      .style("stroke", "#fff");

    // Ejes
    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat((d) => d.toFixed(0)));

    xAxis.selectAll("text").style("font-size", "12px").style("fill", "#fff");
    xAxis.selectAll("line, path").style("stroke", "#fff").style("stroke-width", 2);

    const yAxis = g.append("g").call(d3.axisLeft(y));
    yAxis.selectAll("text")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .style("fill", (d) => (d === "Sí" ? "#6bcb77" : "#ff6b6b"));
    yAxis.selectAll("line, path").style("stroke", "#fff").style("stroke-width", 2);

    // Etiquetas descriptivas
    g.append("text")
      .attr("x", -10)
      .attr("y", y("Sí") + y.bandwidth() / 2 + 25)
      .attr("text-anchor", "end")
      .style("font-size", "10px")
      .style("fill", "#6bcb77")
      .text("Vuelven a usar");

    g.append("text")
      .attr("x", -10)
      .attr("y", y("No") + y.bandwidth() / 2 + 25)
      .attr("text-anchor", "end")
      .style("font-size", "10px")
      .style("fill", "#ff6b6b")
      .text("No vuelven");

    // Tooltip
    const tooltip = svgContainer
      .append("div")
      .style("position", "absolute")
      .style("opacity", 0)
      .style("pointer-events", "none")
      .style("z-index", "100");

    // Puntos con jitter vertical
    const puntos = g
      .selectAll(".punto")
      .data(datosPlot)
      .enter()
      .append("circle")
      .attr("class", "punto")
      .attr("cx", (d) => x(d.satisfaccion) + (Math.random() - 0.5) * 20)
      .attr("cy", (d) => y(d.usoPosterior) + y.bandwidth() / 2 + (Math.random() - 0.5) * y.bandwidth() * 0.7)
      .attr("r", 0)
      .attr("fill", (d) => (d.usoPosterior === "Sí" ? "#6bcb77" : "#ff6b6b"))
      .attr("opacity", 0.6)
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        d3.select(this).attr("r", 10).attr("opacity", 1);

        tooltip.transition().duration(150).style("opacity", 1);
        tooltip.html(`
          <div style="padding: 10px; background: rgba(10,14,39,0.95); border-radius: 8px; border: 1px solid ${d.usoPosterior === "Sí" ? "#6bcb77" : "#ff6b6b"};">
            <div style="font-size: 13px; margin-bottom: 6px;">
              <span style="color: #ffd93d;">⭐</span> Satisfacción: <strong style="color: #fff;">${d.satisfaccion.toFixed(1)}</strong>
            </div>
            <div style="font-size: 13px; margin-bottom: 6px;">
              <span style="color: ${d.usoPosterior === "Sí" ? "#6bcb77" : "#ff6b6b"};">${d.usoPosterior === "Sí" ? "✓" : "✗"}</span> 
              Reutiliza: <strong style="color: ${d.usoPosterior === "Sí" ? "#6bcb77" : "#ff6b6b"};">${d.usoPosterior}</strong>
            </div>
            <div style="font-size: 11px; color: #888;">
              ${d.nivelEducativo} • ${d.tipoTarea}
            </div>
          </div>
        `)
          .style("left", `${event.offsetX + 15}px`)
          .style("top", `${event.offsetY - 10}px`);
      })
      .on("mouseleave", function () {
        d3.select(this).attr("r", isMobile ? 4 : 5).attr("opacity", 0.6);
        tooltip.transition().duration(200).style("opacity", 0);
      });

    // Animación de entrada
    puntos
      .transition()
      .duration(800)
      .delay((d, i) => Math.random() * 500)
      .attr("r", isMobile ? 4 : 5);

    // Etiquetas de ejes
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height + 50)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .style("fill", "#00d9ff")
      .text("Nivel de Satisfacción (1-5)");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -70)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .style("fill", "#00d9ff")
      .text("¿Reutiliza la IA?");

    // Nota de sampling
    if (datos.length > MAX_PUNTOS) {
      g.append("text")
        .attr("x", width)
        .attr("y", -20)
        .attr("text-anchor", "end")
        .style("font-size", "10px")
        .style("fill", "#666")
        .text(`Mostrando ${MAX_PUNTOS} de ${datos.length.toLocaleString()} puntos`);
    }
  };

  // Función para calcular correlación de Pearson
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

  return <div ref={containerRef} className="grafico"></div>;
});

export default ScatterParadojaChart;
