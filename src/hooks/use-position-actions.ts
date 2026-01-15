import { useState, useCallback } from "react";
import { closePosition } from "../utils/clob-api";
import type { Position, ClosePositionResult } from "../types/position";

export function usePositionActions() {
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closePositionAction = useCallback(
    async (marketSymbol: string, quantity?: number): Promise<ClosePositionResult | null> => {
      setIsClosing(true);
      setError(null);

      try {
        const result = await closePosition(marketSymbol, quantity);

        if (!result.success) {
          setError(result.error || "Failed to close position");
          return null;
        }

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return null;
      } finally {
        setIsClosing(false);
      }
    },
    []
  );

  const closeAllPositions = useCallback(
    async (positions: Position[]): Promise<number> => {
      let closed = 0;

      for (const position of positions) {
        if (position.status === "open" && position.size > 0) {
          const result = await closePositionAction(position.marketSymbol);
          if (result?.success) closed++;
        }
      }

      return closed;
    },
    [closePositionAction]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    closePosition: closePositionAction,
    closeAllPositions,
    isClosing,
    error,
    clearError,
  };
}
