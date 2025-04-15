import { io } from "socket.io-client";
export const socket = io("http://18.144.169.213:4000", {
  transports: ["websocket"],
  withCredentials: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
