import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Search, CheckCircle, Target } from "lucide-react";
import imagen7 from "../assets/images/imagen7.png";
import imagen6 from "../assets/images/imagen6.png";
import { OBJETIVOS_ANALITICOS } from "../utils/objetivos";
import { AreaChartSatisfaccion, LollipopChartResultado } from "../components/charts";
import FiltrosGrafico from "../components/FiltrosGrafico";
import "../styles/objetivo.css";

gsap.registerPlugin(ScrollTrigger);

const ObjetivoReutilizacion = ({ datos }) => {
  const seccionRef = useRef(null);
  const graficoSatisfaccionRef = useRef(null);
  const graficoResultadoRef = useRef(null);
  const [areaVisible, setAreaVisible] = useState(false);
  const [lollipopVisible, setLollipopVisible] = useState(false);
  const [datosArea, setDatosArea] = useState(null);
  const [datosLollipop, setDatosLollipop] = useState(null);

  const objetivo = OBJETIVOS_ANALITICOS[2];

  useEffect(() => {
    if (!datos) return;

    const ctx = gsap.context(() => {
      gsap.from(".titulo-objetivo-3", {
        scrollTrigger: {
          trigger: seccionRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
        opacity: 0,
        scale: 0.7,
        rotationZ: 10,
        filter: "blur(18px)",
        duration: 1.4,
        ease: "back.out(2)",
      });

      // Efecto de glitch más pronunciado
      gsap.to(".titulo-objetivo-3", {
        scrollTrigger: {
          trigger: seccionRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
        skewX: 4,
        duration: 0.1,
        repeat: 3,
        yoyo: true,
        delay: 1.4,
        ease: "steps(2)",
      });

      ScrollTrigger.create({
        trigger: graficoSatisfaccionRef.current,
        start: "top 80%",
        onEnter: () => {
          if (!areaVisible) {
            setAreaVisible(true);
          }
        },
      });

      ScrollTrigger.create({
        trigger: graficoResultadoRef.current,
        start: "top 80%",
        onEnter: () => {
          if (!lollipopVisible) {
            setLollipopVisible(true);
          }
        },
      });
    }, seccionRef);

    return () => {
      ctx.revert();
    };
  }, [datos, areaVisible, lollipopVisible]);

  return (
    <section ref={seccionRef} className="seccion-objetivo objetivo-3">
      <div className="contenido-objetivo">
        <div className="encabezado-objetivo">
          <h2 className="titulo-objetivo titulo-objetivo-3">{objetivo.titulo}</h2>
          <p className="descripcion-objetivo">
            Llegamos al momento de la verdad. Usar la IA una vez es fácil. 
            <strong>¿Volver?</strong> Eso es lo que realmente importa. Porque la 
            verdadera lealtad no se compra con marketing — se gana con resultados. 
            Preparate para un giro que desafía la intuición...
          </p>
        </div>

        <div className="grafico-contenedor">
          <div className="grafico-header">
            <h3 className="titulo-grafico">La Gran Paradoja: Satisfacción ≠ Lealtad</h3>
            {datos && (
              <FiltrosGrafico 
                datos={datos} 
                onFiltrar={setDatosArea}
                mostrarNivel={true}
                mostrarDisciplina={true}
                mostrarResultado={false}
              />
            )}
          </div>
          <div ref={graficoSatisfaccionRef} className="grafico-wrapper">
            {areaVisible && datos && (
              <div className="grafico-entrada">
                <AreaChartSatisfaccion datos={datosArea || datos} />
              </div>
            )}
          </div>
          <img src={imagen6} alt="Satisfacción vs Reutilización" className="imagen-grafico" />
          <p className="explicacion-grafico">
            <Search className="icono-inline" size={20} strokeWidth={1.5} /> <strong>¿Listo para el plot twist?</strong> Mira ese gráfico: 
            la reutilización apenas varía entre satisfechos e insatisfechos (~70% en ambos). 
            Esperarías que quienes están contentos vuelvan más. <em>No es así.</em> 
            La satisfacción emocional no predice el comportamiento. Hay algo más 
            profundo en juego: necesidad académica, falta de alternativas, o simplemente 
            <strong>resultados tangibles</strong>. Veamos qué dicen los datos...
          </p>
        </div>

        <div className="grafico-contenedor">
          <div className="grafico-header">
            <h3 className="titulo-grafico">El Verdadero Motor: Resultados que Puedes Tocar</h3>
            {datos && (
              <FiltrosGrafico 
                datos={datos} 
                onFiltrar={setDatosLollipop}
                mostrarNivel={true}
                mostrarDisciplina={true}
                mostrarResultado={false}
              />
            )}
          </div>
          <div ref={graficoResultadoRef} className="grafico-wrapper">
            {lollipopVisible && datos && (
              <div className="grafico-entrada">
                <LollipopChartResultado datos={datosLollipop || datos} />
              </div>
            )}
          </div>
          <img src={imagen7} alt="Resultados exitosos" className="imagen-grafico" />
          <p className="explicacion-grafico">
            <CheckCircle className="icono-inline" size={20} strokeWidth={1.5} /> <strong>Y aquí está la respuesta:</strong> Cuando los estudiantes 
            <em>completan su tarea</em>, cuando el código <em>funciona</em>, cuando 
            el ensayo <em>queda listo</em> — ahí es cuando vuelven. No importa tanto 
            si la experiencia fue "agradable". Lo que importa es: <strong>¿lo logré?</strong> 
            El éxito tangible supera a los sentimientos. Los estudiantes son pragmáticos.
          </p>
        </div>

        <div className="conclusion-seccion">
          <Target className="icono-conclusion-seccion" size={40} strokeWidth={1.5} />
          <p className="texto-conclusion">
            <strong>🔑 Tercera lección (y la más importante):</strong> La industria tech 
            vive obsesionada con "experiencia de usuario" y "satisfacción". Pero estos datos 
            cuentan otra historia. Los estudiantes no vuelven porque <em>se sintieron bien</em> 
            — vuelven porque <strong>lograron su objetivo</strong>. La IA educativa debe 
            enfocarse en resolver problemas reales, no en generar "momentos agradables". 
            Es una lección incómoda, pero necesaria.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ObjetivoReutilizacion;