import { Edit3 } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../api/client";
import { VehicleCard } from "../components/VehicleCard";
import { useAuth } from "../state/AuthContext";

export function MyVehiclesPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    api("/api/vehicles/mine")
      .then((data) => setVehicles(data.vehicles))
      .catch((err) => setError(err.message));
  }, [user]);

  if (!user) {
    return <section className="page narrow"><h1>Mis publicaciones</h1><p className="error">Debe iniciar sesión.</p></section>;
  }

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Proveedor / usuario</p>
          <h1>Mis publicaciones</h1>
          <p className="muted">Busca y edita los vehículos que publicaste.</p>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="vehicle-grid">
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="owned-card">
            <VehicleCard vehicle={vehicle} />
            <a className="ghost-button full" href={`#/editar/${vehicle.id}`}><Edit3 size={18} /> Editar publicación</a>
          </div>
        ))}
      </div>
    </section>
  );
}
