import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useAccount, useDisconnect, useEnsName } from "wagmi";
import { useEvmAuth } from "../hooks/use-evm-auth";
import type { Address } from "viem";

interface AuthState {
  // Wallet connection state
  isConnected: boolean;
  isConnecting: boolean;
  isDisconnected: boolean;
  address: Address | undefined;
  ensName: string | null | undefined;
  chainId: number | undefined;
  disconnectWallet: () => void;

  // Backend authentication state
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  token: string | null;
  login: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const {
    address,
    isConnected,
    isConnecting,
    isDisconnected,
    chainId,
  } = useAccount();

  const { disconnect: disconnectWallet } = useDisconnect();

  const { data: ensName } = useEnsName({
    address,
    chainId: 1, // ENS is on mainnet
    query: {
      enabled: Boolean(address),
    },
  });

  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    error: authError,
    token,
    login,
    logout,
    clearError,
  } = useEvmAuth();

  const value = useMemo<AuthState>(
    () => ({
      // Wallet
      isConnected,
      isConnecting,
      isDisconnected,
      address,
      ensName,
      chainId,
      disconnectWallet,

      // Auth
      isAuthenticated,
      isAuthLoading,
      authError,
      token,
      login,
      logout,
      clearError,
    }),
    [
      isConnected,
      isConnecting,
      isDisconnected,
      address,
      ensName,
      chainId,
      disconnectWallet,
      isAuthenticated,
      isAuthLoading,
      authError,
      token,
      login,
      logout,
      clearError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
