"use client";
import { useEffect, useRef, useState } from "react";

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        "altcha-widget": React.DetailedHTMLProps<
          React.HTMLAttributes<HTMLElement> & { challengejson?: string },
          HTMLElement
        >;
      }
    }
  }
}

interface AltchaWidgetProps {
  onVerify: (token: string) => void;
}

type Status = "loading" | "ready" | "error";

export default function AltchaWidget({ onVerify }: AltchaWidgetProps) {
  const widgetRef = useRef<HTMLElement | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [challengeJson, setChallengeJson] = useState<string>("");

  // Load ALTCHA script once on mount
  useEffect(() => {
    if (document.querySelector('script[data-altcha]')) return;
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/altcha/dist/altcha.min.js";
    script.type = "module";
    script.dataset.altcha = "1";
    document.head.appendChild(script);
  }, []);

  // Fetch challenge from backend
  useEffect(() => {
    let cancelled = false;
    async function fetchChallenge() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/altcha-challenge`);
        if (!res.ok) throw new Error("Challenge fetch failed");
        const data = await res.json();
        if (!cancelled) {
          setChallengeJson(JSON.stringify(data));
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }
    fetchChallenge();
    return () => { cancelled = true; };
  }, []);

  // Attach statechange listener once widget is in DOM
  useEffect(() => {
    const el = widgetRef.current;
    if (!el) return;

    function handleStateChange(e: Event) {
      const ev = e as CustomEvent<{ state: string; payload?: string }>;
      if (ev.detail?.state === "verified" && ev.detail.payload) {
        onVerify(ev.detail.payload);
      }
    }

    el.addEventListener("statechange", handleStateChange);
    return () => el.removeEventListener("statechange", handleStateChange);
  }, [status, onVerify]);

  if (status === "loading") {
    return (
      <div className="w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-4 flex flex-col items-center gap-2">
        <span className="text-sm text-gray-300 animate-pulse">Loading captcha…</span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="w-full rounded-xl border border-dashed border-red-200 bg-red-50 px-4 py-4 flex flex-col items-center gap-2">
        <span className="text-sm text-red-400">Captcha unavailable. Please try again later.</span>
        {process.env.NODE_ENV === "development" && (
          <button
            type="button"
            onClick={() => onVerify("mock-captcha-token")}
            className="mt-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors"
          >
            Bypass Captcha (Dev Mode)
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-4 flex flex-col items-center gap-2">
      <altcha-widget
        ref={widgetRef as React.RefObject<HTMLElement>}
        challengejson={challengeJson}
        style={{ width: "100%" }}
      />
    </div>
  );
}