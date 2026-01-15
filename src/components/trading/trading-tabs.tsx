import { useState, useCallback } from "react";
import { PositionsList } from "./positions-list";
import { OpenOrders } from "./open-orders";
import { TradeFeed } from "./trade-feed";
import { usePositions } from "../../hooks/use-positions";
import { useOrders } from "../../hooks/use-orders";
import { useAuth } from "../../context/auth-context";
import "./trading-tabs.css";

type TabId = "positions" | "orders" | "trades";

interface TradingTabsProps {
  market: string;
  ordersKey?: number;
}

export function TradingTabs({ market, ordersKey }: TradingTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("positions");
  const { isAuthenticated } = useAuth();
  // Positions and orders show all markets
  const { positions } = usePositions();
  const { openOrders } = useOrders();

  const handleTabClick = useCallback((tab: TabId) => {
    setActiveTab(tab);
  }, []);

  const positionCount = positions.length;
  const orderCount = openOrders.length;

  return (
    <div className="trading-tabs-container">
      <div className="trading-tabs-header">
        <button
          className={`trading-tab ${activeTab === "positions" ? "active" : ""}`}
          onClick={() => handleTabClick("positions")}
        >
          Positions
          {isAuthenticated && positionCount > 0 && (
            <span className="trading-tab-badge positions">{positionCount}</span>
          )}
        </button>
        <button
          className={`trading-tab ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => handleTabClick("orders")}
        >
          Open Orders
          {isAuthenticated && orderCount > 0 && (
            <span className="trading-tab-badge orders">{orderCount}</span>
          )}
        </button>
        <button
          className={`trading-tab ${activeTab === "trades" ? "active" : ""}`}
          onClick={() => handleTabClick("trades")}
        >
          Recent Trades
        </button>
      </div>

      <div className="trading-tabs-content">
        {/* Positions and orders show all markets */}
        {activeTab === "positions" && <PositionsList />}
        {activeTab === "orders" && <OpenOrders key={ordersKey} />}
        {activeTab === "trades" && <TradeFeed symbol={market} maxTrades={20} />}
      </div>
    </div>
  );
}
