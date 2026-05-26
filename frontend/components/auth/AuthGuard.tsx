"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  const isAuthRoute = pathname.startsWith("/auth");

  useEffect(() => {
    if (isAuthRoute) {
      setChecked(true);
      return;
    }
    if (!isAuthenticated) {
      router.replace("/auth/login");
    } else {
      setChecked(true);
    }
  }, [isAuthenticated, isAuthRoute, router]);

  if (!checked && !isAuthRoute) return null;

  return <>{children}</>;
}