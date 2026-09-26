import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../state/AuthContext";

export function AuthModal({ initialMode = "login", onClose }) {
  const [mode, setMode] = useState(initialMode);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  useEffect(() => {
    setMode(initialMode);
    setError("");
  }, [initialMode]);

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
  }

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
        <button className="icon-button modal-close" onClick={onClose} title="Cerrar" aria-label="Cerrar">
          <X size={18} />
        </button>
        <h2>{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</h2>
        <p className="muted">
          Para publicar o pujar debes iniciar sesión. El inventario queda visible para visitantes.
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
                Teléfono
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
        <button className="link-button" onClick={() => switchMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Crear una cuenta nueva" : "Ya tengo cuenta"}
        </button>
      </section>
    </div>
  );
}
