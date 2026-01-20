import { useTradeFeed } from "../../hooks/use-trade-feed";
import type { Trade } from "../../types/websocket";
import "./trade-feed.css";

interface TradeFeedProps {
  symbol: string;
  maxTrades?: number;
}

function formatPrice(price: number): string {
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatQuantity(qty: number): string {
  if (qty >= 1000) {
    return (qty / 1000).toFixed(2) + "K";
  }
  return qty.toFixed(4);
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function TradeRow({ trade }: { trade: Trade }) {
  return (
    <div className={`trade-row ${trade.side}`}>
      <span className="trade-price">{formatPrice(trade.price)}</span>
      <span className="trade-quantity">{formatQuantity(trade.quantity)}</span>
      <span className="trade-time">{formatTime(trade.timestamp)}</span>
    </div>
  );
}

export function TradeFeed({ symbol, maxTrades = 50 }: TradeFeedProps) {
  const { trades, isConnected } = useTradeFeed(symbol, { maxTrades });

  if (!isConnected) {
    return (
      <div className="trade-feed-container">
        <div className="trade-feed-header">
          <h3>Recent Trades</h3>
        </div>
        <div className="trade-feed-loading">Connecting...</div>
      </div>
    );
  }

  return (
    <div className="trade-feed-container">
      <div className="trade-feed-header">
        <h3>Recent Trades</h3>
      </div>

      <div className="trade-feed-columns">
        <span>Price</span>
        <span>Qty</span>
        <span>Time</span>
      </div>

      <div className="trade-feed-list">
        {trades.length === 0 ? (
          <div className="no-trades">Waiting for trades...</div>
        ) : (
          trades.map((trade) => <TradeRow key={trade.id} trade={trade} />)
        )}
      </div>
    </div>
  );
}
