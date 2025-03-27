/* eslint-disable @typescript-eslint/no-explicit-any */
import ReactDOM from "react-dom/server";
import React, { useState, useEffect, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import { useMapEvents } from "react-leaflet/hooks";
import { LatLngBounds, LatLng, divIcon } from "leaflet";
import { IoIosAirplane } from "react-icons/io";
import { FaMapMarkerAlt } from "react-icons/fa";

export default function FlightMap() {
  const [flightsDisplayed, setFlightsDisplayed] = useState<any[]>([]);
  const [currentBounds, setCurrentBounds] = useState<LatLngBounds | null>(
    new LatLngBounds(
      new LatLng(35.36217605914681, 24.455566406250004), // Southwest corner
      new LatLng(42.45588764197166, 45.54931640625001) // Northeast corner
    )
  );
  const [commandsDisplayed, setCommandsDisplayed] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const flightsRef = useRef<Map<string, any>>(new Map());
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const ws = useRef(socket);

  const map = useMapEvents({
    moveend: () => {
      if (map) setCurrentBounds(map.getBounds());
    },
  });

  useEffect(() => {
    ws.current = new WebSocket(import.meta.env.VITE_WS_PLANE_CONSUMER);

    ws.current.onopen = () => console.log("ws opened");
    ws.current.onclose = () => console.log("ws closed");

    setSocket(ws.current);

    return () => {
      if (ws.current != null) {
        ws.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!ws.current) return;

    ws.current.onmessage = (event: any) => {
      const data = JSON.parse(event.data);

      if (data && Array.isArray(data.commands)) {
        const filteredCommands = data.commands.filter((cmd: any) =>
          currentBounds?.contains(
            new LatLng(cmd.location.latitude, cmd.location.longitude)
          )
        );
        setCommandsDisplayed(filteredCommands);
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
    };
  }, [currentBounds]);

  const flightIcon = divIcon({
    className: "flight-icon",
    html: ReactDOM.renderToString(
      React.createElement(IoIosAirplane, { size: "33", color: "#CF9603" })
    ),
  });

  const getCommandIcon = (status: string) => {
    let color = "#000"; // Default
    if (status === "accepted") color = "green";
    else if (status === "rejected") color = "red";
    else if (status === "pending") color = "blue"; // Optional status

    return divIcon({
      className: "command-icon",
      html: ReactDOM.renderToString(
        React.createElement(FaMapMarkerAlt, { size: "25", color })
      ),
    });
  };

  const handleSendCommand = (flight: any) => {
    if (socket) {
      const dataToSend = {
        plane_id: flight.plane_id,
        pilot_id: flight.pilot_id,
        drop_off_location: flight.location,
        message: message,
      };
      socket.send(JSON.stringify({ type: "send_command", data: dataToSend }));
      setMessage("");
    }
  };

  return (
    <>
      {flightsDisplayed.map((flight) => (
        <Marker
          key={flight.plane_id}
          position={[flight.location.latitude, flight.location.longitude]}
          icon={flightIcon}
          autoPan={true}
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
      {/* Command Markers */}
      {commandsDisplayed.map((command) => (
        <Marker
          key={command.id}
          position={[command.location.latitude, command.location.longitude]}
          icon={getCommandIcon(command.status)}
          autoPan={true}
        >
          <Popup autoClose={true}>
            <div>
              <p>
                <strong>Command ID: </strong>
                {command.id}
              </p>
              <p>
                <strong>Plane ID: </strong>
                {command.plane_id}
              </p>
              <p>
                <strong>Pilot ID: </strong>
                {command.pilot_id}
              </p>
              <p>
                <strong>Message: </strong>
                {command.message}
              </p>
              <p>
                <strong>Status: </strong>
                <span>{command.status}</span>
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
