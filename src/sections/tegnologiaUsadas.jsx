import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { 
  Code, Database, Zap, Rocket, Globe, Cpu, 
  Atom, Layers, BarChart3, PieChart, TrendingUp,
  Sparkles, MousePointerClick, Palette, Terminal,
  Package, FileCode, Settings, Server, Cloud,
  GitBranch, Boxes, Workflow, Binary, FlaskConical
} from "lucide-react";
import "../styles/tecnologias.css";

gsap.registerPlugin(ScrollTrigger);

const TecnologiasUsadas = () => {
  const seccionRef = useRef(null);
  const tituloRef = useRef(null);
  const descripcionRef = useRef(null);
  const categoriasRef = useRef(null);
  const particlesRef = useRef(null);
  const statsRef = useRef(null);

  const tecnologias = [
    {
      categoria: "Frontend Framework",
      icono: Code,
      color: "#61dafb",
      items: [
        { nombre: "React 19.2.0", icono: Atom, principal: true },
        { nombre: "React DOM", icono: Layers },
        { nombre: "JSX", icono: FileCode },
        { nombre: "Hooks", icono: Workflow },
      ]
    },
    {
      categoria: "Visualización de Datos",
      icono: Database,
      color: "#f9a825",
      items: [
        { nombre: "D3.js 7.9.0", icono: TrendingUp, principal: true },
        { nombre: "Recharts 3.7.0", icono: BarChart3, principal: true },
        { nombre: "D3-Sankey", icono: Workflow },
        { nombre: "SVG Animations", icono: PieChart },
      ]
    },
    {
      categoria: "Animaciones & UX",
      icono: Zap,
      color: "#88d65d",
      items: [
        { nombre: "GSAP 3.14.2", icono: Sparkles, principal: true },
        { nombre: "ScrollTrigger", icono: MousePointerClick },
        { nombre: "Lenis Smooth", icono: Workflow },
        { nombre: "Lucide Icons", icono: Palette },
      ]
    },
    {
      categoria: "Build & Development",
      icono: Rocket,
      color: "#bd93f9",
      items: [
        { nombre: "Vite 7.2.4", icono: Zap, principal: true },
        { nombre: "ESLint", icono: Settings },
        { nombre: "Terser", icono: Package },
        { nombre: "HMR", icono: Terminal },
      ]
    },
    {
      categoria: "Procesamiento de Datos",
      icono: Cpu,
      color: "#ff6b6b",
      items: [
        { nombre: "Python", icono: Binary, principal: true },
        { nombre: "Pandas", icono: FlaskConical },
        { nombre: "CSV Processing", icono: Boxes },
        { nombre: "Data Cleaning", icono: Sparkles },
      ]
    },
    {
      categoria: "Deployment & Hosting",
      icono: Globe,
      color: "#00d4ff",
      items: [
        { nombre: "Vercel", icono: Cloud, principal: true },
        { nombre: "SPA Optimization", icono: Rocket },
        { nombre: "Edge Functions", icono: Server },
        { nombre: "CDN Global", icono: GitBranch },
      ]
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Crear partículas flotantes
      const particles = particlesRef.current?.querySelectorAll('.particle');
      if (particles) {
        particles.forEach((particle, i) => {
          gsap.set(particle, {
            x: Math.random() * window.innerWidth,
            y: Math.random() * 500,
            scale: Math.random() * 0.5 + 0.5,
          });
          
          gsap.to(particle, {
            y: "-=100",
            x: `+=${Math.random() * 100 - 50}`,
            opacity: Math.random() * 0.5 + 0.3,
            duration: Math.random() * 3 + 2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: i * 0.2,
          });

          gsap.to(particle, {
            rotation: 360,
            duration: Math.random() * 10 + 10,
            repeat: -1,
            ease: "none",
          });
        });
      }

      // Animación del título con efecto glitch
      const tituloTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: tituloRef.current,
          start: "top 85%",
          toggleActions: "play none none reverse"
        }
      });

      tituloTimeline
        .fromTo(tituloRef.current, 
          { opacity: 0, y: 80, scale: 0.8, rotationX: 45 },
          { 
            opacity: 1, 
            y: 0, 
            scale: 1, 
            rotationX: 0,
            duration: 1.2, 
            ease: "power4.out" 
          }
        )
        .fromTo(".titulo-icon", 
          { scale: 0, rotation: -180 },
          { scale: 1, rotation: 0, duration: 0.8, ease: "elastic.out(1, 0.5)" },
          "-=0.6"
        );

      // Animación de la descripción
      gsap.fromTo(descripcionRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: descripcionRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse"
          }
        }
      );

      // Animación de las categorías con efecto 3D
      const categorias = categoriasRef.current?.querySelectorAll('.categoria-tech');
      if (categorias) {
        categorias.forEach((categoria, index) => {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: categoria,
              start: "top 85%",
              toggleActions: "play none none reverse"
            }
          });

          tl.fromTo(categoria,
            { 
              opacity: 0, 
              y: 60, 
              scale: 0.8,
              rotationY: index % 2 === 0 ? -15 : 15,
            },
            { 
              opacity: 1, 
              y: 0, 
              scale: 1,
              rotationY: 0,
              duration: 0.8, 
              ease: "power3.out",
              delay: index * 0.1
            }
          );

          // Animar el icono de la categoría
          const iconoCategoria = categoria.querySelector('.icono-categoria-wrapper');
          if (iconoCategoria) {
            tl.fromTo(iconoCategoria,
              { scale: 0, rotation: -90 },
              { scale: 1, rotation: 0, duration: 0.5, ease: "back.out(2)" },
              "-=0.4"
            );
          }

          // Animar los items de tecnología
          const techItems = categoria.querySelectorAll('.tech-item');
          tl.fromTo(techItems,
            { opacity: 0, x: -20, scale: 0.8 },
            { 
              opacity: 1, 
              x: 0, 
              scale: 1,
              stagger: 0.08,
              duration: 0.4,
              ease: "power2.out"
            },
            "-=0.3"
          );

          // Animación continua de hover para iconos
          const iconos = categoria.querySelectorAll('.tech-icon');
          iconos.forEach((icono) => {
            gsap.to(icono, {
              y: -3,
              duration: 1 + Math.random() * 0.5,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
              delay: Math.random() * 0.5
            });
          });
        });
      }

      // Animación de estadísticas
      const stats = statsRef.current?.querySelectorAll('.stat-item');
      if (stats) {
        gsap.fromTo(stats,
          { opacity: 0, y: 40, scale: 0.9 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            stagger: 0.15,
            duration: 0.6,
            ease: "back.out(1.5)",
            scrollTrigger: {
              trigger: statsRef.current,
              start: "top 90%",
              toggleActions: "play none none reverse"
            }
          }
        );

        // Animación de números
        stats.forEach((stat) => {
          const numero = stat.querySelector('.stat-numero');
          if (numero) {
            gsap.fromTo(numero,
              { scale: 0.5, opacity: 0 },
              {
                scale: 1,
                opacity: 1,
                duration: 0.8,
                ease: "elastic.out(1, 0.5)",
                scrollTrigger: {
                  trigger: stat,
                  start: "top 90%",
                  toggleActions: "play none none reverse"
                }
              }
            );
          }
        });
      }

    }, seccionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={seccionRef} className="tecnologias-utilizadas">
      {/* Partículas flotantes de fondo */}
      <div ref={particlesRef} className="particles-container">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle">
            {i % 3 === 0 ? <Code size={20} /> : i % 3 === 1 ? <Sparkles size={16} /> : <Zap size={18} />}
          </div>
        ))}
      </div>

      {/* Glow animado de fondo */}
      <div className="background-glow"></div>

      <div className="contenido-tecnologias">
        <h2 ref={tituloRef} className="titulo-tecnologias">
          <span className="titulo-icon">🛠️</span>
          <span className="titulo-text">Tecnologías Utilizadas</span>
          <span className="titulo-sparkle">✨</span>
        </h2>
        
        <p ref={descripcionRef} className="descripcion-tecnologias">
          Este proyecto fue construido con un stack moderno de tecnologías web 
          especializadas en <span className="highlight">visualización de datos</span> y 
          <span className="highlight"> experiencia de usuario interactiva</span>.
        </p>
        
        <div ref={categoriasRef} className="categorias-tecnologias">
          {tecnologias.map((cat, index) => {
            const IconoCategoria = cat.icono;
            return (
              <div 
                key={index} 
                className="categoria-tech"
                style={{ '--accent-color': cat.color }}
              >
                <div className="categoria-header">
                  <div className="icono-categoria-wrapper" style={{ backgroundColor: `${cat.color}20`, borderColor: cat.color }}>
                    <IconoCategoria className="icono-categoria" size={24} strokeWidth={1.5} style={{ color: cat.color }} />
                  </div>
                  <h3>{cat.categoria}</h3>
                </div>
                <div className="lista-tech">
                  {cat.items.map((item, idx) => {
                    const IconoTech = item.icono;
                    return (
                      <span 
                        key={idx} 
                        className={`tech-item ${item.principal ? 'principal' : ''}`}
                        style={item.principal ? { '--glow-color': cat.color } : {}}
                      >
                        <IconoTech className="tech-icon" size={14} strokeWidth={2} />
                        {item.nombre}
                      </span>
                    );
                  })}
                </div>
                <div className="categoria-glow" style={{ background: `radial-gradient(circle, ${cat.color}15 0%, transparent 70%)` }}></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TecnologiasUsadas;