"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PatientSidebar } from "../../../../components/patient/PatientSidebar";
import HealthChat from "../../../../components/patient/HealthChat";
import { CarePlanSection } from "../../../../components/patient/CarePlanSection";
import { authApi } from "../../../../lib/api";

interface UserProfile {
  id?: string;
  name: string;
  email: string;
}

export default function AIAssistantPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("mediflow_token") : null;
    if (!token) { router.replace("/demo/patient/auth"); return; }

    authApi.me()
      .then(res => {
        const merged = {
          ...(typeof window !== "undefined" ? JSON.parse(localStorage.getItem("mediflow_user") || "{}") : {}),
          ...res.user,
        };
        setUser(merged);
      })
      .catch(() => {
        try {
          const cached = localStorage.getItem("mediflow_user");
          if (cached) setUser(JSON.parse(cached));
          else router.replace("/demo/patient/auth");
        } catch { router.replace("/demo/patient/auth"); }
      });
  }, [router]);

  if (!user) return null;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F8FAFC' }}>
      
      {/* Sidebar */}
      <PatientSidebar
        activeTab={"health-summary" as any}
        onTabChange={() => {}}
        patientName={user.name}
        riskLabel="Active"
        riskColor="bg-green-100 text-green-700 border-green-200"
      />

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Page Header */}
        <div style={{ padding: '20px 32px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', flexShrink: 0 }}>
          <p style={{ color: '#64748B', fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>Patient Portal</p>
          <h2 style={{ color: '#0F172A', fontSize: '22px', fontWeight: 700, margin: 0 }}>AI Assistant</h2>
        </div>

        {/* Two-column split — fills remaining screen */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '420px 1fr', overflow: 'hidden' }}>
          
          {/* LEFT: Floating AI Chat Widget */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px 12px 16px 20px' }}>
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: '20px',
              border: '1.5px solid #D1D5DB',
              boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(27,73,101,0.08)',
              background: '#FFFFFF',
            }}>
              <HealthChat />
            </div>
          </div>

          {/* RIGHT: Care Plan — scrollable */}
          <div style={{ overflowY: 'auto', padding: '28px 32px' }}>
            <CarePlanSection />
          </div>

        </div>
      </div>
    </div>
  );
}
