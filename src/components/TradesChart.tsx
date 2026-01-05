import { useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { Data, Shape, Annotations } from 'plotly.js';
import type { StrategyTrade } from '@/hooks/useAssetDetail';

interface TradesChartProps {
  trades: StrategyTrade[];
  strategyName: string;
}

export const TradesChart = ({ trades, strategyName }: TradesChartProps) => {
  const chartData = useMemo(() => {
    if (!trades || trades.length === 0) return null;

    // Sort trades by buy_date
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.buy_date).getTime() - new Date(b.buy_date).getTime()
    );

    // Create traces for buy markers (triangles up)
    const buyDates: string[] = [];
    const buyPrices: number[] = [];
    const buyColors: string[] = [];
    const buyTexts: string[] = [];

    // Create traces for sell markers (triangles down)
    const sellDates: string[] = [];
    const sellPrices: number[] = [];
    const sellColors: string[] = [];
    const sellTexts: string[] = [];

    // Create shapes for trade rectangles
    const shapes: Partial<Shape>[] = [];
    const annotations: Partial<Annotations>[] = [];

    sortedTrades.forEach((trade) => {
      const isProfit = trade.result >= 1;
      const color = isProfit ? '#10b981' : '#ef4444'; // emerald-500 or red-500
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

    // Create line trace connecting buy and sell of same trade
    const lineTraces: Data[] = [];
    sortedTrades.forEach((trade) => {
      if (trade.status === 'closed' && trade.sell_date && trade.sell_price) {
        const isProfit = trade.result >= 1;
        lineTraces.push({
          x: [trade.buy_date, trade.sell_date],
          y: [trade.buy_price, trade.sell_price],
          mode: 'lines',
          type: 'scatter',
          line: {
            color: isProfit ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)',
            width: 1,
            dash: 'dot',
          },
          hoverinfo: 'skip',
          showlegend: false,
        } as Data);
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
        size: 12,
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
        size: 12,
        color: sellColors,
        line: {
          color: 'white',
          width: 1,
        },
      },
      text: sellTexts,
      hoverinfo: 'text',
    };

    return {
      data: [...lineTraces, buyTrace, sellTrace],
      shapes,
      annotations,
    };
  }, [trades]);

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
        height: 400,
        margin: { l: 60, r: 30, t: 30, b: 50 },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: {
          color: '#a1a1aa', // zinc-400
        },
        xaxis: {
          title: 'Date',
          gridcolor: 'rgba(161, 161, 170, 0.1)',
          linecolor: 'rgba(161, 161, 170, 0.2)',
          tickformat: '%Y-%m-%d',
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
