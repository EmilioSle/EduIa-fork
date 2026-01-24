import { useState, useEffect, useRef } from 'react';

/**
 * Hook para renderizar componentes pesados solo cuando son visibles
 * Usa Intersection Observer para detectar visibilidad
 */
export const useLazyRender = (options = {}) => {
    const { 
        threshold = 0.1,  // Cuánto debe ser visible para activar (10%)
        rootMargin = '100px', // Margen extra para pre-cargar
        triggerOnce = true // Solo activar una vez
    } = options;

    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [hasBeenVisible, setHasBeenVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        // Si ya fue visible y triggerOnce, no observar más
        if (hasBeenVisible && triggerOnce) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                const visible = entry.isIntersecting;
                setIsVisible(visible);
                
                if (visible && triggerOnce) {
                    setHasBeenVisible(true);
                    observer.disconnect();
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, [threshold, rootMargin, triggerOnce, hasBeenVisible]);

    return { 
        ref, 
        isVisible: triggerOnce ? hasBeenVisible : isVisible,
        hasBeenVisible 
    };
};

/**
 * Hook para diferir renderizado de componentes pesados
 * Renderiza un placeholder hasta que el componente sea visible
 */
export const useDeferredRender = (delay = 0) => {
    const [shouldRender, setShouldRender] = useState(delay === 0);

    useEffect(() => {
        if (delay === 0) return;

        // Usar requestIdleCallback si está disponible
        if ('requestIdleCallback' in window) {
            const id = window.requestIdleCallback(() => {
                setShouldRender(true);
            }, { timeout: delay });
            return () => window.cancelIdleCallback(id);
        } else {
            const timeout = setTimeout(() => {
                setShouldRender(true);
            }, delay);
            return () => clearTimeout(timeout);
        }
    }, [delay]);

    return shouldRender;
};

export default useLazyRender;
