import { fetchWithAuth } from "./api";

// Types
export interface Balance {
  address: string;
  free: number;
  locked: number;
  total: number;
  totalCredits: number;
  totalDebits: number;
}

export interface BalanceChange {
  amount: number;
  type: "credit" | "debit" | "lock" | "unlock";
  reason: string;
  timestamp: string;
  referenceId?: string;
}

export interface FaucetRequestResponse {
  success: boolean;
  amount: number;
  balance: {
    free: number;
    locked: number;
    total: number;
  };
  nextRequestAt: string;
}

export interface FaucetStats {
  totalRequests: number;
  totalAmountReceived: number;
  lastRequestAt: string | null;
  nextRequestAt: string | null;
  canRequest: boolean;
}

export interface FaucetHistoryItem {
  amount: number;
  createdAt: string;
}

export interface GlobalStats {
  totalRequests: number;
  totalAmountDistributed: number;
  uniqueUsers: number;
}

// API Functions
export async function getBalance(): Promise<Balance> {
  const res = await fetchWithAuth("/faucet/balance");
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to fetch balance" }));
    throw new Error(error.message);
  }
  return res.json();
}

export async function getBalanceHistory(
  limit = 50,
  offset = 0
): Promise<{ history: BalanceChange[]; limit: number; offset: number }> {
  const res = await fetchWithAuth(`/faucet/balance/history?limit=${limit}&offset=${offset}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to fetch history" }));
    throw new Error(error.message);
  }
  return res.json();
}

export async function requestFromFaucet(): Promise<FaucetRequestResponse> {
  const res = await fetchWithAuth("/faucet/request", { method: "POST" });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Faucet request failed" }));
    throw new Error(error.message);
  }
  return res.json();
}

export async function getFaucetStats(): Promise<FaucetStats> {
  const res = await fetchWithAuth("/faucet/stats");
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to fetch stats" }));
    throw new Error(error.message);
  }
  return res.json();
}

export async function getFaucetHistory(
  limit = 50,
  offset = 0
): Promise<{ history: FaucetHistoryItem[]; limit: number; offset: number }> {
  const res = await fetchWithAuth(`/faucet/history?limit=${limit}&offset=${offset}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to fetch history" }));
    throw new Error(error.message);
  }
  return res.json();
}

export async function lockBalance(
  amount: number,
  reason: string
): Promise<{ success: boolean; balance: { free: number; locked: number; total: number } }> {
  const res = await fetchWithAuth("/faucet/lock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, reason }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to lock balance" }));
    throw new Error(error.message);
  }
  return res.json();
}

export async function unlockBalance(
  amount: number,
  reason: string
): Promise<{ success: boolean; balance: { free: number; locked: number; total: number } }> {
  const res = await fetchWithAuth("/faucet/unlock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, reason }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to unlock balance" }));
    throw new Error(error.message);
  }
  return res.json();
}

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

export async function getGlobalStats(): Promise<GlobalStats> {
  const res = await fetch(`${API_BASE}/faucet/global-stats`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Failed to fetch global stats" }));
    throw new Error(error.message);
  }
  return res.json();
}
