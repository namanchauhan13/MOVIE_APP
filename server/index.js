const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { ExpressPeerServer } = require("peer");

const app = express();
app.use(cors({
  origin:
"https://couples-movie-app.vercel.app"
,  // your frontend
  methods: ["GET", "POST"]
}));
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Room-password store
const rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", ({ room, password, peerId }) => {
    if (!rooms[room]) {
      rooms[room] = password;
      socket.join(room);
      socket.emit("joined", { success: true });
    } else if (rooms[room] === password) {
      socket.join(room);
      socket.emit("joined", { success: true });
    } else {
      socket.emit("joined", { success: false, message: "Incorrect password" });
    }
    // Notify others
    socket.to(room).emit("user-connected", peerId);
  });

  socket.on("sync-play", (room) => {
    socket.to(room).emit("sync-play");
  });
  socket.on("sync-pause", (room) => {
    socket.to(room).emit("sync-pause");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const peerServer = ExpressPeerServer(server, { path: "/peerjs" });
app.use("/peerjs", peerServer);

server.listen(5000, () => {
  console.log("Server listening on port 5000");
});
