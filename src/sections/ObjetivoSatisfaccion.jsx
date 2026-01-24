import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Clock, Target, Search } from "lucide-react";
import imagen4 from "../assets/images/imagen4.png";
import imagen5 from "../assets/images/imagen5.png";
import { OBJETIVOS_ANALITICOS } from "../utils/objetivos";
import { ScatterChartDuracion, LineChartAsistencia } from "../components/charts";
import FiltrosGrafico from "../components/FiltrosGrafico";
import "../styles/objetivo.css";

gsap.registerPlugin(ScrollTrigger);

const ObjetivoSatisfaccion = ({ datos }) => {
  const seccionRef = useRef(null);
  const graficoScatterRef = useRef(null);
  const graficoLineRef = useRef(null);
  const [scatterVisible, setScatterVisible] = useState(false);
  const [lineaVisible, setLineaVisible] = useState(false);
  const [datosScatter, setDatosScatter] = useState(null);
  const [datosLinea, setDatosLinea] = useState(null);

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
            Sabemos quiénes usan la IA. Ahora la pregunta es más profunda: 
            <strong>¿terminan contentos?</strong> Porque usar una herramienta no 
            significa que funcione. Aquí es donde los datos nos sorprenden con 
            verdades que desafían la lógica convencional...
          </p>
        </div>

        <div className="grafico-contenedor">
          <div className="grafico-header">
            <h3 className="titulo-grafico">La Paradoja del Tiempo: Más No Es Mejor</h3>
            {datos && (
              <FiltrosGrafico 
                datos={datos} 
                onFiltrar={setDatosScatter}
                mostrarNivel={true}
                mostrarDisciplina={true}
                mostrarResultado={false}
              />
            )}
          </div>
          <div ref={graficoScatterRef} className="grafico-wrapper grafico-wrapper-grande">
            {scatterVisible && datos && (
              <div className="grafico-entrada">
                <ScatterChartDuracion datos={datosScatter || datos} />
              </div>
            )}
          </div>
          <img src={imagen4} alt="Relación duración y satisfacción" className="imagen-grafico imagen-grafico-pequena" />
          <p className="explicacion-grafico">
            <Clock className="icono-inline" size={20} strokeWidth={1.5} /> <strong>Contraintuitivo pero cierto:</strong> Esperarías que 
            sesiones más largas = estudiantes más satisfechos. Los datos dicen lo contrario. 
            Las sesiones más cortas y enfocadas superan a las maratónicas. ¿Por qué? 
            Porque <em>resolver rápido</em> es mejor que <em>luchar durante horas</em>. 
            El tiempo invertido no predice satisfacción. La <strong>eficiencia</strong> sí.
          </p>
        </div>

        <div className="grafico-contenedor">
          <div className="grafico-header">
            <h3 className="titulo-grafico">El Secreto Revelado: Cuando la IA Realmente Ayuda</h3>
            {datos && (
              <FiltrosGrafico 
                datos={datos} 
                onFiltrar={setDatosLinea}
                mostrarNivel={true}
                mostrarDisciplina={true}
                mostrarResultado={false}
              />
            )}
          </div>
          <div ref={graficoLineRef} className="grafico-wrapper">
            {lineaVisible && datos && (
              <div className="grafico-entrada">
                <LineChartAsistencia datos={datosLinea || datos} />
              </div>
            )}
          </div>
          <img src={imagen5} alt="Nivel de asistencia y satisfacción" className="imagen-grafico" />
          <p className="explicacion-grafico">
            <Target className="icono-inline" size={20} strokeWidth={1.5} /> <strong>Aquí está la clave:</strong> Observa cómo la curva sube 
            cuando el nivel de asistencia aumenta. No es casualidad. Los estudiantes 
            no quieren respuestas fáciles — quieren <em>sentirse ayudados de verdad</em>. 
            La IA que solo da respuestas rápidas no genera satisfacción. 
            La que <strong>guía, explica y asiste</strong> sí lo hace.
          </p>
        </div>

        <div className="conclusion-seccion">
          <Search className="icono-conclusion-seccion" size={40} strokeWidth={1.5} />
          <p className="texto-conclusion">
            <strong>🔑 Segunda lección:</strong> Olvídate del tiempo en pantalla. 
            La satisfacción no se construye con horas, se construye con 
            <strong>asistencia que realmente resuelve</strong>. Los estudiantes 
            detectan la diferencia entre una IA que responde y una que <em>ayuda</em>. 
            Y los datos lo confirman sin ambigüedad.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ObjetivoSatisfaccion;
