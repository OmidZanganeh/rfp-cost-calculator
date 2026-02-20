'use client';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

interface MarkerData {
  coords: [number, number];
  correct: boolean;
}

interface Props {
  onMapClick: (lng: number, lat: number) => void;
  markers: MarkerData[];
  targetCoords: [number, number] | null;
  disabled: boolean;
}

export default function CoordSnapMap({ onMapClick, markers, targetCoords, disabled }: Props) {
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (disabled) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const lng = (x / rect.width) * 360 - 180;
    const lat = 90 - (y / rect.height) * 180;
    onMapClick(lng, lat);
  };

  return (
    <ComposableMap
      projection="geoEquirectangular"
      style={{ width: '100%', height: 'auto', cursor: disabled ? 'default' : 'crosshair' }}
      onClick={handleClick}
    >
      <Geographies geography={GEO_URL}>
        {({ geographies }) =>
          geographies.map(geo => (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              style={{
                default: { fill: 'var(--paper-dark)', stroke: 'var(--border-light)', strokeWidth: 0.3, outline: 'none' },
                hover:   { fill: 'var(--paper-dark)', stroke: 'var(--border-light)', strokeWidth: 0.3, outline: 'none' },
                pressed: { fill: 'var(--paper-dark)', stroke: 'var(--border-light)', strokeWidth: 0.3, outline: 'none' },
              }}
            />
          ))
        }
      </Geographies>

      {/* Target city marker (shown after click) */}
      {targetCoords && (
        <Marker coordinates={targetCoords}>
          <circle r={5} fill="#16a34a" stroke="white" strokeWidth={1.5} />
        </Marker>
      )}

      {/* Player click markers */}
      {markers.map((m, i) => (
        <Marker key={i} coordinates={m.coords}>
          <circle r={4} fill={m.correct ? '#16a34a' : '#dc2626'} stroke="white" strokeWidth={1} />
        </Marker>
      ))}
    </ComposableMap>
  );
}
