const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function getApiUrl() {
  return API_URL;
}

export function getToken() {
  return localStorage.getItem("copart_token");
}

export function setSession({ token, user }) {
  localStorage.setItem("copart_token", token);
  localStorage.setItem("copart_user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("copart_token");
  localStorage.removeItem("copart_user");
}

export function getStoredUser() {
  const raw = localStorage.getItem("copart_user");
  return raw ? JSON.parse(raw) : null;
}

export async function api(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "No se pudo completar la operacion.");
  }
  return data;
}
