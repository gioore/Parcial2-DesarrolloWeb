import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { VehicleCard } from "../components/VehicleCard";

const emptyFilters = {
  brand: "",
  model: "",
  year: "",
  articleType: "",
  fuelType: "",
  transmission: "",
  drivetrain: "",
  cylinders: "",
  damageLevel: ""
};

export function InventoryPage() {
  const [vehicles, setVehicles] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(nextFilters = filters) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(nextFilters).filter(([, value]) => value))
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
    load(emptyFilters);
  }, []);

  function update(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function clearFilters() {
    setFilters(emptyFilters);
    load(emptyFilters);
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Subastas activas</p>
          <h1>Inventario de vehículos</h1>
          <p className="muted">Explora, filtra y entra a una subasta en tiempo real.</p>
        </div>
      </div>

      <form className="filter-panel" onSubmit={(event) => { event.preventDefault(); load(); }}>
        <div className="filter-heading">
          <div>
            <h2><SlidersHorizontal size={19} /> Filtrar inventario</h2>
            <p className="muted">Combina varios criterios para encontrar el vehículo ideal.</p>
          </div>
          {activeFilterCount > 0 && <span className="filter-count">{activeFilterCount} activos</span>}
        </div>
        <div className="filters">
        <label>
          Marca
          <input value={filters.brand} onChange={(event) => update("brand", event.target.value)} placeholder="Ej. Toyota" />
        </label>
        <label>
          Modelo
          <input value={filters.model} onChange={(event) => update("model", event.target.value)} placeholder="Ej. Corolla" />
        </label>
        <label>
          Año
          <input type="number" min="1900" max="2100" value={filters.year} onChange={(event) => update("year", event.target.value)} placeholder="Ej. 2021" />
        </label>
        <label>
          Tipo de artículo
          <select value={filters.articleType} onChange={(event) => update("articleType", event.target.value)}>
            <option value="">Todos</option>
            <option>Automovil</option>
            <option>SUV</option>
            <option>Pickup</option>
            <option>Motocicleta</option>
            <option>Camion</option>
          </select>
        </label>
        <label>
          Combustible
          <select value={filters.fuelType} onChange={(event) => update("fuelType", event.target.value)}>
            <option value="">Todos</option>
            <option>Gasolina</option>
            <option>Diesel</option>
            <option>Hibrido</option>
            <option>Electrico</option>
          </select>
        </label>
        <label>
          Transmisión
          <select value={filters.transmission} onChange={(event) => update("transmission", event.target.value)}>
            <option value="">Todas</option>
            <option>Automatica</option>
            <option>Manual</option>
            <option>CVT</option>
          </select>
        </label>
        <label>
          Tren de manejo
          <select value={filters.drivetrain} onChange={(event) => update("drivetrain", event.target.value)}>
            <option value="">Todos</option>
            <option>FWD</option>
            <option>RWD</option>
            <option>AWD</option>
            <option>4WD</option>
          </select>
        </label>
        <label>
          Cilindros
          <select value={filters.cylinders} onChange={(event) => update("cylinders", event.target.value)}>
            <option value="">Todos</option>
            <option value="2">2 cilindros</option>
            <option value="3">3 cilindros</option>
            <option value="4">4 cilindros</option>
            <option value="6">6 cilindros</option>
            <option value="8">8 cilindros</option>
          </select>
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
        </div>
        <div className="filter-actions">
          <span className="muted"><Search size={16} /> {vehicles.length} resultados encontrados</span>
          <div>
            <button type="button" className="ghost-button" onClick={clearFilters} disabled={!activeFilterCount}>
              <RotateCcw size={17} /> Limpiar
            </button>
            <button className="primary-button" disabled={loading}>
              <SlidersHorizontal size={18} /> {loading ? "Buscando..." : "Aplicar filtros"}
            </button>
          </div>
        </div>
      </form>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="muted">Cargando inventario...</p>
      ) : (
        vehicles.length ? (
          <div className="vehicle-grid">
            {vehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} />)}
          </div>
        ) : (
          <div className="empty-state">
            <h2>No encontramos vehículos</h2>
            <p className="muted">Prueba con otros criterios o limpia los filtros para ver todo el inventario.</p>
            <button type="button" className="ghost-button" onClick={clearFilters}><RotateCcw size={17} /> Limpiar filtros</button>
          </div>
        )
      )}
    </section>
  );
}
