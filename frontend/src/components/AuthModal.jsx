import { X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../state/AuthContext";

export function AuthModal({ onClose }) {
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      if (mode === "login") {
        await login({ email: payload.email, password: payload.password });
      } else {
        await register(payload);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <section className="modal-card">
        <button className="icon-button modal-close" onClick={onClose} title="Cerrar">
          <X size={18} />
        </button>
        <h2>{mode === "login" ? "Iniciar sesion" : "Crear cuenta"}</h2>
        <p className="muted">
          Para publicar o pujar debes iniciar sesion. El inventario queda visible para visitantes.
        </p>
        <form className="form-grid" onSubmit={submit}>
          {mode === "register" && (
            <>
              <label>
                Nombre
                <input name="firstName" required />
              </label>
              <label>
                Apellido
                <input name="lastName" required />
              </label>
              <label>
                Telefono
                <input name="phone" required />
              </label>
            </>
          )}
          <label>
            Correo
            <input name="email" type="email" required />
          </label>
          <label>
            Contraseña
            <input name="password" type="password" minLength={8} required />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="primary-button full" disabled={loading}>
            {loading ? "Validando..." : mode === "login" ? "Entrar" : "Registrarme"}
          </button>
        </form>
        <button className="link-button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Crear una cuenta nueva" : "Ya tengo cuenta"}
        </button>
      </section>
    </div>
  );
}
