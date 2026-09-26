import { LogOut, Plus, Search, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthModal } from "./components/AuthModal";
import { InventoryPage } from "./pages/InventoryPage";
import { MyVehiclesPage } from "./pages/MyVehiclesPage";
import { PublishPage } from "./pages/PublishPage";
import { VehicleDetailPage } from "./pages/VehicleDetailPage";
import { useAuth } from "./state/AuthContext";

export function App() {
  const [route, setRoute] = useState(window.location.hash || "#/");
  const [showAuth, setShowAuth] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || "#/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function navigate(hash) {
    window.location.hash = hash;
  }

  const detailMatch = route.match(/^#\/vehiculos\/(\d+)/);
  const editMatch = route.match(/^#\/editar\/(\d+)/);

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => navigate("#/")} title="Ir al inventario">
          <ShieldCheck size={28} />
          <span>Copart UMG Subastas</span>
        </button>

        <nav className="nav-actions">
          <button className="ghost-button" onClick={() => navigate("#/")}>
            <Search size={18} />
            Inventario
          </button>
          {user && (
            <>
              <button className="ghost-button" onClick={() => navigate("#/mis-vehiculos")}>
                <UserRound size={18} />
                Mis publicaciones
              </button>
              <button className="primary-button" onClick={() => navigate("#/publicar")}>
                <Plus size={18} />
                Publicar
              </button>
            </>
          )}
          {user ? (
            <button className="ghost-button" onClick={logout}>
              <LogOut size={18} />
              Salir
            </button>
          ) : (
            <button className="primary-button" onClick={() => setShowAuth(true)}>
              Iniciar sesion
            </button>
          )}
        </nav>
      </header>

      <main>
        {detailMatch ? (
          <VehicleDetailPage vehicleId={detailMatch[1]} openAuth={() => setShowAuth(true)} />
        ) : editMatch ? (
          <PublishPage vehicleId={editMatch[1]} />
        ) : route === "#/publicar" ? (
          <PublishPage />
        ) : route === "#/mis-vehiculos" ? (
          <MyVehiclesPage />
        ) : (
          <InventoryPage />
        )}
      </main>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
