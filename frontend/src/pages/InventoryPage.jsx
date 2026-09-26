import { SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { VehicleCard } from "../components/VehicleCard";

const emptyFilters = {
  brand: "",
  model: "",
  year: "",
  fuelType: "",
  damageLevel: ""
};

export function InventoryPage() {
  const [vehicles, setVehicles] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([, value]) => value))
      );
      const data = await api(`/api/vehicles?${params.toString()}`);
      setVehicles(data.vehicles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function update(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Subastas activas</p>
          <h1>Inventario de vehiculos</h1>
          <p className="muted">Explora, filtra y entra a una subasta en tiempo real.</p>
        </div>
      </div>

      <form className="filters" onSubmit={(event) => { event.preventDefault(); load(); }}>
        <label>
          Marca
          <input value={filters.brand} onChange={(event) => update("brand", event.target.value)} />
        </label>
        <label>
          Modelo
          <input value={filters.model} onChange={(event) => update("model", event.target.value)} />
        </label>
        <label>
          Año
          <input type="number" value={filters.year} onChange={(event) => update("year", event.target.value)} />
        </label>
        <label>
          Combustible
          <input value={filters.fuelType} onChange={(event) => update("fuelType", event.target.value)} />
        </label>
        <label>
          Daño
          <select value={filters.damageLevel} onChange={(event) => update("damageLevel", event.target.value)}>
            <option value="">Todos</option>
            <option>Verde</option>
            <option>Amarillo</option>
            <option>Rojo</option>
          </select>
        </label>
        <button className="primary-button">
          <SlidersHorizontal size={18} />
          Filtrar
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="muted">Cargando inventario...</p>
      ) : (
        <div className="vehicle-grid">
          {vehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} />)}
        </div>
      )}
    </section>
  );
}
