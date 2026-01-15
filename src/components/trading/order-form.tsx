import { useState, useMemo, useEffect } from "react";
import { useTrading } from "../../hooks/use-trading";
import { useAuth } from "../../context/auth-context";
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

  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"limit" | "market">("limit");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [postOnly, setPostOnly] = useState(false);

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
    return orderValue * (market?.initialMarginRate || 0.05);
  }, [orderValue, market?.initialMarginRate]);

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
              <div className="quick-btns">
                <button type="button" onClick={() => setQuickPrice("bid")}>
                  Bid
                </button>
                <button type="button" onClick={() => setQuickPrice("ask")}>
                  Ask
                </button>
              </div>
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

        {/* Post Only (Limit only) */}
        {orderType === "limit" && (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={postOnly}
              onChange={(e) => setPostOnly(e.target.checked)}
            />
            <span>Post Only (maker only)</span>
          </label>
        )}

        {/* Order Summary */}
        <div className="order-summary">
          <div className="summary-row">
            <span>Order Value</span>
            <span className="summary-value">${orderValue.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Est. Margin ({((market.initialMarginRate || 0.05) * 100).toFixed(0)}%)</span>
            <span className="summary-value">${requiredMargin.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Max Leverage</span>
            <span className="summary-value">{market.maxLeverage}x</span>
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
