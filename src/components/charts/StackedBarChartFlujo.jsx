import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector, Label } from "recharts";
import { GraduationCap, BookOpen, Users, TrendingUp, CheckCircle, XCircle } from "lucide-react";

/**
 * Dashboard de tarjetas comparativas
 * Cada nivel educativo tiene su propia tarjeta con estadísticas claras
 */
const StackedBarChartFlujo = ({ datos, filtroNivel = null }) => {
  const [vistaActual, setVistaActual] = useState("tareas");
  const [tarjetaActiva, setTarjetaActiva] = useState(null);
  const [sectorActivo, setSectorActivo] = useState(null);

  const iconosNivel = {
    Secundaria: Users,
    Pregrado: BookOpen,
    Posgrado: GraduationCap,
  };

  const coloresNivel = {
    Pregrado: { main: "#00d9ff", bg: "rgba(0, 217, 255, 0.1)", border: "rgba(0, 217, 255, 0.3)" },
    Posgrado: { main: "#9d4edd", bg: "rgba(157, 78, 221, 0.1)", border: "rgba(157, 78, 221, 0.3)" },
    Secundaria: { main: "#ffd93d", bg: "rgba(255, 217, 61, 0.1)", border: "rgba(255, 217, 61, 0.3)" },
  };

  const coloresTarea = ["#ff6b6b", "#00ff9f", "#ff8c42", "#4ecdc4", "#f72585", "#7c3aed"];
  const coloresResultado = ["#6bcb77", "#00d9ff", "#ffd93d", "#ff6b6b"];

  // Procesar datos por nivel
  const datosPorNivel = useMemo(() => {
    if (!datos) return [];

    const niveles = filtroNivel ? [filtroNivel] : ["Pregrado", "Posgrado", "Secundaria"];

    return niveles.map((nivel) => {
      const datosNivel = datos.filter((d) => d.nivelEducativo === nivel);
      const total = datosNivel.length;

      // Contar por categoría
      const categorias = vistaActual === "tareas"
        ? [...new Set(datos.map((d) => d.tipoTarea))]
        : [...new Set(datos.map((d) => d.resultadoFinal))];

      const distribucion = categorias.map((cat) => {
        const cantidad = datosNivel.filter((d) =>
          vistaActual === "tareas" ? d.tipoTarea === cat : d.resultadoFinal === cat
        ).length;
        return {
          nombre: cat,
          valor: cantidad,
          porcentaje: total > 0 ? ((cantidad / total) * 100).toFixed(1) : 0,
        };
      }).filter((d) => d.valor > 0).sort((a, b) => b.valor - a.valor);

      // Calcular estadísticas
      const tasaExito = vistaActual === "resultados"
        ? ((datosNivel.filter((d) => d.resultadoFinal === "Tarea completada" || d.resultadoFinal === "Idea desarrollada").length / total) * 100).toFixed(0)
        : null;

      const topCategoria = distribucion[0];

      return {
        nivel,
        total,
        distribucion,
        topCategoria,
        tasaExito,
      };
    });
  }, [datos, filtroNivel, vistaActual]);

  // Componente de dona con sector activo expandido
  const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          style={{ filter: "drop-shadow(0 0 8px " + fill + ")" }}
        />
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 4}
          outerRadius={innerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  const coloresActuales = vistaActual === "tareas" ? coloresTarea : coloresResultado;

  if (!datos || datos.length === 0) {
    return <div style={{ color: "#888", textAlign: "center", padding: "40px" }}>Cargando datos...</div>;
  }

  return (
    <div style={{ width: "100%" }}>
      {/* Selector de vista */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        gap: "12px",
        marginBottom: "32px",
      }}>
        <button
          onClick={() => setVistaActual("tareas")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 28px",
            borderRadius: "30px",
            border: "none",
            background: vistaActual === "tareas"
              ? "linear-gradient(135deg, #00d9ff 0%, #0099cc 100%)"
              : "rgba(255,255,255,0.05)",
            color: vistaActual === "tareas" ? "#000" : "#888",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: vistaActual === "tareas" ? "600" : "400",
            transition: "all 0.3s ease",
            boxShadow: vistaActual === "tareas" ? "0 4px 25px rgba(0, 217, 255, 0.4)" : "none",
          }}
        >
          📚 ¿Para qué usan la IA?
        </button>
        <button
          onClick={() => setVistaActual("resultados")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 28px",
            borderRadius: "30px",
            border: "none",
            background: vistaActual === "resultados"
              ? "linear-gradient(135deg, #6bcb77 0%, #4a9e54 100%)"
              : "rgba(255,255,255,0.05)",
            color: vistaActual === "resultados" ? "#000" : "#888",
            cursor: "pointer",
            fontSize: "15px",
            fontWeight: vistaActual === "resultados" ? "600" : "400",
            transition: "all 0.3s ease",
            boxShadow: vistaActual === "resultados" ? "0 4px 25px rgba(107, 203, 119, 0.4)" : "none",
          }}
        >
          🎯 ¿Qué resultados obtienen?
        </button>
      </div>

      {/* Tarjetas por nivel */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "24px",
      }}>
        {datosPorNivel.map((nivelData, nivelIndex) => {
          const IconoNivel = iconosNivel[nivelData.nivel];
          const colores = coloresNivel[nivelData.nivel];
          const isActive = tarjetaActiva === nivelData.nivel;

          return (
            <div
              key={nivelData.nivel}
              onMouseEnter={() => setTarjetaActiva(nivelData.nivel)}
              onMouseLeave={() => setTarjetaActiva(null)}
              style={{
                background: `linear-gradient(135deg, ${colores.bg} 0%, rgba(13, 17, 23, 0.95) 100%)`,
                borderRadius: "24px",
                padding: "28px",
                border: `2px solid ${isActive ? colores.main : colores.border}`,
                transition: "all 0.3s ease",
                transform: isActive ? "translateY(-8px)" : "translateY(0)",
                boxShadow: isActive
                  ? `0 20px 50px rgba(0,0,0,0.4), 0 0 30px ${colores.bg}`
                  : "0 4px 20px rgba(0,0,0,0.2)",
              }}
            >
              {/* Header de la tarjeta */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    background: `linear-gradient(135deg, ${colores.main}22 0%, ${colores.main}44 100%)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `1px solid ${colores.main}55`,
                  }}>
                    {IconoNivel && <IconoNivel size={24} color={colores.main} />}
                  </div>
                  <div>
                    <h3 style={{ color: "#fff", fontSize: "20px", fontWeight: "700", margin: 0 }}>
                      {nivelData.nivel}
                    </h3>
                    <p style={{ color: "#888", fontSize: "13px", margin: 0 }}>
                      {nivelData.total.toLocaleString()} sesiones
                    </p>
                  </div>
                </div>
                {vistaActual === "resultados" && (
                  <div style={{
                    textAlign: "right",
                    padding: "8px 14px",
                    background: "rgba(107, 203, 119, 0.15)",
                    borderRadius: "12px",
                    border: "1px solid rgba(107, 203, 119, 0.3)",
                  }}>
                    <div style={{ color: "#6bcb77", fontSize: "22px", fontWeight: "bold" }}>
                      {nivelData.tasaExito}%
                    </div>
                    <div style={{ color: "#888", fontSize: "10px" }}>éxito</div>
                  </div>
                )}
              </div>

              {/* Gráfico de dona */}
              <div style={{ height: "200px", position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      activeIndex={sectorActivo?.nivel === nivelData.nivel ? sectorActivo.index : null}
                      activeShape={renderActiveShape}
                      data={nivelData.distribucion}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      dataKey="valor"
                      onMouseEnter={(_, index) => setSectorActivo({ nivel: nivelData.nivel, index })}
                      onMouseLeave={() => setSectorActivo(null)}
                      animationBegin={nivelIndex * 200}
                      animationDuration={800}
                    >
                      {nivelData.distribucion.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={coloresActuales[index % coloresActuales.length]}
                          stroke="rgba(0,0,0,0.3)"
                          strokeWidth={1}
                        />
                      ))}
                    </Pie>
                    {/* Etiquetas de porcentaje como Pie separado - SIEMPRE VISIBLES */}
                    <Pie
                      data={nivelData.distribucion}
                      cx="50%"
                      cy="50%"
                      innerRadius={75}
                      outerRadius={75}
                      dataKey="valor"
                      label={({ cx, cy, midAngle, outerRadius, percent, index }) => {
                        if (percent < 0.05) return null;
                        const RADIAN = Math.PI / 180;
                        const radius = outerRadius + 18;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text
                            x={x}
                            y={y}
                            fill={coloresActuales[index % coloresActuales.length]}
                            textAnchor={x > cx ? "start" : "end"}
                            dominantBaseline="central"
                            fontSize="11"
                            fontWeight="700"
                          >
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                      labelLine={false}
                      isAnimationActive={false}
                      fill="transparent"
                      stroke="none"
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Centro de la dona - Top categoría */}
                <div style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                  pointerEvents: "none",
                }}>
                  <div style={{ color: colores.main, fontSize: "11px", fontWeight: "500" }}>
                    TOP
                  </div>
                  <div style={{
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: "600",
                    maxWidth: "70px",
                    lineHeight: "1.2",
                  }}>
                    {nivelData.topCategoria?.nombre}
                  </div>
                </div>
              </div>

              {/* Lista de categorías - TODAS */}
              <div style={{ marginTop: "16px", minHeight: "180px" }}>
                {nivelData.distribucion.map((cat, index) => (
                  <div
                    key={cat.nombre}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      marginBottom: "4px",
                      background: sectorActivo?.nivel === nivelData.nivel && sectorActivo?.index === index
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(255,255,255,0.03)",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={() => setSectorActivo({ nivel: nivelData.nivel, index })}
                    onMouseLeave={() => setSectorActivo(null)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "4px",
                        background: coloresActuales[index % coloresActuales.length],
                        boxShadow: `0 0 6px ${coloresActuales[index % coloresActuales.length]}55`,
                      }} />
                      <span style={{ color: "#ccc", fontSize: "13px" }}>{cat.nombre}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ color: "#666", fontSize: "12px" }}>
                        {cat.valor.toLocaleString()}
                      </span>
                      <span style={{
                        color: coloresActuales[index % coloresActuales.length],
                        fontSize: "14px",
                        fontWeight: "600",
                        minWidth: "45px",
                        textAlign: "right",
                      }}>
                        {cat.porcentaje}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Insight destacado */}
      <div style={{
        marginTop: "32px",
        padding: "20px 28px",
        background: "linear-gradient(135deg, rgba(0, 217, 255, 0.08) 0%, rgba(157, 78, 221, 0.08) 100%)",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}>
        <TrendingUp size={28} color="#00d9ff" />
        <div>
          <span style={{ color: "#888", fontSize: "13px" }}>💡 Dato curioso: </span>
          <span style={{ color: "#fff", fontSize: "14px" }}>
            {vistaActual === "tareas"
              ? `Los estudiantes de ${datosPorNivel[0]?.nivel || "Pregrado"} prefieren usar la IA principalmente para "${datosPorNivel[0]?.topCategoria?.nombre}", representando el ${datosPorNivel[0]?.topCategoria?.porcentaje}% de sus sesiones.`
              : `La tasa de éxito más alta es de ${Math.max(...datosPorNivel.map(n => parseFloat(n.tasaExito) || 0))}%, demostrando que la IA ayuda efectivamente a completar tareas.`
            }
          </span>
        </div>
      </div>
    </div>
  );
};

export default StackedBarChartFlujo;
