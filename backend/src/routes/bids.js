import express from "express";
import { getPool, sql } from "../db/connection.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";

export function createBidsRouter(io) {
  const router = express.Router();

  router.post("/:vehicleId", requireAuth, async (req, res, next) => {
    let transaction;
    try {
      const vehicleId = Number(req.params.vehicleId);
      const amount = Number(req.body.amount);
      if (!Number.isFinite(amount)) {
        return res.status(400).json({ message: "Ingrese un monto válido." });
      }

      const pool = await getPool();
      transaction = new sql.Transaction(pool);
      await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
      const request = new sql.Request(transaction);
      const vehicleResult = await request
        .input("vehicleId", sql.Int, vehicleId)
        .query(`
          SELECT
            v.*,
            MAX(b.amount) AS currentBid
          FROM dbo.Copart7082Vehicles v
          LEFT JOIN dbo.Copart7082Bids b ON b.vehicleId = v.id
          WHERE v.id = @vehicleId
          GROUP BY v.id, v.ownerId, v.year, v.articleType, v.brand, v.model, v.engine, v.transmission,
            v.fuelType, v.drivetrain, v.cylinders, v.damageLevel, v.basePrice, v.startsAt, v.endsAt, v.createdAt
        `);

      const vehicle = vehicleResult.recordset[0];
      if (!vehicle) {
        await transaction.rollback();
        transaction = null;
        return res.status(404).json({ message: "Vehiculo no encontrado." });
      }

      const now = Date.now();
      if (now < new Date(vehicle.startsAt).getTime()) {
        await transaction.rollback();
        transaction = null;
        return res.status(400).json({ message: "La subasta aún no ha iniciado." });
      }
      if (now > new Date(vehicle.endsAt).getTime()) {
        await transaction.rollback();
        transaction = null;
        return res.status(400).json({ message: "Oferta cerrada. La subasta ya terminó." });
      }

      const currentBid = vehicle.currentBid === null ? null : Number(vehicle.currentBid);
      const minimum = currentBid === null ? Number(vehicle.basePrice) : currentBid * 1.1;
      if (amount < minimum) {
        await transaction.rollback();
        transaction = null;
        return res.status(400).json({
          message:
            currentBid === null
              ? `La oferta debe ser igual o mayor al monto base Q. ${Number(vehicle.basePrice).toFixed(2)}.`
              : `La oferta debe superar la puja actual por al menos 10%. Mínimo: Q. ${minimum.toFixed(2)}.`
        });
      }

      const insert = await new sql.Request(transaction)
        .input("vehicleId", sql.Int, vehicleId)
        .input("userId", sql.Int, req.user.id)
        .input("amount", sql.Decimal(18, 2), amount)
        .query(`
          INSERT INTO dbo.Copart7082Bids (vehicleId, userId, amount)
          OUTPUT INSERTED.id, INSERTED.vehicleId, INSERTED.userId, INSERTED.amount, INSERTED.createdAt
          VALUES (@vehicleId, @userId, @amount)
        `);

      const bid = insert.recordset[0];
      await transaction.commit();
      transaction = null;

      const payload = {
        id: bid.id,
        vehicleId: bid.vehicleId,
        amount: Number(bid.amount),
        createdAt: bid.createdAt
      };
      io.to(`vehicle:${vehicleId}`).emit("bid:created", payload);
      io.emit("vehicle:updated", payload);

      return res.status(201).json({ bid: payload });
    } catch (error) {
      if (transaction) await transaction.rollback().catch(() => {});
      return next(error);
    }
  });

  router.get("/:vehicleId", optionalAuth, async (req, res, next) => {
    try {
      const pool = await getPool();
      const result = await pool
        .request()
        .input("vehicleId", sql.Int, Number(req.params.vehicleId))
        .query(`
          SELECT TOP 20 id, vehicleId, userId, amount, createdAt
          FROM dbo.Copart7082Bids
          WHERE vehicleId = @vehicleId
          ORDER BY amount DESC, createdAt DESC
        `);
      res.json({
        bids: result.recordset.map((bid) => ({
          id: bid.id,
          vehicleId: bid.vehicleId,
          amount: Number(bid.amount),
          isMine: Boolean(req.user && bid.userId === req.user.id),
          createdAt: bid.createdAt
        }))
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
