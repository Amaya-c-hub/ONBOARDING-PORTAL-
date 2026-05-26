"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  const isHrRoute = pathname ? pathname.startsWith("/hr") : false;

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    if (!token) {
      router.replace("/auth/login");
      return;
    }

    try {
      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));
      const role = payload.role?.toLowerCase();

      if ((role === "hr" || role === "manager") && !isHrRoute) {
        router.replace("/hr");
      } else if (role === "candidate" && isHrRoute) {
        router.replace("/dashboard");
      } else {
        setAuthorized(true);
      }
    } catch (e) {
      console.error("Token validation failed:", e);
      router.replace("/auth/login");
    }
  }, [pathname, router, isHrRoute]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c2570a" strokeWidth="2">
          <circle cx="12" cy="12" r="10" strokeOpacity="0.2"/>
          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
        </svg>
      </div>
    );
  }

  return (
    <>
      {!isHrRoute && <Navbar />}
      <main className={isHrRoute ? "" : "w-full px-6 py-6"}>
        {children}
      </main>
    </>
  );
}