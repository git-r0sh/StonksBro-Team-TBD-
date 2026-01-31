'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { motion } from 'framer-motion';

interface TechnicalData {
    ticker: string;
    current_price: number;
    rsi: { value: number; signal: string };
    macd: { macd: number; signal: number; histogram: number; trend: string };
    bollinger: { upper: number; middle: number; lower: number; position: number; signal: string };
    ema: { ema50?: number; ema200?: number; cross_signal?: string };
    overall_score: number;
    overall_signal: string;
}

interface ChartDataPoint {
    date: string;
    price: number;
    ema50?: number;
    ema200?: number;
    upper?: number;
    lower?: number;
}

interface TechnicalChartProps {
    ticker?: string;
    showIndicators?: boolean;
}

export default function TechnicalChart({ ticker = 'NIFTY50', showIndicators = true }: TechnicalChartProps) {
    // Initialize with mock data for instant rendering
    const [chartData, setChartData] = useState<ChartDataPoint[]>(
        Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            price: 22000 + Math.random() * 500 + i * 10
        }))
    );
    const [technical, setTechnical] = useState<TechnicalData>({
        ticker: ticker,
        current_price: 22510,
        rsi: { value: 58, signal: 'Neutral' },
        macd: { macd: 45.2, signal: 38.1, histogram: 7.1, trend: 'Bullish' },
        bollinger: { upper: 22800, middle: 22400, lower: 22000, position: 65, signal: 'Neutral' },
        ema: { ema50: 22350, ema200: 21800, cross_signal: 'Golden Cross' },
        overall_score: 62,
        overall_signal: 'Bullish'
    });
    const [loading, setLoading] = useState(false);
    const [timeframe, setTimeframe] = useState('1M');
    const [activeIndicator, setActiveIndicator] = useState<'BB' | 'EMA' | null>(null);

    const timeframes = ['1D', '1W', '1M', '3M', '1Y'];

    useEffect(() => {
        // Background fetch to update with live data (mock data already showing)
        const fetchData = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const period = timeframe === '1D' ? '5' : timeframe === '1W' ? '7' : timeframe === '1M' ? '30' : timeframe === '3M' ? '90' : '365';
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                const [histResponse, techResponse] = await Promise.all([
                    fetch(`${API_URL}/stocks/history/${ticker}?days=${period}`, { signal: controller.signal }).catch(() => null),
                    fetch(`${API_URL}/analytics/technical/${ticker}`, { signal: controller.signal }).catch(() => null)
                ]);

                clearTimeout(timeoutId);

                // Only update if we got valid data
                if (histResponse?.ok) {
                    const histData = await histResponse.json();
                    if (histData.data && histData.data.length > 0) {
                        setChartData(histData.data);
                    }
                }

                if (techResponse?.ok) {
                    const techData = await techResponse.json();
                    if (techData.ticker) {
                        setTechnical(techData);
                    }
                }
            } catch {
                // Silently ignore errors - mock data is already displayed
            }
        };

        // Fetch in background after initial render
        const initialFetch = setTimeout(fetchData, 100);
        return () => clearTimeout(initialFetch);
    }, [ticker, timeframe]);

    const getSignalColor = (signal: string) => {
        if (signal.toLowerCase().includes('bullish') || signal.toLowerCase().includes('golden')) {
            return '#00ff88';
        } else if (signal.toLowerCase().includes('bearish') || signal.toLowerCase().includes('death')) {
            return '#ff3366';
        }
        return '#888888';
    };

    const getRSIColor = (value: number) => {
        if (value <= 30) return '#00ff88';  // Oversold - bullish
        if (value >= 70) return '#ff3366';  // Overbought - bearish
        return '#888888';
    };

    if (loading) {
        return (
            <div className="terminal-card p-4">
                <div className="terminal-header px-3 py-2 -mx-4 -mt-4 mb-4">
                    TECHNICAL ANALYSIS — {ticker}
                </div>
                <div className="skeleton h-[300px] rounded mb-4" />
                <div className="grid grid-cols-4 gap-2">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton h-16 rounded" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="terminal-card p-4">
            {/* Header */}
            <div className="terminal-header px-3 py-2 -mx-4 -mt-4 mb-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <span>TECHNICAL — {ticker}</span>
                    {technical && (
                        <span
                            className="px-2 py-0.5 text-[10px] rounded font-bold"
                            style={{
                                background: getSignalColor(technical.overall_signal) + '20',
                                color: getSignalColor(technical.overall_signal),
                                border: `1px solid ${getSignalColor(technical.overall_signal)}40`
                            }}
                        >
                            {technical.overall_signal.toUpperCase()} ({technical.overall_score})
                        </span>
                    )}
                </div>
                <div className="flex gap-1">
                    {timeframes.map(tf => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`btn-terminal text-[10px] px-2 py-1 ${timeframe === tf ? 'active' : ''}`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* Indicator toggles */}
            {showIndicators && (
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setActiveIndicator(activeIndicator === 'BB' ? null : 'BB')}
                        className={`btn-terminal text-[10px] ${activeIndicator === 'BB' ? 'active' : ''}`}
                    >
                        Bollinger Bands
                    </button>
                    <button
                        onClick={() => setActiveIndicator(activeIndicator === 'EMA' ? null : 'EMA')}
                        className={`btn-terminal text-[10px] ${activeIndicator === 'EMA' ? 'active' : ''}`}
                    >
                        EMA 50/200
                    </button>
                </div>
            )}

            {/* Main Chart */}
            <div className="chart-container rounded mb-4" style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00ff88" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <XAxis
                            dataKey="date"
                            stroke="#555"
                            fontSize={10}
                            tickLine={false}
                            tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        />
                        <YAxis
                            stroke="#555"
                            fontSize={10}
                            tickLine={false}
                            domain={['dataMin - 100', 'dataMax + 100']}
                            tickFormatter={(val) => `₹${(val / 1000).toFixed(1)}k`}
                        />
                        <Tooltip
                            contentStyle={{
                                background: '#141414',
                                border: '1px solid #2a2a2a',
                                borderRadius: 4,
                                fontSize: 11,
                                fontFamily: 'JetBrains Mono, monospace'
                            }}
                            labelStyle={{ color: '#888' }}
                            formatter={(value: number | undefined) => [`₹${(value ?? 0).toLocaleString()}`, 'Price']}
                        />

                        {/* Bollinger Bands */}
                        {activeIndicator === 'BB' && technical && (
                            <>
                                <ReferenceLine y={technical.bollinger.upper} stroke="#ffcc00" strokeDasharray="3 3" />
                                <ReferenceLine y={technical.bollinger.middle} stroke="#888" strokeDasharray="3 3" />
                                <ReferenceLine y={technical.bollinger.lower} stroke="#ffcc00" strokeDasharray="3 3" />
                            </>
                        )}

                        {/* EMA Lines */}
                        {activeIndicator === 'EMA' && technical && (
                            <>
                                {technical.ema.ema50 && (
                                    <ReferenceLine y={technical.ema.ema50} stroke="#00ccff" strokeDasharray="5 5" label={{ value: 'EMA50', fill: '#00ccff', fontSize: 9 }} />
                                )}
                                {technical.ema.ema200 && (
                                    <ReferenceLine y={technical.ema.ema200} stroke="#9966ff" strokeDasharray="5 5" label={{ value: 'EMA200', fill: '#9966ff', fontSize: 9 }} />
                                )}
                            </>
                        )}

                        <Area type="monotone" dataKey="price" fill="url(#priceGradient)" stroke="#00ff88" strokeWidth={2} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Technical Indicators Grid */}
            {showIndicators && technical && (
                <div className="grid grid-cols-4 gap-2">
                    {/* RSI */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-[#1a1a1a] rounded border border-[#2a2a2a]"
                    >
                        <div className="text-[10px] text-[#888] uppercase mb-1">RSI (14)</div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-mono font-bold" style={{ color: getRSIColor(technical.rsi.value) }}>
                                {technical.rsi.value}
                            </span>
                            <span className="text-[10px]" style={{ color: getRSIColor(technical.rsi.value) }}>
                                {technical.rsi.signal}
                            </span>
                        </div>
                        <div className="indicator-bar mt-2">
                            <div
                                className="indicator-fill"
                                style={{
                                    width: `${technical.rsi.value}%`,
                                    background: getRSIColor(technical.rsi.value)
                                }}
                            />
                        </div>
                    </motion.div>

                    {/* MACD */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="p-3 bg-[#1a1a1a] rounded border border-[#2a2a2a]"
                    >
                        <div className="text-[10px] text-[#888] uppercase mb-1">MACD</div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-mono font-bold" style={{ color: getSignalColor(technical.macd.trend) }}>
                                {technical.macd.histogram.toFixed(1)}
                            </span>
                            <span className="text-[10px]" style={{ color: getSignalColor(technical.macd.trend) }}>
                                {technical.macd.trend}
                            </span>
                        </div>
                        <div className="text-[10px] text-[#555] mt-1">
                            MACD: {technical.macd.macd.toFixed(1)} | SIG: {technical.macd.signal.toFixed(1)}
                        </div>
                    </motion.div>

                    {/* Bollinger */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-3 bg-[#1a1a1a] rounded border border-[#2a2a2a]"
                    >
                        <div className="text-[10px] text-[#888] uppercase mb-1">Bollinger</div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-xl font-mono font-bold" style={{ color: getSignalColor(technical.bollinger.signal) }}>
                                {technical.bollinger.position.toFixed(0)}%
                            </span>
                            <span className="text-[10px]" style={{ color: getSignalColor(technical.bollinger.signal) }}>
                                {technical.bollinger.signal}
                            </span>
                        </div>
                        <div className="indicator-bar mt-2">
                            <div
                                className="indicator-fill"
                                style={{
                                    width: `${technical.bollinger.position}%`,
                                    background: technical.bollinger.position > 80 ? '#ff3366' : technical.bollinger.position < 20 ? '#00ff88' : '#888'
                                }}
                            />
                        </div>
                    </motion.div>

                    {/* EMA */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="p-3 bg-[#1a1a1a] rounded border border-[#2a2a2a]"
                    >
                        <div className="text-[10px] text-[#888] uppercase mb-1">EMA Cross</div>
                        <div className="text-lg font-bold" style={{ color: getSignalColor(technical.ema.cross_signal || '') }}>
                            {technical.ema.cross_signal?.split(' ')[0]}
                        </div>
                        <div className="text-[10px] text-[#555] mt-1">
                            50: ₹{technical.ema.ema50?.toLocaleString() || 'N/A'}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
