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
                  {isAuthenticated && availableBalance !== null && (
                    <span className="wallet-balance">{formatMoney(availableBalance)}</span>
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
