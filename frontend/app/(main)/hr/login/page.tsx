"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Mail, Loader2, ShieldCheck, Award, ChevronRight, ChevronLeft } from "lucide-react";

export default function HrLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState<"hr" | "manager">("hr");
  const [step, setStep] = useState(1); // 1: Identification, 2: OTP
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleInitiateAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${API}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, selectedRole: role }),
      });

      const data = await res.json();
      if (res.ok) {
        setStep(2);
      } else {
        setError(data.message || "Access denied: Unauthorized identity");
      }
    } catch (err) {
      setError("Failed to connect to authentication node.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${API}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      });

      const data = await res.json();
      if (res.ok) {
        // Store session token
        localStorage.setItem("auth_token", data.accessToken);
        localStorage.setItem("hr_auth", "true");
        router.push("/hr");
      } else {
        setError(data.message || "Invalid security code.");
      }
    } catch (err) {
      setError("Failed to verify security manifest.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-gray-900 font-sans overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-orange-200/50 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#c2570a]/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-white/90 backdrop-blur-2xl p-10 rounded-[40px] border border-gray-200 shadow-[0_22px_70px_4px_rgba(0,0,0,0.05)] relative z-10"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#c2570a] to-transparent" />
        
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-4 ring-4 ring-gray-50 shadow-sm overflow-hidden">
             <img src="/logo.png" alt="Company Logo" className="w-full h-full object-contain p-2" />
          </div>
          <h2 className="text-xl font-black tracking-[0.15em] text-center uppercase text-gray-900">Linnk <span className="text-[#c2570a]">Portal</span></h2>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">Internal Onboarding Management System</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[10px] font-black text-center uppercase tracking-widest"
          >
            <div className="flex items-center justify-center gap-2">
                <div className="w-1 h-1 rounded-full bg-red-600 animate-ping" />
                {error}
            </div>
          </motion.div>
        )}

        {step === 1 ? (
          <form onSubmit={handleInitiateAuth} className="space-y-6">
            <div className="space-y-5">
              
              {/* Role Selector */}
              <div className="grid grid-cols-2 gap-3 p-1 bg-gray-50 rounded-2xl border border-gray-200">
                  <button 
                    type="button"
                    onClick={() => setRole("hr")}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${role === "hr" ? 'bg-white text-[#c2570a] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> HR Command
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRole("manager")}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${role === "manager" ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Award className="w-3.5 h-3.5" /> Manager Access
                  </button>
              </div>

              <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Enterprise Email</label>
                    <div className="relative group">
                        <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#c2570a]" />
                        <input 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-[#c2570a]/50 focus:ring-4 focus:ring-[#c2570a]/10 transition-all font-semibold text-gray-900 placeholder-gray-400"
                            placeholder="username@linnk.io"
                        />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative group">
                        <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#c2570a]" />
                        <input 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-[#c2570a]/50 focus:ring-4 focus:ring-[#c2570a]/10 transition-all font-semibold text-gray-900 placeholder-gray-400"
                            placeholder="••••••••"
                        />
                    </div>
                  </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#c2570a] hover:bg-[#9a3d07] text-white font-black py-5 rounded-2xl transition-all mt-4 flex justify-center items-center gap-3 uppercase tracking-[0.2em] text-[11px] shadow-md shadow-[#c2570a]/20 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continue to Security <ChevronRight className="w-4 h-4" /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-10">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 text-[10px] font-black text-[#c2570a] uppercase tracking-[0.3em] bg-orange-50 px-4 py-2 rounded-full border border-orange-100">
                <div className="w-1.5 h-1.5 rounded-full bg-[#c2570a] animate-ping" />
                Security Key Dispatched
              </div>
              <p className="text-xs text-gray-500 font-medium leading-relaxed">
                A 6-digit encryption sequence has been sent to <span className="text-gray-900 font-bold">{email}</span>. Please enter it below to authorize this session.
              </p>
            </div>

            <div className="flex justify-center">
              <input 
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                autoFocus
                className="w-56 bg-white border-2 border-gray-200 rounded-2xl py-6 text-center text-4xl font-black tracking-[0.5em] focus:outline-none focus:border-[#c2570a] focus:ring-4 focus:ring-[#c2570a]/10 text-[#c2570a] shadow-sm font-mono"
                placeholder="000000"
              />
            </div>

            <div className="space-y-4">
              <button 
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full bg-[#c2570a] hover:bg-[#9a3d07] text-white font-black py-5 rounded-2xl transition-all flex justify-center items-center gap-3 uppercase tracking-[0.2em] text-[11px] shadow-md shadow-[#c2570a]/20 active:scale-[0.98] disabled:opacity-40"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Complete Authorization <ShieldCheck className="w-4 h-4" /></>}
              </button>
              
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-[10px] font-black text-gray-500 hover:text-gray-900 uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft className="w-3 h-3" /> Re-enter Credentials
              </button>
            </div>
          </form>
        )}

        <div className="mt-12 pt-8 border-t border-gray-100 flex justify-center">
            <div className="flex items-center gap-3 text-[9px] font-black text-gray-400 uppercase tracking-[0.25em]">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Enterprise Shield Active
            </div>
        </div>
      </motion.div>
      
      <div className="absolute bottom-8 left-0 w-full text-center pointer-events-none">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.5em]">Linnk Global Onboarding Infrastructure</p>
      </div>
    </div>
  );
}
