"use client";

import { useState, useEffect } from "react";
import { Loader2, Users, Mail, Calendar, ChevronRight, Search, ShieldCheck, Trash2, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCandidates = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${API}/hr/candidates`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      // Safety check: ensure data is an array
      if (Array.isArray(data)) {
        setCandidates(data);
      } else {
        setCandidates([]);
        console.error("API returned non-array data:", data);
      }
    } catch (e) {
      console.error(e);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleDelete = async () => {
    if (!candidateToDelete) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("auth_token");
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${API}/hr/candidates/${candidateToDelete.id}`, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        setCandidates(Array.isArray(candidates) ? candidates.filter(c => c.id !== candidateToDelete.id) : []);
        setShowDeleteModal(false);
        setCandidateToDelete(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Identity Directory</h1>
          <p className="text-gray-500 text-sm font-medium">Complete registry of all candidate profiles within the onboarding ecosystem.</p>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 p-1 px-1 rounded-2xl">
             <div className="flex items-center gap-2 px-4 py-2 bg-[#c2570a] rounded-xl text-white shadow-md shadow-[#c2570a]/20">
                <Users className="w-4 h-4" />
                <span className="text-[11px] font-black uppercase tracking-widest">{candidates.length} Profiles</span>
             </div>
             <div className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer">
                <Search className="w-4 h-4" />
                <span className="text-[11px] font-black uppercase tracking-widest">Filter</span>
             </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-[32px] overflow-hidden shadow-sm">
        
        <div className="grid grid-cols-12 gap-4 px-10 py-5 bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-black text-gray-400 tracking-[0.2em]">
          <div className="col-span-4">Candidate Identity</div>
          <div className="col-span-3 text-center">Lifecycle Status</div>
          <div className="col-span-3">Registration Date</div>
          <div className="col-span-2 text-right">Artifacts</div>
        </div>

        <div className="divide-y divide-gray-100">
          {loading && (
            <div className="p-24 flex flex-col items-center gap-4 text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin text-[#c2570a]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Accessing Identity Vault...</span>
            </div>
          )}
          
          {!loading && Array.isArray(candidates) && candidates.length === 0 && (
            <div className="p-24 text-center flex flex-col items-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-gray-50 border border-gray-200 flex items-center justify-center">
                    <Users className="w-10 h-10 text-gray-300" />
                </div>
                <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">No identity manifestations found in the directory.</div>
            </div>
          )}
          
          {!loading && Array.isArray(candidates) && candidates.map((c, idx) => (
            <motion.div 
                key={c.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="grid grid-cols-12 gap-4 px-10 py-6 items-center hover:bg-gray-50 transition-all cursor-pointer group"
            >
              <div className="col-span-4 flex items-center gap-5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-[13px] font-black text-[#c2570a] group-hover:border-[#c2570a]/30 transition-all shadow-sm">
                  {c.firstName?.[0] || c.email[0].toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[15px] font-black text-gray-900 truncate leading-none mb-1.5 group-hover:text-[#c2570a] transition-colors">
                    {c.firstName ? `${c.firstName} ${c.lastName}` : c.email.split('@')[0]}
                  </span>
                  <span className="text-[11px] font-bold text-gray-500 truncate uppercase tracking-tight flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#c2570a] transition-colors" /> {c.email}
                  </span>
                </div>
              </div>
              
              <div className="col-span-3 flex justify-center">
                <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                  c.status === 'OFFER_ACCEPTED' ? 'border-emerald-200 text-emerald-600 bg-emerald-50 shadow-sm' :
                  c.status === 'OFFER_PENDING' ? 'border-blue-200 text-blue-600 bg-blue-50 shadow-sm' :
                  'border-amber-200 text-amber-600 bg-amber-50 shadow-sm'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                    c.status === 'OFFER_ACCEPTED' ? 'bg-emerald-500' :
                    c.status === 'OFFER_PENDING' ? 'bg-blue-500' :
                    'bg-amber-500'
                  }`} />
                  {c.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="col-span-3 flex items-center gap-3 text-[11px] font-black text-gray-500 uppercase tracking-widest">
                <Calendar className="w-4 h-4 text-gray-400" />
                {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>

              <div className="col-span-2 flex items-center justify-end gap-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] group-hover:text-gray-900 transition-colors">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setCandidateToDelete(c);
                    setShowDeleteModal(true);
                  }}
                  className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all"
                  title="Remove Identity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex flex-col items-end">
                    <span className="text-gray-900 text-sm tracking-normal">{c.documents?.length || 0}</span>
                    <span>FILES</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:translate-x-1 group-hover:text-[#c2570a] transition-all duration-300" />
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="px-10 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">
             <div className="flex items-center gap-2">
                 <ShieldCheck className="w-3.5 h-3.5 text-[#c2570a]" />
                 Verified System Registry
             </div>
             <div>LINNK GLOBAL INFRASTRUCTURE v1.0.4</div>
        </div>
      </div>

      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white border border-gray-200 rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <button 
                    onClick={() => setShowDeleteModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-3">Terminate Identity?</h3>
                <p className="text-gray-500 text-sm font-medium leading-relaxed mb-8">
                  You are about to permanently purge <span className="text-gray-900 font-bold">{candidateToDelete?.firstName} {candidateToDelete?.lastName}</span> ({candidateToDelete?.email}) and all associated artifacts from the secure registry. This action is irreversible.
                </p>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl transition-all shadow-md shadow-red-600/20 flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Confirm Permanent Deletion
                  </button>
                  <button 
                    onClick={() => setShowDeleteModal(false)}
                    className="w-full py-4 bg-white hover:bg-gray-50 text-gray-600 font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl transition-all border border-gray-200"
                  >
                    Cancel Action
                  </button>
                </div>
              </div>
              <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Purge Protocol Activated</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
