import { useEffect, useState, useCallback } from "react";
import { useWebSocket } from "../context/websocket-context";
import type { OrderBookSnapshot, OrderBookUpdate, OrderBookEntry } from "../types/websocket";

export interface OrderBook {
  symbol: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  timestamp: number;
  spread: number;
  spreadPercent: number;
}

export function useOrderBook(symbol: string) {
  const { socket, isConnected } = useWebSocket();
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);

  // Clear orderbook when symbol changes
  useEffect(() => {
    setOrderBook(null);
  }, [symbol]);

  const calculateSpread = useCallback((bids: OrderBookEntry[], asks: OrderBookEntry[]) => {
    if (bids.length === 0 || asks.length === 0) {
      return { spread: 0, spreadPercent: 0 };
    }
    const bestBid = bids[0].price;
    const bestAsk = asks[0].price;
    const spread = bestAsk - bestBid;
    const spreadPercent = (spread / bestAsk) * 100;
    return { spread, spreadPercent };
  }, []);

  useEffect(() => {
    if (!socket || !isConnected || !symbol) return;

    const upperSymbol = symbol.toUpperCase();

    // Subscribe to order book
    socket.emit("subscribe:orderbook", upperSymbol);

    // Handle full snapshot
    const handleSnapshot = (data: OrderBookSnapshot) => {
      if (data.symbol !== upperSymbol) return;

      const { spread, spreadPercent } = calculateSpread(data.bids, data.asks);
      setOrderBook({
        ...data,
        spread,
        spreadPercent,
      });
    };

    // Handle incremental updates
    const handleUpdate = (update: OrderBookUpdate) => {
      if (update.symbol !== upperSymbol) return;

      setOrderBook((prev) => {
        if (!prev) return prev;

        const side = update.side === "bid" ? "bids" : "asks";
        const entries = [...prev[side]];

        // Find the price level
        const index = entries.findIndex((e) => e.price === update.price);

        if (update.quantity === 0) {
          // Remove level
          if (index !== -1) {
            entries.splice(index, 1);
          }
        } else if (index !== -1) {
          // Update existing level
          entries[index] = {
            price: update.price,
            quantity: update.quantity,
            total: update.price * update.quantity,
          };
        } else {
          // Insert new level
          entries.push({
            price: update.price,
            quantity: update.quantity,
            total: update.price * update.quantity,
          });
          // Sort bids descending, asks ascending
          entries.sort((a, b) =>
            side === "bids" ? b.price - a.price : a.price - b.price
          );
        }

        const newBids = side === "bids" ? entries : prev.bids;
        const newAsks = side === "asks" ? entries : prev.asks;
        const { spread, spreadPercent } = calculateSpread(newBids, newAsks);

        return {
          ...prev,
          [side]: entries,
          timestamp: update.timestamp,
          spread,
          spreadPercent,
        };
      });
    };

    socket.on("orderbook:snapshot", handleSnapshot);
    socket.on("orderbook:update", handleUpdate);

    return () => {
      socket.emit("unsubscribe:orderbook", upperSymbol);
      socket.off("orderbook:snapshot", handleSnapshot);
      socket.off("orderbook:update", handleUpdate);
    };
  }, [socket, isConnected, symbol, calculateSpread]);

  return {
    orderBook,
    isConnected,
  };
}
