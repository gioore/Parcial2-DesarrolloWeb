import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../state/AuthContext";

const blank = {
  year: new Date().getFullYear(),
  articleType: "Automovil",
  brand: "",
  model: "",
  engine: "",
  transmission: "Automatica",
  fuelType: "Gasolina",
  drivetrain: "FWD",
  cylinders: 4,
  damageLevel: "Verde",
  basePrice: 20000,
  startsAt: "",
  endsAt: "",
  photos: ["", "", "", "", ""]
};

function toLocalInput(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export function PublishPage({ vehicleId }) {
  const { user } = useAuth();
  const [form, setForm] = useState(() => ({
    ...blank,
    startsAt: toLocalInput(new Date()),
    endsAt: toLocalInput(new Date(Date.now() + 4 * 60 * 60 * 1000))
  }));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!vehicleId) return;
    api(`/api/vehicles/${vehicleId}`)
      .then(({ vehicle }) => setForm({
        ...vehicle,
        startsAt: toLocalInput(vehicle.startsAt),
        endsAt: toLocalInput(vehicle.endsAt),
        photos: [...vehicle.photos, "", "", "", "", ""].slice(0, Math.max(5, vehicle.photos.length))
      }))
      .catch((err) => setError(err.message));
  }, [vehicleId]);

  if (!user) {
    return (
      <section className="page narrow">
        <h1>Publicar vehiculo</h1>
        <p className="error">Debe iniciar sesion para publicar o editar vehiculos.</p>
      </section>
    );
  }

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updatePhoto(index, value) {
    setForm((current) => ({
      ...current,
      photos: current.photos.map((photo, i) => (i === index ? value : photo))
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const payload = {
        ...form,
        year: Number(form.year),
        cylinders: Number(form.cylinders),
        basePrice: Number(form.basePrice),
        photos: form.photos.filter(Boolean)
      };
      if (vehicleId) {
        await api(`/api/vehicles/${vehicleId}`, { method: "PUT", body: JSON.stringify(payload) });
        setMessage("Publicacion actualizada.");
      } else {
        const data = await api("/api/vehicles", { method: "POST", body: JSON.stringify(payload) });
        window.location.hash = `#/vehiculos/${data.id}`;
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{vehicleId ? "Editar publicacion" : "Nueva publicacion"}</p>
          <h1>{vehicleId ? "Actualizar vehiculo" : "Publicar vehiculo"}</h1>
          <p className="muted">Completa ficha tecnica, subasta y al menos 5 fotografias.</p>
        </div>
      </div>

      <form className="publish-form" onSubmit={submit}>
        <div className="form-section">
          <h2>Ficha tecnica</h2>
          <label>Año<input type="number" value={form.year} onChange={(e) => update("year", e.target.value)} required /></label>
          <label>Tipo de articulo<input value={form.articleType} onChange={(e) => update("articleType", e.target.value)} required /></label>
          <label>Marca<input value={form.brand} onChange={(e) => update("brand", e.target.value)} required /></label>
          <label>Modelo<input value={form.model} onChange={(e) => update("model", e.target.value)} required /></label>
          <label>Motor<input value={form.engine} onChange={(e) => update("engine", e.target.value)} required /></label>
          <label>Transmision<input value={form.transmission} onChange={(e) => update("transmission", e.target.value)} required /></label>
          <label>Combustible<input value={form.fuelType} onChange={(e) => update("fuelType", e.target.value)} required /></label>
          <label>Tren de manejo<select value={form.drivetrain} onChange={(e) => update("drivetrain", e.target.value)}><option>FWD</option><option>RWD</option><option>AWD</option><option>4WD</option></select></label>
          <label>Cilindros<input type="number" value={form.cylinders} onChange={(e) => update("cylinders", e.target.value)} required /></label>
          <label>Estado de daño<select value={form.damageLevel} onChange={(e) => update("damageLevel", e.target.value)}><option>Verde</option><option>Amarillo</option><option>Rojo</option></select></label>
        </div>

        <div className="form-section">
          <h2>Subasta</h2>
          <label>Monto base<input type="number" value={form.basePrice} onChange={(e) => update("basePrice", e.target.value)} required /></label>
          <label>Fecha y hora de inicio<input type="datetime-local" value={form.startsAt} onChange={(e) => update("startsAt", e.target.value)} required /></label>
          <label>Fecha y hora de cierre<input type="datetime-local" value={form.endsAt} onChange={(e) => update("endsAt", e.target.value)} required /></label>
        </div>

        <div className="form-section photos-section">
          <h2>Galeria fotografica</h2>
          {form.photos.map((photo, index) => (
            <label key={index}>Foto {index + 1}<input value={photo} onChange={(e) => updatePhoto(index, e.target.value)} required={index < 5} placeholder="https://..." /></label>
          ))}
          <button type="button" className="ghost-button" onClick={() => setForm((current) => ({ ...current, photos: [...current.photos, ""] }))}>Agregar otra foto</button>
        </div>

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
        <button className="primary-button"><Save size={18} /> Guardar publicacion</button>
      </form>
    </section>
  );
}
