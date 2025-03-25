/* eslint-disable @typescript-eslint/no-explicit-any */
import ReactDOM from "react-dom/server";
import React, { useState, useEffect, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import { useMapEvents } from "react-leaflet/hooks";
import { LatLngBounds, LatLng, divIcon } from "leaflet";
import { IoIosAirplane } from "react-icons/io";

export default function FlightMap() {
  const [flightsDisplayed, setFlightsDisplayed] = useState<any[]>([]);
  const [currentBounds, setCurrentBounds] = useState<LatLngBounds | null>(null);
  const [message, setMessage] = useState("");

  const flightsRef = useRef<Map<string, any>>(new Map());
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const map = useMapEvents({
    moveend: () => {
      if (map) setCurrentBounds(map.getBounds());
    },
  });

  useEffect(() => {
    const newSocket = new WebSocket("ws://127.0.0.1:8000/ws/planes/");

    newSocket.addEventListener("open", () => {
      console.log("WebSocket connection established");
    });

    newSocket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      const date = new Date();
      console.log(date.getSeconds())
      if (data.type === "new_command") {
        console.log("New Command:", data.data);
      }

      if (data && Array.isArray(data.planes)) {
        data.planes.forEach((newPlane: any) => {
          flightsRef.current.set(newPlane.plane_id, newPlane);
        });

        if (currentBounds) {
          setFlightsDisplayed(
            Array.from(flightsRef.current.values()).filter((flight) =>
              currentBounds.contains(
                new LatLng(flight.location.latitude, flight.location.longitude)
              )
            )
          );
        }
      }
    });

    newSocket.addEventListener("close", () => {
      console.log("WebSocket connection closed");
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [currentBounds]);

  const flightIcon = divIcon({
    className: "flight-icon",
    html: ReactDOM.renderToString(
      React.createElement(IoIosAirplane, { size: "33", color: "#CF9603" })
    ),
  });

  const handleSendCommand = (flight: any) => {
    if (socket) {
      const dataToSend = {
        plane_id: flight.plane_id,
        pilot_id: flight.pilot_id,
        drop_off_location: flight.location,
        message: message,
      };
      socket.send(JSON.stringify({ type: "send_command", data: dataToSend }));
    }
  };

  return (
    <>
      {flightsDisplayed.map((flight) => (
        <Marker
          key={flight.plane_id}
          position={[flight.location.latitude, flight.location.longitude]}
          icon={flightIcon}
        >
          <Popup autoClose={true}>
            <div>
              <p>
                <strong>Plane ID: </strong>
                {flight.plane_id}
              </p>
              <p>
                <strong>Pilot ID: </strong>
                {flight.pilot_id}
              </p>
              <p>
                <strong>Position: </strong>
                {flight.location.latitude.toFixed(3)},{" "}
                {flight.location.longitude.toFixed(3)}
              </p>
              <div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter command message"
                />
                <button onClick={() => handleSendCommand(flight)}>
                  Send Command to Vehicle
                </button>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
