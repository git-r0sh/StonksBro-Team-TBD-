'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface AddInvestmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const BROKER_OPTIONS = [
    { value: 'Zerodha', color: '#387ed1' },
    { value: 'Groww', color: '#00d09c' },
    { value: 'Upstox', color: '#6950ff' },
    { value: 'Angel One', color: '#ff6b00' },
    { value: 'Kite', color: '#387ed1' },
    { value: 'Manual', color: '#888888' },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AddInvestmentModal({ isOpen, onClose, onSuccess }: AddInvestmentModalProps) {
    const { token } = useAuth();
    const [ticker, setTicker] = useState('');
    const [quantity, setQuantity] = useState('');
    const [buyPrice, setBuyPrice] = useState('');
    const [sourceApp, setSourceApp] = useState('Zerodha');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!ticker || !quantity || !buyPrice) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (parseFloat(quantity) <= 0 || parseFloat(buyPrice) <= 0) {
            toast.error('Quantity and price must be positive');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/portfolio/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ticker: ticker.toUpperCase().replace('.NS', ''),
                    quantity: parseFloat(quantity),
                    buy_price: parseFloat(buyPrice),
                    source_app: sourceApp,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to add investment');
            }

            toast.success(`Added ${ticker.toUpperCase()} to portfolio!`);
            onSuccess();
            handleClose();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to add investment');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setTicker('');
        setQuantity('');
        setBuyPrice('');
        setSourceApp('Zerodha');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
                    >
                        <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="terminal-header px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-[#00ff88]/10">
                                        <Plus className="w-5 h-5 text-[#00ff88]" />
                                    </div>
                                    <span className="font-mono text-sm">ADD INVESTMENT</span>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="text-[#555] hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {/* Ticker */}
                                <div>
                                    <label className="block text-xs text-[#888] uppercase tracking-wider mb-2 font-mono">
                                        Ticker Symbol *
                                    </label>
                                    <div className="relative">
                                        <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555]" />
                                        <input
                                            type="text"
                                            value={ticker}
                                            onChange={(e) => setTicker(e.target.value.toUpperCase())}
                                            placeholder="RELIANCE, TCS, INFY..."
                                            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg py-3 px-10 text-white placeholder:text-[#555] font-mono focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] transition-all outline-none"
                                        />
                                    </div>
                                    <p className="text-[10px] text-[#555] mt-1 font-mono">NSE tickers only (e.g., RELIANCE, not RELIANCE.NS)</p>
                                </div>

                                {/* Quantity and Buy Price */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-[#888] uppercase tracking-wider mb-2 font-mono">
                                            Quantity *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            placeholder="10"
                                            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg py-3 px-4 text-white placeholder:text-[#555] font-mono focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] transition-all outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-[#888] uppercase tracking-wider mb-2 font-mono">
                                            Avg Buy Price (₹) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={buyPrice}
                                            onChange={(e) => setBuyPrice(e.target.value)}
                                            placeholder="1500.50"
                                            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg py-3 px-4 text-white placeholder:text-[#555] font-mono focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88] transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Source App */}
                                <div>
                                    <label className="block text-xs text-[#888] uppercase tracking-wider mb-2 font-mono">
                                        Source App / Broker
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {BROKER_OPTIONS.map((broker) => (
                                            <button
                                                key={broker.value}
                                                type="button"
                                                onClick={() => setSourceApp(broker.value)}
                                                className={`py-2 px-3 rounded-lg text-xs font-mono border transition-all ${sourceApp === broker.value
                                                        ? 'border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]'
                                                        : 'border-[#2a2a2a] bg-[#0a0a0a] text-[#888] hover:border-[#555]'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 justify-center">
                                                    <div
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: broker.color }}
                                                    />
                                                    {broker.value}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="pt-2">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-bold py-3 rounded-lg font-mono uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <span className="inline-flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                                Adding...
                                            </span>
                                        ) : (
                                            'Add to Portfolio'
                                        )}
                                    </motion.button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
