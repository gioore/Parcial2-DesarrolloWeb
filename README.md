# Copart UMG Subastas

Aplicacion web para el segundo parcial de Desarrollo y Diseño Web. Implementa una plataforma de subastas de vehiculos en tiempo real con frontend desacoplado, API REST, SQL Server y Socket.IO.

## Estructura

```text
Parcial2-DesarrolloWeb/
  frontend/   React + Vite
  backend/    Node.js + Express + Socket.IO + SQL Server
```

## Funcionalidades cubiertas

- Registro e inicio de sesion.
- Visitantes pueden ver el inventario en modo lectura.
- Solo usuarios autenticados pueden publicar vehiculos y pujar.
- Publicacion de vehiculos con ficha tecnica completa.
- Galeria de al menos 5 fotografias por vehiculo.
- Estados de daño Verde, Amarillo y Rojo.
- Inventario con filtros por marca, modelo, año, combustible y daño.
- Detalle de subasta con carrusel de imagenes.
- Reglas de puja validadas en servidor:
  - oferta mayor o igual al monto base si no hay pujas;
  - oferta mayor a la actual;
  - incremento minimo de 10%;
  - respeto de fecha/hora de inicio y cierre.
- Pujas e indicadores en tiempo real sin refrescar la pagina.
- Postores anonimos.
- Indicador de "Vas ganando" y "Tu oferta ha sido superada".

## Usuarios de prueba

| Correo | Contraseña |
|---|---|
| carlos.demo@umg.edu.gt | Demo2026! |
| andrea.demo@umg.edu.gt | Demo2026! |
| marvin.demo@umg.edu.gt | Demo2026! |

## Ejecucion local

Si SQL Server no responde, el backend inicia automaticamente un modo demo en memoria para poder probar todo el flujo localmente. Para la entrega final con SQL, las tablas identificables por carnet son Copart7082Users, Copart7082Vehicles, Copart7082VehiclePhotos y Copart7082Bids.

### Backend

```bash
cd backend
npm install
npm run dev
```

El backend queda en:

```text
http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run build
npm run preview
```

El frontend queda en:

```text
http://localhost:4173
```

## Variables de entorno

El backend usa `backend/.env` en desarrollo local. Para Render se deben configurar estas variables en el servicio backend:

```text
PORT=4000
CLIENT_URL=https://URL-DEL-FRONTEND.onrender.com
JWT_SECRET=un-secreto-largo-y-seguro
DB_USER=UsuarioEncuestas
DB_PASSWORD=******
DB_SERVER=svr-sql-ctezo.southcentralus.cloudapp.azure.com
DB_DATABASE=db_WebDevUMG
DB_PORT=1433
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
```

El frontend usa:

```text
VITE_API_URL=https://URL-DEL-BACKEND.onrender.com
```

## Despliegue en Render

El proyecto debe desplegarse como dos servicios en Render: un Web Service para el
backend y un Static Site para el frontend. Socket.IO requiere que el backend sea
un proceso persistente; no debe desplegarse como función serverless.

### Backend como Web Service

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Node: 20 o superior.
- Agregar `NODE_ENV=production`, `PORT=10000`, `CLIENT_URL` con la URL pública del
  frontend y las variables de SQL Server. No colocar secretos en el repositorio.

### Frontend como Static Site

- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Agregar `VITE_API_URL` con la URL pública del backend.

Después del despliegue, verificar `https://URL-DEL-BACKEND/health` y probar el
login desde dos navegadores con los usuarios de prueba.

## Estado de entrega

- URL publicada: pendiente de configurar en Render.
- API: `/health`, `/api/auth`, `/api/vehicles` y `/api/bids`.
- Tiempo real: Socket.IO en el Web Service del backend.
- Las credenciales SQL se configuran únicamente en Render y en `backend/.env` local.

## Nota de base de datos

Al iniciar, el backend intenta crear las tablas `Copart7082Users`, `Copart7082Vehicles`, `Copart7082VehiclePhotos` y `Copart7082Bids` si no existen. Si el usuario SQL no tiene permisos para crear tablas, se debe ejecutar el script de creacion con un usuario administrador o pedir permisos de escritura/DDL para la base `db_WebDevUMG`.
