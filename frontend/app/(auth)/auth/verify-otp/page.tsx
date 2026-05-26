"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { resendOtp } from "@/lib/api/auth";
import Image from "next/image";

const RESEND_COUNTDOWN = 60;

export default function VerifyOtpPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email,     setEmail]     = useState("");
  const [code,      setCode]      = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);
  const [resending, setResending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("email");
    if (!stored) {
      router.replace("/auth/login");
    } else {
      setEmail(stored);
    }
  }, [router]);

  // Start countdown on mount
  useEffect(() => {
    startCountdown();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startCountdown() {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(RESEND_COUNTDOWN);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleResend() {
    setError("");
    const token = sessionStorage.getItem("resendToken");
    if (!token) {
      setError("Session expired. Please log in again.");
      return;
    }
    
    setResending(true);
    try {
      await resendOtp(token);
      startCountdown();
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP. Please try again later.");
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!code.trim() || code.trim().length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message ?? "Invalid or expired code. Please try again.");
      }

      const { accessToken, role } = await res.json();
      login(accessToken);
      
      const normalizedRole = role?.toLowerCase();
      if (normalizedRole === 'hr' || normalizedRole === 'manager') {
        localStorage.setItem('auth_token', accessToken);
        router.push("/hr");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify OTP.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "linear-gradient(135deg, #f0eeec 0%, #f5f4f2 55%, #fde8d8 100%)",
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

          {/* Title */}
          <div className="text-center flex flex-col gap-1">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Verify OTP</h1>
            <p className="text-sm text-gray-500">Enter the 6-digit code sent to your email</p>
          </div>

          {/* Email pill */}
          {email && (
            <div className="flex items-center justify-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-[#fed7aa] text-sm font-semibold text-[#c2570a]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                {email}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

            {/* OTP input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="code" className="text-sm font-semibold text-gray-700">
                6-Digit Code
              </label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={e => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
                placeholder="••••••"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white text-center tracking-[0.5em] font-bold placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#c2570a] focus:border-[#c2570a] transition-all"
              />
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
                  Verifying…
                </span>
              ) : (
                "Verify OTP"
              )}
            </button>

            {/* Resend OTP */}
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0 || resending}
              className="w-full py-3 rounded-xl border border-gray-200 text-sm font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed cursor-pointer"
              style={{
                color: countdown > 0 ? "#9ca3af" : "#c2570a",
                background: countdown > 0 ? "#f9fafb" : "#fff7ed",
                borderColor: countdown > 0 ? "#e5e7eb" : "#fed7aa",
              }}
            >
              {resending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Sending…
                </span>
              ) : countdown > 0 ? (
                `Resend OTP in ${countdown}s`
              ) : (
                "Resend OTP"
              )}
            </button>
          </form>

          {/* Back to login */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => router.push("/auth/login")}
              className="text-xs text-gray-400 hover:text-[#c2570a] transition-colors font-medium cursor-pointer"
            >
              ← Back to login
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}