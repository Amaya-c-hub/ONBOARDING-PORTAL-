"use client";

import { Settings, ShieldCheck, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  return (
    <div className="max-w-7xl mx-auto h-[60vh] flex flex-col items-center justify-center text-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 rounded-[32px] bg-orange-50 border border-[#ffedd5] flex items-center justify-center mb-10 shadow-sm relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <Settings className="w-10 h-10 text-[#c2570a] group-hover:rotate-90 transition-transform duration-700" />
      </motion.div>
      
      <motion.h1 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-4"
      >
        Platform Settings
      </motion.h1>
      
      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-gray-500 max-w-md font-medium text-sm leading-relaxed"
      >
        Core platform configurations for identity verification, document collection pipelines, and secure e-signature provisioning are currently locked under global encryption.
      </motion.p>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-12 flex items-center gap-6"
      >
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black text-gray-500 uppercase tracking-widest shadow-sm">
            <Lock className="w-3.5 h-3.5" /> Security Context: ACTIVE
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-[#ffedd5] rounded-xl text-[10px] font-black text-[#c2570a] uppercase tracking-widest shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" /> Admin Only Access
        </div>
      </motion.div>
    </div>
  );
}
