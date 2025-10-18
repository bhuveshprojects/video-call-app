import { io } from "socket.io-client";

// In production, set this to your Render/Railway/Heroku URL, e.g. wss://my-signal.onrender.com
const PROD_URL = import.meta.env.VITE_SOCKET_URL;

// Local fallback keeps dev working automatically
const fallback = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname}:5000`;

const socket = io(PROD_URL || fallback, {
  transports: ["websocket", "polling"],
  withCredentials: false,
});

export default socket;
