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
      { min: 0, max: 2, label: "Baja (0-1.9)" },
      { min: 2, max: 3.5, label: "Media (2-3.4)" },
      { min: 3.5, max: 5.1, label: "Alta (3.5-5)" },
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
        porcentaje: total > 0 ? (reutilizan / total) * 100 : 0,
        total,
        reutilizan,
      };
    });

    // Configuración responsiva
    const containerWidth = graficoSatisfaccionRef.current.clientWidth;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    const margin = isMobile 
      ? { top: 30, right: 20, bottom: 100, left: 60 }
      : isTablet
      ? { top: 35, right: 30, bottom: 90, left: 70 }
      : { top: 40, right: 40, bottom: 90, left: 80 };
    
    // Desktop: tamaño fijo original, móvil/tablet: responsivo
    const width = isMobile || isTablet 
      ? Math.max(300, containerWidth - 40) - margin.left - margin.right
      : 700 - margin.left - margin.right;
    const height = isMobile ? 350 : isTablet ? 400 : 450;

    const svg = d3
      .select(graficoSatisfaccionRef.current)
      .append("svg")
      .attr("width", isMobile || isTablet ? "100%" : width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .range([0, width])
      .domain(datosPorRango.map((d) => d.rango))
      .padding(0.3);

    const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "middle")
      .style("font-size", "13px")
      .style("fill", "#fff");

    svg.append("g")
      .call(d3.axisLeft(y).ticks(10))
      .selectAll("text")
      .style("font-size", "13px")
      .style("fill", "#fff");

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + 50)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#fff")
      .text("Nivel de Satisfacción");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#fff")
      .text("% de Reutilización");

    // Crear barras con gradiente único
    const gradientId = "barGradientSatisfaccion";
    const gradient = svg
      .append("defs")
      .append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%")
      .attr("x2", "0%")
      .attr("y1", "100%")
      .attr("y2", "0%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#ff0066");
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#ffaa00");

    // Crear tooltip
    const tooltip = d3
      .select(graficoSatisfaccionRef.current)
      .append("div")
      .attr("class", "tooltip-grafico")
      .style("opacity", 0);

    svg
      .selectAll(".barra")
      .data(datosPorRango)
      .enter()
      .append("rect")
      .attr("class", "barra")
      .attr("x", (d) => x(d.rango))
      .attr("width", x.bandwidth())
      .attr("y", height)
      .attr("height", 0)
      .attr("fill", `url(#${gradientId})`)
      .attr("opacity", 0.85)
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        d3.select(this).transition().duration(200).attr("opacity", 1);
        
        tooltip.transition().duration(200).style("opacity", 0.95);
        tooltip
          .html(
            `<strong>${d.rango}</strong><br/>
             Total estudiantes: ${d.total}<br/>
             Reutilizan: ${d.reutilizan} (${d.porcentaje.toFixed(1)}%)<br/>
             No reutilizan: ${d.total - d.reutilizan}`
          )
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseleave", function () {
        d3.select(this).transition().duration(200).attr("opacity", 0.85);
        tooltip.transition().duration(200).style("opacity", 0);
      })
      .transition()
      .duration(1800)
      .delay((d, i) => i * 200)
      .attr("y", (d) => y(d.porcentaje))
      .attr("height", (d) => height - y(d.porcentaje))
      .ease(d3.easeElasticOut.amplitude(1).period(0.5));

    // Valores
    svg
      .selectAll(".etiqueta-valor")
      .data(datosPorRango)
      .enter()
      .append("text")
      .attr("class", "etiqueta-valor")
      .attr("x", (d) => x(d.rango) + x.bandwidth() / 2)
      .attr("y", height)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("fill", "#fff")
      .style("opacity", 0)
      .text((d) => `${d.porcentaje.toFixed(1)}%`)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 200 + 800)
      .attr("y", (d) => y(d.porcentaje) - 10)
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
      })
    ).sort((a, b) => b.porcentaje - a.porcentaje);

    // Configuración responsiva
    const containerWidth = graficoResultadoRef.current.clientWidth;
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    const margin = isMobile 
      ? { top: 30, right: 20, bottom: 120, left: 60 }
      : isTablet
      ? { top: 35, right: 30, bottom: 120, left: 70 }
      : { top: 40, right: 40, bottom: 120, left: 80 };
    
    // Desktop: tamaño fijo original, móvil/tablet: responsivo
    const width = isMobile || isTablet 
      ? Math.max(300, containerWidth - 40) - margin.left - margin.right
      : 700 - margin.left - margin.right;
    const height = isMobile ? 350 : isTablet ? 400 : 450;

    const svg = d3
      .select(graficoResultadoRef.current)
      .append("svg")
      .attr("width", isMobile || isTablet ? "100%" : width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .range([0, width])
      .domain(datosArray.map((d) => d.resultado))
      .padding(0.3);

    const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

    svg
      .append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size", "13px")
      .style("fill", "#fff")
      .attr("dx", "-0.5em")
      .attr("dy", "0.15em")
      .each(function(d) {
        // Truncar texto si es muy largo
        const texto = d;
        if (texto.length > 18) {
          d3.select(this).text(texto.substring(0, 16) + "...");
        }
      });

    svg.append("g").call(d3.axisLeft(y).ticks(10));

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height + 85)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#fff")
      .text("Resultado Final");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -height / 2)
      .style("text-anchor", "middle")
      .style("font-size", "14px")
      .style("fill", "#fff")
      .text("% de Reutilización");

    // Color scale
    const colorScale = d3
      .scaleLinear()
      .domain([0, d3.max(datosArray, (d) => d.porcentaje)])
      .range(["#00d9ff", "#00ff9f"]);

    svg
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
      .attr("opacity", 0.85)
      .transition()
      .duration(1500)
      .delay((d, i) => i * 150)
      .attr("y", (d) => y(d.porcentaje))
      .attr("height", (d) => height - y(d.porcentaje))
      .ease(d3.easeCubicOut);

    // Valores
    svg
      .selectAll(".etiqueta-valor")
      .data(datosArray)
      .enter()
      .append("text")
      .attr("class", "etiqueta-valor")
      .attr("x", (d) => x(d.resultado) + x.bandwidth() / 2)
      .attr("y", height)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", "#fff")
      .style("opacity", 0)
      .text((d) => `${d.porcentaje.toFixed(0)}%`)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 150 + 700)
      .attr("y", (d) => y(d.porcentaje) - 10)
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
