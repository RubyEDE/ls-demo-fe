import { useState, useCallback } from "react";
import { placeOrder, cancelOrder } from "../utils/clob-api";
import type { PlaceOrderParams, PlaceOrderResult, Order } from "../types/clob";

export function useTrading() {
  const [isPlacing, setIsPlacing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitOrder = useCallback(async (params: PlaceOrderParams): Promise<PlaceOrderResult> => {
    setIsPlacing(true);
    setError(null);

    try {
      const result = await placeOrder(params);

      if (!result.success) {
        setError(result.error || "Failed to place order");
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsPlacing(false);
    }
  }, []);

  const submitCancel = useCallback(async (orderId: string): Promise<boolean> => {
    setIsCancelling(true);
    setError(null);

    try {
      const result = await cancelOrder(orderId);

      if (!result.success) {
        setError(result.error || "Failed to cancel order");
        return false;
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return false;
    } finally {
      setIsCancelling(false);
    }
  }, []);

  const cancelAllOrders = useCallback(
    async (orders: Order[]): Promise<number> => {
      let cancelled = 0;

      for (const order of orders) {
        if (["open", "partial", "pending"].includes(order.status)) {
          const success = await submitCancel(order.orderId);
          if (success) cancelled++;
        }
      }

      return cancelled;
    },
    [submitCancel]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    placeOrder: submitOrder,
    cancelOrder: submitCancel,
    cancelAllOrders,
    isPlacing,
    isCancelling,
    error,
    clearError,
  };
}
