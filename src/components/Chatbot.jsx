import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import avatarImage from '../images/chatbotavatar.png';

const SYSTEM_PROMPT = `You are TAPasok AI, a helpful assistant for the TAPasok Student Organization Management System. 
You help students, officers, and admins with questions about:
- Attendance tracking and check-ins
- Event management and schedules  
- Organization membership and clearance
- Announcements and messages
- Student obligations and documents
- Evaluations and finance

Keep responses concise, friendly, and helpful. Use markdown formatting when listing items or explaining steps.
If asked about something unrelated to student organization management, politely redirect the conversation.`;



const WELCOME_MSG = {
    text: "👋 Hi there! I'm **TAPasok AI**, your student org assistant. How can I help you today?",
    isBot: true,
    time: new Date(),
};

const AVATAR_URL = avatarImage;

// Initialize once at module level with dangerouslyAllowBrowser
const ai = new GoogleGenAI({
    apiKey: import.meta.env.VITE_GEMINI_API_KEY,
    dangerouslyAllowBrowser: true,
});

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([WELCOME_MSG]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    const scrollRef = useRef(null);
    const inputRef = useRef(null);
    const chatRef = useRef(null);

    useEffect(() => {
        const checkAuth = () => setIsLoggedIn(!!localStorage.getItem('token'));
        window.addEventListener('storage', checkAuth);
        const interval = setInterval(checkAuth, 1000);
        return () => {
            window.removeEventListener('storage', checkAuth);
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        if (!isLoggedIn) {
            setIsOpen(false);
            setMessages([WELCOME_MSG]);
            chatRef.current = null;
        }
    }, [isLoggedIn]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const handleSend = useCallback(async () => {
        const trimmed = input.trim();
        if (!trimmed || loading) return;

        if (!import.meta.env.VITE_GEMINI_API_KEY) {
            setMessages((prev) => [...prev, {
                text: "⚠️ **Developer Note:** Gemini API Key is missing. Please ensure `VITE_GEMINI_API_KEY` is set in your `.env` file and restart your dev server.",
                isBot: true,
                time: new Date(),
            }]);
            return;
        }

        const userMsg = { text: trimmed, isBot: false, time: new Date() };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            if (!chatRef.current) {
                chatRef.current = ai.chats.create({
                    model: 'gemini-2.5-flash',
                    config: {
                        systemInstruction: SYSTEM_PROMPT,
                    },
                });
            }

            const response = await chatRef.current.sendMessage({
                message: trimmed,
            });

            const botReply = response.text || 'Sorry, I could not generate a response.';
            setMessages((prev) => [...prev, { text: botReply, isBot: true, time: new Date() }]);
        } catch (error) {
            console.error('Gemini API Error Detail:', error);

            let errMsg = "Sorry, I'm having trouble connecting right now. Please try again.";
            const errorStr = error?.message?.toLowerCase() || '';

            if (errorStr.includes('quota')) {
                errMsg = "I've hit my usage limit. Please try again in a minute! 🙏";
            } else if (errorStr.includes('not found')) {
                errMsg = 'The AI model is temporarily unavailable. Please try again later.';
            } else if (errorStr.includes('api key') || errorStr.includes('unauthorized') || errorStr.includes('authenticated')) {
                errMsg = "Invalid API Key. Please check your `.env` file and restart the dev server.";
            } else if (errorStr.includes('fetch') || errorStr.includes('network')) {
                errMsg = "Network error. Please check your internet connection.";
            }

            setMessages((prev) => [...prev, { text: errMsg, isBot: true, time: new Date() }]);
        } finally {
            setLoading(false);
        }
    }, [input, loading]);

    if (!isLoggedIn) return null;

    const formatTime = (date) =>
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <>
            <style>{`
            .chatbot-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9999;
                font-family: 'Inter', 'Segoe UI', sans-serif;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 16px;
            }
            .chatbot-window {
                width: 380px;
                height: 520px;
                border-radius: 20px;
            }
            @media (max-width: 640px) {
                .chatbot-container { bottom: 16px; right: 16px; }
                .chatbot-window {
                    width: calc(100vw - 32px) !important;
                    height: 70vh !important;
                    max-height: 480px;
                    border-radius: 20px !important;
                }
                .chatbot-fab { border-radius: 16px !important; }
            }
            @media (min-width: 641px) and (max-width: 768px) {
                .chatbot-window { width: 340px; height: 480px; }
            }
        `}</style>
            <div className={`chatbot-container ${isOpen ? '' : 'chatbot-closed'}`}>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.9 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            className="chatbot-window"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                boxShadow: '0 25px 60px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.95)',
                                backdropFilter: 'blur(20px)',
                            }}
                        >
                            {/* Header */}
                            <div style={{ background: 'linear-gradient(135deg, #0f2d5e 0%, #1a4a8a 50%, #2563eb 100%)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                                <div style={{ position: 'absolute', bottom: '-15px', left: '30%', width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
                                    <img src={AVATAR_URL} alt="TAPasok AI" style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.25)' }} />
                                    <div>
                                        <h3 style={{ color: 'white', fontWeight: 700, fontSize: '15px', margin: 0, lineHeight: 1.2 }}>TAPasok AI</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
                                            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px' }}>Online</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', position: 'relative', zIndex: 1 }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                                >
                                    <X size={18} color="white" />
                                </button>
                            </div>

                            {/* Messages */}
                            <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                                <AnimatePresence initial={false}>
                                    {messages.map((msg, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.25, delay: 0.05 }}
                                            style={{ display: 'flex', justifyContent: msg.isBot ? 'flex-start' : 'flex-end', alignItems: 'flex-end', gap: '8px' }}
                                        >
                                            {msg.isBot && (
                                                <img src={AVATAR_URL} alt="AI" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1.5px solid #e2e8f0' }} />
                                            )}
                                            <div style={{ maxWidth: '78%' }}>
                                                <div
                                                    style={{
                                                        padding: '10px 14px',
                                                        borderRadius: msg.isBot ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                                                        background: msg.isBot ? 'white' : 'linear-gradient(135deg, #0f2d5e, #1a4a8a)',
                                                        color: msg.isBot ? '#1e293b' : 'white',
                                                        fontSize: '13.5px',
                                                        lineHeight: '1.55',
                                                        boxShadow: msg.isBot ? '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' : '0 2px 8px rgba(15,45,94,0.3)',
                                                        wordBreak: 'break-word',
                                                    }}
                                                    className={msg.isBot ? 'chatbot-markdown' : ''}
                                                >
                                                    {msg.isBot ? (
                                                        <ReactMarkdown
                                                            components={{
                                                                p: ({ children }) => <p style={{ margin: '0 0 6px 0' }}>{children}</p>,
                                                                ul: ({ children }) => <ul style={{ margin: '4px 0', paddingLeft: '18px' }}>{children}</ul>,
                                                                ol: ({ children }) => <ol style={{ margin: '4px 0', paddingLeft: '18px' }}>{children}</ol>,
                                                                li: ({ children }) => <li style={{ marginBottom: '2px' }}>{children}</li>,
                                                                strong: ({ children }) => <strong style={{ fontWeight: 600, color: '#0f2d5e' }}>{children}</strong>,
                                                                code: ({ inline, children }) =>
                                                                    inline ? (
                                                                        <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px', fontSize: '12px', fontFamily: "'Fira Code', monospace", color: '#e11d48' }}>{children}</code>
                                                                    ) : (
                                                                        <pre style={{ background: '#1e293b', color: '#e2e8f0', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', overflowX: 'auto', margin: '6px 0', fontFamily: "'Fira Code', monospace" }}>
                                                                            <code>{children}</code>
                                                                        </pre>
                                                                    ),
                                                                a: ({ href, children }) => (
                                                                    <a href={href} target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>{children}</a>
                                                                ),
                                                            }}
                                                        >
                                                            {msg.text}
                                                        </ReactMarkdown>
                                                    ) : (
                                                        msg.text
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', textAlign: msg.isBot ? 'left' : 'right', paddingLeft: msg.isBot ? '4px' : '0', paddingRight: msg.isBot ? '0' : '4px' }}>
                                                    {formatTime(msg.time)}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {/* Typing indicator */}
                                {loading && (
                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                                        <img src={AVATAR_URL} alt="AI" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1.5px solid #e2e8f0' }} />
                                        <div style={{ background: 'white', padding: '12px 16px', borderRadius: '16px 16px 16px 4px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                                            {[0, 1, 2].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    animate={{ y: [0, -5, 0] }}
                                                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                                    style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8' }}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Input */}
                            <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', background: 'white', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                    placeholder="Type your message..."
                                    disabled={loading}
                                    style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '10px 14px', fontSize: '13.5px', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', background: loading ? '#f8fafc' : 'white', color: '#1e293b' }}
                                    onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                                    onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                                />
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSend}
                                    disabled={loading || !input.trim()}
                                    style={{
                                        width: '40px', height: '40px', borderRadius: '12px', border: 'none',
                                        background: loading || !input.trim() ? '#e2e8f0' : 'linear-gradient(135deg, #0f2d5e, #2563eb)',
                                        color: loading || !input.trim() ? '#94a3b8' : 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                                        transition: 'background 0.2s', flexShrink: 0,
                                    }}
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} />}
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Floating Action Button */}
                <motion.button
                    onClick={() => setIsOpen(!isOpen)}
                    className="chatbot-fab"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    style={{ width: '56px', height: '56px', borderRadius: '16px', border: 'none', background: 'linear-gradient(135deg, #0f2d5e, #2563eb)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 24px rgba(15,45,94,0.4)', position: 'relative', marginLeft: 'auto', overflow: 'hidden' }}
                >
                    <motion.div
                        animate={{ boxShadow: ['0 0 0 0px rgba(37,99,235,0.3)', '0 0 0 12px rgba(37,99,235,0)'] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        style={{ position: 'absolute', inset: 0, borderRadius: '16px' }}
                    />
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                                <X size={24} />
                            </motion.div>
                        ) : (
                            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                                <MessageCircle size={24} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>
        </>
    );
}