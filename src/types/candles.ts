export type CandleInterval = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

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

// WebSocket candle update uses "timestamp" instead of "time"
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
  currentTimeET: string;
  nextOpen: string | null;
  nextClose: string | null;
}

export interface CandleResponse {
  symbol: string;
  interval: CandleInterval;
  marketStatus: MarketStatus;
  t: number[];
  o: number[];
  h: number[];
  l: number[];
  c: number[];
  v: number[];
  candles: Candle[];
  current: Candle | null;
  meta: {
    count: number;
    hasEnoughData: boolean;
    firstCandle: number | null;
    lastCandle: number | null;
  };
}
