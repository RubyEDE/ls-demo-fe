import { useEffect, useState } from "react";
import { useWebSocket } from "../context/websocket-context";
import type { FundingUpdate, FundingPayment } from "../types/funding";

export function useFundingUpdates(symbol: string) {
  const { socket, isConnected } = useWebSocket();
  const [fundingData, setFundingData] = useState<FundingUpdate | null>(null);
  const [lastPayment, setLastPayment] = useState<FundingPayment | null>(null);

  useEffect(() => {
    if (!socket || !isConnected || !symbol) return;

    // Subscribe to funding updates
    socket.emit("subscribe:funding", symbol);

    // Listen for real-time funding rate updates
    const handleUpdate = (data: FundingUpdate) => {
      if (data.symbol === symbol) {
        setFundingData(data);
      }
    };

    // Listen for funding payment events (when funding is settled)
    const handlePayment = (data: FundingPayment) => {
      if (data.symbol === symbol) {
        setLastPayment(data);
      }
    };

    socket.on("funding:update", handleUpdate);
    socket.on("funding:payment", handlePayment);

    return () => {
      socket.emit("unsubscribe:funding", symbol);
      socket.off("funding:update", handleUpdate);
      socket.off("funding:payment", handlePayment);
    };
  }, [socket, isConnected, symbol]);

  return { fundingData, lastPayment, isConnected };
}
