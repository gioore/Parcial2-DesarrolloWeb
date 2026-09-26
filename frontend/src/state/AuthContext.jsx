import { createContext, useContext, useMemo, useState } from "react";
import { api, clearSession, getStoredUser, setSession } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());

  async function login(credentials) {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials)
    });
    setSession(data);
    setUser(data.user);
  }

  async function register(payload) {
    const data = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    setSession(data);
    setUser(data.user);
  }

  function logout() {
    clearSession();
    setUser(null);
  }

  const value = useMemo(() => ({ user, login, register, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
