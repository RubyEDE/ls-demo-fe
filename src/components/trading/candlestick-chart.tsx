import { useEffect, useRef, useState, useCallback } from "react";
import { createChart, CandlestickSeries, type IChartApi, type ISeriesApi } from "lightweight-charts";
import { useCandles, useCandleData } from "../../context/candle-context";
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
  const renderedIntervalRef = useRef<CandleInterval | null>(null);
  const defaultVisibleBarsRef = useRef<number>(100);

  // Set the symbol in the candle context to subscribe to all intervals
  const { setSymbol } = useCandles();
  useEffect(() => {
    if (symbol) {
      setSymbol(symbol);
    }
  }, [symbol, setSymbol]);

  // Get candle data for the selected interval
  const { candles, currentCandle, isLoading, error } = useCandleData(interval);

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
        minBarSpacing: 2,
        tickMarkFormatter: (time: number) => {
          const date = new Date(time * 1000);
          const hours = date.getHours().toString().padStart(2, "0");
          const minutes = date.getMinutes().toString().padStart(2, "0");
          return `${hours}:${minutes}`;
        },
      },
      localization: {
        timeFormatter: (time: number) => {
          const date = new Date(time * 1000);
          return date.toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        },
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

    // Prevent zooming out beyond default visible bars
    const timeScale = chart.timeScale();
    timeScale.subscribeVisibleLogicalRangeChange((logicalRange) => {
      if (!logicalRange) return;
      const visibleBars = logicalRange.to - logicalRange.from;
      const maxBars = defaultVisibleBarsRef.current;
      
      // If trying to zoom out beyond default, reset to max allowed
      if (visibleBars > maxBars) {
        timeScale.setVisibleLogicalRange({
          from: logicalRange.to - maxBars,
          to: logicalRange.to,
        });
      }
    });

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

  // Reset chart data when symbol or interval changes
  useEffect(() => {
    initialLoadDoneRef.current = false;
    prevCandleCountRef.current = 0;
    renderedIntervalRef.current = null;
    // Clear the series data to prevent "Cannot update oldest data" errors
    if (seriesRef.current) {
      seriesRef.current.setData([]);
    }
  }, [symbol, interval]);

  // Update data
  useEffect(() => {
    if (!seriesRef.current) {
      return;
    }
    
    // Don't update while loading new interval data
    if (isLoading) {
      return;
    }
    
    if (candles.length === 0) {
      return;
    }

    // Deduplicate candles by time (keep the last one for each timestamp)
    const candleMap = new Map<number, typeof candles[0]>();
    for (const c of candles) {
      // Validate time is a number
      if (typeof c.time !== "number" || isNaN(c.time) || c.time <= 0) {
        continue;
      }
      // Convert ms to seconds if needed (timestamps > year 2100 in seconds are likely ms)
      const time = c.time > 4102444800 ? Math.floor(c.time / 1000) : Math.floor(c.time);
      if (time > 0) {
        candleMap.set(time, c);
      }
    }

    // Convert to array and sort by time ascending
    // Use +value to coerce to primitive number (not Number object)
    const chartData = Array.from(candleMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([time, c]) => ({
        time: +time,
        open: +c.open,
        high: +c.high,
        low: +c.low,
        close: +c.close,
      }))
      .filter((c) => !isNaN(c.time) && c.time > 0 && isFinite(c.time));

    if (chartData.length === 0) {
      console.log("[Chart] No valid chart data after filtering");
      return;
    }

    // Check if this is initial load or a small update
    const isInitialLoad = !initialLoadDoneRef.current;
    const candleCountChanged = chartData.length !== prevCandleCountRef.current;

    try {
      // Check if we're switching intervals - if so, always use setData
      const isIntervalSwitch = renderedIntervalRef.current !== interval;
      
      if (isInitialLoad || candleCountChanged || isIntervalSwitch) {
        // Full data set - use setData
        seriesRef.current.setData(chartData);
        prevCandleCountRef.current = chartData.length;
        renderedIntervalRef.current = interval;

        // Scroll to show the most recent candles (current time)
        if ((isInitialLoad || isIntervalSwitch) && chartRef.current) {
          const timeScale = chartRef.current.timeScale();
          // Show approximately the last 100 candles
          const visibleBars = Math.min(100, chartData.length);
          const fromIndex = chartData.length - visibleBars;
          timeScale.setVisibleLogicalRange({
            from: fromIndex,
            to: chartData.length - 1,
          });
          initialLoadDoneRef.current = true;
        }
      } else if (chartData.length > 0) {
        // Just updating the last candle - use update
        const lastCandle = chartData[chartData.length - 1];
        seriesRef.current.update(lastCandle);
      }
    } catch (err) {
      console.error("[Chart] Error updating chart:", err);
      // Reset and try setData on next render
      initialLoadDoneRef.current = false;
      prevCandleCountRef.current = 0;
      renderedIntervalRef.current = null;
    }
  }, [candles, interval, isLoading]);

  // Handle real-time current candle updates
  useEffect(() => {
    if (!seriesRef.current || !currentCandle) return;

    // Validate candle data - time must be a number
    if (typeof currentCandle.time !== "number" || isNaN(currentCandle.time) || currentCandle.time <= 0) {
      return;
    }

    // Convert ms to seconds if needed, use + to coerce to primitive
    const time = currentCandle.time > 4102444800 
      ? Math.floor(currentCandle.time / 1000) 
      : Math.floor(currentCandle.time);
    
    if (isNaN(time) || time <= 0 || !isFinite(time)) return;

    // Only update if we have initial data loaded
    if (!initialLoadDoneRef.current) return;

    try {
      seriesRef.current.update({
        time: +time,
        open: +currentCandle.open,
        high: +currentCandle.high,
        low: +currentCandle.low,
        close: +currentCandle.close,
      });
    } catch (err) {
      // Silently ignore update errors - they can happen during interval switches
      console.warn("[Chart] Error updating current candle:", err);
    }
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
