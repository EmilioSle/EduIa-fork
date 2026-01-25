import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import {
  Menu,
  X,
  Home,
  Users,
  Heart,
  RotateCw,
  BookOpen,
  Cpu,
  Volume2,
  VolumeX,
  BarChart3,
} from "lucide-react";
import "../styles/menu-interactivo.css";

const MenuInteractivo = () => {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [musicaActiva, setMusicaActiva] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState("intro");
  const navRef = useRef(null);
  const itemsRef = useRef([]);
  const audioRef = useRef(null);
  const logoRef = useRef(null);

  const secciones = [
    { id: "intro", nombre: "Inicio", icono: Home, color: "#00d9ff" },
    { id: "estadisticas", nombre: "Stats", icono: BarChart3, color: "#00ff9f" },
    { id: "objetivo-uso", nombre: "Uso IA", icono: Users, color: "#ffaa00" },
    { id: "objetivo-satisfaccion", nombre: "Satisfacción", icono: Heart, color: "#ff6b6b" },
    { id: "objetivo-reutilizacion", nombre: "Reutilización", icono: RotateCw, color: "#a855f7" },
    { id: "conclusiones", nombre: "Conclusiones", icono: BookOpen, color: "#ff00ff" },
    { id: "tecnologias", nombre: "Tech", icono: Cpu, color: "#00d9ff" },
  ];

  // Inicializar audio
  useEffect(() => {
    // Coloca tu archivo de música en public/audio/ con este nombre
    audioRef.current = new Audio("/audio/musica-fondo.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Detectar scroll para cambiar estilo del navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      // Detectar sección activa
      const secciones = document.querySelectorAll("[data-seccion]");
      secciones.forEach((seccion) => {
        const rect = seccion.getBoundingClientRect();
        if (rect.top <= 150 && rect.bottom >= 150) {
          setSeccionActiva(seccion.getAttribute("data-seccion"));
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Animación inicial del navbar
  useEffect(() => {
    gsap.fromTo(
      navRef.current,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.5 }
    );

    // Animar items con stagger
    gsap.fromTo(
      itemsRef.current,
      { y: -20, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.5,
        stagger: 0.1,
        ease: "back.out(1.7)",
        delay: 0.8,
      }
    );

    // Animar logo
    gsap.fromTo(
      logoRef.current,
      { scale: 0, rotation: -180 },
      { scale: 1, rotation: 0, duration: 0.8, ease: "elastic.out(1, 0.5)", delay: 0.3 }
    );
  }, []);

  // Animación del menú móvil
  useEffect(() => {
    if (menuAbierto) {
      gsap.fromTo(
        ".menu-movil",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, ease: "power2.out" }
      );
      gsap.fromTo(
        ".menu-movil .item-nav",
        { x: -30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.3, stagger: 0.05, ease: "power2.out", delay: 0.1 }
      );
    }
  }, [menuAbierto]);

  // Toggle música
  const toggleMusica = () => {
    if (audioRef.current) {
      if (musicaActiva) {
        gsap.to(audioRef.current, {
          volume: 0,
          duration: 0.5,
          onComplete: () => audioRef.current.pause(),
        });
      } else {
        audioRef.current.play();
        gsap.fromTo(audioRef.current, { volume: 0 }, { volume: 0.3, duration: 0.5 });
      }
      setMusicaActiva(!musicaActiva);
    }
  };

  // Navegar a sección
  const navegarASeccion = (seccionId) => {
    const seccion = document.querySelector(`[data-seccion="${seccionId}"]`);
    if (seccion) {
      seccion.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setMenuAbierto(false);
  };

  // Animación hover de items
  const handleItemHover = (index, entering) => {
    if (entering && itemsRef.current[index]) {
      gsap.to(itemsRef.current[index], {
        y: -3,
        scale: 1.05,
        duration: 0.2,
        ease: "power2.out",
      });
    } else if (itemsRef.current[index]) {
      gsap.to(itemsRef.current[index], {
        y: 0,
        scale: 1,
        duration: 0.2,
        ease: "power2.out",
      });
    }
  };

  return (
    <>
      {/* Navbar superior */}
      <nav ref={navRef} className={`navbar-superior ${scrolled ? "scrolled" : ""}`}>
        <div className="navbar-contenido">
          {/* Logo */}
          <div ref={logoRef} className="logo-navbar" onClick={() => navegarASeccion("intro")}>
            <span className="logo-edu">Edu</span>
            <span className="logo-ia">IA</span>
            <div className="logo-brillo"></div>
          </div>

          {/* Navegación desktop */}
          <ul className="nav-lista desktop">
            {secciones.map((seccion, index) => {
              const Icono = seccion.icono;
              const esActivo = seccionActiva === seccion.id;
              return (
                <li
                  key={seccion.id}
                  ref={(el) => (itemsRef.current[index] = el)}
                  className={`item-nav ${esActivo ? "activo" : ""}`}
                  onClick={() => navegarASeccion(seccion.id)}
                  onMouseEnter={() => handleItemHover(index, true)}
                  onMouseLeave={() => handleItemHover(index, false)}
                  style={{ "--item-color": seccion.color }}
                >
                  <Icono size={16} className="icono-nav" />
                  <span className="nombre-nav">{seccion.nombre}</span>
                  <div className="indicador-activo"></div>
                  <div className="hover-glow"></div>
                </li>
              );
            })}
          </ul>

          {/* Controles derecha */}
          <div className="navbar-controles">
            {/* Botón de música */}
            <button
              className={`boton-musica ${musicaActiva ? "activo" : ""}`}
              onClick={toggleMusica}
              aria-label={musicaActiva ? "Pausar música" : "Reproducir música"}
            >
              {musicaActiva ? <Volume2 size={20} /> : <VolumeX size={20} />}
              {musicaActiva && (
                <div className="ondas-sonido">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
            </button>

            {/* Botón hamburguesa móvil */}
            <button
              className={`boton-hamburguesa ${menuAbierto ? "activo" : ""}`}
              onClick={() => setMenuAbierto(!menuAbierto)}
              aria-label="Menú"
            >
              {menuAbierto ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Línea animada inferior */}
        <div className="linea-progreso">
          <div className="progreso-inner"></div>
        </div>
      </nav>

      {/* Menú móvil desplegable */}
      {menuAbierto && (
        <div className="menu-movil">
          <ul className="lista-movil">
            {secciones.map((seccion) => {
              const Icono = seccion.icono;
              const esActivo = seccionActiva === seccion.id;
              return (
                <li
                  key={seccion.id}
                  className={`item-nav movil ${esActivo ? "activo" : ""}`}
                  onClick={() => navegarASeccion(seccion.id)}
                  style={{ "--item-color": seccion.color }}
                >
                  <Icono size={20} className="icono-nav" />
                  <span>{seccion.nombre}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Overlay para menú móvil */}
      {menuAbierto && (
        <div className="overlay-movil" onClick={() => setMenuAbierto(false)} />
      )}
    </>
  );
};

export default MenuInteractivo;
