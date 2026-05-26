"use client";

import { useState, useEffect } from "react";
import { Loader2, Files, User, ExternalLink, ShieldCheck, Mail, PenLine, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewSig, setPreviewSig] = useState<{ name: string; email: string; image: string } | null>(null);

  const fetchOffers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${API}/hr/offers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setOffers(data);
      } else {
        setOffers([]);
        console.error("Offers API returned non-array:", data);
      }
    } catch (e) {
      console.error(e);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOffers(); }, []);

  const simulateSignature = async (offerId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${API}/hr/webhook/opensign/simulate/${offerId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        alert("Automation sequence triggered: Candidate signature verified via simulation.");
        fetchOffers();
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10">

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Offer Manifest</h1>
          <p className="text-gray-500 text-sm font-medium">Tracking lifecycle signatures and digital offer letters across the ecosystem.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-[#ffedd5] rounded-xl">
          <Files className="w-4 h-4 text-[#c2570a]" />
          <span className="text-[10px] font-black text-[#c2570a] uppercase tracking-widest">{offers.length} Active Records</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-[32px] overflow-hidden shadow-sm">

        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-10 py-5 bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-black text-gray-400 tracking-[0.2em]">
          <div className="col-span-4">Recipient Identity</div>
          <div className="col-span-2 text-center">Signature Status</div>
          <div className="col-span-3 text-center">Digital Signature</div>
          <div className="col-span-2">Offer ID</div>
          <div className="col-span-1 text-right">PDF</div>
        </div>

        <div className="divide-y divide-gray-100">
          {loading && (
            <div className="p-24 flex flex-col items-center gap-4 text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin text-[#c2570a]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Accessing Offer Library...</span>
            </div>
          )}

          {!loading && Array.isArray(offers) && offers.length === 0 && (
            <div className="p-24 text-center flex flex-col items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-gray-50 border border-gray-200 flex items-center justify-center">
                <Files className="w-10 h-10 text-gray-300" />
              </div>
              <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">No offer artifacts detected in the current quarter.</div>
            </div>
          )}

          {!loading && Array.isArray(offers) && offers.map((offer, idx) => {
            const candidateName = offer.candidate?.firstName
              ? `${offer.candidate.firstName} ${offer.candidate.lastName ?? ""}`.trim()
              : offer.candidate?.email;

            return (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="grid grid-cols-12 gap-4 px-10 py-6 items-center hover:bg-gray-50 transition-all group"
              >
                {/* Candidate */}
                <div className="col-span-4 flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-[#c2570a] group-hover:border-[#c2570a]/30 transition-all shrink-0 shadow-sm">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[14px] font-black text-gray-900 truncate leading-none mb-1.5 group-hover:text-[#c2570a] transition-colors">
                      {candidateName}
                    </span>
                    <span className="text-[11px] font-bold text-gray-500 truncate flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-gray-400" />
                      {offer.candidate?.email}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2 flex flex-col items-center gap-2">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    offer.status === "SIGNED"
                      ? "border-emerald-200 text-emerald-600 bg-emerald-50 shadow-sm"
                      : offer.status === "SENT"
                      ? "border-blue-200 text-blue-600 bg-blue-50 shadow-sm"
                      : "border-gray-200 text-gray-500 bg-gray-50 shadow-sm"
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                      offer.status === "SIGNED" ? "bg-emerald-500" :
                      offer.status === "SENT"   ? "bg-blue-500" :
                      "bg-gray-400"
                    }`} />
                    {offer.status}
                  </span>
                  {offer.status === "SENT" && (
                    <button
                      onClick={() => simulateSignature(offer.id)}
                      className="text-[8px] font-black text-[#c2570a] hover:text-[#9a3d07] uppercase tracking-widest border border-[#ffedd5] px-2 py-0.5 rounded-md bg-orange-50 hover:bg-orange-100 transition-all">
                      Simulate Sign
                    </button>
                  )}
                </div>

                {/* Signature preview column */}
                <div className="col-span-3 flex items-center justify-center">
                  {offer.signatureImage ? (
                    <button
                      onClick={() => setPreviewSig({ name: candidateName, email: offer.candidate?.email, image: offer.signatureImage })}
                      className="group/sig relative flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white border border-emerald-200 hover:border-emerald-300 transition-all cursor-pointer shadow-sm">
                      {/* Tiny signature thumbnail */}
                      <div className="w-20 h-8 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                        <img
                          src={offer.signatureImage}
                          alt="Signature"
                          className="max-h-7 max-w-full object-contain"
                          style={{ filter: "opacity(0.8)" }}
                        />
                      </div>
                      <div className="text-left">
                        <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Drawn Signature</div>
                        <div className="text-[8px] text-gray-400 font-bold mt-0.5">Click to expand</div>
                      </div>
                      <PenLine className="w-3 h-3 text-emerald-400 group-hover/sig:text-emerald-500 transition-colors" />
                    </button>
                  ) : (
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-12 h-0.5 bg-gray-200 rounded-full" />
                      {offer.status === "SIGNED" ? "No drawn sig" : "Pending"}
                      <div className="w-12 h-0.5 bg-gray-200 rounded-full" />
                    </span>
                  )}
                </div>

                {/* Offer ID */}
                <div className="col-span-2 font-mono text-[9px] font-bold text-gray-400 uppercase tracking-tighter truncate">
                  {offer.id}
                </div>

                {/* PDF link */}
                <div className="col-span-1 flex items-center justify-end">
                  <button
                    onClick={() => window.open(offer.pdfUrl, "_blank")}
                    className="p-2.5 bg-gray-50 border border-gray-200 hover:border-[#c2570a] transition-all rounded-xl text-[#c2570a] hover:bg-orange-50 shadow-sm"
                    title="View PDF">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="px-10 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#c2570a]" />
            Linnk Core Sign Service
          </div>
          <div>ENCRYPTED REPOSITORY v2.1</div>
        </div>
      </div>

      {/* ── Signature full-screen preview modal ─────────────────────────────── */}
      <AnimatePresence>
        {previewSig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-md"
            onClick={() => setPreviewSig(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-gray-200 rounded-[28px] w-full max-w-lg shadow-2xl overflow-hidden">

              {/* Modal header */}
              <div className="flex items-center justify-between px-8 pt-8 pb-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <PenLine className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">Digital Signature</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Electronically signed · Encrypted</p>
                  </div>
                </div>
                <button onClick={() => setPreviewSig(null)}
                  className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-8 py-8">
                {/* Candidate info */}
                <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl bg-gray-50 border border-gray-200">
                  <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                    <User className="w-4 h-4 text-[#c2570a]" />
                  </div>
                  <div>
                    <div className="text-sm font-black text-gray-900">{previewSig.name}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{previewSig.email}</div>
                  </div>
                  <div className="ml-auto">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-50 border border-emerald-200 text-emerald-600">
                      <div className="w-1 h-1 rounded-full bg-emerald-500" />
                      Verified
                    </span>
                  </div>
                </div>

                {/* Full-size signature */}
                <div className="relative rounded-2xl bg-white border-2 border-dashed border-gray-200 p-6 flex items-center justify-center"
                  style={{ minHeight: "180px" }}>
                  <img
                    src={previewSig.image}
                    alt="Full signature"
                    className="max-h-36 max-w-full object-contain mx-auto opacity-80"
                  />
                  {/* Signature line */}
                  <div className="absolute bottom-10 left-8 right-8 border-b border-gray-200" />
                  <span className="absolute bottom-4 left-8 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    Authorized Signature
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-500 font-bold">
                  <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                  This signature was captured via the secure candidate portal and is legally binding under applicable e-signature law.
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
