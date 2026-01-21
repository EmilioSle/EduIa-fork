import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "../styles/estadistica-destacada.css";

gsap.registerPlugin(ScrollTrigger);

const EstadisticaDestacada = ({ items }) => {
  const seccionRef = useRef(null);
  const itemsRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      itemsRef.current.forEach((item, index) => {
        gsap.from(item, {
          scrollTrigger: {
            trigger: item,
            start: "top 85%",
            toggleActions: "play none none none",
          },
          y: 50,
          opacity: 0,
          scale: 0.9,
          duration: 0.8,
          delay: index * 0.15,
          ease: "power3.out",
        });
      });
    }, seccionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={seccionRef} className="seccion-estadisticas">
      <div className="grid-estadisticas">
        {items.map((item, index) => (
          <div
            key={index}
            ref={(el) => (itemsRef.current[index] = el)}
            className="tarjeta-estadistica"
          >
            <div className="icono-stat">
              {typeof item.icono === "string" ? item.icono : <item.icono size={40} strokeWidth={1.5} />}
            </div>
            <div className="numero-stat">{item.numero}</div>
            <div className="etiqueta-stat">{item.etiqueta}</div>
            {item.descripcion && (
              <div className="descripcion-stat">{item.descripcion}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default EstadisticaDestacada;
