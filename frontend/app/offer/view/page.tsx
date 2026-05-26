"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Upload,
  ChevronDown,
  AlertTriangle,
  Clock,
  PenLine,
  Trash2,
  X,
} from "lucide-react";

interface OfferContext {
  candidate: { id: string; firstName: string | null; lastName: string | null; email: string; status: string };
  offer: { id: string; status: string; signingUrl: string | null; sentAt: string | null; pdfUrl: string | null } | null;
  documents: { id: string; type: string; status: string }[];
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  DRAFT:         { label: "Pending",      color: "text-slate-400",   bg: "bg-slate-500/10",   border: "border-slate-500/30" },
  SENT:          { label: "Awaiting You", color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/30"  },
  SIGNED:        { label: "Accepted ✓",  color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30"},
  EXPIRED:       { label: "Declined",    color: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-rose-500/30"  },
  OFFER_PENDING: { label: "Awaiting You", color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/30"  },
};

// ─── Signature Pad ───────────────────────────────────────────────────────────
function SignaturePad({ onSigned, onClear, isEmpty }: {
  onSigned: (dataUrl: string) => void;
  onClear: () => void;
  isEmpty: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const hasStrokes = useRef(false);

  const getCtx = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.strokeStyle = "#818cf8";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    return ctx;
  };

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set internal resolution to match display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#818cf8";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const start = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      drawing.current = true;
      lastPos.current = getPos(e, canvas);
    };

    const move = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!drawing.current) return;
      if (!lastPos.current) return;
      const pos = getPos(e, canvas);
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      lastPos.current = pos;
      hasStrokes.current = true;
    };

    const stop = () => {
      if (!drawing.current) return;
      drawing.current = false;
      lastPos.current = null;
      if (hasStrokes.current) {
        onSigned(canvas.toDataURL("image/png"));
      }
    };

    canvas.addEventListener("mousedown", start as any, { passive: false });
    canvas.addEventListener("mousemove", move as any, { passive: false });
    canvas.addEventListener("mouseup", stop as any);
    canvas.addEventListener("mouseleave", stop as any);
    canvas.addEventListener("touchstart", start as any, { passive: false });
    canvas.addEventListener("touchmove", move as any, { passive: false });
    canvas.addEventListener("touchend", stop as any);

    return () => {
      canvas.removeEventListener("mousedown", start as any);
      canvas.removeEventListener("mousemove", move as any);
      canvas.removeEventListener("mouseup", stop as any);
      canvas.removeEventListener("mouseleave", stop as any);
      canvas.removeEventListener("touchstart", start as any);
      canvas.removeEventListener("touchmove", move as any);
      canvas.removeEventListener("touchend", stop as any);
    };
  }, [onSigned]);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasStrokes.current = false;
    onClear();
  };

  return (
    <div className="space-y-2">
      <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-indigo-500/30 bg-[#0a0e1a]"
        style={{ height: "160px" }}>
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", touchAction: "none", cursor: "crosshair", display: "block" }}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none gap-2">
            <PenLine className="w-6 h-6 text-indigo-500/30" />
            <span className="text-[11px] font-black uppercase tracking-widest text-indigo-500/30">
              Draw your signature here
            </span>
          </div>
        )}
        {/* Signature line */}
        <div className="absolute bottom-8 left-8 right-8 border-b border-slate-700/60 pointer-events-none" />
        <span className="absolute bottom-3 left-8 text-[9px] font-bold text-slate-700 pointer-events-none uppercase tracking-widest">
          Signature
        </span>
      </div>

      <button type="button" onClick={clear}
        className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-rose-400 transition-colors">
        <Trash2 className="w-3 h-3" /> Clear
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function CandidateOfferContent() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  const [ctx, setCtx] = useState<OfferContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [done, setDone] = useState<"accepted" | "declined" | null>(null);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showSignModal, setShowSignModal] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signaturePadEmpty, setSignaturePadEmpty] = useState(true);

  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState("RESUME");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const load = useCallback(async () => {
    if (!token) { setError("No access token provided."); setLoading(false); return; }
    try {
      const res = await fetch(`${API}/portal/offer?token=${token}`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? "Failed to load offer.");
      setCtx(await res.json());
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [token, API]);

  useEffect(() => { load(); }, [load]);

  const callAccept = async (mode: string) => {
    setActionLoading(mode);
    try {
      const res = await fetch(`${API}/portal/offer/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          ...(signatureDataUrl ? { signatureImage: signatureDataUrl } : {}),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      setShowSignModal(false);
      setDone("accepted");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async () => {
    setActionLoading("decline");
    try {
      const res = await fetch(`${API}/portal/offer/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, reason: rejectReason }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      setShowRejectModal(false);
      setDone("declined");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setActionLoading("upload");
    const form = new FormData();
    form.append("token", token);
    form.append("docType", uploadType);
    form.append("file", uploadFile);
    try {
      const res = await fetch(`${API}/portal/documents/upload`, { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json()).message);
      setUploadSuccess(true);
      setUploadFile(null);
      load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f1a]">
      <div className="flex flex-col items-center gap-4 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-xs font-black uppercase tracking-widest">Loading your secure offer…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f1a] p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-[#111827] border border-rose-500/20 rounded-3xl p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
        </div>
        <h1 className="text-xl font-black text-white mb-3">Link Unavailable</h1>
        <p className="text-slate-500 text-sm leading-relaxed">{error}</p>
        <p className="mt-6 text-xs text-slate-600">Contact <a href="mailto:hr@linnk.io" className="text-indigo-400 hover:underline">hr@linnk.io</a></p>
      </motion.div>
    </div>
  );

  if (done === "accepted") return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f1a] p-6">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-[#111827] border border-emerald-500/20 rounded-3xl p-10 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
          className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </motion.div>
        <h1 className="text-2xl font-black text-white mb-3">Offer Signed & Accepted! 🎉</h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          Your signature has been securely recorded. Welcome to Linnk Global Solutions — our HR team will be in touch within 2 business days.
        </p>
        {/* Show the captured signature */}
        {signatureDataUrl && (
          <div className="mb-6 rounded-2xl bg-[#0f172a] border border-emerald-500/10 p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-3">Your captured signature</p>
            <img src={signatureDataUrl} alt="Your signature" className="max-h-14 mx-auto" style={{ filter: "invert(1) hue-rotate(200deg)" }} />
          </div>
        )}
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 text-xs text-emerald-400 font-bold uppercase tracking-widest">
          Onboarding in Progress
        </div>
      </motion.div>
    </div>
  );

  if (done === "declined") return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f1a] p-6">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-[#111827] border border-slate-700 rounded-3xl p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-8 h-8 text-slate-400" />
        </div>
        <h1 className="text-xl font-black text-white mb-3">Offer Declined</h1>
        <p className="text-slate-500 text-sm leading-relaxed">Your response has been noted. Thank you for considering Linnk Global Solutions.</p>
      </motion.div>
    </div>
  );

  if (!ctx) return null;
  const { candidate, offer, documents } = ctx;
  const name = candidate.firstName ? `${candidate.firstName} ${candidate.lastName ?? ""}`.trim() : candidate.email;
  const offerStatus = offer?.status ?? "DRAFT";
  const statusMeta = STATUS_META[offerStatus] ?? STATUS_META["DRAFT"];
  const isActionable = offer && ["SENT", "DRAFT"].includes(offerStatus);
  const alreadySigned = offerStatus === "SIGNED";

  return (
    <div className="min-h-screen bg-[#0b0f1a] flex flex-col">
      {/* Topbar */}
      <div className="border-b border-slate-800/60 px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Linnk Global Solutions</span>
          <span className="mx-3 text-slate-800">·</span>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Secure Candidate Portal</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
          <ShieldCheck className="w-3.5 h-3.5" /> Encrypted Link
        </div>
      </div>

      <div className="flex-1 py-12 px-4">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">

          {/* Main offer card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#111827] border border-slate-800/60 rounded-[32px] overflow-hidden shadow-2xl">
            <div className={`h-2 bg-gradient-to-r ${offer ? 'from-indigo-600 via-violet-600 to-purple-600' : 'from-emerald-500 to-teal-500'}`} />
            <div className="p-8 md:p-10">
              {offer ? (
                <>
                  <div className="flex items-start justify-between gap-4 mb-8">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Employment Offer</p>
                      <h1 className="text-2xl font-black text-white tracking-tight">Hello, {name} 👋</h1>
                      <p className="text-sm text-slate-500 mt-1">{candidate.email}</p>
                    </div>
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${statusMeta.bg} ${statusMeta.border} ${statusMeta.color} shrink-0`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />{statusMeta.label}
                    </span>
                  </div>

                  <p className="text-sm text-slate-400 leading-relaxed mb-8">
                    Linnk Global Solutions has extended a formal offer of employment to you. Please review your offer letter and sign below.
                    <strong className="text-white"> No account or login required.</strong>
                  </p>

                  {/* PDF Preview Container */}
                  {offer?.pdfUrl && (
                    <div className="space-y-4 mb-10">
                      <div className="flex items-center justify-between px-1">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Document Metadata</div>
                        <a href={offer.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors">
                          <ExternalLink className="w-3 h-3" /> Fullscreen Mode
                        </a>
                      </div>
                      
                      <div className="aspect-[1/1.4] w-full rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner relative group">
                        <iframe 
                          src={`${offer.pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
                          className="w-full h-full border-none"
                          title="Offer Letter Preview"
                        />
                        <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-2xl" />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {alreadySigned ? (
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center gap-3 p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <p className="text-sm font-bold text-emerald-400">Offer Executed & Signed.</p>
                      </div>
                      <a href={offer?.pdfUrl || "#"} target="_blank" className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Download Signed Copy
                      </a>
                    </div>
                  ) : isActionable ? (
                    <div className="flex flex-col gap-3">
                      <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-[28px] mb-2">
                        <p className="text-xs font-bold text-indigo-300/80 mb-4 px-1 text-center">Please review the document above carefully before applying your signature.</p>
                        <button
                          onClick={() => { setSignaturePadEmpty(true); setSignatureDataUrl(null); setShowSignModal(true); }}
                          disabled={!!actionLoading}
                          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all text-white font-black uppercase tracking-widest text-[11px] shadow-lg shadow-indigo-600/20">
                          <PenLine className="w-4 h-4" /> Finalize & Sign Document
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setShowRejectModal(true)} disabled={!!actionLoading}
                          className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-all text-slate-500 hover:text-white font-black uppercase tracking-widest text-[10px] border border-slate-800">
                          <XCircle className="w-3.5 h-3.5" /> Decline Offer
                        </button>
                        <button onClick={() => window.print()}
                          className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-white font-black uppercase tracking-widest text-[10px] border border-slate-800">
                          <FileText className="w-3.5 h-3.5" /> Print Copy
                        </button>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4 mb-8">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Pre-Offer Stage</p>
                      <h1 className="text-2xl font-black text-white tracking-tight">Welcome, {name} 👋</h1>
                      <p className="text-sm text-slate-500 mt-1">{candidate.email}</p>
                    </div>
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-500/30 bg-amber-500/10 text-amber-400 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />Verification
                    </span>
                  </div>
                  
                  <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 flex items-start gap-4">
                     <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                     <div>
                       <h3 className="text-sm font-black text-white mb-1">Identity Verification Required</h3>
                       <p className="text-sm text-slate-400 leading-relaxed">
                         To proceed with your employment offer, please upload your required supporting documents using the module below. Our HR team will securely review them.
                       </p>
                     </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Documents */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-[#111827] border border-slate-800/60 rounded-[32px] overflow-hidden shadow-xl">
            <button onClick={() => setShowUpload(!showUpload)}
              className="w-full flex items-center justify-between px-8 py-6 hover:bg-slate-800/20 transition-colors">
              <div className="flex items-center gap-3">
                <Upload className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-black text-white uppercase tracking-tight">Supporting Documents</span>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{documents.length} on file</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform duration-300 ${showUpload ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showUpload && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="px-8 pb-8 border-t border-slate-800/60 pt-6 space-y-6">
                    {documents.length > 0 && (
                      <div className="grid grid-cols-2 gap-3">
                        {documents.map((d) => (
                          <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#0f172a] border border-slate-800">
                            <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-[11px] font-black text-slate-300 uppercase truncate">{d.type}</div>
                              <div className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${d.status === "APPROVED" ? "text-emerald-400" : d.status === "REJECTED" ? "text-rose-400" : "text-slate-500"}`}>{d.status}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <form onSubmit={handleUpload} className="space-y-4">
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Upload a Document</p>
                      <select value={uploadType} onChange={(e) => setUploadType(e.target.value)}
                        className="w-full bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors">
                        {["RESUME", "ID_PROOF", "VISA", "DRIVERS_LICENSE", "INSURANCE", "BGC_FORM"].map((t) => (
                          <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                        ))}
                      </select>
                      <label className="block border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 text-center cursor-pointer transition-colors">
                        <input type="file" className="hidden" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
                        {uploadFile ? <div className="text-sm font-bold text-indigo-400">{uploadFile.name}</div> : (
                          <div><Upload className="w-6 h-6 text-slate-600 mx-auto mb-2" /><div className="text-xs font-bold text-slate-500">Click to select a file</div></div>
                        )}
                      </label>
                      <button type="submit" disabled={!uploadFile || !!actionLoading}
                        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 transition-all text-white font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2">
                        {actionLoading === "upload" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        Upload Document
                      </button>
                      {uploadSuccess && <p className="text-center text-xs font-bold text-emerald-400">Document uploaded successfully ✓</p>}
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Expiry */}
          {offer?.sentAt && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
              className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-[#0f172a] border border-slate-800/60 text-[11px] text-slate-500 font-bold">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              Offer sent {new Date(offer.sentAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · Link valid for 7 days
            </motion.div>
          )}
        </div>
      </div>

      {/* ── SIGNATURE MODAL ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSignModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              className="bg-[#111827] border border-indigo-500/20 rounded-[28px] w-full max-w-md shadow-2xl overflow-hidden">

              <div className="flex items-center justify-between px-8 pt-8 pb-5 border-b border-slate-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <PenLine className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-tight">Sign Document</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Draw your signature below</p>
                  </div>
                </div>
                <button onClick={() => setShowSignModal(false)}
                  className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-8 py-6">
                <SignaturePad
                  isEmpty={signaturePadEmpty}
                  onSigned={(dataUrl) => { setSignatureDataUrl(dataUrl); setSignaturePadEmpty(false); }}
                  onClear={() => { setSignatureDataUrl(null); setSignaturePadEmpty(true); }}
                />

                <p className="mt-4 text-[10px] text-slate-600 leading-relaxed">
                  <ShieldCheck className="w-3 h-3 inline mr-1 text-emerald-600" />
                  By confirming, you apply a legally binding electronic signature to this offer letter, timestamped and encrypted.
                </p>

                <div className="mt-5 flex flex-col gap-3">
                  <button
                    onClick={() => callAccept("esign")}
                    disabled={signaturePadEmpty || !!actionLoading}
                    className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/30">
                    {actionLoading === "esign" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Confirm & Submit Signature
                  </button>
                  <button onClick={() => setShowSignModal(false)}
                    className="w-full py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 font-black uppercase tracking-widest text-[11px] border border-slate-800 transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── DECLINE MODAL ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              className="bg-[#111827] border border-slate-800 rounded-[28px] w-full max-w-md p-8 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6">
                <XCircle className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">Decline Offer?</h3>
              <p className="text-sm text-slate-500 mb-6">This action cannot be undone. Optionally share a reason.</p>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Optional: reason for declining…"
                className="w-full h-24 bg-[#0f172a] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500/40 resize-none mb-4 transition-colors" />
              <div className="flex flex-col gap-3">
                <button onClick={handleDecline} disabled={!!actionLoading}
                  className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 transition-all">
                  {actionLoading === "decline" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Decline"}
                </button>
                <button onClick={() => setShowRejectModal(false)}
                  className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 font-black uppercase tracking-widest text-[11px] border border-slate-800 transition-all">
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CandidateOfferPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-canvas)] p-10">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    }>
      <CandidateOfferContent />
    </Suspense>
  );
}
