import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { SwordLoader } from "./sword-loader";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { isConnected, isAuthenticated, isConnecting } = useAuth();
  const location = useLocation();

  // Show nothing while connecting
  if (isConnecting) {
    return (
      <div className="loading-container">
        <SwordLoader text="Connecting..." />
      </div>
    );
  }

  // If auth is required but user is not authenticated
  if (requireAuth && (!isConnected || !isAuthenticated)) {
    // Redirect to home with the intended destination
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
