import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Loader2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import avatarImage from '../images/chatbotavatar.png';

const FUNNY_WELCOMES = [
    "Oy, Bai! 👋 **TAPasok AI Chatbot** ni! Unsay imo kinahanglan? Naa ko diri para sa imo — mas reliable pa ko sa imong groupmates nga dili mo-reply! 😄",
    "Sus, naa na ka! 😄 Ako si **TAPasok AI Chatbot**, ang pinaka-helpful nga assistant sa TAPasok. Unsay problema nimo karon, bai?",
    "Oy! 👋 **TAPasok AI Chatbot** nag-report for duty! Mas naabot pa ko sa imong deadline. Unsay ikong mahimo para sa imo?",
    "Hoy Bai! 🎉 Maayong pag-abot sa **TAPasok AI Chatbot**! Pangutana lang, wala ko mokuot — unless clearance na na to. 😅 Unsay imo needs?",
];

const WELCOME_MSG = {
    text: FUNNY_WELCOMES[Math.floor(Math.random() * FUNNY_WELCOMES.length)],
    isBot: true,
    time: new Date(),
};

const AVATAR_URL = avatarImage;

const FUNNY_LOADING_MSGS = [
    "Gipangita nako ang tubag, dali lang bai... 🤔",
    "Sus, maghuna-huna ko anig dyutay...",
    "Nag-consult sa akong clearance crystal ball... 🔮",
    "Ambot, gikwik-kwik ko ang akong utak...",
    "Sandali lang bai, naa koy gibuhat... ☕",
    "Akong gi-check ang org spirits... 👻",
    "Hala, lisod man ni nga pangutana... moment lang!",
];

