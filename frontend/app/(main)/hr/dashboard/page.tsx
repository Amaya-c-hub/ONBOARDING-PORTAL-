"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Files, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";

export default function HrDashboardSummaryPage() {
  const [stats, setStats] = useState({
    candidates: 0,
    offers: 0,
    pendingDocs: 0,
    acceptedOffers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const res = await fetch(`${API}/hr/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.error("Failed to fetch dashboard stats", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { name: "Total Pipeline", value: stats.candidates, icon: Users, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
    { name: "Offers Issued", value: stats.offers, icon: Files, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { name: "Awaiting Review", value: stats.pendingDocs, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { name: "Fully Onboarded", value: stats.acceptedOffers, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">System Analytics</h1>
          <p className="text-gray-500 text-sm font-medium">Real-time performance metrics and onboarding pipeline health.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-[#ffedd5] rounded-xl">
             <div className="w-2 h-2 rounded-full bg-[#c2570a] animate-pulse" />
             <span className="text-[10px] font-black text-[#c2570a] uppercase tracking-widest">Global Sync Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <motion.div 
            key={card.name} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white border border-gray-200 p-6 rounded-3xl shadow-sm flex flex-col items-start relative group overflow-hidden"
          >
            <div className={`p-3 rounded-2xl ${card.bg} ${card.color} mb-6 border ${card.border} shadow-sm`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div className="text-gray-500 text-[11px] font-black uppercase tracking-widest mb-2">{card.name}</div>
            <div className="text-4xl font-black text-gray-900 tracking-tighter">
              {loading ? <div className="h-10 w-16 bg-gray-100 animate-pulse rounded-xl" /> : card.value}
            </div>
            <div className="absolute top-6 right-6">
                <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-[#c2570a] transition-colors" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Pipeline Efficiency Card */}
        <div className="lg:col-span-3 bg-white border border-gray-200 p-10 rounded-[32px] shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                    <Zap className="w-5 h-5 text-[#c2570a]" />
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Onboarding Efficiency</h3>
                </div>
                
                <div className="flex flex-wrap items-center gap-10 mb-10">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-[32px] border-[6px] border-orange-50 border-t-[#c2570a] flex items-center justify-center shadow-sm">
                            <span className="text-xl font-black text-gray-900">92%</span>
                        </div>
                        <div>
                            <div className="text-sm font-black text-gray-900 uppercase tracking-tight">Deployment Index</div>
                            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-1">Global Target: 85%</div>
                        </div>
                    </div>
                    
                    <div className="h-12 w-px bg-gray-200 hidden md:block" />
                    
                    <div className="space-y-1">
                        <div className="text-3xl font-black text-gray-900 tracking-tighter">4.2 <span className="text-sm font-bold text-gray-500 uppercase ml-1">Days</span></div>
                        <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                             <div className="w-1 h-1 rounded-full bg-emerald-500" /> Average Verification Time
                        </div>
                    </div>
                </div>
                
                <p className="text-sm font-medium text-gray-600 leading-safe max-w-xl">
                    Performance is currently **14% above** the previous quarter. Automated Slack notifications and AI-assisted document triage have significantly reduced manual HR friction.
                </p>
            </div>
            
            <div className="absolute -bottom-10 -right-10 opacity-[0.03] rotate-12 transition-transform group-hover:rotate-6 pointer-events-none">
                <ShieldCheck className="w-64 h-64 text-gray-900" />
            </div>
        </div>

        {/* Growth Stats Card */}
        <div className="lg:col-span-2 bg-white border border-gray-200 p-10 rounded-[32px] shadow-sm">
            <div className="flex items-center gap-3 mb-10">
                <TrendingUp className="w-5 h-5 text-[#c2570a]" />
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Quarterly Growth</h3>
            </div>
            
            <div className="space-y-8">
                {[
                    { label: "Talent Acquisition", val: 82, color: "bg-[#c2570a]" },
                    { label: "Profile Verification", val: 68, color: "bg-blue-500" },
                    { label: "Signature Conversion", val: 54, color: "bg-emerald-500" }
                ].map((item) => (
                    <div key={item.label} className="group">
                        <div className="flex justify-between items-end mb-3 px-1">
                            <span className="text-[11px] font-black text-gray-500 uppercase tracking-[0.2em]">{item.label}</span>
                            <span className="text-sm font-black text-gray-900 tracking-widest">{item.val}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200 p-0.5 shadow-inner">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${item.val}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={`h-full ${item.color} rounded-full`} 
                            />
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-12 flex justify-center">
                <button className="text-[10px] font-black text-gray-500 hover:text-[#c2570a] transition-colors uppercase tracking-[0.3em] flex items-center gap-2">
                    Generate Full Report <ArrowUpRight className="w-3 h-3" />
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}
