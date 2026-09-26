import bcrypt from "bcryptjs";
import { getPool, sql } from "./connection.js";

const schemaSql = `
IF OBJECT_ID('dbo.Copart7082Bids', 'U') IS NOT NULL DROP TABLE dbo.Copart7082Bids;
IF OBJECT_ID('dbo.Copart7082VehiclePhotos', 'U') IS NOT NULL DROP TABLE dbo.Copart7082VehiclePhotos;
IF OBJECT_ID('dbo.Copart7082Vehicles', 'U') IS NOT NULL DROP TABLE dbo.Copart7082Vehicles;
IF OBJECT_ID('dbo.Copart7082Users', 'U') IS NOT NULL DROP TABLE dbo.Copart7082Users;

CREATE TABLE dbo.Copart7082Users (
  id INT IDENTITY(1,1) PRIMARY KEY,
  firstName NVARCHAR(80) NOT NULL,
  lastName NVARCHAR(80) NOT NULL,
  email NVARCHAR(180) NOT NULL UNIQUE,
  phone NVARCHAR(40) NOT NULL,
  passwordHash NVARCHAR(255) NOT NULL,
  createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.Copart7082Vehicles (
  id INT IDENTITY(1,1) PRIMARY KEY,
  ownerId INT NOT NULL,
  year INT NOT NULL,
  articleType NVARCHAR(80) NOT NULL,
  brand NVARCHAR(80) NOT NULL,
  model NVARCHAR(80) NOT NULL,
  engine NVARCHAR(80) NOT NULL,
  transmission NVARCHAR(80) NOT NULL,
  fuelType NVARCHAR(80) NOT NULL,
  drivetrain NVARCHAR(20) NOT NULL,
  cylinders INT NOT NULL,
  damageLevel NVARCHAR(20) NOT NULL,
  basePrice DECIMAL(18,2) NOT NULL,
  startsAt DATETIME2 NOT NULL,
  endsAt DATETIME2 NOT NULL,
  createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Copart7082Vehicles_Users FOREIGN KEY (ownerId) REFERENCES dbo.Copart7082Users(id)
);

CREATE TABLE dbo.Copart7082VehiclePhotos (
  id INT IDENTITY(1,1) PRIMARY KEY,
  vehicleId INT NOT NULL,
  url NVARCHAR(1000) NOT NULL,
  sortOrder INT NOT NULL DEFAULT 0,
  CONSTRAINT FK_Copart7082VehiclePhotos_Vehicles FOREIGN KEY (vehicleId) REFERENCES dbo.Copart7082Vehicles(id) ON DELETE CASCADE
);

CREATE TABLE dbo.Copart7082Bids (
  id INT IDENTITY(1,1) PRIMARY KEY,
  vehicleId INT NOT NULL,
  userId INT NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Copart7082Bids_Vehicles FOREIGN KEY (vehicleId) REFERENCES dbo.Copart7082Vehicles(id) ON DELETE CASCADE,
  CONSTRAINT FK_Copart7082Bids_Users FOREIGN KEY (userId) REFERENCES dbo.Copart7082Users(id)
);

CREATE INDEX IX_Copart7082Bids_VehicleAmount ON dbo.Copart7082Bids(vehicleId, amount DESC);
`;

const users = [
  ["Carlos", "Perez", "carlos.demo@umg.edu.gt", "5551-1001", "Demo2026!"],
  ["Andrea", "Lopez", "andrea.demo@umg.edu.gt", "5551-1002", "Demo2026!"],
  ["Marvin", "Garcia", "marvin.demo@umg.edu.gt", "5551-1003", "Demo2026!"]
];

