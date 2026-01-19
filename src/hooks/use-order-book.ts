import { useEffect, useState, useCallback, useRef } from "react";
import { useWebSocket } from "../context/websocket-context";
import { getOrderBook } from "../utils/clob-api";
import type { OrderBookSnapshot, OrderBookUpdate, OrderBookEntry } from "../types/websocket";

export interface OrderBook {
  symbol: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  timestamp: number;
  spread: number;
  spreadPercent: number;
}

export function useOrderBook(symbol: string, depth: number = 50) {
  const { socket, isConnected } = useWebSocket();
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const hasReceivedSnapshot = useRef(false);

  // Clear orderbook when symbol changes
  useEffect(() => {
    setOrderBook(null);
    hasReceivedSnapshot.current = false;
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

  // Fetch initial orderbook via HTTP for faster load
  useEffect(() => {
    if (!symbol) return;

    const upperSymbol = symbol.toUpperCase();
    let cancelled = false;

    console.log("[OrderBook] Fetching initial state via HTTP:", upperSymbol);
    
    getOrderBook(upperSymbol, depth)
      .then((data) => {
        if (cancelled) return;
        
        // Only use HTTP data if we haven't received a WS snapshot yet
        if (!hasReceivedSnapshot.current) {
          console.log("[OrderBook] ✅ HTTP response:", data.symbol, "bids:", data.bids?.length, "asks:", data.asks?.length);
          const { spread, spreadPercent } = calculateSpread(data.bids, data.asks);
          setOrderBook({
            symbol: data.symbol,
            bids: data.bids,
            asks: data.asks,
            timestamp: data.timestamp,
            spread,
            spreadPercent,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("[OrderBook] HTTP fetch failed:", err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [symbol, depth, calculateSpread]);

  // WebSocket subscription for real-time updates
  useEffect(() => {
    if (!socket || !isConnected || !symbol) {
      console.log("[OrderBook] Not subscribing:", { hasSocket: !!socket, isConnected, symbol });
      return;
    }

    const upperSymbol = symbol.toUpperCase();

    // Subscribe to order book
    console.log("[OrderBook] Subscribing to:", upperSymbol);
    socket.emit("subscribe:orderbook", upperSymbol);

    // Handle full snapshot from WebSocket
    const handleSnapshot = (data: OrderBookSnapshot) => {
      console.log("[OrderBook] 📡 WS snapshot:", data.symbol, "bids:", data.bids?.length, "asks:", data.asks?.length);
      if (data.symbol !== upperSymbol) return;

      hasReceivedSnapshot.current = true;
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

    // Also listen for subscription confirmation
    const handleSubscribed = (data: { channel: string; symbol: string }) => {
      if (data.channel === "orderbook" && data.symbol === upperSymbol) {
        console.log("[OrderBook] ✅ Subscription confirmed:", data);
      }
    };
    socket.on("subscribed", handleSubscribed);

    return () => {
      console.log("[OrderBook] Unsubscribing from:", upperSymbol);
      socket.emit("unsubscribe:orderbook", upperSymbol);
      socket.off("orderbook:snapshot", handleSnapshot);
      socket.off("orderbook:update", handleUpdate);
      socket.off("subscribed", handleSubscribed);
    };
  }, [socket, isConnected, symbol, calculateSpread]);

  return {
    orderBook,
    isConnected,
  };
}
