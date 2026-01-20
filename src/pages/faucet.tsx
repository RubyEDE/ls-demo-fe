import { useState, useEffect, useCallback, useRef } from "react";
import {
  getFaucetStats,
  getFaucetHistory,
  requestFromFaucet,
  type FaucetStats,
  type FaucetHistoryItem,
} from "../utils/faucet-api";
import { useAuth } from "../context/auth-context";
import "./faucet.css";

// Water droplet animation component
function WaterDroplets() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    interface Droplet {
      x: number;
      y: number;
      radius: number;
      speed: number;
      opacity: number;
      wobble: number;
      wobbleSpeed: number;
    }

    interface Ripple {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      opacity: number;
    }

    const droplets: Droplet[] = [];
    const ripples: Ripple[] = [];
    const maxDroplets = 5;

    const createDroplet = (): Droplet => ({
      x: Math.random() * canvas.offsetWidth,
      y: -10,
      radius: 3 + Math.random() * 3,
      speed: 1.0 + Math.random() * 2,
      opacity: 0.3 + Math.random() * 0.3,
      wobble: 0,
      wobbleSpeed: 0.02 + Math.random() * 0.02,
    });

    // Initialize with a few droplets
    for (let i = 0; i < 3; i++) {
      const droplet = createDroplet();
      droplet.y = Math.random() * canvas.offsetHeight * 0.7;
      droplets.push(droplet);
    }

    let animationId: number;
    let lastTime = 0;
    const spawnInterval = 2500;

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      // Spawn new droplets
      if (time - lastTime > spawnInterval && droplets.length < maxDroplets) {
        droplets.push(createDroplet());
        lastTime = time;
      }

      // Update and draw droplets
      for (let i = droplets.length - 1; i >= 0; i--) {
        const drop = droplets[i];
        
        // Update position with wobble
        drop.wobble += drop.wobbleSpeed;
        drop.y += drop.speed;
        const wobbleX = Math.sin(drop.wobble) * 0.5;

        // Draw droplet shape
        ctx.beginPath();
        ctx.fillStyle = `rgba(0, 212, 170, ${drop.opacity})`;
        
        // Teardrop shape
        const x = drop.x + wobbleX;
        const y = drop.y;
        const r = drop.radius;
        
        ctx.moveTo(x, y - r * 1.5);
        ctx.bezierCurveTo(x + r, y - r, x + r, y + r * 0.5, x, y + r);
        ctx.bezierCurveTo(x - r, y + r * 0.5, x - r, y - r, x, y - r * 1.5);
        ctx.fill();

        // Add subtle glow
        ctx.beginPath();
        ctx.fillStyle = `rgba(0, 212, 170, ${drop.opacity * 0.3})`;
        ctx.arc(x, y, r * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Check if droplet reached bottom
        if (drop.y > canvas.offsetHeight - 20) {
          // Create ripple
          ripples.push({
            x: drop.x,
            y: canvas.offsetHeight - 10,
            radius: 2,
            maxRadius: 15 + Math.random() * 10,
            opacity: 0.4,
          });
          droplets.splice(i, 1);
        }
      }

      // Update and draw ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i];
        ripple.radius += 0.4;
        ripple.opacity -= 0.015;

        if (ripple.opacity <= 0) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.strokeStyle = `rgba(0, 212, 170, ${ripple.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return <canvas ref={canvasRef} className="water-droplets-canvas" />;
}

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
  const { isConnected, isAuthenticated, isAuthLoading, login } = useAuth();
  
  const [stats, setStats] = useState<FaucetStats | null>(null);
  const [history, setHistory] = useState<FaucetHistoryItem[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    
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
  }, [isAuthenticated]);

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
    // If connected but not authenticated, trigger sign-in
    if (isConnected && !isAuthenticated) {
      login();
      return;
    }
    
    setIsClaiming(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await requestFromFaucet();
      setSuccessMessage(`+${result.amount} USDC claimed!`);

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

  if (isAuthenticated && isLoading) {
    return (
      <div className="faucet-loading">
        <div className="spinner" />
        <p>Loading faucet...</p>
      </div>
    );
  }

  return (
    <div className="faucet-page">
      {/* Hero Section */}
      <div className="faucet-hero">
        <WaterDroplets />
        <div className="hero-glow" />
        <div className="hero-content">
          <div className="hero-badge">Testnet Faucet</div>
          <h1 className="hero-title">Get USDC</h1>
          <p className="hero-subtitle">
            Claim every day to start trading on our testnet
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="faucet-content">
        {/* Claim Section */}
        <div className="claim-section">
          <div className="claim-card">
            <div className="claim-amount-display">
              <div className="amount-circle">
                <span className="amount-value">100</span>
                <span className="amount-currency">USDC</span>
              </div>
              <span className="amount-subtitle">per claim</span>
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
              disabled={!isConnected || isAuthLoading || (isAuthenticated && (isClaiming || !stats?.canRequest))}
              className={`claim-btn ${!isAuthenticated && isConnected ? "sign-in" : ""}`}
            >
              {!isConnected ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Connect Wallet
                </>
              ) : isAuthLoading ? (
                <>
                  <span className="btn-spinner" />
                  Signing...
                </>
              ) : !isAuthenticated ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  Sign to Claim
                </>
              ) : isClaiming ? (
                <>
                  <span className="btn-spinner" />
                  Claiming...
                </>
              ) : stats?.canRequest ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Claim Tokens
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Next claim in {formatTimeRemaining(stats?.nextRequestAt ?? null)}
                </>
              )}
            </button>

            <div className="cooldown-info">
              {!isConnected ? (
                <span className="cooldown-waiting">Connect wallet to claim</span>
              ) : !isAuthenticated ? (
                <span className="cooldown-waiting">Sign a message to verify your wallet</span>
              ) : stats?.canRequest ? (
                <span className="cooldown-ready">Ready to claim</span>
              ) : (
                <span className="cooldown-waiting">Cooldown active</span>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="stat-info">
                <span className="faucet-stat-value">${stats?.totalAmountReceived ?? 0}</span>
                <span className="faucet-stat-label">Total Claimed</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div className="stat-info">
                <span className="faucet-stat-value">{stats?.totalRequests ?? 0}</span>
                <span className="faucet-stat-label">Total Claims</span>
              </div>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="history-section">
          <div className="history-header">
            <h3>Claim History</h3>
            {history.length > 0 && <span className="history-count">{history.length} claims</span>}
          </div>

          {history.length > 0 ? (
            <div className="history-list">
              {history.map((item, index) => (
                <div key={index} className="history-item">
                  <div className="history-item-left">
                    <div className="history-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div className="history-details">
                      <span className="history-amount">+${item.amount}</span>
                      <span className="history-label">USDC claimed</span>
                    </div>
                  </div>
                  <span className="history-date">{formatDate(item.createdAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="history-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <p>No claims yet</p>
              <span>Your claim history will appear here</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
