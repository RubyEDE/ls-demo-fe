import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAuth } from "../context/auth-context";
import { useBalance } from "../context/balance-context";
import "./wallet-button.css";

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function WalletButton() {
  const { isAuthenticated } = useAuth();
  const { availableBalance } = useBalance();

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
            className="wallet-container"
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                    </svg>
                    Connect Wallet
                  </button>
                );
              }

              return (
                <>
                  {isAuthenticated && availableBalance !== null && (
                    <div className="balance-display">
                      <span className="balance-label">Balance</span>
                      <span className="balance-amount">{formatMoney(availableBalance)}</span>
                    </div>
                  )}
                  <button onClick={openAccountModal} className="wallet-btn connected">
                    <div className="wallet-avatar">
                      {(account.ensName || account.displayName || "").slice(0, 2).toUpperCase()}
                    </div>
                    <span className="wallet-address">
                      {account.ensName || account.displayName}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </button>
                </>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
