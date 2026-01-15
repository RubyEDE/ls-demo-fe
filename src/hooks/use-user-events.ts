import { useEffect } from "react";
import { useWebSocket } from "../context/websocket-context";
import type { OrderEvent, BalanceUpdate } from "../types/websocket";

interface UseUserEventsCallbacks {
  onOrderCreated?: (order: OrderEvent) => void;
  onOrderFilled?: (order: OrderEvent) => void;
  onOrderCancelled?: (order: OrderEvent) => void;
  onBalanceUpdated?: (balance: BalanceUpdate) => void;
}

export function useUserEvents(callbacks: UseUserEventsCallbacks) {
  const { socket, isConnected } = useWebSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handlers: [string, (data: unknown) => void][] = [];

    if (callbacks.onOrderCreated) {
      const handler = callbacks.onOrderCreated as (data: unknown) => void;
      socket.on("order:created", handler);
      handlers.push(["order:created", handler]);
    }

    if (callbacks.onOrderFilled) {
      const handler = callbacks.onOrderFilled as (data: unknown) => void;
      socket.on("order:filled", handler);
      handlers.push(["order:filled", handler]);
    }

    if (callbacks.onOrderCancelled) {
      const handler = callbacks.onOrderCancelled as (data: unknown) => void;
      socket.on("order:cancelled", handler);
      handlers.push(["order:cancelled", handler]);
    }

    if (callbacks.onBalanceUpdated) {
      const handler = callbacks.onBalanceUpdated as (data: unknown) => void;
      socket.on("balance:updated", handler);
      handlers.push(["balance:updated", handler]);
    }

    return () => {
      handlers.forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [socket, isConnected, callbacks]);

  return { isConnected };
}
