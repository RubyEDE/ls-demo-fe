import { useEffect, useRef, memo } from "react";
import "./tradingview-chart.css";

interface TradingViewChartProps {
  symbol: string;
  height?: number;
}

function TradingViewChartComponent({ symbol, height = 400 }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = "";

    // Create widget container
    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    widgetContainer.style.height = `${height}px`;
    containerRef.current.appendChild(widgetContainer);

    // Create and load script
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `NASDAQ:${symbol}`,
      interval: "5",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "rgba(26, 26, 46, 1)",
      gridColor: "rgba(124, 58, 237, 0.06)",
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: true,
      save_image: false,
      calendar: false,
      hide_volume: false,
      support_host: "https://www.tradingview.com",
    });

    containerRef.current.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [symbol, height]);

  return (
    <div className="tradingview-chart-container">
      <div
        ref={containerRef}
        className="tradingview-widget-container"
        style={{ height: `${height}px` }}
      />
    </div>
  );
}

export const TradingViewChart = memo(TradingViewChartComponent);
