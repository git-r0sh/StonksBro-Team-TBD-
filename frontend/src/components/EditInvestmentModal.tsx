'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface Holding {
    id: number;
    ticker: string;
    quantity: number;
    buy_price: number;
    source_app: string;
}

interface EditInvestmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    holding: Holding | null;
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

export default function EditInvestmentModal({ isOpen, onClose, onSuccess, holding }: EditInvestmentModalProps) {
    const { token } = useAuth();
    const [quantity, setQuantity] = useState('');
    const [buyPrice, setBuyPrice] = useState('');
    const [sourceApp, setSourceApp] = useState('Zerodha');
    const [isLoading, setIsLoading] = useState(false);

    // Populate form when holding changes
    useEffect(() => {
        if (holding) {
            setQuantity(holding.quantity.toString());
            setBuyPrice(holding.buy_price.toString());
            setSourceApp(holding.source_app || 'Manual');
        }
    }, [holding]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!holding) return;

        if (!quantity || !buyPrice) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (parseFloat(quantity) <= 0 || parseFloat(buyPrice) <= 0) {
            toast.error('Quantity and price must be positive');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/portfolio/${holding.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    quantity: parseFloat(quantity),
                    buy_price: parseFloat(buyPrice),
                    source_app: sourceApp,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to update investment');
            }

            toast.success(`Updated ${holding.ticker}!`);
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to update investment');
        } finally {
            setIsLoading(false);
        }
    };

    if (!holding) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
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
                                    <div className="p-2 rounded-lg bg-[#f59e0b]/10">
                                        <Edit3 className="w-5 h-5 text-[#f59e0b]" />
                                    </div>
                                    <div>
                                        <span className="font-mono text-sm">EDIT INVESTMENT</span>
                                        <span className="ml-2 text-[#00ff88] font-mono">{holding.ticker}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-[#555] hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {/* Ticker (readonly) */}
                                <div>
                                    <label className="block text-xs text-[#888] uppercase tracking-wider mb-2 font-mono">
                                        Ticker Symbol
                                    </label>
                                    <input
                                        type="text"
                                        value={holding.ticker}
                                        disabled
                                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg py-3 px-4 text-[#555] font-mono cursor-not-allowed"
                                    />
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
                                            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg py-3 px-4 text-white font-mono focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] transition-all outline-none"
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
                                            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg py-3 px-4 text-white font-mono focus:border-[#f59e0b] focus:ring-1 focus:ring-[#f59e0b] transition-all outline-none"
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
                                                        ? 'border-[#f59e0b] bg-[#f59e0b]/10 text-[#f59e0b]'
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
                                        className="w-full bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-black font-bold py-3 rounded-lg font-mono uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <span className="inline-flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                                Updating...
                                            </span>
                                        ) : (
                                            'Save Changes'
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
