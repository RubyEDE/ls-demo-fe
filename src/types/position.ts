export type PositionSide = "long" | "short";
export type PositionStatus = "open" | "closed" | "liquidated";

export interface Position {
  positionId: string;
  marketSymbol: string;
  side: PositionSide;
  size: number;
  entryPrice: number;
  markPrice: number | null;
  margin: number;
  leverage: number;
  unrealizedPnl: number;
  realizedPnl: number;
  liquidationPrice: number;
  accumulatedFunding?: number;
  totalFeesPaid?: number;
  status: PositionStatus;
  openedAt: string;
  closedAt?: string | null;
}

export interface PositionSummary {
  totalPositions: number;
  totalMargin: number;
  totalUnrealizedPnl: number;
  totalRealizedPnl: number;
  totalEquity: number;
}

export interface ClosePositionResult {
  success: boolean;
  closedQuantity: number;
  order: {
    orderId: string;
    averagePrice: number;
    status: string;
  } | null;
  position: {
    positionId: string;
    side: PositionSide;
    size: number;
    realizedPnl: number;
    status: PositionStatus;
  } | null;
  error?: string;
}

// WebSocket position update event
export interface PositionUpdate {
  positionId: string;
  marketSymbol: string;
  side: PositionSide;
  size: number;
  entryPrice: number;
  markPrice: number;
  margin: number;
  leverage: number;
  unrealizedPnl: number;
  realizedPnl: number;
  liquidationPrice: number;
  status: PositionStatus;
  timestamp: number;
}
