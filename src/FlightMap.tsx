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
  const flightsRef = useRef<Map<string, any>>(new Map()); 
  const [message, setMessage] = useState<string>("");
  const [selectedFlight, setSelectedFlight] = useState<any | null>(null);

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

    return () => {
      newSocket.close();
    };
  }, [currentBounds]); 

  const sendNotification = async () => {
    if (!selectedFlight) return;

    const payload = {
      plane_id: selectedFlight.plane_id,
      latitude: selectedFlight.location.latitude,
      longitude: selectedFlight.location.longitude,
      message,
    };

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/send_notification/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        alert("Notification sent successfully!");
        setMessage("");
      } else {
        alert("Failed to send notification.");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      alert("Error sending notification.");
    }
  };

  const flightIcon = divIcon({
    className: "flight-icon",
    html: ReactDOM.renderToString(
      React.createElement(IoIosAirplane, { size: "33", color: "#CF9603" })
    ),
  });

  return (
    <>
      {flightsDisplayed.map((flight) => (
        <Marker
          key={flight.plane_id}
          position={[flight.location.latitude, flight.location.longitude]}
          icon={flightIcon}
          eventHandlers={{ click: () => setSelectedFlight(flight) }}
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
              <input
                type="text"
                placeholder="Enter message"
                value={message}
                onChange={(e: any) => setMessage(e.target.value)}
              />
              <button onClick={sendNotification} className="mt-2">
                Send Notification
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
