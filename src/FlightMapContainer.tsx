import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import FlightMap from "./FlightMap";
import { LatLngBoundsLiteral } from "leaflet";

export default function FlightMapContainer() {
  const mapBounds: LatLngBoundsLiteral = [
    [-90, -180],
    [90, 180],
  ];

  return (
    <MapContainer
      center={[39, 35]}
      zoom={7}
      minZoom={6}
      scrollWheelZoom={true}
      style={{ width: "100%", height: "100vh" }}
      maxBounds={mapBounds}
      maxBoundsViscosity={1.0}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlightMap />
    </MapContainer>
  );
}
