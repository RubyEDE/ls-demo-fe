import { useCallback, useMemo } from "react";
import { usePositions } from "../../hooks/use-positions";
import { usePositionActions } from "../../hooks/use-position-actions";
import { useAuth } from "../../context/auth-context";
import { useBalance } from "../../context/balance-context";
import { useUserEvents } from "../../hooks/use-user-events";
import { useLastTradePrices } from "../../hooks/use-last-trade-prices";
import type { Position } from "../../types/position";
import type { PositionEvent } from "../../types/websocket";
import "./positions-list.css";

// Calculate unrealized PnL based on current mark price
function calculateUnrealizedPnl(position: Position, currentMarkPrice: number | null): number {
  if (currentMarkPrice === null) {
    return position.unrealizedPnl; // fallback to server value
  }
  if (position.side === "long") {
    return (currentMarkPrice - position.entryPrice) * position.size;
  } else {
    return (position.entryPrice - currentMarkPrice) * position.size;
  }
}

interface PositionsListProps {
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

function formatSize(size: number): string {
  return size.toFixed(4);
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

export function PositionsList({ market }: PositionsListProps) {
  const { isAuthenticated } = useAuth();
  const { positions, summary, isLoading, refresh } = usePositions({ market });
  const { closePosition, closeAllPositions, isClosing } = usePositionActions();
  const { refreshBalance } = useBalance();

  // Get unique symbols from positions for price subscription
  const positionSymbols = useMemo(() => {
    const symbols = positions.map((p) => p.marketSymbol.replace("-PERP", ""));
    return [...new Set(symbols)];
  }, [positions]);

  // Subscribe to live prices for all position markets
  const { prices: livePrices } = useLastTradePrices(positionSymbols);

  // Calculate live PnL for a position
  const getLivePnl = useCallback(
    (position: Position): number => {
      const baseSymbol = position.marketSymbol.replace("-PERP", "").toUpperCase();
      const livePrice = livePrices.get(baseSymbol);
      const currentMarkPrice = livePrice?.price ?? position.markPrice;
      return calculateUnrealizedPnl(position, currentMarkPrice);
    },
    [livePrices]
  );

  // Calculate live mark price for a position
  const getLiveMarkPrice = useCallback(
    (position: Position): number | null => {
      const baseSymbol = position.marketSymbol.replace("-PERP", "").toUpperCase();
      const livePrice = livePrices.get(baseSymbol);
      return livePrice?.price ?? position.markPrice;
    },
    [livePrices]
  );

  // Calculate live summary totals
  const liveSummary = useMemo(() => {
    if (!summary || positions.length === 0) return summary;

    const totalLivePnl = positions.reduce((total, position) => {
      return total + getLivePnl(position);
    }, 0);

    return {
      ...summary,
      totalUnrealizedPnl: totalLivePnl,
      totalEquity: summary.totalMargin + totalLivePnl,
    };
  }, [summary, positions, getLivePnl]);

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

      {/* {liveSummary && positions.length > 0 && (
        <div className="positions-summary">
          <div className="summary-item">
            <span className="label">Margin</span>
            <span className="value">{formatMoney(liveSummary.totalMargin)}</span>
          </div>
          <div className="summary-item">
            <span className="label">Unrealized PnL</span>
            <span className={`value ${liveSummary.totalUnrealizedPnl >= 0 ? "profit" : "loss"}`}>
              {liveSummary.totalUnrealizedPnl >= 0 ? "+" : ""}
              {formatMoney(liveSummary.totalUnrealizedPnl)}
            </span>
          </div>
          <div className="summary-item">
            <span className="label">Equity</span>
            <span className="value">{formatMoney(liveSummary.totalEquity)}</span>
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
      )} */}

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
                const livePnl = getLivePnl(position);
                const liveMarkPrice = getLiveMarkPrice(position);
                const isProfitable = livePnl >= 0;
                const roe = position.margin > 0 ? (livePnl / position.margin) * 100 : 0;
                return (
                  <tr key={position.positionId}>
                    <td className="col-symbol">
                      <img
                        src={getMarketImagePath(position.marketSymbol)}
                        alt={position.marketSymbol}
                        className="market-image"
                      />
                      {formatMarketName(position.marketSymbol)}
                    </td>
                    <td className={`col-side ${position.side}`}>
                      {position.side.toUpperCase()} {position.leverage.toFixed(0)}x
                    </td>
                    <td className="col-size">{formatSize(position.size)}</td>
                    <td className="col-entry">{formatPrice(position.entryPrice)}</td>
                    <td className="col-mark">{liveMarkPrice ? formatPrice(liveMarkPrice) : "-"}</td>
                    <td className="col-liq">{formatPrice(position.liquidationPrice)}</td>
                    <td className={`col-pnl ${isProfitable ? "profit" : "loss"}`}>
                      {isProfitable ? "+" : ""}{formatMoney(livePnl)}
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

  // Subscribe to live prices for this market
  const baseSymbol = useMemo(
    () => marketSymbol.replace("-PERP", ""),
    [marketSymbol]
  );
  const symbols = useMemo(() => [baseSymbol], [baseSymbol]);
  const { prices: livePrices } = useLastTradePrices(symbols);

  const position = getPosition(marketSymbol);

  // Calculate live PnL
  const livePnl = useMemo(() => {
    if (!position) return 0;
    const livePrice = livePrices.get(baseSymbol.toUpperCase());
    const currentMarkPrice = livePrice?.price ?? position.markPrice;
    return calculateUnrealizedPnl(position, currentMarkPrice);
  }, [position, livePrices, baseSymbol]);

  if (!position) {
    return null;
  }

  const isProfitable = livePnl >= 0;
  const roe = position.margin > 0 ? (livePnl / position.margin) * 100 : 0;

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
          {formatSize(position.size)} @ {formatPrice(position.entryPrice)}
        </span>
        <span className={`widget-pnl ${isProfitable ? "profit" : "loss"}`}>
          {isProfitable ? "+" : ""}
          {formatMoney(livePnl)} ({isProfitable ? "+" : ""}
          {roe.toFixed(1)}%)
        </span>
      </div>
    </div>
  );
}
