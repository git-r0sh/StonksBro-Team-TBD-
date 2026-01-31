'use client';

import { useEffect, useState, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import AlertsPanel from '@/components/AlertsPanel';
import AddInvestmentModal from '@/components/AddInvestmentModal';
import EditInvestmentModal from '@/components/EditInvestmentModal';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import {
    TrendingUp, TrendingDown, Wallet, AlertTriangle,
    Plus, Edit3, Trash2, Download, RefreshCw, LogIn
} from 'lucide-react';
import Link from 'next/link';

interface Holding {
    id: number;
    ticker: string;
    quantity: number;
    buy_price: number;
    current_price: number;
    invested_value: number;
    current_value: number;
    gain_loss: number;
    gain_loss_percent: number;
    sector: string;
    cap_category: string;
    source_app: string;
    broker_color: string;
}

interface SectorBreakdown {
    name: string;
    value: number;
    percentage: number;
    color: string;
}

interface Diversification {
    sector_breakdown: SectorBreakdown[];
    cap_breakdown: SectorBreakdown[];
    broker_breakdown: SectorBreakdown[];
    risk_analysis: {
        concentration_risk: number;
        top_holding: string;
        diversification_score: number;
        recommendation: string;
    };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Portfolio() {
    const { token, isAuthenticated, isLoading: authLoading } = useAuth();
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [diversification, setDiversification] = useState<Diversification | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'holdings' | 'diversification'>('holdings');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingHolding, setEditingHolding] = useState<Holding | null>(null);
    const [priceFlash, setPriceFlash] = useState<Record<string, 'up' | 'down' | null>>({});
    const previousPrices = useRef<Record<string, number>>({});

    const fetchData = async () => {
        try {
            if (isAuthenticated && token) {
                // Fetch authenticated portfolio
                const [portfolioRes, divRes] = await Promise.all([
                    fetch(`${API_URL}/portfolio/`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${API_URL}/portfolio/diversification`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                if (portfolioRes.ok) {
                    const portfolioData = await portfolioRes.json();

                    // Check for price changes and trigger flash
                    const newFlashes: Record<string, 'up' | 'down' | null> = {};
                    portfolioData.forEach((h: Holding) => {
                        const prevPrice = previousPrices.current[h.ticker];
                        if (prevPrice !== undefined && prevPrice !== h.current_price) {
                            newFlashes[h.ticker] = h.current_price > prevPrice ? 'up' : 'down';
                        }
                        previousPrices.current[h.ticker] = h.current_price;
                    });

                    if (Object.keys(newFlashes).length > 0) {
                        setPriceFlash(newFlashes);
                        setTimeout(() => setPriceFlash({}), 500);
                    }

                    setHoldings(portfolioData);
                }

                if (divRes.ok) {
                    const divData = await divRes.json();
                    setDiversification(divData);
                }
            } else {
                // Fetch demo portfolio
                const demoRes = await fetch(`${API_URL}/portfolio/demo`);
                if (demoRes.ok) {
                    const demoData = await demoRes.json();
                    setHoldings(demoData);
                }
            }
        } catch (error) {
            console.error('Error fetching portfolio:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            fetchData();
            // 7-second refresh interval
            const interval = setInterval(fetchData, 7000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, token, authLoading]);

    const handleDelete = async (holdingId: number, ticker: string) => {
        if (!confirm(`Delete ${ticker} from portfolio?`)) return;

        try {
            const response = await fetch(`${API_URL}/portfolio/${holdingId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                toast.success(`Removed ${ticker} from portfolio`);
                fetchData();
            } else {
                throw new Error('Failed to delete');
            }
        } catch {
            toast.error('Failed to delete investment');
        }
    };

    const handleExportCSV = async () => {
        try {
            const response = await fetch(`${API_URL}/portfolio/export/csv`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `portfolio_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
                toast.success('Portfolio exported to CSV!');
            } else {
                throw new Error('Export failed');
            }
        } catch {
            toast.error('Failed to export portfolio');
        }
    };

    const totalInvested = holdings.reduce((sum, h) => sum + h.invested_value, 0);
    const totalCurrent = holdings.reduce((sum, h) => sum + h.current_value, 0);
    const totalGainLoss = totalCurrent - totalInvested;
    const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 bg-[#0a0a0a] min-h-screen">
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white font-mono">PORTFOLIO</h1>
                    <p className="text-[#888] text-sm mt-1 font-mono">
                        {isAuthenticated ? 'Your Holdings' : 'Demo Mode - Login to manage investments'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {isAuthenticated ? (
                        <>
                            {/* Add Investment Button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsAddModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-bold rounded-lg font-mono text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Add Investment
                            </motion.button>

                            {/* Export CSV */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleExportCSV}
                                className="flex items-center gap-2 px-4 py-2 border border-[#2a2a2a] text-[#888] hover:text-white hover:border-[#555] rounded-lg font-mono text-sm transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </motion.button>

                            {/* Refresh */}
                            <button
                                onClick={fetchData}
                                className="p-2 border border-[#2a2a2a] text-[#888] hover:text-white hover:border-[#555] rounded-lg transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <Link href="/login">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-bold rounded-lg font-mono text-sm"
                            >
                                <LogIn className="w-4 h-4" />
                                Login to Manage
                            </motion.button>
                        </Link>
                    )}

                    {/* Tab Buttons */}
                    <div className="flex gap-2">
                        {(['holdings', 'diversification'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`btn-terminal ${activeTab === tab ? 'active' : ''}`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="terminal-card p-4"
                >
                    <div className="flex items-center gap-2 text-[#888] text-xs uppercase mb-2">
                        <Wallet className="w-4 h-4" />
                        Total Value
                    </div>
                    <div className="text-2xl font-mono font-bold text-white">
                        ₹{totalCurrent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="terminal-card p-4"
                >
                    <div className="text-[#888] text-xs uppercase mb-2">Invested</div>
                    <div className="text-2xl font-mono font-bold text-white">
                        ₹{totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="terminal-card p-4"
                >
                    <div className="text-[#888] text-xs uppercase mb-2">Total P&L</div>
                    <div className={`text-2xl font-mono font-bold ${totalGainLoss >= 0 ? 'glow-positive' : 'glow-negative'}`}>
                        {totalGainLoss >= 0 ? '+' : ''}₹{totalGainLoss.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <div className={`text-sm font-mono ${totalGainLossPercent >= 0 ? 'text-[#00ff88]' : 'text-[#ff3366]'}`}>
                        ({totalGainLossPercent >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%)
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="terminal-card p-4"
                >
                    <div className="text-[#888] text-xs uppercase mb-2">Holdings</div>
                    <div className="text-2xl font-mono font-bold text-white">
                        {holdings.length}
                    </div>
                    <div className="text-xs text-[#555] font-mono">stocks</div>
                </motion.div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    {activeTab === 'holdings' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="terminal-card overflow-hidden"
                        >
                            <div className="terminal-header px-4 py-2 flex items-center justify-between">
                                <span>HOLDINGS ({holdings.length})</span>
                                <span className="text-[10px] text-[#555]">Updates every 7s</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-[#2a2a2a]">
                                            <th className="data-cell-header text-left">Stock</th>
                                            <th className="data-cell-header text-right">Qty</th>
                                            <th className="data-cell-header text-right">Avg Cost</th>
                                            <th className="data-cell-header text-right">LTP</th>
                                            <th className="data-cell-header text-right">Current</th>
                                            <th className="data-cell-header text-right">P&L</th>
                                            {isAuthenticated && <th className="data-cell-header text-center">Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <AnimatePresence>
                                            {holdings.map((holding, i) => (
                                                <motion.tr
                                                    key={holding.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 20 }}
                                                    transition={{ delay: i * 0.03 }}
                                                    className={`border-b border-[#1a1a1a] hover:bg-[#1a1a1a] ${priceFlash[holding.ticker] === 'up' ? 'flash-green' :
                                                            priceFlash[holding.ticker] === 'down' ? 'flash-red' : ''
                                                        }`}
                                                >
                                                    <td className="data-cell">
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-2 h-2 rounded-full"
                                                                style={{ backgroundColor: holding.broker_color }}
                                                            />
                                                            <div>
                                                                <div className="font-bold text-white">{holding.ticker}</div>
                                                                <div className="text-[10px] text-[#555]">{holding.sector}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="data-cell text-right font-mono">{holding.quantity}</td>
                                                    <td className="data-cell text-right font-mono">₹{holding.buy_price.toFixed(2)}</td>
                                                    <td className={`data-cell text-right font-mono text-white ${priceFlash[holding.ticker] === 'up' ? 'text-[#00ff88]' :
                                                            priceFlash[holding.ticker] === 'down' ? 'text-[#ff3366]' : ''
                                                        }`}>
                                                        ₹{holding.current_price.toFixed(2)}
                                                    </td>
                                                    <td className="data-cell text-right font-mono text-white">
                                                        ₹{holding.current_value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                    </td>
                                                    <td className="data-cell text-right">
                                                        <div className={`font-mono font-bold ${holding.gain_loss >= 0 ? 'text-[#00ff88]' : 'text-[#ff3366]'}`}>
                                                            {holding.gain_loss >= 0 ? '+' : ''}₹{holding.gain_loss.toFixed(0)}
                                                        </div>
                                                        <div className={`text-[10px] ${holding.gain_loss_percent >= 0 ? 'text-[#00ff88]' : 'text-[#ff3366]'}`}>
                                                            ({holding.gain_loss_percent >= 0 ? '+' : ''}{holding.gain_loss_percent.toFixed(2)}%)
                                                        </div>
                                                    </td>
                                                    {isAuthenticated && (
                                                        <td className="data-cell">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingHolding(holding);
                                                                        setIsEditModalOpen(true);
                                                                    }}
                                                                    className="p-1.5 text-[#555] hover:text-[#f59e0b] transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <Edit3 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(holding.id, holding.ticker)}
                                                                    className="p-1.5 text-[#555] hover:text-[#ff3366] transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    )}
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>

                                {holdings.length === 0 && !loading && (
                                    <div className="p-8 text-center">
                                        <Wallet className="w-12 h-12 text-[#2a2a2a] mx-auto mb-4" />
                                        <p className="text-[#555] font-mono">No holdings yet</p>
                                        {isAuthenticated && (
                                            <button
                                                onClick={() => setIsAddModalOpen(true)}
                                                className="mt-4 text-[#00ff88] hover:underline font-mono text-sm"
                                            >
                                                Add your first investment →
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'diversification' && diversification && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-6"
                        >
                            {/* Pie Charts */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Sector Breakdown */}
                                <div className="terminal-card p-4">
                                    <div className="terminal-header px-3 py-2 -mx-4 -mt-4 mb-4">
                                        SECTOR ALLOCATION
                                    </div>
                                    <div className="h-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={diversification.sector_breakdown}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={40}
                                                    outerRadius={70}
                                                    stroke="#0a0a0a"
                                                    strokeWidth={2}
                                                >
                                                    {diversification.sector_breakdown.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 4 }}
                                                    formatter={(value) => [`₹${(value as number || 0).toLocaleString('en-IN')}`, '']}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                        {diversification.sector_breakdown.map(item => (
                                            <div key={item.name} className="flex items-center gap-2 text-xs">
                                                <div className="w-2 h-2 rounded" style={{ background: item.color }} />
                                                <span className="text-[#888]">{item.name}</span>
                                                <span className="text-white font-mono ml-auto">{item.percentage}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Broker Breakdown */}
                                <div className="terminal-card p-4">
                                    <div className="terminal-header px-3 py-2 -mx-4 -mt-4 mb-4">
                                        BROKER ALLOCATION
                                    </div>
                                    <div className="h-48">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={diversification.broker_breakdown}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={40}
                                                    outerRadius={70}
                                                    stroke="#0a0a0a"
                                                    strokeWidth={2}
                                                >
                                                    {diversification.broker_breakdown.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ background: '#141414', border: '1px solid #2a2a2a', borderRadius: 4 }}
                                                    formatter={(value) => [`₹${(value as number || 0).toLocaleString('en-IN')}`, '']}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-2 mt-4">
                                        {diversification.broker_breakdown.map(item => (
                                            <div key={item.name} className="flex items-center gap-2 text-xs">
                                                <div className="w-2 h-2 rounded" style={{ background: item.color }} />
                                                <span className="text-[#888]">{item.name}</span>
                                                <span className="text-white font-mono ml-auto">{item.percentage}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Risk Analysis */}
                            <div className="terminal-card p-4">
                                <div className="terminal-header px-3 py-2 -mx-4 -mt-4 mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-3 h-3" />
                                    RISK ANALYSIS
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-3 bg-[#1a1a1a] rounded">
                                        <div className="text-[10px] text-[#888] uppercase">Concentration Risk</div>
                                        <div className={`text-2xl font-mono font-bold ${diversification.risk_analysis.concentration_risk > 40 ? 'text-[#ff3366]' :
                                                diversification.risk_analysis.concentration_risk > 25 ? 'text-[#ffcc00]' : 'text-[#00ff88]'
                                            }`}>
                                            {diversification.risk_analysis.concentration_risk}%
                                        </div>
                                        <div className="text-[10px] text-[#555]">Top: {diversification.risk_analysis.top_holding}</div>
                                    </div>
                                    <div className="p-3 bg-[#1a1a1a] rounded">
                                        <div className="text-[10px] text-[#888] uppercase">Diversification Score</div>
                                        <div className={`text-2xl font-mono font-bold ${diversification.risk_analysis.diversification_score >= 70 ? 'text-[#00ff88]' :
                                                diversification.risk_analysis.diversification_score >= 50 ? 'text-[#ffcc00]' : 'text-[#ff3366]'
                                            }`}>
                                            {diversification.risk_analysis.diversification_score.toFixed(0)}/100
                                        </div>
                                    </div>
                                    <div className="p-3 bg-[#1a1a1a] rounded">
                                        <div className="text-[10px] text-[#888] uppercase">Recommendation</div>
                                        <div className="text-sm font-bold text-white mt-1">
                                            {diversification.risk_analysis.recommendation}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Alerts Panel */}
                <div>
                    <AlertsPanel />
                </div>
            </div>

            {/* Modals */}
            <AddInvestmentModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchData}
            />

            <EditInvestmentModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingHolding(null);
                }}
                onSuccess={fetchData}
                holding={editingHolding}
            />
        </div>
    );
}
