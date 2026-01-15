import { useState, useEffect, useCallback } from "react";
import { useAccount, useSignMessage } from "wagmi";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

interface AuthState {
  token: string | null;
  authenticatedAddress: string | null;
  expiresAt: number | null;
  isLoading: boolean;
  error: string | null;
}

const getStoredAuth = (): Pick<AuthState, "token" | "authenticatedAddress" | "expiresAt"> => ({
  token: localStorage.getItem("auth_token"),
  authenticatedAddress: localStorage.getItem("auth_address"),
  expiresAt: Number(localStorage.getItem("auth_expires")) || null,
});

const clearStoredAuth = () => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_address");
  localStorage.removeItem("auth_expires");
};

const setStoredAuth = (token: string, address: string, expiresAt: number) => {
  localStorage.setItem("auth_token", token);
  localStorage.setItem("auth_address", address);
  localStorage.setItem("auth_expires", String(expiresAt));
};

export function useEvmAuth() {
  const { address, chainId, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [authState, setAuthState] = useState<AuthState>(() => ({
    ...getStoredAuth(),
    isLoading: false,
    error: null,
  }));

  // Clear auth when wallet disconnects or address changes
  useEffect(() => {
    if (!isConnected) {
      clearStoredAuth();
      setAuthState({
        token: null,
        authenticatedAddress: null,
        expiresAt: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    // If address changed, clear previous auth
    if (authState.authenticatedAddress && address !== authState.authenticatedAddress) {
      clearStoredAuth();
      setAuthState({
        token: null,
        authenticatedAddress: null,
        expiresAt: null,
        isLoading: false,
        error: null,
      });
    }
  }, [isConnected, address, authState.authenticatedAddress]);

  // Listen for account/chain changes via window.ethereum
  useEffect(() => {
    const handleAccountsChanged = () => {
      clearStoredAuth();
      setAuthState(prev => ({
        ...prev,
        token: null,
        authenticatedAddress: null,
        expiresAt: null,
        error: null,
      }));
    };

    const handleChainChanged = () => {
      // Optionally clear auth on chain change
      // Uncomment if you want to require re-auth on chain switch:
      // handleAccountsChanged();
    };

    window.ethereum?.on?.("accountsChanged", handleAccountsChanged);
    window.ethereum?.on?.("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener?.("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener?.("chainChanged", handleChainChanged);
    };
  }, []);

  const login = useCallback(async () => {
    if (!address) {
      setAuthState(prev => ({ ...prev, error: "Wallet not connected" }));
      return;
    }

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Step 1: Get nonce and message from backend
      const nonceRes = await fetch(
        `${API_BASE}/auth/nonce?address=${address}&chainId=${chainId || 1}`
      );

      if (!nonceRes.ok) {
        const err = await nonceRes.json();
        throw new Error(err.message || "Failed to get nonce");
      }

      const { message } = await nonceRes.json();

      // Step 2: Sign the message with wallet
      const signature = await signMessageAsync({ message });

      // Step 3: Verify signature and get token
      const verifyRes = await fetch(`${API_BASE}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature }),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.message || "Verification failed");
      }

      const { token, address: authAddress, expiresAt } = await verifyRes.json();

      // Store in localStorage
      setStoredAuth(token, authAddress, expiresAt);

      setAuthState({
        token,
        authenticatedAddress: authAddress,
        expiresAt,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setAuthState(prev => ({ ...prev, isLoading: false, error: message }));
    }
  }, [address, chainId, signMessageAsync]);

  const logout = useCallback(() => {
    clearStoredAuth();
    setAuthState({
      token: null,
      authenticatedAddress: null,
      expiresAt: null,
      isLoading: false,
      error: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  const isAuthenticated = Boolean(
    authState.token &&
    authState.expiresAt &&
    authState.expiresAt > Date.now() &&
    authState.authenticatedAddress === address
  );

  return {
    ...authState,
    isAuthenticated,
    login,
    logout,
    clearError,
  };
}
