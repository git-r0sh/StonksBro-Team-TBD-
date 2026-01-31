'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, BookOpen, CheckCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import AIChat from '@/components/AIChat';

// Types
type Section = { heading: string; content: string };
type LessonContent = { title: string; sections: Section[] };
type Course = {
    title: string;
    lessons: { id: number; title: string; completed: boolean }[];
    contents: Record<number, LessonContent>;
};

// Data for all courses
const coursesData: Record<number, Course> = {
    1: {
        title: 'Market Basics',
        lessons: [
            { id: 1, title: 'What is the Stock Market?', completed: true },
            { id: 2, title: 'Types of Orders', completed: false },
            { id: 3, title: 'Market Participants', completed: false },
            { id: 4, title: 'Indices and Sectors', completed: false },
            { id: 5, title: 'IPO Process', completed: false },
        ],
        contents: {
            1: {
                title: 'What is the Stock Market?',
                sections: [
                    {
                        heading: 'Introduction to Markets',
                        content: `The **Stock Market** is a platform where buyers and sellers come together to trade shares of publicly listed companies. It acts as a primary source for companies to raise capital and for investors to grow their wealth.

Key Functions of the Market:
- **Capital Formation**: Companies raise money for expansion
- **Liquidity**: Investors can easily buy and sell assets
- **Price Discovery**: Demand and supply determine fair value`
                    },
                    {
                        heading: 'Primary vs Secondary Market',
                        content: `### Primary Market (IPO)
Where securities are created. It's in this market that firms sell (float) new stocks and bonds to the public for the first time.

### Secondary Market
Where those securities are traded by investors. The stock exchange (like NSE, BSE) is the secondary market.

*Most of the trading action happens in the Secondary Market.*`
                    }
                ]
            },
            2: {
                title: 'Types of Orders',
                sections: [
                    {
                        heading: 'Market Orders',
                        content: `A **Market Order** is an order to buy or sell a stock at the best available current price.
                        
- **Pros**: Immediate execution.
- **Cons**: You can't control the exact price you pay.`
                    },
                    {
                        heading: 'Limit Orders',
                        content: `A **Limit Order** is an order to buy or sell a stock at a specific price or better.
                        
- **Buy Limit**: Buy at ₹100 or lower.
- **Sell Limit**: Sell at ₹100 or higher.
- **Control**: You control the price, but execution isn't guaranteed.`
                    },
                    {
                        heading: 'Stop Loss Orders',
                        content: `A **Stop Loss** order is designed to limit an investor's loss on a position.
                        
It becomes a market order once the "stop price" is reached.`
                    }
                ]
            },
            3: {
                title: 'Market Participants',
                sections: [
                    {
                        heading: 'Retail Investors',
                        content: `Individual investors like you and me who trade with their own personal capital.`
                    },
                    {
                        heading: 'FIIs (Foreign Institutional Investors)',
                        content: `Large international investors (funds, banks) investing in Indian markets. They often drive major market trends due to their volume.`
                    },
                    {
                        heading: 'DIIs (Domestic Institutional Investors)',
                        content: `Local institutions like Mutual Funds, Insurance Companies (LIC), and Pension Funds.`
                    }
                ]
            },
            4: {
                title: 'Indices and Sectors',
                sections: [
                    {
                        heading: 'What is an Index?',
                        content: `An **Index** measures the performance of a group of stocks.
                        
- **NIFTY 50**: Top 50 companies on NSE.
- **SENSEX**: Top 30 companies on BSE.
- **BANK NIFTY**: Top banking stocks.`
                    },
                    {
                        heading: 'Sectoral Indices',
                        content: `Indices that track specific sectors:
- Nifty IT (TCS, Infosys)
- Nifty Auto (Tata Motors, M&M)
- Nifty Pharma (Sun Pharma, Cipla)`
                    }
                ]
            },
            5: {
                title: 'IPO Process',
                sections: [
                    {
                        heading: 'Initial Public Offering',
                        content: `An **IPO** is when a private company offers shares to the public in a new stock issuance for the first time.`
                    },
                    {
                        heading: 'Listing',
                        content: `After the IPO process (bidding and allotment), the shares are listed on the stock exchange and secondary trading begins.`
                    }
                ]
            }
        }
    },
    2: {
        title: 'Risk Management',
        lessons: [
            { id: 1, title: 'Stop Loss Basics', completed: true },
            { id: 2, title: 'Position Sizing', completed: false },
            { id: 3, title: 'Risk-Reward Ratio', completed: false },
            { id: 4, title: 'Portfolio Diversification', completed: false },
        ],
        contents: {
            1: {
                title: 'Stop Loss Basics',
                sections: [
                    {
                        heading: 'Why You Need a Stop Loss',
                        content: `A **Stop Loss** protects your capital from catastrophic losses. Never enter a trade without knowing your exit point.`
                    }
                ]
            },
            2: {
                title: 'Position Sizing',
                sections: [
                    {
                        heading: 'How Much to Buy?',
                        content: `**Position Sizing** determines how many shares you buy based on your risk tolerance.
                        
*Formula:*
Risk Amount / (Entry Price - Stop Loss Price) = Quantity`
                    }
                ]
            },
            3: {
                title: 'Risk-Reward Ratio',
                sections: [
                    {
                        heading: 'The Magic Ratio',
                        content: `Aim for a minimum **1:2** Risk-Reward Ratio.
                        
- Risk ₹1 to Make ₹2.
- This way, even if you are right only 50% of the time, you remain profitable.`
                    }
                ]
            },
            4: {
                title: 'Portfolio Diversification',
                sections: [
                    {
                        heading: 'Don\'t Put All Eggs in One Basket',
                        content: `Spread your capital across different sectors and asset classes to minimize risk.`
                    }
                ]
            }
        }
    },
    3: {
        title: 'Technical Analysis',
        lessons: [
            { id: 1, title: 'Introduction to Charts', completed: true },
            { id: 2, title: 'Candlestick Patterns', completed: true },
            { id: 3, title: 'Support and Resistance', completed: false },
            { id: 4, title: 'Trend Lines', completed: false },
            { id: 5, title: 'Moving Averages', completed: false },
        ],
        contents: {
            1: {
                title: 'Introduction to Charts',
                sections: [
                    {
                        heading: 'Line vs Candlestick',
                        content: `Charts are the heartbeat of technical analysis.
                        
- **Line Chart**: Connects closing prices. Good for overview.
- **Candlestick Chart**: Shows Open, High, Low, Close (OHLC). Essential for trading.`
                    }
                ]
            },
            2: {
                title: 'Candlestick Patterns',
                sections: [
                    {
                        heading: 'Bullish Engulfing',
                        content: `A large green candle completely engulfs the previous small red candle. Signs of reversal.`
                    },
                    {
                        heading: 'Doji',
                        content: `Open and Close are almost equal. Indicates indecision in the market.`
                    }
                ]
            },
            3: {
                title: 'Support and Resistance',
                sections: [
                    {
                        heading: 'What is Support?',
                        content: `**Support** is a price level where a stock tends to find buying interest. It acts as a "floor".`
                    },
                    {
                        heading: 'What is Resistance?',
                        content: `**Resistance** is a price level where selling interest emerges. It acts as a "ceiling".`
                    }
                ]
            },
            4: {
                title: 'Trend Lines',
                sections: [
                    {
                        heading: 'Drawing Trend Lines',
                        content: `Connect at least two Swing Lows for an **Uptrend**.
Connect at least two Swing Highs for a **Downtrend**.`
                    }
                ]
            },
            5: {
                title: 'Moving Averages',
                sections: [
                    {
                        heading: 'SMA vs EMA',
                        content: `**Simple Moving Average (SMA)**: Average of closing prices.
**Exponential Moving Average (EMA)**: Gives more weight to recent prices (Reacts faster).`
                    }
                ]
            }
        }
    },
    4: {
        title: 'Trading Psychology',
        lessons: [
            { id: 1, title: 'Emotional Control', completed: false },
            { id: 2, title: 'Discipline', completed: false },
            { id: 3, title: 'Handling Losses', completed: false },
            { id: 4, title: 'FOMO & Greed', completed: false },
        ],
        contents: {
            1: {
                title: 'Emotional Control',
                sections: [{ heading: 'Fear & Greed', content: 'The two big enemies of a trader.' }]
            },
            2: {
                title: 'Discipline',
                sections: [{ heading: 'Stick to the Plan', content: 'Plan the trade, trade the plan.' }]
            },
            3: {
                title: 'Handling Losses',
                sections: [{ heading: 'Acceptance', content: 'Losses are the cost of doing business.' }]
            },
            4: {
                title: 'FOMO & Greed',
                sections: [{ heading: 'Missing Out', content: 'There will always be another trade. Don\'t chase.' }]
            }
        }
    }
};

