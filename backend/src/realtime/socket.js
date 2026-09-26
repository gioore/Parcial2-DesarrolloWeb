export function configureSocket(io) {
  io.on("connection", (socket) => {
    socket.on("vehicle:join", (vehicleId) => {
      socket.join(`vehicle:${vehicleId}`);
    });

    socket.on("vehicle:leave", (vehicleId) => {
      socket.leave(`vehicle:${vehicleId}`);
    });
  });
}
