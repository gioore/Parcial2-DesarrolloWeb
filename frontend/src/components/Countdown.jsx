import { useEffect, useState } from "react";

function format(ms) {
  if (ms <= 0) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const hours = String(Math.floor(total / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function Countdown({ startsAt, endsAt }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  if (now < start) return <span className="timer">Inicia en {format(start - now)}</span>;
  if (now > end) return <span className="timer closed">Cerrada</span>;
  return <span className="timer">Termina en {format(end - now)}</span>;
}
