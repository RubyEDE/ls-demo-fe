import { SwordLoader } from "../components/sword-loader";
import "./loading.css";

export function LoadingPage() {
  return (
    <div className="loading-page">
      <div className="loading-page-header">
        <h1>Sword Loader</h1>
        <p>Loading animations for the platform</p>
      </div>

      <div className="loader-grid">
        {/* Float variant (default) */}
        <div className="loader-card">
          <h3 className="loader-card-title">Float</h3>
          <p className="loader-card-description">
            Default floating animation with gentle movement
          </p>
          <div className="loader-display">
            <SwordLoader variant="float" text="Loading..." />
          </div>
        </div>

        {/* Slash variant */}
        <div className="loader-card">
          <h3 className="loader-card-title">Slash</h3>
          <p className="loader-card-description">
            Sword slashing back and forth
          </p>
          <div className="loader-display">
            <SwordLoader variant="slash" text="Processing..." />
          </div>
        </div>

        {/* Spin variant */}
        <div className="loader-card">
          <h3 className="loader-card-title">Spin</h3>
          <p className="loader-card-description">
            Continuous spinning animation
          </p>
          <div className="loader-display">
            <SwordLoader variant="spin" text="Please wait..." />
          </div>
        </div>

        {/* Pulse variant */}
        <div className="loader-card">
          <h3 className="loader-card-title">Pulse</h3>
          <p className="loader-card-description">
            Pulsing glow effect with scaling
          </p>
          <div className="loader-display">
            <SwordLoader variant="pulse" text="Connecting..." />
          </div>
        </div>
      </div>

      {/* Size comparison */}
      <div className="fullpage-demo">
        <div className="fullpage-demo-header">
          <h2>Size Variants</h2>
          <p>Available in small, medium, and large sizes</p>
        </div>
        <div className="fullpage-loader-container">
          <div className="size-comparison">
            <div className="size-item">
              <SwordLoader size="small" showParticles={false} />
              <span className="size-label">Small</span>
            </div>
            <div className="size-item">
              <SwordLoader size="medium" showParticles={false} />
              <span className="size-label">Medium</span>
            </div>
            <div className="size-item">
              <SwordLoader size="large" showParticles={false} />
              <span className="size-label">Large</span>
            </div>
          </div>
        </div>
      </div>

      {/* Full page loader example */}
      <div className="fullpage-demo">
        <div className="fullpage-demo-header">
          <h2>Full Page Loader</h2>
          <p>Use for initial page loads or full-screen loading states</p>
        </div>
        <div className="fullpage-loader-container">
          <SwordLoader size="large" variant="pulse" text="Loading your quest..." />
        </div>
      </div>
    </div>
  );
}
