'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { BookOpen, TrendingUp, Shield, Brain, Target, Clock, CheckCircle } from 'lucide-react';

const courses = [
    {
        id: 1,
        title: 'Market Basics',
        description: 'Learn the fundamentals of stock market investing',
        icon: BookOpen,
        progress: 75,
        lessons: 12,
        completed: 9,
        color: 'emerald',
        topics: ['Stock Market Fundamentals', 'Types of Orders', 'Reading Charts', 'Technical Indicators']
    },
    {
        id: 2,
        title: 'Risk Management',
        description: 'Master the art of protecting your capital',
        icon: Shield,
        progress: 40,
        lessons: 8,
        completed: 3,
        color: 'cyan',
        topics: ['Position Sizing', 'Stop Loss Strategies', 'Portfolio Diversification', 'Risk-Reward Ratio']
    },
    {
        id: 3,
        title: 'Technical Analysis',
        description: 'Advanced chart patterns and indicators',
        icon: TrendingUp,
        progress: 20,
        lessons: 15,
        completed: 3,
        color: 'purple',
        topics: ['Candlestick Patterns', 'Support & Resistance', 'Moving Averages', 'RSI & MACD']
    },
    {
        id: 4,
        title: 'Trading Psychology',
        description: 'Develop the mindset of a successful trader',
        icon: Brain,
        progress: 0,
        lessons: 10,
        completed: 0,
        color: 'orange',
        topics: ['Emotional Control', 'Discipline in Trading', 'Handling Losses', 'Building Confidence']
    },
];

const colorClasses = {
    emerald: {
        bg: 'from-emerald-500/20 to-emerald-600/10',
        border: 'border-emerald-500/30',
        progress: 'bg-emerald-500',
        icon: 'text-emerald-400',
        badge: 'bg-emerald-500/20 text-emerald-400'
    },
    cyan: {
        bg: 'from-cyan-500/20 to-cyan-600/10',
        border: 'border-cyan-500/30',
        progress: 'bg-cyan-500',
        icon: 'text-cyan-400',
        badge: 'bg-cyan-500/20 text-cyan-400'
    },
    purple: {
        bg: 'from-purple-500/20 to-purple-600/10',
        border: 'border-purple-500/30',
        progress: 'bg-purple-500',
        icon: 'text-purple-400',
        badge: 'bg-purple-500/20 text-purple-400'
    },
    orange: {
        bg: 'from-orange-500/20 to-orange-600/10',
        border: 'border-orange-500/30',
        progress: 'bg-orange-500',
        icon: 'text-orange-400',
        badge: 'bg-orange-500/20 text-orange-400'
    },
};

export default function LearningHub() {
    const router = useRouter();

    const handleCourseClick = (courseId: number) => {
        router.push(`/lessons?course=${courseId}`);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white">Learning Hub</h1>
                <p className="text-slate-400 mt-1">Master the art of trading with structured courses</p>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Courses Started', value: '4', icon: BookOpen },
                    { label: 'Lessons Completed', value: '15', icon: CheckCircle },
                    { label: 'Hours Learned', value: '8.5', icon: Clock },
                    { label: 'Achievements', value: '3', icon: Target },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
                    >
                        <stat.icon className="w-5 h-5 text-emerald-400 mb-2" />
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        <p className="text-xs text-slate-400">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Course Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {courses.map((course, index) => {
                    const colors = colorClasses[course.color as keyof typeof colorClasses];
                    const Icon = course.icon;

                    return (
                        <motion.div
                            key={course.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => handleCourseClick(course.id)}
                            className={`bg-gradient-to-br ${colors.bg} rounded-2xl p-6 border ${colors.border} hover-lift cursor-pointer`}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center ${colors.icon}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
                                    {course.completed}/{course.lessons} Lessons
                                </span>
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-semibold text-white mb-2">{course.title}</h3>
                            <p className="text-sm text-slate-400 mb-4">{course.description}</p>

                            {/* Topics */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {course.topics.slice(0, 3).map((topic, i) => (
                                    <span key={i} className="px-2 py-1 bg-slate-800/50 rounded-lg text-xs text-slate-300">
                                        {topic}
                                    </span>
                                ))}
                                {course.topics.length > 3 && (
                                    <span className="px-2 py-1 bg-slate-800/50 rounded-lg text-xs text-slate-400">
                                        +{course.topics.length - 3} more
                                    </span>
                                )}
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Progress</span>
                                    <span className="text-white font-medium">{course.progress}%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full ${colors.progress} rounded-full`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${course.progress}%` }}
                                        transition={{ duration: 0.8, delay: index * 0.1 }}
                                    />
                                </div>
                            </div>

                            {/* CTA */}
                            <button
                                onClick={() => handleCourseClick(course.id)}
                                className={`w-full mt-4 py-3 rounded-xl font-medium transition-all ${course.progress > 0
                                    ? 'bg-slate-800/50 text-white hover:bg-slate-700/50'
                                    : `${colors.badge} hover:opacity-80`
                                    }`}>
                                {course.progress > 0 ? 'Continue Learning' : 'Start Course'}
                            </button>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
