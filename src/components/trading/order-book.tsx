import { useMemo } from "react";
import { useOrderBook } from "../../hooks/use-order-book";
import type { OrderBookEntry } from "../../types/websocket";
import "./order-book.css";

interface OrderBookProps {
  symbol: string;
  depth?: number;
  onPriceClick?: (price: number) => void;
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

function OrderRow({
  entry,
  side,
  maxTotal,
  onClick,
}: {
  entry: OrderBookEntry;
  side: "bid" | "ask";
  maxTotal: number;
  onClick?: () => void;
}) {
  const depthPercent = maxTotal > 0 ? (entry.total / maxTotal) * 100 : 0;

  return (
    <div
      className={`order-row ${side} ${onClick ? "clickable" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      <div
        className="depth-bar"
        style={{ width: `${Math.min(depthPercent, 100)}%` }}
      />
      <span className="order-price">{formatPrice(entry.price)}</span>
      <span className="order-quantity">{formatQuantity(entry.quantity)}</span>
      <span className="order-total">{formatPrice(entry.total)}</span>
    </div>
  );
}

export function OrderBook({ symbol, depth = 10, onPriceClick }: OrderBookProps) {
  const { orderBook, isConnected } = useOrderBook(symbol);

  const { asks, bids, maxTotal } = useMemo(() => {
    if (!orderBook) {
      return { asks: [], bids: [], maxTotal: 0 };
    }

    const slicedAsks = orderBook.asks.slice(0, depth).reverse();
    const slicedBids = orderBook.bids.slice(0, depth);

    const allTotals = [...slicedAsks, ...slicedBids].map((e) => e.total);
    const max = Math.max(...allTotals, 0);

    return { asks: slicedAsks, bids: slicedBids, maxTotal: max };
  }, [orderBook, depth]);

  if (!isConnected) {
    return (
      <div className="order-book-container">
        <div className="order-book-header">
          <h3>Order Book</h3>
        </div>
        <div className="order-book-loading">Connecting...</div>
      </div>
    );
  }

  if (!orderBook) {
    return (
      <div className="order-book-container">
        <div className="order-book-header">
          <h3>Order Book</h3>
        </div>
        <div className="order-book-loading">Loading order book...</div>
      </div>
    );
  }

  return (
    <div className="order-book-container">
      <div className="order-book-header">
        <h3>Order Book</h3>
      </div>

      <div className="order-book-columns">
        <span>Price</span>
        <span>Qty</span>
        <span>Total</span>
      </div>

      <div className="asks-section">
        {asks.length === 0 ? (
          <div className="no-orders">No asks</div>
        ) : (
          asks.map((ask, i) => (
            <OrderRow
              key={`ask-${i}`}
              entry={ask}
              side="ask"
              maxTotal={maxTotal}
              onClick={onPriceClick ? () => onPriceClick(ask.price) : undefined}
            />
          ))
        )}
      </div>

      <div className="spread-section">
        <span className="spread-label">Spread</span>
        <span className="spread-value">
          {formatPrice(orderBook.spread)} ({orderBook.spreadPercent.toFixed(2)}%)
        </span>
      </div>

      <div className="bids-section">
        {bids.length === 0 ? (
          <div className="no-orders">No bids</div>
        ) : (
          bids.map((bid, i) => (
            <OrderRow
              key={`bid-${i}`}
              entry={bid}
              side="bid"
              maxTotal={maxTotal}
              onClick={onPriceClick ? () => onPriceClick(bid.price) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
