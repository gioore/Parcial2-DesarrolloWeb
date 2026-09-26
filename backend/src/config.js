import dotenv from "dotenv";

dotenv.config();

const required = ["JWT_SECRET", "DB_USER", "DB_PASSWORD", "DB_SERVER", "DB_DATABASE"];
if (process.env.NODE_ENV === "production") {
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Faltan variables de entorno obligatorias: ${missing.join(", ")}`);
  }
}

export const config = {
  port: Number(process.env.PORT || 4000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "dev-only-secret-change-me",
  db: {
    user: process.env.DB_USER || "",
    password: process.env.DB_PASSWORD || "",
    server: process.env.DB_SERVER || "",
    database: process.env.DB_DATABASE || "",
    port: Number(process.env.DB_PORT || 1433),
    options: {
      encrypt: String(process.env.DB_ENCRYPT || "true") === "true",
      trustServerCertificate:
        String(process.env.DB_TRUST_SERVER_CERTIFICATE || "true") === "true"
    }
  }
};
