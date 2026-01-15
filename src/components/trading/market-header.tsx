import { useState, useRef, useEffect } from "react";
import { usePriceFeed } from "../../hooks/use-price-feed";
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
    return `$${(volume / 1_000_000_000).toFixed(2)}B`;
  }
  if (volume >= 1_000_000) {
    return `$${(volume / 1_000_000).toFixed(2)}M`;
  }
  if (volume >= 1_000) {
    return `$${(volume / 1_000).toFixed(2)}K`;
  }
  return `$${volume.toFixed(2)}`;
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

  return (
    <div className="market-dropdown" ref={dropdownRef}>
      <button className="market-dropdown-trigger" onClick={() => setIsOpen(!isOpen)}>
        <div className="market-dropdown-selected">
          <span className="market-symbol">{selectedMarket?.baseAsset || "Select"}-PERP</span>
          {selectedDisplayPrice !== null && (
            <span className={`market-price ${selectedLastTrade?.side === "buy" ? "price-up" : selectedLastTrade?.side === "sell" ? "price-down" : ""}`}>
              ${formatPrice(selectedDisplayPrice)}
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
            const isPositive = priceFeed ? priceFeed.change >= 0 : true;

            return (
              <button
                key={market.symbol}
                className={`market-dropdown-item ${isSelected ? "selected" : ""}`}
                onClick={() => {
                  onSelect(market.baseAsset);
                  setIsOpen(false);
                }}
              >
                <span className="item-symbol">{market.baseAsset}-PERP</span>
                <span className={`item-price ${lastTrade?.side === "buy" ? "price-up" : lastTrade?.side === "sell" ? "price-down" : ""}`}>
                  {displayPrice !== null ? `$${formatPrice(displayPrice)}` : "--"}
                </span>
                <span className={`item-change ${isPositive ? "positive" : "negative"}`}>
                  {priceFeed ? `${isPositive ? "+" : ""}${priceFeed.changePercent.toFixed(2)}%` : "--"}
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

export function MarketHeader({ markets, selectedMarket, onSelectMarket, lastTradePrices }: MarketHeaderProps) {
  const symbols = markets.map((m) => m.baseAsset);
  const { prices } = usePriceFeed(symbols);

  const selectedPrice = selectedMarket
    ? prices.get(selectedMarket.baseAsset.toUpperCase())
    : null;

  const markPrice = selectedMarket
    ? selectedMarket.bestBid && selectedMarket.bestAsk
      ? (selectedMarket.bestBid + selectedMarket.bestAsk) / 2
      : selectedMarket.oraclePrice
    : null;

  const change24h = selectedPrice?.change || 0;
  const changePercent = selectedPrice?.changePercent || 0;
  const isPositiveChange = change24h >= 0;

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
          label="Oracle"
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
          value={selectedMarket ? formatPercent(selectedMarket.fundingRate) : "--"}
        />
      </div>
    </div>
  );
}
