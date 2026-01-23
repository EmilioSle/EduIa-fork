import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Search, CheckCircle, Target } from "lucide-react";
import imagen7 from "../assets/images/imagen7.png";
import imagen6 from "../assets/images/imagen6.png";
import { OBJETIVOS_ANALITICOS } from "../utils/objetivos";
import { AreaChartSatisfaccion, LollipopChartResultado } from "../components/charts";
import "../styles/objetivo.css";

gsap.registerPlugin(ScrollTrigger);

const ObjetivoReutilizacion = ({ datos }) => {
  const seccionRef = useRef(null);
  const graficoSatisfaccionRef = useRef(null);
  const graficoResultadoRef = useRef(null);
  const [areaVisible, setAreaVisible] = useState(false);
  const [lollipopVisible, setLollipopVisible] = useState(false);

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
            Aquí llegamos al momento decisivo. Las métricas y gráficos son útiles, 
            pero hay una pregunta que lo resume todo: después de usar la IA, 
            ¿el estudiante vuelve? Esta decisión revela qué factores realmente 
            importan para generar lealtad.
          </p>
        </div>

        <div className="grafico-contenedor">
          <h3 className="titulo-grafico">Satisfacción vs Reutilización: Un Hallazgo Sorprendente</h3>
          <div ref={graficoSatisfaccionRef} className="grafico-wrapper">
            {areaVisible && datos && (
              <div className="grafico-entrada">
                <AreaChartSatisfaccion datos={datos} />
              </div>
            )}
          </div>
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
          <div ref={graficoResultadoRef} className="grafico-wrapper">
            {lollipopVisible && datos && (
              <div className="grafico-entrada">
                <LollipopChartResultado datos={datos} />
              </div>
            )}
          </div>
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