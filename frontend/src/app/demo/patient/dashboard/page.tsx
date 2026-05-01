"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Calendar, History, Activity, Edit2, Bot, ArrowRight, CheckCircle, Circle } from "lucide-react";
import { Card } from "../../../../components/ui/Card";
import { Badge } from "../../../../components/ui/Badge";
import { DemoNavbar } from "../../../../components/layout/DemoNavbar";
import { PatientSidebar, type PatientTab } from "../../../../components/patient/PatientSidebar";
import HealthChat from "../../../../components/patient/HealthChat";

interface UserProfile {
  name: string; age: string; gender: string; bloodGroup: string;
  height: string; weight: string; conditions: string[];
  medications: string; allergies: string;
}

interface Appointment {
  doctorName: string; specialization: string; clinicName: string; fee: string; dateTime: string; status: string;
}

interface HealthRecord {
  date: string; symptoms: string; severity: string; riskLevel: string; aiSummary: string; suggestions?: string[];
}

export default function PatientDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [history, setHistory] = useState<HealthRecord[]>([]);
  const [activeTab, setActiveTab] = useState<PatientTab>("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

  const loadData = () => {
    try {
      const storedUser = localStorage.getItem("mediflow_user");
      if (!storedUser) { router.replace("/demo/patient/auth"); return; }
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      if (Object.keys(editForm).length === 0) setEditForm(parsedUser);

      const storedAppts = localStorage.getItem("mediflow_appointments");
      if (storedAppts) setAppointments(JSON.parse(storedAppts));

      const storedHistory = localStorage.getItem("mediflow_health_history");
      if (storedHistory) setHistory(JSON.parse(storedHistory));
    } catch (e) {}
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener("appointmentUpdated", handleUpdate);
    window.addEventListener("healthHistoryUpdated", handleUpdate);
    window.addEventListener("healthUpdated", handleUpdate);
    return () => {
      window.removeEventListener("appointmentUpdated", handleUpdate);
      window.removeEventListener("healthHistoryUpdated", handleUpdate);
      window.removeEventListener("healthUpdated", handleUpdate);
    };
  }, [router]);

  const handleSaveProfile = () => {
    if (!user) return;
    const updated = { ...user, ...editForm };
    localStorage.setItem("mediflow_user", JSON.stringify(updated));
    setUser(updated);
    setIsEditing(false);
  };

  if (!user) return null;

  const upcoming = appointments.filter(a => a.status === "upcoming" || a.status === "confirmed").slice(0, 3);
  const latestAnalysis = history.length > 0 ? history[0] : null;

  return (
    <>
      <DemoNavbar title="Patient Dashboard" />
      <div className="flex min-h-screen bg-[#eef8fc]">
        <PatientSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
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
                  <div className="flex justify-end mb-3">
                    <button onClick={() => setIsEditing(!isEditing)} className="text-accent hover:text-primary transition-colors bg-accent/10 p-2 rounded-full">
                      <Edit2 size={18}/>
                    </button>
                  </div>

                  {isEditing ? (
                    <div className="space-y-4 text-base">
                      <input className="w-full border rounded-xl p-3 focus:ring-accent outline-none bg-bgLight/50" value={editForm.name||""} onChange={e=>setEditForm({...editForm, name: e.target.value})} placeholder="Name" />
                      <div className="grid grid-cols-2 gap-3">
                        <input className="border rounded-xl p-3 outline-none bg-bgLight/50" value={editForm.age||""} onChange={e=>setEditForm({...editForm, age: e.target.value})} placeholder="Age" />
                        <input className="border rounded-xl p-3 outline-none bg-bgLight/50" value={editForm.gender||""} onChange={e=>setEditForm({...editForm, gender: e.target.value})} placeholder="Gender" />
                        <input className="border rounded-xl p-3 outline-none bg-bgLight/50" value={editForm.height||""} onChange={e=>setEditForm({...editForm, height: e.target.value})} placeholder="Height (cm)" />
                        <input className="border rounded-xl p-3 outline-none bg-bgLight/50" value={editForm.weight||""} onChange={e=>setEditForm({...editForm, weight: e.target.value})} placeholder="Weight (kg)" />
                      </div>
                      <input className="w-full border rounded-xl p-3 outline-none bg-bgLight/50" value={editForm.bloodGroup||""} onChange={e=>setEditForm({...editForm, bloodGroup: e.target.value})} placeholder="Blood Group" />
                      <input className="w-full border rounded-xl p-3 outline-none bg-bgLight/50" value={editForm.medications||""} onChange={e=>setEditForm({...editForm, medications: e.target.value})} placeholder="Medications" />
                      <input className="w-full border rounded-xl p-3 outline-none bg-bgLight/50" value={editForm.allergies||""} onChange={e=>setEditForm({...editForm, allergies: e.target.value})} placeholder="Allergies" />
                      <button onClick={handleSaveProfile} className="w-full bg-primary text-white py-3 rounded-xl font-bold mt-4 hover:bg-secondary transition-colors text-lg">Save Changes</button>
                    </div>
                  ) : (
                    <div className="space-y-5 text-base">
                      <div className="grid grid-cols-2 gap-y-4">
                        <div><span className="text-primary/50 text-xs block uppercase tracking-wider font-bold mb-1">Name</span><span className="font-bold text-primary text-lg">{user.name}</span></div>
                        <div><span className="text-primary/50 text-xs block uppercase tracking-wider font-bold mb-1">Age/Gender</span><span className="font-bold text-primary text-lg">{user.age}, {user.gender}</span></div>
                        <div><span className="text-primary/50 text-xs block uppercase tracking-wider font-bold mb-1">Blood Group</span><span className="font-bold text-primary text-lg">{user.bloodGroup}</span></div>
                        <div><span className="text-primary/50 text-xs block uppercase tracking-wider font-bold mb-1">Vitals</span><span className="font-bold text-primary text-lg">{user.height}cm, {user.weight}kg</span></div>
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
                  )}
                </div>
              </div>

              {/* Upcoming Appointments */}
              <div id="appointments-section" className="animate-fadeUp flex flex-col">
                <h2 className="font-display text-xl text-primary font-bold mb-4">Upcoming Appointments</h2>
                <div className="bg-white border-none shadow-md rounded-2xl p-6 flex-1 flex flex-col">
                  {upcoming.length > 0 ? (
                    <div className="space-y-3 flex-1">
                      {upcoming.map((apt, i) => (
                        <div key={i} className="flex justify-between items-center bg-bgLight/50 p-4 rounded-xl border border-bgSoft hover:bg-bgLight transition-colors">
                          <div>
                            <p className="font-bold text-primary text-base">{apt.doctorName}</p>
                            <p className="text-sm text-primary/70 mt-1">{apt.dateTime}</p>
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
                  <button onClick={() => router.push("/demo/patient/appointments")} className="mt-5 text-sm font-bold text-accent hover:text-primary transition-colors flex items-center justify-center gap-1 w-full bg-accent/5 py-2.5 rounded-xl">
                    View All Appointments <ArrowRight size={16}/>
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

                {/* Agentic Intelligence Breakdown Card */}
                <div id="ai-analysis-section" className="animate-fadeUp flex flex-col">
                  <h2 className="font-display text-xl text-primary font-bold mb-4">Agentic Intelligence Breakdown</h2>
                  <div className="bg-white border-none shadow-md rounded-2xl p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                      <Activity size={24} className="text-accent" />
                      <h3 className="font-display text-lg font-bold text-primary">Agent Thinking</h3>
                    </div>

                    {latestAnalysis ? (
                      <div className="space-y-4 flex-1">
                        {/* Step 1 */}
                        <div className="flex items-center gap-3 bg-success/10 px-4 py-3 rounded-xl border border-success/20">
                          <CheckCircle size={18} className="text-success" />
                          <span className="font-semibold text-primary text-[15px]">Analyzing symptoms</span>
                        </div>
                        {/* Step 2 */}
                        <div className="flex items-center gap-3 bg-success/10 px-4 py-3 rounded-xl border border-success/20">
                          <CheckCircle size={18} className="text-success" />
                          <span className="font-semibold text-primary text-[15px]">Asking follow-ups</span>
                        </div>
                        {/* Step 3 */}
                        <div className="flex items-center justify-between bg-accent/10 px-4 py-3 rounded-xl border border-accent/20">
                          <div className="flex items-center gap-3">
                            <CheckCircle size={18} className="text-accent" />
                            <span className="font-semibold text-primary text-[15px]">Evaluating urgency</span>
                          </div>
                          <Badge variant={latestAnalysis.riskLevel?.toLowerCase().includes("high") ? "emergency" : latestAnalysis.riskLevel?.toLowerCase().includes("moderate") ? "warning" : "success"} size="sm">
                            {latestAnalysis.riskLevel || "Analyzed"}
                          </Badge>
                        </div>
                        {/* Step 4 */}
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
                          <span className="text-[11px] font-bold text-accent uppercase tracking-wider bg-accent/20 px-2 py-1 rounded-md border border-accent/30">in progress</span>
                        </div>
                        <div className="flex items-center justify-between bg-bgLight/50 px-4 py-3 rounded-xl border border-bgSoft">
                          <div className="flex items-center gap-3">
                            <Circle size={18} className="text-primary/30" />
                            <span className="font-semibold text-primary/70 text-[15px]">Deciding next action</span>
                          </div>
                          <span className="text-[11px] font-bold text-primary/40 uppercase tracking-wider bg-white px-2 py-1 rounded-md border border-bgSoft">pending</span>
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
