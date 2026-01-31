'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, TrendingDown, TrendingUp, Bell, X } from 'lucide-react';

interface Alert {
    ticker: string;
    type: string;
    severity: string;
    message: string;
    rsi?: number;
    action: string;
}

export default function AlertsPanel() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [dismissed, setDismissed] = useState<string[]>([]);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const response = await fetch(`${API_URL}/portfolio/alerts`);
                const data = await response.json();
                setAlerts(data.alerts || []);
            } catch (error) {
                console.error('Error fetching alerts:', error);
                // Mock alerts
                setAlerts([
                    { ticker: 'SBIN', type: 'OVERSOLD', severity: 'high', message: 'SBIN is Oversold! RSI: 28', rsi: 28, action: 'Consider adding to position' },
                    { ticker: 'ITC', type: 'APPROACHING_OVERSOLD', severity: 'medium', message: 'ITC approaching oversold territory. RSI: 38', rsi: 38, action: 'Monitor closely' },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchAlerts();
        const interval = setInterval(fetchAlerts, 60000);
        return () => clearInterval(interval);
    }, []);

    const dismissAlert = (ticker: string) => {
        setDismissed([...dismissed, ticker]);
    };

    const activeAlerts = alerts.filter(a => !dismissed.includes(a.ticker));
    const highPriorityAlerts = activeAlerts.filter(a => a.severity === 'high');
    const displayAlerts = showAll ? activeAlerts : activeAlerts.slice(0, 3);

    const getAlertIcon = (type: string) => {
        if (type.includes('OVERSOLD')) return <TrendingDown className="w-4 h-4" />;
        if (type.includes('OVERBOUGHT')) return <TrendingUp className="w-4 h-4" />;
        return <AlertTriangle className="w-4 h-4" />;
    };

    const getAlertStyle = (severity: string) => {
        if (severity === 'high') {
            return 'border-[#ff3366] bg-[#ff336615]';
        }
        return 'border-[#ffcc00] bg-[#ffcc0015]';
    };

    if (loading) {
        return (
            <div className="terminal-card p-4">
                <div className="terminal-header px-3 py-2 -mx-4 -mt-4 mb-4">
                    ALERTS
                </div>
                <div className="space-y-2">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="skeleton h-16 rounded" />
                    ))}
                </div>
            </div>
        );
    }

    if (activeAlerts.length === 0) {
        return (
            <div className="terminal-card p-4">
                <div className="terminal-header px-3 py-2 -mx-4 -mt-4 mb-4 flex justify-between items-center">
                    <span>ALERTS</span>
                    <Bell className="w-3 h-3 text-[#555]" />
                </div>
                <div className="text-center py-6">
                    <div className="text-[#00ff88] text-2xl mb-2">✓</div>
                    <div className="text-[#888] text-sm">No active alerts</div>
                    <div className="text-[#555] text-xs mt-1">Portfolio looking healthy</div>
                </div>
            </div>
        );
    }

    return (
        <div className="terminal-card p-4">
            <div className="terminal-header px-3 py-2 -mx-4 -mt-4 mb-4 flex justify-between items-center">
                <span className="flex items-center gap-2">
                    ALERTS
                    {highPriorityAlerts.length > 0 && (
                        <span className="alert-badge px-1.5 py-0.5 bg-[#ff3366] text-white text-[10px] rounded font-bold">
                            {highPriorityAlerts.length}
                        </span>
                    )}
                </span>
                <Bell className="w-3 h-3 text-[#888]" />
            </div>

            <div className="space-y-2">
                <AnimatePresence>
                    {displayAlerts.map((alert, index) => (
                        <motion.div
                            key={`${alert.ticker}-${alert.type}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-3 rounded border ${getAlertStyle(alert.severity)} relative group`}
                        >
                            <button
                                onClick={() => dismissAlert(alert.ticker)}
                                className="absolute top-2 right-2 text-[#555] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-3 h-3" />
                            </button>

                            <div className="flex items-start gap-3">
                                <div className={`p-1.5 rounded ${alert.severity === 'high' ? 'bg-[#ff336630] text-[#ff3366]' : 'bg-[#ffcc0030] text-[#ffcc00]'
                                    }`}>
                                    {getAlertIcon(alert.type)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-white">{alert.ticker}</span>
                                        {alert.rsi && (
                                            <span className="text-[10px] text-[#888]">RSI: {alert.rsi}</span>
                                        )}
                                    </div>
                                    <div className="text-xs text-[#888] mt-0.5">{alert.message}</div>
                                    <div className={`text-[10px] mt-1 ${alert.severity === 'high' ? 'text-[#ff9999]' : 'text-[#ffcc99]'
                                        }`}>
                                        → {alert.action}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {activeAlerts.length > 3 && (
                <button
                    onClick={() => setShowAll(!showAll)}
                    className="w-full mt-3 py-2 text-xs text-[#888] hover:text-[#00ff88] transition-colors"
                >
                    {showAll ? 'Show Less' : `Show ${activeAlerts.length - 3} More Alerts`}
                </button>
            )}
        </div>
    );
}
