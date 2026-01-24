import * as d3 from 'd3';

// Cache en memoria para evitar recargas
let datosCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Cache en sessionStorage para persistir entre navegaciones
const STORAGE_KEY = 'eduia_datos_cache';
const STORAGE_TIMESTAMP_KEY = 'eduia_cache_timestamp';

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