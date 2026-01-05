import { useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { Data, Shape, Annotations } from 'plotly.js';
import type { StrategyTrade, OHLCData } from '@/hooks/useAssetDetail';

interface TradesChartProps {
  trades: StrategyTrade[];
  strategyName: string;
  ohlcData?: OHLCData[];
}

export const TradesChart = ({ trades, strategyName, ohlcData }: TradesChartProps) => {
  const chartData = useMemo(() => {
    if (!trades || trades.length === 0) return null;

    // Sort trades by buy_date
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.buy_date).getTime() - new Date(b.buy_date).getTime()
    );

    // Find the date range for trades
    const firstTradeDate = new Date(sortedTrades[0].buy_date);
    const lastTrade = sortedTrades[sortedTrades.length - 1];
    const lastTradeDate = new Date(lastTrade.sell_date || lastTrade.buy_date);

    // Filter OHLC data to trade range (with some padding)
    let filteredOhlc: OHLCData[] = [];
    if (ohlcData && ohlcData.length > 0) {
      // Add 30 days padding before first trade
      const startPadding = new Date(firstTradeDate);
      startPadding.setDate(startPadding.getDate() - 30);
      
      // Add 30 days padding after last trade
      const endPadding = new Date(lastTradeDate);
      endPadding.setDate(endPadding.getDate() + 30);

      filteredOhlc = ohlcData.filter(d => {
        const date = new Date(d.date);
        return date >= startPadding && date <= endPadding;
      });
    }

    const dataTraces: Data[] = [];

    // Add OHLC candlestick chart if data available
    if (filteredOhlc.length > 0) {
      dataTraces.push({
        x: filteredOhlc.map(d => d.date),
        open: filteredOhlc.map(d => d.open),
        high: filteredOhlc.map(d => d.high),
        low: filteredOhlc.map(d => d.low),
        close: filteredOhlc.map(d => d.close),
        type: 'ohlc',
        name: 'OHLC',
        increasing: { line: { color: '#10b981' } },
        decreasing: { line: { color: '#ef4444' } },
      } as Data);
    }

    // Create shapes for trade rectangles
    const shapes: Partial<Shape>[] = [];
    const annotations: Partial<Annotations>[] = [];

    // Create traces for buy markers
    const buyDates: string[] = [];
    const buyPrices: number[] = [];
    const buyColors: string[] = [];
    const buyTexts: string[] = [];

    // Create traces for sell markers
    const sellDates: string[] = [];
    const sellPrices: number[] = [];
    const sellColors: string[] = [];
    const sellTexts: string[] = [];

    sortedTrades.forEach((trade) => {
      const isProfit = trade.result >= 1;
      const color = isProfit ? '#10b981' : '#ef4444';
      const resultPercent = ((trade.result - 1) * 100).toFixed(2);

      // Buy marker
      buyDates.push(trade.buy_date);
      buyPrices.push(trade.buy_price);
      buyColors.push(color);
      buyTexts.push(`Buy: $${trade.buy_price.toFixed(2)}<br>Date: ${trade.buy_date}`);

      // Sell marker (if closed)
      if (trade.status === 'closed' && trade.sell_date && trade.sell_price) {
        sellDates.push(trade.sell_date);
        sellPrices.push(trade.sell_price);
        sellColors.push(color);
        sellTexts.push(`Sell: $${trade.sell_price.toFixed(2)}<br>Date: ${trade.sell_date}<br>Result: ${resultPercent}%`);

        // Add rectangle shape for the trade
        shapes.push({
          type: 'rect',
          x0: trade.buy_date,
          y0: trade.buy_price,
          x1: trade.sell_date,
          y1: trade.sell_price,
          line: {
            color: color,
            width: 2,
          },
          fillcolor: isProfit ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
        });

        // Add annotation for result percentage
        annotations.push({
          x: trade.sell_date,
          y: trade.sell_price,
          text: `${isProfit ? '+' : ''}${resultPercent}%`,
          showarrow: false,
          font: {
            size: 10,
            color: color,
          },
          xanchor: 'left',
          yanchor: trade.sell_price > trade.buy_price ? 'bottom' : 'top',
          xshift: 5,
        });
      }
    });

    // Buy markers trace
    const buyTrace: Data = {
      x: buyDates,
      y: buyPrices,
      mode: 'markers',
      type: 'scatter',
      name: 'Buy',
      marker: {
        symbol: 'triangle-up',
        size: 14,
        color: buyColors,
        line: {
          color: 'white',
          width: 1,
        },
      },
      text: buyTexts,
      hoverinfo: 'text',
    };

    // Sell markers trace
    const sellTrace: Data = {
      x: sellDates,
      y: sellPrices,
      mode: 'markers',
      type: 'scatter',
      name: 'Sell',
      marker: {
        symbol: 'triangle-down',
        size: 14,
        color: sellColors,
        line: {
          color: 'white',
          width: 1,
        },
      },
      text: sellTexts,
      hoverinfo: 'text',
    };

    dataTraces.push(buyTrace, sellTrace);

    return {
      data: dataTraces,
      shapes,
      annotations,
    };
  }, [trades, ohlcData]);

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No trade data available
      </div>
    );
  }

  return (
    <Plot
      data={chartData.data}
      layout={{
        autosize: true,
        height: 500,
        margin: { l: 60, r: 30, t: 30, b: 50 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: {
          color: '#a1a1aa',
        },
        xaxis: {
          title: 'Date',
          gridcolor: 'rgba(161, 161, 170, 0.1)',
          linecolor: 'rgba(161, 161, 170, 0.2)',
          tickformat: '%Y-%m-%d',
          rangeslider: { visible: false },
        },
        yaxis: {
          title: 'Price ($)',
          gridcolor: 'rgba(161, 161, 170, 0.1)',
          linecolor: 'rgba(161, 161, 170, 0.2)',
        },
        shapes: chartData.shapes,
        annotations: chartData.annotations,
        showlegend: true,
        legend: {
          orientation: 'h',
          y: -0.15,
          x: 0.5,
          xanchor: 'center',
        },
        hovermode: 'closest',
      }}
      config={{
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        responsive: true,
      }}
      style={{ width: '100%' }}
    />
  );
};
