"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, RotateCcw, AlertCircle, CheckCircle2, Activity, Calendar } from "lucide-react";
import { triageApi, doctorsApi, appointmentsApi, type AgentResult, type Doctor } from "@/lib/api";

/* ─── Types ── */
interface Message { role: "ai" | "user"; text: string; }

type Phase =
  | "chat"         // active Q&A with backend
  | "result"       // triage + decision displayed
  | "doctors"      // recommended doctors shown
  | "booked"       // appointment confirmed
  | "error";       // unrecoverable error

/* ─── Risk level helper ── */
function riskColor(risk: string): string {
  const r = risk?.toLowerCase() || "";
  if (r.includes("high") || r.includes("emergency") || r.includes("critical"))
    return "text-red-600 bg-red-50 border-red-200";
  if (r.includes("moderate") || r.includes("medium"))
    return "text-yellow-600 bg-yellow-50 border-yellow-200";
  return "text-green-600 bg-green-50 border-green-200";
}

export default function HealthChat() {
  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState("");
  const [typing, setTyping]         = useState(false);
  const [phase, setPhase]           = useState<Phase>("chat");

  // Triage state
  const [sessionId, setSessionId]   = useState<string | null>(null);
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);
  const [doctors, setDoctors]       = useState<Doctor[]>([]);
  const [bookingDoc, setBookingDoc] = useState<Doctor | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [errorMsg, setErrorMsg]     = useState("");

  // Track whether the very first user message has been sent
  const isFirstMessage = useRef(true);

  const bottomRef = useRef<HTMLDivElement>(null);

  const user =
    typeof window !== "undefined"
      ? (() => { try { return JSON.parse(localStorage.getItem("mediflow_user") || "{}"); } catch { return {}; } })()
      : {};
  const userName: string = user?.name || "there";

  /* ─── Initial greeting ── */
  useEffect(() => {
    setTyping(true);
    const t = setTimeout(() => {
      setTyping(false);
      pushAI(
        `Hi ${userName}! 👋 I'm MediFlow AI. Tell me — what symptoms are you experiencing today?`
      );
    }, 800);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, phase, doctors]);

  /* ─── Message helpers ── */
  function pushAI(text: string) {
    setMessages(p => [...p, { role: "ai", text }]);
  }
  function pushUser(text: string) {
    setMessages(p => [...p, { role: "user", text }]);
  }

  /* ─── Handle send ── */
  const handleSend = async () => {
    const val = input.trim();
    if (!val || typing || phase !== "chat") return;
    setInput("");
    pushUser(val);
    setTyping(true);

    try {
      if (isFirstMessage.current) {
        // ── START new triage session ──
        isFirstMessage.current = false;
        const res = await triageApi.start({
          symptoms: val,
          patientName: userName,
        });

        setSessionId(res.sessionId);
        setTyping(false);

        if (res.agentResult.done) {
          // Rare: agent resolved in one shot
          handleDone(res.agentResult);
        } else {
          pushAI(res.agentResult.nextQuestion || "Tell me more about your symptoms.");
        }
      } else {
        // ── RESPOND to next question ──
        if (!sessionId) throw new Error("Session not initialised");
        const res = await triageApi.respond({ sessionId, answer: val });
        setTyping(false);

        if (res.agentResult.done) {
          handleDone(res.agentResult);
        } else {
          pushAI(res.agentResult.nextQuestion || "Please continue...");
        }
      }
    } catch (err: unknown) {
      setTyping(false);
      const msg = err instanceof Error ? err.message : "Unknown error";
      setErrorMsg(`Could not reach backend: ${msg}. Make sure your server is running on http://localhost:5000.`);
      setPhase("error");
    }
  };

  /* ─── Called when agent says done===true ── */
  const handleDone = (result: AgentResult) => {
    setAgentResult(result);
    const triage = result.triage;
    const decision = result.decision;

    if (triage) {
      pushAI(
        `✅ Triage complete!\n\n` +
        `**Risk Level:** ${triage.risk}\n` +
        `**Confidence:** ${Math.round((triage.confidence || 0) * 100)}%\n` +
        `**Reason:** ${triage.reason}\n` +
        `**Key Symptoms:** ${(triage.keySymptoms || []).join(", ")}`
      );
    }

    if (decision) {
      pushAI(
        `**Recommended Action:** ${decision.action}\n` +
        `**Recommendation:** ${decision.recommendation}`
      );
    }

    setPhase("result");

    // Auto-fetch recommended doctors if specialistNeeded is present
    if (decision?.specialistNeeded) {
      fetchDoctors(decision.specialistNeeded);
    }
  };

  /* ─── Fetch recommended doctors ── */
  const fetchDoctors = async (specialization: string) => {
    try {
      const res = await doctorsApi.getAll({ specialization });
      setDoctors(res.doctors || []);
      setPhase("doctors");
      pushAI(`Here are available **${specialization}** doctors for you:`);
    } catch {
      // If specialization filter fails, fetch all doctors
      try {
        const res = await doctorsApi.getAll();
        setDoctors((res.doctors || []).slice(0, 3));
        setPhase("doctors");
        pushAI("Here are some available doctors for you:");
      } catch {
        setPhase("result"); // fallback: stay at result phase
      }
    }
  };

  /* ─── Book appointment ── */
  const handleBook = async (doc: Doctor) => {
    setBookingLoading(true);
    setBookingDoc(doc);
    pushAI(`Booking your appointment with ${doc.name}...`);

    try {
      await appointmentsApi.create({
        doctorId:       doc._id,
        doctorName:     doc.name,
        specialization: doc.specialization,
        patientName:    userName,
        status:         "upcoming",
        reason:         agentResult?.triage?.reason || "AI Triage Referral",
      });

      pushAI(`✅ Confirmed! Appointment booked with **${doc.name}** (${doc.specialization}).`);
      setPhase("booked");

      // Also save to localStorage so PatientDashboard can show it without a reload
      try {
        const key = "mediflow_appointments";
        const prev = JSON.parse(localStorage.getItem(key) || "[]");
        prev.unshift({
          id: Date.now(),
          doctorName: doc.name,
          specialization: doc.specialization,
          clinicName: doc.location || "",
          fee: doc.fee || "",
          dateTime: new Date().toDateString(),
          status: "upcoming",
          bookedOn: new Date().toISOString(),
        });
        localStorage.setItem(key, JSON.stringify(prev));
        window.dispatchEvent(new Event("appointmentUpdated"));
      } catch { /* localStorage optional */ }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Booking failed";
      pushAI(`❌ Booking failed: ${msg}`);
    } finally {
      setBookingLoading(false);
    }
  };

  /* ─── Reset ── */
  const resetChat = () => {
    setMessages([]);
    setInput("");
    setTyping(false);
    setPhase("chat");
    setSessionId(null);
    setAgentResult(null);
    setDoctors([]);
    setBookingDoc(null);
    setBookingLoading(false);
    setErrorMsg("");
    isFirstMessage.current = true;

    setTimeout(() => {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        pushAI(`Hi ${userName}! 👋 I'm MediFlow AI. Tell me — what symptoms are you experiencing today?`);
      }, 800);
    }, 100);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const inputDisabled = typing || phase !== "chat";

  /* ─── Triage Result Card ── */
  const renderResult = () => {
    if (!agentResult?.triage) return null;
    const { triage, decision } = agentResult;
    return (
      <div className="my-4 bg-white border border-bgSoft rounded-xl p-5 shadow-sm animate-fadeUp">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-accent" />
          <span className="font-display font-bold text-primary">Triage Result</span>
        </div>

        {/* Risk badge */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border mb-4 ${riskColor(triage.risk)}`}>
          <AlertCircle size={13} />
          {triage.risk}
        </div>

        <div className="space-y-2 text-sm text-primary/80">
          <p><span className="font-semibold">Confidence:</span> {Math.round((triage.confidence || 0) * 100)}%</p>
          <p><span className="font-semibold">Reason:</span> {triage.reason}</p>
          {triage.keySymptoms?.length > 0 && (
            <p><span className="font-semibold">Key Symptoms:</span> {triage.keySymptoms.join(", ")}</p>
          )}
        </div>

        {decision && (
          <div className="mt-4 pt-4 border-t border-bgSoft space-y-2 text-sm text-primary/80">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={16} className="text-success" />
              <span className="font-semibold text-primary">Recommendation</span>
            </div>
            <p><span className="font-semibold">Action:</span> {decision.action}</p>
            <p>{decision.recommendation}</p>
            {decision.specialistNeeded && (
              <p><span className="font-semibold">Specialist Needed:</span> {decision.specialistNeeded}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  /* ─── Doctor cards ── */
  const renderDoctors = () => {
    if (phase !== "doctors" && phase !== "booked") return null;
    return (
      <div className="ml-9 flex flex-col gap-3 animate-fadeUp">
        {doctors.map((doc, i) => (
          <div key={doc._id || i} className="bg-white border border-bgSoft rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-bold text-primary text-base">{doc.name}</div>
                <div className="text-secondary text-sm font-semibold">{doc.specialization}</div>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${doc.available ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                {doc.available ? "Available" : "Busy"}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 text-[13px] text-primary/60 mb-4">
              {doc.rating  && <span>⭐ {doc.rating}</span>}
              {doc.location && <span>📍 {doc.location}</span>}
              {doc.fee      && <span>💰 {doc.fee}</span>}
            </div>

            <div className="flex gap-3">
              <button
                id={`book-doctor-${doc._id || i}`}
                onClick={() => handleBook(doc)}
                disabled={bookingLoading || phase === "booked"}
                className="bg-primary text-white text-sm font-bold px-4 py-2.5 rounded-lg flex-1 hover:bg-secondary transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bookingLoading && bookingDoc?._id === doc._id ? "Booking…" : "Book Appointment"}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#f0f7fb]">

      {/* ─── Chat Area ─── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "ai" && (
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0 self-end mr-2">
                <Bot size={16} className="text-white" />
              </div>
            )}
            <div className={`max-w-[80%] px-5 py-3 text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap ${
              m.role === "ai"
                ? "bg-[#9ecfe3] text-primary rounded-[18px] rounded-bl-sm font-medium"
                : "bg-white text-primary rounded-[18px] rounded-br-sm border border-bgSoft"
            }`}>
              {m.text}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {typing && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-white border border-bgSoft px-5 py-4 rounded-[18px] rounded-bl-sm flex gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {/* Triage result */}
        {(phase === "result" || phase === "doctors" || phase === "booked") && renderResult()}

        {/* Doctor recommendations */}
        {renderDoctors()}

        {/* Error state */}
        {phase === "error" && (
          <div className="mx-2 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertCircle size={16} /> Connection Error
            </div>
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Reset button */}
        {(phase === "booked" || phase === "error") && (
          <div className="flex justify-center mt-5">
            <button
              onClick={resetChat}
              className="bg-white border border-bgSoft text-primary text-sm font-bold px-5 py-3 rounded-full flex items-center gap-2 shadow-sm hover:bg-bgLight transition-colors"
            >
              <RotateCcw size={16} /> Start New Check
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ─── Input Area ─── */}
      <div className="p-4 bg-[#f0f7fb] shrink-0 border-t border-bgSoft/50">
        <div className="flex gap-3 max-w-2xl mx-auto">
          <input
            id="triage-chat-input"
            className={`flex-1 bg-white border border-bgSoft rounded-full px-5 py-3 text-[15px] outline-none transition-colors shadow-sm ${
              inputDisabled
                ? "opacity-60 cursor-not-allowed"
                : "focus:border-secondary focus:ring-1 focus:ring-secondary"
            }`}
            placeholder={
              inputDisabled
                ? phase !== "chat" ? "Follow the prompts above…" : "MediFlow AI is typing…"
                : "Describe your symptoms…"
            }
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={inputDisabled}
          />
          <button
            id="triage-send-btn"
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors bg-white shadow-sm border border-bgSoft ${
              inputDisabled || !input.trim()
                ? "text-primary/30 cursor-not-allowed"
                : "text-accent hover:text-primary hover:bg-bgLight"
            }`}
            onClick={handleSend}
            disabled={inputDisabled || !input.trim()}
          >
            <Send size={20} className="mr-0.5 mt-0.5" />
          </button>
        </div>
        <p className="text-center text-xs text-primary/30 mt-2">
          Powered by MediFlow AI Agent · Connected to backend at{" "}
          {process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}
        </p>
      </div>
    </div>
  );
}