const BUBBLE_CATEGORIES = [
    {
        category: '📋 Attendance',
        color: '#818cf8',
        bg: 'rgba(99,102,241,0.14)',
        border: 'rgba(99,102,241,0.35)',
        items: [
            { label: 'Check my attendance', value: 'How do I check my attendance record?' },
            { label: 'Mark as present', value: 'How do I mark myself as present for an event?' },
            { label: 'File an excuse', value: 'How do I file an excuse for my absence?' },
            { label: 'Attendance summary', value: 'Can you give me a summary of my attendance?' },
            { label: 'Late check-in policy', value: 'What happens if I check in late to an event?' },
        ],
    },
    {
        category: '📅 Events',
        color: '#fbbf24',
        bg: 'rgba(245,158,11,0.14)',
        border: 'rgba(245,158,11,0.35)',
        items: [
            { label: 'Upcoming events', value: 'What are the upcoming org events?' },
            { label: 'Event schedule', value: 'Can you show me the full event schedule?' },
            { label: 'Register for event', value: 'How do I register for an event?' },
            { label: 'Cancel registration', value: 'How do I cancel my event registration?' },
            { label: 'Missed an event', value: 'What happens if I miss an event?' },
            { label: 'View event details', value: 'How do I view full event details?' },
        ],
    },
    {
        category: '✅ Clearance',
        color: '#34d399',
        bg: 'rgba(16,185,129,0.14)',
        border: 'rgba(16,185,129,0.35)',
        items: [
            { label: 'My clearance status', value: 'How do I check my clearance status?' },
            { label: 'Get clearance', value: 'How do I get my org clearance?' },
            { label: 'Requirements', value: 'What are the requirements for clearance?' },
            { label: 'Clearance deadline', value: 'When is the clearance deadline?' },
            { label: 'Appeal clearance', value: 'How do I appeal a clearance decision?' },
        ],
    },
    {
        category: '💰 Finance',
        color: '#f472b6',
        bg: 'rgba(236,72,153,0.14)',
        border: 'rgba(236,72,153,0.35)',
        items: [
            { label: 'My balance', value: 'What is my current finance balance?' },
            { label: 'Pay dues', value: 'How do I pay my org dues?' },
            { label: 'Payment history', value: 'How do I view my payment history?' },
            { label: 'Overdue payments', value: 'What are my overdue payments?' },
            { label: 'Finance deadlines', value: 'What are the finance payment deadlines?' },
        ],
    },
    {
        category: '📢 Announcements',
        color: '#60a5fa',
        bg: 'rgba(59,130,246,0.14)',
        border: 'rgba(59,130,246,0.35)',
        items: [
            { label: 'Latest announcements', value: 'Are there any new announcements?' },
            { label: 'Important notices', value: 'What are the most important notices right now?' },
            { label: 'Org updates', value: 'What are the latest org updates?' },
            { label: 'Message officers', value: 'How do I send a message to the officers?' },
        ],
    },
    {
        category: '📝 Obligations',
        color: '#fb923c',
        bg: 'rgba(249,115,22,0.14)',
        border: 'rgba(249,115,22,0.35)',
        items: [
            { label: 'My obligations', value: 'What are my current pending obligations?' },
            { label: 'Submit requirement', value: 'How do I submit a requirement?' },
            { label: 'Obligation deadline', value: 'When are my obligation deadlines?' },
            { label: 'Missing documents', value: 'What documents am I missing?' },
            { label: 'Extension request', value: 'How do I request a deadline extension?' },
        ],
    },
    {
        category: '👥 Membership',
        color: '#c084fc',
        bg: 'rgba(139,92,246,0.14)',
        border: 'rgba(139,92,246,0.35)',
        items: [
            { label: 'My member profile', value: 'How do I view my member profile?' },
            { label: 'Update my info', value: 'How do I update my member information?' },
            { label: 'Member status', value: 'What is my current membership status?' },
            { label: 'Register new member', value: 'How do new members get registered?' },
            { label: 'Officer contacts', value: 'How do I find officer contact details?' },
        ],
    },
    {
        category: '📊 Evaluations',
        color: '#2dd4bf',
        bg: 'rgba(20,184,166,0.14)',
        border: 'rgba(20,184,166,0.35)',
        items: [
            { label: 'View evaluations', value: 'How do I view my evaluations?' },
            { label: 'Submit evaluation', value: 'How do I submit an evaluation form?' },
            { label: 'Evaluation results', value: 'How do I check evaluation results?' },
            { label: 'Evaluation schedule', value: 'When are the evaluations scheduled?' },
        ],
    },
    {
        category: '🤖 About',
        color: '#94a3b8',
        bg: 'rgba(100,116,139,0.14)',
        border: 'rgba(100,116,139,0.35)',
        items: [
            { label: 'Who made you?', value: 'Who made you?' },
            { label: 'What can you do?', value: 'What can you help me with?' },
            { label: 'How to use TAPasok', value: 'How do I use the TAPasok system?' },
        ],
    },
];

