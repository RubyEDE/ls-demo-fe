import { useState } from "react";
import { useAuth } from "../context/auth-context";
import {
  useMyReferralCode,
  useMyReferralStats,
  useReferralCodeFromUrl,
} from "../hooks/use-referrals";
import "./referrals.css";

// ==================== SVG Icon Components ====================

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

// ==================== Utility Functions ====================

function truncateAddress(address: string): string {
  if (address.length <= 13) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// ==================== Referral Banner Component ====================

function ReferralBanner() {
  const { isAuthenticated } = useAuth();
  const { pendingCode, isValid, referrerAddress, clearPendingCode } = useReferralCodeFromUrl();

  // Note: Auto-apply is handled in Layout component

  if (!pendingCode || !isValid) return null;

  return (
    <div className="referral-banner">
      <div className="referral-banner-content">
        <span className="referral-banner-title">
          You were referred by {referrerAddress ? truncateAddress(referrerAddress) : "a friend"}
        </span>
        <span className="referral-banner-subtitle">
          {isAuthenticated
            ? "Use the faucet to complete the referral!"
            : "Connect your wallet to claim your referral bonus!"}
        </span>
      </div>
      <button onClick={clearPendingCode} className="referral-banner-dismiss">×</button>
    </div>
  );
}

// ==================== Share Section Component ====================

function ShareSection() {
  const { data, isLoading, error } = useMyReferralCode();
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    if (!data?.referralCode) return;
    const shareUrl = `${window.location.origin}?ref=${data.referralCode}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return <div className="share-card skeleton" />;
  }

  if (error || !data || !data.referralCode) {
    return (
      <div className="share-card share-card-error">
        <p>Unable to load your referral code. Please try refreshing the page.</p>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}?ref=${data.referralCode}`;
  const shareText = "Trade perps with me!";

  return (
    <div className="share-card">
      {/* Code Display */}
      <div className="code-display">
        <span className="code-label">Your Code</span>
        <span className="code-value">{data.referralCode}</span>
      </div>

      {/* Copy Link */}
      <div className="link-section">
        <div className="link-input-group">
          <LinkIcon className="link-icon" />
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="link-input"
            onClick={(e) => e.currentTarget.select()}
          />
        </div>
        <button onClick={copyLink} className={`copy-btn ${copied ? "copied" : ""}`}>
          {copied ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy Link</>}
        </button>
      </div>

      {/* Social Share */}
      <div className="social-share">
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="social-btn twitter"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
        <a
          href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="social-btn telegram"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
        </a>
      </div>
    </div>
  );
}

// ==================== Connect Prompt Component ====================

function ConnectPrompt() {
  return (
    <div className="connect-card">
      <div className="connect-icon">
        <UserIcon />
      </div>
      <h2>Connect to Get Started</h2>
      <p>Connect your wallet and sign in to get your unique referral code and start earning rewards!</p>
    </div>
  );
}

// ==================== My Stats Component ====================

function MyStats() {
  const { data: stats, isLoading } = useMyReferralStats();

  if (isLoading || !stats) return null;

  return (
    <div className="referral-global-stats">
      <div className="referral-stat">
        <span className="referral-stat-value">{stats.completedReferrals.toLocaleString()}</span>
        <span className="referral-stat-label">People Referred</span>
      </div>
      <div className="referral-stat-divider" />
      <div className="referral-stat">
        <span className="referral-stat-value">{stats.totalRewardsEarned.toLocaleString()}</span>
        <span className="referral-stat-label">Credits Earned</span>
      </div>
    </div>
  );
}

// ==================== Main Page Component ====================

export function ReferralsPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="referrals-page">
      {/* Background */}
      <div className="referrals-bg">
        <div className="bg-glow" />
      </div>

      {/* Hero */}
      <div className="referrals-hero">
        <div className="hero-icon">
          <UsersIcon />
        </div>
        <h1>Referral Program</h1>
        <p>Invite friends and earn 10 credits for each user who uses the faucet!</p>
        {isAuthenticated && <MyStats />}
      </div>

      {/* Content */}
      <div className="referrals-content">
        <ReferralBanner />
        {isAuthenticated ? <ShareSection /> : <ConnectPrompt />}
      </div>
    </div>
  );
}
