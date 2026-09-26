import express from "express";
import { getPool, sql } from "../db/connection.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";

export const vehiclesRouter = express.Router();

function mapVehicle(row, currentUserId = null) {
  return {
    id: row.id,
    ownerId: row.ownerId,
    year: row.year,
    articleType: row.articleType,
    brand: row.brand,
    model: row.model,
    engine: row.engine,
    transmission: row.transmission,
    fuelType: row.fuelType,
    drivetrain: row.drivetrain,
    cylinders: row.cylinders,
    damageLevel: row.damageLevel,
    basePrice: Number(row.basePrice),
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    currentBid: row.currentBid === null ? null : Number(row.currentBid),
    isCurrentUserWinner: Boolean(currentUserId && row.currentBidUserId === currentUserId),
    bidCount: row.bidCount,
    photos: row.photos ? row.photos.split("|").filter(Boolean) : []
  };
}

vehiclesRouter.get("/", optionalAuth, async (req, res, next) => {
  try {
    const { brand, model, year, fuelType, damageLevel } = req.query;
    const pool = await getPool();
    const request = pool.request();
    const where = [];

    if (brand) {
      request.input("brand", sql.NVarChar, `%${brand}%`);
      where.push("v.brand LIKE @brand");
    }
    if (model) {
      request.input("model", sql.NVarChar, `%${model}%`);
      where.push("v.model LIKE @model");
    }
    if (year) {
      request.input("year", sql.Int, Number(year));
      where.push("v.year = @year");
    }
    if (fuelType) {
      request.input("fuelType", sql.NVarChar, `%${fuelType}%`);
      where.push("v.fuelType LIKE @fuelType");
    }
    if (damageLevel) {
      request.input("damageLevel", sql.NVarChar, damageLevel);
      where.push("v.damageLevel = @damageLevel");
    }

    const result = await request.query(`
      SELECT
        v.*,
        ISNULL(bids.bidCount, 0) AS bidCount,
        bids.currentBid,
        bids.currentBidUserId,
        photos.photos
      FROM dbo.Copart7082Vehicles v
      OUTER APPLY (
        SELECT
          COUNT(*) AS bidCount,
          MAX(amount) AS currentBid,
          (SELECT TOP 1 userId FROM dbo.Copart7082Bids b2 WHERE b2.vehicleId = v.id ORDER BY amount DESC, createdAt DESC) AS currentBidUserId
        FROM dbo.Copart7082Bids b
        WHERE b.vehicleId = v.id
      ) bids
      OUTER APPLY (
        SELECT STUFF((
          SELECT '|' + CONVERT(NVARCHAR(MAX), p2.url)
          FROM dbo.Copart7082VehiclePhotos p2
          WHERE p2.vehicleId = v.id
          ORDER BY p2.sortOrder
          FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 1, '') AS photos
      ) photos
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY v.createdAt DESC
    `);

    res.json({ vehicles: result.recordset.map((vehicle) => mapVehicle(vehicle, req.user?.id)) });
  } catch (error) {
    next(error);
  }
});

vehiclesRouter.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("ownerId", sql.Int, req.user.id)
      .query(`
        SELECT
          v.*,
          ISNULL(bids.bidCount, 0) AS bidCount,
          bids.currentBid,
          bids.currentBidUserId,
          photos.photos
        FROM dbo.Copart7082Vehicles v
        OUTER APPLY (
          SELECT COUNT(*) AS bidCount, MAX(amount) AS currentBid,
          (SELECT TOP 1 userId FROM dbo.Copart7082Bids b2 WHERE b2.vehicleId = v.id ORDER BY amount DESC, createdAt DESC) AS currentBidUserId
          FROM dbo.Copart7082Bids b WHERE b.vehicleId = v.id
        ) bids
        OUTER APPLY (
          SELECT STUFF((
            SELECT '|' + CONVERT(NVARCHAR(MAX), p2.url)
            FROM dbo.Copart7082VehiclePhotos p2
            WHERE p2.vehicleId = v.id
            ORDER BY p2.sortOrder
            FOR XML PATH(''), TYPE
          ).value('.', 'NVARCHAR(MAX)'), 1, 1, '') AS photos
        ) photos
        WHERE v.ownerId = @ownerId
        ORDER BY v.createdAt DESC
      `);
    res.json({ vehicles: result.recordset.map((vehicle) => mapVehicle(vehicle, req.user.id)) });
  } catch (error) {
    next(error);
  }
});

