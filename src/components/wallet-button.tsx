import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState, useEffect } from "react";
import { useAuth } from "../context/auth-context";
import { getBalance } from "../utils/faucet-api";
import "./wallet-button.css";

export function WalletButton() {
  const { isAuthenticated } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setBalance(null);
      return;
    }

    const fetchBalance = async () => {
      try {
        const data = await getBalance();
        setBalance(data.total);
      } catch {
        setBalance(null);
      }
    };

    fetchBalance();

    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button onClick={openConnectModal} className="wallet-btn connect">
                    Connect Wallet
                  </button>
                );
              }

              return (
                <button onClick={openAccountModal} className="wallet-btn connected">
                  {isAuthenticated && balance !== null && (
                    <span className="wallet-balance">${balance}</span>
                  )}
                  <span className="wallet-address">
                    {account.ensName || account.displayName}
                  </span>
                </button>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
