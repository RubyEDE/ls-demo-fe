export interface Market {
  symbol: string;
  name: string;
  baseAsset: string;
  quoteAsset: string;
  oraclePrice: number | null;
  bestBid: number | null;
  bestAsk: number | null;
  spread: number | null;
  tickSize: number;
  lotSize: number;
  minOrderSize: number;
  maxOrderSize: number;
  maxLeverage: number;
  initialMarginRate?: number;
  maintenanceMarginRate?: number;
  fundingRate: number;
  volume24h: number;
  status: "active" | "paused" | "settlement";
}

export interface Order {
  orderId: string;
  marketSymbol: string;
  side: "buy" | "sell";
  type: "limit" | "market";
  price: number;
  quantity: number;
  filledQuantity: number;
  remainingQuantity: number;
  averagePrice: number;
  status: "pending" | "open" | "partial" | "filled" | "cancelled";
  createdAt: string;
  filledAt?: string;
  cancelledAt?: string;
}

export interface PlaceOrderParams {
  marketSymbol: string;
  side: "buy" | "sell";
  type: "limit" | "market";
  price?: number;
  quantity: number;
  leverage?: number;
  postOnly?: boolean;
  reduceOnly?: boolean;
}

export interface PlaceOrderResult {
  success: boolean;
  order?: Order;
  trades?: {
    id: string;
    price: number;
    quantity: number;
    side: "buy" | "sell";
    timestamp: string;
  }[];
  error?: string;
}

export interface UserTrade {
  tradeId: string;
  marketSymbol: string;
  side: "buy" | "sell";
  price: number;
  quantity: number;
  quoteQuantity: number;
  fee: number;
  isMaker: boolean;
  timestamp: string;
}
