import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./auth-context";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3000";

interface WebSocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { token, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscribedChannelsRef = useRef<Set<string>>(new Set());

  const connect = useCallback(() => {
    // Disconnect existing socket
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(WS_URL, {
      auth: token ? { token } : undefined,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      setIsConnected(true);
      setError(null);

      // Re-subscribe to previously subscribed channels
      subscribedChannelsRef.current.forEach((channel) => {
        const [type, symbol] = channel.split(":");
        socket.emit(`subscribe:${type}`, symbol);
      });
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      if (reason === "io server disconnect") {
        // Server disconnected, try to reconnect
        socket.connect();
      }
    });

    socket.on("connect_error", (err) => {
      setError(err.message);
      setIsConnected(false);
    });

    socket.on("error", (err: { code: string; message: string }) => {
      setError(err.message);
    });

    // Track subscriptions for reconnection
    socket.on("subscribed", (data: { channel: string; symbol: string }) => {
      subscribedChannelsRef.current.add(`${data.channel}:${data.symbol}`);
    });

    socket.on("unsubscribed", (data: { channel: string; symbol: string }) => {
      subscribedChannelsRef.current.delete(`${data.channel}:${data.symbol}`);
    });

    socketRef.current = socket;
  }, [token]);

  const reconnect = useCallback(() => {
    connect();
  }, [connect]);

  // Connect on mount and when auth changes
  useEffect(() => {
    connect();

    // Handle visibility change - reconnect when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !socketRef.current?.connected) {
        connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [connect, isAuthenticated]);

  return (
    <WebSocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        error,
        reconnect,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket(): WebSocketContextValue {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}
