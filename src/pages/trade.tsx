import { useState, useCallback } from "react";
import { ConnectionStatus } from "../components/trading/connection-status";
import { PriceTicker } from "../components/trading/price-ticker";
import { TradingViewChart } from "../components/trading/tradingview-chart";
import { OrderBook } from "../components/trading/order-book";
import { TradeFeed } from "../components/trading/trade-feed";
import { useUserEvents } from "../hooks/use-user-events";
import { useAuth } from "../context/auth-context";
import type { OrderEvent, BalanceUpdate } from "../types/websocket";
import "./trade.css";

const SYMBOLS = ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA"];

export function TradePage() {
  const { isAuthenticated } = useAuth();
  const [selectedSymbol, setSelectedSymbol] = useState(SYMBOLS[0]);
  const [notifications, setNotifications] = useState<string[]>([]);

  const addNotification = useCallback((message: string) => {
    setNotifications((prev) => [message, ...prev].slice(0, 5));
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n !== message));
    }, 5000);
  }, []);

  useUserEvents({
    onOrderCreated: useCallback(
      (order: OrderEvent) => {
        addNotification(`Order created: ${order.side.toUpperCase()} ${order.quantity} ${order.symbol}`);
      },
      [addNotification]
    ),
    onOrderFilled: useCallback(
      (order: OrderEvent) => {
        addNotification(`Order filled: ${order.side.toUpperCase()} ${order.filledQuantity} ${order.symbol} @ $${order.price}`);
      },
      [addNotification]
    ),
    onOrderCancelled: useCallback(
      (order: OrderEvent) => {
        addNotification(`Order cancelled: ${order.orderId.slice(0, 8)}...`);
      },
      [addNotification]
    ),
    onBalanceUpdated: useCallback(
      (balance: BalanceUpdate) => {
        addNotification(`Balance updated: $${balance.total.toFixed(2)}`);
      },
      [addNotification]
    ),
  });

  return (
    <div className="trade-container">
      {/* Header */}
      <div className="trade-header">
        <div className="trade-title">
          <h1>Trade</h1>
          <ConnectionStatus />
        </div>
        {isAuthenticated && notifications.length > 0 && (
          <div className="notifications">
            {notifications.map((note, i) => (
              <div key={i} className="notification">
                {note}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Price Ticker */}
      <PriceTicker
        symbols={SYMBOLS}
        selectedSymbol={selectedSymbol}
        onSelectSymbol={setSelectedSymbol}
      />

      {/* Main Trading Layout */}
      <div className="trade-layout">
        {/* Chart - Main Area */}
        <div className="chart-section">
          <TradingViewChart symbol={selectedSymbol} height={500} />
        </div>

        {/* Sidebar */}
        <div className="trade-sidebar">
          <OrderBook symbol={selectedSymbol} depth={10} />
          <TradeFeed symbol={selectedSymbol} maxTrades={30} />
        </div>
      </div>
    </div>
  );
}
