import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    process.env.FRONTEND_ORIGIN || ""   // e.g. https://your-frontend.vercel.app
  ].filter(Boolean),
  methods: ["GET", "POST"],
}));

app.get("/", (_, res) => res.send("✅ Signaling server running"));

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      process.env.FRONTEND_ORIGIN || ""
    ].filter(Boolean),
    methods: ["GET", "POST"],
  },
  // keep polling fallback; some hosts/proxies need it
  transports: ["websocket", "polling"],
});

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("join-room", (roomId, userName) => {
    if (socket.data.bound) return;     // prevent re-binding on duplicate joins
    socket.data.bound = true;
    socket.data.roomId = roomId;
    socket.data.userName = userName || "User";

    socket.join(roomId);
    socket.to(roomId).emit("user-connected", { id: socket.id, userName: socket.data.userName });
  });

  // Chat (no echo to sender)
  socket.on("send-message", ({ message }) => {
    const roomId = socket.data.roomId;
    if (!roomId || !message) return;
    io.to(roomId).except(socket.id).emit("receive-message", {
      message,
      userName: socket.data.userName || "User",
      id: socket.id,
    });
  });

  // Signaling
  socket.on("offer", ({ offer, from }) => {
    const roomId = socket.data.roomId;
    if (roomId) socket.to(roomId).emit("offer", { offer, from });
  });
  socket.on("answer", ({ answer, from }) => {
    const roomId = socket.data.roomId;
    if (roomId) socket.to(roomId).emit("answer", { answer, from });
  });
  socket.on("ice-candidate", ({ candidate, from }) => {
    const roomId = socket.data.roomId;
    if (roomId) socket.to(roomId).emit("ice-candidate", { candidate, from });
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    if (roomId) socket.to(roomId).emit("user-disconnected", socket.id);
    console.log("🔴 Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Signaling server on :${PORT}`);
});
