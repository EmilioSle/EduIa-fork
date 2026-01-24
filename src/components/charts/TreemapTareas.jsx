import { useState, useMemo } from "react";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";

/**
 * Gráfico Treemap que muestra la distribución jerárquica de tipos de tareas
 * con subdivisión por nivel educativo
 */
const TreemapTareas = ({ datos, mostrarSubdivisiones = true }) => {
  const [activeItem, setActiveItem] = useState(null);

  const coloresTarea = {
    Estudio: "#ff6b6b",
    Programación: "#00ff9f",
    Redacción: "#ff8c42",
    "Lluvia de ideas": "#4ecdc4",
    "Ayuda en tareas": "#f72585",
    Investigación: "#7c3aed",
  };

  const coloresNivel = {
    Pregrado: "#00d9ff",
    Posgrado: "#9d4edd",
    Secundaria: "#ffd93d",
  };

  const datosTreemap = useMemo(() => {
    if (!datos || datos.length === 0) return [];

    const tiposTarea = [...new Set(datos.map((d) => d.tipoTarea))];
    const total = datos.length;

    if (!mostrarSubdivisiones) {
      // Vista simple: solo tipos de tarea
      return tiposTarea.map((tarea) => {
        const cantidad = datos.filter((d) => d.tipoTarea === tarea).length;
        const porcentaje = ((cantidad / total) * 100).toFixed(1);
        return {
          name: tarea,
          size: cantidad,
          porcentaje,
          fill: coloresTarea[tarea] || "#888",
        };
      });
    }

    // Vista jerárquica: tarea → nivel educativo
    return tiposTarea.map((tarea) => {
      const datosTarea = datos.filter((d) => d.tipoTarea === tarea);
      const cantidadTarea = datosTarea.length;
      const porcentajeTarea = ((cantidadTarea / total) * 100).toFixed(1);

      const niveles = [...new Set(datosTarea.map((d) => d.nivelEducativo))];
      const children = niveles.map((nivel) => {
        const cantidad = datosTarea.filter((d) => d.nivelEducativo === nivel).length;
        const porcentaje = ((cantidad / cantidadTarea) * 100).toFixed(1);
        return {
          name: nivel,
          size: cantidad,
          porcentaje,
          parent: tarea,
          fill: coloresNivel[nivel] || "#888",
        };
      });

      return {
        name: tarea,
        size: cantidadTarea,
        porcentaje: porcentajeTarea,
        fill: coloresTarea[tarea] || "#888",
        children,
      };
    });
  }, [datos, mostrarSubdivisiones]);

  const CustomizedContent = (props) => {
    const { x, y, width, height, name, size, porcentaje, fill, depth, parent } = props;

    if (width < 30 || height < 30) return null;

    const isHovered = activeItem === name;
    const opacity = isHovered ? 1 : 0.85;
    const strokeWidth = isHovered ? 3 : 1;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill}
          fillOpacity={opacity}
          stroke="rgba(0,0,0,0.3)"
          strokeWidth={strokeWidth}
          rx={4}
          style={{
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={() => setActiveItem(name)}
          onMouseLeave={() => setActiveItem(null)}
        />
        {width > 60 && height > 40 && (
          <>
            <text
              x={x + width / 2}
              y={y + height / 2 - (depth === 1 ? 8 : 0)}
              textAnchor="middle"
              fill="#fff"
              fontSize={depth === 1 ? 11 : 13}
              fontWeight="bold"
              style={{ pointerEvents: "none", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
            >
              {name}
            </text>
            {width > 80 && height > 55 && (
              <text
                x={x + width / 2}
                y={y + height / 2 + (depth === 1 ? 8 : 15)}
                textAnchor="middle"
                fill="rgba(255,255,255,0.9)"
                fontSize={depth === 1 ? 10 : 11}
                style={{ pointerEvents: "none" }}
              >
                {size.toLocaleString()} ({porcentaje}%)
              </text>
            )}
          </>
        )}
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            background: "rgba(0, 0, 0, 0.95)",
            border: `2px solid ${data.fill}`,
            borderRadius: "10px",
            padding: "14px 18px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            maxWidth: "250px",
          }}
        >
          <p
            style={{
              color: data.fill,
              fontWeight: "bold",
              fontSize: "15px",
              marginBottom: "8px",
            }}
          >
            {data.parent ? `${data.parent} → ${data.name}` : data.name}
          </p>
          <p style={{ color: "#fff", margin: "4px 0", fontSize: "13px" }}>
            📊 Sesiones: <strong>{data.size.toLocaleString()}</strong>
          </p>
          <p style={{ color: "#00d9ff", margin: "4px 0", fontSize: "13px" }}>
            📈 Porcentaje: <strong>{data.porcentaje}%</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  if (!datos || datos.length === 0) {
    return (
      <div style={{ color: "#888", textAlign: "center", padding: "40px" }}>
        Cargando datos...
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "500px",
        background: "rgba(255,255,255,0.02)",
        borderRadius: "12px",
        padding: "20px",
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={datosTreemap}
          dataKey="size"
          aspectRatio={4 / 3}
          stroke="rgba(0,0,0,0.2)"
          content={<CustomizedContent />}
          animationDuration={800}
          animationEasing="ease-out"
        >
          <Tooltip content={<CustomTooltip />} />
        </Treemap>
      </ResponsiveContainer>

      {/* Leyenda */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "16px",
          marginTop: "16px",
          padding: "12px",
          background: "rgba(0,0,0,0.2)",
          borderRadius: "8px",
        }}
      >
        {Object.entries(coloresTarea).map(([tarea, color]) => (
          <div
            key={tarea}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              color: "#ccc",
            }}
          >
            <span
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "3px",
                backgroundColor: color,
              }}
            />
            {tarea}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TreemapTareas;
