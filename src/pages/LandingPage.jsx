import React from 'react';
import { motion } from 'framer-motion';
import { Link } from '@inertiajs/react'; 
import { QrCode, Users, FileCheck, Shield, MessageSquare, BarChart3, ArrowRight } from 'lucide-react';

const SDS_ACTIVITIES = [
    { id: 1, title: "Intramurals 2025", category: "Sports Tracking", img: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=600" },
    { id: 2, title: "Leadership Summit", category: "Governance", img: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=600" },
    { id: 3, title: "RFID Deployment", category: "Technology", img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600" },
    { id: 4, title: "Student Election", category: "Membership", img: "https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?w=600" },
    { id: 5, title: "Tech Seminar", category: "Academic", img: "https://images.unsplash.com/photo-1591115765373-520b7a3f7294?w=600" },
];

const LandingPage = () => {
    const duplicatedActivities = [...SDS_ACTIVITIES, ...SDS_ACTIVITIES];

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-2 rounded-lg"><QrCode className="text-white w-6 h-6" /></div>
                    <span className="font-bold text-xl tracking-tight text-blue-900 italic">BISU-SOMT</span>
                </div>
                <div className="hidden md:flex gap-8 font-medium text-slate-600">
                    <a href="#features" className="hover:text-blue-600">Features</a>
                    <a href="#activities" className="hover:text-blue-600">SDS Activities</a>
                </div>
                <Link href="/login" className="bg-blue-600 text-white px-5 py-2 rounded-full font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                    Portal Login
                </Link>
            </nav>

            <header className="px-8 py-20 max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight text-slate-900 mb-6">
                        Smart Management for <span className="text-blue-600">Student Organizations.</span>
                    </h1>
                    <p className="text-lg text-slate-600 mb-10">Modernizing BISU Candijay Campus with QR and RFID technology.</p>
                    <div className="flex gap-4">
                        <Link href="/login" className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-800">
                            Get Started <ArrowRight size={20} />
                        </Link>
                    </div>
                </motion.div>
                <div className="relative">
                    <img src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1000" className="rounded-2xl shadow-2xl" alt="Students" />
                </div>
            </header>
        </div>
    );
};

export default LandingPage;