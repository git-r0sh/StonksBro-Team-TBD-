'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import TechnicalChart from '@/components/TechnicalChart';
import SectorHeatmap from '@/components/SectorHeatmap';
import { Search, TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react';

interface FundamentalData {
    ticker: string;
    name: string;
    sector: string;
    pe_ratio: number | null;
    dividend_yield: number;
    market_cap_formatted: string;
    cap_category: string;
    price_to_book: number | null;
    roe: number | null;
    "52_week_high": number;
    "52_week_low": number;
}

export default function AnalyticsPage() {
    const [selectedTicker, setSelectedTicker] = useState('RELIANCE');
    const [searchQuery, setSearchQuery] = useState('');
    const [fundamentals, setFundamentals] = useState<FundamentalData | null>(null);
    const [loading, setLoading] = useState(false);

    const popularTickers = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN'];

    useEffect(() => {
        const fetchFundamentals = async () => {
            setLoading(true);
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const response = await fetch(`${API_URL}/analytics/fundamentals/${selectedTicker}`);
                const data = await response.json();
                setFundamentals(data);
            } catch (error) {
                console.error('Error fetching fundamentals:', error);
                setFundamentals({
                    ticker: selectedTicker,
                    name: selectedTicker,
                    sector: 'Unknown',
                    pe_ratio: 25.5,
                    dividend_yield: 0.8,
                    market_cap_formatted: '₹15.2L Cr',
                    cap_category: 'Large Cap',
                    price_to_book: 2.3,
                    roe: 18.5,
                    "52_week_high": 3000,
                    "52_week_low": 2200
                });
            } finally {
                setLoading(false);
            }
        };

        fetchFundamentals();
    }, [selectedTicker]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setSelectedTicker(searchQuery.toUpperCase());
            setSearchQuery('');
        }
    };

    return (
        <div className="p-6 space-y-6 bg-[#0a0a0a] min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white font-mono">ANALYTICS</h1>
                    <p className="text-[#888] text-sm mt-1 font-mono">Technical & Fundamental Analysis</p>
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search ticker..."
                        className="bg-[#141414] border border-[#2a2a2a] rounded px-4 py-2 pl-10 text-sm font-mono text-white placeholder-[#555] focus:border-[#00ff88] focus:outline-none w-64"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                </form>
            </div>

            {/* Ticker Pills */}
            <div className="flex gap-2 flex-wrap">
                {popularTickers.map(ticker => (
                    <button
                        key={ticker}
                        onClick={() => setSelectedTicker(ticker)}
                        className={`btn-terminal ${selectedTicker === ticker ? 'active' : ''}`}
                    >
                        {ticker}
                    </button>
                ))}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Technical Chart - 2 cols */}
                <div className="lg:col-span-2">
                    <TechnicalChart ticker={selectedTicker} showIndicators={true} />
                </div>

                {/* Fundamentals Panel */}
                <div className="terminal-card p-4">
                    <div className="terminal-header px-3 py-2 -mx-4 -mt-4 mb-4">
                        FUNDAMENTALS — {selectedTicker}
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="skeleton h-8 rounded" />
                            ))}
                        </div>
                    ) : fundamentals && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-4"
                        >
                            {/* Company Info */}
                            <div className="pb-3 border-b border-[#2a2a2a]">
                                <div className="text-white font-bold">{fundamentals.name}</div>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] px-2 py-0.5 bg-[#1a1a1a] text-[#888] rounded">
                                        {fundamentals.sector}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 bg-[#00ff8815] text-[#00ff88] rounded border border-[#00ff8830]">
                                        {fundamentals.cap_category}
                                    </span>
                                </div>
                            </div>

                            {/* Key Ratios */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-2 bg-[#1a1a1a] rounded">
                                    <div className="text-[10px] text-[#888] uppercase">P/E Ratio</div>
                                    <div className="text-lg font-mono font-bold text-white">
                                        {fundamentals.pe_ratio?.toFixed(2) ?? 'N/A'}
                                    </div>
                                </div>
                                <div className="p-2 bg-[#1a1a1a] rounded">
                                    <div className="text-[10px] text-[#888] uppercase">Div Yield</div>
                                    <div className="text-lg font-mono font-bold text-[#00ff88]">
                                        {fundamentals.dividend_yield?.toFixed(2) ?? '0.00'}%
                                    </div>
                                </div>
                                <div className="p-2 bg-[#1a1a1a] rounded">
                                    <div className="text-[10px] text-[#888] uppercase">Market Cap</div>
                                    <div className="text-lg font-mono font-bold text-white">
                                        {fundamentals.market_cap_formatted ?? 'N/A'}
                                    </div>
                                </div>
                                <div className="p-2 bg-[#1a1a1a] rounded">
                                    <div className="text-[10px] text-[#888] uppercase">P/B Ratio</div>
                                    <div className="text-lg font-mono font-bold text-white">
                                        {fundamentals.price_to_book?.toFixed(2) ?? 'N/A'}
                                    </div>
                                </div>
                                <div className="p-2 bg-[#1a1a1a] rounded">
                                    <div className="text-[10px] text-[#888] uppercase">ROE</div>
                                    <div className="text-lg font-mono font-bold text-[#00ccff]">
                                        {fundamentals.roe?.toFixed(1) ?? 'N/A'}%
                                    </div>
                                </div>
                                <div className="p-2 bg-[#1a1a1a] rounded">
                                    <div className="text-[10px] text-[#888] uppercase">52W Range</div>
                                    <div className="text-xs font-mono text-[#888]">
                                        <span className="text-[#ff3366]">₹{fundamentals["52_week_low"] ?? 'N/A'}</span>
                                        {' - '}
                                        <span className="text-[#00ff88]">₹{fundamentals["52_week_high"] ?? 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Sector Heatmap */}
            <SectorHeatmap />
        </div>
    );
}
