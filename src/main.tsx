import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { RouterProvider } from "react-router-dom";
import { config } from "./config/wagmi";
import { AuthProvider } from "./context/auth-context";
import { WebSocketProvider } from "./context/websocket-context";
import { BalanceProvider } from "./context/balance-context";
import { LevelProvider } from "./context/level-context";
import { CandleProvider } from "./context/candle-context";
import { router } from "./router";
import "@rainbow-me/rainbowkit/styles.css";
import "./index.css";

// Capture referral code from URL immediately on app load
(function captureReferralCode() {
  const REFERRAL_CODE_KEY = "pending_referral_code";
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get("ref");
  
  if (refCode) {
    localStorage.setItem(REFERRAL_CODE_KEY, refCode.toUpperCase());
    // Clean URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.delete("ref");
    window.history.replaceState({}, "", url.toString());
  }
})();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#7c3aed",
            accentColorForeground: "white",
            borderRadius: "medium",
          })}
        >
          <AuthProvider>
            <WebSocketProvider>
              <BalanceProvider>
                <LevelProvider>
                  <CandleProvider>
                    <RouterProvider router={router} />
                  </CandleProvider>
                </LevelProvider>
              </BalanceProvider>
            </WebSocketProvider>
          </AuthProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
