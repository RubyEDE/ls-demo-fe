import { useRouteError, isRouteErrorResponse, useNavigate } from "react-router-dom";
import "./error.css";

export function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  // Extract error details with proper type narrowing
  let is404: boolean = false;
  let statusCode: number = 500;
  let statusText: string = "Something went wrong";
  
  if (isRouteErrorResponse(error)) {
    is404 = error.status === 404;
    statusCode = error.status;
    statusText = error.statusText || "Error";
  }
  
  const title: string = is404 ? "Page Not Found" : statusText;

  return (
    <div className="error-page">
      {/* Background Effects */}
      <div className="error-glow" />
      <div className="error-grid" />

      {/* Content */}
      <div className="error-content">
        {/* Glitch Effect Number */}
        <div className="error-code-container">
          <span className="error-code" data-text={statusCode}>
            {statusCode}
          </span>
        </div>

        {/* Icon */}
        <div className="error-icon">
          {is404 ? (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
              <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" />
              <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" />
            </svg>
          ) : (
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
        </div>

        {/* Message */}
        <h1 className="error-title">
          {title}
        </h1>
        <p className="error-description">
          {is404 
            ? "The page you're looking for doesn't exist or has been moved."
            : "An unexpected error occurred. Please try again later."
          }
        </p>

        {/* Actions */}
        <div className="error-actions">
          <button onClick={() => navigate(-1)} className="error-btn error-btn-secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Go Back
          </button>
          <button onClick={() => navigate("/")} className="error-btn error-btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Back to Trading
          </button>
        </div>

        {/* Debug Info (only in development) */}
        {import.meta.env.DEV && error instanceof Error && (
          <details className="error-details">
            <summary>Technical Details</summary>
            <pre>
              {error.stack || error.message}
            </pre>
          </details>
        )}
      </div>

      {/* Floating Particles */}
      <div className="error-particles">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="particle" style={{ '--delay': `${i * 0.5}s` } as React.CSSProperties} />
        ))}
      </div>
    </div>
  );
}
