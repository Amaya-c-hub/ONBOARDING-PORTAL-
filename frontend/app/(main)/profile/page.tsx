"use client";
import { useState, useEffect } from "react";
import { fetchProfile, updateProfile } from "@/lib/api/profile";
import type { ProfileData } from "@/lib/api/profile";

interface ProfileField {
  key:         keyof ProfileData;
  label:       string;
  type:        string;
  placeholder: string;
}

const FIELDS: ProfileField[] = [
  { key: "name",    label: "Full Name",    type: "text",  placeholder: "e.g. Sidharth M"              },
  { key: "email",   label: "Email Address", type: "email", placeholder: "e.g. sidharth@acmecorp.com"  },
  { key: "phone",   label: "Phone Number", type: "tel",   placeholder: "e.g. +91 98765 43210"         },
  { key: "address", label: "Home Address", type: "text",  placeholder: "e.g. Chennai, Tamil Nadu, IN" },
];

const EMPTY: ProfileData = { name: "", email: "", phone: "", address: "" };

function completionPercent(data: ProfileData): number {
  const filled = Object.values(data).filter(v => v.trim() !== "").length;
  return Math.round((filled / FIELDS.length) * 100);
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(EMPTY);
  const [draft,   setDraft]   = useState<ProfileData>(EMPTY);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchProfile().then((data) => {
      setProfile(data);
      setDraft(data);
    });
  }, []);

  const percent = completionPercent(profile);

  function handleEdit() {
    setDraft({ ...profile });
    setEditing(true);
  }

  async function handleSave() {
    // Optimistic update — reflect changes immediately
    setProfile({ ...draft });
    setEditing(false);
    await updateProfile(draft);
  }

  function handleCancel() {
    setDraft({ ...profile });
    setEditing(false);
  }

  return (
    <main className="w-full flex flex-col gap-6" style={{ minHeight: "calc(100vh - 56px - 56px)" }}>

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Keep your personal details up to date.</p>
        </div>

        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold flex-shrink-0 border ${
          percent === 100
            ? "bg-teal-50 text-teal-700 border-teal-200"
            : "bg-amber-50 text-amber-700 border-amber-200"
        }`}>
          <span className={`w-2 h-2 rounded-full ${percent === 100 ? "bg-teal-500" : "bg-amber-500"}`} />
          {percent === 100 ? "Profile Complete" : `${percent}% complete`}
        </span>
      </div>

      {/* ── Profile card ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">

        {/* Card header */}
        <div className="px-8 pt-7 pb-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c2570a" strokeWidth="2.5" strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <span className="text-base font-semibold text-gray-800">Personal Information</span>
          </div>

          {!editing ? (
            <button
              onClick={handleEdit}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#c2570a] hover:text-[#7c2d12] bg-orange-50 hover:bg-orange-100 border border-[#ffedd5] px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="text-xs font-semibold text-white bg-[#c2570a] hover:bg-[#9a3d07] px-4 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* Avatar row */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-orange-50 border-2 border-[#ffedd5] flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-extrabold text-[#c2570a]">
              {profile.name
                ? profile.name.split(" ").map(n => n[0]).slice(0, 2).join("")
                : "—"}
            </span>
          </div>
          <div>
            <p className="text-base font-bold text-gray-900">{profile.name || "—"}</p>
            <p className="text-sm text-gray-400">{profile.email || "—"}</p>
          </div>
        </div>

        {/* Fields */}
        <div className="divide-y divide-gray-100">
          {FIELDS.map(field => (
            <div key={field.key} className="px-8 py-5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest sm:w-36 flex-shrink-0">
                {field.label}
              </label>
              {editing ? (
                <input
                  type={field.type}
                  value={draft[field.key]}
                  onChange={e => setDraft(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#c2570a] transition-shadow"
                />
              ) : (
                <p className={`flex-1 text-sm font-medium ${profile[field.key] ? "text-gray-800" : "text-gray-400 italic"}`}>
                  {profile[field.key] || "Not provided"}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Completion card ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Profile Completion</p>
        <p className="text-sm text-gray-500 mb-4">Fill in all fields to complete your profile.</p>

        <div className="flex items-center gap-4 mb-5">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-[#c2570a] transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-sm font-bold text-[#c2570a] tabular-nums flex-shrink-0">{percent}%</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {FIELDS.map(field => {
            const filled = profile[field.key].trim() !== "";
            return (
              <div key={field.key} className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  filled ? "bg-orange-50 border border-[#fed7aa]" : "border-2 border-gray-200"
                }`}>
                  {filled && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#c2570a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span className={`text-sm ${filled ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                  {field.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </main>
  );
}