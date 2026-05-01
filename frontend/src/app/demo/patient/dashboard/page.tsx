"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Activity, CalendarDays, Droplet, Ruler, Weight, Phone, Mail, MapPin } from "lucide-react";
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
  phone?: string;
  address?: string;
  conditions?: string[];
  medications?: string;
  allergies?: string;
}

export default function PatientDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("mediflow_token") : null;
    if (!token) {
      router.replace("/demo/patient/auth");
      return;
    }

    authApi.me()
      .then(res => {
        const merged = {
          ...(typeof window !== "undefined" ? JSON.parse(localStorage.getItem("mediflow_user") || "{}") : {}),
          ...res.user,
        };
        setUser(merged);
        if (typeof window !== "undefined") localStorage.setItem("mediflow_user", JSON.stringify(merged));
      })
      .catch(() => {
        try {
          const cached = localStorage.getItem("mediflow_user");
          if (cached) setUser(JSON.parse(cached));
          else router.replace("/demo/patient/auth");
        } catch {
          router.replace("/demo/patient/auth");
        }
      });
  }, [router]);

  const loadAppointments = async () => {
    setLoadingAppts(true);
    try {
      const res = await appointmentsApi.getAll();
      setAppointments(res.appointments || []);
    } catch {
      try {
        const stored = localStorage.getItem("mediflow_appointments");
        if (stored) setAppointments(JSON.parse(stored));
      } catch { /* ignore */ }
    } finally {
      setLoadingAppts(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadAppointments();
    const onApptUpdate = () => loadAppointments();
    window.addEventListener("appointmentUpdated", onApptUpdate);
    return () => window.removeEventListener("appointmentUpdated", onApptUpdate);
  }, [user]);

  if (!user) return null;

  const upcoming = appointments.filter(a => a.status === "upcoming" || a.status === "confirmed").slice(0, 2);

  return (
    <>
      <DemoNavbar title="Patient Dashboard" />
      <div className="flex min-h-[calc(100vh-64px)] bg-[#F8FAFC]">
        <PatientSidebar
          activeTab="overview"
          onTabChange={() => {}}
          patientName={user.name}
          riskLabel="Active"
          riskColor="bg-green-100 text-green-700 border-green-200"
        />

        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-[1fr_500px] gap-8">
            
            {/* ─── LEFT COLUMN: Profile & Details ─── */}
            <div className="flex flex-col gap-8">
              
              {/* Top Row: Quick Vitals Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fadeUp">
                <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Droplet size={24} />
                  </div>
                  <div>
                    <p className="text-[#64748B] text-xs font-bold uppercase tracking-wider">Blood Group</p>
                    <p className="text-[#0F172A] font-bold text-xl">{user.bloodGroup || "O+"}</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <CalendarDays size={24} />
                  </div>
                  <div>
                    <p className="text-[#64748B] text-xs font-bold uppercase tracking-wider">Age / Gender</p>
                    <p className="text-[#0F172A] font-bold text-xl">{user.age || "28"} {user.gender === 'M' ? 'M' : user.gender === 'F' ? 'F' : 'U'}</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Ruler size={24} />
                  </div>
                  <div>
                    <p className="text-[#64748B] text-xs font-bold uppercase tracking-wider">Height</p>
                    <p className="text-[#0F172A] font-bold text-xl">{user.height || "175"} <span className="text-sm font-medium text-[#64748B]">cm</span></p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                    <Weight size={24} />
                  </div>
                  <div>
                    <p className="text-[#64748B] text-xs font-bold uppercase tracking-wider">Weight</p>
                    <p className="text-[#0F172A] font-bold text-xl">{user.weight || "70"} <span className="text-sm font-medium text-[#64748B]">kg</span></p>
                  </div>
                </div>
              </div>

              {/* Main Profile Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeUp" style={{ animationDelay: '100ms' }}>
                
                {/* Contact & Personal Details */}
                <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] shadow-sm flex flex-col">
                  <h3 className="text-[#0F172A] text-lg font-bold mb-6 flex items-center gap-2">
                    <Activity className="text-[#1B4965]" /> Personal Information
                  </h3>
                  <div className="space-y-6 flex-1">
                    <div className="flex items-start gap-4">
                      <Mail className="text-[#94A3B8] mt-1" size={20} />
                      <div>
                        <p className="text-[#64748B] text-xs font-bold uppercase tracking-wider">Email Address</p>
                        <p className="text-[#0F172A] font-medium">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Phone className="text-[#94A3B8] mt-1" size={20} />
                      <div>
                        <p className="text-[#64748B] text-xs font-bold uppercase tracking-wider">Phone Number</p>
                        <p className="text-[#0F172A] font-medium">{user.phone || "+1 (555) 000-0000"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <MapPin className="text-[#94A3B8] mt-1" size={20} />
                      <div>
                        <p className="text-[#64748B] text-xs font-bold uppercase tracking-wider">Address</p>
                        <p className="text-[#0F172A] font-medium">{user.address || "123 Medical Drive, Health City, NY 10001"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Medical History */}
                <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] shadow-sm flex flex-col">
                  <h3 className="text-[#0F172A] text-lg font-bold mb-6">Medical History</h3>
                  <div className="space-y-6 flex-1">
                    <div>
                      <p className="text-[#64748B] text-xs font-bold uppercase tracking-wider mb-2">Chronic Conditions</p>
                      <div className="flex flex-wrap gap-2">
                        {user.conditions && user.conditions.length > 0 ? (
                          user.conditions.map(c => (
                            <span key={c} className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded-full text-sm font-semibold">
                              {c}
                            </span>
                          ))
                        ) : (
                          <span className="text-[#64748B] text-sm">None recorded</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-[#64748B] text-xs font-bold uppercase tracking-wider mb-2">Current Medications</p>
                      <p className="text-[#0F172A] font-medium bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                        {user.medications || "None"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#64748B] text-xs font-bold uppercase tracking-wider mb-2">Known Allergies</p>
                      <p className="text-[#0F172A] font-medium bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                        {user.allergies || "None"}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Upcoming Appointments */}
              <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] shadow-sm animate-fadeUp" style={{ animationDelay: '200ms' }}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[#0F172A] text-lg font-bold">Upcoming Appointments</h3>
                  <button onClick={() => router.push("/demo/patient/appointments")} className="text-[#1B4965] font-semibold text-sm hover:underline">
                    View All
                  </button>
                </div>
                
                {loadingAppts ? (
                  <p className="text-[#64748B] py-4">Loading...</p>
                ) : upcoming.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcoming.map((apt, i) => (
                      <div key={apt._id || i} className="flex flex-col gap-3 p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-[#0F172A] text-lg">{apt.doctorName || "Doctor"}</h4>
                          <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-md">Confirmed</span>
                        </div>
                        <p className="text-[#64748B] text-sm">{apt.specialization}</p>
                        <div className="mt-2 pt-3 border-t border-[#E2E8F0] flex items-center gap-2 text-[#0F172A] font-medium text-sm">
                          <CalendarDays size={16} className="text-[#94A3B8]" />
                          {apt.dateTime ? new Date(apt.dateTime).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Date TBD"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-[#F8FAFC] rounded-xl border border-dashed border-[#CBD5E1]">
                    <p className="text-[#64748B] font-medium">No upcoming appointments</p>
                  </div>
                )}
              </div>
            </div>

            {/* ─── RIGHT COLUMN: WhatsApp Triage Chat ─── */}
            <div className="h-[calc(100vh-130px)] flex flex-col bg-white rounded-2xl border border-[#E2E8F0] shadow-lg overflow-hidden animate-fadeUp" style={{ animationDelay: '300ms' }}>
              <HealthChat />
            </div>

          </div>
        </main>
      </div>
    </>
  );
}