function BotIcon() {
    return (
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="10" width="22" height="15" rx="6" fill="white" fillOpacity="0.95" />
            <circle cx="10.5" cy="17.5" r="2.8" fill="#3b82f6" />
            <circle cx="19.5" cy="17.5" r="2.8" fill="#3b82f6" />
            <rect x="12" y="22" width="6" height="1.5" rx="0.75" fill="#3b82f6" fillOpacity="0.45" />
            <rect x="14" y="4" width="2.2" height="6" rx="1.1" fill="white" fillOpacity="0.88" />
            <circle cx="15" cy="3.5" r="1.8" fill="white" fillOpacity="0.88" />
            <rect x="1.5" y="14" width="2.5" height="6" rx="1.25" fill="white" fillOpacity="0.65" />
            <rect x="26" y="14" width="2.5" height="6" rx="1.25" fill="white" fillOpacity="0.65" />
            <circle cx="10.5" cy="17.5" r="1.1" fill="white" />
            <circle cx="19.5" cy="17.5" r="1.1" fill="white" />
        </svg>
    );
}

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([WELCOME_MSG]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('');
    const [activeCategory, setActiveCategory] = useState(0);
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
            setMessages([{ ...WELCOME_MSG, time: new Date() }]);
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

        const userMsg = { text: trimmed, isBot: false, time: new Date() };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setLoading(true);
        setLoadingMsg(FUNNY_LOADING_MSGS[Math.floor(Math.random() * FUNNY_LOADING_MSGS.length)]);

        try {
            const token = localStorage.getItem('token');
            const historyPayload = messages.filter(m => m !== WELCOME_MSG).map(m => ({
                role: m.isBot ? 'model' : 'user',
                parts: [{ text: m.text }]
            }));

            const req = await fetch('http://127.0.0.1:8000/api/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: trimmed,
                    history: historyPayload
                })
            });

            if (!req.ok) {
                throw new Error('API Error ' + req.status);
            }

            const data = await req.json();
            const botReply = data.reply || "Sus, wa koy tubag. Try again bai! 🙈";
            setMessages((prev) => [...prev, { text: botReply, isBot: true, time: new Date() }]);
        } catch (error) {
            console.error('Gemini API Error:', error);
            let errMsg = "Ay nako, naputol ang connection nako! Try again bai, dali lang 😵";
            const errorStr = error?.message?.toLowerCase() || '';
            if (errorStr.includes('quota')) {
                errMsg = "Sus! Naubus na akong brain cells (quota na 😅). Hatagi ko og usa ka minuto, bai — balik ko, promise!";
            } else if (errorStr.includes('not found')) {
                errMsg = "Grabe, nag-absent ang AI model karon! Sama ra sa uban org members 😂 Try again later, bai!";
            } else if (errorStr.includes('api key') || errorStr.includes('unauthorized') || errorStr.includes('authenticated')) {
                errMsg = "Invalid API Key bai! Check imong `.env` file! 😬";
            } else if (errorStr.includes('fetch') || errorStr.includes('network')) {
                errMsg = "Network error! Gi-ghost ta sa internet! 👻 Check imong connection, bai.";
            }
            setMessages((prev) => [...prev, { text: errMsg, isBot: true, time: new Date() }]);
        } finally {
            setLoading(false);
            setLoadingMsg('');
        }
    }, [input, loading]);

    if (!isLoggedIn) return null;

    const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const activeCat = BUBBLE_CATEGORIES[activeCategory];

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
                .tapasok-root {
                    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
                    font-family: 'Plus Jakarta Sans', 'Segoe UI', sans-serif;
                    display: flex; flex-direction: column; align-items: flex-end; gap: 14px;
                }
                .tapasok-window {
                    width: 400px; height: 590px; border-radius: 24px;
                    display: flex; flex-direction: column; overflow: hidden;
                    background: #0d1117;
                    box-shadow: 0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.07);
                }
                .tapasok-msgs { overflow-y: auto; }
                .tapasok-msgs::-webkit-scrollbar { width: 4px; }
                .tapasok-msgs::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 99px; }
                .cat-scroll { overflow-x: auto; }
                .cat-scroll::-webkit-scrollbar { display: none; }
                .tapasok-input::placeholder { color: rgba(255,255,255,0.25); }
                .tapasok-input:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important; }
                .tapasok-fab {
                    width: 64px; height: 64px; border-radius: 20px; border: none;
                    background: linear-gradient(140deg, #1d3fa8 0%, #2563eb 55%, #6366f1 100%);
                    color: white; display: flex; align-items: center; justify-content: center;
                    cursor: pointer; position: relative; overflow: visible;
                    box-shadow: 0 8px 32px rgba(37,99,235,0.55), 0 0 0 1px rgba(255,255,255,0.08);
                }
                .tapasok-fab::after {
                    content: ''; position: absolute; inset: 0; border-radius: 20px;
                    background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 55%);
                    pointer-events: none;
                }
                .pulse {
                    position: absolute; inset: -5px; border-radius: 25px;
                    border: 2px solid rgba(99,102,241,0.5);
                    animation: tapPulse 2.4s ease-out infinite;
                    pointer-events: none;
                }
                .pulse2 {
                    position: absolute; inset: -10px; border-radius: 30px;
                    border: 1.5px solid rgba(99,102,241,0.25);
                    animation: tapPulse 2.4s ease-out 0.6s infinite;
                    pointer-events: none;
                }
                @keyframes tapPulse {
                    0% { transform: scale(1); opacity: 0.8; }
                    100% { transform: scale(1.25); opacity: 0; }
                }
                .cat-tab { transition: all 0.15s ease; }
                .cat-tab:hover { opacity: 1 !important; }
                .bubble-chip { transition: all 0.15s ease; }
                .bubble-chip:hover { transform: translateY(-1px); filter: brightness(1.1); }
                @media (max-width: 640px) {
                    .tapasok-root { bottom: 16px; right: 16px; }
                    .tapasok-window { width: calc(100vw - 32px) !important; height: 74vh !important; max-height: 580px; border-radius: 20px !important; }
                    .tapasok-fab { width: 56px; height: 56px; border-radius: 16px; }
                }
            `}</style>

            <div className="tapasok-root">
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 28, scale: 0.91 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 28, scale: 0.91 }}
                            transition={{ type: 'spring', damping: 26, stiffness: 370 }}
                            className="tapasok-window"
                        >
                            {/* ── HEADER ── */}
                            <div style={{
                                background: 'linear-gradient(135deg, #0c1836 0%, #112060 50%, #1a3080 100%)',
                                padding: '14px 18px',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                position: 'relative', overflow: 'hidden', flexShrink: 0,
                            }}>
                                <div style={{ position: 'absolute', top: '-25px', right: '-15px', width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(99,102,241,0.25)', filter: 'blur(22px)', pointerEvents: 'none' }} />
                                <div style={{ position: 'absolute', bottom: '-18px', left: '25%', width: '55px', height: '55px', borderRadius: '50%', background: 'rgba(59,130,246,0.2)', filter: 'blur(14px)', pointerEvents: 'none' }} />

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
                                    <div style={{ position: 'relative' }}>
                                        <img src={AVATAR_URL} alt="TAPasok AI Chatbot" style={{ width: '42px', height: '42px', borderRadius: '13px', objectFit: 'cover', border: '2px solid rgba(99,102,241,0.55)', display: 'block' }} />
                                        <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '11px', height: '11px', borderRadius: '50%', background: '#4ade80', border: '2.5px solid #0c1836', boxShadow: '0 0 8px rgba(74,222,128,0.7)' }} />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                            <span style={{ color: 'white', fontWeight: 700, fontSize: '14.5px', letterSpacing: '-0.2px' }}>TAPasok AI Chatbot</span>
                                            <span style={{ background: 'rgba(99,102,241,0.28)', border: '1px solid rgba(130,120,255,0.4)', borderRadius: '6px', padding: '1px 6px', fontSize: '9px', color: '#a5b4fc', fontWeight: 700, letterSpacing: '0.6px' }}>AI</span>
                                        </div>
                                        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px', display: 'block', marginTop: '2px' }}>Naa ko diri, bai! 👋 Always ready</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsOpen(false)}
                                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', zIndex: 1 }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                                >
                                    <X size={16} color="rgba(255,255,255,0.75)" />
                                </button>
                            </div>

                            {/* ── MESSAGES ── */}
                            <div
                                ref={scrollRef}
                                className="tapasok-msgs"
                                style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', background: '#0d1117' }}
                            >
                                <AnimatePresence initial={false}>
                                    {messages.map((msg, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2 }}
                                            style={{ display: 'flex', justifyContent: msg.isBot ? 'flex-start' : 'flex-end', alignItems: 'flex-end', gap: '8px' }}
                                        >
                                            {msg.isBot && (
                                                <img src={AVATAR_URL} alt="AI" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1.5px solid rgba(99,102,241,0.4)' }} />
                                            )}
                                            <div style={{ maxWidth: '80%' }}>
                                                <div style={{
                                                    padding: '10px 14px',
                                                    borderRadius: msg.isBot ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                                                    background: msg.isBot
                                                        ? 'linear-gradient(135deg, #161d30, #1c2440)'
                                                        : 'linear-gradient(135deg, #2353c5, #5b5fe0)',
                                                    color: 'white',
                                                    fontSize: '13px',
                                                    lineHeight: '1.65',
                                                    border: msg.isBot ? '1px solid rgba(255,255,255,0.07)' : 'none',
                                                    boxShadow: msg.isBot ? '0 2px 14px rgba(0,0,0,0.35)' : '0 4px 18px rgba(91,95,224,0.38)',
                                                    wordBreak: 'break-word',
                                                }}>
                                                    {msg.isBot ? (
                                                        <ReactMarkdown
                                                            components={{
                                                                p: ({ children }) => <p style={{ margin: '0 0 6px 0', color: 'rgba(255,255,255,0.88)' }}>{children}</p>,
                                                                ul: ({ children }) => <ul style={{ margin: '4px 0', paddingLeft: '18px' }}>{children}</ul>,
                                                                ol: ({ children }) => <ol style={{ margin: '4px 0', paddingLeft: '18px' }}>{children}</ol>,
                                                                li: ({ children }) => <li style={{ marginBottom: '3px', color: 'rgba(255,255,255,0.82)' }}>{children}</li>,
                                                                strong: ({ children }) => <strong style={{ fontWeight: 700, color: '#a5b4fc' }}>{children}</strong>,
                                                                code: ({ inline, children }) => inline ? (
                                                                    <code style={{ background: 'rgba(99,102,241,0.22)', padding: '1px 6px', borderRadius: '4px', fontSize: '12px', color: '#c4b5fd' }}>{children}</code>
                                                                ) : (
                                                                    <pre style={{ background: '#080c18', color: '#e2e8f0', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', overflowX: 'auto', margin: '6px 0' }}>
                                                                        <code>{children}</code>
                                                                    </pre>
                                                                ),
                                                                a: ({ href, children }) => (
                                                                    <a href={href} target="_blank" rel="noreferrer" style={{ color: '#818cf8', textDecoration: 'underline' }}>{children}</a>
                                                                ),
                                                            }}
                                                        >
                                                            {msg.text}
                                                        </ReactMarkdown>
                                                    ) : (
                                                        <span>{msg.text}</span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.22)', marginTop: '4px', textAlign: msg.isBot ? 'left' : 'right', paddingLeft: msg.isBot ? '4px' : '0', paddingRight: msg.isBot ? '0' : '4px' }}>
                                                    {formatTime(msg.time)}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {loading && (
                                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                                        <img src={AVATAR_URL} alt="AI" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1.5px solid rgba(99,102,241,0.4)' }} />
                                        <div style={{ background: 'linear-gradient(135deg, #161d30, #1c2440)', border: '1px solid rgba(255,255,255,0.07)', padding: '12px 16px', borderRadius: '18px 18px 18px 4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                                {[0, 1, 2].map((i) => (
                                                    <motion.div
                                                        key={i}
                                                        animate={{ y: [0, -5, 0], opacity: [0.3, 1, 0.3] }}
                                                        transition={{ duration: 0.72, repeat: Infinity, delay: i * 0.2 }}
                                                        style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }}
                                                    />
                                                ))}
                                            </div>
                                            {loadingMsg && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>{loadingMsg}</span>}
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* ── FILTER BUBBLES ── */}
                            <div style={{ background: '#111827', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                                {/* Category tabs */}
                                <div className="cat-scroll" style={{ display: 'flex', gap: '5px', padding: '10px 14px 6px' }}>
                                    {BUBBLE_CATEGORIES.map((cat, i) => (
                                        <button
                                            key={i}
                                            className="cat-tab"
                                            onClick={() => setActiveCategory(i)}
                                            style={{
                                                background: activeCategory === i ? cat.bg : 'rgba(255,255,255,0.04)',
                                                border: `1.5px solid ${activeCategory === i ? cat.border : 'rgba(255,255,255,0.07)'}`,
                                                borderRadius: '10px',
                                                padding: '4px 10px',
                                                fontSize: '10.5px',
                                                fontWeight: activeCategory === i ? 600 : 400,
                                                color: activeCategory === i ? cat.color : 'rgba(255,255,255,0.38)',
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap',
                                                fontFamily: 'inherit',
                                                flexShrink: 0,
                                                opacity: activeCategory === i ? 1 : 0.8,
                                            }}
                                        >
                                            {cat.category}
                                        </button>
                                    ))}
                                </div>

                                {/* Bubble chips */}
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeCategory}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.15 }}
                                        className="cat-scroll"
                                        style={{ display: 'flex', gap: '6px', padding: '4px 14px 11px' }}
                                    >
                                        {activeCat.items.map(({ label, value }) => (
                                            <button
                                                key={label}
                                                className="bubble-chip"
                                                onClick={() => { setInput(value); inputRef.current?.focus(); }}
                                                disabled={loading}
                                                style={{
                                                    background: activeCat.bg,
                                                    border: `1.5px solid ${activeCat.border}`,
                                                    borderRadius: '20px',
                                                    padding: '5px 12px',
                                                    fontSize: '11.5px',
                                                    fontWeight: 500,
                                                    color: activeCat.color,
                                                    cursor: loading ? 'not-allowed' : 'pointer',
                                                    whiteSpace: 'nowrap',
                                                    opacity: loading ? 0.45 : 1,
                                                    fontFamily: 'inherit',
                                                    flexShrink: 0,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '3px',
                                                }}
                                            >
                                                {label}
                                                <ChevronRight size={11} style={{ opacity: 0.55, flexShrink: 0 }} />
                                            </button>
                                        ))}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* ── INPUT ROW ── */}
                            <div style={{ padding: '8px 14px 14px', background: '#111827', display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                                <input
                                    ref={inputRef}
                                    className="tapasok-input"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                    placeholder="Pangutana lang bai, naa ko diri... 😏"
                                    disabled={loading}
                                    style={{
                                        flex: 1,
                                        border: '1.5px solid rgba(255,255,255,0.09)',
                                        borderRadius: '14px',
                                        padding: '10px 14px',
                                        fontSize: '13px',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        transition: 'all 0.2s',
                                        fontFamily: 'inherit',
                                    }}
                                />
                                <motion.button
                                    whileHover={{ scale: 1.06 }}
                                    whileTap={{ scale: 0.93 }}
                                    onClick={handleSend}
                                    disabled={loading || !input.trim()}
                                    style={{
                                        width: '42px', height: '42px', borderRadius: '13px', border: 'none',
                                        background: loading || !input.trim()
                                            ? 'rgba(255,255,255,0.06)'
                                            : 'linear-gradient(135deg, #2563eb, #6366f1)',
                                        color: loading || !input.trim() ? 'rgba(255,255,255,0.2)' : 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                                        flexShrink: 0,
                                        boxShadow: loading || !input.trim() ? 'none' : '0 4px 18px rgba(99,102,241,0.45)',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {loading
                                        ? <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />
                                        : <Send size={16} />
                                    }
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── FAB ── */}
                <motion.button
                    onClick={() => setIsOpen(!isOpen)}
                    className="tapasok-fab"
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.92 }}
                >
                    {!isOpen && <>
                        <div className="pulse" />
                        <div className="pulse2" />
                    </>}
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.div key="close"
                                initial={{ rotate: -80, opacity: 0, scale: 0.6 }}
                                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                                exit={{ rotate: 80, opacity: 0, scale: 0.6 }}
                                transition={{ duration: 0.2 }}
                                style={{ position: 'relative', zIndex: 1 }}
                            >
                                <X size={24} color="white" />
                            </motion.div>
                        ) : (
                            <motion.div key="bot"
                                initial={{ rotate: 15, opacity: 0, scale: 0.7 }}
                                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                                exit={{ rotate: -15, opacity: 0, scale: 0.7 }}
                                transition={{ duration: 0.2 }}
                                style={{ position: 'relative', zIndex: 1 }}
                            >
                                <BotIcon />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>
        </>
    );
}