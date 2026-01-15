import { useEffect, useRef, useState, useCallback } from "react";
import { createChart, CandlestickSeries, type IChartApi, type ISeriesApi } from "lightweight-charts";
import { useLiveCandles } from "../../hooks/use-live-candles";
import type { CandleInterval } from "../../types/candles";
import "./candlestick-chart.css";

interface CandlestickChartProps {
  symbol: string;
  height?: number;
}

const INTERVALS: { value: CandleInterval; label: string }[] = [
  { value: "1m", label: "1m" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1H" },
  { value: "4h", label: "4H" },
  { value: "1d", label: "1D" },
];

export function CandlestickChart({ symbol, height }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<ISeriesApi<any> | null>(null);
  const [interval, setInterval] = useState<CandleInterval>("5m");
  const prevCandleCountRef = useRef<number>(0);
  const initialLoadDoneRef = useRef<boolean>(false);

  const { candles, currentCandle, isLoading, error } = useLiveCandles({
    symbol,
    interval,
    limit: 200,
  });

  // Initialize chart
  useEffect(() => {
    console.log("[Chart] Init effect, container:", !!chartContainerRef.current);
    if (!chartContainerRef.current) return;

    const containerHeight = height || chartWrapperRef.current?.clientHeight || 400;
    console.log("[Chart] Creating chart with width:", chartContainerRef.current.clientWidth);
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: containerHeight,
      layout: {
        background: { color: "#131722" },
        textColor: "#8b8f9a",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.06)" },
        horzLines: { color: "rgba(255, 255, 255, 0.06)" },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: "rgba(0, 212, 170, 0.4)",
          width: 1,
          style: 2,
        },
        horzLine: {
          color: "rgba(0, 212, 170, 0.4)",
          width: 1,
          style: 2,
        },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "rgba(255, 255, 255, 0.08)",
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.08)",
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;
    console.log("[Chart] Chart and series created successfully");

    // Handle resize with ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      if (chartContainerRef.current && chartRef.current && chartWrapperRef.current) {
        const newHeight = height || chartWrapperRef.current.clientHeight;
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: newHeight,
        });
      }
    });

    if (chartWrapperRef.current) {
      resizeObserver.observe(chartWrapperRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height]);

  // Reset initial load flag when symbol or interval changes
  useEffect(() => {
    initialLoadDoneRef.current = false;
    prevCandleCountRef.current = 0;
  }, [symbol, interval]);

  // Update data
  useEffect(() => {
    console.log("[Chart] Update effect triggered", {
      hasSeriesRef: !!seriesRef.current,
      candlesLength: candles.length,
    });

    if (!seriesRef.current) {
      console.log("[Chart] No series ref, skipping");
      return;
    }
    
    if (candles.length === 0) {
      console.log("[Chart] No candles, skipping");
      return;
    }

    // Deduplicate candles by time (keep the last one for each timestamp)
    const candleMap = new Map<number, typeof candles[0]>();
    for (const c of candles) {
      const time = Math.floor(c.time / 1000);
      candleMap.set(time, c);
    }

    // Convert to array and sort by time ascending
    const chartData = Array.from(candleMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([time, c]) => ({
        time: time as number,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

    console.log("[Chart] Processed chart data:", {
      count: chartData.length,
      first: chartData[0],
      last: chartData[chartData.length - 1],
    });

    // Check if this is initial load or a small update
    const isInitialLoad = !initialLoadDoneRef.current;
    const candleCountChanged = chartData.length !== prevCandleCountRef.current;

    console.log("[Chart] Load state:", { isInitialLoad, candleCountChanged });

    if (isInitialLoad || candleCountChanged) {
      // Full data set - use setData
      console.log("[Chart] Setting full data...");
      seriesRef.current.setData(chartData);
      prevCandleCountRef.current = chartData.length;

      // Only fit content on initial load
      if (isInitialLoad && chartRef.current) {
        console.log("[Chart] Fitting content...");
        chartRef.current.timeScale().fitContent();
        initialLoadDoneRef.current = true;
      }
    } else if (chartData.length > 0) {
      // Just updating the last candle - use update
      const lastCandle = chartData[chartData.length - 1];
      console.log("[Chart] Updating last candle:", lastCandle);
      seriesRef.current.update(lastCandle);
    }
  }, [candles]);

  // Handle real-time current candle updates
  useEffect(() => {
    console.log("[Chart] currentCandle effect:", currentCandle);
    if (!seriesRef.current || !currentCandle) return;

    // Validate candle data
    if (!currentCandle.time || isNaN(currentCandle.time)) return;

    const time = Math.floor(currentCandle.time / 1000);
    if (isNaN(time) || time <= 0) return;

    console.log("[Chart] Updating current candle on chart:", { time, close: currentCandle.close });
    seriesRef.current.update({
      time: time as number,
      open: currentCandle.open,
      high: currentCandle.high,
      low: currentCandle.low,
      close: currentCandle.close,
    });
  }, [currentCandle]);

  const handleIntervalChange = useCallback((newInterval: CandleInterval) => {
    setInterval(newInterval);
  }, []);

  return (
    <div className="candlestick-chart-container">
      <div className="chart-toolbar">
        <div className="interval-selector">
          {INTERVALS.map(({ value, label }) => (
            <button
              key={value}
              className={`interval-btn ${interval === value ? "active" : ""}`}
              onClick={() => handleIntervalChange(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="chart-error">
          <span>Failed to load chart data</span>
          <span className="error-detail">{error}</span>
        </div>
      )}

      <div ref={chartWrapperRef} className="chart-wrapper" style={height ? { height } : undefined}>
        {isLoading && candles.length === 0 && (
          <div className="chart-loading">
            <div className="loading-spinner" />
            <span>Loading chart...</span>
          </div>
        )}

        <div ref={chartContainerRef} className="chart-canvas" />
      </div>
    </div>
  );
}
