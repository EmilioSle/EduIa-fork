import { useState, useMemo } from "react";
import { Filter, X, ChevronDown } from "lucide-react";
import "../styles/filtros-grafico.css";

/**
 * Componente de filtros compactos para gráficos individuales
 * Se integra directamente en cada gráfico
 */
const FiltrosGrafico = ({ datos, onFiltrar, mostrarNivel = true, mostrarDisciplina = true, mostrarResultado = false }) => {
  const [filtroNivel, setFiltroNivel] = useState("todos");
  const [filtroDisciplina, setFiltroDisciplina] = useState("todos");
  const [filtroResultado, setFiltroResultado] = useState("todos");
  const [abierto, setAbierto] = useState(false);

  // Obtener valores únicos
  const niveles = useMemo(() => {
    if (!datos) return [];
    return [...new Set(datos.map(d => d.nivelEducativo))].sort();
  }, [datos]);

  const disciplinas = useMemo(() => {
    if (!datos) return [];
    return [...new Set(datos.map(d => d.disciplina))].sort();
  }, [datos]);

  const resultados = useMemo(() => {
    if (!datos) return [];
    return [...new Set(datos.map(d => d.resultadoFinal))].sort();
  }, [datos]);

  // Aplicar filtros
  const aplicarFiltros = (nivel, disciplina, resultado) => {
    let datosFiltrados = [...datos];
    
    if (nivel !== "todos") {
      datosFiltrados = datosFiltrados.filter(d => d.nivelEducativo === nivel);
    }
    if (disciplina !== "todos") {
      datosFiltrados = datosFiltrados.filter(d => d.disciplina === disciplina);
    }
    if (resultado !== "todos") {
      datosFiltrados = datosFiltrados.filter(d => d.resultadoFinal === resultado);
    }
    
    onFiltrar(datosFiltrados);
  };

  const cambiarNivel = (valor) => {
    setFiltroNivel(valor);
    aplicarFiltros(valor, filtroDisciplina, filtroResultado);
  };

  const cambiarDisciplina = (valor) => {
    setFiltroDisciplina(valor);
    aplicarFiltros(filtroNivel, valor, filtroResultado);
  };

  const cambiarResultado = (valor) => {
    setFiltroResultado(valor);
    aplicarFiltros(filtroNivel, filtroDisciplina, valor);
  };

  const limpiarFiltros = () => {
    setFiltroNivel("todos");
    setFiltroDisciplina("todos");
    setFiltroResultado("todos");
    onFiltrar(datos);
  };

  const hayFiltrosActivos = filtroNivel !== "todos" || filtroDisciplina !== "todos" || filtroResultado !== "todos";

  return (
    <div className="filtros-grafico">
      <button 
        className={`btn-filtros ${abierto ? 'activo' : ''} ${hayFiltrosActivos ? 'con-filtros' : ''}`}
        onClick={() => setAbierto(!abierto)}
      >
        <Filter size={16} />
        <span>Filtrar</span>
        {hayFiltrosActivos && <span className="badge-filtros">!</span>}
        <ChevronDown size={14} className={`chevron ${abierto ? 'rotado' : ''}`} />
      </button>

      {abierto && (
        <div className="panel-filtros">
          {mostrarNivel && (
            <div className="filtro-grupo">
              <label>Nivel Educativo</label>
              <select value={filtroNivel} onChange={(e) => cambiarNivel(e.target.value)}>
                <option value="todos">Todos los niveles</option>
                {niveles.map(nivel => (
                  <option key={nivel} value={nivel}>{nivel}</option>
                ))}
              </select>
            </div>
          )}

          {mostrarDisciplina && (
            <div className="filtro-grupo">
              <label>Disciplina</label>
              <select value={filtroDisciplina} onChange={(e) => cambiarDisciplina(e.target.value)}>
                <option value="todos">Todas las disciplinas</option>
                {disciplinas.map(disc => (
                  <option key={disc} value={disc}>{disc}</option>
                ))}
              </select>
            </div>
          )}

          {mostrarResultado && (
            <div className="filtro-grupo">
              <label>Resultado</label>
              <select value={filtroResultado} onChange={(e) => cambiarResultado(e.target.value)}>
                <option value="todos">Todos los resultados</option>
                {resultados.map(res => (
                  <option key={res} value={res}>{res}</option>
                ))}
              </select>
            </div>
          )}

          {hayFiltrosActivos && (
            <button className="btn-limpiar" onClick={limpiarFiltros}>
              <X size={14} />
              Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FiltrosGrafico;
