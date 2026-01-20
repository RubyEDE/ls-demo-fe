import { useFundingInfo } from "../../hooks/use-funding";
import { useFundingUpdates } from "../../hooks/use-funding-updates";

interface FundingRateDisplayProps {
  symbol: string;
}

function getTimeUntil(isoString: string): string {
  const target = new Date(isoString);
  const now = new Date();
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) return "Now";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
}

export function FundingRateDisplay({ symbol }: FundingRateDisplayProps) {
  const { data, isLoading } = useFundingInfo(symbol);
  const { fundingData } = useFundingUpdates(symbol);

  // Use real-time data if available, otherwise fall back to REST data
  const fundingRate = fundingData?.fundingRate ?? data?.fundingRate;
  const predictedRate = fundingData?.predictedFundingRate ?? data?.predictedFundingRate;
  const markPrice = fundingData?.markPrice ?? data?.markPrice;
  const indexPrice = fundingData?.indexPrice ?? data?.indexPrice;
  const premium = fundingData?.premium ?? data?.premium;
  const nextFundingTime = fundingData?.nextFundingTime
    ? new Date(fundingData.nextFundingTime).toISOString()
    : data?.nextFundingTime;

  if (isLoading || fundingRate === undefined) {
    return <div className="funding-rate-display loading">--</div>;
  }

  const isPositive = fundingRate >= 0;
  const isPredictedPositive = (predictedRate ?? 0) >= 0;
  const isPremiumPositive = (premium ?? 0) >= 0;

  const formatRate = (rate: number) => {
    const percent = (rate * 100).toFixed(4);
    return `${rate >= 0 ? "+" : ""}${percent}%`;
  };

  return (
    <div className="funding-rate-display">
      <div className="funding-header">
        <span className="label">Funding Rate</span>
        <span className="interval">/ {data?.fundingIntervalHours || 8}h</span>
      </div>

      <div className={`funding-value ${isPositive ? "positive" : "negative"}`}>
        {formatRate(fundingRate)}
      </div>

      <div className="funding-details">
        <div className="detail">
          <span className="label">Predicted</span>
          <span className={isPredictedPositive ? "positive" : "negative"}>
            {predictedRate !== undefined ? formatRate(predictedRate) : "--"}
          </span>
        </div>

        <div className="detail">
          <span className="label">Next Funding</span>
          <span className="countdown">
            {nextFundingTime ? getTimeUntil(nextFundingTime) : "--"}
          </span>
        </div>
      </div>

      <div className="price-info">
        <div className="price-row">
          <span>Mark Price</span>
          <span>${markPrice?.toFixed(2) ?? "--"}</span>
        </div>
        <div className="price-row">
          <span>Index Price</span>
          <span>${indexPrice?.toFixed(2) ?? "--"}</span>
        </div>
        <div className="price-row">
          <span>Premium</span>
          <span className={isPremiumPositive ? "positive" : "negative"}>
            {premium !== undefined ? formatRate(premium) : "--"}
          </span>
        </div>
      </div>

      {data?.annualizedRatePercent && (
        <div className="annualized-rate">
          <span className="label">Annualized</span>
          <span className={isPositive ? "positive" : "negative"}>
            {data.annualizedRatePercent}
          </span>
        </div>
      )}
    </div>
  );
}
