// Price Feed Types
export interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume?: number;
  timestamp: number;
}

// Order Book Types
export interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

export interface OrderBookSnapshot {
  symbol: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  timestamp: number;
}

export interface OrderBookUpdate {
  symbol: string;
  side: "bid" | "ask";
  price: number;
  quantity: number;
  timestamp: number;
}

// Trade Types
export interface Trade {
  id: string;
  symbol: string;
  price: number;
  quantity: number;
  side: "buy" | "sell";
  timestamp: number;
}

// Order Events (Authenticated)
export interface OrderEvent {
  orderId: string;
  symbol: string;
  side: "buy" | "sell";
  type: "limit" | "market";
  price?: number;
  quantity: number;
  filledQuantity: number;
  status: "pending" | "partial" | "filled" | "cancelled";
  timestamp: number;
}

// Balance Update (Authenticated)
export interface BalanceUpdate {
  free: number;
  locked: number;
  total: number;
  timestamp: number;
}

// Position Events (Authenticated)
export interface PositionEvent {
  positionId: string;
  marketSymbol: string;
  side: "long" | "short";
  size: number;
  entryPrice: number;
  markPrice: number;
  margin: number;
  leverage: number;
  unrealizedPnl: number;
  realizedPnl: number;
  liquidationPrice: number;
  status: "open" | "closed" | "liquidated";
  timestamp: number;
}

// WebSocket Error
export interface WSError {
  code: string;
  message: string;
}
