"use client";

import React from "react";

interface StepCardProps {
  step: number;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  isLast?: boolean;
  accent?: string; // tailwind border-color class e.g. "border-blue-500"
}

export function StepCard({ step, icon, title, children, isLast = false, accent = "border-[#1B4965]" }: StepCardProps) {
  return (
    <div className="flex gap-4">
      {/* Timeline spine */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-9 h-9 rounded-full bg-white border-2 ${accent} flex items-center justify-center text-[#1B4965] shadow-sm z-10`}>
          {icon}
        </div>
        {!isLast && <div className="w-px flex-1 bg-[#E2E8F0] my-1" />}
      </div>

      {/* Card body */}
      <div className={`flex-1 bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-5 mb-5 ${!isLast ? "" : ""}`}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Step {step}</span>
        </div>
        <h4 className="text-[#0F172A] font-bold text-[15px] mb-3">{title}</h4>
        {children}
      </div>
    </div>
  );
}
