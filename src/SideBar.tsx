/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { MdOutlineCrisisAlert } from "react-icons/md";
import { SlPlane } from "react-icons/sl";

interface SidebarProps {
  item: any;
  onClose: () => void;
  onSendCommand: (flight: any, message: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ item, onClose, onSendCommand }) => {
  const [message, setMessage] = useState("");

  if (!item) return null;

  return (
    <div className="sidebar">
      {item.type === "flight" ? (
        <>
          <div className="sidebar-title">
            <h2>Flight Details</h2>
            <button className="close-btn" onClick={onClose}>
              ✖
            </button>
          </div>
          <SlPlane className="sidebar-icon" />
          <p>
            <strong>Pilot ID:</strong> {item.data.pilot_id}
          </p>
          <p>
            <strong>Plane ID:</strong> {item.data.plane_id}
          </p>
          <p>
            <strong>Position:</strong> {item.data.location.latitude.toFixed(3)},
            {item.data.location.longitude.toFixed(3)}
          </p>

          {/* Command Input */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter command message"
          />
          <button
          className="command-button"
            onClick={() => {
              onSendCommand(item.data, message);
              setMessage(""); // Clear message after sending
            }}
          >
            Send Command to Vehicle
          </button>
        </>
      ) : (
        <>
          <div className="sidebar-title">
            <h2>Command Details</h2>
            <button className="close-btn" onClick={onClose}>
              ✖
            </button>
          </div>
          <MdOutlineCrisisAlert className="sidebar-icon" />
          <p>
            <strong>Command ID:</strong> {item.data.id}
          </p>
          <p>
            <strong>Plane ID:</strong> {item.data.plane_id}
          </p>
          <p>
            <strong>Pilot ID:</strong> {item.data.pilot_id}
          </p>
          <p>
            <strong>Message:</strong> {item.data.message}
          </p>
          <p>
            <strong>Status:</strong> {item.data.status}
          </p>
        </>
      )}
    </div>
  );
};

export default Sidebar;
