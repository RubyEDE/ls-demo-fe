import { useState, useMemo, useEffect } from "react";
import { useTrading } from "../../hooks/use-trading";
import { useAuth } from "../../context/auth-context";
import { useBalance } from "../../context/balance-context";
import type { Market } from "../../types/clob";
import "./order-form.css";

interface OrderFormProps {
  market: Market | null;
  onOrderPlaced?: () => void;
  selectedPrice?: { price: number; timestamp: number } | null;
}

export function OrderForm({ market, onOrderPlaced, selectedPrice }: OrderFormProps) {
  const { isConnected, isAuthenticated, isAuthLoading, login } = useAuth();
  const { placeOrder, isPlacing, error, clearError } = useTrading();
  const { refreshBalance } = useBalance();

  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"limit" | "market">("limit");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [postOnly, setPostOnly] = useState(false);
  const [leverage, setLeverage] = useState(1);
  const [showLeveragePopup, setShowLeveragePopup] = useState(false);
  const [tempLeverage, setTempLeverage] = useState(1);

  const maxLeverage = market?.maxLeverage || 20;

  const handleOpenLeveragePopup = () => {
    setTempLeverage(leverage);
    setShowLeveragePopup(true);
  };

  const handleConfirmLeverage = () => {
    setLeverage(tempLeverage);
    setShowLeveragePopup(false);
  };

  const handleCancelLeverage = () => {
    setTempLeverage(leverage);
    setShowLeveragePopup(false);
  };

  // Update price when a price is selected from the orderbook
  useEffect(() => {
    if (selectedPrice) {
      setPrice(selectedPrice.price.toFixed(2));
      // Switch to limit order when price is selected
      setOrderType("limit");
    }
  }, [selectedPrice]);

  const orderValue = useMemo(() => {
    const p = orderType === "market" ? (market?.oraclePrice || 0) : parseFloat(price) || 0;
    const q = parseFloat(quantity) || 0;
    return p * q;
  }, [orderType, price, quantity, market?.oraclePrice]);

  const requiredMargin = useMemo(() => {
    return orderValue / leverage;
  }, [orderValue, leverage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!market) return;

    // If connected but not authenticated, trigger sign-in
    if (isConnected && !isAuthenticated) {
      login();
      return;
    }

    clearError();

    const result = await placeOrder({
      marketSymbol: market.symbol,
      side,
      type: orderType,
      price: orderType === "limit" ? parseFloat(price) : undefined,
      quantity: parseFloat(quantity),
      postOnly: orderType === "limit" ? postOnly : undefined,
    });

    if (result.success) {
      setPrice("");
      setQuantity("");
      onOrderPlaced?.();
      // Refresh balance to reflect locked funds
      refreshBalance();
    }
  };

  const setQuickPrice = (type: "bid" | "ask") => {
    if (!market) return;
    const p = type === "bid" ? market.bestBid : market.bestAsk;
    if (p) setPrice(p.toFixed(2));
  };

  if (!market) {
    return (
      <div className="order-form-container">
        <div className="order-form-empty">Select a market to trade</div>
      </div>
    );
  }

  // Determine button text and state
  const getButtonContent = () => {
    if (!isConnected) {
      return "Connect Wallet";
    }
    if (isAuthLoading) {
      return "Signing...";
    }
    if (!isAuthenticated) {
      return "Sign to Trade";
    }
    if (isPlacing) {
      return "Placing Order...";
    }
    return `${side === "buy" ? "Buy" : "Sell"} ${market.baseAsset}`;
  };

  const isButtonDisabled = () => {
    if (!isConnected) return true;
    if (isAuthLoading || isPlacing) return true;
    if (isAuthenticated && (!quantity || (orderType === "limit" && !price))) return true;
    return false;
  };

  return (
    <div className="order-form-container">
      <div className="order-form-header">
        <h3>Place Order</h3>
        <span className="market-tag">{market.baseAsset}</span>
      </div>

      <form className="order-form" onSubmit={handleSubmit}>
        {/* Side Selector */}
        <div className="side-selector">
          <button
            type="button"
            className={`side-btn buy ${side === "buy" ? "active" : ""}`}
            onClick={() => setSide("buy")}
          >
            Buy / Long
          </button>
          <button
            type="button"
            className={`side-btn sell ${side === "sell" ? "active" : ""}`}
            onClick={() => setSide("sell")}
          >
            Sell / Short
          </button>
        </div>

        {/* Order Type */}
        <div className="type-selector">
          <button
            type="button"
            className={orderType === "limit" ? "active" : ""}
            onClick={() => setOrderType("limit")}
          >
            Limit
          </button>
          <button
            type="button"
            className={orderType === "market" ? "active" : ""}
            onClick={() => setOrderType("market")}
          >
            Market
          </button>
        </div>

        {/* Leverage Button */}
        <div className="input-group">
          <label>Leverage</label>
          <button
            type="button"
            className="leverage-btn"
            onClick={handleOpenLeveragePopup}
          >
            <span className="leverage-value">{leverage}x</span>
            <span className="leverage-icon">⚙</span>
          </button>
        </div>

        {/* Leverage Popup */}
        {showLeveragePopup && (
          <div className="leverage-popup-overlay" onClick={handleCancelLeverage}>
            <div className="leverage-popup" onClick={(e) => e.stopPropagation()}>
              <div className="leverage-popup-header">
                <h4>Adjust Leverage</h4>
                <span className="leverage-popup-value">{tempLeverage}x</span>
              </div>
              <div className="leverage-slider-container">
                <input
                  type="range"
                  min={1}
                  max={maxLeverage}
                  step={1}
                  value={tempLeverage}
                  onChange={(e) => setTempLeverage(Number(e.target.value))}
                  className="leverage-slider"
                />
                <div className="leverage-slider-labels">
                  <span>1x</span>
                  <span>{maxLeverage}x</span>
                </div>
              </div>
              <div className="leverage-popup-actions">
                <button
                  type="button"
                  className="leverage-cancel-btn"
                  onClick={handleCancelLeverage}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="leverage-confirm-btn"
                  onClick={handleConfirmLeverage}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Price Input (Limit only) */}
        {orderType === "limit" && (
          <div className="input-group">
            <label>Price</label>
            <div className="price-input-row">
              <input
                type="number"
                step={market.tickSize}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
        )}

        {/* Quantity Input */}
        <div className="input-group">
          <label>Quantity</label>
          <input
            type="number"
            step={market.lotSize}
            min={market.minOrderSize}
            max={market.maxOrderSize}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0.00"
          />
          <span className="input-hint">
            Min: {market.minOrderSize} | Max: {market.maxOrderSize}
          </span>
        </div>


        {/* Order Summary */}
        <div className="order-summary">
          <div className="summary-row">
            <span>Order Value</span>
            <span className="summary-value">${orderValue.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Est. Margin ({leverage}x)</span>
            <span className="summary-value">${requiredMargin.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Leverage</span>
            <span className="summary-value">{leverage}x</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="order-error">
            <p>{error}</p>
            <button type="button" onClick={clearError}>
              ×
            </button>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className={`submit-btn ${side} ${!isAuthenticated && isConnected ? "sign-in" : ""}`}
          disabled={isButtonDisabled()}
        >
          {getButtonContent()}
        </button>

        {/* Sign-in hint */}
        {isConnected && !isAuthenticated && !isAuthLoading && (
          <p className="sign-hint">Sign a message to verify your wallet</p>
        )}
      </form>
    </div>
  );
}
