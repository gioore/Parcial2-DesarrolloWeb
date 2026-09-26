import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

const photos = [
  "https://images.unsplash.com/photo-1623869675781-80aa31012a5a?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80"
];

let nextUserId = 1;
let nextVehicleId = 1;
let nextBidId = 1;
const users = [];
const vehicles = [];
const bids = [];

function publicUser(user) {
  return { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone };
}

function sign(user) {
  return jwt.sign(publicUser(user), config.jwtSecret, { expiresIn: "8h" });
}

function authenticate(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try { return jwt.verify(token, config.jwtSecret); } catch { return null; }
}

function requireDemoAuth(req, res, next) {
  const user = authenticate(req);
  if (!user) return res.status(401).json({ message: "Debe iniciar sesion." });
  req.user = user;
  return next();
}

function withAuction(vehicle, currentUserId = null) {
  const vehicleBids = bids.filter((bid) => bid.vehicleId === vehicle.id).sort((a, b) => b.amount - a.amount || new Date(b.createdAt) - new Date(a.createdAt));
  const top = vehicleBids[0];
  return {
    ...vehicle,
    currentBid: top?.amount ?? null,
    isCurrentUserWinner: Boolean(currentUserId && top?.userId === currentUserId),
    bidCount: vehicleBids.length
  };
}

export async function seedDemoStore() {
  if (users.length) return;
  const seedUsers = [
    ["Carlos", "Perez", "carlos.demo@umg.edu.gt", "5551-1001", "Demo2026!"],
    ["Andrea", "Lopez", "andrea.demo@umg.edu.gt", "5551-1002", "Demo2026!"],
    ["Marvin", "Garcia", "marvin.demo@umg.edu.gt", "5551-1003", "Demo2026!"]
  ];
  for (const [firstName, lastName, email, phone, password] of seedUsers) {
    users.push({ id: nextUserId++, firstName, lastName, email, phone, passwordHash: await bcrypt.hash(password, 10) });
  }
  const now = Date.now();
  vehicles.push(
    {
      id: nextVehicleId++, ownerId: 1, year: 2021, articleType: "Automovil", brand: "Toyota", model: "Corolla SE", engine: "1.8L", transmission: "Automatica", fuelType: "Gasolina", drivetrain: "FWD", cylinders: 4, damageLevel: "Verde", basePrice: 20000, startsAt: new Date(now - 7200000), endsAt: new Date(now + 14400000), photos
    },
    {
      id: nextVehicleId++, ownerId: 2, year: 2020, articleType: "SUV", brand: "Honda", model: "CR-V EX", engine: "1.5L Turbo", transmission: "CVT", fuelType: "Gasolina", drivetrain: "AWD", cylinders: 4, damageLevel: "Amarillo", basePrice: 26000, startsAt: new Date(now - 5400000), endsAt: new Date(now + 18000000), photos: photos.slice().reverse()
    },
    {
      id: nextVehicleId++, ownerId: 3, year: 2019, articleType: "Pickup", brand: "Ford", model: "F-150 XLT", engine: "3.5L V6", transmission: "Automatica", fuelType: "Gasolina", drivetrain: "4WD", cylinders: 6, damageLevel: "Rojo", basePrice: 30000, startsAt: new Date(now - 1800000), endsAt: new Date(now + 21600000), photos
    }
  );
}

