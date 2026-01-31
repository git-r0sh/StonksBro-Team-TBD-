'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface SectorData {
    sector: string;
    change_percent: number;
    trend: string;
    intensity: number;
    stocks: { ticker: string; price: number; change_percent: number }[];
}

export default function SectorHeatmap() {
    const [sectors, setSectors] = useState<SectorData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSector, setSelectedSector] = useState<SectorData | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const response = await fetch(`${API_URL}/analytics/sectors`);
                const data = await response.json();
                setSectors(data.sectors || []);
            } catch (error) {
                console.error('Error fetching sectors:', error);
                // Mock data
                setSectors([
                    { sector: 'IT', change_percent: 1.5, trend: 'up', intensity: 50, stocks: [] },
                    { sector: 'Banking', change_percent: -0.8, trend: 'down', intensity: 27, stocks: [] },
                    { sector: 'Energy', change_percent: 2.1, trend: 'up', intensity: 70, stocks: [] },
                    { sector: 'Pharma', change_percent: 0.3, trend: 'up', intensity: 10, stocks: [] },
                    { sector: 'Auto', change_percent: -1.2, trend: 'down', intensity: 40, stocks: [] },
                    { sector: 'FMCG', change_percent: 0.5, trend: 'up', intensity: 17, stocks: [] },
                    { sector: 'Metals', change_percent: -0.5, trend: 'down', intensity: 17, stocks: [] },
                    { sector: 'Infra', change_percent: 1.8, trend: 'up', intensity: 60, stocks: [] },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, []);

    const getColor = (change: number, intensity: number) => {
        const normalizedIntensity = Math.min(intensity / 100, 1);
        if (change >= 0) {
            return `rgba(0, 255, 136, ${0.2 + normalizedIntensity * 0.6})`;
        } else {
            return `rgba(255, 51, 102, ${0.2 + normalizedIntensity * 0.6})`;
        }
    };

    const getBorderColor = (change: number) => {
        return change >= 0 ? 'rgba(0, 255, 136, 0.5)' : 'rgba(255, 51, 102, 0.5)';
    };

    if (loading) {
        return (
            <div className="terminal-card p-4">
                <div className="terminal-header px-3 py-2 -mx-4 -mt-4 mb-4">
                    SECTOR HEATMAP
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="skeleton h-20 rounded" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="terminal-card p-4">
            <div className="terminal-header px-3 py-2 -mx-4 -mt-4 mb-4 flex justify-between items-center">
                <span>SECTOR HEATMAP</span>
                <span className="text-[10px]">NSE/BSE</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
                {sectors.map((sector, index) => (
                    <motion.div
                        key={sector.sector}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="heatmap-cell p-3 rounded cursor-pointer"
                        style={{
                            background: getColor(sector.change_percent, sector.intensity),
                            border: `1px solid ${getBorderColor(sector.change_percent)}`
                        }}
                        onClick={() => setSelectedSector(selectedSector?.sector === sector.sector ? null : sector)}
                    >
                        <div className="text-xs font-bold text-white uppercase tracking-wider">
                            {sector.sector}
                        </div>
                        <div className={`text-lg font-mono font-bold mt-1 ${sector.change_percent >= 0 ? 'text-[#00ff88]' : 'text-[#ff3366]'
                            }`}>
                            {sector.change_percent >= 0 ? '+' : ''}{sector.change_percent.toFixed(2)}%
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Selected sector details */}
            {selectedSector && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-[#2a2a2a]"
                >
                    <div className="text-xs text-[#888] uppercase mb-2">
                        {selectedSector.sector} — TOP STOCKS
                    </div>
                    <div className="space-y-2">
                        {selectedSector.stocks.slice(0, 3).map((stock) => (
                            <div key={stock.ticker} className="flex justify-between items-center text-sm">
                                <span className="font-mono">{stock.ticker}</span>
                                <div className="flex items-center gap-3">
                                    <span>₹{stock.price.toFixed(2)}</span>
                                    <span className={stock.change_percent >= 0 ? 'text-[#00ff88]' : 'text-[#ff3366]'}>
                                        {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
