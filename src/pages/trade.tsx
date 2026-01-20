import { useState, useCallback, useEffect, useMemo } from "react";
import { ConnectionStatus } from "../components/trading/connection-status";
import { MarketHeader } from "../components/trading/market-header";
import { CandlestickChart } from "../components/trading/candlestick-chart";
import { OrderBook } from "../components/trading/order-book";
import { OrderForm } from "../components/trading/order-form";
import { TradeFeed } from "../components/trading/trade-feed";
import { TradingTabs } from "../components/trading/trading-tabs";
import { useMarkets } from "../hooks/use-markets";
import { useLastTradePrices } from "../hooks/use-last-trade-prices";
import { useUserEvents } from "../hooks/use-user-events";
import { useAuth } from "../context/auth-context";
import type { OrderEvent, BalanceUpdate, PositionEvent } from "../types/websocket";
import "./trade.css";

function formatPrice(price: number): string {
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type MobileTab = "markets" | "trade";

export function TradePage() {
  const { isAuthenticated } = useAuth();
  const { markets, getMarket } = useMarkets();
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [notifications, setNotifications] = useState<string[]>([]);
  const [ordersKey, setOrdersKey] = useState(0);
  const [selectedPrice, setSelectedPrice] = useState<{ price: number; timestamp: number } | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("markets");

  const selectedMarket = getMarket(`${selectedSymbol}-PERP`) || null;
  
  // Get all market symbols for last trade prices
  const marketSymbols = useMemo(() => markets.map((m) => m.baseAsset), [markets]);
  
  // Get last trade prices for all markets
  const { prices: lastTradePrices, getLastTradePrice } = useLastTradePrices(marketSymbols);
  const currentLastTrade = getLastTradePrice(selectedSymbol);

  // Update document title with last trade price
  useEffect(() => {
    if (currentLastTrade) {
      document.title = `$${formatPrice(currentLastTrade.price)} | ${selectedSymbol} | Longsword`;
    } else {
      document.title = `${selectedSymbol} | Longsword`;
    }

    return () => {
      document.title = "Longsword";
    };
  }, [currentLastTrade, selectedSymbol]);

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
          lastTradePrices={lastTradePrices}
        />
        <ConnectionStatus />
      </div>

      {/* Main Trading Layout - Desktop */}
      <div className="terminal-layout desktop-layout">
        {/* Left: Chart + Tabs */}
        <div className="terminal-main">
          <CandlestickChart symbol={`${selectedSymbol}-PERP`} />
          <TradingTabs ordersKey={ordersKey} />
        </div>

        {/* Right: Order Form + Trade Feed + Order Book */}
        <div className="terminal-sidebar">
          <div className="sidebar-left">
            <OrderForm
              market={selectedMarket}
              onOrderPlaced={handleOrderPlaced}
              selectedPrice={selectedPrice}
            />
            <TradeFeed symbol={`${selectedSymbol}-PERP`} maxTrades={20} />
          </div>
          <OrderBook
            symbol={`${selectedSymbol}-PERP`}
            depth={50}
            onPriceClick={handlePriceClick}
          />
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="terminal-layout mobile-layout">
        {mobileTab === "markets" && (
          <div className="mobile-markets-view">
            <CandlestickChart symbol={`${selectedSymbol}-PERP`} />
            <TradingTabs ordersKey={ordersKey} />
          </div>
        )}
        {mobileTab === "trade" && (
          <div className="mobile-trade-view">
            <div className="mobile-trade-top">
              <OrderForm
                market={selectedMarket}
                onOrderPlaced={handleOrderPlaced}
                selectedPrice={selectedPrice}
              />
              <OrderBook
                symbol={`${selectedSymbol}-PERP`}
                depth={20}
                onPriceClick={handlePriceClick}
              />
            </div>
            <TradingTabs ordersKey={ordersKey} />
          </div>
        )}
      </div>

      {/* Mobile Bottom Navbar */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-nav-btn ${mobileTab === "markets" ? "active" : ""}`}
          onClick={() => setMobileTab("markets")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v18h18" />
            <path d="M18 9l-5 5-4-4-3 3" />
          </svg>
          <span>Markets</span>
        </button>
        <button
          className={`mobile-nav-btn ${mobileTab === "trade" ? "active" : ""}`}
          onClick={() => setMobileTab("trade")}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <span>Trade</span>
        </button>
      </nav>
    </div>
  );
}
