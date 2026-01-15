import { useState, useCallback } from "react";
import { ConnectionStatus } from "../components/trading/connection-status";
import { MarketHeader } from "../components/trading/market-header";
import { CandlestickChart } from "../components/trading/candlestick-chart";
import { OrderBook } from "../components/trading/order-book";
import { TradeFeed } from "../components/trading/trade-feed";
import { OrderForm } from "../components/trading/order-form";
import { OpenOrders } from "../components/trading/open-orders";
import { useMarkets } from "../hooks/use-markets";
import { useUserEvents } from "../hooks/use-user-events";
import { useAuth } from "../context/auth-context";
import type { OrderEvent, BalanceUpdate } from "../types/websocket";
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

      {/* Market Header */}
      <MarketHeader
        markets={markets}
        selectedMarket={selectedMarket}
        onSelectMarket={setSelectedSymbol}
      />

      {/* Main Trading Layout */}
      <div className="trade-layout">
        {/* Left: Chart + Open Orders */}
        <div className="trade-main">
          <CandlestickChart symbol={`${selectedSymbol}-PERP`} height={450} />
          <OpenOrders key={ordersKey} market={`${selectedSymbol}-PERP`} />
        </div>

        {/* Right Sidebar */}
        <div className="trade-sidebar">
          <div className="order-panel">
            <OrderForm
              market={selectedMarket}
              onOrderPlaced={handleOrderPlaced}
              selectedPrice={selectedPrice}
            />
            <OrderBook
              symbol={`${selectedSymbol}-PERP`}
              depth={8}
              onPriceClick={handlePriceClick}
            />
          </div>
          <TradeFeed symbol={`${selectedSymbol}-PERP`} maxTrades={20} />
        </div>
      </div>
    </div>
  );
}
