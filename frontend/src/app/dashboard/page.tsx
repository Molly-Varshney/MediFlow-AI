"use client";

import React, { useEffect, useState } from "react";
import { Users, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { Sidebar } from "../../components/Sidebar";
import { Card } from "../../components/ui/Card";
import { TriageCard } from "../../components/TriageCard";
import { cn } from "../../lib/utils";
import Link from "next/link";
import { dashboardApi, triageApi, type DashboardSummary, type TriageSession } from "../../lib/api";

/* ─── Priority map from triage session state ── */
function sessionPriority(session: TriageSession): "emergency" | "high" | "normal" | "low" {
  const s = (session.status || "").toLowerCase();
  if (s.includes("emergency") || s.includes("critical")) return "emergency";
  if (s.includes("high") || s.includes("urgent"))        return "high";
  if (s.includes("low"))                                  return "low";
  return "normal";
}

export default function DashboardPage() {
  const [summary, setSummary]       = useState<DashboardSummary | null>(null);
  const [sessions, setSessions]     = useState<TriageSession[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [summaryRes, sessionsRes] = await Promise.allSettled([
          dashboardApi.summary(),
          triageApi.getSessions(),
        ]);

        if (cancelled) return;

        if (summaryRes.status === "fulfilled") setSummary(summaryRes.value.data);
        if (sessionsRes.status === "fulfilled") setSessions(sessionsRes.value.sessions || []);

        if (summaryRes.status === "rejected" && sessionsRes.status === "rejected") {
          setError("Could not reach backend. Make sure your server is running on http://localhost:5000.");
        }
      } catch {
        if (!cancelled) setError("Unexpected error loading dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  /* ─── Summary cards (live or skeleton) ── */
  const summaryCards = [
    {
      label: "Total Patients",
      value: loading ? "…" : (summary ? String(summary.totalPatients) : "—"),
      icon: Users,
      borderColor: "border-primary",
      iconColor: "text-primary",
    },
    {
      label: "Emergency",
      value: loading ? "…" : (summary ? String(summary.emergencyCases) : "—"),
      icon: AlertTriangle,
      borderColor: "border-danger",
      iconColor: "text-danger",
    },
    {
      label: "Pending Triage",
      value: loading ? "…" : (summary ? String(summary.todayAppointments) : "—"),
      icon: Clock,
      borderColor: "border-warning",
      iconColor: "text-warning",
    },
    {
      label: "Available Doctors",
      value: loading ? "…" : (summary ? String(summary.availableDoctors) : "—"),
      icon: CheckCircle,
      borderColor: "border-success",
      iconColor: "text-success",
    },
  ];

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden md:block flex-shrink-0 w-64 overflow-y-auto">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto bg-bgLight p-6">
        {/* Header */}
        <header className="mb-8">
          <h1 className="font-display text-2xl font-bold text-primary">
            MediFlow Dashboard 👋
          </h1>
          <p className="text-secondary text-sm mt-1">
            Live overview — {new Date().toDateString()}
          </p>
        </header>

        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-danger/10 border border-danger/20 rounded-xl px-4 py-3 text-danger text-sm font-medium">
            ⚠ {error}
          </div>
        )}

        {/* Summary cards */}
        <section
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          aria-label="Summary statistics"
        >
          {summaryCards.map(({ label, value, icon: Icon, borderColor, iconColor }) => (
            <Card key={label} className={cn("border-t-4", borderColor)}>
              <div className="flex items-center justify-between mb-3">
                <Icon className={cn("w-5 h-5", iconColor)} aria-hidden="true" />
              </div>
              <p className="font-display text-2xl font-bold text-primary">{value}</p>
              <p className="text-sm text-secondary mt-1">{label}</p>
            </Card>
          ))}
        </section>

        {/* Triage queue from real sessions */}
        <section aria-label="Active triage queue">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-primary">
              Active Triage Sessions
            </h2>
            <Link
              href="/triage"
              className="text-secondary text-sm hover:underline hover:text-primary transition-colors"
            >
              View All
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-white rounded-xl border border-bgSoft animate-pulse" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-bgSoft">
              <p className="text-primary/50 font-medium">No active triage sessions.</p>
              <p className="text-primary/30 text-sm mt-1">Sessions will appear here once patients start the AI triage flow.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sessions.slice(0, 8).map((session) => (
                <TriageCard
                  key={session.sessionId || session._id}
                  name={session.patientName || "Unknown Patient"}
                  age={0}
                  condition={session.status || "In Progress"}
                  priority={sessionPriority(session)}
                  waitTime={new Date(session.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  assignedDoctor="—"
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
