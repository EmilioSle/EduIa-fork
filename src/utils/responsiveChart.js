/**
 * Calcula dimensiones responsivas para gráficos D3
 * @param {HTMLElement} container - Contenedor del gráfico
 * @param {Object} options - Opciones de configuración
 * @returns {Object} - Dimensiones y márgenes calculados
 */
export const calcularDimensionesResponsivas = (container, options = {}) => {
  const containerWidth = container.clientWidth;
  const isMobile = containerWidth < 768;
  const isTablet = containerWidth >= 768 && containerWidth < 1024;
  
  // Márgenes por defecto basados en el tamaño de pantalla
  const defaultMargins = isMobile 
    ? { top: 30, right: 20, bottom: 80, left: 50 }
    : isTablet
    ? { top: 35, right: 30, bottom: 90, left: 60 }
    : { top: 40, right: 40, bottom: 100, left: 80 };
  
  const margin = { ...defaultMargins, ...options.margins };
  
  // Calcular width y height basados en el contenedor
  const width = Math.max(300, containerWidth - 40) - margin.left - margin.right;
  const height = options.aspectRatio 
    ? width / options.aspectRatio
    : isMobile 
      ? Math.min(350, width * 0.9)
      : isTablet
        ? Math.min(400, width * 0.8)
        : Math.min(450, width * 0.7);
  
  return {
    width,
    height,
    margin,
    isMobile,
    isTablet,
    fontSize: isMobile ? 11 : isTablet ? 12 : 13,
    titleFontSize: isMobile ? 14 : isTablet ? 16 : 18
  };
};

/**
 * Configura un SVG responsivo
 * @param {Object} selection - Selección D3
 * @param {Object} dimensions - Dimensiones del gráfico
 */
export const configurarSVGResponsivo = (selection, dimensions) => {
  const { width, height, margin } = dimensions;
  
  return selection
    .append("svg")
    .attr("width", "100%")
    .attr("height", height + margin.top + margin.bottom)
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
};
