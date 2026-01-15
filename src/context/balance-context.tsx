import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useAuth } from "./auth-context";
import { getBalance } from "../utils/faucet-api";
import { useUserEvents } from "../hooks/use-user-events";
import type { BalanceUpdate } from "../types/websocket";

interface BalanceContextValue {
  /** Available balance (free cash, not locked in orders) */
  availableBalance: number | null;
  /** Total balance (including locked) */
  totalBalance: number | null;
  /** Locked balance (in open orders) */
  lockedBalance: number | null;
  /** Whether balance is loading */
  isLoading: boolean;
  /** Manually refresh balance from API */
  refreshBalance: () => Promise<void>;
}

const BalanceContext = createContext<BalanceContextValue | null>(null);

interface BalanceProviderProps {
  children: ReactNode;
}

export function BalanceProvider({ children }: BalanceProviderProps) {
  const { isAuthenticated } = useAuth();
  const [availableBalance, setAvailableBalance] = useState<number | null>(null);
  const [totalBalance, setTotalBalance] = useState<number | null>(null);
  const [lockedBalance, setLockedBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshBalance = useCallback(async () => {
    if (!isAuthenticated) {
      setAvailableBalance(null);
      setTotalBalance(null);
      setLockedBalance(null);
      return;
    }

    setIsLoading(true);
    try {
      const data = await getBalance();
      setAvailableBalance(data.free);
      setTotalBalance(data.total);
      setLockedBalance(data.locked);
    } catch {
      // Keep existing values on error
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Listen to real-time balance updates via WebSocket
  useUserEvents({
    onBalanceUpdated: useCallback((balance: BalanceUpdate) => {
      setAvailableBalance(balance.free);
      setTotalBalance(balance.total);
      setLockedBalance(balance.locked);
    }, []),
  });

  // Fetch balance on auth change
  useEffect(() => {
    if (!isAuthenticated) {
      setAvailableBalance(null);
      setTotalBalance(null);
      setLockedBalance(null);
      return;
    }

    refreshBalance();

    // Refresh balance every 30 seconds as a fallback
    const interval = setInterval(refreshBalance, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, refreshBalance]);

  return (
    <BalanceContext.Provider
      value={{
        availableBalance,
        totalBalance,
        lockedBalance,
        isLoading,
        refreshBalance,
      }}
    >
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance(): BalanceContextValue {
  const context = useContext(BalanceContext);
  if (!context) {
    throw new Error("useBalance must be used within a BalanceProvider");
  }
  return context;
}
