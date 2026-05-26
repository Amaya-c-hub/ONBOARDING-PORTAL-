"use client";
import { useState, useRef, useEffect } from "react";
import { fetchDocuments, uploadDocument, deleteDocument } from "@/lib/api/documents";
import type { Doc, DocStatus } from "@/lib/api/documents";

const docTypes = [
  "Passport / National ID",
  "Educational Certificate",
  "Experience Letter",
  "Insurance Card",
  "Driving License",
  "VISA Document",
  "Other",
];

const statusConfig: Record<DocStatus, { dot: string; bg: string; text: string; border: string }> = {
  Approved: { dot: "bg-[#c2570a]", bg: "bg-orange-50",  text: "text-[#c2570a]",  border: "border-[#fed7aa]"  },
  Pending:  { dot: "bg-amber-500", bg: "bg-amber-50",   text: "text-amber-700",  border: "border-amber-200"  },
  Rejected: { dot: "bg-red-500",   bg: "bg-red-50",     text: "text-red-600",    border: "border-red-200"    },
};

const fileIconColor: Record<string, string> = {
  pdf: "#ef4444", jpg: "#3b82f6", jpeg: "#3b82f6", png: "#8b5cf6",
};

function FileIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "pdf";
  const color = fileIconColor[ext] ?? "#6b7280";
  return (
    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + "18" }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    </div>
  );
}

