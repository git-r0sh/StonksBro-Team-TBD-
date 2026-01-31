'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';

interface NewsItem {
    ticker: string;
    title: string;
    publisher: string;
    link: string;
    sentiment_score: number;
    sentiment: string;
    impact: string;
}

export default function NewsTicker() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const response = await fetch(`${API_URL}/sentiment/news/feed`);
                const data = await response.json();
                setNews(data.news || []);
            } catch (error) {
                console.error('Error fetching news:', error);
                // Mock news
                setNews([
                    { ticker: 'RELIANCE', title: 'Reliance Industries reports strong Q3 results', publisher: 'ET', link: '#', sentiment_score: 72, sentiment: 'Bullish', impact: 'High' },
                    { ticker: 'TCS', title: 'TCS wins major deal worth $500M', publisher: 'Mint', link: '#', sentiment_score: 80, sentiment: 'Bullish', impact: 'High' },
                    { ticker: 'HDFCBANK', title: 'HDFC Bank credit growth slows', publisher: 'BS', link: '#', sentiment_score: 35, sentiment: 'Bearish', impact: 'Medium' },
                    { ticker: 'INFY', title: 'Infosys maintains FY26 guidance', publisher: 'MC', link: '#', sentiment_score: 55, sentiment: 'Neutral', impact: 'Low' },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
        const interval = setInterval(fetchNews, 120000); // Refresh every 2 min
        return () => clearInterval(interval);
    }, []);

    const getImpactColor = (impact: string) => {
        switch (impact) {
            case 'High': return 'impact-high';
            case 'Medium': return 'impact-medium';
            default: return 'impact-low';
        }
    };

    const getSentimentIcon = (score: number) => {
        return score >= 55 ? (
            <TrendingUp className="w-3 h-3 text-[#00ff88]" />
        ) : score <= 45 ? (
            <TrendingDown className="w-3 h-3 text-[#ff3366]" />
        ) : null;
    };

    if (loading) {
        return (
            <div className="ticker-tape py-2">
                <div className="flex gap-8 px-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton h-5 w-64 rounded" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div
            className="ticker-tape py-2 overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <div
                ref={scrollRef}
                className="flex gap-8 whitespace-nowrap"
                style={{
                    animation: isPaused ? 'none' : 'ticker-scroll 40s linear infinite',
                }}
            >
                {/* Duplicate content for seamless loop */}
                {[...news, ...news].map((item, index) => (
                    <a
                        key={`${item.ticker}-${index}`}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-1 hover:bg-[#1a1a1a] transition-colors group"
                    >
                        <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${getImpactColor(item.impact || 'Low')}`}>
                            {(item.impact || 'INFO').toUpperCase()}
                        </span>
                        <span className="text-[#00ccff] font-mono text-xs font-bold">
                            {item.ticker}
                        </span>
                        {getSentimentIcon(item.sentiment_score)}
                        <span className="text-xs text-[#888] max-w-[300px] truncate group-hover:text-white transition-colors">
                            {item.title}
                        </span>
                        <span className="text-[10px] text-[#555]">
                            — {item.publisher}
                        </span>
                        <ExternalLink className="w-3 h-3 text-[#555] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                ))}
            </div>
        </div>
    );
}
