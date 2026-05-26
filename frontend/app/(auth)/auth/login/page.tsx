"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sendOtp } from "@/lib/api/auth";
import AltchaWidget from "@/components/auth/AltchaWidget";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();

  const [email,          setEmail]          = useState("");
  const [captchaToken,   setCaptchaToken]   = useState("");
  const [selectedRole,   setSelectedRole]   = useState("candidate");
  const [password,       setPassword]       = useState("");
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!captchaToken) {
      setError("Please complete the captcha verification.");
      return;
    }
    if ((selectedRole === "hr" || selectedRole === "manager") && !password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const { resendToken } = await sendOtp(email.trim(), captchaToken, selectedRole, password);
      sessionStorage.setItem("resendToken", resendToken);
      sessionStorage.setItem("email",       email.trim());
      router.push("/auth/verify-otp");
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "linear-gradient(135deg, #f0eeec 0%, #f5f4f2 55%, #fde8d8 100%)",
        zIndex: 50,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 w-[520px] h-[520px] opacity-30"
        style={{
          background: "radial-gradient(ellipse at top right, #fdba74 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-[420px]">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg px-6 py-8 flex flex-col gap-5">

          {/* Logo */}
          <div className="flex justify-center">
            <Image
              src="/logo.png"
              alt="Linnk Group"
              width={140}
              height={50}
              priority
            />
          </div>


          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

            {/* Email input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Work Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  placeholder=""
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#c2570a] focus:border-[#c2570a] transition-all"
                />
              </div>
            </div>

            {/* Role input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="role" className="text-sm font-semibold text-gray-700">
                Login As
              </label>
              <select
                id="role"
                value={selectedRole}
                onChange={e => { setSelectedRole(e.target.value); setError(""); }}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#c2570a] focus:border-[#c2570a] transition-all"
              >
                <option value="candidate">Candidate</option>
                <option value="hr">HR</option>
                <option value="manager">Manager</option>
              </select>
            </div>

            {/* Password input (only for HR/Manager) */}
            {(selectedRole === "hr" || selectedRole === "manager") && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#c2570a] focus:border-[#c2570a] transition-all"
                />
              </div>
            )}

            {/* Captcha */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-700">
                  Security Verification
                </label>
                <span className="text-xs text-gray-400">AltchaWidget</span>
              </div>
              <AltchaWidget onVerify={setCaptchaToken} />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600 font-medium flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white text-sm font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{
                background: loading
                  ? "#d97706"
                  : "linear-gradient(to right, #c2570a, #ea580c)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Sending OTP…
                </span>
              ) : (
                "Send OTP"
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}