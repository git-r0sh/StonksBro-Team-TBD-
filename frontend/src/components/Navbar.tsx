'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    LayoutDashboard,
    BookOpen,
    Briefcase,
    GraduationCap,
    Activity,
    TrendingUp,
    BarChart3,
    Bell,
    LogIn,
    LogOut,
    User
} from 'lucide-react';

const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/portfolio', label: 'Portfolio', icon: Briefcase },
    { href: '/sentiment', label: 'Sentiment', icon: Activity },
    { href: '/learning', label: 'Learning', icon: BookOpen },
    { href: '/lessons', label: 'AI Lessons', icon: GraduationCap },
];

export default function Navbar() {
    const pathname = usePathname();
    const { user, isAuthenticated, logout } = useAuth();
    const [currentTime, setCurrentTime] = useState<string>('--:--');

    // Client-side only time update to avoid hydration mismatch
    useEffect(() => {
        const updateTime = () => {
            setCurrentTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <nav className="fixed left-0 top-0 h-screen w-56 bg-[#0a0a0a] border-r border-[#2a2a2a] flex flex-col">
            {/* Logo */}
            <div className="p-4 border-b border-[#2a2a2a]">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#00ff88] rounded flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-black" />
                    </div>
                    <span className="text-lg font-bold font-mono text-white">
                        STONKS<span className="text-[#00ff88]">BRO</span>
                    </span>
                </div>
                <div className="text-[10px] text-[#555] mt-1 font-mono uppercase tracking-wider">
                    Pro Terminal v3.0
                </div>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 py-4 px-2">
                <div className="text-[10px] text-[#555] uppercase tracking-wider px-3 mb-2 font-mono">
                    Navigation
                </div>
                <div className="space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2 text-sm font-mono transition-all ${isActive
                                    ? 'bg-[#00ff8815] text-[#00ff88] border-l-2 border-[#00ff88]'
                                    : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="uppercase text-xs tracking-wider">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* User Section */}
            <div className="p-3 border-t border-[#2a2a2a]">
                {isAuthenticated ? (
                    <div className="bg-[#141414] rounded p-3 border border-[#2a2a2a]">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-[#00ff88]/20 rounded-full flex items-center justify-center">
                                <User className="w-3 h-3 text-[#00ff88]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-mono text-white truncate">
                                    {user?.username}
                                </div>
                                <div className="text-[10px] text-[#555] truncate">
                                    {user?.email}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full flex items-center justify-center gap-2 py-1.5 text-[10px] text-[#888] hover:text-[#ff3366] font-mono uppercase tracking-wider transition-colors"
                        >
                            <LogOut className="w-3 h-3" />
                            Logout
                        </button>
                    </div>
                ) : (
                    <Link href="/login" className="block">
                        <div className="bg-[#00ff88]/10 hover:bg-[#00ff88]/20 border border-[#00ff88]/30 rounded p-3 transition-colors">
                            <div className="flex items-center justify-center gap-2 text-[#00ff88] font-mono text-xs uppercase tracking-wider">
                                <LogIn className="w-4 h-4" />
                                Login
                            </div>
                        </div>
                    </Link>
                )}
            </div>

            {/* Market Status */}
            <div className="p-3 border-t border-[#2a2a2a]">
                <div className="bg-[#141414] rounded p-3 border border-[#2a2a2a]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-[#555] uppercase font-mono">NSE</span>
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-[#00ff88] rounded-full animate-pulse" />
                            <span className="text-[10px] text-[#00ff88] font-mono">LIVE</span>
                        </div>
                    </div>
                    <div className="text-xs text-[#888] font-mono">
                        {currentTime} IST
                    </div>
                </div>
            </div>

            {/* Alerts indicator */}
            <div className="p-3 border-t border-[#2a2a2a]">
                <Link href="/portfolio" className="flex items-center justify-between p-2 hover:bg-[#1a1a1a] rounded transition-colors">
                    <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#888]" />
                        <span className="text-xs text-[#888] font-mono">Alerts</span>
                    </div>
                    <span className="alert-badge px-1.5 py-0.5 bg-[#ff3366] text-white text-[10px] rounded font-bold">
                        2
                    </span>
                </Link>
            </div>
        </nav>
    );
}
