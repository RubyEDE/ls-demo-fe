import { useNavigate, useLocation } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAuth } from "../context/auth-context";
import "./home.css";

function AuthenticatedContent() {
  const { address, ensName, chainId, logout, disconnectWallet } = useAuth();
  const navigate = useNavigate();

  const displayName = ensName || `${address?.slice(0, 6)}...${address?.slice(-4)}`;

  return (
    <div className="home-card">
      <div className="wallet-badge authenticated">
        <span className="status-dot" />
        Authenticated
      </div>
      <p className="wallet-address">{displayName}</p>
      <p className="chain-info">Chain ID: {chainId}</p>

      <button onClick={() => navigate("/faucet")} className="primary-btn large">
        Go to Faucet
      </button>

      <div className="button-group">
        <button onClick={logout} className="secondary-btn">
          Sign Out
        </button>
        <button onClick={() => disconnectWallet()} className="disconnect-btn">
          Disconnect
        </button>
      </div>
    </div>
  );
}

function SignInPrompt() {
  const {
    address,
    ensName,
    chainId,
    isAuthLoading,
    authError,
    login,
    clearError,
    disconnectWallet,
  } = useAuth();
  const location = useLocation();

  const displayName = ensName || `${address?.slice(0, 6)}...${address?.slice(-4)}`;
  const from = location.state?.from?.pathname;

  return (
    <div className="home-card">
      <div className="wallet-badge">
        <span className="status-dot connected" />
        Connected
      </div>
      <p className="wallet-address">{displayName}</p>
      <p className="chain-info">Chain ID: {chainId}</p>

      <p className="sign-in-prompt">
        {from ? `Sign in to access ${from}` : "Sign a message to authenticate"}
      </p>

      {authError && (
        <div className="error-message">
          <p>{authError}</p>
          <button onClick={clearError} className="error-dismiss">
            Dismiss
          </button>
        </div>
      )}

      <div className="button-group">
        <button onClick={login} disabled={isAuthLoading} className="primary-btn">
          {isAuthLoading ? (
            <>
              <span className="btn-spinner" />
              Signing...
            </>
          ) : (
            "Sign In"
          )}
        </button>
        <button onClick={() => disconnectWallet()} className="disconnect-btn">
          Disconnect
        </button>
      </div>
    </div>
  );
}

function WelcomeCard() {
  return (
    <div className="home-card">
      <h2>Welcome</h2>
      <p>Connect your wallet to get started</p>
      <ConnectButton />
    </div>
  );
}

export function HomePage() {
  const { isConnected, isConnecting, isAuthenticated } = useAuth();

  return (
    <div className="home-container">
      {isConnecting && (
        <div className="home-card connecting">
          <div className="spinner" />
          <p>Connecting wallet...</p>
        </div>
      )}

      {isConnected && isAuthenticated && <AuthenticatedContent />}

      {isConnected && !isAuthenticated && !isConnecting && <SignInPrompt />}

      {!isConnected && !isConnecting && <WelcomeCard />}
    </div>
  );
}
