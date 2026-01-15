import { useEffect } from "react";
import { useWebSocket } from "../context/websocket-context";
import type { OrderEvent, BalanceUpdate, PositionEvent } from "../types/websocket";

interface UseUserEventsCallbacks {
  onOrderCreated?: (order: OrderEvent) => void;
  onOrderFilled?: (order: OrderEvent) => void;
  onOrderCancelled?: (order: OrderEvent) => void;
  onBalanceUpdated?: (balance: BalanceUpdate) => void;
  onPositionOpened?: (position: PositionEvent) => void;
  onPositionUpdated?: (position: PositionEvent) => void;
  onPositionClosed?: (position: PositionEvent) => void;
  onPositionLiquidated?: (position: PositionEvent) => void;
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

    if (callbacks.onPositionOpened) {
      const handler = callbacks.onPositionOpened as (data: unknown) => void;
      socket.on("position:opened", handler);
      handlers.push(["position:opened", handler]);
    }

    if (callbacks.onPositionUpdated) {
      const handler = callbacks.onPositionUpdated as (data: unknown) => void;
      socket.on("position:updated", handler);
      handlers.push(["position:updated", handler]);
    }

    if (callbacks.onPositionClosed) {
      const handler = callbacks.onPositionClosed as (data: unknown) => void;
      socket.on("position:closed", handler);
      handlers.push(["position:closed", handler]);
    }

    if (callbacks.onPositionLiquidated) {
      const handler = callbacks.onPositionLiquidated as (data: unknown) => void;
      socket.on("position:liquidated", handler);
      handlers.push(["position:liquidated", handler]);
    }

    return () => {
      handlers.forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [socket, isConnected, callbacks]);

  return { isConnected };
}
