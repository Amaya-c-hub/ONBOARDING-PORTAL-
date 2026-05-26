"use client";

import { useState, useEffect } from "react";
import { Loader2, FileText, CheckCircle2, XCircle, Clock, ExternalLink, ShieldCheck, Mail, User } from "lucide-react";
import { motion } from "framer-motion";

export default function DocumentsExplorerPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const res = await fetch(`${API}/hr/documents`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        
        if (Array.isArray(data)) {
          setDocuments(data);
        } else {
          setDocuments([]);
          console.error("Documents API returned non-array:", data);
        }
      } catch (e) {
        console.error(e);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Artifact Explorer</h1>
          <p className="text-gray-500 text-sm font-medium">Global repository of verified identities and supporting documentation.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-[#ffedd5] rounded-xl">
             <div className="w-2 h-2 rounded-full bg-[#c2570a]" />
             <span className="text-[10px] font-black text-[#c2570a] uppercase tracking-widest">{documents.length} Cryptographic Artifacts</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-[32px] overflow-hidden shadow-sm">
        
        <div className="grid grid-cols-12 gap-4 px-10 py-5 bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-black text-gray-400 tracking-[0.2em]">
          <div className="col-span-4">Artifact Classification</div>
          <div className="col-span-3">Associated Identity</div>
          <div className="col-span-3 text-center">Verification Status</div>
          <div className="col-span-2 text-right">Preview</div>
        </div>

        <div className="divide-y divide-gray-100">
          {loading && (
            <div className="p-24 flex flex-col items-center gap-4 text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin text-[#c2570a]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Indexing Global Artifacts...</span>
            </div>
          )}
          
          {!loading && Array.isArray(documents) && documents.length === 0 && (
            <div className="p-24 text-center flex flex-col items-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-gray-50 border border-gray-200 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-gray-300" />
                </div>
                <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Digital vault is currently empty.</div>
            </div>
          )}
          
          {!loading && Array.isArray(documents) && documents.map((doc, idx) => (
            <motion.div 
                key={doc.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="grid grid-cols-12 gap-4 px-10 py-6 items-center hover:bg-gray-50 transition-all cursor-pointer group"
            >
              <div className="col-span-4 flex items-center gap-5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-[#c2570a] group-hover:border-[#c2570a]/30 transition-all shadow-sm">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[15px] font-black text-gray-900 truncate leading-none mb-1.5 group-hover:text-[#c2570a] transition-colors uppercase tracking-tight">
                    {doc.type.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] font-bold text-gray-500 truncate uppercase tracking-widest flex items-center gap-2">
                    Registered {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="col-span-3 min-w-0">
                <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-[13px] font-bold text-gray-700 truncate block group-hover:text-gray-900 transition-colors">
                      {doc.candidate?.email}
                    </span>
                </div>
              </div>
              
              <div className="col-span-3 flex justify-center">
                <div className="flex items-center gap-2">
                   {doc.status === 'APPROVED' ? (
                     <span className="inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified Artifact
                     </span>
                   ) : doc.status === 'REJECTED' ? (
                     <span className="inline-flex items-center gap-2 border border-red-200 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-sm">
                        <XCircle className="w-3.5 h-3.5" /> Validation Error
                     </span>
                   ) : (
                     <span className="inline-flex items-center gap-2 border border-amber-200 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-sm">
                        <Clock className="w-3.5 h-3.5" /> Awaiting Review
                     </span>
                   )}
                </div>
              </div>

              <div className="col-span-2 text-right">
                <button 
                   onClick={() => window.open(doc.url, '_blank')}
                   className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-[#c2570a] hover:border-[#c2570a]/50 transition-all shadow-sm ml-auto"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open File
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="px-10 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
             <div className="flex items-center gap-2">
                 <ShieldCheck className="w-3.5 h-3.5 text-[#c2570a]" />
                 Secure Artifact Repository
             </div>
             <div>LINNK DATA INFRASTRUCTURE v4.2</div>
        </div>
      </div>
    </div>
  );
}
