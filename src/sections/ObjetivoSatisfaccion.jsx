import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Clock, Target, Search } from "lucide-react";
import imagen4 from "../assets/images/imagen4.png";
import imagen5 from "../assets/images/imagen5.png";
import { OBJETIVOS_ANALITICOS } from "../utils/objetivos";
import { ScatterChartDuracion, LineChartAsistencia } from "../components/charts";
import "../styles/objetivo.css";

gsap.registerPlugin(ScrollTrigger);

const ObjetivoSatisfaccion = ({ datos }) => {
  const seccionRef = useRef(null);
  const graficoScatterRef = useRef(null);
  const graficoLineRef = useRef(null);
  const [scatterVisible, setScatterVisible] = useState(false);
  const [lineaVisible, setLineaVisible] = useState(false);

  const objetivo = OBJETIVOS_ANALITICOS[1];

  useEffect(() => {
    if (!datos) return;

    const ctx = gsap.context(() => {
      gsap.from(".titulo-objetivo-2", {
        scrollTrigger: {
          trigger: seccionRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
        opacity: 0,
        x: 150,
        rotationY: 45,
        filter: "blur(12px)",
        duration: 1.3,
        ease: "power4.out",
      });

      // Efecto de glitch
      gsap.to(".titulo-objetivo-2", {
        scrollTrigger: {
          trigger: seccionRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
        skewY: 2,
        duration: 0.08,
        repeat: 2,
        yoyo: true,
        delay: 1.3,
        ease: "power1.inOut",
      });

      ScrollTrigger.create({
        trigger: graficoScatterRef.current,
        start: "top 80%",
        onEnter: () => {
          if (!scatterVisible) {
            setScatterVisible(true);
          }
        },
      });

      ScrollTrigger.create({
        trigger: graficoLineRef.current,
        start: "top 80%",
        onEnter: () => {
          if (!lineaVisible) {
            setLineaVisible(true);
          }
        },
      });
    }, seccionRef);

    return () => {
      ctx.revert();
    };
  }, [datos, scatterVisible, lineaVisible]);

  return (
    <section ref={seccionRef} className="seccion-objetivo objetivo-2">
      <div className="contenido-objetivo">
        <div className="encabezado-objetivo">
          <h2 className="titulo-objetivo titulo-objetivo-2">{objetivo.titulo}</h2>
          <p className="descripcion-objetivo">
            Conocer los números es importante, pero la satisfacción cuenta la 
            historia real. ¿Qué hace que un estudiante termine su sesión sintiéndose 
            ayudado versus frustrado? Los datos revelan patrones sorprendentes...
          </p>
        </div>

        <div className="grafico-contenedor">
          <h3 className="titulo-grafico">El Mito del "Más es Mejor"</h3>
          <div ref={graficoScatterRef} className="grafico-wrapper grafico-wrapper-grande">
            {scatterVisible && datos && (
              <div className="grafico-entrada">
                <ScatterChartDuracion datos={datos} />
              </div>
            )}
          </div>
          <img src={imagen4} alt="Relación duración y satisfacción" className="imagen-grafico imagen-grafico-pequena" />
          <p className="explicacion-grafico">
            <Clock className="icono-inline" size={20} strokeWidth={1.5} /> <strong>Descubrimiento contraintuitivo:</strong> Las sesiones más 
            largas no garantizan mayor satisfacción. De hecho, la relación es más 
            compleja. Los estudiantes más satisfechos tienden a tener sesiones 
            enfocadas y eficientes, no necesariamente las más largas. ¿La lección? 
            La calidad supera a la cantidad.
          </p>
        </div>

        <div className="grafico-contenedor">
          <h3 className="titulo-grafico">El Factor Decisivo: Nivel de Asistencia</h3>
          <div ref={graficoLineRef} className="grafico-wrapper">
            {lineaVisible && datos && (
              <div className="grafico-entrada">
                <LineChartAsistencia datos={datos} />
              </div>
            )}
          </div>
          <img src={imagen5} alt="Nivel de asistencia y satisfacción" className="imagen-grafico" />
          <p className="explicacion-grafico">
            <Target className="icono-inline" size={20} strokeWidth={1.5} /> <strong>La correlación que importa:</strong> Cuando la IA realmente 
            ayuda (niveles de asistencia altos), la satisfacción se dispara. Esto 
            valida algo fundamental: los estudiantes no buscan que la IA haga su 
            trabajo, buscan que los ayude a hacerlo mejor.
          </p>
        </div>

        <div className="conclusion-seccion">
          <Search className="icono-conclusion-seccion" size={40} strokeWidth={1.5} />
          <p className="texto-conclusion">
            <strong>La Verdad Revelada:</strong> La satisfacción no se trata de 
            interacciones largas o respuestas rápidas. Se trata de asistencia 
            efectiva que verdaderamente ayuda al estudiante a alcanzar sus objetivos 
            académicos.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ObjetivoSatisfaccion;
