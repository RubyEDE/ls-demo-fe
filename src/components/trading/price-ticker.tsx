import { useMemo } from "react";
import { usePriceFeed } from "../../hooks/use-price-feed";
import type { PriceUpdate } from "../../types/websocket";
import "./price-ticker.css";

interface PriceTickerProps {
  symbols: string[];
  onSelectSymbol?: (symbol: string) => void;
  selectedSymbol?: string;
}

function formatPrice(price: number): string {
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatChange(change: number, percent: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)} (${sign}${percent.toFixed(2)}%)`;
}

function TickerItem({
  symbol,
  price,
  isSelected,
  onSelect,
}: {
  symbol: string;
  price: PriceUpdate | undefined;
  isSelected: boolean;
  onSelect?: () => void;
}) {
  const isPositive = price ? price.change >= 0 : true;

  return (
    <button
      className={`ticker-item ${isSelected ? "selected" : ""} ${price ? "" : "loading"}`}
      onClick={onSelect}
    >
      <span className="ticker-symbol">{symbol}</span>
      {price ? (
        <>
          <span className="ticker-price">${formatPrice(price.price)}</span>
          <span className={`ticker-change ${isPositive ? "positive" : "negative"}`}>
            {formatChange(price.change, price.changePercent)}
          </span>
        </>
      ) : (
        <span className="ticker-price loading">--</span>
      )}
    </button>
  );
}

export function PriceTicker({ symbols, onSelectSymbol, selectedSymbol }: PriceTickerProps) {
  const { prices, isConnected } = usePriceFeed(symbols);

  const symbolList = useMemo(() => symbols.map((s) => s.toUpperCase()), [symbols]);

  if (!isConnected) {
    return (
      <div className="price-ticker disconnected">
        <span className="ticker-loading">Connecting to price feed...</span>
      </div>
    );
  }

  return (
    <div className="price-ticker">
      {symbolList.map((symbol) => (
        <TickerItem
          key={symbol}
          symbol={symbol}
          price={prices.get(symbol)}
          isSelected={selectedSymbol === symbol}
          onSelect={() => onSelectSymbol?.(symbol)}
        />
      ))}
    </div>
  );
}
