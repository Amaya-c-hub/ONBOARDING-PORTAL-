"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchTasks } from "@/lib/api/tasks";
import { fetchDocuments } from "@/lib/api/documents";
import { fetchOffer } from "@/lib/api/offer";
import type { Task } from "@/lib/api/tasks";
import type { Doc } from "@/lib/api/documents";
import type { Offer } from "@/lib/api/offer";

// Dynamic info will be loaded in the component

const stages = ["Login", "Documents", "HR Review", "Offer", "Complete"];

function Card({ children, className = "", noPad = false, style }: {
  children: React.ReactNode; className?: string; noPad?: boolean; style?: React.CSSProperties;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${className}`} style={style}>
      <div className={noPad ? "" : "px-6 py-5"}>{children}</div>
    </div>
  );
}

function CardHeader({ icon, iconBg, title, badge, badgeStyle }: {
  icon: React.ReactNode; iconBg: string; title: string; badge?: string; badgeStyle?: string;
}) {
  return (
    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>{icon}</div>
        <span className="text-base font-semibold text-gray-800">{title}</span>
      </div>
      {badge && (
        <span className={`text-sm font-semibold px-3 py-1 rounded-full tabular-nums flex-shrink-0 ${badgeStyle}`}>{badge}</span>
      )}
    </div>
  );
}

function SectionLabel({ title, subtitle, href, linkLabel }: {
  title: string; subtitle?: string; href?: string; linkLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3 gap-4">
      <div>
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#c2570a] hover:text-[#7c2d12] bg-orange-50 hover:bg-orange-100 border border-[#ffedd5] px-3.5 py-1.5 rounded-full transition-colors flex-shrink-0"
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

function MiniBar({ value, color = "bg-[#c2570a]" }: { value: number; color?: string }) {
  return (
    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${value}%` }} />
    </div>
  );
}

const CheckIcon = ({ stroke }: { stroke: string }) => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

function offerStatusLabel(status: Offer["status"]) {
  if (status === "signed")   return "Signed";
  if (status === "rejected") return "Declined";
  return "Awaiting Signature";
}

