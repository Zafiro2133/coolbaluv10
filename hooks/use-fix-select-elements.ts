import { useEffect } from 'react';

// Hook para corregir elementos select que no tienen id o name
export const useFixSelectElements = () => {
  useEffect(() => {
    const fixSelectElements = () => {
      // Buscar todos los elementos select en el documento
      const selectElements = document.querySelectorAll('select');
      selectElements.forEach((select, index) => {
        if (!select.id && !select.name) {
          // Generar un id único basado en el contexto
          const context = select.closest('[data-chart], .leaflet-container, .map-container')?.className || 'global';
          const uniqueId = `${context}-select-${index}-${Date.now()}`;
          select.id = uniqueId;
          select.name = uniqueId;
        }
      });
    };

    // Ejecutar inmediatamente
    fixSelectElements();

    // Configurar un observer para detectar cambios en el DOM
    const observer = new MutationObserver((mutations) => {
      let shouldFix = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.tagName === 'SELECT' || element.querySelector('select')) {
                shouldFix = true;
              }
            }
          });
        }
      });
      
      if (shouldFix) {
        // Usar setTimeout para asegurar que el DOM esté completamente actualizado
        setTimeout(fixSelectElements, 50);
      }
    });

    // Observar cambios en el documento
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Limpiar observer al desmontar
    return () => {
      observer.disconnect();
    };
  }, []);
}; 