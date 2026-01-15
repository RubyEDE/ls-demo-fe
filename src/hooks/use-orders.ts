import { useState, useEffect, useCallback } from "react";
import { getOpenOrders, getOrderHistory } from "../utils/clob-api";
import type { Order } from "../types/clob";

interface UseOrdersOptions {
  market?: string;
  refreshInterval?: number;
}

export function useOrders(options: UseOrdersOptions = {}) {
  const { market, refreshInterval = 2000 } = options;

  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const orders = await getOpenOrders(market);
      setOpenOrders(orders);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [market]);

  useEffect(() => {
    fetchOrders();

    const interval = setInterval(fetchOrders, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchOrders, refreshInterval]);

  return {
    openOrders,
    isLoading,
    error,
    refresh: fetchOrders,
  };
}

export function useOrderHistory(options: { market?: string } = {}) {
  const { market } = options;

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  const fetchHistory = useCallback(
    async (offset = 0, limit = 50) => {
      try {
        setIsLoading(true);
        const data = await getOrderHistory({ market, limit, offset });

        if (offset === 0) {
          setOrders(data.orders);
        } else {
          setOrders((prev) => [...prev, ...data.orders]);
        }

        setHasMore(data.pagination.hasMore);
      } catch (err) {
        console.error("Error fetching order history:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [market]
  );

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchHistory(orders.length);
    }
  }, [fetchHistory, isLoading, hasMore, orders.length]);

  return {
    orders,
    isLoading,
    hasMore,
    loadMore,
    refresh: () => fetchHistory(0),
  };
}
