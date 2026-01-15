import { useOrders } from "../../hooks/use-orders";
import { useTrading } from "../../hooks/use-trading";
import { useAuth } from "../../context/auth-context";
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

function OrderRow({
  order,
  onCancel,
  isCancelling,
}: {
  order: Order;
  onCancel: () => void;
  isCancelling: boolean;
}) {
  const fillPercent = (order.filledQuantity / order.quantity) * 100;

  return (
    <div className="order-row">
      <div className="order-info">
        <div className="order-main">
          <span className={`order-side ${order.side}`}>{order.side.toUpperCase()}</span>
          <span className="order-symbol">{order.marketSymbol}</span>
          <span className="order-type">{order.type}</span>
        </div>
        <div className="order-details">
          <span className="order-price">${order.price.toFixed(2)}</span>
          <span className="order-qty">
            {order.filledQuantity.toFixed(2)} / {order.quantity.toFixed(2)}
          </span>
          <span className="order-time">{formatTime(order.createdAt)}</span>
        </div>
      </div>
      <div className="order-status-section">
        <div className="fill-bar">
          <div className="fill-progress" style={{ width: `${fillPercent}%` }} />
        </div>
        <span className={`order-status ${order.status}`}>{order.status}</span>
      </div>
      <button className="cancel-order-btn" onClick={onCancel} disabled={isCancelling}>
        ×
      </button>
    </div>
  );
}

export function OpenOrders({ market }: OpenOrdersProps) {
  const { isAuthenticated } = useAuth();
  const { openOrders, isLoading, refresh } = useOrders({ market });
  const { cancelOrder, cancelAllOrders, isCancelling } = useTrading();

  const handleCancel = async (orderId: string) => {
    const success = await cancelOrder(orderId);
    if (success) refresh();
  };

  const handleCancelAll = async () => {
    await cancelAllOrders(openOrders);
    refresh();
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
        {openOrders.length > 0 && (
          <button className="cancel-all-btn" onClick={handleCancelAll} disabled={isCancelling}>
            Cancel All
          </button>
        )}
      </div>

      {openOrders.length === 0 ? (
        <div className="open-orders-empty">No open orders</div>
      ) : (
        <div className="orders-list">
          {openOrders.map((order) => (
            <OrderRow
              key={order.orderId}
              order={order}
              onCancel={() => handleCancel(order.orderId)}
              isCancelling={isCancelling}
            />
          ))}
        </div>
      )}
    </div>
  );
}