function LessonsContent() {
    const searchParams = useSearchParams();
    const courseId = Number(searchParams.get('course')) || 3;
    const [currentLessonId, setCurrentLessonId] = useState(1);
    const [currentSection, setCurrentSection] = useState(0);

    // Fallback if course doesn't exist
    const course = coursesData[courseId] || coursesData[3];

    // Get content for active lesson, fallback to first lesson if missing
    const activeContent = course.contents[currentLessonId] || course.contents[1];

    // Reset to first lesson when course changes
    useEffect(() => {
        setCurrentLessonId(1);
        setCurrentSection(0);
    }, [courseId]);

    // Reset section when lesson changes
    useEffect(() => {
        setCurrentSection(0);
    }, [currentLessonId]);

    return (
        <div className="h-screen flex overflow-hidden">
            {/* Left Side - Lesson Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {/* Breadcrumb */}
                <div className="mb-6 flex items-center gap-2 text-sm text-slate-400">
                    <button onClick={() => window.history.back()} className="hover:text-white transition-colors">
                        Learning Hub
                    </button>
                    <ChevronRight className="w-4 h-4" />
                    <span>{course.title}</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-emerald-400">{activeContent.title}</span>
                </div>

                {/* Lesson Navigation - Horizontal Scroll */}
                <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {course.lessons.map((lesson) => (
                        <button
                            key={lesson.id}
                            onClick={() => setCurrentLessonId(lesson.id)}
                            className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 transition-all ${currentLessonId === lesson.id
                                    ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-400'
                                    : lesson.completed
                                        ? 'border border-slate-700/50 bg-slate-800/50 text-slate-300'
                                        : 'border border-slate-700/30 bg-slate-800/30 text-slate-500'
                                }`}
                        >
                            {lesson.completed ? (
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <BookOpen className="w-4 h-4" />
                            )}
                            {lesson.title}
                        </button>
                    ))}
                </div>

                {/* Main Content Card */}
                <motion.div
                    key={`${courseId}-${currentLessonId}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-8"
                >
                    <h1 className="mb-8 text-3xl font-bold text-white">{activeContent.title}</h1>

                    {/* Section Navigation Tabs */}
                    <div className="mb-8 flex flex-wrap gap-2">
                        {activeContent.sections.map((section, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSection(index)}
                                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${currentSection === index
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                                    }`}
                            >
                                {index + 1}. {section.heading}
                            </button>
                        ))}
                    </div>

                    {/* Active Section Content */}
                    <motion.div
                        key={currentSection}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="prose prose-invert max-w-none"
                    >
                        <h2 className="mb-4 text-xl font-semibold text-white">
                            {activeContent.sections[currentSection].heading}
                        </h2>
                        <div className="whitespace-pre-wrap leading-relaxed text-slate-300">
                            {activeContent.sections[currentSection].content.split('\n').map((line, i) => {
                                if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
                                    return <strong key={i} className="text-white block mb-2">{line.replace(/\*\*/g, '')}</strong>;
                                }
                                if (line.startsWith('### ')) {
                                    return <h3 key={i} className="mb-3 mt-6 text-lg font-semibold text-white">{line.slice(4)}</h3>;
                                }
                                if (line.trim().startsWith('- ')) {
                                    return <li key={i} className="ml-4 text-slate-300 mb-1">{line.trim().slice(2)}</li>;
                                }
                                if (line.trim().startsWith('*') && line.trim().endsWith('*')) {
                                    return <em key={i} className="mt-4 block text-emerald-400">{line.replace(/\*/g, '')}</em>;
                                }
                                return <p key={i} className="mb-2">{line}</p>;
                            })}
                        </div>
                    </motion.div>

                    {/* Navigation Buttons (Prev/Next Section) */}
                    <div className="mt-8 flex justify-between border-t border-slate-700/50 pt-6">
                        <button
                            onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                            disabled={currentSection === 0}
                            className="rounded-xl bg-slate-800/50 px-6 py-3 text-slate-300 transition-all hover:bg-slate-700/50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Previous Section
                        </button>
                        <button
                            onClick={() => setCurrentSection(Math.min(activeContent.sections.length - 1, currentSection + 1))}
                            disabled={currentSection === activeContent.sections.length - 1}
                            className="rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 text-white transition-all hover:opacity-90 disabled:opacity-50"
                        >
                            {currentSection === activeContent.sections.length - 1 ? 'Complete Lesson' : 'Next Section'}
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Right Side - AI Chat */}
            <div className="w-96 border-l border-slate-700/50 p-4 hidden xl:block">
                <AIChat />
            </div>
        </div>
    );
}

export default function LessonsPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center text-emerald-400">Loading lesson content...</div>}>
            <LessonsContent />
        </Suspense>
    );
}