const vehicles = [
  {
    ownerEmail: "carlos.demo@umg.edu.gt",
    year: 2021,
    articleType: "Automovil",
    brand: "Toyota",
    model: "Corolla SE",
    engine: "1.8L",
    transmission: "Automatica",
    fuelType: "Gasolina",
    drivetrain: "FWD",
    cylinders: 4,
    damageLevel: "Verde",
    basePrice: 20000,
    startsOffsetMinutes: -120,
    endsOffsetMinutes: 240,
    photos: [
      "https://images.unsplash.com/photo-1623869675781-80aa31012a5a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    ownerEmail: "andrea.demo@umg.edu.gt",
    year: 2020,
    articleType: "SUV",
    brand: "Honda",
    model: "CR-V EX",
    engine: "1.5L Turbo",
    transmission: "CVT",
    fuelType: "Gasolina",
    drivetrain: "AWD",
    cylinders: 4,
    damageLevel: "Amarillo",
    basePrice: 26000,
    startsOffsetMinutes: -90,
    endsOffsetMinutes: 300,
    photos: [
      "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    ownerEmail: "marvin.demo@umg.edu.gt",
    year: 2019,
    articleType: "Pickup",
    brand: "Ford",
    model: "F-150 XLT",
    engine: "3.5L V6",
    transmission: "Automatica",
    fuelType: "Gasolina",
    drivetrain: "4WD",
    cylinders: 6,
    damageLevel: "Rojo",
    basePrice: 30000,
    startsOffsetMinutes: -30,
    endsOffsetMinutes: 360,
    photos: [
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    ownerEmail: "carlos.demo@umg.edu.gt",
    year: 2022,
    articleType: "Automovil",
    brand: "Mazda",
    model: "3 Sedan",
    engine: "2.5L",
    transmission: "Automatica",
    fuelType: "Gasolina",
    drivetrain: "FWD",
    cylinders: 4,
    damageLevel: "Verde",
    basePrice: 23500,
    startsOffsetMinutes: -60,
    endsOffsetMinutes: 420,
    photos: [
      "https://images.unsplash.com/photo-1623869675781-80aa31012a5a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    ownerEmail: "andrea.demo@umg.edu.gt",
    year: 2023,
    articleType: "SUV",
    brand: "Kia",
    model: "Sportage LX",
    engine: "2.0L",
    transmission: "Automatica",
    fuelType: "Hibrido",
    drivetrain: "AWD",
    cylinders: 4,
    damageLevel: "Verde",
    basePrice: 28500,
    startsOffsetMinutes: -15,
    endsOffsetMinutes: 480,
    photos: [
      "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    ownerEmail: "marvin.demo@umg.edu.gt",
    year: 2018,
    articleType: "Motocicleta",
    brand: "Yamaha",
    model: "MT-07",
    engine: "689cc",
    transmission: "Manual",
    fuelType: "Gasolina",
    drivetrain: "RWD",
    cylinders: 2,
    damageLevel: "Amarillo",
    basePrice: 7800,
    startsOffsetMinutes: -45,
    endsOffsetMinutes: 540,
    photos: [
      "https://images.unsplash.com/photo-1623869675781-80aa31012a5a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    ownerEmail: "carlos.demo@umg.edu.gt",
    year: 2020,
    articleType: "Camion",
    brand: "Isuzu",
    model: "NPR HD",
    engine: "5.2L Diesel",
    transmission: "Manual",
    fuelType: "Diesel",
    drivetrain: "RWD",
    cylinders: 4,
    damageLevel: "Rojo",
    basePrice: 42000,
    startsOffsetMinutes: -20,
    endsOffsetMinutes: 600,
    photos: [
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80"
    ]
  },
  {
    ownerEmail: "andrea.demo@umg.edu.gt",
    year: 2021,
    articleType: "Automovil",
    brand: "Nissan",
    model: "Leaf SV",
    engine: "Electrico 110kW",
    transmission: "Automatica",
    fuelType: "Electrico",
    drivetrain: "FWD",
    cylinders: 0,
    damageLevel: "Amarillo",
    basePrice: 19000,
    startsOffsetMinutes: -10,
    endsOffsetMinutes: 660,
    photos: [
      "https://images.unsplash.com/photo-1623869675781-80aa31012a5a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80"
    ]
  }
];

export async function initializeDatabase({ reset = false } = {}) {
  const pool = await getPool();

  if (reset) {
    await pool.request().batch(schemaSql);
  } else {
    const result = await pool
      .request()
      .query("SELECT OBJECT_ID('dbo.Copart7082Users', 'U') AS usersTable");
    if (!result.recordset[0].usersTable) {
      await pool.request().batch(schemaSql);
    }
  }

  const count = await pool
    .request()
    .query("SELECT COUNT(*) AS total FROM dbo.Copart7082Users");

  if (count.recordset[0].total === 0) {
    for (const [firstName, lastName, email, phone, password] of users) {
      const passwordHash = await bcrypt.hash(password, 10);
      await pool
        .request()
        .input("firstName", sql.NVarChar, firstName)
        .input("lastName", sql.NVarChar, lastName)
        .input("email", sql.NVarChar, email)
        .input("phone", sql.NVarChar, phone)
        .input("passwordHash", sql.NVarChar, passwordHash)
        .query(`
          INSERT INTO dbo.Copart7082Users (firstName, lastName, email, phone, passwordHash)
          VALUES (@firstName, @lastName, @email, @phone, @passwordHash)
        `);
    }
  }

  for (const vehicle of vehicles) {
    const owner = await pool
      .request()
      .input("email", sql.NVarChar, vehicle.ownerEmail)
      .query("SELECT id FROM dbo.Copart7082Users WHERE email = @email");

    const existing = await pool
      .request()
      .input("brand", sql.NVarChar, vehicle.brand)
      .input("model", sql.NVarChar, vehicle.model)
      .query("SELECT TOP 1 id FROM dbo.Copart7082Vehicles WHERE brand = @brand AND model = @model");
    if (existing.recordset.length) continue;

    const startsAt = new Date(Date.now() + vehicle.startsOffsetMinutes * 60_000);
    const endsAt = new Date(Date.now() + vehicle.endsOffsetMinutes * 60_000);
    const insert = await pool
      .request()
      .input("ownerId", sql.Int, owner.recordset[0].id)
      .input("year", sql.Int, vehicle.year)
      .input("articleType", sql.NVarChar, vehicle.articleType)
      .input("brand", sql.NVarChar, vehicle.brand)
      .input("model", sql.NVarChar, vehicle.model)
      .input("engine", sql.NVarChar, vehicle.engine)
      .input("transmission", sql.NVarChar, vehicle.transmission)
      .input("fuelType", sql.NVarChar, vehicle.fuelType)
      .input("drivetrain", sql.NVarChar, vehicle.drivetrain)
      .input("cylinders", sql.Int, vehicle.cylinders)
      .input("damageLevel", sql.NVarChar, vehicle.damageLevel)
      .input("basePrice", sql.Decimal(18, 2), vehicle.basePrice)
      .input("startsAt", sql.DateTime2, startsAt)
      .input("endsAt", sql.DateTime2, endsAt)
      .query(`
        INSERT INTO dbo.Copart7082Vehicles
          (ownerId, year, articleType, brand, model, engine, transmission, fuelType, drivetrain, cylinders, damageLevel, basePrice, startsAt, endsAt)
        OUTPUT INSERTED.id
        VALUES
          (@ownerId, @year, @articleType, @brand, @model, @engine, @transmission, @fuelType, @drivetrain, @cylinders, @damageLevel, @basePrice, @startsAt, @endsAt)
      `);

    const vehicleId = insert.recordset[0].id;
    for (const [index, photo] of vehicle.photos.entries()) {
      await pool
        .request()
        .input("vehicleId", sql.Int, vehicleId)
        .input("url", sql.NVarChar, photo)
        .input("sortOrder", sql.Int, index)
        .query(`
          INSERT INTO dbo.Copart7082VehiclePhotos (vehicleId, url, sortOrder)
          VALUES (@vehicleId, @url, @sortOrder)
        `);
    }
  }
}
