import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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
        gsap.fromTo(tituloRef.current, 
          { y: 0, opacity: 1, scale: 1 },
          {
            scrollTrigger: {
              trigger: seccionRef.current,
              start: "top top",
              end: "bottom top",
              scrub: 1,
            },
            y: -150,
            opacity: 0.3,
            scale: 0.9,
            ease: "none",
          }
        );

        gsap.fromTo(subtituloRef.current,
          { y: 0, opacity: 1 },
          {
            scrollTrigger: {
              trigger: seccionRef.current,
              start: "top top",
              end: "bottom top",
              scrub: 1,
            },
            y: -100,
            opacity: 0.2,
            ease: "none",
          }
        );

        gsap.fromTo(textoRef.current,
          { y: 0, opacity: 1 },
          {
            scrollTrigger: {
              trigger: seccionRef.current,
              start: "top top",
              end: "bottom top",
              scrub: 1,
            },
            y: -50,
            opacity: 0,
            ease: "none",
          }
        );

        gsap.fromTo(seccionRef.current,
          { opacity: 1, y: 0 },
          {
            scrollTrigger: {
              trigger: seccionRef.current,
              start: "top top",
              end: "bottom top",
              scrub: 1,
            },
            opacity: 0,
            y: -100,
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
          La Revolución Silenciosa de la Inteligencia Artificial en las Aulas
        </h2>
        <div ref={textoRef} className="texto-intro">
          <p className="parrafo-destacado">
            Imagina un estudiante a las 2 AM, luchando con un proyecto...
          </p>
          <p>
            Ya no está solo. Junto a él, una inteligencia artificial le ayuda a 
            estructurar ideas, depurar código y pulir su escritura. Esta es la 
            nueva realidad de millones de estudiantes en 2025.
          </p>
          <p>
            Pero, ¿qué significa realmente este cambio? ¿Están los estudiantes 
            encontrando valor real, o es solo una moda pasajera? A través de datos 
            reales de cientos de sesiones, desentrañaremos esta historia.
          </p>
          <p className="cita-intro">
            "La pregunta no es si la IA está en las aulas, sino cómo está 
            transformando la forma en que aprendemos"
          </p>
          <div className="indicador-scroll">
            <span>↓</span>
            <p>Desliza para descubrir la historia</p>
          </div>
          <img src={imagen1} alt="Introducción a EduIA" className="imagen-intro" />
        </div>
      </div>
    </section>
  );
};

export default Intro;
