'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Eye, EyeOff, TrendingUp, Lock, Mail, User } from 'lucide-react';

export default function SignupPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { signup } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !email || !password || !confirmPassword) {
            toast.error('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        const result = await signup(username, email, password);

        if (result.success) {
            toast.success('Account created successfully!');
            router.push('/');
        } else {
            toast.error(result.error || 'Signup failed');
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 overflow-hidden">
            {/* Animated background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#8b5cf6]/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#00ff88]/5 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#6b3fc7] mb-4"
                    >
                        <TrendingUp className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-bold font-mono text-white">
                        JOIN <span className="text-[#8b5cf6]">STONKSBRO</span>
                    </h1>
                    <p className="text-[#888] mt-2">Start Your Trading Journey</p>
                </div>

                {/* Signup Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-[#141414]/80 backdrop-blur-xl border border-[#2a2a2a] rounded-2xl p-8 shadow-2xl"
                >
                    <h2 className="text-xl font-bold text-white mb-6 font-mono">CREATE ACCOUNT</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username Field */}
                        <div>
                            <label className="block text-xs text-[#888] uppercase tracking-wider mb-2 font-mono">
                                Username
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555]" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="traderpro"
                                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg py-3 px-10 text-white placeholder:text-[#555] font-mono focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition-all outline-none"
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div>
                            <label className="block text-xs text-[#888] uppercase tracking-wider mb-2 font-mono">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555]" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="trader@stonksbro.com"
                                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg py-3 px-10 text-white placeholder:text-[#555] font-mono focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition-all outline-none"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-xs text-[#888] uppercase tracking-wider mb-2 font-mono">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555]" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg py-3 px-10 text-white placeholder:text-[#555] font-mono focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition-all outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#888] transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label className="block text-xs text-[#888] uppercase tracking-wider mb-2 font-mono">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555]" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg py-3 px-10 text-white placeholder:text-[#555] font-mono focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition-all outline-none"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#6b3fc7] text-white font-bold py-3 rounded-lg font-mono uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#8b5cf6]/20 mt-2"
                        >
                            {isLoading ? (
                                <span className="inline-flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating Account...
                                </span>
                            ) : (
                                'Create Account'
                            )}
                        </motion.button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#2a2a2a]" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-[#141414] px-2 text-[#555] font-mono">Already have an account?</span>
                        </div>
                    </div>

                    {/* Login Link */}
                    <Link href="/login">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full border border-[#2a2a2a] text-white font-bold py-3 rounded-lg font-mono uppercase tracking-wider text-center hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all"
                        >
                            Login Instead
                        </motion.div>
                    </Link>
                </motion.div>

                {/* Demo Mode */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-center mt-6"
                >
                    <Link href="/" className="text-[#555] hover:text-[#888] text-sm font-mono transition-colors">
                        Continue in Demo Mode →
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    );
}