function formatExpiry(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function DocumentsPage() {
  const [docs, setDocs]                 = useState<Doc[]>([]);
  const [loading, setLoading]           = useState(true);
  const [uploading, setUploading]       = useState(false);
  const [uploadError, setUploadError]   = useState<string | null>(null);
  const [docType, setDocType]           = useState(docTypes[0]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | number | null>(null);
  const [isDragging, setIsDragging]     = useState(false);
  const [expiryDate, setExpiryDate]     = useState<string>("");
  const [noExpiry, setNoExpiry]         = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const expiryKeyframes = `@keyframes fadeSlideIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }`;

  // Load documents from backend on mount
  useEffect(() => {
    fetchDocuments()
      .then((data) => setDocs(data))
      .finally(() => setLoading(false));
  }, []);

  const approved = docs.filter(d => d.status === "Approved").length;
  const pending  = docs.filter(d => d.status === "Pending").length;
  const rejected = docs.filter(d => d.status === "Rejected").length;
  const percent  = docs.length > 0 ? Math.round((approved / docs.length) * 100) : 0;

  function handleNoExpiryToggle(checked: boolean) {
    setNoExpiry(checked);
    if (checked) setExpiryDate("");
  }

  async function handleUpload() {
    if (!uploadedFile) return;
    setUploading(true);
    setUploadError(null);
    try {
      const newDoc = await uploadDocument(
        uploadedFile,
        docType,
        noExpiry ? null : expiryDate || null
      );
      setDocs(prev => [...prev, newDoc]);
      setUploadedFile(null);
      setExpiryDate("");
      setNoExpiry(false);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (deleteTarget === null) return;
    const result = await deleteDocument(deleteTarget);
    if (result.success) {
      setDocs(prev => prev.filter(d => d.id !== deleteTarget));
    }
    setDeleteTarget(null);
  }

  return (
    <main className="w-full flex flex-col gap-5" style={{ minHeight: "calc(100vh - 56px - 56px)" }}>
      <style>{expiryKeyframes}</style>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Documents</h1>
          <p className="text-sm text-gray-500 mt-1">Upload and manage your onboarding documents.</p>
        </div>
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-orange-50 text-[#c2570a] border border-[#fed7aa] flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#c2570a] flex-shrink-0" />
          {approved} of {docs.length} approved
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Approved", value: approved, color: "text-[#c2570a]" },
          { label: "Pending",  value: pending,  color: "text-amber-600" },
          { label: "Rejected", value: rejected, color: "text-red-500"   },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5 text-center">
            <p className={`text-3xl font-extrabold ${s.color} tabular-nums`}>{s.value}</p>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Upload + List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">

        {/* Upload section */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c2570a" strokeWidth="2.5" strokeLinecap="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Upload New Document</p>
              <p className="text-xs text-gray-400">PDF, JPG, or PNG · Max 10 MB</p>
            </div>
          </div>

          {/* Document Type */}
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Document Type</label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#c2570a] appearance-none cursor-pointer"
            >
              {docTypes.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => { setUploadedFile(e.target.files?.[0] ?? null); setUploadError(null); }} />

          {uploadedFile ? (
            <div className="flex items-center gap-3 border border-[#fed7aa] bg-orange-50 rounded-xl px-4 py-3 mb-3">
              <FileIcon name={uploadedFile.name} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{uploadedFile.name}</p>
                <p className="text-xs text-gray-400">{(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB · Ready to upload</p>
              </div>
              <button onClick={() => { setUploadedFile(null); setUploadError(null); }} className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 cursor-pointer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragEnter={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) { setUploadedFile(file); setUploadError(null); }
              }}
              className={`w-full border-2 border-dashed rounded-xl py-6 flex flex-col items-center gap-2 transition-colors mb-3 cursor-pointer ${
                isDragging
                  ? "border-[#c2570a] bg-orange-50/60"
                  : "border-gray-200 hover:border-[#c2570a] hover:bg-orange-50/30"
              }`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
              <p className="text-sm text-gray-500"><span className="text-[#c2570a] font-semibold">Click to browse</span> or drag &amp; drop here</p>
              <p className="text-xs text-gray-400">PDF, JPG, PNG · Max 10 MB</p>
            </button>
          )}

          {/* Expiry Date Section */}
          {uploadedFile && (
            <div className="mb-3 border border-gray-100 rounded-xl px-4 py-3.5 bg-gray-50/60" style={{ animation: "fadeSlideIn 0.2s ease-out" }}>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Expiry Date</label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={noExpiry}
                    onChange={e => handleNoExpiryToggle(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 accent-[#c2570a] cursor-pointer"
                  />
                  <span className="text-xs text-gray-500 font-medium">This document does not expire</span>
                </label>
              </div>
              {noExpiry ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-100 border border-gray-200">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="20 6 9 17 4 12"/></svg>
                  <span className="text-xs text-gray-400 font-medium">No expiry date required</span>
                </div>
              ) : (
                <input
                  type="date"
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#c2570a] focus:border-[#c2570a] transition-all cursor-pointer"
                />
              )}
            </div>
          )}

          {/* Upload error */}
          {uploadError && (
            <div className="mb-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 font-medium">
              ⚠️ {uploadError}
            </div>
          )}

          {uploadedFile && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full py-3 rounded-xl bg-[#c2570a] hover:bg-[#9a3d07] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
                  Uploading…
                </>
              ) : "Upload Document"}
            </button>
          )}
        </div>

        {/* Uploaded list */}
        <div className="flex-1">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c2570a" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <span className="text-sm font-semibold text-gray-800">Uploaded Documents</span>
            </div>
            <span className="text-sm font-semibold text-gray-400 tabular-nums">{approved}/{docs.length}</span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c2570a" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/></svg>
              <p className="text-sm text-gray-400 font-medium">Loading your documents…</p>
            </div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <p className="text-sm font-semibold text-gray-400">No documents yet</p>
              <p className="text-xs text-gray-400">Upload your first document above to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {docs.map(doc => {
                const s = statusConfig[doc.status];
                return (
                  <div key={doc.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors">
                    <FileIcon name={doc.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{doc.type}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{doc.name} · {doc.size} · {doc.uploadedOn}</p>
                      {doc.expiryDate ? (
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          Expires {formatExpiry(doc.expiryDate)}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-300 mt-0.5">No expiry</p>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border flex-shrink-0 ${s.bg} ${s.text} ${s.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                      {doc.status}
                    </span>
                    <button onClick={() => setDeleteTarget(doc.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 cursor-pointer">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center gap-4">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#c2570a] rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-sm text-gray-400 font-medium tabular-nums flex-shrink-0">{percent}% approved</span>
          </div>
        </div>
      </div>

      {/* Delete modal */}
      {deleteTarget !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Remove document?</h3>
            <p className="text-sm text-gray-500 mb-1">This cannot be undone.</p>
            <p className="text-sm text-gray-500 mb-5">The file will be permanently removed from your profile and storage.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-all active:scale-[0.98] cursor-pointer">Remove</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}