vehiclesRouter.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("id", sql.Int, Number(req.params.id))
      .query(`
        SELECT
          v.*,
          ISNULL(bids.bidCount, 0) AS bidCount,
          bids.currentBid,
          bids.currentBidUserId,
          photos.photos
        FROM dbo.Copart7082Vehicles v
        OUTER APPLY (
          SELECT COUNT(*) AS bidCount, MAX(amount) AS currentBid,
          (SELECT TOP 1 userId FROM dbo.Copart7082Bids b2 WHERE b2.vehicleId = v.id ORDER BY amount DESC, createdAt DESC) AS currentBidUserId
          FROM dbo.Copart7082Bids b WHERE b.vehicleId = v.id
        ) bids
        OUTER APPLY (
          SELECT STUFF((
            SELECT '|' + CONVERT(NVARCHAR(MAX), p2.url)
            FROM dbo.Copart7082VehiclePhotos p2
            WHERE p2.vehicleId = v.id
            ORDER BY p2.sortOrder
            FOR XML PATH(''), TYPE
          ).value('.', 'NVARCHAR(MAX)'), 1, 1, '') AS photos
        ) photos
        WHERE v.id = @id
      `);

    const vehicle = result.recordset[0];
    if (!vehicle) return res.status(404).json({ message: "Vehiculo no encontrado." });
    return res.json({ vehicle: mapVehicle(vehicle, req.user?.id) });
  } catch (error) {
    next(error);
  }
});

function validateVehicle(body) {
  const required = [
    "year",
    "articleType",
    "brand",
    "model",
    "engine",
    "transmission",
    "fuelType",
    "drivetrain",
    "cylinders",
    "damageLevel",
    "basePrice",
    "startsAt",
    "endsAt"
  ];
  const missing = required.filter((key) => body[key] === undefined || body[key] === "");
  if (missing.length) return `Campos obligatorios faltantes: ${missing.join(", ")}.`;
  if (!Array.isArray(body.photos) || body.photos.filter(Boolean).length < 5) {
    return "Debe incluir al menos 5 fotografias por vehiculo.";
  }
  if (!["Verde", "Amarillo", "Rojo"].includes(body.damageLevel)) {
    return "El nivel de daño debe ser Verde, Amarillo o Rojo.";
  }
  if (new Date(body.endsAt) <= new Date(body.startsAt)) {
    return "La fecha de cierre debe ser posterior a la fecha de inicio.";
  }
  return null;
}

