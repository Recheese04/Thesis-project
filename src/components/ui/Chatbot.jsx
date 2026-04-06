import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_INSTRUCTION = `
You are Rechie James A. Postanes.
When someone talks to you, answer exactly as if you are Rechie himself.
`;

const INITIAL_MESSAGE = {
    id: "1",
    role: "ai",
    content: "Hi there! I'm Rechie. Feel free to ask me anything about TAPasok or my projects!",
};

// ── OFFLINE SMART FALLBACK (Saves the defense if API fails) ── //
const generateMockResponse = (input) => {
    const txt = input.toLowerCase();
    
    if (txt.includes("hello") || txt.includes("hi") || txt.includes("hoy")) {
        return "Hello! How can I help you with TAPasok today?";
    }
    if (txt.includes("tapasok") || txt.includes("system") || txt.includes("about")) {
        return "TAPasok is my thesis project! It's a Centralized Student Management System built for BISU Candijay, featuring RFID and QR Code attendance tracking, event integration, and consequence systems.";
    }
    if (txt.includes("tech") || txt.includes("stack") || txt.includes("framework") || txt.includes("build")) {
        return "I built this entire system solo! I handles both frontend and backend using React.js, Tailwind CSS, Laravel, and MySQL.";
    }
    if (txt.includes("name") || txt.includes("who are you") || txt.includes("developer")) {
        return "I'm Rechie James A. Postanes, a 3rd year BSCS student at BISU Candijay! I built this system and I'm currently looking for internship opportunities.";
    }
    if (txt.includes("attendance") || txt.includes("qr") || txt.includes("rfid")) {
        return "The system uses RFID and QR scanning to ensure seamless and instantly synced attendance tracking for all student org events!";
    }
    if (txt.includes("consequence") || txt.includes("penalty") || txt.includes("fines")) {
        return "In TAPasok, officers can set exact rule configurations and consequence fines for absent students automatically through the automated evaluations module.";
    }

    return "That's an interesting question! Just to keep it brief for the defense, this AI assistant is built to help navigate TAPasok's modules! You can ask me about the tech stack, attendance, or the system itself.";
};

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([INITIAL_MESSAGE]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    
    // Safety flag to fall back automatically if Google rate limits us
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage = {
            id: Date.now().toString(),
            role: "user",
            content: inputValue,
        };

        setMessages((prev) => [...prev, userMessage]);
        const currentInput = inputValue;
        setInputValue("");
        setIsTyping(true);

        // --- FALLBACK MOCK API (Runs if Google 429'd us earlier) ---
        if (isOfflineMode) {
            setTimeout(() => {
                const aiResponse = {
                    id: (Date.now() + 1).toString(),
                    role: "ai",
                    content: generateMockResponse(currentInput),
                };
                setMessages((prev) => [...prev, aiResponse]);
                setIsTyping(false);
            }, 1200); // Fake typing delay
            return;
        }

        try {
            // --- ATTEMPT GEMINI API ---
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) throw new Error("API key not configured");

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash", 
                systemInstruction: SYSTEM_INSTRUCTION,
            });

            const history = messages
                .filter(msg => msg.id !== "1")
                .map(msg => ({
                    role: msg.role === "user" ? "user" : "model",
                    parts: [{ text: msg.content }]
                }));

            const chat = model.startChat({ history });

            const result = await chat.sendMessage(currentInput);
            const responseText = result.response.text();

            const aiResponse = {
                id: (Date.now() + 1).toString(),
                role: "ai",
                content: responseText,
            };

            setMessages((prev) => [...prev, aiResponse]);
            setIsTyping(false);

        } catch (error) {
            console.error("Error calling Gemini API:", error);
            
            // IF GOOGLE THROWS A 429 EXHAUSTION ERROR, SWITCH TO OFFLINE MODE AND ANSWER ANYWAY!
            setIsOfflineMode(true);
            
            setTimeout(() => {
                const aiResponse = {
                    id: (Date.now() + 1).toString(),
                    role: "ai",
                    content: generateMockResponse(currentInput),
                };
                setMessages((prev) => [...prev, aiResponse]);
                setIsTyping(false);
            }, 600);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute bottom-20 right-0 w-[340px] h-[500px] bg-card border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden sm:w-[380px]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-muted/50 to-muted/10">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full border border-border flex items-center justify-center bg-card shadow-sm overflow-hidden flex-shrink-0">
                                    <img src="/profile.png" alt="Rechie" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">Chat with Rechie</h3>
                                    <p className="text-xs text-muted-foreground">{isOfflineMode ? "Offline Mode (Mock API)" : "Always active"}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-full hover:bg-muted">
                                <X size={18} />
                            </Button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar bg-background/50">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex gap-3 max-w-[85%]",
                                        msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center shadow-sm overflow-hidden",
                                            msg.role === "user"
                                                ? "bg-secondary text-secondary-foreground"
                                                : "bg-card border border-border"
                                        )}
                                    >
                                        {msg.role === "user" ? <User size={16} /> : <img src="/profile.png" alt="AI" className="w-full h-full object-cover" />}
                                    </div>
                                    <div
                                        className={cn(
                                            "px-4 py-2.5 text-sm shadow-sm",
                                            msg.role === "user"
                                                ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                                                : "bg-card text-foreground rounded-2xl rounded-tl-sm border border-border"
                                        )}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex gap-3 max-w-[85%]">
                                    <div className="w-8 h-8 flex-shrink-0 rounded-full bg-card border border-border flex items-center justify-center shadow-sm overflow-hidden">
                                        <img src="/profile.png" alt="AI" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="px-4 py-3.5 text-sm bg-card text-foreground border border-border rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5 h-[44px]">
                                        <motion.span
                                            animate={{ opacity: [0.4, 1, 0.4] }}
                                            transition={{ repeat: Infinity, duration: 1.4, delay: 0 }}
                                            className="w-1.5 h-1.5 rounded-full bg-foreground/60"
                                        />
                                        <motion.span
                                            animate={{ opacity: [0.4, 1, 0.4] }}
                                            transition={{ repeat: Infinity, duration: 1.4, delay: 0.2 }}
                                            className="w-1.5 h-1.5 rounded-full bg-foreground/60"
                                        />
                                        <motion.span
                                            animate={{ opacity: [0.4, 1, 0.4] }}
                                            transition={{ repeat: Infinity, duration: 1.4, delay: 0.4 }}
                                            className="w-1.5 h-1.5 rounded-full bg-foreground/60"
                                        />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 border-t border-border bg-card">
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask anything..."
                                    className="w-full bg-muted/50 border border-transparent focus:border-border rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none transition-all disabled:opacity-50"
                                    disabled={isTyping}
                                />
                                <div className="absolute right-1.5">
                                    <Button
                                        size="icon"
                                        className={cn(
                                            "w-8 h-8 rounded-full transition-all",
                                            inputValue.trim() && !isTyping ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground"
                                        )}
                                        onClick={handleSendMessage}
                                        disabled={!inputValue.trim() || isTyping}
                                    >
                                        <Send size={14} className={inputValue.trim() && !isTyping ? "opacity-100" : "opacity-50"} />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background z-50 relative"
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                            animate={{ opacity: 1, rotate: 0, scale: 1 }}
                            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                            transition={{ duration: 0.15 }}
                        >
                            <X size={24} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="open"
                            initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
                            animate={{ opacity: 1, rotate: 0, scale: 1 }}
                            exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
                            transition={{ duration: 0.15 }}
                        >
                            <MessageCircle size={24} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
}
