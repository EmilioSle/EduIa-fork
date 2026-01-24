import * as d3 from 'd3';

// Cache en memoria para evitar recargas
let datosCache = null;
let agregacionesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos (aumentado)

// Cache en sessionStorage para persistir entre navegaciones
const STORAGE_KEY = 'eduia_datos_cache';
const STORAGE_TIMESTAMP_KEY = 'eduia_cache_timestamp';
const STORAGE_AGREGACIONES_KEY = 'eduia_agregaciones_cache';

/**
 * Pre-calcula agregaciones comunes para evitar recálculos en cada gráfico
 */
const calcularAgregaciones = (datos) => {
    console.log('⚡ Pre-calculando agregaciones...');
    const inicio = performance.now();

    const agregaciones = {
        // Por nivel educativo
        porNivel: d3.rollup(
            datos,
            v => ({
                cantidad: v.length,
                satisfaccionPromedio: d3.mean(v, d => d.satisfaccion),
                duracionPromedio: d3.mean(v, d => d.duracionMinutos),
                reutilizacion: (v.filter(d => d.usoPosterior === "Sí").length / v.length * 100),
            }),
            d => d.nivelEducativo
        ),
        // Por tipo de tarea
        porTarea: d3.rollup(
            datos,
            v => ({
                cantidad: v.length,
                satisfaccionPromedio: d3.mean(v, d => d.satisfaccion),
                duracionPromedio: d3.mean(v, d => d.duracionMinutos),
            }),
            d => d.tipoTarea
        ),
        // Por resultado
        porResultado: d3.rollup(
            datos,
            v => ({
                cantidad: v.length,
                satisfaccionPromedio: d3.mean(v, d => d.satisfaccion),
            }),
            d => d.resultadoFinal
        ),
        // Valores únicos (para filtros)
        nivelesUnicos: [...new Set(datos.map(d => d.nivelEducativo))],
        tareasUnicas: [...new Set(datos.map(d => d.tipoTarea))],
        resultadosUnicos: [...new Set(datos.map(d => d.resultadoFinal))],
        // Estadísticas generales
        stats: {
            total: datos.length,
            satisfaccionPromedio: d3.mean(datos, d => d.satisfaccion),
            duracionPromedio: d3.mean(datos, d => d.duracionMinutos),
            porcentajeReutilizacion: (datos.filter(d => d.usoPosterior === "Sí").length / datos.length * 100),
        }
    };

    console.log(`✅ Agregaciones calculadas en ${(performance.now() - inicio).toFixed(2)}ms`);
    return agregaciones;
};

export const cargarDatos = async () => {
    // 1. Intentar obtener de memoria (más rápido)
    if (datosCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
        console.log('✅ Datos cargados desde cache de memoria');
        return datosCache;
    }

    // 2. Intentar obtener de sessionStorage
    try {
        const storedData = sessionStorage.getItem(STORAGE_KEY);
        const storedTimestamp = sessionStorage.getItem(STORAGE_TIMESTAMP_KEY);
        
        if (storedData && storedTimestamp) {
            const timestamp = parseInt(storedTimestamp, 10);
            if (Date.now() - timestamp < CACHE_DURATION) {
                datosCache = JSON.parse(storedData);
                cacheTimestamp = timestamp;
                // Recalcular agregaciones si no están en memoria
                if (!agregacionesCache) {
                    agregacionesCache = calcularAgregaciones(datosCache);
                }
                console.log('✅ Datos cargados desde sessionStorage');
                return datosCache;
            }
        }
    } catch (e) {
        // sessionStorage no disponible o error de parsing
        console.warn('sessionStorage no disponible:', e);
    }

    // 3. Cargar desde el servidor
    console.log('📡 Cargando datos desde servidor...');
    const datos = await d3.csv(
        "/datos_limpios.csv",
        d3.autoType
    );

    // Pre-calcular agregaciones
    agregacionesCache = calcularAgregaciones(datos);

    // Guardar en cache de memoria
    datosCache = datos;
    cacheTimestamp = Date.now();

    // Guardar en sessionStorage
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
        sessionStorage.setItem(STORAGE_TIMESTAMP_KEY, cacheTimestamp.toString());
        console.log('✅ Datos guardados en sessionStorage');
    } catch (e) {
        console.warn('No se pudo guardar en sessionStorage:', e);
    }

    return datos;
};

/**
 * Obtiene las agregaciones pre-calculadas
 */
export const obtenerAgregaciones = () => {
    if (!agregacionesCache && datosCache) {
        agregacionesCache = calcularAgregaciones(datosCache);
    }
    return agregacionesCache;
};

// Función para limpiar cache manualmente si es necesario
export const limpiarCache = () => {
    datosCache = null;
    cacheTimestamp = null;
    try {
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_TIMESTAMP_KEY);
    } catch (e) {
        // Ignorar errores
    }
};