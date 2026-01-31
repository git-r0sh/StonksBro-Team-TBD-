'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const MOCK_RESPONSES: Record<string, string> = {
    'default': "I'm your AI trading assistant! I can help you understand market concepts, analyze stocks, and explain investment strategies. What would you like to learn about?",
    'stock': "When analyzing stocks, consider these key factors:\n\n📊 **Fundamentals**: P/E ratio, EPS growth, debt levels\n📈 **Technical Analysis**: Moving averages, RSI, MACD\n📰 **Market Sentiment**: News, analyst ratings, institutional activity\n\nWould you like me to explain any of these in detail?",
    'risk': "Risk management is crucial for successful trading:\n\n🛡️ **Position Sizing**: Never risk more than 1-2% per trade\n🎯 **Stop Losses**: Always set exit points before entering\n📊 **Diversification**: Spread across sectors and asset classes\n💰 **Portfolio Allocation**: Balance between growth and safety\n\nRemember: Preservation of capital is the first rule of investing!",
    'nifty': "NIFTY 50 is India's benchmark stock index representing 50 of the largest companies listed on NSE.\n\n🏢 **Composition**: Covers 13 sectors of the economy\n📊 **Weightage**: IT and Financial Services have highest weights\n📈 **Use Cases**: Benchmarking, ETF tracking, derivatives\n\nIt's considered a barometer of the Indian economy!",
};

export default function AIChat() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "👋 Hello! I'm your AI trading assistant. Ask me anything about stocks, trading strategies, or market analysis!",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const getResponse = (query: string): string => {
        const lowerQuery = query.toLowerCase();
        if (lowerQuery.includes('stock') || lowerQuery.includes('analyze')) return MOCK_RESPONSES['stock'];
        if (lowerQuery.includes('risk') || lowerQuery.includes('loss')) return MOCK_RESPONSES['risk'];
        if (lowerQuery.includes('nifty') || lowerQuery.includes('index')) return MOCK_RESPONSES['nifty'];
        return MOCK_RESPONSES['default'];
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        // Simulate AI response delay
        setTimeout(() => {
            const response: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: getResponse(input),
                timestamp: new Date()
            };
            setMessages(prev => [...prev, response]);
            setIsTyping(false);
        }, 1000 + Math.random() * 1000);
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-slate-700/50 backdrop-blur overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-slate-700/50">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="font-semibold text-white">AI Assistant</h3>
                    <p className="text-xs text-slate-400">Powered by StonksBro AI</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-xs text-emerald-400">Online</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                    {messages.map((message) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${message.role === 'user'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-purple-500/20 text-purple-400'
                                }`}>
                                {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                            </div>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                    ? 'bg-emerald-500/20 text-white'
                                    : 'bg-slate-700/50 text-slate-200'
                                }`}>
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                <p className="text-xs text-slate-500 mt-2">
                                    {message.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isTyping && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-3"
                    >
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                            <Bot className="w-4 h-4" />
                        </div>
                        <div className="bg-slate-700/50 rounded-2xl px-4 py-3">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700/50">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about stocks, trading, or market analysis..."
                        className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    );
}