vehiclesRouter.post("/", requireAuth, async (req, res, next) => {
  try {
    const validation = validateVehicle(req.body);
    if (validation) return res.status(400).json({ message: validation });

    const pool = await getPool();
    const body = req.body;
    const insert = await pool
      .request()
      .input("ownerId", sql.Int, req.user.id)
      .input("year", sql.Int, Number(body.year))
      .input("articleType", sql.NVarChar, body.articleType)
      .input("brand", sql.NVarChar, body.brand)
      .input("model", sql.NVarChar, body.model)
      .input("engine", sql.NVarChar, body.engine)
      .input("transmission", sql.NVarChar, body.transmission)
      .input("fuelType", sql.NVarChar, body.fuelType)
      .input("drivetrain", sql.NVarChar, body.drivetrain)
      .input("cylinders", sql.Int, Number(body.cylinders))
      .input("damageLevel", sql.NVarChar, body.damageLevel)
      .input("basePrice", sql.Decimal(18, 2), Number(body.basePrice))
      .input("startsAt", sql.DateTime2, new Date(body.startsAt))
      .input("endsAt", sql.DateTime2, new Date(body.endsAt))
      .query(`
        INSERT INTO dbo.Copart7082Vehicles
          (ownerId, year, articleType, brand, model, engine, transmission, fuelType, drivetrain, cylinders, damageLevel, basePrice, startsAt, endsAt)
        OUTPUT INSERTED.id
        VALUES
          (@ownerId, @year, @articleType, @brand, @model, @engine, @transmission, @fuelType, @drivetrain, @cylinders, @damageLevel, @basePrice, @startsAt, @endsAt)
      `);
    const vehicleId = insert.recordset[0].id;
    for (const [index, photo] of body.photos.filter(Boolean).entries()) {
      await pool
        .request()
        .input("vehicleId", sql.Int, vehicleId)
        .input("url", sql.NVarChar, photo)
        .input("sortOrder", sql.Int, index)
        .query("INSERT INTO dbo.Copart7082VehiclePhotos (vehicleId, url, sortOrder) VALUES (@vehicleId, @url, @sortOrder)");
    }

    res.status(201).json({ id: vehicleId });
  } catch (error) {
    next(error);
  }
});

vehiclesRouter.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const validation = validateVehicle(req.body);
    if (validation) return res.status(400).json({ message: validation });

    const pool = await getPool();
    const owner = await pool
      .request()
      .input("id", sql.Int, Number(req.params.id))
      .query("SELECT ownerId FROM dbo.Copart7082Vehicles WHERE id = @id");
    if (!owner.recordset[0]) return res.status(404).json({ message: "Vehiculo no encontrado." });
    if (owner.recordset[0].ownerId !== req.user.id) {
      return res.status(403).json({ message: "Solo puede editar sus propias publicaciones." });
    }

    const body = req.body;
    await pool
      .request()
      .input("id", sql.Int, Number(req.params.id))
      .input("year", sql.Int, Number(body.year))
      .input("articleType", sql.NVarChar, body.articleType)
      .input("brand", sql.NVarChar, body.brand)
      .input("model", sql.NVarChar, body.model)
      .input("engine", sql.NVarChar, body.engine)
      .input("transmission", sql.NVarChar, body.transmission)
      .input("fuelType", sql.NVarChar, body.fuelType)
      .input("drivetrain", sql.NVarChar, body.drivetrain)
      .input("cylinders", sql.Int, Number(body.cylinders))
      .input("damageLevel", sql.NVarChar, body.damageLevel)
      .input("basePrice", sql.Decimal(18, 2), Number(body.basePrice))
      .input("startsAt", sql.DateTime2, new Date(body.startsAt))
      .input("endsAt", sql.DateTime2, new Date(body.endsAt))
      .query(`
        UPDATE dbo.Copart7082Vehicles SET
          year=@year, articleType=@articleType, brand=@brand, model=@model, engine=@engine,
          transmission=@transmission, fuelType=@fuelType, drivetrain=@drivetrain, cylinders=@cylinders,
          damageLevel=@damageLevel, basePrice=@basePrice, startsAt=@startsAt, endsAt=@endsAt
        WHERE id=@id
      `);

    await pool.request().input("id", sql.Int, Number(req.params.id)).query("DELETE FROM dbo.Copart7082VehiclePhotos WHERE vehicleId = @id");
    for (const [index, photo] of body.photos.filter(Boolean).entries()) {
      await pool
        .request()
        .input("vehicleId", sql.Int, Number(req.params.id))
        .input("url", sql.NVarChar, photo)
        .input("sortOrder", sql.Int, index)
        .query("INSERT INTO dbo.Copart7082VehiclePhotos (vehicleId, url, sortOrder) VALUES (@vehicleId, @url, @sortOrder)");
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
