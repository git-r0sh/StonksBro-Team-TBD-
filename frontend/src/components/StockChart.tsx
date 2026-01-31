'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface DataPoint {
    date: string;
    price: number;
}

interface StockChartProps {
    ticker?: string;
    height?: number;
}

export default function StockChart({ ticker = 'NIFTY50', height = 300 }: StockChartProps) {
    const [data, setData] = useState<DataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPrice, setCurrentPrice] = useState(0);
    const [priceChange, setPriceChange] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const response = await fetch(`${API_URL}/stocks/history/${ticker}?days=30`);
                const result = await response.json();

                if (result.data) {
                    setData(result.data);
                    const lastPrice = result.data[result.data.length - 1]?.price || 0;
                    const firstPrice = result.data[0]?.price || 0;
                    setCurrentPrice(lastPrice);
                    setPriceChange(((lastPrice - firstPrice) / firstPrice) * 100);
                }
            } catch (error) {
                console.error('Error fetching chart data:', error);
                // Generate mock data if API fails
                const mockData = Array.from({ length: 30 }, (_, i) => ({
                    date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    price: 22000 + Math.random() * 500 + i * 10
                }));
                setData(mockData);
                setCurrentPrice(mockData[mockData.length - 1].price);
                setPriceChange(2.5);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 60000); // Poll every 60 seconds
        return () => clearInterval(interval);
    }, [ticker]);

    const isPositive = priceChange >= 0;

    if (loading) {
        return (
            <div className="animate-pulse bg-slate-800/50 rounded-2xl" style={{ height }}>
                <div className="flex items-center justify-center h-full">
                    <div className="text-slate-500">Loading chart...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-6 border border-slate-700/50 backdrop-blur">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-300">{ticker}</h3>
                    <div className="flex items-baseline gap-3 mt-1">
                        <span className="text-3xl font-bold text-white">
                            ₹{currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                        <span className={`text-sm font-medium px-2 py-1 rounded-lg ${isPositive
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                            }`}>
                            {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {['1D', '1W', '1M', '3M'].map((period) => (
                        <button
                            key={period}
                            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${period === '1M'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                                }`}
                        >
                            {period}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={height}>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    />
                    <YAxis
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        domain={['dataMin - 100', 'dataMax + 100']}
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(1)}k`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                        labelStyle={{ color: '#94a3b8' }}
                        itemStyle={{ color: isPositive ? '#10b981' : '#ef4444' }}
                        formatter={(value: number) => [`₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, 'Price']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
                    />
                    <Area
                        type="monotone"
                        dataKey="price"
                        stroke={isPositive ? "#10b981" : "#ef4444"}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
