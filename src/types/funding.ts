export interface FundingInfo {
  marketSymbol: string;
  fundingRate: number;
  fundingRatePercent: string;
  predictedFundingRate: number;
  predictedFundingRatePercent: string;
  annualizedRate: number;
  annualizedRatePercent: string;
  markPrice: number;
  indexPrice: number;
  premium: number;
  premiumPercent: string;
  nextFundingTime: string;
  fundingIntervalHours: number;
  lastFunding: {
    fundingRate: number;
    timestamp: string;
    positionsProcessed: number;
  } | null;
}

export interface FundingHistoryEntry {
  fundingRate: number;
  fundingRatePercent: string;
  timestamp: string;
  longPayment: number;
  shortPayment: number;
  totalLongSize: number;
  totalShortSize: number;
  positionsProcessed: number;
}

export interface FundingHistoryResponse {
  marketSymbol: string;
  fundingHistory: FundingHistoryEntry[];
  count: number;
}

export interface FundingEstimate {
  marketSymbol: string;
  side: "long" | "short";
  size: number;
  fundingRate: number;
  fundingRatePercent: string;
  estimatedPayment: number;
  paymentDirection: "pay" | "receive";
  nextFundingTime: string;
  fundingIntervalHours: number;
}

export interface FundingUpdate {
  symbol: string;
  fundingRate: number;
  predictedFundingRate: number;
  markPrice: number;
  indexPrice: number;
  premium: number;
  nextFundingTime: number;
  timestamp: number;
}

export interface FundingPayment {
  symbol: string;
  fundingRate: number;
  totalLongPayment: number;
  totalShortPayment: number;
  positionsProcessed: number;
  timestamp: number;
}

export interface FundingStats {
  totalFundingProcessed: number;
  totalPaymentsDistributed: number;
  lastFundingAt: string;
  isEngineRunning: boolean;
}
