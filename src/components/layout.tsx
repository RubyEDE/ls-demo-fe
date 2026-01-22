import { useEffect, useRef, useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { useReferralCodeFromUrl, useApplyReferralCode } from "../hooks/use-referrals";
import { WalletButton } from "./wallet-button";
import { XPNotifications } from "./xp-notifications";
import "./layout.css";

// Auto-apply referral code when user authenticates
function useAutoApplyReferral() {
  const { isAuthenticated } = useAuth();
  const { pendingCode, isValid, clearPendingCode } = useReferralCodeFromUrl();
  const applyMutation = useApplyReferralCode();
  const hasAttempted = useRef(false);

  useEffect(() => {
    // Only attempt once per session to avoid loops
    if (
      isAuthenticated &&
      pendingCode &&
      isValid &&
      !applyMutation.isPending &&
      !hasAttempted.current
    ) {
      hasAttempted.current = true;
      applyMutation.mutate(pendingCode, {
        onSuccess: () => clearPendingCode(),
        onError: () => clearPendingCode(),
      });
    }
  }, [isAuthenticated, pendingCode, isValid, applyMutation, clearPendingCode]);
}

export function Layout() {
  // Auto-apply referral code on any page
  useAutoApplyReferral();

  const location = useLocation();
  const isFullWidth = location.pathname === "/";
  const isTradePage = location.pathname === "/";

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="app-container">
      <header className={`header ${isTradePage ? "header-terminal" : ""}`}>
        <div className="header-left">
          <NavLink to="/" className="title">
            Longsword
          </NavLink>
          <nav className="nav nav-desktop">
            <NavLink
              to="/"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              end
            >
              Trade
            </NavLink>
            <NavLink
              to="/faucet"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Faucet
            </NavLink>
            <NavLink
              to="/achievements"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Achievements
            </NavLink>
            <NavLink
              to="/referrals"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              Referrals
            </NavLink>
          </nav>
        </div>
        <div className="header-right">
          <WalletButton />
          <button
            className={`mobile-menu-toggle ${isMobileMenuOpen ? "open" : ""}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div
        className={`mobile-menu-overlay ${isMobileMenuOpen ? "open" : ""}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile navigation drawer */}
      <nav className={`nav-mobile ${isMobileMenuOpen ? "open" : ""}`}>
        <div className="nav-mobile-links">
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? "nav-mobile-link active" : "nav-mobile-link")}
            end
          >
            Trade
          </NavLink>
          <NavLink
            to="/faucet"
            className={({ isActive }) => (isActive ? "nav-mobile-link active" : "nav-mobile-link")}
          >
            Faucet
          </NavLink>
          <NavLink
            to="/achievements"
            className={({ isActive }) => (isActive ? "nav-mobile-link active" : "nav-mobile-link")}
          >
            Achievements
          </NavLink>
          <NavLink
            to="/referrals"
            className={({ isActive }) => (isActive ? "nav-mobile-link active" : "nav-mobile-link")}
          >
            Referrals
          </NavLink>
        </div>
      </nav>

      <main className={`main-content ${isFullWidth ? "full-width" : ""}`}>
        <Outlet />
      </main>

      {/* XP Notifications */}
      <XPNotifications />
    </div>
  );
}
