import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

/**
 * Gráfico donut interactivo con click para detalles y comparativas
 */
const DonutChartTipoTarea = ({ datos, onReady }) => {
  const containerRef = useRef(null);
  const [seleccionado, setSeleccionado] = useState(null);

  useEffect(() => {
    if (!datos || !containerRef.current) return;
    crearGrafico();
  }, [datos, seleccionado]);

  const crearGrafico = () => {
    if (!containerRef.current) return;

    // Limpiar contenido previo
    d3.select(containerRef.current).selectAll("*").remove();

    // Procesar datos con estadísticas detalladas
    const datosPorTarea = d3.rollup(
      datos,
      (v) => ({
        cantidad: v.length,
        satisfaccionPromedio: d3.mean(v, d => d.satisfaccion),
        duracionPromedio: d3.mean(v, d => d.duracionMinutos),
        reutilizacion: (v.filter(d => d.usoPosterior === "Sí").length / v.length * 100),
        niveles: d3.rollup(v, arr => arr.length, d => d.nivelEducativo),
      }),
      (d) => d.tipoTarea
    );

    const datosArray = Array.from(datosPorTarea, ([tarea, stats]) => ({
      tarea,
      cantidad: stats.cantidad,
      ...stats,
    })).sort((a, b) => b.cantidad - a.cantidad);

    // Calcular total y porcentajes
    const total = d3.sum(datosArray, d => d.cantidad);
    datosArray.forEach(d => {
      d.porcentaje = ((d.cantidad / total) * 100).toFixed(1);
    });

    // Configuración responsiva
    const containerWidth = containerRef.current.clientWidth;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    const donutSize = isMobile 
      ? Math.min(320, containerWidth - 40) 
      : isTablet 
      ? 420 
      : 500;
    
    const legendHeight = isMobile ? 220 : isTablet ? 160 : 140;
    const width = isMobile ? donutSize : isTablet ? 550 : 700;
    const height = donutSize + legendHeight + (seleccionado ? 200 : 0);
    const radius = donutSize / 2 - (isMobile ? 35 : 45);
    const innerRadiusRatio = 0.6;
    const fontSize = isMobile ? "11px" : isTablet ? "12px" : "13px";

    // Contenedor principal
    const wrapper = d3.select(containerRef.current)
      .append("div")
      .style("position", "relative");

    const svgElement = wrapper
      .append("svg")
      .attr("width", "100%")
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet");

    const svg = svgElement
      .append("g")
      .attr("transform", `translate(${width / 2},${donutSize / 2})`);

    // Escala de colores
    const colores = ["#00d9ff", "#00ff9f", "#ff00ff", "#ffaa00", "#ff0066", "#7c3aed", "#10b981"];
    const color = d3.scaleOrdinal()
      .domain(datosArray.map((d) => d.tarea))
      .range(colores);

    // Arcos
    const pie = d3.pie().value((d) => d.cantidad).sort(null).padAngle(0.02);

    const arc = d3.arc()
      .innerRadius(radius * innerRadiusRatio)
      .outerRadius(radius)
      .cornerRadius(6);

    const arcHover = d3.arc()
      .innerRadius(radius * innerRadiusRatio - 8)
      .outerRadius(radius * 1.12)
      .cornerRadius(6);

    const arcSelected = d3.arc()
      .innerRadius(radius * innerRadiusRatio - 5)
      .outerRadius(radius * 1.08)
      .cornerRadius(6);

    // Tooltip
    const tooltip = wrapper
      .append("div")
      .style("position", "absolute")
      .style("opacity", 0)
      .style("pointer-events", "none")
      .style("z-index", "100");

    // Dibujar arcos con interactividad
    const arcos = svg.selectAll(".arco")
      .data(pie(datosArray))
      .enter()
      .append("g")
      .attr("class", "arco");

    arcos.append("path")
      .attr("d", d => seleccionado === d.data.tarea ? arcSelected(d) : arc(d))
      .attr("fill", (d) => color(d.data.tarea))
      .attr("opacity", d => seleccionado && seleccionado !== d.data.tarea ? 0.3 : 0.9)
      .attr("stroke", d => seleccionado === d.data.tarea ? "#fff" : "#0a0e27")
      .attr("stroke-width", d => seleccionado === d.data.tarea ? 3 : 2)
      .style("cursor", "pointer")
      .style("filter", d => seleccionado === d.data.tarea 
        ? `drop-shadow(0 0 20px ${color(d.data.tarea)})` 
        : "drop-shadow(0 4px 6px rgba(0,0,0,0.3))")
      .on("mouseenter", function(event, d) {
        if (seleccionado && seleccionado !== d.data.tarea) return;
        
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", arcHover)
          .attr("opacity", 1)
          .style("filter", `drop-shadow(0 0 25px ${color(d.data.tarea)})`);

        // Tooltip rico
        tooltip.transition().duration(200).style("opacity", 1);
        
        const nivelesArray = Array.from(d.data.niveles, ([nivel, cantidad]) => ({ nivel, cantidad }))
          .sort((a, b) => b.cantidad - a.cantidad);
        
        tooltip
          .html(`
            <div style="padding: 14px; background: rgba(10, 14, 39, 0.98); border-radius: 14px; border: 2px solid ${color(d.data.tarea)}; box-shadow: 0 15px 50px rgba(0,0,0,0.6); min-width: 220px;">
              <div style="font-size: 15px; font-weight: 700; color: ${color(d.data.tarea)}; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 20px;">📝</span> ${d.data.tarea}
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                <div style="background: rgba(255,255,255,0.05); padding: 8px; border-radius: 8px; text-align: center;">
                  <div style="font-size: 18px; font-weight: 700; color: #fff;">${d.data.cantidad.toLocaleString()}</div>
                  <div style="font-size: 10px; color: #888; text-transform: uppercase;">Sesiones</div>
                </div>
                <div style="background: rgba(255,255,255,0.05); padding: 8px; border-radius: 8px; text-align: center;">
                  <div style="font-size: 18px; font-weight: 700; color: ${color(d.data.tarea)};">${d.data.porcentaje}%</div>
                  <div style="font-size: 10px; color: #888; text-transform: uppercase;">Del Total</div>
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="color: #ffd93d;">⭐</span>
                  <span style="color: #888; font-size: 11px;">Satisfacción:</span>
                  <span style="color: #fff; font-weight: 600;">${d.data.satisfaccionPromedio.toFixed(1)}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="color: #6bcb77;">🔄</span>
                  <span style="color: #888; font-size: 11px;">Reutiliza:</span>
                  <span style="color: #fff; font-weight: 600;">${d.data.reutilizacion.toFixed(0)}%</span>
                </div>
              </div>
              
              <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">
                <div style="font-size: 10px; color: #666; text-transform: uppercase; margin-bottom: 6px;">Por Nivel Educativo</div>
                ${nivelesArray.map(n => `
                  <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px;">
                    <span style="color: #aaa;">${n.nivel}</span>
                    <span style="color: #fff; font-weight: 500;">${n.cantidad} (${(n.cantidad / d.data.cantidad * 100).toFixed(0)}%)</span>
                  </div>
                `).join('')}
              </div>
              
              <div style="margin-top: 10px; font-size: 10px; color: #555; text-align: center;">
                👆 Click para fijar y ver más detalles
              </div>
            </div>
          `)
          .style("left", (event.offsetX + 20) + "px")
          .style("top", (event.offsetY - 20) + "px");
      })
      .on("mousemove", function(event) {
        tooltip
          .style("left", (event.offsetX + 20) + "px")
          .style("top", (event.offsetY - 20) + "px");
      })
      .on("mouseleave", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("d", seleccionado === d.data.tarea ? arcSelected : arc)
          .attr("opacity", seleccionado && seleccionado !== d.data.tarea ? 0.3 : 0.9)
          .style("filter", seleccionado === d.data.tarea 
            ? `drop-shadow(0 0 20px ${color(d.data.tarea)})` 
            : "drop-shadow(0 4px 6px rgba(0,0,0,0.3))");
        
        tooltip.transition().duration(200).style("opacity", 0);
      })
      .on("click", function(event, d) {
        event.stopPropagation();
        if (seleccionado === d.data.tarea) {
          setSeleccionado(null);
        } else {
          setSeleccionado(d.data.tarea);
        }
      })
      .transition()
      .duration(1400)
      .delay((d, i) => i * 100)
      .ease(d3.easeCubicOut)
      .attrTween("d", function(d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function(t) {
          return seleccionado === d.data.tarea ? arcSelected(interpolate(t)) : arc(interpolate(t));
        };
      });

    // Click fuera para deseleccionar
    svgElement.on("click", function() {
      setSeleccionado(null);
    });

    // Porcentajes dentro del donut
    arcos.append("text")
      .attr("transform", (d) => `translate(${arc.centroid(d)})`)
      .attr("dy", "0.35em")
      .style("text-anchor", "middle")
      .style("font-size", isMobile ? "11px" : "14px")
      .style("font-weight", "700")
      .style("fill", "#fff")
      .style("text-shadow", "0 0 8px rgba(0,0,0,0.9)")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .text((d) => d.data.porcentaje > 5 ? `${d.data.porcentaje}%` : "")
      .transition()
      .duration(800)
      .delay(1600)
      .style("opacity", 1);

    // Centro del donut - información dinámica
    const centerGroup = svg.append("g").attr("class", "center-text");
    
    if (seleccionado) {
      const dataSel = datosArray.find(d => d.tarea === seleccionado);
      centerGroup.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "-1em")
        .style("font-size", "12px")
        .style("font-weight", "600")
        .style("fill", color(seleccionado))
        .text(seleccionado.length > 12 ? seleccionado.substring(0, 12) + "..." : seleccionado);
      
      centerGroup.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.5em")
        .style("font-size", isMobile ? "24px" : "32px")
        .style("font-weight", "900")
        .style("fill", "#fff")
        .text(dataSel.cantidad.toLocaleString());
      
      centerGroup.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "2.2em")
        .style("font-size", "11px")
        .style("fill", "#888")
        .text("sesiones");
    } else {
      centerGroup.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "-0.3em")
        .style("font-size", isMobile ? "28px" : "36px")
        .style("font-weight", "900")
        .style("fill", "#00d9ff")
        .text(total.toLocaleString());

      centerGroup.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "1.5em")
        .style("font-size", isMobile ? "11px" : "13px")
        .style("font-weight", "600")
        .style("fill", "#888")
        .text("Sesiones Totales");
    }

    centerGroup.style("opacity", 0)
      .transition()
      .duration(800)
      .delay(1400)
      .style("opacity", 1);

    // Leyenda interactiva
    const legendGroup = svgElement.append("g")
      .attr("transform", `translate(0, ${donutSize + 30})`);

    const itemsPerRow = isMobile ? 1 : isTablet ? 2 : 3;
    const itemWidth = width / itemsPerRow;
    const rowHeight = 36;

    datosArray.forEach((d, i) => {
      const row = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;
      
      const xPosition = isMobile ? 20 : col * itemWidth + 20;
      
      const legendItem = legendGroup.append("g")
        .attr("transform", `translate(${xPosition}, ${row * rowHeight})`)
        .style("cursor", "pointer")
        .on("mouseenter", function() {
          d3.select(this).select("rect").attr("opacity", 1);
          d3.select(this).select("text").style("fill", "#fff");
        })
        .on("mouseleave", function() {
          d3.select(this).select("rect").attr("opacity", seleccionado === d.tarea ? 1 : 0.8);
          d3.select(this).select("text").style("fill", seleccionado === d.tarea ? "#fff" : "#ccc");
        })
        .on("click", function(event) {
          event.stopPropagation();
          if (seleccionado === d.tarea) {
            setSeleccionado(null);
          } else {
            setSeleccionado(d.tarea);
          }
        });

      legendItem.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .attr("rx", 4)
        .attr("fill", color(d.tarea))
        .attr("opacity", seleccionado === d.tarea ? 1 : 0.8)
        .style("filter", seleccionado === d.tarea ? `drop-shadow(0 0 8px ${color(d.tarea)})` : "none");

      legendItem.append("text")
        .attr("x", 26)
        .attr("y", 9)
        .attr("dy", "0.35em")
        .style("font-size", fontSize)
        .style("fill", seleccionado === d.tarea ? "#fff" : "#ccc")
        .style("font-weight", seleccionado === d.tarea ? "600" : "500")
        .text(() => {
          const texto = `${d.tarea} (${d.porcentaje}%)`;
          const maxLength = isMobile ? 25 : isTablet ? 30 : 35;
          return texto.length > maxLength ? texto.substring(0, maxLength - 3) + "..." : texto;
        });
    });

    // Panel de detalles cuando hay selección
    if (seleccionado) {
      const dataSel = datosArray.find(d => d.tarea === seleccionado);
      const nivelesArray = Array.from(dataSel.niveles, ([nivel, cantidad]) => ({ nivel, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad);
      
      const panelY = donutSize + legendHeight - 20;
      
      const panel = svgElement.append("g")
        .attr("transform", `translate(20, ${panelY})`);
      
      panel.append("rect")
        .attr("width", width - 40)
        .attr("height", 180)
        .attr("rx", 12)
        .attr("fill", "rgba(10, 14, 39, 0.9)")
        .attr("stroke", color(seleccionado))
        .attr("stroke-width", 2);

      panel.append("text")
        .attr("x", 16)
        .attr("y", 28)
        .style("font-size", "14px")
        .style("font-weight", "700")
        .style("fill", color(seleccionado))
        .text(`📊 Análisis detallado: ${seleccionado}`);

      // Stats
      const stats = [
        { label: "Satisfacción", value: `⭐ ${dataSel.satisfaccionPromedio.toFixed(1)}/5`, color: "#ffd93d" },
        { label: "Duración Prom.", value: `⏱️ ${dataSel.duracionPromedio.toFixed(0)} min`, color: "#00d9ff" },
        { label: "Reutilización", value: `🔄 ${dataSel.reutilizacion.toFixed(0)}%`, color: "#6bcb77" },
      ];
      
      stats.forEach((stat, i) => {
        panel.append("text")
          .attr("x", 16 + i * 140)
          .attr("y", 55)
          .style("font-size", "10px")
          .style("fill", "#888")
          .text(stat.label);
        
        panel.append("text")
          .attr("x", 16 + i * 140)
          .attr("y", 75)
          .style("font-size", "14px")
          .style("font-weight", "700")
          .style("fill", stat.color)
          .text(stat.value);
      });

      // Mini barras por nivel
      panel.append("text")
        .attr("x", 16)
        .attr("y", 105)
        .style("font-size", "10px")
        .style("fill", "#888")
        .style("text-transform", "uppercase")
        .text("Distribución por nivel educativo");

      nivelesArray.forEach((n, i) => {
        const barWidth = (n.cantidad / dataSel.cantidad) * (width - 140);
        
        panel.append("rect")
          .attr("x", 16)
          .attr("y", 115 + i * 22)
          .attr("width", barWidth)
          .attr("height", 16)
          .attr("rx", 4)
          .attr("fill", colores[i % colores.length])
          .attr("opacity", 0.8);
        
        panel.append("text")
          .attr("x", barWidth + 24)
          .attr("y", 115 + i * 22 + 12)
          .style("font-size", "11px")
          .style("fill", "#fff")
          .text(`${n.nivel}: ${(n.cantidad / dataSel.cantidad * 100).toFixed(0)}%`);
      });
    }

    if (onReady) onReady();
  };

  return <div ref={containerRef} className="grafico"></div>;
};

export default DonutChartTipoTarea;
