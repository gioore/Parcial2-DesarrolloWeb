import { ArrowLeft, BadgeCheck, CircleAlert, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { api, getApiUrl } from "../api/client";
import { Countdown } from "../components/Countdown";
import { useAuth } from "../state/AuthContext";
import { displayImageUrl } from "../utils/images";

export function VehicleDetailPage({ vehicleId, openAuth }) {
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState(null);
  const [bids, setBids] = useState([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [myHighestBid, setMyHighestBid] = useState(0);
  const [isWinning, setIsWinning] = useState(false);
  const myHighestBidRef = useRef(0);

  async function load() {
    setLoading(true);
    setError("");
    const [vehicleData, bidData] = await Promise.all([
      api(`/api/vehicles/${vehicleId}`),
      api(`/api/bids/${vehicleId}`)
    ]);
    setVehicle(vehicleData.vehicle);
    setBids(bidData.bids);
    const highestMine = Math.max(0, ...bidData.bids.filter((bid) => bid.isMine).map((bid) => bid.amount));
    myHighestBidRef.current = highestMine;
    setMyHighestBid(highestMine);
    setIsWinning(Boolean(vehicleData.vehicle.isCurrentUserWinner));
    setLoading(false);
  }

  useEffect(() => {
    load().catch((err) => {
      setVehicle(null);
      setError(err.message);
      setLoading(false);
    });
  }, [vehicleId]);

  useEffect(() => {
    const socket = io(getApiUrl());
    socket.emit("vehicle:join", vehicleId);
    socket.on("bid:created", (bid) => {
      setBids((current) => [bid, ...current].sort((a, b) => b.amount - a.amount));
      setVehicle((current) => current ? { ...current, currentBid: bid.amount, bidCount: current.bidCount + 1 } : current);
      if (user && bid.amount > myHighestBidRef.current) setIsWinning(false);
    });
    return () => {
      socket.emit("vehicle:leave", vehicleId);
      socket.disconnect();
    };
  }, [vehicleId, user]);

  const currentBid = vehicle?.currentBid || vehicle?.basePrice || 0;
  const minimum = useMemo(() => {
    if (!vehicle) return 0;
    return vehicle.currentBid ? vehicle.currentBid * 1.1 : vehicle.basePrice;
  }, [vehicle]);
  const winning = user && isWinning;
  const outbid = user && myHighestBid > 0 && !isWinning;
  const now = Date.now();
  const auctionPending = vehicle ? now < new Date(vehicle.startsAt).getTime() : false;
  const auctionClosed = vehicle ? now > new Date(vehicle.endsAt).getTime() : false;

  async function submitBid(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!user) {
      openAuth();
      return;
    }
    try {
      const data = await api(`/api/bids/${vehicleId}`, {
        method: "POST",
        body: JSON.stringify({ amount: Number(amount) })
      });
      myHighestBidRef.current = Math.max(myHighestBidRef.current, data.bid.amount);
      setMyHighestBid(myHighestBidRef.current);
      setIsWinning(true);
      setAmount("");
      setMessage("Oferta enviada correctamente.");
    } catch (err) {
      setError(err.message);
    }
  }

  if (!vehicle) {
    return (
      <section className="page">
        {loading ? <p className="muted">Cargando detalle...</p> : null}
        {error && <p className="error">{error}</p>}
      </section>
    );
  }

  return (
    <section className="page detail-page">
      <a className="link-button" href="#/"><ArrowLeft size={18} /> Volver al inventario</a>
      <div className="detail-layout">
        <div className="gallery">
          <img src={displayImageUrl(vehicle.photos[photoIndex], 1200)} alt={`${vehicle.brand} ${vehicle.model}`} />
          <div className="thumb-row">
            {vehicle.photos.map((photo, index) => (
              <button className={index === photoIndex ? "active-thumb" : ""} key={photo} onClick={() => setPhotoIndex(index)}>
                <img src={displayImageUrl(photo, 240)} alt={`Foto ${index + 1}`} loading="lazy" />
              </button>
            ))}
          </div>
        </div>

        <aside className="auction-panel">
          <p className="eyebrow">{vehicle.year} · {vehicle.articleType}</p>
          <h1>{vehicle.brand} {vehicle.model}</h1>
          <div className={`status-banner ${winning ? "win" : outbid ? "lost" : ""}`}>
            {winning ? <BadgeCheck size={18} /> : <CircleAlert size={18} />}
            {winning ? "¡Vas ganando esta subasta!" : outbid ? "Tu oferta ha sido superada. ¡Haz tu oferta ahora antes de que termine el tiempo!" : "Postores anónimos: solo se muestra el monto actual."}
          </div>
          <div className="price-box">
            <span>Oferta actual</span>
            <strong>Q. {currentBid.toLocaleString("es-GT", { minimumFractionDigits: 2 })}</strong>
            <small>Mínimo siguiente: Q. {minimum.toLocaleString("es-GT", { minimumFractionDigits: 2 })}</small>
          </div>
          <Countdown startsAt={vehicle.startsAt} endsAt={vehicle.endsAt} />
          <form className="bid-form" onSubmit={submitBid}>
            <input type="number" step="0.01" min={minimum} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Monto de oferta" />
            <button className="primary-button" disabled={auctionPending || auctionClosed}>
              <Send size={18} /> {auctionClosed ? "Cerrada" : auctionPending ? "Pendiente" : "Ofertar"}
            </button>
          </form>
          {message && <p className="success">{message}</p>}
          {error && <p className="error">{error}</p>}
        </aside>
      </div>

      <div className="info-grid">
        {[
          ["Motor", vehicle.engine],
          ["Transmisión", vehicle.transmission],
          ["Combustible", vehicle.fuelType],
          ["Tren de manejo", vehicle.drivetrain],
          ["Cilindros", vehicle.cylinders],
          ["Daño", vehicle.damageLevel],
          ["Monto base", `Q. ${vehicle.basePrice.toLocaleString("es-GT")}`],
          ["Pujas", vehicle.bidCount]
        ].map(([label, value]) => (
          <div className="info-item" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <section>
        <h2>Historial anónimo de pujas</h2>
        <div className="bid-list">
          {bids.length ? bids.map((bid) => (
            <div className="bid-item" key={bid.id}>
              <strong>Q. {bid.amount.toLocaleString("es-GT", { minimumFractionDigits: 2 })}</strong>
              <span>{new Date(bid.createdAt).toLocaleString()}</span>
            </div>
          )) : <p className="muted">Aún no hay pujas.</p>}
        </div>
      </section>
    </section>
  );
}
