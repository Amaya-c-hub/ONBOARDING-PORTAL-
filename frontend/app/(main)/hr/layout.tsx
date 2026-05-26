"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FileCheck2, 
  Files, 
  Users, 
  FileText, 
  Globe2, 
  Settings, 
  LogOut,
  Search as SearchIcon,
  Bell,
  Plus,
  X,
  Clock,
  ShieldCheck,
  ChevronRight,
  Mail,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function HrLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authChecked, setAuthChecked] = useState(false);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pathname === "/hr/login") {
      setAuthChecked(true);
      return;
    }
    
    const token = localStorage.getItem("auth_token");
    if (!token) {
      router.push("/hr/login");
      return;
    }

    try {
      // Manual JWT decode to extract identity block without external libs
      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));
      
      const normalizedRole = payload.role?.toLowerCase();
      if (normalizedRole !== "hr" && normalizedRole !== "manager") {
        console.error("Access Denied: Insufficient Clearance Level");
        localStorage.removeItem("auth_token");
        router.push("/hr/login");
      } else {
        setAuthChecked(true);
        if (payload.email) {
          const namePart = payload.email.split("@")[0];
          setAdminName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
        }
      }
    } catch (e) {
      console.error("Security manifest corrupted");
      localStorage.removeItem("auth_token");
      router.push("/hr/login");
    }
  }, [pathname, router]);



  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchActivities = async () => {
    setActivityLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${API}/hr/activity`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        setActivities(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${API}/hr/invite`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ email: inviteEmail, firstName: inviteFirstName, lastName: inviteLastName }),
      });
      if (res.ok) {
        alert("Candidate invited successfully!");
        setShowInviteModal(false);
        setInviteEmail("");
        setInviteFirstName("");
        setInviteLastName("");
      } else {
        const err = await res.json();
        alert(`Error: ${err.message}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to invite candidate.");
    } finally {
      setInviteLoading(false);
    }
  };

  if (!authChecked) return null;

  if (pathname === "/hr/login") {
    return <>{children}</>;
  }

  const workspaceLinks = [
    { name: "Dashboard", href: "/hr/dashboard", icon: LayoutDashboard },
    { name: "Review Queue", href: "/hr", icon: FileCheck2 },
    { name: "Offers", href: "/hr/offers", icon: Files },
    { name: "Candidates", href: "/hr/candidates", icon: Users },
    { name: "Documents", href: "/hr/documents", icon: FileText },
  ];

  const orgLinks = [
    { name: "Regions", href: "/hr/regions", icon: Globe2 },
    { name: "Settings", href: "/hr/settings", icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem("hr_auth");
    localStorage.removeItem("auth_token");
    router.push("/");
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans selection:bg-[#c2570a]/30">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-8 flex items-center gap-3">
            <img src="/logo.png" alt="Linnk Global" className="h-8 object-contain" />
          </div>

          <div className="px-6 py-4">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6 px-1">Workspace</div>
            <nav className="space-y-1.5">
              {workspaceLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link 
                    key={link.name} 
                    href={link.href}
                    className={`group flex items-center justify-between px-4 py-3 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                        isActive 
                        ? "text-white bg-[#c2570a] shadow-md shadow-[#c2570a]/20" 
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <link.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                      {link.name}
                    </div>
                    {isActive && <motion.div layoutId="nav-pill" className="w-1 h-4 bg-white/30 rounded-full" />}
                  </Link>
                )
              })}
            </nav>

            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-6 px-1 mt-10">Administration</div>
            <nav className="space-y-1.5">
              {orgLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className="group flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
                >
                  <link.icon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Profile Block */}
        <div className="p-6 m-4 mt-0 rounded-2xl bg-gray-50 border border-gray-200 shadow-sm transition-all hover:border-gray-300">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c2570a] to-[#9a3d07] flex items-center justify-center text-[13px] font-black text-white shadow-sm shrink-0">
                {adminName.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-gray-900 truncate leading-tight">{adminName}</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5 truncate leading-tight">System Primary</span>
              </div>
            </div>
              <button 
                  onClick={handleLogout} 
                  className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all shrink-0" 
                  title="Secure Sign Out">
                <LogOut className="w-4 h-4" />
              </button>
              {/* Added Sign Out link for HR/Manager dashboards */}
              <Link href="/hr/signout" className="ml-4 text-sm font-medium text-gray-600 hover:text-red-600">
                Sign Out
              </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="h-[72px] border-b border-gray-200 flex items-center justify-between px-10 bg-white shrink-0">
          <div className="flex items-center text-[12px] font-bold tracking-wide">
            <span className="text-gray-400 uppercase tracking-widest">Platform</span>
            <ChevronRight className="mx-2 w-3 h-3 text-gray-300" />
            <span className="text-[#c2570a] uppercase tracking-widest font-black">
              {pathname === "/hr" ? "Review Queue" : pathname.split("/").pop()?.replace("-", " ") || "Dashboard"}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <div 
                className="flex items-center gap-4 bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl group focus-within:border-[#c2570a]/50 focus-within:ring-4 focus-within:ring-[#c2570a]/5 transition-all cursor-pointer" 
                onClick={() => setShowSearch(true)}
            >
                <SearchIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                <span className="text-xs text-gray-500 font-bold tracking-tight">Search Operations...</span>
                <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-gray-200 bg-white px-1.5 font-mono text-[9px] font-bold text-gray-400 shadow-sm">
                    <span className="text-[10px]">⌘</span>K
                </kbd>
            </div>

            <div className="relative flex items-center" ref={notificationRef}>
              <button
                onClick={() => { setShowNotifications(!showNotifications); if(!showNotifications) fetchActivities(); }}
                className={`relative p-2.5 rounded-xl border transition-all duration-200 ${
                  showNotifications
                    ? 'bg-orange-50 border-[#ffedd5] text-[#c2570a] shadow-inner'
                    : 'bg-white border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#c2570a] rounded-full border-2 border-white" />
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all shrink-0 ml-4"
              title="Secure Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                    {showNotifications && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-4 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-[100] origin-top-right"
                        >
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-800">System Feed</span>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider">Live</span>
                                </div>
                            </div>
                            <div className="max-h-[380px] overflow-auto custom-scrollbar">
                                {activityLoading ? (
                                    <div className="p-10 text-center flex flex-col items-center gap-3">
                                        <Loader2 className="w-5 h-5 text-[#c2570a] animate-spin" />
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Updating activity feed...</span>
                                    </div>
                                ) : activities.length === 0 ? (
                                    <div className="p-10 text-center flex flex-col items-center gap-2">
                                        <Bell className="w-6 h-6 text-gray-300" />
                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">No recent alerts</span>
                                    </div>
                                ) : (
                                    activities.map((act) => (
                                        <div key={act.id} className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-default group">
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1 w-2 h-2 rounded-full bg-[#c2570a] shadow-[0_0_8px_rgba(194,87,10,0.3)] flex-shrink-0" />
                                                <div className="space-y-1 min-w-0">
                                                    <div className="text-xs font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-[#c2570a] transition-colors">
                                                        {act.action.replace(/_/g, ' ')}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-tight">
                                                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                        {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        <span className="text-gray-300">•</span>
                                                        <span className="truncate">{act.candidate?.email || 'System'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <button className="w-full p-4 text-center text-[10px] font-black text-[#c2570a] hover:text-[#9a3d07] bg-orange-50/30 transition-colors uppercase tracking-[0.2em] border-t border-gray-100">
                                View Security Logs
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <button 
              onClick={() => setShowInviteModal(true)}
              className="bg-[#c2570a] hover:bg-[#9a3d07] text-white font-black text-[11px] uppercase tracking-widest px-6 py-3.5 rounded-xl flex items-center gap-2 shadow-md shadow-[#c2570a]/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3px]" />
              New Candidate
            </button>

        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto bg-gray-50/50">
            <div className="p-10">
                {children}
            </div>
        </div>

        {/* Search Modal */}
        <AnimatePresence>
        {showSearch && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] p-4 bg-gray-900/40 backdrop-blur-[8px]"
            >
                <motion.div 
                    initial={{ scale: 0.95, y: -20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: -20 }}
                    className="w-full max-w-2xl bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden shadow-[#c2570a]/5 ring-1 ring-black/5"
                >
                    <div className="p-6 flex items-center gap-5 border-b border-gray-100 bg-gray-50/50">
                        <SearchIcon className="w-6 h-6 text-[#c2570a]" />
                        <input 
                            autoFocus
                            type="text" 
                            placeholder="Find candidates, documents, or operational settings..." 
                            className="flex-1 bg-transparent border-none text-gray-900 focus:outline-none text-base placeholder:text-gray-400 font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button onClick={() => setShowSearch(false)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition-colors"><X className="w-5 h-5"/></button>
                    </div>
                    <div className="p-2 max-h-[50vh] overflow-auto min-h-[300px] flex items-center justify-center">
                        <div className="p-10 text-center">
                            <div className="w-20 h-20 rounded-3xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <SearchIcon className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Global System Search</h3>
                            <p className="text-sm font-medium text-gray-500 max-w-xs mx-auto">Instant search across all identities, offers, and verified documents in the Linnk ecosystem.</p>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400 font-black uppercase tracking-widest">
                        <div className="flex gap-6">
                            <span className="flex items-center gap-2"><kbd className="border border-gray-200 bg-white px-1.5 py-0.5 rounded shadow-sm text-gray-500 font-mono font-black italic">↵</kbd> EXECUTE</span>
                            <span className="flex items-center gap-2"><kbd className="border border-gray-200 bg-white px-1.5 py-0.5 rounded shadow-sm text-gray-500 font-mono font-black italic">ESC</kbd> CLOSE</span>
                        </div>
                        <div className="flex items-center gap-2">
                             <ShieldCheck className="w-3 h-3 text-[#c2570a]" />
                             LINNK CORE v1.0.4 - SECURE
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}
        </AnimatePresence>

        {/* Invite Modal */}
        <AnimatePresence>
        {showInviteModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
          >
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md bg-white border border-gray-200 rounded-[32px] shadow-2xl p-10 overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-[#c2570a]" />
              
              <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mb-8 border border-[#ffedd5]">
                 <Plus className="w-8 h-8 text-[#c2570a]" />
              </div>
              
              <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Invite Candidate</h3>
              <p className="text-sm font-medium text-gray-500 mb-10 leading-relaxed">Identity verification and document sequence will be initialized upon registration.</p>
              
              <form onSubmit={handleInvite} className="space-y-8">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] block ml-1">First Name</label>
                      <input 
                          type="text" 
                          value={inviteFirstName}
                          onChange={(e) => setInviteFirstName(e.target.value)}
                          placeholder="John"
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-sm text-gray-900 focus:outline-none focus:border-[#c2570a]/50 focus:ring-4 focus:ring-[#c2570a]/10 transition-all font-semibold placeholder:text-gray-400"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] block ml-1">Last Name</label>
                      <input 
                          type="text" 
                          value={inviteLastName}
                          onChange={(e) => setInviteLastName(e.target.value)}
                          placeholder="Doe"
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-sm text-gray-900 focus:outline-none focus:border-[#c2570a]/50 focus:ring-4 focus:ring-[#c2570a]/10 transition-all font-semibold placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] block ml-1">Target Identity (Email)</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#c2570a] transition-colors" />
                      <input 
                          type="email" 
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          required
                          placeholder="identity@enterprise.com"
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-4 text-sm text-gray-900 focus:outline-none focus:border-[#c2570a]/50 focus:ring-4 focus:ring-[#c2570a]/10 transition-all font-semibold placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-6 py-4 rounded-2xl border border-gray-200 text-[11px] font-black text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors uppercase tracking-widest bg-white"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={inviteLoading}
                    className="flex-1 bg-[#c2570a] hover:bg-[#9a3d07] text-white font-black text-[11px] px-6 py-4 rounded-2xl transition-all disabled:opacity-50 shadow-md shadow-[#c2570a]/20 uppercase tracking-widest active:scale-95"
                  >
                    {inviteLoading ? "..." : "Send Secure Invitation"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>

      </main>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </div>
  );
}

const Loader2 = ({ className }: { className?: string }) => (
    <motion.svg 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}
    >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </motion.svg>
);
