import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { WalletButton } from "./wallet-button";
import "./layout.css";

export function Layout() {
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
