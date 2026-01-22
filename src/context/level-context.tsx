import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useAuth } from "./auth-context";
import { useWebSocket } from "./websocket-context";
import { getLevelInfo } from "../utils/level-api";
import type { LevelInfo, XPGainedEvent, LevelUpEvent } from "../types/leveling";

interface RecentXPGain {
  id: string;
  amount: number;
  reason: string;
  timestamp: number;
}

interface LevelContextValue {
  /** Current level info */
  levelInfo: LevelInfo | null;
  /** Whether level info is loading */
  isLoading: boolean;
  /** Recent XP gains (for showing notifications) */
  recentXPGains: RecentXPGain[];
  /** Recent level up (for showing celebration) */
  levelUp: LevelUpEvent | null;
  /** Dismiss a specific XP notification */
  dismissXPGain: (id: string) => void;
  /** Dismiss level up notification */
  dismissLevelUp: () => void;
  /** Manually refresh level info from API */
  refreshLevelInfo: () => Promise<void>;
}

const LevelContext = createContext<LevelContextValue | null>(null);

interface LevelProviderProps {
  children: ReactNode;
}

export function LevelProvider({ children }: LevelProviderProps) {
  const { isAuthenticated } = useAuth();
  const { socket, isConnected } = useWebSocket();
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentXPGains, setRecentXPGains] = useState<RecentXPGain[]>([]);
  const [levelUp, setLevelUp] = useState<LevelUpEvent | null>(null);
  const subscribedRef = useRef(false);
  // Track last notification time by key (amount + reason) to only throttle duplicates
  const lastXPNotificationRef = useRef<Map<string, number>>(new Map());
  const hasFetchedRef = useRef(false);

  const refreshLevelInfo = useCallback(async () => {
    if (!isAuthenticated) {
      setLevelInfo(null);
      return;
    }

    setIsLoading(true);
    try {
      const data = await getLevelInfo();
      setLevelInfo(data);
      hasFetchedRef.current = true;
    } catch {
      // Keep existing values on error
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const dismissXPGain = useCallback((id: string) => {
    setRecentXPGains((prev) => prev.filter((xp) => xp.id !== id));
  }, []);

  const dismissLevelUp = useCallback(() => {
    setLevelUp(null);
  }, []);

  // Subscribe to XP events via WebSocket
  useEffect(() => {
    if (!socket || !isConnected || !isAuthenticated) {
      subscribedRef.current = false;
      return;
    }

    // Subscribe to XP channel
    if (!subscribedRef.current) {
      socket.emit("subscribe:xp");
      subscribedRef.current = true;
    }

    // Handle XP gained events
    const handleXPGained = (data: XPGainedEvent) => {
      // Update level info from event data (always update, even if we throttle notifications)
      setLevelInfo({
        level: data.level,
        experience: data.currentExperience,
        totalExperience: data.totalExperience,
        experienceForNextLevel: data.experienceForNextLevel,
        experienceToNextLevel: data.experienceForNextLevel - data.currentExperience,
        progressPercentage: data.progressPercentage,
        isMaxLevel: data.level >= 100,
      });

      // Throttle duplicate notifications: only suppress if same amount+reason within 5 seconds
      const notificationKey = `${data.amount}:${data.reason}`;
      const now = Date.now();
      const lastTime = lastXPNotificationRef.current.get(notificationKey) || 0;
      
      if (now - lastTime < 5000) {
        return;
      }
      lastXPNotificationRef.current.set(notificationKey, now);

      // Add to recent XP gains for notification display
      const xpGain: RecentXPGain = {
        id: `${data.timestamp}-${Math.random()}`,
        amount: data.amount,
        reason: data.reason,
        timestamp: data.timestamp,
      };
      setRecentXPGains((prev) => [...prev, xpGain]);

      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setRecentXPGains((prev) => prev.filter((xp) => xp.id !== xpGain.id));
      }, 3000);
    };

    // Handle level up events
    const handleLevelUp = (data: LevelUpEvent) => {
      setLevelUp(data);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setLevelUp(null);
      }, 5000);
    };

    socket.on("xp:gained", handleXPGained);
    socket.on("xp:levelup", handleLevelUp);

    return () => {
      socket.off("xp:gained", handleXPGained);
      socket.off("xp:levelup", handleLevelUp);
      if (subscribedRef.current) {
        socket.emit("unsubscribe:xp");
        subscribedRef.current = false;
      }
    };
  }, [socket, isConnected, isAuthenticated]);

  // Fetch level info on auth change
  useEffect(() => {
    if (!isAuthenticated) {
      setLevelInfo(null);
      setRecentXPGains([]);
      setLevelUp(null);
      hasFetchedRef.current = false;
      return;
    }

    // Fetch immediately when authenticated
    // Use ref to avoid duplicate fetches from effect re-runs
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      
      const fetchLevel = async () => {
        setIsLoading(true);
        try {
          const data = await getLevelInfo();
          setLevelInfo(data);
        } catch {
          // Keep existing values on error
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchLevel();
    }
  }, [isAuthenticated]);

  return (
    <LevelContext.Provider
      value={{
        levelInfo,
        isLoading,
        recentXPGains,
        levelUp,
        dismissXPGain,
        dismissLevelUp,
        refreshLevelInfo,
      }}
    >
      {children}
    </LevelContext.Provider>
  );
}

export function useLevel(): LevelContextValue {
  const context = useContext(LevelContext);
  if (!context) {
    throw new Error("useLevel must be used within a LevelProvider");
  }
  return context;
}
