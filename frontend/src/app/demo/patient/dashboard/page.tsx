"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Activity, CheckCircle, Circle } from "lucide-react";
import { Badge } from "../../../../components/ui/Badge";
import { DemoNavbar } from "../../../../components/layout/DemoNavbar";
import { PatientSidebar } from "../../../../components/patient/PatientSidebar";
import HealthChat from "../../../../components/patient/HealthChat";
import { appointmentsApi, authApi, type Appointment } from "../../../../lib/api";

interface UserProfile {
  id?: string;
  name: string;
  email: string;
  age?: string;
  gender?: string;
  bloodGroup?: string;
  height?: string;
  weight?: string;
  conditions?: string[];
  medications?: string;
  allergies?: string;
}

interface HealthRecord {
  date: string;
  symptoms: string;
  severity: string;
  riskLevel: string;
  aiSummary: string;
  suggestions?: string[];
}

export default function PatientDashboardPage() {
  const router = useRouter();
  const [user, setUser]             = useState<UserProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [history, setHistory]       = useState<HealthRecord[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);

  /* ── Load user from token via /api/auth/me ── */
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("mediflow_token") : null;

    if (!token) {
      router.replace("/demo/patient/auth");
      return;
    }

    // Try to get profile from /api/auth/me; fallback to cached localStorage
    authApi.me()
      .then(res => {
        const merged = {
          ...(typeof window !== "undefined"
            ? (() => { try { return JSON.parse(localStorage.getItem("mediflow_user") || "{}"); } catch { return {}; } })()
            : {}),
          ...res.user,
        };
        setUser(merged);
        // Also cache it locally for HealthChat
        if (typeof window !== "undefined") {
          localStorage.setItem("mediflow_user", JSON.stringify(merged));
        }
      })
      .catch(() => {
        // Fallback: use whatever was cached
        try {
          const cached = localStorage.getItem("mediflow_user");
          if (cached) {
            setUser(JSON.parse(cached));
          } else {
            router.replace("/demo/patient/auth");
          }
        } catch {
          router.replace("/demo/patient/auth");
        }
      });
  }, [router]);

  /* ── Load appointments from backend ── */
  const loadAppointments = async () => {
    setLoadingAppts(true);
    try {
      const res = await appointmentsApi.getAll();
      setAppointments(res.appointments || []);
    } catch {
      // Fallback to localStorage appointments
      try {
        const stored = localStorage.getItem("mediflow_appointments");
        if (stored) setAppointments(JSON.parse(stored));
      } catch { /* ignore */ }
    } finally {
      setLoadingAppts(false);
    }
  };

  /* ── Load health history from localStorage (written by HealthChat) ── */
  const loadHistory = () => {
    try {
      const stored = localStorage.getItem("mediflow_health_history");
      if (stored) setHistory(JSON.parse(stored));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!user) return;
    loadAppointments();
    loadHistory();

    const onApptUpdate = () => loadAppointments();
    const onHistUpdate = () => loadHistory();
    window.addEventListener("appointmentUpdated", onApptUpdate);
    window.addEventListener("healthHistoryUpdated", onHistUpdate);
    window.addEventListener("healthUpdated", onHistUpdate);
    return () => {
      window.removeEventListener("appointmentUpdated", onApptUpdate);
      window.removeEventListener("healthHistoryUpdated", onHistUpdate);
      window.removeEventListener("healthUpdated", onHistUpdate);
    };
  }, [user]);

  if (!user) return null;

  const upcoming = appointments
    .filter(a => a.status === "upcoming" || a.status === "confirmed")
    .slice(0, 3);
  const latestAnalysis = history.length > 0 ? history[0] : null;

  return (
    <>
      <DemoNavbar title="Patient Dashboard" />
      <div className="flex min-h-screen bg-[#eef8fc]">
        <PatientSidebar
          activeTab="overview"
          onTabChange={() => {}}
          patientName={user.name}
          riskLabel="Active"
          riskColor="bg-success/10 text-success border-success/30"
        />

        <main className="flex-1 p-6 lg:p-10 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ─── LEFT COLUMN ─── */}
            <div className="lg:col-span-1 space-y-8">

              {/* Profile Card */}
              <div className="animate-fadeUp">
                <h2 className="font-display text-xl text-primary font-bold mb-4">Patient Profile</h2>
                <div className="bg-white border-none shadow-md rounded-2xl p-6">
                  <div className="space-y-5 text-base">
                    <div className="grid grid-cols-2 gap-y-4">
                      <div>
                        <span className="text-primary/50 text-xs block uppercase tracking-wider font-bold mb-1">Name</span>
                        <span className="font-bold text-primary text-lg">{user.name}</span>
                      </div>
                      <div>
                        <span className="text-primary/50 text-xs block uppercase tracking-wider font-bold mb-1">Age / Gender</span>
                        <span className="font-bold text-primary text-lg">
                          {user.age ? `${user.age}, ` : ""}{user.gender || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-primary/50 text-xs block uppercase tracking-wider font-bold mb-1">Blood Group</span>
                        <span className="font-bold text-primary text-lg">{user.bloodGroup || "—"}</span>
                      </div>
                      <div>
                        <span className="text-primary/50 text-xs block uppercase tracking-wider font-bold mb-1">Vitals</span>
                        <span className="font-bold text-primary text-lg">
                          {user.height ? `${user.height}cm` : "—"}{user.weight ? `, ${user.weight}kg` : ""}
                        </span>
                      </div>
                    </div>
                    <div className="border-t border-bgSoft pt-4">
                      <span className="text-primary/50 text-xs block uppercase tracking-wider font-bold mb-2">Conditions</span>
                      <div className="flex flex-wrap gap-2">
                        {user.conditions && user.conditions.length > 0
                          ? user.conditions.map(c => <Badge key={c} variant="normal" size="md">{c}</Badge>)
                          : <span className="text-primary/70 font-medium text-lg">None</span>}
                      </div>
                    </div>
                    <div>
                      <span className="text-primary/50 text-xs block uppercase tracking-wider font-bold mb-1">Medications</span>
                      <span className="font-bold text-primary text-lg">{user.medications || "None"}</span>
                    </div>
                    <div>
                      <span className="text-primary/50 text-xs block uppercase tracking-wider font-bold mb-1">Allergies</span>
                      <span className="font-bold text-primary text-lg">{user.allergies || "None"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Appointments */}
              <div id="appointments-section" className="animate-fadeUp flex flex-col">
                <h2 className="font-display text-xl text-primary font-bold mb-4">Upcoming Appointments</h2>
                <div className="bg-white border-none shadow-md rounded-2xl p-6 flex-1 flex flex-col">
                  {loadingAppts ? (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-primary/40 text-sm">Loading appointments…</span>
                    </div>
                  ) : upcoming.length > 0 ? (
                    <div className="space-y-3 flex-1">
                      {upcoming.map((apt, i) => (
                        <div key={apt._id || i} className="flex justify-between items-center bg-bgLight/50 p-4 rounded-xl border border-bgSoft hover:bg-bgLight transition-colors">
                          <div>
                            <p className="font-bold text-primary text-base">{apt.doctorName || "Doctor"}</p>
                            <p className="text-sm text-primary/70 mt-1">
                              {apt.specialization ? `${apt.specialization} · ` : ""}
                              {apt.dateTime
                                ? new Date(apt.dateTime).toLocaleDateString()
                                : "Date TBD"}
                            </p>
                          </div>
                          <Badge variant="success" size="md">Confirmed</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center bg-bgLight/50 border border-bgSoft rounded-xl p-6 text-center">
                      <p className="text-base font-semibold text-primary/60">No upcoming appointments</p>
                    </div>
                  )}
                  <button
                    onClick={() => router.push("/demo/patient/appointments")}
                    className="mt-5 text-sm font-bold text-accent hover:text-primary transition-colors flex items-center justify-center gap-1 w-full bg-accent/5 py-2.5 rounded-xl"
                  >
                    View All Appointments <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* ─── RIGHT COLUMN ─── */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                {/* Clinical Triage Chat */}
                <div className="flex flex-col animate-fadeUp" id="chat-section">
                  <h2 className="font-display text-xl text-primary font-bold mb-4">Clinical Triage Chat</h2>
                  <div className="bg-[#f0f7fb] border border-bgSoft rounded-2xl overflow-hidden shadow-md h-[450px] relative [&>div]:h-full">
                    <HealthChat />
                  </div>
                </div>

                {/* Agentic Intelligence Breakdown */}
                <div id="ai-analysis-section" className="animate-fadeUp flex flex-col">
                  <h2 className="font-display text-xl text-primary font-bold mb-4">Agentic Intelligence Breakdown</h2>
                  <div className="bg-white border-none shadow-md rounded-2xl p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                      <Activity size={24} className="text-accent" />
                      <h3 className="font-display text-lg font-bold text-primary">Agent Thinking</h3>
                    </div>

                    {latestAnalysis ? (
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-3 bg-success/10 px-4 py-3 rounded-xl border border-success/20">
                          <CheckCircle size={18} className="text-success" />
                          <span className="font-semibold text-primary text-[15px]">Analyzing symptoms</span>
                        </div>
                        <div className="flex items-center gap-3 bg-success/10 px-4 py-3 rounded-xl border border-success/20">
                          <CheckCircle size={18} className="text-success" />
                          <span className="font-semibold text-primary text-[15px]">Asking follow-ups</span>
                        </div>
                        <div className="flex items-center justify-between bg-accent/10 px-4 py-3 rounded-xl border border-accent/20">
                          <div className="flex items-center gap-3">
                            <CheckCircle size={18} className="text-accent" />
                            <span className="font-semibold text-primary text-[15px]">Evaluating urgency</span>
                          </div>
                          <Badge
                            variant={
                              latestAnalysis.riskLevel?.toLowerCase().includes("high") ? "emergency"
                              : latestAnalysis.riskLevel?.toLowerCase().includes("moderate") ? "warning"
                              : "success"
                            }
                            size="sm"
                          >
                            {latestAnalysis.riskLevel || "Analyzed"}
                          </Badge>
                        </div>
                        <div className="flex flex-col gap-2 bg-bgLight/50 px-4 py-3 rounded-xl border border-bgSoft">
                          <div className="flex items-center gap-3">
                            <CheckCircle size={18} className="text-primary/50" />
                            <span className="font-semibold text-primary text-[15px]">Recommended Action</span>
                          </div>
                          <p className="text-[14px] text-primary/70 ml-8 font-medium">
                            {latestAnalysis.suggestions?.[0] || "Consult a specialist based on symptoms."}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-3 bg-success/10 px-4 py-3 rounded-xl border border-success/20">
                          <CheckCircle size={18} className="text-success" />
                          <span className="font-semibold text-primary text-[15px]">Analyzing symptoms</span>
                        </div>
                        <div className="flex items-center gap-3 bg-success/10 px-4 py-3 rounded-xl border border-success/20">
                          <CheckCircle size={18} className="text-success" />
                          <span className="font-semibold text-primary text-[15px]">Asking follow-ups</span>
                        </div>
                        <div className="flex items-center justify-between bg-accent/10 px-4 py-3 rounded-xl border border-accent/20">
                          <div className="flex items-center gap-3">
                            <ArrowRight size={18} className="text-accent" />
                            <span className="font-semibold text-primary text-[15px]">Evaluating urgency</span>
                          </div>
                          <span className="text-[11px] font-bold text-accent uppercase tracking-wider bg-accent/20 px-2 py-1 rounded-md border border-accent/30">
                            in progress
                          </span>
                        </div>
                        <div className="flex items-center justify-between bg-bgLight/50 px-4 py-3 rounded-xl border border-bgSoft">
                          <div className="flex items-center gap-3">
                            <Circle size={18} className="text-primary/30" />
                            <span className="font-semibold text-primary/70 text-[15px]">Deciding next action</span>
                          </div>
                          <span className="text-[11px] font-bold text-primary/40 uppercase tracking-wider bg-white px-2 py-1 rounded-md border border-bgSoft">
                            pending
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
