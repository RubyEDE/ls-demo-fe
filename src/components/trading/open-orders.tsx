import { useOrders } from "../../hooks/use-orders";
import { useTrading } from "../../hooks/use-trading";
import { useAuth } from "../../context/auth-context";
import { useBalance } from "../../context/balance-context";
import type { Order } from "../../types/clob";
import "./open-orders.css";

interface OpenOrdersProps {
  market?: string;
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function OpenOrders({ market }: OpenOrdersProps) {
  const { isAuthenticated } = useAuth();
  const { openOrders, isLoading, refresh } = useOrders({ market });
  const { cancelOrder, cancelAllOrders, isCancelling } = useTrading();
  const { refreshBalance } = useBalance();

  const handleCancel = async (orderId: string) => {
    const success = await cancelOrder(orderId);
    if (success) {
      refresh();
      refreshBalance();
    }
  };

  const handleCancelAll = async () => {
    await cancelAllOrders(openOrders);
    refresh();
    refreshBalance();
  };

  if (!isAuthenticated) {
    return (
      <div className="open-orders-container">
        <div className="open-orders-header">
          <h3>Open Orders</h3>
        </div>
        <div className="open-orders-empty">Sign in to view orders</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="open-orders-container">
        <div className="open-orders-header">
          <h3>Open Orders</h3>
        </div>
        <div className="open-orders-loading">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="open-orders-container">
      <div className="open-orders-header">
        <h3>Open Orders ({openOrders.length})</h3>
      </div>

      {openOrders.length === 0 ? (
        <div className="open-orders-empty">No open orders</div>
      ) : (
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Side</th>
                <th>Type</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Filled</th>
                <th>Time</th>
                <th className="col-action-header">
                  <button className="cancel-all-btn" onClick={handleCancelAll} disabled={isCancelling}>
                    Cancel All
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {openOrders.map((order: Order) => {
                const fillPercent = (order.filledQuantity / order.quantity) * 100;
                return (
                  <tr key={order.orderId}>
                    <td className="col-symbol">{order.marketSymbol}</td>
                    <td className={`col-side ${order.side}`}>{order.side.toUpperCase()}</td>
                    <td className="col-type">{order.type}</td>
                    <td className="col-price">${order.price.toFixed(2)}</td>
                    <td className="col-qty">{order.quantity.toFixed(2)}</td>
                    <td className="col-filled">
                      <div className="fill-cell">
                        <span>{fillPercent.toFixed(0)}%</span>
                        <div className="fill-bar">
                          <div className="fill-progress" style={{ width: `${fillPercent}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="col-time">{formatTime(order.createdAt)}</td>
                    <td className="col-action">
                      <button
                        className="cancel-order-btn"
                        onClick={() => handleCancel(order.orderId)}
                        disabled={isCancelling}
                      >
                        Cancel
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
