export interface AltchaChallenge {
  challenge: string;
  salt: string;
  algorithm: string;
  signature: string;
}

export interface SendOtpResponse {
  resendToken: string;
  message: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function fetchAltchaChallenge(): Promise<AltchaChallenge> {
  const res = await fetch(`${API_URL}/auth/altcha-challenge`, { method: "GET" });
  if (!res.ok) throw new Error("Failed to fetch ALTCHA challenge");
  return res.json();
}

export async function sendOtp(
  email: string,
  captchaToken: string,
  selectedRole: string = "candidate",
  password?: string
): Promise<SendOtpResponse> {
  const res = await fetch(`${API_URL}/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      captchaToken,
      selectedRole,
      password,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to send OTP");
  }

  return res.json();
}

export async function resendOtp(resendToken: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/auth/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resendToken }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to resend OTP");
  }

  return res.json();
}