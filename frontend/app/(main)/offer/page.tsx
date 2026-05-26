"use client";
import { useState, useEffect } from "react";
import { fetchOffer, acceptOffer, rejectOffer } from "@/lib/api/offer";
import type { Offer } from "@/lib/api/offer";

export default function OfferPage() {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loadingOffer, setLoadingOffer] = useState(true);
  
  const [response, setResponse]           = useState<"accepted" | "declined" | null>(null);
  const [modal, setModal]                 = useState<"accept" | "decline" | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [signature, setSignature]         = useState("");
  const [loading, setLoading]             = useState(false);

  useEffect(() => {
    fetchOffer()
      .then((data) => {
        setOffer(data);
        if (data) {
          if (data.status === "signed") setResponse("accepted");
          if (data.status === "rejected") setResponse("declined");
        }
        setLoadingOffer(false);
      })
      .catch((err) => {
        console.error("Error fetching offer:", err);
        setLoadingOffer(false);
      });
  }, []);

  function openModal(type: "accept" | "decline") {
    setSignature("");
    setDeclineReason("");
    setModal(type);
  }

  async function confirm() {
    setLoading(true);
    try {
      if (modal === "accept") {
        // Convert typed name to a base64 SVG image
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100">
          <text x="20" y="65" font-family="'Brush Script MT', 'Caveat', cursive, serif" font-size="54" font-style="italic" fill="black">${signature.trim()}</text>
        </svg>`;
        const base64Signature = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
        
        await acceptOffer(base64Signature);
        setResponse("accepted");
      }
      if (modal === "decline") {
        await rejectOffer();
        setResponse("declined");
      }
    } finally {
      setLoading(false);
      setModal(null);
    }
  }

  if (loadingOffer) {
    return (
      <main className="w-full flex items-center justify-center" style={{ minHeight: "calc(100vh - 56px - 56px)" }}>
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c2570a" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
          <p className="text-sm text-gray-400 font-medium">Loading your offer...</p>
        </div>
      </main>
    );
  }

  if (!offer) {
    return (
      <main className="w-full flex flex-col items-center justify-center gap-4 text-center px-4" style={{ minHeight: "calc(100vh - 56px - 56px)" }}>
        <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#c2570a]">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">No Offer Found</h2>
          <p className="text-sm text-gray-500 max-w-sm mt-1.5">
            We couldn't retrieve your offer details. It may have expired, been withdrawn, or the access link might be invalid.
          </p>
        </div>
      </main>
    );
  }

  const details = [
    { label: "Start Date",       value: offer.joiningDate },
    { label: "Location",         value: offer.location },
    { label: "Reporting To",     value: offer.reportingTo, bold: true },
    { label: "Compensation",     value: offer.salary, bold: true },
    { label: "Probation Period", value: offer.probationPeriod },
    { label: "Offer Expires",    value: offer.expiresOn, red: true },
  ];

  return (
    <main className="w-full flex flex-col gap-5" style={{ minHeight: "calc(100vh - 56px - 56px)" }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Offer Letter</h1>
          <p className="text-sm text-gray-500 mt-1">Review your offer details and respond before the expiry date.</p>
        </div>
        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border flex-shrink-0
          ${response === "accepted" ? "bg-orange-50 text-[#c2570a] border-[#fed7aa]"
          : response === "declined" ? "bg-red-50 text-red-600 border-red-200"
          : "bg-amber-50 text-amber-700 border-amber-200"}`}>
          <span className={`w-2 h-2 rounded-full flex-shrink-0
            ${response === "accepted" ? "bg-[#c2570a]"
            : response === "declined" ? "bg-red-500"
            : "bg-amber-500 animate-pulse"}`} />
          {response === "accepted" ? "Accepted" : response === "declined" ? "Declined" : "Pending"}
        </span>
      </div>

      {/* Expiry banner */}
      {!response && (
        <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span>Respond before <strong>{offer.expiresOn}</strong>.</span>
        </div>
      )}

      {/* Response success states */}
      {response === "accepted" && (
        <div className="flex items-center gap-4 px-6 py-4 bg-orange-50 border border-[#fed7aa] rounded-xl">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c2570a" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <p className="font-semibold text-[#9a3d07]">Offer Accepted!</p>
            <p className="text-sm text-[#c2570a] mt-0.5">Welcome to the team, {offer.candidateName}! You're set to start on <strong>{offer.joiningDate}</strong>.</p>
          </div>
        </div>
      )}
      {response === "declined" && (
        <div className="flex items-center gap-4 px-6 py-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
          <div>
            <p className="font-semibold text-red-800">Offer Declined</p>
            <p className="text-sm text-red-700 mt-0.5">You have declined this offer. Our HR team will be in touch shortly.</p>
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col">

        {/* Position header */}
        <div className="flex items-center gap-4 px-6 py-5 bg-[#c2570a]">
          <div className="w-10 h-10 rounded-xl bg-[#a84608] flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          </div>
          <div>
            <p className="text-lg font-bold text-white">{offer.role}</p>
            <p className="text-sm text-orange-200">{offer.department} · {offer.company}</p>
          </div>
        </div>

        {/* Details grid */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 divide-gray-100">
            {details.map((d) => (
              <div key={d.label} className="flex items-center justify-between py-3 sm:odd:pr-6 sm:even:pl-6 sm:odd:border-r sm:odd:border-gray-100">
                <span className="text-sm text-gray-400">{d.label}</span>
                <span className={`text-sm font-semibold ${d.red ? "text-red-500" : "text-gray-800"}`}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Offer document */}
        <div className="px-6 py-5 border-b border-gray-100 flex-1">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Offer Document</p>
          <p className="text-xs text-gray-400 mb-4">
            {response === "accepted" ? "Your signed offer PDF is available below" : "Review your offer document below before responding"}
          </p>
          <div className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-3 py-10 bg-gray-50/50">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <p className="text-sm font-semibold text-gray-600">Offer_Letter_{offer.candidateName.replace(/\s+/g, '')}.pdf</p>
            {offer.pdfUrl ? (
              <a 
                href={offer.pdfUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm font-semibold text-[#c2570a] hover:text-[#9a3d07] underline underline-offset-2 transition-colors cursor-pointer"
              >
                Download PDF
              </a>
            ) : (
              <span className="text-sm text-gray-400">PDF not available yet</span>
            )}
          </div>
        </div>

        {/* Respond */}
        {!response && (
          <div className="px-6 py-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Respond to Offer</p>
            <p className="text-xs text-gray-400 mb-4">Once submitted, your response cannot be changed. Read the offer carefully.</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => openModal("accept")}
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#c2570a] hover:bg-[#9a3d07] active:scale-[0.98] text-white text-sm font-bold transition-all shadow-sm cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                Accept Offer
              </button>
              <button
                onClick={() => openModal("decline")}
                className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 active:scale-[0.98] text-gray-600 hover:text-red-600 text-sm font-bold transition-all cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Decline Offer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {modal === "accept" ? "Accept Offer?" : "Decline Offer?"}
            </h3>
            <p className="text-sm text-gray-500 mb-1">This action cannot be undone.</p>
            <p className="text-sm text-gray-600 mb-4">
              {modal === "accept"
                ? `You are accepting the offer for ${offer.role} starting ${offer.joiningDate}.`
                : "Let us know why you're declining (optional)."}
            </p>

            {modal === "accept" && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                  Type your full name to sign
                </label>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder={`e.g. ${offer.candidateName}`}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#c2570a] font-medium"
                  autoFocus
                />
                {signature.trim().length > 0 && (
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c2570a" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Signing as <span className="font-semibold text-gray-600 italic ml-1">{signature.trim()}</span>
                  </p>
                )}
              </div>
            )}

            {modal === "decline" && (
              <textarea
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 resize-none mb-4 focus:outline-none focus:ring-2 focus:ring-red-400"
                rows={3}
                placeholder="Reason for declining..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                autoFocus
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setModal(null)}
                disabled={loading}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirm}
                disabled={loading || (modal === "accept" && signature.trim().length === 0)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer
                  ${modal === "accept" ? "bg-[#c2570a] hover:bg-[#9a3d07]" : "bg-red-600 hover:bg-red-700"}`}
              >
                {loading
                  ? "Submitting…"
                  : modal === "accept"
                  ? "Confirm & Accept"
                  : "Yes, Decline"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}