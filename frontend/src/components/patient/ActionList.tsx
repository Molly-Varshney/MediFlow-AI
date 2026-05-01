"use client";

import React, { useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";

interface ActionListProps {
  actions: string[];
}

export function ActionList({ actions }: ActionListProps) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const toggle = (i: number) => setChecked(prev => ({ ...prev, [i]: !prev[i] }));

  return (
    <ul className="space-y-2.5">
      {actions.map((action, i) => (
        <li
          key={i}
          onClick={() => toggle(i)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          {checked[i] ? (
            <CheckCircle2 size={20} className="text-emerald-500 shrink-0 transition-all" />
          ) : (
            <Circle size={20} className="text-[#CBD5E1] shrink-0 group-hover:text-[#94A3B8] transition-all" />
          )}
          <span className={`text-[14px] font-medium transition-all ${checked[i] ? "line-through text-[#94A3B8]" : "text-[#334155]"}`}>
            {action}
          </span>
        </li>
      ))}
    </ul>
  );
}
