import { fetchWithAuth } from "./api";
import type { Market, Order, PlaceOrderParams, PlaceOrderResult } from "../types/clob";
import type { CandleInterval, CandleResponse, MarketStatus } from "../types/candles";
import type { Position, PositionSummary, ClosePositionResult } from "../types/position";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

// Markets (Public)
export async function getMarkets(): Promise<Market[]> {
  const res = await fetch(`${API_BASE}/clob/markets`);
  if (!res.ok) {
    throw new Error("Failed to fetch markets");
  }
  const data = await res.json();
  return data.markets;
}

export async function getMarket(symbol: string): Promise<Market> {
  const res = await fetch(`${API_BASE}/clob/markets/${symbol}`);
  if (!res.ok) {
    throw new Error("Failed to fetch market");
  }
  return res.json();
}

// Order Book (Public)
export async function getOrderBook(
  symbol: string,
  depth = 15
): Promise<{
  symbol: string;
  bids: { price: number; quantity: number; total: number }[];
  asks: { price: number; quantity: number; total: number }[];
  oraclePrice: number | null;
  timestamp: number;
}> {
  const res = await fetch(`${API_BASE}/clob/orderbook/${symbol}?depth=${depth}`);
  if (!res.ok) {
    throw new Error("Failed to fetch order book");
  }
  return res.json();
}

// Orders (Authenticated)
export async function placeOrder(params: PlaceOrderParams): Promise<PlaceOrderResult> {
  const res = await fetchWithAuth("/clob/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const data = await res.json();

  if (!res.ok) {
    return { success: false, error: data.message || "Failed to place order" };
  }

  return {
    success: true,
    order: data.order,
    trades: data.trades,
  };
}

export async function cancelOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetchWithAuth(`/clob/orders/${orderId}`, {
    method: "DELETE",
  });

  const data = await res.json();

  if (!res.ok) {
    return { success: false, error: data.message || "Failed to cancel order" };
  }

  return { success: data.success };
}

export async function getOpenOrders(market?: string): Promise<Order[]> {
  const url = market ? `/clob/orders?market=${market}` : "/clob/orders";
  const res = await fetchWithAuth(url);

  if (!res.ok) {
    throw new Error("Failed to fetch orders");
  }

  const data = await res.json();
  return data.orders;
}

export async function getOrderHistory(
  options: { market?: string; limit?: number; offset?: number } = {}
): Promise<{ orders: Order[]; pagination: { hasMore: boolean } }> {
  const params = new URLSearchParams();
  if (options.market) params.set("market", options.market);
  if (options.limit) params.set("limit", String(options.limit));
  if (options.offset) params.set("offset", String(options.offset));

  const res = await fetchWithAuth(`/clob/orders/history?${params}`);

  if (!res.ok) {
    throw new Error("Failed to fetch order history");
  }

  return res.json();
}

// Recent Trades (Public)
export async function getRecentTrades(
  symbol: string,
  limit = 50
): Promise<{ id: string; price: number; quantity: number; side: "buy" | "sell"; timestamp: string }[]> {
  const res = await fetch(`${API_BASE}/clob/trades/${symbol}?limit=${limit}`);
  if (!res.ok) {
    throw new Error("Failed to fetch trades");
  }
  const data = await res.json();
  return data.trades;
}

// Candles (Authenticated)
export async function getCandles(
  symbol: string,
  interval: CandleInterval = "5m",
  limit = 100
): Promise<CandleResponse> {
  // Strip -PERP suffix if present for the API call
  const baseSymbol = symbol.replace("-PERP", "");
  const res = await fetchWithAuth(`/finnhub/candles/${baseSymbol}?interval=${interval}&limit=${limit}`);

  if (!res.ok) {
    throw new Error("Failed to fetch candles");
  }

  return res.json();
}

// Market Status (Public)
export async function getMarketStatus(): Promise<MarketStatus> {
  const res = await fetch(`${API_BASE}/clob/market-status`);
  if (!res.ok) {
    throw new Error("Failed to fetch market status");
  }
  return res.json();
}

// Positions (Authenticated)
export async function getPositions(): Promise<Position[]> {
  const res = await fetchWithAuth("/clob/positions");
  if (!res.ok) {
    throw new Error("Failed to fetch positions");
  }
  const data = await res.json();
  return data.positions;
}

export async function getPositionSummary(): Promise<PositionSummary> {
  const res = await fetchWithAuth("/clob/positions/summary");
  if (!res.ok) {
    throw new Error("Failed to fetch position summary");
  }
  return res.json();
}

export async function getPosition(marketSymbol: string): Promise<Position | null> {
  const res = await fetchWithAuth(`/clob/positions/${marketSymbol}`);
  if (!res.ok) {
    throw new Error("Failed to fetch position");
  }
  const data = await res.json();
  return data.position;
}

export async function closePosition(
  marketSymbol: string,
  quantity?: number
): Promise<ClosePositionResult> {
  const res = await fetchWithAuth(`/clob/positions/${marketSymbol}/close`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quantity ? { quantity } : {}),
  });

  const data = await res.json();

  if (!res.ok) {
    return { success: false, closedQuantity: 0, order: null, position: null, error: data.message || "Failed to close position" };
  }

  return data;
}

export async function getPositionHistory(
  options: { market?: string; limit?: number; offset?: number } = {}
): Promise<{ positions: Position[]; pagination: { hasMore: boolean } }> {
  const params = new URLSearchParams();
  if (options.market) params.set("market", options.market);
  if (options.limit) params.set("limit", String(options.limit));
  if (options.offset) params.set("offset", String(options.offset));

  const res = await fetchWithAuth(`/clob/positions/history?${params}`);

  if (!res.ok) {
    throw new Error("Failed to fetch position history");
  }

  return res.json();
}
