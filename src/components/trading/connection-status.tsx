import { useWebSocket } from "../../context/websocket-context";
import "./connection-status.css";

export function ConnectionStatus() {
  const { isConnected, error, reconnect } = useWebSocket();

  if (isConnected) {
    return (
      <div className="connection-status connected">
        <span className="status-indicator" />
        <span>Live</span>
      </div>
    );
  }

  return (
    <div className="connection-status disconnected">
      <span className="status-indicator" />
      <span>{error || "Disconnected"}</span>
      <button onClick={reconnect} className="reconnect-btn">
        Reconnect
      </button>
    </div>
  );
}
