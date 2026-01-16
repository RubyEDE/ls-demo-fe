export type CandleInterval = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

// Internal candle format used by the app (uses `time` in milliseconds)
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trades: number;
  isClosed: boolean;
  isMarketOpen: boolean;
}

// Raw candle format from API (uses `timestamp`)
export interface CandleRaw {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trades: number;
  isClosed: boolean;
  isMarketOpen?: boolean;
}

// WebSocket candle update format
export interface CandleUpdateRaw {
  symbol: string;
  interval: CandleInterval;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trades: number;
  isClosed: boolean;
  isMarketOpen?: boolean;
}

export interface MarketStatus {
  isOpen: boolean;
  nextOpen: string | null;
  nextClose: string | null;
}

// Raw API response format
export interface CandleResponseRaw {
  symbol: string;
  interval: CandleInterval;
  marketStatus: MarketStatus;
  candles: CandleRaw[];
  currentCandle: CandleRaw | null;
  meta: {
    count: number;
    hasEnoughData: boolean;
    available: number;
    required: number;
  };
}

// Transformed response format used by the app
export interface CandleResponse {
  symbol: string;
  interval: CandleInterval;
  marketStatus: MarketStatus;
  candles: Candle[];
  current: Candle | null;
  meta: {
    count: number;
    hasEnoughData: boolean;
  };
}
