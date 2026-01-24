import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BarChart3, Lightbulb, Brain } from "lucide-react";
import imagen2 from "../assets/images/imagen2.png";
import imagen3 from "../assets/images/imagen3.png";
import { OBJETIVOS_ANALITICOS } from "../utils/objetivos";
import { BarChartNivelEducativo, DonutChartTipoTarea } from "../components/charts";
import FiltrosGrafico from "../components/FiltrosGrafico";
import "../styles/objetivo.css";

gsap.registerPlugin(ScrollTrigger);

const ObjetivoUso = ({ datos }) => {
  const seccionRef = useRef(null);
  const graficoBarrasRef = useRef(null);
  const graficoDonutRef = useRef(null);
  const [barrasVisible, setBarrasVisible] = useState(false);
  const [donutVisible, setDonutVisible] = useState(false);
  const [datosBarras, setDatosBarras] = useState(null);
  const [datosDonut, setDatosDonut] = useState(null);

  const objetivo = OBJETIVOS_ANALITICOS[0];

  useEffect(() => {
    if (!datos) return;

    const ctx = gsap.context(() => {
      // Animación cinematográfica del título con blur y scale
      gsap.from(".titulo-objetivo", {
        scrollTrigger: {
          trigger: seccionRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
        opacity: 0,
        x: -150,
        scale: 0.9,
        filter: "blur(15px)",
        duration: 1.3,
        ease: "power4.out",
      });

      // Efecto de glitch en el título
      gsap.to(".titulo-objetivo", {
        scrollTrigger: {
          trigger: seccionRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
        skewX: 3,
        duration: 0.08,
        repeat: 2,
        yoyo: true,
        delay: 1.3,
        ease: "power1.inOut",
      });

      // Trigger para mostrar el gráfico de barras
      ScrollTrigger.create({
        trigger: graficoBarrasRef.current,
        start: "top 80%",
        onEnter: () => {
          if (!barrasVisible) {
            setBarrasVisible(true);
          }
        },
      });

      // Trigger para mostrar el gráfico donut
      ScrollTrigger.create({
        trigger: graficoDonutRef.current,
        start: "top 80%",
        onEnter: () => {
          if (!donutVisible) {
            setDonutVisible(true);
          }
        },
      });
    }, seccionRef);

    return () => {
      ctx.revert();
    };
  }, [datos, barrasVisible, donutVisible]);

  return (
    <section ref={seccionRef} className="seccion-objetivo">
      <div className="contenido-objetivo">
        <div className="encabezado-objetivo">
          <h2 className="titulo-objetivo">{objetivo.titulo}</h2>
          <p className="descripcion-objetivo">
            Antes de hablar de resultados, necesitamos entender quién está 
            detrás de cada sesión. ¿Son solo los estudiantes de tecnología? 
            ¿Los que están bajo presión de fecha límite? Los números pintan 
            un retrato mucho más diverso de lo que podrías imaginar...
          </p>
        </div>

        <div className="grafico-contenedor">
          <div className="grafico-header">
            <h3 className="titulo-grafico">El Perfil del Usuario: Quién Usa la IA</h3>
            {datos && (
              <FiltrosGrafico 
                datos={datos} 
                onFiltrar={setDatosBarras}
                mostrarNivel={false}
                mostrarDisciplina={true}
                mostrarResultado={true}
              />
            )}
          </div>
          <div ref={graficoBarrasRef} className="grafico-wrapper">
            {barrasVisible && datos && (
              <div className="grafico-entrada">
                <BarChartNivelEducativo datos={datosBarras || datos} />
              </div>
            )}
          </div>
          <img src={imagen2} alt="Perfil de usuario" className="imagen-grafico imagen-grafico-grande" />
          <p className="explicacion-grafico">
            📊 <strong>El primer hallazgo:</strong> Los estudiantes de pregrado 
            lideran la adopción con diferencia abrumadora. No es coincidencia: están 
            en el ojo del huracán académico — múltiples materias, trabajos semanales, 
            y la eterna pregunta: <em>"¿Esto está bien?"</em> La IA se convirtió en 
            ese compañero de estudio disponible a cualquier hora.
          </p>
        </div>

        <div className="grafico-contenedor">
          <div className="grafico-header">
            <h3 className="titulo-grafico">El Propósito: Para Qué Recurren a la IA</h3>
            {datos && (
              <FiltrosGrafico 
                datos={datos} 
                onFiltrar={setDatosDonut}
                mostrarNivel={true}
                mostrarDisciplina={true}
                mostrarResultado={false}
              />
            )}
          </div>
          <div ref={graficoDonutRef} className="grafico-wrapper">
            {donutVisible && datos && (
              <div className="grafico-entrada">
                <DonutChartTipoTarea datos={datosDonut || datos} />
              </div>
            )}
          </div>
          <img src={imagen3} alt="Propósito de uso" className="imagen-grafico" />
          <p className="explicacion-grafico">
            <Lightbulb className="icono-inline" size={20} strokeWidth={1.5} /> <strong>¿Copiar y pegar?</strong> El mito se derrumba. 
            Estudiar y entender conceptos supera a "escribe mi ensayo". 
            La programación aparece fuerte — no para que la IA escriba código, 
            sino para <em>entender por qué no funciona</em>. Los estudiantes 
            buscan aprender, no solo sobrevivir.
          </p>
        </div>

        <div className="conclusion-seccion">
          <Brain className="icono-conclusion-seccion" size={40} strokeWidth={1.5} />
          <p className="texto-conclusion">
            <strong>🔑 Primera lección:</strong> La adopción no es uniforme ni aleatoria. 
            Sigue el rastro de la necesidad: donde hay presión académica, hay IA. 
            Pero la sorpresa está en el <em>para qué</em> — la herramienta que muchos 
            temían que fomentara el plagio, se usa principalmente para <strong>aprender</strong>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ObjetivoUso;
