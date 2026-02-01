'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface IndexData {
    ticker: string;
    name: string;
    price: number;
    change: number;
    change_percent: number;
}

export default function NewsTicker() {
    const [nifty, setNifty] = useState<IndexData>({
        ticker: 'NIFTY50',
        name: 'NIFTY 50',
        price: 22150.45,
        change: 125.30,
        change_percent: 0.57
    });

    const [sensex, setSensex] = useState<IndexData>({
        ticker: 'SENSEX',
        name: 'BSE SENSEX',
        price: 73158.24,
        change: 412.18,
        change_percent: 0.57
    });

    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        const fetchIndexData = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

                // Fetch NIFTY 50
                const niftyResponse = await fetch(`${API_URL}/stocks/nifty50`);
                if (niftyResponse.ok) {
                    const niftyData = await niftyResponse.json();
                    if (niftyData.index) {
                        setNifty(niftyData.index);
                    }
                }
            } catch (error) {
                // Silently fail - keep mock data
                console.error('Error fetching index data:', error);
            }
        };

        fetchIndexData();
        const interval = setInterval(fetchIndexData, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const MarketItem = ({ data }: { data: IndexData }) => {
        const isPositive = data.change_percent >= 0;

        return (
            <div className="flex items-center gap-3 px-6 py-1">
                <span className="text-[#00ccff] font-mono text-sm font-bold tracking-wider">
                    {data.name}
                </span>
                <span className="text-white font-mono text-sm font-bold">
                    ₹{data.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </span>
                <div className={`flex items-center gap-1 ${isPositive ? 'text-[#00ff88]' : 'text-[#ff3366]'}`}>
                    {isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                    ) : (
                        <TrendingDown className="w-3 h-3" />
                    )}
                    <span className="text-xs font-mono font-bold">
                        {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)} ({data.change_percent >= 0 ? '+' : ''}{data.change_percent.toFixed(2)}%)
                    </span>
                </div>
                <span className="text-[#555] text-xs">•</span>
            </div>
        );
    };

    return (
        <div
            className="ticker-tape py-2 overflow-hidden relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Dual container approach for seamless infinite scroll */}
            <div className="flex">
                {/* First container */}
                <div
                    className="flex whitespace-nowrap"
                    style={{
                        animation: isPaused ? 'none' : 'ticker-scroll 30s linear infinite',
                    }}
                >
                    {Array(5).fill(null).map((_, i) => (
                        <div key={`set1-${i}`} className="flex">
                            <MarketItem data={nifty} />
                            <MarketItem data={sensex} />
                        </div>
                    ))}
                </div>

                {/* Second container for seamless loop */}
                <div
                    className="flex whitespace-nowrap"
                    style={{
                        animation: isPaused ? 'none' : 'ticker-scroll 30s linear infinite',
                    }}
                >
                    {Array(5).fill(null).map((_, i) => (
                        <div key={`set2-${i}`} className="flex">
                            <MarketItem data={nifty} />
                            <MarketItem data={sensex} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