export function createDemoRouters(express, io) {
  const authRouter = express.Router();
  const vehiclesRouter = express.Router();
  const bidsRouter = express.Router();

  authRouter.post("/register", async (req, res) => {
    const { firstName, lastName, email, phone, password } = req.body;
    if (!firstName || !lastName || !email || !phone || !password) return res.status(400).json({ message: "Todos los campos son obligatorios." });
    if (users.some((user) => user.email === email)) return res.status(409).json({ message: "El correo ya esta registrado." });
    const user = { id: nextUserId++, firstName, lastName, email, phone, passwordHash: await bcrypt.hash(password, 10) };
    users.push(user);
    res.status(201).json({ user: publicUser(user), token: sign(user) });
  });

  authRouter.post("/login", async (req, res) => {
    const user = users.find((item) => item.email === req.body.email);
    if (!user || !(await bcrypt.compare(req.body.password || "", user.passwordHash))) return res.status(401).json({ message: "Correo o contraseña incorrectos." });
    res.json({ user: publicUser(user), token: sign(user) });
  });

  authRouter.get("/me", requireDemoAuth, (req, res) => res.json({ user: req.user }));

  vehiclesRouter.get("/", (req, res) => {
    const currentUserId = authenticate(req)?.id;
    const filtered = vehicles.filter((vehicle) => {
      return (!req.query.brand || vehicle.brand.toLowerCase().includes(String(req.query.brand).toLowerCase())) &&
        (!req.query.model || vehicle.model.toLowerCase().includes(String(req.query.model).toLowerCase())) &&
        (!req.query.year || vehicle.year === Number(req.query.year)) &&
        (!req.query.fuelType || vehicle.fuelType.toLowerCase().includes(String(req.query.fuelType).toLowerCase())) &&
        (!req.query.damageLevel || vehicle.damageLevel === req.query.damageLevel);
    });
    res.json({ vehicles: filtered.map((vehicle) => withAuction(vehicle, currentUserId)) });
  });

  vehiclesRouter.get("/mine", requireDemoAuth, (req, res) => res.json({ vehicles: vehicles.filter((vehicle) => vehicle.ownerId === req.user.id).map(withAuction) }));

  vehiclesRouter.get("/:id", (req, res) => {
    const currentUserId = authenticate(req)?.id;
    const vehicle = vehicles.find((item) => item.id === Number(req.params.id));
    if (!vehicle) return res.status(404).json({ message: "Vehiculo no encontrado." });
    res.json({ vehicle: withAuction(vehicle, currentUserId) });
  });

  vehiclesRouter.post("/", requireDemoAuth, (req, res) => {
    if (!Array.isArray(req.body.photos) || req.body.photos.filter(Boolean).length < 5) return res.status(400).json({ message: "Debe incluir al menos 5 fotografias por vehiculo." });
    const vehicle = { ...req.body, id: nextVehicleId++, ownerId: req.user.id, year: Number(req.body.year), cylinders: Number(req.body.cylinders), basePrice: Number(req.body.basePrice), startsAt: new Date(req.body.startsAt), endsAt: new Date(req.body.endsAt), photos: req.body.photos.filter(Boolean) };
    vehicles.push(vehicle);
    res.status(201).json({ id: vehicle.id });
  });

  vehiclesRouter.put("/:id", requireDemoAuth, (req, res) => {
    const index = vehicles.findIndex((item) => item.id === Number(req.params.id));
    if (index === -1) return res.status(404).json({ message: "Vehiculo no encontrado." });
    if (vehicles[index].ownerId !== req.user.id) return res.status(403).json({ message: "Solo puede editar sus propias publicaciones." });
    vehicles[index] = { ...vehicles[index], ...req.body, year: Number(req.body.year), cylinders: Number(req.body.cylinders), basePrice: Number(req.body.basePrice), startsAt: new Date(req.body.startsAt), endsAt: new Date(req.body.endsAt), photos: req.body.photos.filter(Boolean) };
    res.json({ ok: true });
  });

  bidsRouter.get("/:vehicleId", (req, res) => {
    const currentUserId = authenticate(req)?.id;
    res.json({ bids: bids.filter((bid) => bid.vehicleId === Number(req.params.vehicleId)).sort((a, b) => b.amount - a.amount).map(({ userId, ...bid }) => ({ ...bid, isMine: Boolean(currentUserId && userId === currentUserId) })) });
  });

  bidsRouter.post("/:vehicleId", requireDemoAuth, (req, res) => {
    const vehicle = vehicles.find((item) => item.id === Number(req.params.vehicleId));
    if (!vehicle) return res.status(404).json({ message: "Vehiculo no encontrado." });
    const now = Date.now();
    if (now < new Date(vehicle.startsAt).getTime()) return res.status(400).json({ message: "La subasta aun no ha iniciado." });
    if (now > new Date(vehicle.endsAt).getTime()) return res.status(400).json({ message: "Oferta cerrada. La subasta ya termino." });
    const amount = Number(req.body.amount);
    const current = withAuction(vehicle).currentBid;
    const minimum = current ? current * 1.1 : vehicle.basePrice;
    if (!Number.isFinite(amount) || amount < minimum) return res.status(400).json({ message: `La oferta minima es Q. ${minimum.toFixed(2)}.` });
    const bid = { id: nextBidId++, vehicleId: vehicle.id, userId: req.user.id, amount, createdAt: new Date() };
    bids.push(bid);
    const publicBid = { id: bid.id, vehicleId: bid.vehicleId, amount: bid.amount, createdAt: bid.createdAt };
    io.to(`vehicle:${vehicle.id}`).emit("bid:created", publicBid);
    io.emit("vehicle:updated", publicBid);
    res.status(201).json({ bid: publicBid });
  });

  return { authRouter, vehiclesRouter, bidsRouter };
}
