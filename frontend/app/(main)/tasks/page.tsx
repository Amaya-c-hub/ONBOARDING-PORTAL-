"use client";
import { useState } from "react";

type Filter = "All" | "Pending" | "Completed";

interface Task {
  id: number;
  label: string;
  description: string;
  category: string;
  required: boolean;
  done: boolean;
}

const initialTasks: Task[] = [
  { id: 1, label: "Verify personal details",    description: "Confirm your name, address, and contact information in your profile.",              category: "Verification", required: false, done: true  },
  { id: 2, label: "Upload required documents",  description: "Submit your Passport, Educational Certificate, Experience Letter, and Insurance Card.", category: "Documents",    required: false, done: true  },
  { id: 3, label: "Sign offer letter",          description: "Review and digitally sign your offer letter before the expiry date.",                 category: "Legal",        required: true,  done: false },
  { id: 4, label: "Complete IT setup form",     description: "Fill in your equipment preferences and remote/on-site setup requirements.",           category: "IT Setup",     required: true,  done: false },
  { id: 5, label: "Acknowledge HR policies",    description: "Read and confirm acceptance of the company's code of conduct and HR policies.",       category: "HR",           required: true,  done: false },
  { id: 6, label: "Set up company email",       description: "Log in to your assigned company email and complete the account setup.",               category: "IT Setup",     required: false, done: false },
  { id: 7, label: "Join onboarding Slack",      description: "Accept the invite and introduce yourself in #onboarding and your team channel.",      category: "HR",           required: false, done: false },
];

const categoryColors: Record<string, { bg: string; text: string }> = {
  Verification: { bg: "bg-teal-50",   text: "text-teal-700"   },
  Documents:    { bg: "bg-blue-50",   text: "text-blue-700"   },
  Legal:        { bg: "bg-purple-50", text: "text-purple-700" },
  "IT Setup":   { bg: "bg-orange-50", text: "text-orange-700" },
  HR:           { bg: "bg-pink-50",   text: "text-pink-700"   },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filter, setFilter] = useState<Filter>("All");

  const completed     = tasks.filter(t => t.done).length;
  const pending       = tasks.filter(t => !t.done).length;
  const required      = tasks.filter(t => t.required && t.done).length;
  const totalRequired = tasks.filter(t => t.required).length;
  const percent       = Math.round((completed / tasks.length) * 100);

  const visible = tasks.filter(t =>
    filter === "All" ? true : filter === "Completed" ? t.done : !t.done
  );

  function toggle(id: number) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  }

  const allDone = tasks.every(t => t.done);

  return (
    <main className="w-full flex flex-col gap-5" style={{ minHeight: "calc(100vh - 56px - 56px)" }}>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tasks</h1>
        <p className="text-sm text-gray-500 mt-1">Complete all required tasks to finish your onboarding.</p>
      </div>

      {/* Progress card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Overall Progress</p>
            <p className="text-xs text-gray-400 mt-0.5">Based on all tasks including optional</p>
          </div>
          <span className="text-3xl font-extrabold text-[#c2570a] tabular-nums">{percent}%</span>
        </div>
        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
          <div className="h-full rounded-full bg-[#c2570a] transition-all duration-700" style={{ width: `${percent}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Completed",     value: completed,                 color: "text-[#c2570a]"  },
            { label: "Pending",       value: pending,                   color: "text-amber-600" },
            { label: "Required Done", value: `${required}/${totalRequired}`, color: "text-gray-700" },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-xl px-4 py-3 text-center border border-gray-100">
              <p className={`text-2xl font-extrabold tabular-nums ${s.color}`}>{s.value}</p>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter + list */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col flex-1 overflow-hidden">

        {/* Filter tabs */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          {(["All", "Pending", "Completed"] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-colors
                ${filter === f ? "bg-[#c2570a] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* All done */}
        {allDone && filter !== "Pending" && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c2570a" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p className="text-base font-bold text-gray-800">All tasks completed!</p>
            <p className="text-sm text-gray-400">Great work, Sidharth — you're all set.</p>
          </div>
        )}

        {/* Empty filter state */}
        {visible.length === 0 && !allDone && (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <p className="text-sm font-semibold text-gray-400">No tasks here</p>
            <p className="text-xs text-gray-400">{filter === "Completed" ? "You haven't completed any tasks yet." : "All tasks are done — great work!"}</p>
          </div>
        )}

        {/* Task list */}
        <div className="divide-y divide-gray-100 flex-1">
          {visible.map(task => {
            const cat = categoryColors[task.category] ?? { bg: "bg-gray-50", text: "text-gray-600" };
            return (
              <div
                key={task.id}
                onClick={() => toggle(task.id)}
                className={`group flex items-start gap-4 px-6 py-4 cursor-pointer transition-colors hover:bg-gray-50/60
                  ${task.done ? "opacity-60" : ""}`}
              >
                {/* Checkbox */}
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors
                  ${task.done ? "bg-[#c2570a] border-[#c2570a]" : "border-gray-300 group-hover:border-[#c2570a]"}`}>
                  {task.done && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-sm font-semibold ${task.done ? "line-through text-gray-400" : "text-gray-800"}`}>
                      {task.label}
                    </span>
                    {task.required && !task.done && (
                      <span className="text-xs font-bold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">Required</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed mb-2">{task.description}</p>
                  <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${cat.bg} ${cat.text}`}>
                    {task.category}
                  </span>
                </div>
                {/* Done indicator */}
                {task.done && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c2570a" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0 mt-1"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </main>
  );
}