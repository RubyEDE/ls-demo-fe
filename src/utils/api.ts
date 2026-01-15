const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem("auth_token");
  const expiresAt = Number(localStorage.getItem("auth_expires"));

  // Check if token is expired before making request
  if (expiresAt && expiresAt < Date.now()) {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_address");
    localStorage.removeItem("auth_expires");
    throw new AuthError("Session expired. Please sign in again.");
  }

  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid - clear storage
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_address");
    localStorage.removeItem("auth_expires");
    throw new AuthError("Session expired. Please sign in again.");
  }

  return response;
}

// Convenience methods
export async function getWithAuth<T>(endpoint: string): Promise<T> {
  const res = await fetchWithAuth(endpoint);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message);
  }
  return res.json();
}

export async function postWithAuth<T>(endpoint: string, data: unknown): Promise<T> {
  const res = await fetchWithAuth(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message);
  }
  return res.json();
}

// Example usage
export async function getProfile() {
  return getWithAuth<{ address: string; chainId: number }>("/auth/me");
}
