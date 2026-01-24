import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

/**
 * Gráfico de barras interactivo con zoom, click para detalles y comparativas
 */
const BarChartNivelEducativo = ({ datos, onReady }) => {
  const containerRef = useRef(null);
  const [seleccionado, setSeleccionado] = useState(null);
  const [detalles, setDetalles] = useState(null);

  useEffect(() => {
    if (!datos || !containerRef.current) return;
    crearGrafico();
  }, [datos, seleccionado]);

  const crearGrafico = () => {
    if (!containerRef.current) return;

    // Limpiar contenido previo
    d3.select(containerRef.current).selectAll("*").remove();

    // Procesar datos: contar estudiantes por nivel educativo
    const datosPorNivel = d3.rollup(
      datos,
      (v) => ({
        cantidad: v.length,
        satisfaccionPromedio: d3.mean(v, d => d.satisfaccion),
        duracionPromedio: d3.mean(v, d => d.duracionMinutos),
        reutilizacion: (v.filter(d => d.usoPosterior === "Sí").length / v.length * 100),
        tareas: d3.rollup(v, arr => arr.length, d => d.tipoTarea),
      }),
      (d) => d.nivelEducativo
    );

    const datosArray = Array.from(datosPorNivel, ([nivel, stats]) => ({
      nivel,
      ...stats,
    })).sort((a, b) => b.cantidad - a.cantidad);

    const total = d3.sum(datosArray, d => d.cantidad);

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

    // Crear contenedor principal
    const wrapper = d3.select(containerRef.current)
      .append("div")
      .style("position", "relative");

    const svg = wrapper
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

    // Colores únicos
    const coloresBarras = ["#00d9ff", "#ff6b6b", "#ffd93d", "#6bcb77", "#9d4edd"];

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

    xAxis.selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size", isMobile ? "11px" : "13px")
      .style("font-weight", "500")
      .style("fill", "#fff")
      .attr("dx", "-0.5em")
      .attr("dy", "0.15em");

    xAxis.selectAll("line, path").style("stroke", "#fff").style("stroke-width", 2);

    const yAxis = svg.append("g").call(d3.axisLeft(y).ticks(isMobile ? 5 : 8).tickSizeOuter(0));
    yAxis.selectAll("text").style("font-size", "13px").style("font-weight", "500").style("fill", "#fff");
    yAxis.selectAll("line, path").style("stroke", "#fff").style("stroke-width", 2);

    // Etiquetas de ejes
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + 80)
      .style("text-anchor", "middle")
      .style("font-size", "15px")
      .style("font-weight", "600")
      .style("fill", "#00d9ff")
      .text("Nivel Educativo");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -60)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .style("font-size", "15px")
      .style("font-weight", "600")
      .style("fill", "#00d9ff")
      .text("Número de Estudiantes");

    // Tooltip
    const tooltip = wrapper
      .append("div")
      .attr("class", "tooltip-grafico")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("pointer-events", "none");

    // Panel de detalles
    const panelDetalles = wrapper
      .append("div")
      .attr("class", "panel-detalles-grafico")
      .style("display", "none");

    // Barras interactivas
    const barras = svg.selectAll(".barra")
      .data(datosArray)
      .enter()
      .append("g")
      .attr("class", "grupo-barra");

    // Barra de fondo (para hover más fácil)
    barras.append("rect")
      .attr("class", "barra-fondo")
      .attr("x", (d) => x(d.nivel))
      .attr("width", x.bandwidth())
      .attr("y", 0)
      .attr("height", height)
      .attr("fill", "transparent")
      .style("cursor", "pointer");

    // Barra principal
    const barrasPrincipales = barras.append("rect")
      .attr("class", "barra")
      .attr("x", (d) => x(d.nivel))
      .attr("width", x.bandwidth())
      .attr("y", height)
      .attr("height", 0)
      .attr("fill", (d, i) => coloresBarras[i % coloresBarras.length])
      .attr("rx", 6)
      .attr("ry", 6)
      .style("cursor", "pointer")
      .attr("opacity", d => seleccionado && seleccionado !== d.nivel ? 0.3 : 0.9);

    // Eventos de interacción
    barras
      .on("mouseenter", function(event, d) {
        if (seleccionado && seleccionado !== d.nivel) return;
        
        const barra = d3.select(this).select(".barra");
        barra
          .transition()
          .duration(200)
          .attr("y", y(d.cantidad) - 8)
          .attr("height", height - y(d.cantidad) + 8)
          .attr("opacity", 1);

        // Tooltip mejorado
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip
          .html(`
            <div style="padding: 12px; background: rgba(10, 14, 39, 0.98); border-radius: 12px; border: 1px solid ${coloresBarras[datosArray.indexOf(d)]}; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
              <div style="font-size: 16px; font-weight: 700; color: ${coloresBarras[datosArray.indexOf(d)]}; margin-bottom: 8px;">${d.nivel}</div>
              <div style="display: grid; gap: 6px;">
                <div style="display: flex; justify-content: space-between; gap: 20px;">
                  <span style="color: #888;">Estudiantes:</span>
                  <span style="color: #fff; font-weight: 600;">${d.cantidad.toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #888;">Porcentaje:</span>
                  <span style="color: #fff; font-weight: 600;">${((d.cantidad / total) * 100).toFixed(1)}%</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #888;">Satisfacción:</span>
                  <span style="color: #ffd93d; font-weight: 600;">⭐ ${d.satisfaccionPromedio.toFixed(1)}/5</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #888;">Reutilización:</span>
                  <span style="color: #6bcb77; font-weight: 600;">${d.reutilizacion.toFixed(0)}%</span>
                </div>
              </div>
              <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 11px; color: #666; text-align: center;">
                👆 Click para ver detalles
              </div>
            </div>
          `);
        // Ajustar posición para no salirse del contenedor
        const containerRect = containerRef.current.getBoundingClientRect();
        const tooltipWidth = 250;
        const tooltipHeight = 200;
        let leftPos = event.offsetX + 15;
        let topPos = event.offsetY - 10;
        
        // Detectar borde derecho
        if (event.offsetX + tooltipWidth > containerRect.width - 20) {
          leftPos = event.offsetX - tooltipWidth - 15;
        }
        // Detectar borde inferior
        if (event.offsetY + tooltipHeight > containerRect.height - 20) {
          topPos = event.offsetY - tooltipHeight;
        }
        // Detectar borde superior
        if (topPos < 10) {
          topPos = 10;
        }
        
        tooltip.style("left", leftPos + "px").style("top", topPos + "px");
      })
      .on("mousemove", function(event) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const tooltipWidth = 250;
        const tooltipHeight = 200;
        let leftPos = event.offsetX + 15;
        let topPos = event.offsetY - 10;
        
        // Detectar borde derecho
        if (event.offsetX + tooltipWidth > containerRect.width - 20) {
          leftPos = event.offsetX - tooltipWidth - 15;
        }
        // Detectar borde inferior
        if (event.offsetY + tooltipHeight > containerRect.height - 20) {
          topPos = event.offsetY - tooltipHeight;
        }
        // Detectar borde superior
        if (topPos < 10) {
          topPos = 10;
        }
        
        tooltip.style("left", leftPos + "px").style("top", topPos + "px");
      })
      .on("mouseleave", function(event, d) {
        const barra = d3.select(this).select(".barra");
        barra
          .transition()
          .duration(200)
          .attr("y", y(d.cantidad))
          .attr("height", height - y(d.cantidad))
          .attr("opacity", seleccionado && seleccionado !== d.nivel ? 0.3 : 0.9);

        tooltip.transition().duration(200).style("opacity", 0);
      })
      .on("click", function(event, d) {
        event.stopPropagation();
        
        if (seleccionado === d.nivel) {
          setSeleccionado(null);
          setDetalles(null);
          panelDetalles.style("display", "none");
        } else {
          setSeleccionado(d.nivel);
          
          // Mostrar panel de detalles
          const tareasArray = Array.from(d.tareas, ([tarea, cantidad]) => ({ tarea, cantidad }))
            .sort((a, b) => b.cantidad - a.cantidad);
          
          panelDetalles
            .style("display", "block")
            .html(`
              <div style="background: linear-gradient(135deg, rgba(10, 14, 39, 0.98) 0%, rgba(20, 30, 60, 0.98) 100%); border-radius: 16px; padding: 20px; border: 1px solid ${coloresBarras[datosArray.indexOf(d)]}50; box-shadow: 0 20px 60px rgba(0,0,0,0.5); margin-top: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                  <h4 style="color: ${coloresBarras[datosArray.indexOf(d)]}; font-size: 18px; margin: 0; font-weight: 700;">
                    📊 Análisis: ${d.nivel}
                  </h4>
                  <button onclick="this.parentElement.parentElement.parentElement.style.display='none'" style="background: rgba(255,255,255,0.1); border: none; color: #fff; width: 28px; height: 28px; border-radius: 8px; cursor: pointer; font-size: 16px;">✕</button>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 16px;">
                  <div style="background: rgba(0, 217, 255, 0.1); padding: 12px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #00d9ff;">${d.cantidad.toLocaleString()}</div>
                    <div style="font-size: 11px; color: #888; text-transform: uppercase;">Sesiones</div>
                  </div>
                  <div style="background: rgba(255, 217, 61, 0.1); padding: 12px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #ffd93d;">⭐ ${d.satisfaccionPromedio.toFixed(1)}</div>
                    <div style="font-size: 11px; color: #888; text-transform: uppercase;">Satisfacción</div>
                  </div>
                  <div style="background: rgba(107, 203, 119, 0.1); padding: 12px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #6bcb77;">${d.reutilizacion.toFixed(0)}%</div>
                    <div style="font-size: 11px; color: #888; text-transform: uppercase;">Reutilización</div>
                  </div>
                  <div style="background: rgba(157, 78, 221, 0.1); padding: 12px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 24px; font-weight: 700; color: #9d4edd;">${d.duracionPromedio.toFixed(0)}</div>
                    <div style="font-size: 11px; color: #888; text-transform: uppercase;">Min. Promedio</div>
                  </div>
                </div>
                
                <div style="background: rgba(255,255,255,0.03); border-radius: 10px; padding: 12px;">
                  <div style="font-size: 12px; color: #888; margin-bottom: 10px; text-transform: uppercase; font-weight: 600;">Tipos de Tareas</div>
                  ${tareasArray.slice(0, 5).map((t, i) => `
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                      <div style="flex: 1; background: rgba(255,255,255,0.05); border-radius: 6px; overflow: hidden; height: 24px;">
                        <div style="width: ${(t.cantidad / d.cantidad * 100)}%; height: 100%; background: linear-gradient(90deg, ${coloresBarras[i % coloresBarras.length]}88, ${coloresBarras[i % coloresBarras.length]}); display: flex; align-items: center; padding-left: 8px;">
                          <span style="font-size: 11px; color: #fff; font-weight: 500; white-space: nowrap;">${t.tarea}</span>
                        </div>
                      </div>
                      <span style="font-size: 12px; color: #fff; font-weight: 600; min-width: 50px; text-align: right;">${(t.cantidad / d.cantidad * 100).toFixed(1)}%</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            `);
        }
      });

    // Click fuera para deseleccionar
    wrapper.on("click", function(event) {
      if (event.target.tagName === "svg" || event.target.tagName === "DIV") {
        setSeleccionado(null);
        panelDetalles.style("display", "none");
      }
    });

    // Animación de entrada
    barrasPrincipales
      .transition()
      .duration(1200)
      .delay((d, i) => i * 100)
      .attr("y", (d) => y(d.cantidad))
      .attr("height", (d) => height - y(d.cantidad))
      .ease(d3.easeCubicOut);

    // Etiquetas de valor
    svg.selectAll(".etiqueta-valor")
      .data(datosArray)
      .enter()
      .append("text")
      .attr("class", "etiqueta-valor")
      .attr("x", (d) => x(d.nivel) + x.bandwidth() / 2)
      .attr("y", height)
      .attr("text-anchor", "middle")
      .style("font-size", isMobile ? "11px" : "14px")
      .style("font-weight", "700")
      .style("fill", "#fff")
      .style("opacity", 0)
      .style("pointer-events", "none")
      .text((d) => d.cantidad.toLocaleString())
      .transition()
      .duration(800)
      .delay((d, i) => i * 100 + 800)
      .attr("y", (d) => y(d.cantidad) - 12)
      .style("opacity", 1);

    // Línea de promedio
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
      .delay(1500)
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
      .delay(1700)
      .style("opacity", 1);

    if (onReady) onReady();
  };

  return <div ref={containerRef} className="grafico"></div>;
};

export default BarChartNivelEducativo;
