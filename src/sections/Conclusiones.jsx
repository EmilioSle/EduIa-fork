import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BookOpen, Lightbulb, Trophy, Target, Rocket } from "lucide-react";
import imagen8 from "../assets/images/imagen8.png";
import "../styles/conslucion.css";

gsap.registerPlugin(ScrollTrigger);

const Conclusiones = () => {
  const seccionRef = useRef(null);
  const tituloRef = useRef(null);
  const puntosRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Asegurar que los elementos sean visibles primero
      gsap.set([tituloRef.current, puntosRef.current.children], { opacity: 1, x: 0, y: 0 });
      
      // Animación del título con ScrollTrigger
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

      // Animación de los puntos con ScrollTrigger
      gsap.fromTo(puntosRef.current.children,
        { opacity: 0, x: -50 },
        {
          opacity: 1,
          x: 0,
          stagger: 0.2,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: puntosRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }, seccionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={seccionRef} className="seccion-conclusiones">
      <div className="contenido-conclusiones">
        <h2 ref={tituloRef} className="titulo-conclusiones">
          Tres Lecciones de 10,000 Historias
        </h2>

        <div className="introduccion-conclusiones">
          <p>
            Comenzamos con curiosidad. Terminamos con certezas — algunas esperadas, 
            otras que desafían todo lo que creíamos saber. Estos datos no solo 
            describen el presente; <strong>predicen hacia dónde vamos</strong>.
          </p>
          <img src={imagen8} alt="El comienzo de una era" className="imagen-intro-conclusiones" />
        </div>

        <div ref={puntosRef} className="lista-conclusiones">
          <div className="punto-conclusion">
            <BookOpen className="icono-conclusion" size={48} strokeWidth={1.5} />
            <div className="texto-punto">
              <h3>📚 Lección #1: La Adopción Es Total (y Diversa)</h3>
              <p>
                Olvida la imagen del "nerd" usando IA. Estudiantes de todas las disciplinas, 
                todos los niveles, la usan. Y no para hacer trampa — para <strong>aprender</strong>. 
                La herramienta que muchos temieron se convirtió en el tutor más accesible 
                de la historia. Disponible 24/7, sin juicios, infinita paciencia.
              </p>
            </div>
          </div>

          <div className="punto-conclusion">
            <Lightbulb className="icono-conclusion" size={48} strokeWidth={1.5} />
            <div className="texto-punto">
              <h3>⏱️ Lección #2: La Eficiencia Vence al Tiempo</h3>
              <p>
                Una sesión de 15 minutos que resuelve el problema supera a una maratón 
                de 3 horas sin resultados. Los estudiantes no quieren pasar más tiempo 
                con la IA — quieren pasar el <strong>tiempo justo</strong>. 
                La satisfacción no se mide en minutos. Se mide en problemas resueltos.
              </p>
            </div>
          </div>

          <div className="punto-conclusion">
            <Trophy className="icono-conclusion" size={48} strokeWidth={1.5} />
            <div className="texto-punto">
              <h3>🎯 Lección #3: Resultados > Sentimientos (El Plot Twist)</h3>
              <p>
                Aquí está el hallazgo que desafía la sabiduría convencional: la satisfacción 
                <em>no predice</em> si volverán. Lo que importa es si <strong>lograron su objetivo</strong>. 
                Tarea completada = usuario que vuelve. Experiencia "agradable" sin resultado = 
                usuario que busca alternativas. Los estudiantes son pragmáticos. Y los datos 
                lo confirman sin piedad.
              </p>
            </div>
          </div>

          <div className="punto-conclusion">
            <Target className="icono-conclusion" size={48} strokeWidth={1.5} />
            <div className="texto-punto">
              <h3>📊 Implicaciones para el Futuro</h3>
              <p>
                Para desarrolladores de IA: dejen de optimizar métricas de vanidad. 
                Optimicen <strong>tareas completadas</strong>. Para educadores: la IA 
                no es el enemigo — es el aliado más poderoso si se usa bien. 
                Para estudiantes: sean estratégicos, no dependientes. La herramienta 
                funciona cuando <em>vos</em> sabés lo que querés lograr.
              </p>
            </div>
          </div>

          <div className="punto-conclusion">
            <Rocket className="icono-conclusion" size={48} strokeWidth={1.5} />
            <div className="texto-punto">
              <h3>🚀 El Umbral Cruzado</h3>
              <p>
                No hay vuelta atrás. Los estudiantes que encontraron éxito con la IA 
                no abandonarán la herramienta. Pero esto no es un final — es un comienzo. 
                La pregunta ya no es <em>"¿usamos IA?"</em> sino <em>"¿cómo la usamos 
                para aprender más, no menos?"</em> Los datos nos dieron pistas. 
                El resto es nuestra responsabilidad.
              </p>
            </div>
          </div>
        </div>

        <div className="mensaje-final">
          <h3 className="titulo-mensaje-final">Lo Que Los Datos Nos Enseñaron</h3>
          <p>
            Entramos buscando patrones. Salimos con certezas incómodas: 
            que la satisfacción no garantiza lealtad, que el tiempo invertido 
            no predice resultados, y que los estudiantes son más pragmáticos 
            de lo que quisiéramos admitir.
          </p>
          <p>
            Pero también con esperanza: la IA educativa funciona. 
            No es perfecta, no reemplaza profesores, y definitivamente 
            no hace el trabajo por nadie. Pero cuando se usa bien, 
            <strong>amplifica el aprendizaje</strong>. Y eso es lo que importa.
          </p>
          <p className="firma">
            <strong>EduIA</strong>
            <br />
            <strong>10,000 sesiones. 3 lecciones. 1 verdad.</strong>
            <span className="fecha-firma">2026</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Conclusiones;