function offerStatusStyle(status: Offer["status"]) {
  if (status === "signed")   return "bg-teal-50 text-teal-700 border border-teal-200";
  if (status === "rejected") return "bg-red-50 text-red-600 border border-red-200";
  return "bg-amber-50 text-amber-700 border border-amber-200";
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [docs,  setDocs]  = useState<Doc[]>([]);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [userName, setUserName] = useState("Candidate");

  useEffect(() => {
    const email = sessionStorage.getItem("email") || "";
    if (email) {
      const parsedName = email.split("@")[0];
      setUserName(parsedName.charAt(0).toUpperCase() + parsedName.slice(1));
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchTasks(), fetchDocuments(), fetchOffer()]).then(([t, d, o]) => {
      setTasks(t);
      setDocs(d);
      setOffer(o);
      if (o && o.candidateName && o.candidateName !== "Candidate") {
        setUserName(o.candidateName);
      }
    });
  }, []);

  const tasksCompleted  = tasks.filter(t => t.done).length;
  const tasksTotal      = tasks.length;
  const taskPercent     = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;
  const docsApproved    = docs.filter(d => d.status === "Approved").length;
  const docsTotal       = docs.length;
  const docPercent      = docsTotal > 0 ? Math.round((docsApproved / docsTotal) * 100) : 0;
  const overallProgress = Math.round((taskPercent + docPercent) / 2);
  const taskPreview     = tasks.slice(0, 5);
  const docPreview      = docs.slice(0, 4).map(d => ({ name: d.type, done: d.status === "Approved" }));

  return (
    <main className="w-full flex flex-col gap-5 overflow-x-hidden" style={{ minHeight: "calc(100vh - 56px - 56px)", boxSizing: "border-box" }}>

      {/* ── 1. HERO ── */}
      <Card className="overflow-hidden flex-shrink-0" noPad>
        <div className="h-1 w-full bg-gradient-to-r from-[#c2570a] via-[#a84608] to-[#9a3d07]" />
        <div className="px-6 py-5 flex flex-col gap-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#c2570a] bg-orange-50 border border-[#fed7aa] px-2.5 py-1 rounded-full self-start">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c2570a] animate-pulse" />
            Onboarding in progress
          </span>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
                Welcome back,{" "}
                <span className="text-[#c2570a]">{userName}.</span>
              </h1>
              <p className="text-base font-medium text-gray-500">
                You&apos;re <span className="font-bold text-[#c2570a]">{overallProgress}% done</span> — just a few steps left.
              </p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Joining as{" "}
                <span className="font-semibold text-gray-700">{offer?.role || "Frontend Engineer"}</span>{" "}
                in <span className="font-medium text-gray-600">{offer?.department || "Product & Engineering"}</span>.{" "}
                Start date:{" "}
                <span className="font-semibold text-gray-700">{offer?.joiningDate || "May 12, 2026"}</span>.
              </p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
              <Link
                href="/tasks"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#c2570a] hover:bg-[#9a3d07] active:scale-[0.98] text-white text-sm font-bold transition-all shadow-sm tracking-wide whitespace-nowrap"
              >
                Continue Onboarding
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <p className="text-sm text-gray-400 font-medium">
                {tasksCompleted} of {tasksTotal} tasks complete
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* ── 2. PROGRESS ── */}
      <Card className="flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Onboarding Progress</h2>
            <p className="text-xs text-gray-400 mt-0.5">Track your completion across all stages</p>
          </div>
          <span className="text-3xl font-extrabold text-[#c2570a] tabular-nums">{overallProgress}%</span>
        </div>
        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden mb-6">
          <div className="h-full rounded-full bg-[#c2570a] transition-all duration-700" style={{ width: `${overallProgress}%` }} />
        </div>
        <div className="relative flex justify-between">
          <div className="absolute top-[16px] left-[5%] right-[5%] h-px bg-gray-200" />
          {stages.map((stage, i) => {
            const isDone   = i === 0;
            const isActive = i === 1;
            return (
              <div key={stage} className="relative z-10 flex flex-col items-center gap-2 w-[18%]">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors
                  ${isDone   ? "bg-[#c2570a] border-[#c2570a] text-white"
                  : isActive ? "bg-white border-[#c2570a] text-[#c2570a]"
                             : "bg-white border-gray-200 text-gray-400"}`}
                >
                  {isDone
                    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    : <span>{i + 1}</span>}
                </div>
                <span className={`text-xs font-semibold text-center leading-tight w-full truncate
                  ${isDone ? "text-[#c2570a]" : isActive ? "text-gray-700" : "text-gray-400"}`}>
                  {stage}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── 3 + 4. TASKS & DOCUMENTS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 flex-shrink-0" style={{ minHeight: "400px" }}>

        {/* TASKS */}
        <section className="flex flex-col gap-3">
          <SectionLabel
            title="Tasks"
            subtitle={`${tasksCompleted} of ${tasksTotal} completed`}
            href="/tasks"
            linkLabel="View all"
          />
          <Card style={{ minHeight: "360px" }} noPad>
            <CardHeader
              iconBg="bg-orange-50"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c2570a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
              title="Onboarding Checklist"
              badge={`${tasksCompleted}/${tasksTotal}`}
              badgeStyle="bg-orange-50 text-[#c2570a] border border-[#ffedd5]"
            />
            <div className="divide-y divide-gray-100">
              {taskPreview.map((task) => (
                <div key={task.id} className="group flex items-center gap-4 px-6 py-4 hover:bg-gray-50/80 transition-colors duration-150">
                  {task.done ? (
                    <span className="w-5 h-5 rounded-full bg-orange-50 border border-[#fed7aa] flex items-center justify-center flex-shrink-0">
                      <CheckIcon stroke="#c2570a" />
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-gray-400 flex-shrink-0 transition-colors" />
                  )}
                  <span className={`text-[15px] flex-1 ${task.done ? "line-through text-gray-400" : "text-gray-700 font-medium"}`}>
                    {task.label}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0
                    ${task.done
                      ? "bg-orange-50 text-[#c2570a] border border-[#ffedd5]"
                      : "bg-gray-100 text-gray-500 border border-gray-200"}`}>
                    {task.done ? "Done" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center gap-4">
              <div className="flex-1"><MiniBar value={taskPercent} /></div>
              <span className="text-sm text-gray-400 tabular-nums font-medium flex-shrink-0">{taskPercent}% complete</span>
            </div>
          </Card>
        </section>

        {/* DOCUMENTS */}
        <section className="flex flex-col gap-3">
          <SectionLabel
            title="Documents"
            subtitle={`${docsApproved} of ${docsTotal} approved`}
            href="/documents"
            linkLabel="Manage"
          />
          <Card style={{ minHeight: "360px" }} noPad>
            <CardHeader
              iconBg="bg-orange-50"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c2570a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
              title="Required Documents"
              badge={`${docsApproved}/${docsTotal}`}
              badgeStyle="bg-orange-50 text-[#c2570a] border border-[#ffedd5]"
            />
            <div className="divide-y divide-gray-100">
              {docPreview.map((doc) => (
                <div key={doc.name} className="group flex items-center gap-4 px-6 py-4 hover:bg-gray-50/80 transition-colors duration-150">
                  {doc.done ? (
                    <span className="w-5 h-5 rounded-full bg-orange-50 border border-[#fed7aa] flex items-center justify-center flex-shrink-0">
                      <CheckIcon stroke="#c2570a" />
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full border-2 border-amber-300 bg-amber-50 flex-shrink-0" />
                  )}
                  <span className={`text-[15px] flex-1 ${doc.done ? "text-gray-700 font-medium" : "text-gray-500"}`}>
                    {doc.name}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0
                    ${doc.done
                      ? "bg-orange-50 text-[#c2570a] border border-[#ffedd5]"
                      : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                    {doc.done ? "Approved" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center gap-4">
              <div className="flex-1"><MiniBar value={docPercent} color="bg-[#c2570a]" /></div>
              <span className="text-sm text-gray-400 tabular-nums font-medium flex-shrink-0">{docPercent}% approved</span>
            </div>
          </Card>
        </section>
      </div>

      {/* ── 5. OFFER ── */}
      <section className="flex flex-col gap-3 flex-1 min-h-0">
        <SectionLabel
          title="Offer Letter"
          subtitle="Review and sign before the expiry date"
          href="/offer"
          linkLabel="View offer"
        />
        <Card className="flex flex-col flex-1" noPad>
          <CardHeader
            iconBg="bg-amber-50"
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>}
            title="Offer Letter"
          />
          <div className="flex-1 px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {offer ? (
              <>
                <div className="flex flex-col gap-2">
                  <p className="text-xl font-bold text-gray-800">{offer.role}</p>
                  <p className="text-sm text-gray-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>Starts <span className="font-semibold text-gray-600">{offer.joiningDate}</span></span>
                    <span className="text-gray-300">·</span>
                    <span>Expires <span className="font-semibold text-red-500">{offer.expiresOn}</span></span>
                  </p>
                  <p className="text-sm text-gray-400 max-w-md leading-relaxed">
                    Your offer letter is ready for review. Please read it carefully and respond before the expiry date.
                  </p>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-3 flex-shrink-0">
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${offerStatusStyle(offer.status)}`}>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0
                      ${offer.status === "signed" ? "bg-teal-500" : offer.status === "rejected" ? "bg-red-500" : "bg-amber-500"}`}
                    />
                    {offerStatusLabel(offer.status)}
                  </span>
                  <Link
                    href="/offer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c2570a] hover:bg-[#9a3d07] text-white text-sm font-bold transition-all active:scale-[0.98]"
                  >
                    {offer.status === "pending" ? "Review & Sign" : "View Offer"}
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400">Loading offer details…</p>
            )}
          </div>
        </Card>
      </section>

    </main>
  );
}
