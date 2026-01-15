import { useTradeHistory } from "../../hooks/use-trade-history";
import { useAuth } from "../../context/auth-context";
import type { UserTrade } from "../../types/clob";
import "./trade-history.css";

interface TradeHistoryProps {
  market?: string;
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatPrice(price: number): string {
  return price.toFixed(2);
}

function formatQuantity(qty: number): string {
  return qty.toFixed(4);
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  
  if (isToday) {
    return formatTime(timestamp);
  }
  
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  }) + " " + formatTime(timestamp);
}

function TradeRow({ trade }: { trade: UserTrade }) {
  return (
    <div className="trade-history-row">
      <div className="trade-history-info">
        <div className="trade-history-main">
          <span className={`trade-history-side ${trade.side}`}>
            {trade.side.toUpperCase()}
          </span>
          <span className="trade-history-symbol">{trade.marketSymbol}</span>
          {trade.isMaker && <span className="trade-history-maker">Maker</span>}
        </div>
        <div className="trade-history-details">
          <span className="trade-history-price">${formatPrice(trade.price)}</span>
          <span className="trade-history-qty">{formatQuantity(trade.quantity)}</span>
          <span className="trade-history-time">{formatDate(trade.timestamp)}</span>
        </div>
      </div>
      <div className="trade-history-values">
        <span className="trade-history-value">{formatMoney(trade.quoteQuantity)}</span>
        <span className="trade-history-fee">Fee: {formatMoney(trade.fee)}</span>
      </div>
    </div>
  );
}

export function TradeHistory({ market }: TradeHistoryProps) {
  const { isAuthenticated } = useAuth();
  const { trades, isLoading, hasMore, loadMore } = useTradeHistory({ market });

  if (!isAuthenticated) {
    return (
      <div className="trade-history-container">
        <div className="trade-history-header">
          <h3>Trade History</h3>
        </div>
        <div className="trade-history-empty">Sign in to view trade history</div>
      </div>
    );
  }

  if (isLoading && trades.length === 0) {
    return (
      <div className="trade-history-container">
        <div className="trade-history-header">
          <h3>Trade History</h3>
        </div>
        <div className="trade-history-loading">Loading trades...</div>
      </div>
    );
  }

  return (
    <div className="trade-history-container">
      <div className="trade-history-header">
        <h3>Trade History</h3>
      </div>

      {trades.length === 0 ? (
        <div className="trade-history-empty">No trades yet</div>
      ) : (
        <>
          <div className="trade-history-list">
            {trades.map((trade) => (
              <TradeRow key={trade.tradeId} trade={trade} />
            ))}
          </div>
          {hasMore && (
            <button
              className="trade-history-load-more"
              onClick={loadMore}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Load More"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
