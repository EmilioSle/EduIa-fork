import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Database, BookOpen, Users, BarChart2 } from "lucide-react";
import imagen1 from "../assets/images/imagen1.png";
import "../styles/intro.css";

gsap.registerPlugin(ScrollTrigger);

const Intro = () => {
  const seccionRef = useRef(null);
  const tituloRef = useRef(null);
  const subtituloRef = useRef(null);
  const textoRef = useRef(null);

  useEffect(() => {
    // Asegurar que el scroll esté en el top al cargar
    window.scrollTo(0, 0);
    
    // Establecer estado inicial visible antes de animar
    gsap.set([tituloRef.current, subtituloRef.current, textoRef.current], {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
    });

    const ctx = gsap.context(() => {
      // Timeline para animaciones de entrada
      const tlEntrada = gsap.timeline();

      // Animación cinematográfica de entrada del título con blur y scale
      tlEntrada.fromTo(tituloRef.current, 
        {
          opacity: 0,
          y: 150,
          scale: 0.8,
          filter: "blur(20px)",
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 1.5,
          ease: "power4.out",
        }
      );

      // Efecto de glitch en el título
      tlEntrada.to(tituloRef.current, {
        skewX: 2,
        duration: 0.1,
        repeat: 3,
        yoyo: true,
        ease: "power1.inOut",
      }, "+=0.2");

      // Animación del subtítulo con efecto cinematográfico
      tlEntrada.fromTo(subtituloRef.current, 
        {
          opacity: 0,
          y: 80,
          filter: "blur(10px)",
        },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.2,
          ease: "power4.out",
        }, 
        0.4 // Inicia en 0.4s
      );

      // Animación del texto descriptivo con fade-in y blur
      tlEntrada.fromTo(textoRef.current.children, 
        {
          opacity: 0,
          y: 50,
          filter: "blur(8px)",
        },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          stagger: 0.15,
          duration: 1,
          ease: "power3.out",
        }, 
        0.8 // Inicia en 0.8s
      );

      // Efecto paralaje al hacer scroll - solo después de que termine la animación de entrada
      tlEntrada.call(() => {
        // Scrub más alto = transición más suave y gradual
        const scrubSuave = 2.5;
        
        gsap.fromTo(tituloRef.current, 
          { y: 0, opacity: 1, scale: 1 },
          {
            scrollTrigger: {
              trigger: seccionRef.current,
              start: "top top",
              end: "80% top", // Termina antes para dar más tiempo
              scrub: scrubSuave,
            },
            y: -80,
            opacity: 0.5, // No baja tanto
            scale: 0.95,
            ease: "power1.inOut", // Curva suave
          }
        );

        gsap.fromTo(subtituloRef.current,
          { y: 0, opacity: 1 },
          {
            scrollTrigger: {
              trigger: seccionRef.current,
              start: "top top",
              end: "80% top",
              scrub: scrubSuave,
            },
            y: -60,
            opacity: 0.4,
            ease: "power1.inOut",
          }
        );

        gsap.fromTo(textoRef.current,
          { y: 0, opacity: 1 },
          {
            scrollTrigger: {
              trigger: seccionRef.current,
              start: "top top",
              end: "70% top",
              scrub: scrubSuave,
            },
            y: -30,
            opacity: 0.2,
            ease: "power1.inOut",
          }
        );

        gsap.fromTo(seccionRef.current,
          { opacity: 1, y: 0 },
          {
            scrollTrigger: {
              trigger: seccionRef.current,
              start: "20% top", // Empieza más tarde
              end: "bottom top",
              scrub: scrubSuave,
            },
            opacity: 0.3,
            y: -50,
            ease: "power1.inOut",
          }
        );
        
        ScrollTrigger.refresh();
      });
    }, seccionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={seccionRef} className="seccion-intro">
      <div className="contenido-intro">
        <h1 ref={tituloRef} className="titulo-principal">
          EduIA
        </h1>
        <h2 ref={subtituloRef} className="subtitulo">
          Uso de Asistentes de IA en la Vida Estudiantil
        </h2>
        <div ref={textoRef} className="texto-intro">
          <p className="parrafo-destacado">
            Explora cómo los estudiantes de diversos niveles académicos utilizan 
            herramientas de inteligencia artificial para aprender, programar, 
            escribir e investigar.
          </p>
          
          {/* Tarjeta de información del dataset */}
          <div className="dataset-info">
            <div className="dataset-header">
              <Database size={24} />
              <h3>Sobre el Conjunto de Datos</h3>
            </div>
            <p className="dataset-descripcion">
              Este conjunto de datos contiene <strong>10,000 sesiones</strong> de estudiantes 
              interactuando con asistentes de IA (como ChatGPT) para diversas tareas académicas. 
              Cada registro captura el nivel del estudiante, disciplina, tipo de tarea, 
              duración, efectividad percibida y satisfacción.
            </p>
            <div className="dataset-variables">
              <div className="variable-grupo">
                <Users size={18} />
                <div>
                  <strong>Perfil del Estudiante</strong>
                  <span>Nivel académico (Secundaria, Pregrado, Graduado) y disciplina</span>
                </div>
              </div>
              <div className="variable-grupo">
                <BookOpen size={18} />
                <div>
                  <strong>Sesión de IA</strong>
                  <span>Duración, prompts utilizados y tipo de tarea</span>
                </div>
              </div>
              <div className="variable-grupo">
                <BarChart2 size={18} />
                <div>
                  <strong>Resultados</strong>
                  <span>Nivel de asistencia (1-5), satisfacción y reutilización</span>
                </div>
              </div>
            </div>
          </div>

          <p className="parrafo-narrativa">
            Son las 2 de la madrugada. Un estudiante de ingeniería mira la pantalla, 
            el cursor parpadeando sobre un código que no funciona. Pero algo ha cambiado.
          </p>
          <p>
            En lugar de rendirse o buscar entre foros obsoletos, abre una conversación 
            con una IA. En minutos, no solo encuentra el error — <em>entiende por qué ocurrió</em>. 
            Esta escena se repite miles de veces cada noche, en dormitorios y bibliotecas 
            de todo el mundo.
          </p>
          <p className="cita-intro">
            "Los datos no mienten. Pero a veces cuentan historias que no esperábamos escuchar."
          </p>
          <div className="indicador-scroll">
            <span>↓</span>
            <p>Sumérgete en los datos</p>
          </div>
          <img src={imagen1} alt="Introducción a EduIA" className="imagen-intro" />
        </div>
      </div>
    </section>
  );
};

export default Intro;
