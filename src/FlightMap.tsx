/* eslint-disable @typescript-eslint/no-explicit-any */
import ReactDOM from "react-dom/server";
import React, { useState, useEffect } from "react";
import { Marker, Popup } from "react-leaflet";
import { useMapEvents } from "react-leaflet/hooks";
import { LatLngBounds, divIcon } from "leaflet";
import { IoIosAirplane } from "react-icons/io";
import testdata from "./testdata.json"
// import axios from "axios";

export default function FlightMap() {
  const [flights, setFlights] = useState<any[][]>([]);
  const [flightsDisplayed, setFlightsDisplayed] = useState<any[][]>([]);
  const [currentBounds, setCurrentBounds] = useState<LatLngBounds | null>(null);

  const map = useMapEvents({
    moveend: () => {
      if (map) setCurrentBounds(map.getBounds());
    },
  });

  const fetchFlights = async () => {
    try {
      const response = testdata;
      setFlights(response.states.slice(0, 5000));
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchFlights();
    if (map) {
      setCurrentBounds(map.getBounds());
    }
    const intervalId = setInterval(fetchFlights, 1000000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (flights.length && currentBounds) {
      const flightsWithinBounds = flights.filter((flight) => {
        if (!flight[5] || !flight[6]) return false;
        return currentBounds.contains([flight[6], flight[5]]);
      });
      setFlightsDisplayed(flightsWithinBounds);
    }
  }, [currentBounds, flights]);

  const flightIcon = divIcon({
    className: "flight-icon",
    html: ReactDOM.renderToString(
      React.createElement(IoIosAirplane, { size: "33", color: "#CF9603" })
    ),
  });

  return (
    <>
      {flightsDisplayed.map((flight) => {
        const key = flight[0];
        const position: [number, number] | null =
          flight[6] && flight[5] ? [flight[6], flight[5]] : null;

        if (!position) return null;

        return (
          <Marker key={key} position={position} icon={flightIcon}>
            <Popup autoClose={true}>
              <div>
                <p>
                  <strong>ICAO24: </strong>
                  {flight[0]}
                </p>
                <p>
                  <strong>Callsign: </strong>
                  {flight[1]}
                </p>
                <p>
                  <strong>Origin: </strong>
                  {flight[2]}
                </p>
                <p>
                  <strong>Position: </strong>
                  {position.join(", ")}
                </p>
                <p>
                  <strong>Altitude: </strong>
                  {flight[7] ? flight[7] : 0}
                </p>
                <p>
                  <strong>Velocity: </strong>
                  {flight[9]}
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
