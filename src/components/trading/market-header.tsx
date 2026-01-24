import { useState, useRef, useEffect } from "react";
import { usePriceFeed } from "../../hooks/use-price-feed";
import { useFundingInfo } from "../../hooks/use-funding";
import { useFundingUpdates } from "../../hooks/use-funding-updates";
import type { Market } from "../../types/clob";
import type { PriceUpdate } from "../../types/websocket";
import type { LastTradePrice } from "../../hooks/use-last-trade-prices";
import "./market-header.css";

interface MarketHeaderProps {
  markets: Market[];
  selectedMarket: Market | null;
  onSelectMarket: (symbol: string) => void;
  lastTradePrices?: Map<string, LastTradePrice>;
}

function formatPrice(price: number): string {
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) {
    return `${(volume / 1_000_000_000).toFixed(2)}B`;
  }
  if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(2)}M`;
  }
  if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(2)}K`;
  }
  return volume.toFixed(2);
}

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(4)}%`;
}

interface MarketDropdownProps {
  markets: Market[];
  selectedMarket: Market | null;
  prices: Map<string, PriceUpdate>;
  lastTradePrices?: Map<string, LastTradePrice>;
  onSelect: (symbol: string) => void;
}

function MarketDropdown({ markets, selectedMarket, prices, lastTradePrices, onSelect }: MarketDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prefer last trade price, fall back to price feed
  const getDisplayPrice = (baseAsset: string) => {
    const lastTrade = lastTradePrices?.get(baseAsset.toUpperCase());
    if (lastTrade) return lastTrade.price;
    const priceFeed = prices.get(baseAsset.toUpperCase());
    if (priceFeed) return priceFeed.price;
    return null;
  };

  const selectedDisplayPrice = selectedMarket ? getDisplayPrice(selectedMarket.baseAsset) : null;
  const selectedLastTrade = selectedMarket ? lastTradePrices?.get(selectedMarket.baseAsset.toUpperCase()) : null;

  const getMarketImagePath = (baseAsset: string) => {
    return `/images/markets/${baseAsset}.png`;
  };

  const formatMarketName = (baseAsset: string) => {
    return baseAsset
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <div className="market-dropdown" ref={dropdownRef}>
      <button className="market-dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
        {selectedMarket && (
          <img
            src={getMarketImagePath(selectedMarket.baseAsset)}
            alt={selectedMarket.baseAsset}
            className="market-dropdown-image"
          />
        )}
        <div className="market-dropdown-selected">
          <span className="market-symbol">{selectedMarket ? formatMarketName(selectedMarket.baseAsset) : "Select"}</span>
          {selectedDisplayPrice !== null && (
            <span className={`market-price ${selectedLastTrade?.side === "buy" ? "price-up" : selectedLastTrade?.side === "sell" ? "price-down" : ""}`}>
              {formatPrice(selectedDisplayPrice)}
            </span>
          )}
        </div>
        <svg
          className={`dropdown-arrow ${isOpen ? "open" : ""}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="market-dropdown-menu">
          {markets.map((market) => {
            const priceFeed = prices.get(market.baseAsset.toUpperCase());
            const lastTrade = lastTradePrices?.get(market.baseAsset.toUpperCase());
            const displayPrice = lastTrade?.price ?? priceFeed?.price ?? null;
            const isSelected = selectedMarket?.symbol === market.symbol;

            return (
              <button
                key={market.symbol}
                className={`market-dropdown-item ${isSelected ? "selected" : ""}`}
                onClick={() => {
                  onSelect(market.baseAsset);
                  setIsOpen(false);
                }}
              >
                <img
                  src={getMarketImagePath(market.baseAsset)}
                  alt={market.baseAsset}
                  className="market-item-image"
                />
                <span className="item-symbol">{formatMarketName(market.baseAsset)}</span>
                <span className={`item-price ${lastTrade?.side === "buy" ? "price-up" : lastTrade?.side === "sell" ? "price-down" : ""}`}>
                  {displayPrice !== null ? formatPrice(displayPrice) : "--"}
                </span>
            
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: string;
  subValue?: string;
  isPositive?: boolean;
  isNegative?: boolean;
}

function StatItem({ label, value, subValue, isPositive, isNegative }: StatItemProps) {
  return (
    <div className="stat-item">
      <span className="stat-label">{label}</span>
      <span
        className={`stat-value ${isPositive ? "positive" : ""} ${isNegative ? "negative" : ""}`}
      >
        {value}
        {subValue && <span className="stat-sub">{subValue}</span>}
      </span>
    </div>
  );
}

function getTimeUntilFunding(isoString: string | undefined): string {
  if (!isoString) return "--";
  const target = new Date(isoString);
  const now = new Date();
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) return "Now";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
}

// Calculate next funding time (8-hour intervals: 00:00, 08:00, 16:00 UTC)
function getNextFundingTime(): string {
  const now = new Date();
  const utcHours = now.getUTCHours();
  
  // Find next 8-hour boundary
  let nextHour: number;
  if (utcHours < 8) {
    nextHour = 8;
  } else if (utcHours < 16) {
    nextHour = 16;
  } else {
    nextHour = 24; // Next day 00:00
  }
  
  const next = new Date(now);
  next.setUTCHours(nextHour % 24, 0, 0, 0);
  if (nextHour === 24) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  
  return next.toISOString();
}

// Calculate predicted funding rate based on premium
// Formula: fundingRate = clamp(premium * dampeningFactor, -1%, +1%)
function calculatePredictedFundingRate(markPrice: number | null, indexPrice: number | null): number {
  if (!markPrice || !indexPrice || indexPrice === 0) return 0;
  
  const premium = (markPrice - indexPrice) / indexPrice;
  const dampeningFactor = 0.1; // 10% of premium
  const fundingRate = premium * dampeningFactor;
  
  // Clamp to [-1%, +1%] per funding interval
  return Math.max(-0.01, Math.min(0.01, fundingRate));
}

export function MarketHeader({ markets, selectedMarket, onSelectMarket, lastTradePrices }: MarketHeaderProps) {
  const symbols = markets.map((m) => m.baseAsset);
  const { prices } = usePriceFeed(symbols);

  // Funding rate data
  const { data: fundingData } = useFundingInfo(selectedMarket?.symbol || "");
  const { fundingData: liveFundingData } = useFundingUpdates(selectedMarket?.symbol || "");

  const selectedPrice = selectedMarket
    ? prices.get(selectedMarket.baseAsset.toUpperCase())
    : null;

  // Get last trade price for this market
  const lastTradePrice = selectedMarket
    ? lastTradePrices?.get(selectedMarket.baseAsset.toUpperCase())?.price ?? null
    : null;

  // Calculate mark price: weighted average of order book mid-price and last trade price
  // This creates more realistic funding rates based on actual trading activity
  const orderBookMid = selectedMarket?.bestBid && selectedMarket?.bestAsk
    ? (selectedMarket.bestBid + selectedMarket.bestAsk) / 2
    : null;
  
  const markPrice = selectedMarket
    ? orderBookMid && lastTradePrice
      ? (orderBookMid * 0.5 + lastTradePrice * 0.5) // Blend order book and last trade
      : orderBookMid ?? lastTradePrice ?? selectedMarket.oraclePrice
    : null;

  // Get index price (oracle price)
  const indexPrice = selectedMarket?.oraclePrice ?? null;

  // Calculate predicted funding rate based on premium if backend returns 0 or no data
  const backendFundingRate = liveFundingData?.fundingRate ?? fundingData?.fundingRate ?? selectedMarket?.fundingRate;
  const predictedFundingRate = calculatePredictedFundingRate(markPrice, indexPrice);
  
  // Use backend rate if non-zero, otherwise use our predicted rate
  const fundingRate = (backendFundingRate && backendFundingRate !== 0) 
    ? backendFundingRate 
    : predictedFundingRate;

  // Get next funding time from backend or calculate locally
  const nextFundingTime = liveFundingData?.nextFundingTime
    ? new Date(liveFundingData.nextFundingTime).toISOString()
    : fundingData?.nextFundingTime ?? getNextFundingTime();

  const change24h = selectedPrice?.change || 0;
  const changePercent = selectedPrice?.changePercent || 0;
  const isPositiveChange = change24h >= 0;
  const isFundingPositive = fundingRate >= 0;

  return (
    <div className="market-header">
      <MarketDropdown
        markets={markets}
        selectedMarket={selectedMarket}
        prices={prices}
        lastTradePrices={lastTradePrices}
        onSelect={onSelectMarket}
      />

      <div className="market-stats">
        <StatItem
          label="Leverage"
          value={`${selectedMarket?.maxLeverage || 0}x`}
        />
        <StatItem
          label="Mark"
          value={markPrice ? formatPrice(markPrice) : "--"}
        />
        <StatItem
          label="Index"
          value={selectedMarket?.oraclePrice ? formatPrice(selectedMarket.oraclePrice) : "--"}
        />
        <StatItem
          label="24H Change"
          value={selectedPrice ? `${isPositiveChange ? "+" : ""}${change24h.toFixed(2)}` : "--"}
          subValue={selectedPrice ? ` / ${isPositiveChange ? "+" : ""}${changePercent.toFixed(2)}%` : undefined}
          isPositive={isPositiveChange && !!selectedPrice}
          isNegative={!isPositiveChange && !!selectedPrice}
        />
        <StatItem
          label="24H Volume"
          value={selectedMarket ? formatVolume(selectedMarket.volume24h) : "--"}
        />
        <StatItem
          label="Funding"
          value={formatPercent(fundingRate)}
          subValue={` (${getTimeUntilFunding(nextFundingTime)})`}
          isPositive={isFundingPositive}
          isNegative={!isFundingPositive}
        />
      </div>
    </div>
  );
}
