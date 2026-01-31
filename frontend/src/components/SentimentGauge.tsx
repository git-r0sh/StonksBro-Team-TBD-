'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface SentimentGaugeProps {
    value?: number;
    label?: string;
    description?: string;
}

export default function SentimentGauge({
    value: propValue,
    label: propLabel,
    description: propDescription
}: SentimentGaugeProps) {
    const [data, setData] = useState({
        value: propValue ?? 50,
        label: propLabel ?? 'Loading...',
        description: propDescription ?? ''
    });

    useEffect(() => {
        if (propValue !== undefined) return;

        const fetchData = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const response = await fetch(`${API_URL}/sentiment/fear-greed`);
                const result = await response.json();
                setData({
                    value: result.value,
                    label: result.label,
                    description: result.description
                });
            } catch (error) {
                console.error('Error fetching sentiment:', error);
                setData({
                    value: 55,
                    label: 'Greed',
                    description: 'Market sentiment is positive. Momentum is bullish.'
                });
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [propValue]);

    const getColor = (val: number) => {
        if (val >= 75) return { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)' };
        if (val >= 55) return { main: '#22c55e', glow: 'rgba(34, 197, 94, 0.4)' };
        if (val >= 45) return { main: '#eab308', glow: 'rgba(234, 179, 8, 0.4)' };
        if (val >= 25) return { main: '#f97316', glow: 'rgba(249, 115, 22, 0.4)' };
        return { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)' };
    };

    const colors = getColor(data.value);
    const rotation = (data.value / 100) * 180 - 90;

    return (
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-6 border border-slate-700/50 backdrop-blur">
            <h3 className="text-lg font-semibold text-slate-300 mb-6 text-center">Fear & Greed Index</h3>

            {/* Gauge */}
            <div className="relative w-64 h-32 mx-auto mb-6">
                {/* Background arc */}
                <svg className="w-full h-full" viewBox="0 0 200 100">
                    <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="25%" stopColor="#f97316" />
                            <stop offset="50%" stopColor="#eab308" />
                            <stop offset="75%" stopColor="#22c55e" />
                            <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                    </defs>

                    {/* Background arc */}
                    <path
                        d="M 20 90 A 80 80 0 0 1 180 90"
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="12"
                        strokeLinecap="round"
                    />

                    {/* Colored arc */}
                    <path
                        d="M 20 90 A 80 80 0 0 1 180 90"
                        fill="none"
                        stroke="url(#gaugeGradient)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        opacity="0.3"
                    />

                    {/* Tick marks */}
                    {[0, 25, 50, 75, 100].map((tick) => {
                        const angle = (tick / 100) * 180 - 90;
                        const radians = (angle * Math.PI) / 180;
                        const x1 = 100 + Math.cos(radians) * 70;
                        const y1 = 90 + Math.sin(radians) * 70;
                        const x2 = 100 + Math.cos(radians) * 80;
                        const y2 = 90 + Math.sin(radians) * 80;

                        return (
                            <line
                                key={tick}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke="#64748b"
                                strokeWidth="2"
                            />
                        );
                    })}
                </svg>

                {/* Needle */}
                <motion.div
                    className="absolute bottom-0 left-1/2 origin-bottom"
                    style={{
                        width: 4,
                        height: 70,
                        marginLeft: -2,
                        background: `linear-gradient(to top, ${colors.main}, ${colors.main}88)`,
                        borderRadius: 4,
                        boxShadow: `0 0 20px ${colors.glow}`
                    }}
                    initial={{ rotate: -90 }}
                    animate={{ rotate: rotation }}
                    transition={{ type: "spring", stiffness: 60, damping: 15 }}
                />

                {/* Center circle */}
                <div
                    className="absolute bottom-0 left-1/2 w-4 h-4 rounded-full -translate-x-1/2 translate-y-1/2"
                    style={{ backgroundColor: colors.main, boxShadow: `0 0 15px ${colors.glow}` }}
                />
            </div>

            {/* Value display */}
            <div className="text-center">
                <motion.div
                    className="text-5xl font-bold mb-2"
                    style={{ color: colors.main }}
                    key={data.value}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    {data.value}
                </motion.div>
                <div className="text-xl font-semibold text-white mb-2">{data.label}</div>
                <p className="text-sm text-slate-400 max-w-xs mx-auto">{data.description}</p>
            </div>

            {/* Legend */}
            <div className="flex justify-between mt-6 text-xs text-slate-500">
                <span>Extreme Fear</span>
                <span>Fear</span>
                <span>Neutral</span>
                <span>Greed</span>
                <span>Extreme Greed</span>
            </div>
        </div>
    );
}
