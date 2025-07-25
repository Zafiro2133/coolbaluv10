import React from "react";
// Importa el componente del mapa (a crear)
import ZoneMap from "./ZoneMap";

const ZoneManager: React.FC = () => {
  // Handler para agregar nueva zona (placeholder)
  const handleAddZone = () => {
    // Aquí irá la lógica para agregar una nueva zona
    alert('Funcionalidad para agregar nueva zona aún no implementada.');
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestión de Zonas No Cubiertas</h1>
      {/* Botón para agregar nueva zona */}
      <button
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded"
        onClick={handleAddZone}
        type="button"
      >
        Agregar nueva zona
      </button>
      {/* Mapa interactivo para dibujar zonas */}
      <ZoneMap />
      {/* Placeholder para lista de zonas existentes y acciones CRUD */}
      <div className="mt-6 text-gray-500 italic">
        Próximamente: lista de zonas y acciones CRUD aquí.
      </div>
    </div>
  );
};

export default ZoneManager; 