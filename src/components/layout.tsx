import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { WalletButton } from "./wallet-button";
import "./layout.css";

export function Layout() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-left">
          <NavLink to="/" className="title">
            Demo App
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

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
