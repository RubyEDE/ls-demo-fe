import { useEffect, useRef } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { useReferralCodeFromUrl, useApplyReferralCode } from "../hooks/use-referrals";
import { WalletButton } from "./wallet-button";
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

  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isFullWidth = location.pathname === "/";

  const isTradePage = location.pathname === "/";

  return (
    <div className="app-container">
      <header className={`header ${isTradePage ? "header-terminal" : ""}`}>
        <div className="header-left">
          <NavLink to="/" className="title">
            Longsword
          </NavLink>
          <nav className="nav">
            <NavLink
              to="/"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              end
            >
              Trade
            </NavLink>
            {isAuthenticated && (
              <NavLink
                to="/faucet"
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                Faucet
              </NavLink>
            )}
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
        <WalletButton />
      </header>

      <main className={`main-content ${isFullWidth ? "full-width" : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}
