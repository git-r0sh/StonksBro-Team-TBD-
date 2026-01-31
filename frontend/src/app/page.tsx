'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Activity, PieChart } from 'lucide-react';
import TechnicalChart from '@/components/TechnicalChart';
import SectorHeatmap from '@/components/SectorHeatmap';
import NewsTicker from '@/components/NewsTicker';
import AlertsPanel from '@/components/AlertsPanel';
import { motion } from 'framer-motion';

interface StockData {
  ticker: string;
  name?: string;
  price: number;
  change: number;
  change_percent: number;
}

interface IndexData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
}

export default function Dashboard() {
  // Initialize with mock data for instant rendering
  const [indexData, setIndexData] = useState<IndexData>({
    ticker: 'NIFTY50',
    name: 'NIFTY 50 Index',
    price: 22150.45,
    change: 125.30,
    change_percent: 0.57
  });
  const [topStocks, setTopStocks] = useState<StockData[]>([
    { ticker: 'RELIANCE', name: 'Reliance Industries', price: 1395.50, change: 15.30, change_percent: 1.11 },
    { ticker: 'TCS', name: 'TCS', price: 4050.25, change: -25.50, change_percent: -0.63 },
    { ticker: 'HDFCBANK', name: 'HDFC Bank', price: 1720.75, change: 18.80, change_percent: 1.10 },
    { ticker: 'INFY', name: 'Infosys', price: 1580.30, change: 12.45, change_percent: 0.79 },
    { ticker: 'ICICIBANK', name: 'ICICI Bank', price: 1150.40, change: -8.20, change_percent: -0.71 },
    { ticker: 'SBIN', name: 'SBI', price: 780.80, change: 22.15, change_percent: 2.92 },
  ]);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [selectedTicker, setSelectedTicker] = useState<string>('NIFTY50');

  useEffect(() => {
    // Background fetch to update with live data (mock data already showing)
    const fetchData = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`${API_URL}/stocks/nifty50`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.index) setIndexData(data.index);
          if (data.components?.length > 0) setTopStocks(data.components.slice(0, 6));
        }
      } catch {
        // Silently ignore errors - mock data is already displayed
      }
    };

    // Fetch in background after initial render
    const initialFetch = setTimeout(fetchData, 100);
    const interval = setInterval(fetchData, 60000);

    return () => {
      clearTimeout(initialFetch);
      clearInterval(interval);
    };
  }, []);

  // Client-side only time update to avoid hydration mismatch
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-IN'));
    };
    updateTime();
    const timeInterval = setInterval(updateTime, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* News Ticker at top */}
      <NewsTicker />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white font-mono">DASHBOARD</h1>
            <p className="text-[#888] text-sm mt-1 font-mono">Real-time Market Overview</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#555] font-mono">
              {currentTime || '--:--:--'} IST
            </span>
            <div className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse" />
          </div>
        </div>

        {/* Index Card */}
        {indexData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="terminal-card p-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[#888] text-xs font-mono uppercase">{indexData.name}</p>
                <h2 className="text-4xl font-bold text-white mt-1 font-mono">
                  ₹{indexData.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  {indexData.change_percent >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-[#00ff88]" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-[#ff3366]" />
                  )}
                  <span className={`text-lg font-mono font-bold ${indexData.change_percent >= 0 ? 'glow-positive' : 'glow-negative'
                    }`}>
                    {indexData.change >= 0 ? '+' : ''}{indexData.change.toFixed(2)} ({indexData.change_percent.toFixed(2)}%)
                  </span>
                </div>
              </div>
              <div className="hidden lg:grid grid-cols-4 gap-6">
                {[
                  { label: 'Market Cap', value: '₹287.5L Cr', icon: DollarSign },
                  { label: 'Volume', value: '1.2B', icon: BarChart3 },
                  { label: 'Adv/Dec', value: '32/18', icon: Activity },
                  { label: 'Sectors Up', value: '9/13', icon: PieChart },
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <stat.icon className="w-4 h-4 text-[#555] mx-auto mb-1" />
                    <p className="text-lg font-bold text-white font-mono">{stat.value}</p>
                    <p className="text-[10px] text-[#555] uppercase">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart - 2 cols */}
          <div className="lg:col-span-2">
            {selectedTicker !== 'NIFTY50' && (
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedTicker('NIFTY50')}
                    className="flex items-center gap-1 text-xs text-[#00ccff] hover:text-white transition-colors bg-[#00ccff10] px-3 py-1.5 rounded border border-[#00ccff30]"
                  >
                    ← Back to Market Overview
                  </button>
                  <span className="text-white font-mono font-bold text-lg ml-2">
                    {selectedTicker} Analysis
                  </span>
                </div>
              </div>
            )}
            <TechnicalChart ticker={selectedTicker} showIndicators={true} />
          </div>

          {/* Alerts Panel */}
          <div>
            <AlertsPanel />
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Movers */}
          <div className="lg:col-span-2">
            <div className="terminal-card p-4">
              <div className="terminal-header px-3 py-2 -mx-4 -mt-4 mb-4">
                TOP MOVERS
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {topStocks.map((stock, index) => (
                  <motion.div
                    key={stock.ticker}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    onClick={() => setSelectedTicker(stock.ticker)}
                    className={`p-3 rounded border cursor-pointer transition-all hover:border-[#00ff88] ${selectedTicker === stock.ticker
                      ? 'border-[#00ccff] bg-[#00ccff15] ring-1 ring-[#00ccff]'
                      : stock.change_percent >= 0
                        ? 'bg-[#00ff8808] border-[#00ff8830]'
                        : 'bg-[#ff336608] border-[#ff336630]'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-mono font-bold text-white">{stock.ticker}</h4>
                        <p className="text-[10px] text-[#555] mt-0.5 truncate max-w-[120px]">
                          {stock.name}
                        </p>
                      </div>
                      <div className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${stock.change_percent >= 0
                        ? 'bg-[#00ff8820] text-[#00ff88]'
                        : 'bg-[#ff336620] text-[#ff3366]'
                        }`}>
                        {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between items-end">
                      <span className="text-xl font-mono font-bold text-white">
                        ₹{stock.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </span>
                      <span className={`text-xs font-mono ${stock.change >= 0 ? 'text-[#00ff88]' : 'text-[#ff3366]'
                        }`}>
                        {stock.change >= 0 ? '+' : ''}₹{stock.change.toFixed(2)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Sector Heatmap */}
          <div>
            <SectorHeatmap />
          </div>
        </div>
      </div>
    </div>
  );
}
