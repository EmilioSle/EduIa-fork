import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Code, Database, Zap, Rocket, Globe, Cpu } from "lucide-react";
import "../styles/tecnologias.css";

gsap.registerPlugin(ScrollTrigger);

const TecnologiasUsadas = () => {
  const seccionRef = useRef(null);
  const tituloRef = useRef(null);
  const categoriasRef = useRef(null);
  const notaRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animación del título
      gsap.fromTo(tituloRef.current, 
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: tituloRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // Animación de las categorías
      gsap.fromTo(categoriasRef.current.children,
        { opacity: 0, y: 30, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          stagger: 0.15,
          duration: 0.6,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: categoriasRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // Animación de la nota técnica
      gsap.fromTo(notaRef.current,
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: notaRef.current,
            start: "top 85%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }, seccionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={seccionRef} className="tecnologias-utilizadas">
      <div className="contenido-tecnologias">
        <h2 ref={tituloRef} className="titulo-tecnologias">
          🛠️ Tecnologías Utilizadas
        </h2>
        <p className="descripcion-tecnologias">
          Este proyecto fue construido con un stack moderno de tecnologías web 
          especializadas en visualización de datos y experiencia de usuario interactiva.
        </p>
        
        <div ref={categoriasRef} className="categorias-tecnologias">
          <div className="categoria-tech">
            <div className="categoria-header">
              <Code className="icono-categoria" size={24} strokeWidth={1.5} />
              <h3>Frontend Framework</h3>
            </div>
            <div className="lista-tech">
              <span className="tech-item principal">React 19.2.0</span>
              <span className="tech-item">React DOM</span>
              <span className="tech-item">JSX</span>
              <span className="tech-item">Hooks</span>
            </div>
          </div>

          <div className="categoria-tech">
            <div className="categoria-header">
              <Database className="icono-categoria" size={24} strokeWidth={1.5} />
              <h3>Visualización de Datos</h3>
            </div>
            <div className="lista-tech">
              <span className="tech-item principal">D3.js 7.9.0</span>
              <span className="tech-item principal">Recharts 3.7.0</span>
              <span className="tech-item">D3-Sankey</span>
              <span className="tech-item">SVG Animations</span>
            </div>
          </div>

          <div className="categoria-tech">
            <div className="categoria-header">
              <Zap className="icono-categoria" size={24} strokeWidth={1.5} />
              <h3>Animaciones & UX</h3>
            </div>
            <div className="lista-tech">
              <span className="tech-item principal">GSAP 3.14.2</span>
              <span className="tech-item">ScrollTrigger</span>
              <span className="tech-item">Lenis Smooth Scroll</span>
              <span className="tech-item">Lucide React Icons</span>
            </div>
          </div>

          <div className="categoria-tech">
            <div className="categoria-header">
              <Rocket className="icono-categoria" size={24} strokeWidth={1.5} />
              <h3>Build & Development</h3>
            </div>
            <div className="lista-tech">
              <span className="tech-item principal">Vite 7.2.4</span>
              <span className="tech-item">ESLint</span>
              <span className="tech-item">Terser</span>
              <span className="tech-item">Hot Module Replacement</span>
            </div>
          </div>

          <div className="categoria-tech">
            <div className="categoria-header">
              <Cpu className="icono-categoria" size={24} strokeWidth={1.5} />
              <h3>Procesamiento de Datos</h3>
            </div>
            <div className="lista-tech">
              <span className="tech-item principal">Python</span>
              <span className="tech-item">Pandas</span>
              <span className="tech-item">CSV Processing</span>
              <span className="tech-item">Data Cleaning</span>
            </div>
          </div>

          <div className="categoria-tech">
            <div className="categoria-header">
              <Globe className="icono-categoria" size={24} strokeWidth={1.5} />
              <h3>Deployment & Hosting</h3>
            </div>
            <div className="lista-tech">
              <span className="tech-item principal">Vercel</span>
              <span className="tech-item">SPA Optimization</span>
              <span className="tech-item">Edge Functions</span>
              <span className="tech-item">CDN</span>
            </div>
          </div>
        </div>
        </div>
    </section>
  );
};

export default TecnologiasUsadas;