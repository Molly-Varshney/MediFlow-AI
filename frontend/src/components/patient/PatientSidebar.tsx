"use client";

import React from "react";
import { LayoutDashboard, HeartPulse, BarChart2, Lightbulb, Bot, Calendar, History, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export type PatientTab = "overview" | "health-summary" | "analytics" | "recommendations";

interface NavItem {
  id: PatientTab | "chat" | "appointments" | "health-history";
  label: string;
  icon: React.ReactNode;
  route?: string;
  scrollTo?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Dashboard", icon: <LayoutDashboard size={18} />, route: "/demo/patient/dashboard" },
  { id: "chat", label: "AI Assistant", icon: <Bot size={18} />, route: "/demo/patient/dashboard#chat-section" },
  { id: "appointments", label: "Appointments", icon: <Calendar size={18} />, route: "/demo/patient/appointments" },
  { id: "health-history", label: "Health History", icon: <History size={18} />, route: "/demo/patient/history" },
  // { id: "health-summary",   label: "Health Summary",  icon: <HeartPulse size={18} />,         route: "/demo/patient/dashboard#ai-analysis-section" },
  // { id: "analytics",        label: "Analytics",       icon: <BarChart2 size={18} /> },
  // { id: "recommendations",  label: "Recommendations", icon: <Lightbulb size={18} />,          route: "/demo/patient/dashboard#ai-analysis-section" },
];

interface PatientSidebarProps {
  activeTab: PatientTab;
  onTabChange: (tab: PatientTab) => void;
  patientName: string;
  riskLabel: string;
  riskColor: string;
}

export function PatientSidebar({ activeTab, onTabChange, patientName, riskLabel, riskColor }: PatientSidebarProps) {
  const router = useRouter();

  const handleLogout = () => {
    try { localStorage.removeItem("mediflow_user"); } catch { }
    router.push("/demo/patient/auth");
  };

  const handleNav = (item: NavItem) => {
    if (item.route) {
      router.push(item.route);
      if (item.route.includes("#")) {
        const id = item.route.split("#")[1];
        setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }
    } else if (item.scrollTo) {
      setTimeout(() => {
        document.getElementById(item.scrollTo!)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else if (item.id === "analytics") {
      alert("Analytics coming soon!");
    }
  };

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-bgSoft flex flex-col min-h-screen sticky top-0">

      {/* Patient Avatar */}
      <div className="px-6 py-5 border-b border-bgSoft">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold font-display text-base shrink-0 uppercase">
            {patientName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-primary text-sm truncate">{patientName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border", riskColor)}>
                {riskLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = !item.route && !item.scrollTo && activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 text-left group",
                isActive
                  ? "bg-primary text-white shadow-md"
                  : "text-primary/70 hover:bg-primary/5 hover:text-primary"
              )}
            >
              <span className={cn("transition-colors duration-200", isActive ? "text-white" : "text-primary/50 group-hover:text-primary")}>
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer + Logout */}
      <div className="px-4 py-4 border-t border-bgSoft space-y-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-md font-bold text-danger/70 hover:bg-danger/5 hover:text-danger transition-all duration-200"
        >
          <LogOut size={20} />
          Log Out
        </button>
        <p className="text-[12px] text-primary/80 font-bold uppercase tracking-wider text-center">
          Demo Session · MeiFlow AI
        </p>
      </div>
    </aside>
  );
}
