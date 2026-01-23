import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BarChart3, Lightbulb, Brain } from "lucide-react";
import imagen2 from "../assets/images/imagen2.png";
import imagen3 from "../assets/images/imagen3.png";
import { OBJETIVOS_ANALITICOS } from "../utils/objetivos";
import { BarChartNivelEducativo, DonutChartTipoTarea } from "../components/charts";
import "../styles/objetivo.css";

gsap.registerPlugin(ScrollTrigger);

const ObjetivoUso = ({ datos }) => {
  const seccionRef = useRef(null);
  const graficoBarrasRef = useRef(null);
  const graficoDonutRef = useRef(null);
  const [barrasVisible, setBarrasVisible] = useState(false);
  const [donutVisible, setDonutVisible] = useState(false);

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
            Los datos revelan un patrón claro: la IA ya no es una herramienta 
            experimental. Se ha convertido en parte integral del día a día académico. 
            Pero no todos los estudiantes la usan de la misma manera...
          </p>
        </div>

        <div className="grafico-contenedor">
          <h3 className="titulo-grafico">El Perfil del Usuario: Quién Usa la IA</h3>
          <div ref={graficoBarrasRef} className="grafico-wrapper">
            {barrasVisible && datos && (
              <div className="grafico-entrada">
                <BarChartNivelEducativo datos={datos} />
              </div>
            )}
          </div>
          <img src={imagen2} alt="Perfil de usuario" className="imagen-grafico imagen-grafico-grande" />
          <p className="explicacion-grafico">
            📊 <strong>La historia comienza aquí:</strong> Los estudiantes de pregrado 
            dominan el uso de IA, representando la gran mayoría de las sesiones. 
            Están en un punto crítico de su formación, donde la presión académica 
            se encuentra con la curiosidad tecnológica.
          </p>
        </div>

        <div className="grafico-contenedor">
          <h3 className="titulo-grafico">El Propósito: Para Qué Recurren a la IA</h3>
          <div ref={graficoDonutRef} className="grafico-wrapper">
            {donutVisible && datos && (
              <div className="grafico-entrada">
                <DonutChartTipoTarea datos={datos} />
              </div>
            )}
          </div>
          <img src={imagen3} alt="Propósito de uso" className="imagen-grafico" />
          <p className="explicacion-grafico">
            <Lightbulb className="icono-inline" size={20} strokeWidth={1.5} /> <strong>Una revelación interesante:</strong> Aunque muchos piensan 
            que la IA solo se usa para escribir ensayos, los datos muestran una 
            diversidad sorprendente. Desde estudiar conceptos difíciles hasta 
            depurar código, la IA se ha convertido en un asistente multifacético.
          </p>
        </div>

        <div className="conclusion-seccion">
          <Brain className="icono-conclusion-seccion" size={40} strokeWidth={1.5} />
          <p className="texto-conclusion">
            <strong>Insight Clave:</strong> La IA no está reemplazando el aprendizaje, 
            está democratizándolo. Estudiantes de todos los niveles la usan como un 
            tutor personal disponible 24/7, adaptándose a sus necesidades específicas.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ObjetivoUso;
