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
      )}

      {positions.length === 0 ? (
        <div className="positions-empty">No open positions</div>
      ) : (
        <div className="positions-table-wrapper">
          <table className="positions-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Side</th>
                <th>Size</th>
                <th>Entry</th>
                <th>Mark</th>
                <th>Liq</th>
                <th>PnL</th>
                <th>ROE</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => {
                const isProfitable = position.unrealizedPnl >= 0;
                const roe = position.margin > 0 ? (position.unrealizedPnl / position.margin) * 100 : 0;
                return (
                  <tr key={position.positionId}>
                    <td className="col-symbol">{position.marketSymbol}</td>
                    <td className={`col-side ${position.side}`}>
                      {position.side.toUpperCase()} {position.leverage.toFixed(0)}x
                    </td>
                    <td className="col-size">{formatSize(position.size)}</td>
                    <td className="col-entry">${formatPrice(position.entryPrice)}</td>
                    <td className="col-mark">{position.markPrice ? `$${formatPrice(position.markPrice)}` : "-"}</td>
                    <td className="col-liq">${formatPrice(position.liquidationPrice)}</td>
                    <td className={`col-pnl ${isProfitable ? "profit" : "loss"}`}>
                      {isProfitable ? "+" : ""}{formatMoney(position.unrealizedPnl)}
                    </td>
                    <td className={`col-roe ${isProfitable ? "profit" : "loss"}`}>
                      {isProfitable ? "+" : ""}{roe.toFixed(2)}%
                    </td>
                    <td className="col-action">
                      <button
                        className="close-position-btn"
                        onClick={() => handleClose(position.marketSymbol)}
                        disabled={isClosing}
                      >
                        Close
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
