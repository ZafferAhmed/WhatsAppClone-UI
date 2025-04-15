import { io } from "socket.io-client";

const socket = io("http://18.144.169.213:4000", {
  transports: ["websocket"],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;