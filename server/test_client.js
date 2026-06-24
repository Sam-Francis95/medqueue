const io = require("socket.io-client");
const socket = io("http://localhost:4000");

socket.on("connect", () => {
  console.log("Connected to server!");
  socket.emit("patient:add", { name: "Test User" }, (res) => {
    console.log("Callback received:", res);
    process.exit(0);
  });
});

socket.on("connect_error", (err) => {
  console.log("Connection error:", err.message);
  process.exit(1);
});
