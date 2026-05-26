"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useRef } from "react";

const navLinks = [
  {
    href: "/dashboard", label: "Dashboard",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  },
  {
    href: "/tasks", label: "Tasks",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  },
  {
    href: "/documents", label: "Documents",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  },
  {
    href: "/offer", label: "Offer",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [userName, setUserName] = useState("Candidate");
  const [initials, setInitials] = useState("C");

  useEffect(() => {
    const email = sessionStorage.getItem("email") || "";
    if (email) {
      const parsedName = email.split("@")[0];
      const capitalized = parsedName.charAt(0).toUpperCase() + parsedName.slice(1);
      setUserName(capitalized);
      setInitials(capitalized.charAt(0));
    }
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close dropdown on route change
  useEffect(() => { setDropdownOpen(false); }, [pathname]);

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      width: "100%", backgroundColor: "white",
      borderBottom: "1px solid #e5e7eb",
      boxShadow: scrolled ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
    }}>
      <div style={{
        width: "100%", paddingLeft: "0", paddingRight: "24px", height: "64px",
        display: "flex", alignItems: "center", gap: "24px",
      }}>

        {/* LEFT: Logo */}
        <Link href="/dashboard" style={{
          display: "flex", alignItems: "center",
          textDecoration: "none", flexShrink: 0,
          paddingLeft: "16px",
        }}>
          <Image
            src="/logo.png"
            alt="Linnk Group"
            width={160}
            height={56}
            priority
            style={{ objectFit: "contain", height: "56px", width: "auto" }}
          />
        </Link>

        {/* LEFT-CENTER: Nav links */}
        <nav style={{ display: "flex", alignItems: "center", gap: "2px" }}>
          {navLinks.map(({ href, label, icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href} style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "6px 12px", borderRadius: "8px",
                fontSize: "12px", fontWeight: 600, textDecoration: "none",
                transition: "all 0.15s",
                backgroundColor: isActive ? "#fff7ed" : "transparent",
                color: isActive ? "#c2570a" : "#6b7280",
              }}>
                <span style={{ color: isActive ? "#c2570a" : "#9ca3af" }}>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* SPACER */}
        <div style={{ flex: 1 }} />

        {/* RIGHT: Progress pill + user dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>

          {/* Progress pill */}
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            fontSize: "11px", fontWeight: 600, color: "#c2570a",
            backgroundColor: "#fff7ed", border: "1px solid #fed7aa",
            padding: "3px 10px", borderRadius: "999px",
          }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            65%
          </span>

          {/* User dropdown */}
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "4px 8px", borderRadius: "8px", border: "none",
                backgroundColor: dropdownOpen ? "#f3f4f6" : "transparent",
                cursor: "pointer", transition: "background 0.15s",
              }}
            >
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                backgroundColor: "#c2570a", display: "flex",
                alignItems: "center", justifyContent: "center",
                color: "white", fontSize: "11px", fontWeight: 700,
              }}>{initials}</div>
              <div style={{ textAlign: "left", lineHeight: 1.2 }}>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#111827" }}>{userName}</div>
                <div style={{ fontSize: "10px", color: "#9ca3af" }}>User Account</div>
              </div>
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round"
                style={{ transition: "transform 0.2s", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                backgroundColor: "white", border: "1px solid #e5e7eb",
                borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                minWidth: "180px", overflow: "hidden", zIndex: 100,
              }}>
                {/* User info header */}
                <div style={{
                  padding: "12px 16px", borderBottom: "1px solid #f3f4f6",
                  backgroundColor: "#fafafa",
                }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#111827" }}>{userName}</div>
                  <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>User Account</div>
                </div>

                {/* Profile link */}
                <Link href="/profile" style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 16px", textDecoration: "none",
                  fontSize: "13px", fontWeight: 500, color: "#374151",
                  transition: "background 0.15s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  View Profile
                </Link>

                {/* Divider */}
                <div style={{ height: "1px", backgroundColor: "#f3f4f6" }} />

                {/* Sign out */}
                <button style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "10px 16px", width: "100%", border: "none",
                  backgroundColor: "transparent", cursor: "pointer",
                  fontSize: "13px", fontWeight: 500, color: "#ef4444",
                  transition: "background 0.15s", textAlign: "left",
                }}
                  onClick={() => { logout(); router.replace("/auth/login"); }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#fef2f2")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}