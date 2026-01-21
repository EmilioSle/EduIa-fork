import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as d3 from "d3";
import { Search, CheckCircle, Target } from "lucide-react";
import imagen7 from "../assets/images/imagen7.png";
import imagen6 from "../assets/images/imagen6.png";
import { OBJETIVOS_ANALITICOS } from "../utils/objetivos";
import "../styles/objetivo.css";

gsap.registerPlugin(ScrollTrigger);

const ObjetivoReutilizacion = ({ datos }) => {
  const seccionRef = useRef(null);
  const graficoSatisfaccionRef = useRef(null);
  const graficoResultadoRef = useRef(null);
  const [graficosCreados, setGraficosCreados] = useState(false);

  const objetivo = OBJETIVOS_ANALITICOS[2];

  useEffect(() => {
    if (!datos || graficosCreados) return;

    const ctx = gsap.context(() => {
      gsap.from(".titulo-objetivo-3", {
        scrollTrigger: {
          trigger: seccionRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
        opacity: 0,
        scale: 0.8,
        duration: 1,
        ease: "back.out(1.7)",
      });

      ScrollTrigger.create({
        trigger: graficoSatisfaccionRef.current,
        start: "top 70%",
        onEnter: () => {
          if (graficoSatisfaccionRef.current && !graficosCreados) {
            crearGraficoSatisfaccion();
          }
        },
      });

      ScrollTrigger.create({
        trigger: graficoResultadoRef.current,
        start: "top 70%",
        onEnter: () => {
          if (graficoResultadoRef.current && !graficosCreados) {
            crearGraficoResultado();
          }
        },
      });
    }, seccionRef);

    // Listener para redimensionamiento de ventana
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (graficosCreados) {
          crearGraficoSatisfaccion();
          crearGraficoResultado();
        }
      }, 250);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      ctx.revert();
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [datos, graficosCreados]);

  const crearGraficoSatisfaccion = () => {
    if (!graficoSatisfaccionRef.current) return;

    d3.select(graficoSatisfaccionRef.current).selectAll("*").remove();

    // Agrupar por satisfacción y uso posterior
    const datosValidos = datos.filter((d) => d.satisfaccion > 0);
    
    const rangos = [
      { min: 0, max: 2, label: "Baja", sublabel: "0-1.9" },
      { min: 2, max: 3.5, label: "Media", sublabel: "2-3.4" },
      { min: 3.5, max: 5.1, label: "Alta", sublabel: "3.5-5" },
    ];

    const datosPorRango = rangos.map((rango, index) => {
      // Para el último rango, incluir el valor máximo exacto
      const enRango = datosValidos.filter((d) => {
        if (index === rangos.length - 1) {
          return d.satisfaccion >= rango.min && d.satisfaccion <= 5;
        }
        return d.satisfaccion >= rango.min && d.satisfaccion < rango.max;
      });
      const reutilizan = enRango.filter((d) => d.usoPosterior === "Sí").length;
      const total = enRango.length;
      return {
        rango: rango.label,
        sublabel: rango.sublabel,
        porcentaje: total > 0 ? (reutilizan / total) * 100 : 0,
        total,
        reutilizan,
      };
    });

    // Configuración responsiva mejorada
    const containerWidth = graficoSatisfaccionRef.current.clientWidth;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    const margin = isMobile 
      ? { top: 30, right: 20, bottom: 100, left: 70 }
      : isTablet
      ? { top: 35, right: 30, bottom: 90, left: 80 }
      : { top: 40, right: 40, bottom: 90, left: 90 };
    
    // Tamaño mejorado
    const width = isMobile || isTablet 
      ? Math.max(300, containerWidth - 40) - margin.left - margin.right
      : 800 - margin.left - margin.right;
    const height = isMobile ? 400 : isTablet ? 450 : 500;

    const svg = d3
      .select(graficoSatisfaccionRef.current)
      .append("svg")
      .attr("width", isMobile || isTablet ? "100%" : width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Escalas mejoradas
    const x = d3
      .scaleBand()
      .range([0, width])
      .domain(datosPorRango.map((d) => d.rango))
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0])
      .nice();

    // Escala de color dinámica según porcentaje
    const colorScale = d3.scaleSequential()
      .domain([0, 100])
      .interpolator(d3.interpolatePlasma);

    // Agregar grid horizontal
    svg.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.1)
      .call(
        d3.axisLeft(y)
          .tickSize(-width)
          .tickFormat("")
      )
      .selectAll("line")
      .style("stroke", "#fff");

    // Eje X mejorado
    const xAxis = svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSizeOuter(0));

    xAxis.selectAll("text")
      .style("text-anchor", "middle")
      .style("font-size", isMobile ? "13px" : "15px")
      .style("font-weight", "700")
      .style("fill", "#fff");

    xAxis.selectAll("line, path")
      .style("stroke", "#fff")
      .style("stroke-width", 2);

    // Eje Y mejorado
    const yAxis = svg.append("g")
      .call(d3.axisLeft(y).ticks(10).tickSizeOuter(0));

    yAxis.selectAll("text")
      .style("font-size", "13px")
      .style("font-weight", "500")
      .style("fill", "#fff");

    yAxis.selectAll("line, path")
      .style("stroke", "#fff")
      .style("stroke-width", 2);

    // Etiquetas de ejes
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + 60)
      .style("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "600")
      .style("fill", "#00d9ff")
      .text("Nivel de Satisfacción");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -60)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "600")
      .style("fill", "#00d9ff")
      .text("% de Reutilización");

    // Crear tooltip mejorado
    const tooltip = d3
      .select(graficoSatisfaccionRef.current)
      .append("div")
      .attr("class", "tooltip-grafico")
      .style("opacity", 0);

    // Barras con mejor diseño
    const barras = svg
      .selectAll(".barra")
      .data(datosPorRango)
      .enter()
      .append("rect")
      .attr("class", "barra")
      .attr("x", (d) => x(d.rango))
      .attr("width", x.bandwidth())
      .attr("y", height)
      .attr("height", 0)
      .attr("fill", d => colorScale(d.porcentaje))
      .attr("rx", 4)
      .attr("ry", 4)
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 1)
          .attr("y", y(d.porcentaje) - 5)
          .attr("height", height - y(d.porcentaje) + 5);
        
        tooltip.transition().duration(200).style("opacity", 0.95);
        tooltip
          .html(
            `<strong>Satisfacción ${d.rango}</strong> (${d.sublabel})<br/>
             Total estudiantes: <strong>${d.total}</strong><br/>
             Reutilizan: <strong>${d.reutilizan}</strong> (${d.porcentaje.toFixed(1)}%)<br/>
             No reutilizan: <strong>${d.total - d.reutilizan}</strong><br/>
             <small style="color: ${colorScale(d.porcentaje)}">■</small> Tasa de adopción`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseleave", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 0.85)
          .attr("y", y(d.porcentaje))
          .attr("height", height - y(d.porcentaje));
        
        tooltip.transition().duration(200).style("opacity", 0);
      });

    // Animación de entrada suave
    barras
      .attr("opacity", 0.85)
      .transition()
      .duration(1400)
      .delay((d, i) => i * 150)
      .attr("y", (d) => y(d.porcentaje))
      .attr("height", (d) => height - y(d.porcentaje))
      .ease(d3.easeCubicOut);

    // Valores con mejor estilo
    svg
      .selectAll(".etiqueta-valor")
      .data(datosPorRango)
      .enter()
      .append("text")
      .attr("class", "etiqueta-valor")
      .attr("x", (d) => x(d.rango) + x.bandwidth() / 2)
      .attr("y", height)
      .attr("text-anchor", "middle")
      .style("font-size", isMobile ? "13px" : "16px")
      .style("font-weight", "700")
      .style("fill", "#fff")
      .style("opacity", 0)
      .style("text-shadow", "0 0 5px rgba(0,0,0,0.8)")
      .text((d) => `${d.porcentaje.toFixed(1)}%`)
      .transition()
      .duration(800)
      .delay((d, i) => i * 150 + 700)
      .attr("y", (d) => y(d.porcentaje) - 12)
      .style("opacity", 1);

    // Agregar sub-etiquetas (rangos)
    svg
      .selectAll(".sub-etiqueta")
      .data(datosPorRango)
      .enter()
      .append("text")
      .attr("class", "sub-etiqueta")
      .attr("x", (d) => x(d.rango) + x.bandwidth() / 2)
      .attr("y", height + 20)
      .attr("text-anchor", "middle")
      .style("font-size", isMobile ? "10px" : "12px")
      .style("font-weight", "500")
      .style("fill", "#999")
      .style("opacity", 0)
      .text((d) => d.sublabel)
      .transition()
      .duration(600)
      .delay(1600)
      .style("opacity", 0.8);

    // Línea de referencia en 50%
    const referenciaLinea = 50;
    
    svg.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", y(referenciaLinea))
      .attr("y2", y(referenciaLinea))
      .attr("stroke", "#ff0066")
      .attr("stroke-width", 2.5)
      .attr("stroke-dasharray", "8,4")
      .attr("opacity", 0)
      .transition()
      .duration(1000)
      .delay(1400)
      .attr("opacity", 0.7);

    svg.append("text")
      .attr("x", width - 5)
      .attr("y", y(referenciaLinea) - 8)
      .attr("text-anchor", "end")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", "#ff0066")
      .style("opacity", 0)
      .text(`Meta: ${referenciaLinea}%`)
      .transition()
      .duration(800)
      .delay(1600)
      .style("opacity", 1);
  };

  const crearGraficoResultado = () => {
    if (!graficoResultadoRef.current) return;

    d3.select(graficoResultadoRef.current).selectAll("*").remove();

    // Agrupar por resultado final
    const datosPorResultado = d3.rollup(
      datos,
      (v) => ({
        total: v.length,
        reutilizan: v.filter((d) => d.usoPosterior === "Sí").length,
      }),
      (d) => d.resultadoFinal
    );

    const datosArray = Array.from(
      datosPorResultado,
      ([resultado, stats]) => ({
        resultado,
        porcentaje: (stats.reutilizan / stats.total) * 100,
        total: stats.total,
        reutilizan: stats.reutilizan,
      })
    ).sort((a, b) => b.porcentaje - a.porcentaje);

    // Configuración responsiva mejorada
    const containerWidth = graficoResultadoRef.current.clientWidth;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    const margin = isMobile 
      ? { top: 30, right: 20, bottom: 140, left: 70 }
      : isTablet
      ? { top: 35, right: 30, bottom: 130, left: 80 }
      : { top: 40, right: 40, bottom: 120, left: 90 };
    
    // Tamaño mejorado
    const width = isMobile || isTablet 
      ? Math.max(300, containerWidth - 40) - margin.left - margin.right
      : 850 - margin.left - margin.right;
    const height = isMobile ? 400 : isTablet ? 450 : 520;

    const svg = d3
      .select(graficoResultadoRef.current)
      .append("svg")
      .attr("width", isMobile || isTablet ? "100%" : width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Escalas mejoradas
    const x = d3
      .scaleBand()
      .range([0, width])
      .domain(datosArray.map((d) => d.resultado))
      .padding(0.18);

    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0])
      .nice();

    // Escala de color con gradiente cálido
    const colorScale = d3.scaleSequential()
      .domain([0, 100])
      .interpolator(d3.interpolateWarm);

    // Agregar grid horizontal
    svg.append("g")
      .attr("class", "grid")
      .attr("opacity", 0.1)
      .call(
        d3.axisLeft(y)
          .tickSize(-width)
          .tickFormat("")
      )
      .selectAll("line")
      .style("stroke", "#fff");

    // Eje X mejorado con mejor manejo de texto
    const xAxis = svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSizeOuter(0));

    xAxis.selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size", isMobile ? "11px" : "13px")
      .style("font-weight", "600")
      .style("fill", "#fff")
      .attr("dx", "-0.5em")
      .attr("dy", "0.15em")
      .each(function(d) {
        const texto = d;
        const maxLength = isMobile ? 15 : isTablet ? 20 : 25;
        if (texto.length > maxLength) {
          d3.select(this).text(texto.substring(0, maxLength - 3) + "...");
        }
      });

    xAxis.selectAll("line, path")
      .style("stroke", "#fff")
      .style("stroke-width", 2);

    // Eje Y mejorado
    const yAxis = svg.append("g")
      .call(d3.axisLeft(y).ticks(10).tickSizeOuter(0));

    yAxis.selectAll("text")
      .style("font-size", "13px")
      .style("font-weight", "500")
      .style("fill", "#fff");

    yAxis.selectAll("line, path")
      .style("stroke", "#fff")
      .style("stroke-width", 2);

    // Etiquetas de ejes
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + 100)
      .style("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "600")
      .style("fill", "#00d9ff")
      .text("Resultado Final");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -60)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "600")
      .style("fill", "#00d9ff")
      .text("% de Reutilización");

    // Crear tooltip mejorado
    const tooltip = d3
      .select(graficoResultadoRef.current)
      .append("div")
      .attr("class", "tooltip-grafico")
      .style("opacity", 0);

    // Barras con mejor diseño
    const barras = svg
      .selectAll(".barra")
      .data(datosArray)
      .enter()
      .append("rect")
      .attr("class", "barra")
      .attr("x", (d) => x(d.resultado))
      .attr("width", x.bandwidth())
      .attr("y", height)
      .attr("height", 0)
      .attr("fill", (d) => colorScale(d.porcentaje))
      .attr("rx", 4)
      .attr("ry", 4)
      .style("cursor", "pointer")
      .on("mouseenter", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 1)
          .attr("y", y(d.porcentaje) - 5)
          .attr("height", height - y(d.porcentaje) + 5)
          .style("filter", "drop-shadow(0 8px 12px rgba(0,0,0,0.5))");
        
        tooltip.transition().duration(200).style("opacity", 0.95);
        tooltip
          .html(
            `<strong>${d.resultado}</strong><br/>
             Total estudiantes: <strong>${d.total}</strong><br/>
             Reutilizan: <strong>${d.reutilizan}</strong> (${d.porcentaje.toFixed(1)}%)<br/>
             No reutilizan: <strong>${d.total - d.reutilizan}</strong><br/>
             <small style="color: ${colorScale(d.porcentaje)}">■</small> Tasa de éxito`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseleave", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 0.85)
          .attr("y", y(d.porcentaje))
          .attr("height", height - y(d.porcentaje))
          .style("filter", "drop-shadow(0 4px 6px rgba(0,0,0,0.3))");
        
        tooltip.transition().duration(200).style("opacity", 0);
      });

    // Animación de entrada suave
    barras
      .attr("opacity", 0.85)
      .style("filter", "drop-shadow(0 4px 6px rgba(0,0,0,0.3))")
      .transition()
      .duration(1400)
      .delay((d, i) => i * 120)
      .attr("y", (d) => y(d.porcentaje))
      .attr("height", (d) => height - y(d.porcentaje))
      .ease(d3.easeCubicOut);

    // Valores con mejor estilo
    svg
      .selectAll(".etiqueta-valor")
      .data(datosArray)
      .enter()
      .append("text")
      .attr("class", "etiqueta-valor")
      .attr("x", (d) => x(d.resultado) + x.bandwidth() / 2)
      .attr("y", height)
      .attr("text-anchor", "middle")
      .style("font-size", isMobile ? "12px" : "14px")
      .style("font-weight", "700")
      .style("fill", "#fff")
      .style("opacity", 0)
      .style("text-shadow", "0 0 5px rgba(0,0,0,0.8)")
      .text((d) => `${d.porcentaje.toFixed(1)}%`)
      .transition()
      .duration(800)
      .delay((d, i) => i * 120 + 700)
      .attr("y", (d) => y(d.porcentaje) - 12)
      .style("opacity", 1);

    // Destacar la barra con mayor porcentaje
    const maxPorcentaje = d3.max(datosArray, d => d.porcentaje);
    const mejorResultado = datosArray.find(d => d.porcentaje === maxPorcentaje);
    
    if (mejorResultado) {
      svg.append("text")
        .attr("x", x(mejorResultado.resultado) + x.bandwidth() / 2)
        .attr("y", y(mejorResultado.porcentaje) - 35)
        .attr("text-anchor", "middle")
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

    // Línea de referencia en 70% (alto rendimiento)
    const referenciaLinea = 70;
    
    svg.append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", y(referenciaLinea))
      .attr("y2", y(referenciaLinea))
      .attr("stroke", "#00ff9f")
      .attr("stroke-width", 2.5)
      .attr("stroke-dasharray", "8,4")
      .attr("opacity", 0)
      .transition()
      .duration(1000)
      .delay(1400)
      .attr("opacity", 0.6);

    svg.append("text")
      .attr("x", width - 5)
      .attr("y", y(referenciaLinea) - 8)
      .attr("text-anchor", "end")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", "#00ff9f")
      .style("opacity", 0)
      .text(`Alto rendimiento: ${referenciaLinea}%`)
      .transition()
      .duration(800)
      .delay(1600)
      .style("opacity", 1);

    setGraficosCreados(true);
  };

  return (
    <section ref={seccionRef} className="seccion-objetivo objetivo-3">
      <div className="contenido-objetivo">
        <div className="encabezado-objetivo">
          <h2 className="titulo-objetivo titulo-objetivo-3">{objetivo.titulo}</h2>
          <p className="descripcion-objetivo">
            Aquí llegamos al momento decisivo. Las métricas y gráficos son útiles, 
            pero hay una pregunta que lo resume todo: después de usar la IA, 
            ¿el estudiante vuelve? Esta decisión revela qué factores realmente 
            importan para generar lealtad.
          </p>
        </div>

        <div className="grafico-contenedor">
          <h3 className="titulo-grafico">Satisfacción vs Reutilización: Un Hallazgo Sorprendente</h3>
          <div ref={graficoSatisfaccionRef} className="grafico"></div>
          <img src={imagen6} alt="Satisfacción vs Reutilización" className="imagen-grafico" />
          <p className="explicacion-grafico">
            <Search className="icono-inline" size={20} strokeWidth={1.5} /> <strong>Resultado contraintuitivo:</strong> La reutilización se mantiene 
            sorprendentemente estable (≈70%) independientemente del nivel de satisfacción. 
            Las diferencias son mínimas (±2%), lo que sugiere que la satisfacción, por sí 
            sola, no es el único factor decisivo. Esto nos indica que hay otros elementos 
            en juego: quizás la necesidad académica, la falta de alternativas, o el costo 
            hundido de aprendizaje de la herramienta.
          </p>
        </div>

        <div className="grafico-contenedor">
          <h3 className="titulo-grafico">El Verdadero Predictor: Resultados Exitosos</h3>
          <div ref={graficoResultadoRef} className="grafico"></div>
          <img src={imagen7} alt="Resultados exitosos" className="imagen-grafico" />
          <p className="explicacion-grafico">
            <CheckCircle className="icono-inline" size={20} strokeWidth={1.5} /> <strong>Aquí está el factor clave:</strong> A diferencia de la satisfacción, 
            el resultado final sí muestra una relación clara. Cuando los estudiantes logran 
            completar sus tareas exitosamente, la probabilidad de reutilización aumenta 
            significativamente. El éxito tangible supera a la satisfacción subjetiva. 
            Los estudiantes vuelven cuando la IA les ayuda a <em>lograr algo concreto</em>, 
            no solo cuando "se sienten bien" con ella.
          </p>
        </div>

        <div className="conclusion-seccion">
          <Target className="icono-conclusion-seccion" size={40} strokeWidth={1.5} />
          <p className="texto-conclusion">
            <strong>La Verdad Revelada:</strong> Los datos desafían nuestra intuición. 
            La reutilización no depende tanto de cuán satisfechos se sienten los estudiantes, 
            sino de si obtuvieron resultados concretos. Esto es crítico: la IA educativa 
            debe enfocarse en <strong>efectividad medible</strong> más que en "experiencia 
            del usuario" abstracta. Los estudiantes perdonan imperfecciones si obtienen 
            resultados, pero no volverán aunque la experiencia sea agradable si no resuelve 
            su problema real. Aquellos que encuentran éxito son los que vuelven una 
            y otra vez. La IA ha ganado su lugar en la educación.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ObjetivoReutilizacion;
