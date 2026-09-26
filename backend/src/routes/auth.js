import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { getPool, sql } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = express.Router();

function publicUser(user) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone
  };
}

function sign(user) {
  return jwt.sign(publicUser(user), config.jwtSecret, { expiresIn: "8h" });
}

authRouter.post("/register", async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ message: "Todos los campos son obligatorios." });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ message: "La contraseña debe tener al menos 8 caracteres." });
    }

    const pool = await getPool();
    const exists = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query("SELECT id FROM dbo.Copart7082Users WHERE email = @email");
    if (exists.recordset.length) {
      return res.status(409).json({ message: "El correo ya esta registrado." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool
      .request()
      .input("firstName", sql.NVarChar, firstName)
      .input("lastName", sql.NVarChar, lastName)
      .input("email", sql.NVarChar, email)
      .input("phone", sql.NVarChar, phone)
      .input("passwordHash", sql.NVarChar, passwordHash)
      .query(`
        INSERT INTO dbo.Copart7082Users (firstName, lastName, email, phone, passwordHash)
        OUTPUT INSERTED.id, INSERTED.firstName, INSERTED.lastName, INSERTED.email, INSERTED.phone
        VALUES (@firstName, @lastName, @email, @phone, @passwordHash)
      `);

    const user = result.recordset[0];
    return res.status(201).json({ user: publicUser(user), token: sign(user) });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const pool = await getPool();
    const result = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .query("SELECT * FROM dbo.Copart7082Users WHERE email = @email");
    const user = result.recordset[0];
    if (!user || !(await bcrypt.compare(password || "", user.passwordHash))) {
      return res.status(401).json({ message: "Correo o contraseña incorrectos." });
    }

    return res.json({ user: publicUser(user), token: sign(user) });
  } catch (error) {
    return next(error);
  }
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});
