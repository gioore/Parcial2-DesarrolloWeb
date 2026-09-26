import http from "node:http";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import { config } from "./config.js";
import { initializeDatabase } from "./db/schema.js";
import { authRouter } from "./routes/auth.js";
import { createBidsRouter } from "./routes/bids.js";
import { createDemoRouters, seedDemoStore } from "./routes/demo.js";
import { vehiclesRouter } from "./routes/vehicles.js";
import { configureSocket } from "./realtime/socket.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.clientUrl,
    credentials: true
  }
});

app.use(
  cors({
    origin: config.clientUrl,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "copart-umg-backend" });
});

configureSocket(io);

function mountSqlRoutes() {
  app.use("/api/auth", authRouter);
  app.use("/api/vehicles", vehiclesRouter);
  app.use("/api/bids", createBidsRouter(io));
}

async function mountDemoRoutes() {
  await seedDemoStore();
  const demo = createDemoRouters(express, io);
  app.use("/api/auth", demo.authRouter);
  app.use("/api/vehicles", demo.vehiclesRouter);
  app.use("/api/bids", demo.bidsRouter);
}

async function start() {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await initializeDatabase();
      mountSqlRoutes();
      console.log("Base de datos SQL Server activa con tablas Copart7082.");
      break;
    } catch (error) {
      console.error(`No se pudo inicializar SQL Server. Intento ${attempt}/${maxAttempts}.`, error.message);
      if (attempt === maxAttempts) {
        if (process.env.NODE_ENV === "production") {
          throw new Error("No se pudo conectar a SQL Server en producción.");
        }
        console.warn("SQL Server no esta disponible. Iniciando modo demo en memoria.");
        await mountDemoRoutes();
      } else {
        await new Promise((resolve) => setTimeout(resolve, attempt * 3000));
      }
    }
  }

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ message: "Error interno del servidor." });
  });

  server.listen(config.port, () => {
    console.log(`API escuchando en http://localhost:${config.port}`);
  });
}

start();
