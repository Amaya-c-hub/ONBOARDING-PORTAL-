"use client";

import { useState, useEffect } from "react";
import { Loader2, Send, Mail, FileSignature, CheckCircle, AlertTriangle, AlertCircle, ChevronDown, ExternalLink, ShieldCheck, Clock, Files, Award, Briefcase, GraduationCap, X, PenLine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

export default function HrDashboardPage() {
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const [loading, setLoading] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);

  const [offers, setOffers] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [candidateForOffer, setCandidateForOffer] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('STANDARD');

  const [activeReview, setActiveReview] = useState<{ docId: string, status: 'APPROVED' | 'REJECTED' } | null>(null);
  const [reviewComment, setReviewComment] = useState("");


  const fetchData = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      setDataLoading(true);
      const [queueRes, offersRes, activityRes, statsRes] = await Promise.all([
        fetch(`${API}/hr/queue`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API}/hr/offers`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API}/hr/activity`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API}/hr/stats`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const queueData = await queueRes.json();
      const offersData = await offersRes.json();
      const activityData = await activityRes.json();
      const statsData = await statsRes.json();
      
      setCandidates(Array.isArray(queueData) ? queueData : []);
      setOffers(Array.isArray(offersData) ? offersData : []);
      setActivity(Array.isArray(activityData) ? activityData : []);
      setStats(statsData);
    } catch (e) {
      console.error("Data synchronization failure:", e);
      // In case of 401/403, we might want to clear memory
      setCandidates([]);
      setOffers([]);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateDocStatus = async (docId: string, status: 'APPROVED' | 'REJECTED', comments?: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`${API}/documents/${docId}/review`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, comments })
      });
      setActiveReview(null);
      setReviewComment("");
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const generateOffer = async (id: string, name: string, templateType: string) => {
    setLoading(id);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`${API}/hr/offer/generate/${id}`, { 
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ templateType })
      });
      if (res.ok) {
        alert(`${templateType} Offer generated & sent securely to ${name}`);
        setShowTemplateModal(false);
        fetchData();
      } else {
        const error = await res.json();
        alert(`Failed to generate offer: ${error.message}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  const simulateSignature = async (offerId: string) => {
    try {
      const res = await fetch(`${API}/hr/webhook/opensign/simulate/${offerId}`);
      if (res.ok) {
        alert("Automation sequence triggered: Candidate signature verified via simulation.");
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMs = now.getTime() - past.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    if (diffInMins < 1) return 'just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getDocStatusBadge = (c: any) => {
    if (!c.documents || c.documents.length === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 border border-rose-500/30 bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Missing
        </span>
      );
    }
    const allApproved = c.documents.every((d: any) => d.status === 'APPROVED');
    const anyRejected = c.documents.some((d: any) => d.status === 'REJECTED');
    
    if (allApproved) {
      return (
        <span className="inline-flex items-center gap-1.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Verified
        </span>
      );
    } else if (anyRejected) {
      return (
        <span className="inline-flex items-center gap-1.5 border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Rejected
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Review
        </span>
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-8">
      
      {/* LEFT COLUMN: Review Queue & Recent Activity */}
      <div className="flex-1 flex flex-col gap-8 min-w-0">
        
        {/* Review Queue Card */}
        <div className="bg-white border border-gray-200 rounded-[32px] overflow-hidden flex flex-col shadow-sm">
          
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#c2570a]" />
                  <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">Active Review Queue</h2>
              </div>
               <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                   {stats?.pendingDocs ?? candidates.length} Tasks Pending
               </div>
          </div>

          <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-black text-gray-400 tracking-[0.2em]">
            <div className="col-span-4">Candidate Identity</div>
            <div className="col-span-3">Status Index</div>
            <div className="col-span-3">Verification</div>
            <div className="col-span-2 text-right">Operations</div>
          </div>

          <div className="divide-y divide-gray-100 flex-1">
            {dataLoading && (
              <div className="p-20 flex flex-col items-center gap-4 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-[#c2570a]" />
                <span className="text-xs font-black uppercase tracking-widest">Synchronizing Queue...</span>
              </div>
            )}
            
            {!dataLoading && candidates.length === 0 && (
              <div className="p-20 text-center flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-gray-300" />
                  </div>
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">All identities verified. Queue manifest clear.</div>
              </div>
            )}
            
            {!dataLoading && Array.isArray(candidates) && candidates.map((c) => (
              <React.Fragment key={c.id}>
                <div 
                  className={`grid grid-cols-12 gap-4 px-8 py-6 items-center hover:bg-gray-50 transition-all cursor-pointer group ${expandedCandidate === c.id ? 'bg-orange-50/50' : ''}`}
                  onClick={() => setExpandedCandidate(expandedCandidate === c.id ? null : c.id)}
                >
                  <div className="col-span-4 flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-white border border-gray-200 flex items-center justify-center font-black text-xs text-[#c2570a] group-hover:border-[#c2570a]/30 transition-colors">
                        {c.firstName?.[0] || c.email[0].toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-black text-gray-900 truncate leading-none mb-1 group-hover:text-[#c2570a] transition-colors">
                            {c.firstName ? `${c.firstName} ${c.lastName}` : c.email.split('@')[0]}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 truncate uppercase tracking-tight">{c.email}</span>
                    </div>
                  </div>
                  
                  <div className="col-span-3 flex flex-col min-w-0">
                    <span className="text-xs font-bold text-gray-700 truncate">Software Engineer</span>
                    <span className="text-[9px] font-black text-gray-500 flex items-center gap-1.5 mt-1.5 uppercase tracking-widest">
                      <div className="w-1 h-1 rounded-full bg-[#c2570a] shadow-[0_0_5px_rgba(194,87,10,0.3)]" /> NA • REMOTE
                    </span>
                  </div>
                  
                  <div className="col-span-3">
                    {getDocStatusBadge(c)}
                  </div>

                  <div className="col-span-2 flex justify-end items-center gap-3">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setCandidateForOffer(c);
                        setShowTemplateModal(true);
                      }}
                      disabled={loading === c.id || c.status === "OFFER_PENDING" || c.status === "OFFER_ACCEPTED" || (!c.documents || c.documents.some((d: any) => d.status !== 'APPROVED'))}
                      className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-[#c2570a] hover:bg-[#9a3d07] text-white transition-all shadow-md shadow-[#c2570a]/20 disabled:opacity-30 disabled:grayscale"
                    >
                      {loading === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      <span className="hidden sm:inline">Offer</span>
                    </button>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${expandedCandidate === c.id ? 'rotate-180 text-[#c2570a]' : ''}`} />
                  </div>
                </div>

                <AnimatePresence>
                  {expandedCandidate === c.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-gray-50 border-b border-gray-100 overflow-hidden"
                    >
                      <div className="px-8 py-8">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Verification Artifacts</h4>
                            <div className="text-[9px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">CANDIDATE ID: {c.id.slice(0,8)}</div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {c.documents?.map((doc: any) => (
                            <div key={doc.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 bg-white group/doc shadow-sm">
                              <div className="min-w-0 flex-1 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover/doc:text-[#c2570a] transition-colors">
                                    <FileSignature className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-xs font-black text-gray-900 uppercase tracking-tight">{doc.type.replace('_', ' ')}</div>
                                    <button 
                                      onClick={() => window.open(doc.url, '_blank')}
                                      className="text-[9px] font-bold text-[#c2570a] hover:text-[#9a3d07] mt-1 flex items-center gap-1 uppercase tracking-widest"
                                    >
                                      External Link <ExternalLink className="w-2 h-2" />
                                    </button>
                                </div>
                              </div>
                              <div className="flex flex-col gap-3 ml-4">
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => updateDocStatus(doc.id, 'APPROVED')}
                                    title="Approve Artifact"
                                    className={`p-2.5 rounded-xl transition-all ${doc.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm' : 'bg-gray-50 border border-gray-200 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'}`}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      if (activeReview?.docId === doc.id && activeReview?.status === 'REJECTED') {
                                        setActiveReview(null);
                                      } else {
                                        setActiveReview({ docId: doc.id, status: 'REJECTED' });
                                      }
                                    }}
                                    title="Reject Artifact"
                                    className={`p-2.5 rounded-xl transition-all ${doc.status === 'REJECTED' ? 'bg-red-50 text-red-600 border border-red-200 shadow-sm' : 'bg-gray-50 border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200'}`}
                                  >
                                    <AlertTriangle className="w-4 h-4" />
                                  </button>
                                </div>
                                
                                <AnimatePresence>
                                  {activeReview?.docId === doc.id && (
                                    <motion.div 
                                      initial={{ opacity: 0, y: -10 }} 
                                      animate={{ opacity: 1, y: 0 }} 
                                      className="flex flex-col gap-2 p-3 bg-white rounded-xl border border-red-100 shadow-sm"
                                    >
                                      <textarea 
                                        placeholder="Reason for rejection..."
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                        className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-[10px] text-gray-900 focus:outline-none focus:border-red-300 min-h-[60px]"
                                      />
                                      <div className="flex justify-end gap-2">
                                         <button onClick={() => setActiveReview(null)} className="text-[9px] font-black uppercase text-gray-500 px-2 py-1 hover:text-gray-900 transition-colors">Cancel</button>
                                         <button 
                                            onClick={() => updateDocStatus(doc.id, 'REJECTED', reviewComment)}
                                            className="text-[9px] font-black uppercase text-white bg-red-600 px-3 py-1 rounded-lg hover:bg-red-700 transition-colors"
                                         >
                                            Confirm Rejection
                                         </button>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          ))}
                          {(!c.documents || c.documents.length === 0) && (
                            <div className="col-span-2 p-10 border border-dashed border-gray-200 rounded-[24px] text-center">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Candidate has not initialized upload sequence.</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="bg-white border border-gray-200 rounded-[32px] p-10 shadow-sm">
          <div className="flex items-center justify-between mb-10">
              <div>
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">System Events</h3>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-1">Audit log of global operations</p>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-400">
                  <Clock className="w-5 h-5" />
              </div>
          </div>

          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[15px] before:h-full before:w-[2px] before:bg-gray-100">
            {activity.length === 0 && (
              <div className="flex flex-col items-center justify-center p-12 border border-dashed border-gray-200 rounded-[24px] relative z-10 bg-white">
                <AlertCircle className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No audit manifestation detected.</p>
              </div>
            )}
            
            {Array.isArray(activity) && activity.map((event) => (
              <div key={event.id} className="relative pl-10 group">
                <div className={`absolute left-0 mt-1 w-8 h-8 rounded-xl border-2 transition-all duration-300 flex items-center justify-center z-10 bg-white ${
                    event.action.includes('OFFER_SIGNED') ? 'border-emerald-200 text-emerald-500' :
                    event.action.includes('SIGNATURE_CAPTURED') ? 'border-[#ffedd5] text-[#c2570a]' :
                    event.action.includes('EMAIL_INTERACTION') ? 'border-amber-200 text-amber-500' :
                    event.action.includes('INVITE') ? 'border-blue-200 text-blue-500' :
                    event.action.includes('LOGIN') ? 'border-[#ffedd5] text-[#c2570a]' :
                    'border-gray-200 text-gray-400'
                }`}>
                  {event.action.includes('OFFER_SIGNED') ? <FileSignature className="w-3.5 h-3.5" /> :
                   event.action.includes('SIGNATURE_CAPTURED') ? <PenLine className="w-3.5 h-3.5" /> :
                   event.action.includes('EMAIL_INTERACTION') ? <Mail className="w-3.5 h-3.5" /> :
                   event.action.includes('INVITE') ? <Send className="w-3.5 h-3.5" /> :
                   <CheckCircle className="w-3.5 h-3.5" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-gray-900 group-hover:text-[#c2570a] transition-colors">
                    {event.action.replace(/_/g, ' ')} {event.candidate ? `— ${event.candidate.email}` : ''}
                  </span>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                    <Clock className="w-3 h-3" /> {getTimeAgo(event.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Sidebar Stats */}
      <div className="w-full xl:w-96 flex flex-col gap-8 shrink-0">
        
        {/* Offers Sidebar */}
        <div className="bg-white border border-gray-200 rounded-[32px] overflow-hidden shadow-sm">
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Active Offerings</h3>
              <Files className="w-4 h-4 text-[#c2570a]" />
          </div>
          
          <div className="divide-y divide-gray-100">
            <div className="p-6 space-y-5">
              {(!Array.isArray(offers) || offers.length === 0) && <p className="text-[10px] font-black text-gray-400 text-center py-10 uppercase tracking-widest">Deployment manifest empty.</p>}
              {Array.isArray(offers) && offers.slice(0, 5).map((offer) => (
                <div key={offer.id} className="flex justify-between items-start group">
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="text-[13px] font-black text-gray-900 truncate leading-none mb-1 group-hover:text-[#c2570a] transition-colors">{offer.candidate?.firstName ? `${offer.candidate.firstName} ${offer.candidate.lastName}` : offer.candidate?.email}</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">SIG_ID: {offer.id.slice(0, 12)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`text-[9px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-widest shadow-sm ${
                      offer.status === 'SIGNED' ? 'border-emerald-200 text-emerald-600 bg-emerald-50' :
                      offer.status === 'SENT' ? 'border-blue-200 text-blue-600 bg-blue-50' :
                      'border-gray-200 text-gray-500 bg-gray-50'
                    }`}>
                      {offer.status}
                    </div>
                    {offer.status === 'SENT' && (
                      <button 
                        onClick={() => simulateSignature(offer.id)}
                        className="text-[8px] font-black text-[#c2570a] hover:text-[#9a3d07] uppercase tracking-widest border border-[#ffedd5] px-2 py-0.5 rounded-md bg-orange-50 hover:bg-orange-100 transition-all"
                      >
                        Simulate Sign
                      </button>
                    )}
                    {offer.status === 'SIGNED' && offer.signatureImage && (
                       <div className="mt-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                          <img 
                            src={offer.signatureImage} 
                            alt="Signature" 
                            className="h-4 w-auto grayscale opacity-80" 
                          />
                       </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-gray-50">
              <button className="w-full py-2.5 rounded-xl text-[10px] font-black text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 transition-all uppercase tracking-[0.3em]">
                Explore Library Database
              </button>
            </div>
          </div>
        </div>

        {/* Global Pipeline Distribution */}
        <div className="bg-white border border-gray-200 rounded-[32px] p-10 shadow-sm">
          <div className="flex items-center gap-3 mb-10">
              <Globe2 className="w-5 h-5 text-[#c2570a]" />
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Status Distribution</h3>
          </div>

          <div className="space-y-6">
            {(stats?.distribution || [
                { label: "Deployment", val: 0, color: "bg-[#c2570a]" },
                { label: "Signature", val: 0, color: "bg-emerald-500" },
                { label: "Artifact Error", val: 0, color: "bg-red-500" }
            ]).map((item: any) => (
                <div key={item.label}>
                    <div className="flex items-end justify-between mb-2.5 px-1">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.label}</span>
                        <span className="text-xs font-black text-gray-900">{item.val}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${item.val}%` }}
                            transition={{ duration: 0.8 }}
                            className={`h-full ${item.color} rounded-full`} 
                        />
                    </div>
                </div>
            ))}
          </div>
          
          <p className="mt-10 text-[9px] font-bold text-gray-400 leading-relaxed uppercase tracking-tight text-center">
             System distribution metrics are synchronized every 5 minutes across cloud infrastructure.
          </p>
        </div>

      </div>

      <AnimatePresence>
        {showTemplateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white border border-gray-200 rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-[#ffedd5] flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-[#c2570a]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Select Deployment Protocol</h3>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Target: {candidateForOffer?.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowTemplateModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="grid gap-4 mb-8">
                    {[
                        { id: 'STANDARD', label: 'Standard Professional', icon: Briefcase, desc: 'Standard employment agreement with core benefits and IP clauses.' },
                        { id: 'EXECUTIVE', label: 'Executive Tier', icon: Award, desc: 'High-level agreement including equity, LTI, and strategic objectives.' },
                        { id: 'INTERN', label: 'Internship Manifest', icon: GraduationCap, desc: 'Fixed-term educational engagement focused on skill acquisition.' }
                    ].map((t) => (
                        <button 
                            key={t.id}
                            onClick={() => setSelectedTemplate(t.id)}
                            className={`flex items-start gap-4 p-5 rounded-[24px] border transition-all text-left group ${selectedTemplate === t.id ? 'bg-orange-50/50 border-[#c2570a] shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedTemplate === t.id ? 'bg-[#c2570a] text-white shadow-sm' : 'bg-gray-50 border border-gray-200 text-gray-400 group-hover:text-gray-600'}`}>
                                <t.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className={`text-[11px] font-black uppercase tracking-widest mb-1 ${selectedTemplate === t.id ? 'text-[#c2570a]' : 'text-gray-500'}`}>{t.label}</div>
                                <div className="text-[11px] font-medium text-gray-400 leading-relaxed truncate">{t.desc}</div>
                            </div>
                            {selectedTemplate === t.id && (
                                <CheckCircle className="w-4 h-4 text-[#c2570a] mt-1" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => generateOffer(candidateForOffer.id, candidateForOffer.email, selectedTemplate)}
                    disabled={loading === candidateForOffer?.id}
                    className="w-full py-4 bg-[#c2570a] hover:bg-[#9a3d07] disabled:opacity-50 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl transition-all shadow-md shadow-[#c2570a]/20 flex items-center justify-center gap-2"
                  >
                    {loading === candidateForOffer?.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Generate & Securely Disseminate
                  </button>
                </div>
              </div>
              <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Encryption Standards Applied</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const Globe2 = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
);
