import { useTradeHistory } from "../../hooks/use-trade-history";
import { useAuth } from "../../context/auth-context";
import type { UserTrade } from "../../types/clob";
import { SwordLoader } from "../sword-loader";
import "./trade-history.css";

interface TradeHistoryProps {
  market?: string;
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
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
  const date = new Date(timestamp);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  return (
    date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }) +
    " " +
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  );
}

function formatMarketName(marketSymbol: string): string {
  // Remove -PERP suffix and format: "GLOVE-CASE-PERP" -> "Glove Case"
  return marketSymbol
    .replace("-PERP", "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getMarketImagePath(marketSymbol: string): string {
  // "GLOVE-CASE-PERP" -> "/images/markets/GLOVE-CASE.png"
  const baseAsset = marketSymbol.replace("-PERP", "");
  return `/images/markets/${baseAsset}.png`;
}

function TradeRow({ trade }: { trade: UserTrade }) {
  return (
    <tr>
      <td className="col-symbol">
        <img
          src={getMarketImagePath(trade.marketSymbol)}
          alt={trade.marketSymbol}
          className="market-image"
        />
        {formatMarketName(trade.marketSymbol)}
      </td>
      <td className={`col-side ${trade.side}`}>{trade.side.toUpperCase()}</td>
      <td className="col-type">
        {trade.isMaker ? <span className="maker-badge">Maker</span> : <span className="taker-badge">Taker</span>}
      </td>
      <td className="col-price">{formatPrice(trade.price)}</td>
      <td className="col-qty">{formatQuantity(trade.quantity)}</td>
      <td className="col-value">{formatMoney(trade.quoteQuantity)}</td>
      <td className="col-time">{formatTime(trade.timestamp)}</td>
    </tr>
  );
}

export function TradeHistory({ market }: TradeHistoryProps) {
  const { isAuthenticated } = useAuth();
  const { trades, isLoading, hasMore, error, loadMore, refresh } = useTradeHistory({ market });

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
        <div className="trade-history-loading">
          <SwordLoader size="small" showParticles={false} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trade-history-container">
        <div className="trade-history-header">
          <h3>Trade History</h3>
        </div>
        <div className="trade-history-error">
          <span>Error: {error}</span>
          <button onClick={refresh} className="trade-history-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="trade-history-container">
      <div className="trade-history-header">
        <h3>Trade History ({trades.length}{hasMore ? "+" : ""})</h3>
      </div>

      {trades.length === 0 ? (
        <div className="trade-history-empty">No trades yet</div>
      ) : (
        <>
          <div className="trades-table-wrapper">
            <table className="trades-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Value</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <TradeRow key={trade.tradeId} trade={trade} />
                ))}
              </tbody>
            </table>
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
