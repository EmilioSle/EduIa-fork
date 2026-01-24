import { useState, useMemo } from "react";
import { Filter, Calendar, ToggleLeft, ToggleRight, RefreshCw } from "lucide-react";
import "../styles/controles-interactivos.css";

/**
 * Componente de controles interactivos para filtrar y segmentar datos
 * Incluye: Filtros por nivel educativo, selector de rango de fechas, toggle para comparar
 */
const ControlesInteractivos = ({
  datos,
  onFiltrosChange,
  mostrarFiltroNivel = true,
  mostrarFiltroFecha = true,
  mostrarToggleComparar = true,
}) => {
  const [filtroNivel, setFiltroNivel] = useState(null);
  const [rangoFechas, setRangoFechas] = useState({ inicio: null, fin: null });
  const [modoComparar, setModoComparar] = useState(false);
  const [nivelesComparar, setNivelesComparar] = useState([]);

  // Extraer opciones únicas de los datos
  const opciones = useMemo(() => {
    if (!datos || datos.length === 0) return { niveles: [], fechas: { min: null, max: null } };

    const niveles = [...new Set(datos.map((d) => d.nivelEducativo))].sort();

    // Parsear fechas
    const fechasParseadas = datos
      .map((d) => {
        if (!d.fechaSesion) return null;
        const partes = d.fechaSesion.split("/");
        if (partes.length === 3) {
          return new Date(partes[2], partes[1] - 1, partes[0]);
        }
        return null;
      })
      .filter((f) => f && !isNaN(f));

    const fechasOrdenadas = fechasParseadas.sort((a, b) => a - b);

    return {
      niveles,
      fechas: {
        min: fechasOrdenadas[0],
        max: fechasOrdenadas[fechasOrdenadas.length - 1],
      },
    };
  }, [datos]);

  // Aplicar filtros y notificar cambios
  const aplicarFiltros = (nuevosFiltros = {}) => {
    const filtrosActualizados = {
      nivel: nuevosFiltros.nivel !== undefined ? nuevosFiltros.nivel : filtroNivel,
      rangoFechas: nuevosFiltros.rangoFechas !== undefined ? nuevosFiltros.rangoFechas : rangoFechas,
      modoComparar: nuevosFiltros.modoComparar !== undefined ? nuevosFiltros.modoComparar : modoComparar,
      nivelesComparar: nuevosFiltros.nivelesComparar !== undefined ? nuevosFiltros.nivelesComparar : nivelesComparar,
    };

    // Filtrar datos
    let datosFiltrados = [...datos];

    // Filtro por nivel (si no está en modo comparar)
    if (filtrosActualizados.nivel && !filtrosActualizados.modoComparar) {
      datosFiltrados = datosFiltrados.filter(
        (d) => d.nivelEducativo === filtrosActualizados.nivel
      );
    }

    // Filtro por rango de fechas
    if (filtrosActualizados.rangoFechas.inicio || filtrosActualizados.rangoFechas.fin) {
      datosFiltrados = datosFiltrados.filter((d) => {
        if (!d.fechaSesion) return true;
        const partes = d.fechaSesion.split("/");
        if (partes.length !== 3) return true;
        const fecha = new Date(partes[2], partes[1] - 1, partes[0]);

        if (filtrosActualizados.rangoFechas.inicio && fecha < filtrosActualizados.rangoFechas.inicio) {
          return false;
        }
        if (filtrosActualizados.rangoFechas.fin && fecha > filtrosActualizados.rangoFechas.fin) {
          return false;
        }
        return true;
      });
    }

    // Filtro para modo comparación
    if (filtrosActualizados.modoComparar && filtrosActualizados.nivelesComparar.length > 0) {
      datosFiltrados = datosFiltrados.filter((d) =>
        filtrosActualizados.nivelesComparar.includes(d.nivelEducativo)
      );
    }

    onFiltrosChange?.({
      filtros: filtrosActualizados,
      datosFiltrados,
    });
  };

  const handleNivelChange = (nivel) => {
    const nuevoNivel = filtroNivel === nivel ? null : nivel;
    setFiltroNivel(nuevoNivel);
    aplicarFiltros({ nivel: nuevoNivel });
  };

  const handleFechaInicioChange = (e) => {
    const fecha = e.target.value ? new Date(e.target.value) : null;
    const nuevoRango = { ...rangoFechas, inicio: fecha };
    setRangoFechas(nuevoRango);
    aplicarFiltros({ rangoFechas: nuevoRango });
  };

  const handleFechaFinChange = (e) => {
    const fecha = e.target.value ? new Date(e.target.value) : null;
    const nuevoRango = { ...rangoFechas, fin: fecha };
    setRangoFechas(nuevoRango);
    aplicarFiltros({ rangoFechas: nuevoRango });
  };

  const handleToggleComparar = () => {
    const nuevoModo = !modoComparar;
    setModoComparar(nuevoModo);
    if (!nuevoModo) {
      setNivelesComparar([]);
      aplicarFiltros({ modoComparar: nuevoModo, nivelesComparar: [] });
    } else {
      aplicarFiltros({ modoComparar: nuevoModo });
    }
  };

  const handleNivelCompararToggle = (nivel) => {
    const nuevosNiveles = nivelesComparar.includes(nivel)
      ? nivelesComparar.filter((n) => n !== nivel)
      : [...nivelesComparar, nivel];
    setNivelesComparar(nuevosNiveles);
    aplicarFiltros({ nivelesComparar: nuevosNiveles });
  };

  const resetFiltros = () => {
    setFiltroNivel(null);
    setRangoFechas({ inicio: null, fin: null });
    setModoComparar(false);
    setNivelesComparar([]);
    onFiltrosChange?.({
      filtros: {
        nivel: null,
        rangoFechas: { inicio: null, fin: null },
        modoComparar: false,
        nivelesComparar: [],
      },
      datosFiltrados: datos,
    });
  };

  const formatDateForInput = (date) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const coloresNivel = {
    Pregrado: "#00d9ff",
    Posgrado: "#9d4edd",
    Secundaria: "#ffd93d",
  };

  return (
    <div className="controles-interactivos">
      <div className="controles-header">
        <h4 className="controles-titulo">
          <Filter size={18} /> Filtros Interactivos
        </h4>
        <button className="btn-reset" onClick={resetFiltros} title="Resetear filtros">
          <RefreshCw size={16} />
          Resetear
        </button>
      </div>

      <div className="controles-contenido">
        {/* Filtro por nivel educativo */}
        {mostrarFiltroNivel && !modoComparar && (
          <div className="control-grupo">
            <label className="control-label">Nivel Educativo</label>
            <div className="control-opciones">
              {opciones.niveles.map((nivel) => (
                <button
                  key={nivel}
                  className={`btn-filtro ${filtroNivel === nivel ? "activo" : ""}`}
                  onClick={() => handleNivelChange(nivel)}
                  style={{
                    borderColor: coloresNivel[nivel],
                    backgroundColor: filtroNivel === nivel ? coloresNivel[nivel] : "transparent",
                    color: filtroNivel === nivel ? "#000" : coloresNivel[nivel],
                  }}
                >
                  {nivel}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selector de rango de fechas */}
        {mostrarFiltroFecha && (
          <div className="control-grupo">
            <label className="control-label">
              <Calendar size={16} /> Rango de Fechas
            </label>
            <div className="control-fechas">
              <div className="fecha-input-wrapper">
                <span className="fecha-label">Desde</span>
                <input
                  type="date"
                  className="fecha-input"
                  value={formatDateForInput(rangoFechas.inicio)}
                  onChange={handleFechaInicioChange}
                  min={formatDateForInput(opciones.fechas.min)}
                  max={formatDateForInput(opciones.fechas.max)}
                />
              </div>
              <div className="fecha-input-wrapper">
                <span className="fecha-label">Hasta</span>
                <input
                  type="date"
                  className="fecha-input"
                  value={formatDateForInput(rangoFechas.fin)}
                  onChange={handleFechaFinChange}
                  min={formatDateForInput(opciones.fechas.min)}
                  max={formatDateForInput(opciones.fechas.max)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Toggle para modo comparación */}
        {mostrarToggleComparar && (
          <div className="control-grupo">
            <label className="control-label">Modo Comparación</label>
            <button
              className={`btn-toggle ${modoComparar ? "activo" : ""}`}
              onClick={handleToggleComparar}
            >
              {modoComparar ? (
                <>
                  <ToggleRight size={20} /> Activado
                </>
              ) : (
                <>
                  <ToggleLeft size={20} /> Desactivado
                </>
              )}
            </button>

            {/* Selección de niveles para comparar */}
            {modoComparar && (
              <div className="control-comparar">
                <p className="comparar-hint">Selecciona niveles a comparar:</p>
                <div className="control-opciones">
                  {opciones.niveles.map((nivel) => (
                    <button
                      key={nivel}
                      className={`btn-filtro ${nivelesComparar.includes(nivel) ? "activo" : ""}`}
                      onClick={() => handleNivelCompararToggle(nivel)}
                      style={{
                        borderColor: coloresNivel[nivel],
                        backgroundColor: nivelesComparar.includes(nivel)
                          ? coloresNivel[nivel]
                          : "transparent",
                        color: nivelesComparar.includes(nivel) ? "#000" : coloresNivel[nivel],
                      }}
                    >
                      {nivel}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resumen de filtros activos */}
      <div className="filtros-resumen">
        {filtroNivel && !modoComparar && (
          <span className="filtro-tag" style={{ borderColor: coloresNivel[filtroNivel] }}>
            Nivel: {filtroNivel}
          </span>
        )}
        {rangoFechas.inicio && (
          <span className="filtro-tag">
            Desde: {rangoFechas.inicio.toLocaleDateString()}
          </span>
        )}
        {rangoFechas.fin && (
          <span className="filtro-tag">
            Hasta: {rangoFechas.fin.toLocaleDateString()}
          </span>
        )}
        {modoComparar && nivelesComparar.length > 0 && (
          <span className="filtro-tag">
            Comparando: {nivelesComparar.join(" vs ")}
          </span>
        )}
      </div>
    </div>
  );
};

export default ControlesInteractivos;
