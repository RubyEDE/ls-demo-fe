import { useCallback } from "react";
import { usePositions } from "../../hooks/use-positions";
import { usePositionActions } from "../../hooks/use-position-actions";
import { useAuth } from "../../context/auth-context";
import { useBalance } from "../../context/balance-context";
import { useUserEvents } from "../../hooks/use-user-events";
import type { Position } from "../../types/position";
import type { PositionEvent } from "../../types/websocket";
import "./positions-list.css";

interface PositionsListProps {
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

function formatSize(size: number): string {
  return size.toFixed(4);
}

function PositionRow({
  position,
  onClose,
  isClosing,
}: {
  position: Position;
  onClose: () => void;
  isClosing: boolean;
}) {
  const isProfitable = position.unrealizedPnl >= 0;
  const roe = position.margin > 0 ? (position.unrealizedPnl / position.margin) * 100 : 0;

  // Calculate liquidation risk
  const getLiqRisk = (): "safe" | "warning" | "danger" => {
    if (!position.markPrice) return "safe";
    const distanceToLiq =
      position.side === "long"
        ? position.markPrice - position.liquidationPrice
        : position.liquidationPrice - position.markPrice;
    const percentToLiq = (distanceToLiq / position.markPrice) * 100;
    if (percentToLiq < 2) return "danger";
    if (percentToLiq < 5) return "warning";
    return "safe";
  };

  const liqRisk = getLiqRisk();

  return (
    <div className={`position-row ${position.side}`}>
      <div className="position-info">
        <div className="position-main">
          <span className={`position-side ${position.side}`}>
            {position.side.toUpperCase()}
          </span>
          <span className="position-symbol">{position.marketSymbol}</span>
          <span className="position-leverage">{position.leverage.toFixed(1)}x</span>
        </div>
        <div className="position-details">
          <span className="position-size">{formatSize(position.size)}</span>
          <span className="position-entry">@ ${formatPrice(position.entryPrice)}</span>
          {position.markPrice && (
            <span className="position-mark">→ ${formatPrice(position.markPrice)}</span>
          )}
        </div>
      </div>

      <div className="position-pnl-section">
        <span className={`position-pnl ${isProfitable ? "profit" : "loss"}`}>
          {isProfitable ? "+" : ""}
          {formatMoney(position.unrealizedPnl)}
        </span>
        <span className={`position-roe ${isProfitable ? "profit" : "loss"}`}>
          {isProfitable ? "+" : ""}
          {roe.toFixed(2)}%
        </span>
        {liqRisk !== "safe" && (
          <span className={`position-liq ${liqRisk}`}>
            Liq: ${formatPrice(position.liquidationPrice)}
          </span>
        )}
      </div>

      <button className="close-position-btn" onClick={onClose} disabled={isClosing} title="Close position">
        ×
      </button>
    </div>
  );
}

export function PositionsList({ market }: PositionsListProps) {
  const { isAuthenticated } = useAuth();
  const { positions, summary, isLoading, refresh } = usePositions({ market });
  const { closePosition, closeAllPositions, isClosing } = usePositionActions();
  const { refreshBalance } = useBalance();

  // Listen to position WebSocket events for real-time updates
  useUserEvents({
    onPositionOpened: useCallback(
      (_position: PositionEvent) => {
        refresh();
        refreshBalance();
      },
      [refresh, refreshBalance]
    ),
    onPositionUpdated: useCallback(
      (_position: PositionEvent) => {
        refresh();
      },
      [refresh]
    ),
    onPositionClosed: useCallback(
      (_position: PositionEvent) => {
        refresh();
        refreshBalance();
      },
      [refresh, refreshBalance]
    ),
    onPositionLiquidated: useCallback(
      (_position: PositionEvent) => {
        refresh();
        refreshBalance();
      },
      [refresh, refreshBalance]
    ),
  });

  const handleClose = async (marketSymbol: string) => {
    const result = await closePosition(marketSymbol);
    if (result?.success) {
      refresh();
      refreshBalance();
    }
  };

  const handleCloseAll = async () => {
    await closeAllPositions(positions);
    refresh();
    refreshBalance();
  };

  if (!isAuthenticated) {
    return (
      <div className="positions-container">
        <div className="positions-header">
          <h3>Positions</h3>
        </div>
        <div className="positions-empty">Sign in to view positions</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="positions-container">
        <div className="positions-header">
          <h3>Positions</h3>
        </div>
        <div className="positions-loading">Loading positions...</div>
      </div>
    );
  }

  return (
    <div className="positions-container">
      <div className="positions-header">
        <h3>Positions ({positions.length})</h3>
        {positions.length > 1 && (
          <button
            className="close-all-positions-btn"
            onClick={handleCloseAll}
            disabled={isClosing}
          >
            Close All
          </button>
        )}
      </div>

      {summary && positions.length > 0 && (
        <div className="positions-summary">
          <div className="summary-item">
            <span className="label">Margin</span>
            <span className="value">{formatMoney(summary.totalMargin)}</span>
          </div>
          <div className="summary-item">
            <span className="label">Unrealized PnL</span>
            <span className={`value ${summary.totalUnrealizedPnl >= 0 ? "profit" : "loss"}`}>
              {summary.totalUnrealizedPnl >= 0 ? "+" : ""}
              {formatMoney(summary.totalUnrealizedPnl)}
            </span>
          </div>
          <div className="summary-item">
            <span className="label">Equity</span>
            <span className="value">{formatMoney(summary.totalEquity)}</span>
          </div>
        </div>
      )}

      {positions.length === 0 ? (
        <div className="positions-empty">No open positions</div>
      ) : (
        <div className="positions-list">
          {positions.map((position) => (
            <PositionRow
              key={position.positionId}
              position={position}
              onClose={() => handleClose(position.marketSymbol)}
              isClosing={isClosing}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Compact widget for showing position in market view
interface MarketPositionWidgetProps {
  marketSymbol: string;
}

export function MarketPositionWidget({ marketSymbol }: MarketPositionWidgetProps) {
  const { getPosition, refresh } = usePositions();
  const { closePosition, isClosing } = usePositionActions();
  const { refreshBalance } = useBalance();

  const position = getPosition(marketSymbol);

  if (!position) {
    return null;
  }

  const isProfitable = position.unrealizedPnl >= 0;
  const roe = position.margin > 0 ? (position.unrealizedPnl / position.margin) * 100 : 0;

  const handleClose = async () => {
    const result = await closePosition(marketSymbol);
    if (result?.success) {
      refresh();
      refreshBalance();
    }
  };

  return (
    <div className={`market-position-widget ${position.side}`}>
      <div className="widget-header">
        <span className={`widget-side ${position.side}`}>
          {position.side.toUpperCase()} {position.leverage.toFixed(1)}x
        </span>
        <button
          className="widget-close-btn"
          onClick={handleClose}
          disabled={isClosing}
        >
          Close
        </button>
      </div>
      <div className="widget-details">
        <span className="widget-size-entry">
          {formatSize(position.size)} @ ${formatPrice(position.entryPrice)}
        </span>
        <span className={`widget-pnl ${isProfitable ? "profit" : "loss"}`}>
          {isProfitable ? "+" : ""}
          {formatMoney(position.unrealizedPnl)} ({isProfitable ? "+" : ""}
          {roe.toFixed(1)}%)
        </span>
      </div>
    </div>
  );
}
