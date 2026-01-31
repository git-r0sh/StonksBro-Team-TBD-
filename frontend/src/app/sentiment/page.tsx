'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import SentimentGauge from '@/components/SentimentGauge';
import { TrendingUp, TrendingDown, MessageSquare, BarChart2, Newspaper } from 'lucide-react';

interface SentimentData {
    ticker: string;
    score: number;
    sentiment: string;
    analysis: string;
}

const popularTickers = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK'];

export default function SentimentDashboard() {
    const [fearGreedData, setFearGreedData] = useState<{ value: number; label: string; description: string; history: any[] } | null>(null);
    const [tickerSentiments, setTickerSentiments] = useState<SentimentData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

                // Fetch Fear & Greed
                const fgResponse = await fetch(`${API_URL}/sentiment/fear-greed`);
                const fgData = await fgResponse.json();
                setFearGreedData(fgData);

                // Fetch individual stock sentiments
                const sentiments = await Promise.all(
                    popularTickers.map(async (ticker) => {
                        const response = await fetch(`${API_URL}/sentiment/analyze`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ticker })
                        });
                        return response.json();
                    })
                );
                setTickerSentiments(sentiments);
            } catch (error) {
                console.error('Error fetching sentiment:', error);
                // Mock data
                setFearGreedData({
                    value: 58,
                    label: 'Greed',
                    description: 'Market sentiment is positive. Momentum is bullish.',
                    history: Array.from({ length: 30 }, (_, i) => ({ day: i + 1, value: 45 + Math.random() * 25 }))
                });
                setTickerSentiments([
                    { ticker: 'RELIANCE', score: 68, sentiment: 'Bullish', analysis: 'Strong momentum with positive sentiment.' },
                    { ticker: 'TCS', score: 72, sentiment: 'Bullish', analysis: 'Technical indicators suggest upward movement.' },
                    { ticker: 'HDFCBANK', score: 55, sentiment: 'Neutral', analysis: 'Consolidating at current levels.' },
                    { ticker: 'INFY', score: 65, sentiment: 'Slightly Bullish', analysis: 'Positive earnings outlook.' },
                    { ticker: 'ICICIBANK', score: 48, sentiment: 'Neutral', analysis: 'Mixed signals from market.' },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getSentimentColor = (score: number) => {
        if (score >= 70) return 'text-emerald-400 bg-emerald-500/20';
        if (score >= 55) return 'text-green-400 bg-green-500/20';
        if (score >= 45) return 'text-yellow-400 bg-yellow-500/20';
        if (score >= 30) return 'text-orange-400 bg-orange-500/20';
        return 'text-red-400 bg-red-500/20';
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Sentiment Dashboard</h1>
                <p className="text-slate-400 mt-1">Market mood and stock sentiment analysis</p>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Fear & Greed Gauge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <SentimentGauge />
                </motion.div>

                {/* Sentiment Trend Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-6 border border-slate-700/50"
                >
                    <h3 className="text-lg font-semibold text-white mb-4">Sentiment Trend (30 Days)</h3>

                    {fearGreedData && (
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={fearGreedData.history}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                <XAxis
                                    dataKey="day"
                                    stroke="#64748b"
                                    fontSize={11}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="#64748b"
                                    fontSize={11}
                                    tickLine={false}
                                    domain={[0, 100]}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '12px',
                                    }}
                                    labelStyle={{ color: '#94a3b8' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}

                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                        <span>Extreme Fear (0)</span>
                        <span>Neutral (50)</span>
                        <span>Extreme Greed (100)</span>
                    </div>
                </motion.div>
            </div>

            {/* Stock Sentiments */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <h3 className="text-xl font-semibold text-white mb-4">Individual Stock Sentiment</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tickerSentiments.map((stock, index) => (
                        <motion.div
                            key={stock.ticker}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + index * 0.05 }}
                            className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover-lift"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-semibold text-white">{stock.ticker}</h4>
                                    <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium mt-1 ${getSentimentColor(stock.score)}`}>
                                        {stock.sentiment}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <div className={`text-2xl font-bold ${stock.score >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {stock.score}
                                    </div>
                                    <div className="text-xs text-slate-500">/ 100</div>
                                </div>
                            </div>

                            {/* Score Bar */}
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
                                <motion.div
                                    className={`h-full rounded-full ${stock.score >= 50 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stock.score}%` }}
                                    transition={{ duration: 0.8, delay: 0.4 + index * 0.05 }}
                                />
                            </div>

                            <p className="text-sm text-slate-400">{stock.analysis}</p>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Market Indicators */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-6 border border-slate-700/50"
            >
                <h3 className="text-lg font-semibold text-white mb-4">Market Sentiment Indicators</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Market Momentum', value: 'Bullish', icon: TrendingUp, color: 'emerald' },
                        { label: 'Put/Call Ratio', value: '0.85', icon: BarChart2, color: 'cyan' },
                        { label: 'Social Buzz', value: 'High', icon: MessageSquare, color: 'purple' },
                        { label: 'News Sentiment', value: 'Positive', icon: Newspaper, color: 'orange' },
                    ].map((indicator, i) => (
                        <div key={i} className="bg-slate-800/50 rounded-xl p-4">
                            <indicator.icon className={`w-5 h-5 text-${indicator.color}-400 mb-2`} />
                            <p className="text-lg font-bold text-white">{indicator.value}</p>
                            <p className="text-xs text-slate-400">{indicator.label}</p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
