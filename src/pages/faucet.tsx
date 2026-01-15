import { useState, useEffect, useCallback } from "react";
import {
  getFaucetStats,
  getFaucetHistory,
  requestFromFaucet,
  type FaucetStats,
  type FaucetHistoryItem,
} from "../utils/faucet-api";
import "./faucet.css";

function formatTimeRemaining(nextRequestAt: string | null): string {
  if (!nextRequestAt) return "Now";

  const now = Date.now();
  const next = new Date(nextRequestAt).getTime();
  const diff = next - now;

  if (diff <= 0) return "Now";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FaucetPage() {
  const [stats, setStats] = useState<FaucetStats | null>(null);
  const [history, setHistory] = useState<FaucetHistoryItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsData, historyData] = await Promise.all([
        getFaucetStats(),
        getFaucetHistory(10, 0),
      ]);
      setStats(statsData);
      setHistory(historyData.history);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh countdown every minute
  useEffect(() => {
    if (!stats?.nextRequestAt || stats.canRequest) return;

    const interval = setInterval(() => {
      setStats(prev => {
        if (!prev) return prev;
        const canRequest = prev.nextRequestAt
          ? new Date(prev.nextRequestAt).getTime() <= Date.now()
          : true;
        if (canRequest !== prev.canRequest) {
          return { ...prev, canRequest };
        }
        return { ...prev };
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [stats?.nextRequestAt, stats?.canRequest]);

  const handleClaim = async () => {
    setIsClaiming(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await requestFromFaucet();
      setSuccessMessage(`+${result.amount} tokens claimed!`);

      setStats(prev =>
        prev
          ? {
              ...prev,
              canRequest: false,
              totalRequests: prev.totalRequests + 1,
              totalAmountReceived: prev.totalAmountReceived + result.amount,
              lastRequestAt: new Date().toISOString(),
              nextRequestAt: result.nextRequestAt,
            }
          : prev
      );

      // Refresh history
      const historyData = await getFaucetHistory(10, 0);
      setHistory(historyData.history);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Claim failed");
    } finally {
      setIsClaiming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="faucet-loading">
        <div className="spinner" />
        <p>Loading faucet...</p>
      </div>
    );
  }

  return (
    <div className="faucet-container">
      {/* Claim Card */}
      <div className="faucet-card claim-card">
        <div className="claim-header">
          <h1>Token Faucet</h1>
          <p>Claim free tokens once every 24 hours</p>
        </div>

        <div className="claim-amount">
          <span className="claim-value">100</span>
          <span className="claim-label">tokens per claim</span>
        </div>

        {error && (
          <div className="faucet-error">
            <p>{error}</p>
            <button onClick={() => setError(null)} className="error-dismiss">
              ×
            </button>
          </div>
        )}

        {successMessage && (
          <div className="faucet-success">
            <p>{successMessage}</p>
            <button onClick={() => setSuccessMessage(null)} className="success-dismiss">
              ×
            </button>
          </div>
        )}

        <button
          onClick={handleClaim}
          disabled={isClaiming || !stats?.canRequest}
          className="claim-btn"
        >
          {isClaiming ? (
            <>
              <span className="btn-spinner" />
              Claiming...
            </>
          ) : stats?.canRequest ? (
            "Claim Tokens"
          ) : (
            `Next claim in ${formatTimeRemaining(stats?.nextRequestAt ?? null)}`
          )}
        </button>

        <div className="claim-stats">
          <div className="claim-stat">
            <span className="claim-stat-value">{stats?.totalRequests ?? 0}</span>
            <span className="claim-stat-label">Claims Made</span>
          </div>
          <div className="claim-stat">
            <span className="claim-stat-value">${stats?.totalAmountReceived ?? 0}</span>
            <span className="claim-stat-label">Total Claimed</span>
          </div>
        </div>
      </div>

      {/* History Card */}
      {history.length > 0 && (
        <div className="faucet-card history-card">
          <div className="card-header">
            <h3>Recent Claims</h3>
          </div>

          <div className="history-list">
            {history.map((item, index) => (
              <div key={index} className="history-item">
                <div className="history-item-left">
                  <span className="history-icon">+</span>
                  <span className="history-amount">+${item.amount}</span>
                </div>
                <span className="history-date">{formatDate(item.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
