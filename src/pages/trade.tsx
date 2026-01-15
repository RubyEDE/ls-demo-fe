import { useState, useCallback } from "react";
import { ConnectionStatus } from "../components/trading/connection-status";
import { MarketHeader } from "../components/trading/market-header";
import { CandlestickChart } from "../components/trading/candlestick-chart";
import { OrderBook } from "../components/trading/order-book";
import { OrderForm } from "../components/trading/order-form";
import { TradingTabs } from "../components/trading/trading-tabs";
import { useMarkets } from "../hooks/use-markets";
import { useUserEvents } from "../hooks/use-user-events";
import { useAuth } from "../context/auth-context";
import type { OrderEvent, BalanceUpdate, PositionEvent } from "../types/websocket";
import "./trade.css";

export function TradePage() {
  const { isAuthenticated } = useAuth();
  const { markets, getMarket } = useMarkets();
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [notifications, setNotifications] = useState<string[]>([]);
  const [ordersKey, setOrdersKey] = useState(0);
  const [selectedPrice, setSelectedPrice] = useState<{ price: number; timestamp: number } | null>(null);

  const selectedMarket = getMarket(`${selectedSymbol}-PERP`) || null;

  const handlePriceClick = useCallback((price: number) => {
    setSelectedPrice({ price, timestamp: Date.now() });
  }, []);

  const addNotification = useCallback((message: string) => {
    setNotifications((prev) => [message, ...prev].slice(0, 5));
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n !== message));
    }, 5000);
  }, []);

  const handleOrderPlaced = useCallback(() => {
    setOrdersKey((k) => k + 1);
    addNotification("Order placed successfully");
  }, [addNotification]);

  useUserEvents({
    onOrderCreated: useCallback(
      (order: OrderEvent) => {
        addNotification(`Order created: ${order.side.toUpperCase()} ${order.quantity} ${order.symbol}`);
        setOrdersKey((k) => k + 1);
      },
      [addNotification]
    ),
    onOrderFilled: useCallback(
      (order: OrderEvent) => {
        addNotification(`Order filled: ${order.side.toUpperCase()} ${order.filledQuantity} ${order.symbol} @ $${order.price}`);
        setOrdersKey((k) => k + 1);
      },
      [addNotification]
    ),
    onOrderCancelled: useCallback(
      (order: OrderEvent) => {
        addNotification(`Order cancelled: ${order.orderId.slice(0, 8)}...`);
        setOrdersKey((k) => k + 1);
      },
      [addNotification]
    ),
    onBalanceUpdated: useCallback(
      (balance: BalanceUpdate) => {
        addNotification(`Balance updated: $${balance.total.toFixed(2)}`);
      },
      [addNotification]
    ),
    onPositionOpened: useCallback(
      (position: PositionEvent) => {
        addNotification(`Position opened: ${position.side.toUpperCase()} ${position.size} ${position.marketSymbol}`);
      },
      [addNotification]
    ),
    onPositionClosed: useCallback(
      (position: PositionEvent) => {
        const pnlStr = position.realizedPnl >= 0 ? `+$${position.realizedPnl.toFixed(2)}` : `-$${Math.abs(position.realizedPnl).toFixed(2)}`;
        addNotification(`Position closed: ${position.marketSymbol} (${pnlStr})`);
      },
      [addNotification]
    ),
    onPositionLiquidated: useCallback(
      (position: PositionEvent) => {
        addNotification(`⚠️ Position liquidated: ${position.marketSymbol}`);
      },
      [addNotification]
    ),
  });

  return (
    <div className="trade-terminal">
      {/* Notifications Toast */}
      {isAuthenticated && notifications.length > 0 && (
        <div className="notifications-toast">
          {notifications.map((note, i) => (
            <div key={i} className="notification">
              {note}
            </div>
          ))}
        </div>
      )}

      {/* Top Bar: Market Header + Connection Status */}
      <div className="terminal-top-bar">
        <MarketHeader
          markets={markets}
          selectedMarket={selectedMarket}
          onSelectMarket={setSelectedSymbol}
        />
        <ConnectionStatus />
      </div>

      {/* Main Trading Layout */}
      <div className="terminal-layout">
        {/* Left: Chart + Tabs */}
        <div className="terminal-main">
          <CandlestickChart symbol={`${selectedSymbol}-PERP`} />
          <TradingTabs ordersKey={ordersKey} />
        </div>

        {/* Right: Order Form + Order Book */}
        <div className="terminal-sidebar">
          <OrderForm
            market={selectedMarket}
            onOrderPlaced={handleOrderPlaced}
            selectedPrice={selectedPrice}
          />
          <OrderBook
            symbol={`${selectedSymbol}-PERP`}
            depth={50}
            onPriceClick={handlePriceClick}
          />
        </div>
      </div>
    </div>
  );
}
