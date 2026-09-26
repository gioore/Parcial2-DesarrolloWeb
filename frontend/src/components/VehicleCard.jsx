import { Clock, Gauge, Image, Tag } from "lucide-react";
import { Countdown } from "./Countdown";

const damageClass = {
  Verde: "damage-green",
  Amarillo: "damage-yellow",
  Rojo: "damage-red"
};

export function VehicleCard({ vehicle }) {
  return (
    <article className="vehicle-card">
      <div className="card-media">
        <img src={vehicle.photos[0]} alt={`${vehicle.brand} ${vehicle.model}`} />
        <span className={`damage-pill ${damageClass[vehicle.damageLevel]}`}>{vehicle.damageLevel}</span>
      </div>
      <div className="card-body">
        <div>
          <p className="eyebrow">{vehicle.year} · {vehicle.articleType}</p>
          <h3>{vehicle.brand} {vehicle.model}</h3>
        </div>
        <div className="spec-row">
          <span><Gauge size={16} /> {vehicle.engine}</span>
          <span><Tag size={16} /> {vehicle.fuelType}</span>
          <span><Image size={16} /> {vehicle.photos.length} fotos</span>
        </div>
        <div className="bid-row">
          <div>
            <span className="muted">Oferta actual</span>
            <strong>Q. {(vehicle.currentBid || vehicle.basePrice).toLocaleString("es-GT")}</strong>
          </div>
          <span className="clock"><Clock size={16} /><Countdown startsAt={vehicle.startsAt} endsAt={vehicle.endsAt} /></span>
        </div>
        <a className="primary-button full" href={`#/vehiculos/${vehicle.id}`}>Ver subasta</a>
      </div>
    </article>
  );
}
