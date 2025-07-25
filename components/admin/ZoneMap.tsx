import React, { useRef } from "react";
import { MapContainer, TileLayer, useMap, Polygon } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import 'leaflet-draw';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { Polygon as LeafletPolygon } from "react-leaflet";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow
});
L.Marker.prototype.options.icon = DefaultIcon;

const rosarioCenter: [number, number] = [-32.9587, -60.6939];

// Nuevo componente controlador para lógica de Leaflet
interface ZoneMapControllerProps {
  onPolygonDrawn?: (coordinates: any) => void;
}

const ZoneMapController: React.FC<ZoneMapControllerProps> = ({ onPolygonDrawn }) => {
  const map = useMap();
  const drawnItemsRef = React.useRef<L.FeatureGroup | null>(null);
  const drawControlRef = React.useRef<L.Control.Draw | null>(null);

  React.useEffect(() => {
    // Limpieza previa
    if (drawnItemsRef.current) {
      map.removeLayer(drawnItemsRef.current);
    }
    if (drawControlRef.current) {
      map.removeControl(drawControlRef.current);
    }
    // Crea el FeatureGroup y añádelo al mapa
    const drawnItems = new L.FeatureGroup();
    drawnItemsRef.current = drawnItems;
    map.addLayer(drawnItems);

    // Control de dibujo
    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItems,
      },
      draw: {
        polygon: {},
        marker: false,
        polyline: false,
        rectangle: false,
        circle: false,
        circlemarker: false,
      },
    });
    drawControlRef.current = drawControl;
    map.addControl(drawControl);

    // Evento cuando se crea un polígono
    const onCreated = function (event: any) {
      const layer = event.layer;
      drawnItems.addLayer(layer);
      if (layer instanceof L.Polygon) {
        const latlngs = layer.getLatLngs();
        // Notifica al padre
        if (onPolygonDrawn) {
          onPolygonDrawn(latlngs);
        }
      }
    };
    map.on(L.Draw.Event.CREATED, onCreated);

    // Limpieza al desmontar
    return () => {
      map.off(L.Draw.Event.CREATED, onCreated);
      if (drawnItemsRef.current) {
        map.removeLayer(drawnItemsRef.current);
      }
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
      }
    };
  }, [map, onPolygonDrawn]);

  return null;
};

interface ZoneMapProps {
  onPolygonDrawn?: (coordinates: any) => void;
  polygonCoords?: any;
}

const ZoneMap: React.FC<ZoneMapProps> = ({ onPolygonDrawn, polygonCoords }) => {
  return (
    <div className="w-full h-96 rounded overflow-hidden">
      <MapContainer
        center={rosarioCenter}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {/* Mostrar polígono si polygonCoords es GeoJSON Polygon */}
        {polygonCoords && polygonCoords.type === 'Polygon' && (
          <LeafletPolygon
            positions={polygonCoords.coordinates[0].map(([lng, lat]: [number, number]) => [lat, lng])}
            pathOptions={{ color: 'blue', weight: 3, fillOpacity: 0.2 }}
          />
        )}
        <ZoneMapController onPolygonDrawn={onPolygonDrawn} />
      </MapContainer>
    </div>
  );
};

export default ZoneMap; 