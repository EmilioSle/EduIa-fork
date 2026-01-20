import { useEffect, useState } from 'react';

/**
 * Hook para detectar el tamaño de la ventana y calcular dimensiones responsivas
 */
export const useResponsiveChart = (containerRef, options = {}) => {
  const [dimensions, setDimensions] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const calculateDimensions = () => {
      const containerWidth = containerRef.current.clientWidth;
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

      // Márgenes por defecto basados en el tamaño de pantalla
      const defaultMargins = isMobile 
        ? { top: 30, right: 20, bottom: 80, left: 50 }
        : isTablet
        ? { top: 35, right: 30, bottom: 90, left: 60 }
        : { top: 40, right: 40, bottom: 100, left: 80 };

      const margin = { ...defaultMargins, ...options.margins };

      // Calcular width y height basados en el contenedor
      const width = Math.max(300, containerWidth - 40) - margin.left - margin.right;
      const aspectRatio = options.aspectRatio || (isMobile ? 1.1 : isTablet ? 1.3 : 1.5);
      const height = Math.min(
        options.maxHeight || (isMobile ? 350 : isTablet ? 400 : 450),
        width / aspectRatio
      );

      setDimensions({
        width,
        height,
        margin,
        isMobile,
        isTablet,
        fontSize: isMobile ? 11 : isTablet ? 12 : 13,
        titleFontSize: isMobile ? 14 : isTablet ? 16 : 18,
        containerWidth
      });
    };

    // Calcular dimensiones iniciales
    calculateDimensions();

    // Recalcular en resize con debounce
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(calculateDimensions, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [containerRef, options.margins, options.aspectRatio, options.maxHeight]);

  return dimensions;
};

/**
 * Función helper para crear SVG responsivo
 */
export const createResponsiveSVG = (selection, dimensions) => {
  const { width, height, margin } = dimensions;
  
  return selection
    .append("svg")
    .attr("width", "100%")
    .attr("height", height + margin.top + margin.bottom)
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("max-width", "100%")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
};
