import { useState, useMemo } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/**
 * Gráfico Radar que compara patrones de uso de IA entre diferentes niveles educativos
 * Métricas: Duración promedio, Total de prompts, Satisfacción, Nivel de asistencia, Tasa de éxito
 */
const RadarChartPatrones = ({ datos, nivelesSeleccionados = null }) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const coloresNivel = {
    Pregrado: "#00d9ff",
    Posgrado: "#9d4edd",
    Secundaria: "#ffd93d",
  };

  const datosRadar = useMemo(() => {
    if (!datos || datos.length === 0) return [];

    const niveles = nivelesSeleccionados || [...new Set(datos.map((d) => d.nivelEducativo))];

    // Calcular métricas por nivel
    const metricasPorNivel = {};

    niveles.forEach((nivel) => {
      const datoNivel = datos.filter((d) => d.nivelEducativo === nivel);
      if (datoNivel.length === 0) return;

      const duracionProm = datoNivel.reduce((sum, d) => sum + (d.duracionMinutos || 0), 0) / datoNivel.length;
      const promptsProm = datoNivel.reduce((sum, d) => sum + (d.totalPrompts || 0), 0) / datoNivel.length;
      const satisfaccionProm = datoNivel.reduce((sum, d) => sum + (d.satisfaccion || 0), 0) / datoNivel.length;
      const asistenciaProm = datoNivel.reduce((sum, d) => sum + (d.nivelAsistenciaIA || 0), 0) / datoNivel.length;
      const tasaExito = (datoNivel.filter((d) => d.resultadoFinal === "Tarea completada" || d.resultadoFinal === "Idea desarrollada").length / datoNivel.length) * 100;
      const tasaReutilizacion = (datoNivel.filter((d) => d.usoPosterior === "Sí").length / datoNivel.length) * 100;

      metricasPorNivel[nivel] = {
        duracion: duracionProm,
        prompts: promptsProm,
        satisfaccion: satisfaccionProm,
        asistencia: asistenciaProm,
        exito: tasaExito,
        reutilizacion: tasaReutilizacion,
      };
    });

    // Encontrar máximos para normalizar
    const maxDuracion = Math.max(...Object.values(metricasPorNivel).map((m) => m.duracion));
    const maxPrompts = Math.max(...Object.values(metricasPorNivel).map((m) => m.prompts));

    // Crear datos para el radar
    const metricas = [
      { metrica: "Duración", fullMark: 100 },
      { metrica: "Prompts", fullMark: 100 },
      { metrica: "Satisfacción", fullMark: 100 },
      { metrica: "Nivel Asistencia", fullMark: 100 },
      { metrica: "Tasa Éxito", fullMark: 100 },
      { metrica: "Reutilización", fullMark: 100 },
    ];

    return metricas.map((m) => {
      const punto = { metrica: m.metrica, fullMark: m.fullMark };

      niveles.forEach((nivel) => {
        if (!metricasPorNivel[nivel]) return;
        const metrics = metricasPorNivel[nivel];

        switch (m.metrica) {
          case "Duración":
            punto[nivel] = (metrics.duracion / maxDuracion) * 100;
            punto[`${nivel}_raw`] = metrics.duracion.toFixed(1) + " min";
            break;
          case "Prompts":
            punto[nivel] = (metrics.prompts / maxPrompts) * 100;
            punto[`${nivel}_raw`] = metrics.prompts.toFixed(1);
            break;
          case "Satisfacción":
            punto[nivel] = (metrics.satisfaccion / 5) * 100;
            punto[`${nivel}_raw`] = metrics.satisfaccion.toFixed(2) + "/5";
            break;
          case "Nivel Asistencia":
            punto[nivel] = (metrics.asistencia / 5) * 100;
            punto[`${nivel}_raw`] = metrics.asistencia.toFixed(2) + "/5";
            break;
          case "Tasa Éxito":
            punto[nivel] = metrics.exito;
            punto[`${nivel}_raw`] = metrics.exito.toFixed(1) + "%";
            break;
          case "Reutilización":
            punto[nivel] = metrics.reutilizacion;
            punto[`${nivel}_raw`] = metrics.reutilizacion.toFixed(1) + "%";
            break;
        }
      });

      return punto;
    });
  }, [datos, nivelesSeleccionados]);

  const niveles = nivelesSeleccionados || [...new Set(datos?.map((d) => d.nivelEducativo) || [])];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: "rgba(0, 0, 0, 0.9)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            padding: "12px 16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          <p style={{ color: "#fff", fontWeight: "bold", marginBottom: "8px" }}>
            {label}
          </p>
          {payload.map((entry, index) => {
            const rawKey = `${entry.name}_raw`;
            const rawValue = payload[0]?.payload?.[rawKey];
            return (
              <p
                key={index}
                style={{
                  color: entry.color,
                  margin: "4px 0",
                  fontSize: "13px",
                }}
              >
                {entry.name}: <strong>{rawValue || entry.value.toFixed(1)}</strong>
              </p>
            );
          })}
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
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={datosRadar}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis
            dataKey="metrica"
            tick={{ fill: "#ccc", fontSize: 12 }}
            tickLine={{ stroke: "rgba(255,255,255,0.2)" }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: "#888", fontSize: 10 }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
          />

          {niveles.map((nivel, index) => (
            <Radar
              key={nivel}
              name={nivel}
              dataKey={nivel}
              stroke={coloresNivel[nivel] || "#888"}
              fill={coloresNivel[nivel] || "#888"}
              fillOpacity={activeIndex === index ? 0.5 : 0.25}
              strokeWidth={2}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              animationBegin={index * 200}
              animationDuration={1000}
              animationEasing="ease-out"
            />
          ))}

          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              paddingTop: "20px",
            }}
            formatter={(value) => (
              <span style={{ color: coloresNivel[value] || "#ccc" }}>{value}</span>
            )}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChartPatrones;
