"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, RotateCcw, CheckCircle, ArrowRight, Activity, Calendar } from "lucide-react";

/* ─── Types ── */
interface Message { role: "ai" | "user"; text: string; }
interface Doctor { name: string; spec: string; availability: string; fee: string; location: string; rating: string; }
interface Assessment { riskLevel: string; aiSummary: string; suggestions: string[]; severity?: string; }

/* ─── Fallback logic ── */
const FALLBACK_QUESTIONS = [
  "How long have you been experiencing this?",
  "Rate severity 1–10?",
  "Any medications taken so far?",
  "Any known allergies or conditions?"
];

const WELLNESS_QUESTIONS = [
  "How has your sleep been lately?",
  "How would you rate your energy levels and diet this week?",
  "Any stress, anxiety, or anything on your mind?"
];

/* ─── Helpers ── */
function matchSpec(text: string): string {
  const t = text.toLowerCase();
  if (/chest|heart|palpitation/.test(t)) return "Cardiologist";
  if (/head|migraine|dizzy/.test(t)) return "Neurologist";
  if (/skin|rash|acne|itch/.test(t)) return "Dermatologist";
  if (/stomach|abdomen|nausea/.test(t)) return "Gastroenterologist";
  if (/bone|joint|back|muscle/.test(t)) return "Orthopedic Specialist";
  if (/mental|anxiety|stress|sleep/.test(t)) return "Psychiatrist";
  if (/eye|vision|sight/.test(t)) return "Ophthalmologist";
  if (/ear|nose|throat|sinus/.test(t)) return "ENT Specialist";
  return "General Physician";
}

const DOCTOR_DB: Record<string, Doctor[]> = {
  "Cardiologist":        [{ name:"Dr. Arvind Kapoor",      spec:"Cardiologist",        availability:"Available Today",         fee:"₹800", location:"Apollo Heart Centre, Bandra",          rating:"⭐ 4.8" },{ name:"Dr. Meena Nair",         spec:"Cardiologist",        availability:"Next Available: Tomorrow",     fee:"₹500", location:"Fortis Cardiac, Koregaon Park",        rating:"⭐ 4.6" },{ name:"Dr. Ramesh Iyer",        spec:"Cardiologist",        availability:"Available in 2 days",         fee:"₹300", location:"City Hospital, Connaught Place",       rating:"⭐ 4.5" }],
  "Neurologist":         [{ name:"Dr. Priya Sharma",       spec:"Neurologist",         availability:"Available Today",         fee:"₹500", location:"Max Neuro Centre, Saket",             rating:"⭐ 4.7" },{ name:"Dr. Suresh Patil",       spec:"Neurologist",         availability:"Next Available: Tomorrow",     fee:"₹800", location:"Apollo Neuro, Jubilee Hills",          rating:"⭐ 4.9" },{ name:"Dr. Kavita Rao",         spec:"Neurologist",         availability:"Available in 2 days",         fee:"₹300", location:"Medanta Brain, Gurugram",             rating:"⭐ 4.5" }],
  "Dermatologist":       [{ name:"Dr. Ananya Mehta",       spec:"Dermatologist",       availability:"Available Today",         fee:"₹300", location:"SkinCare Clinic, Indiranagar",        rating:"⭐ 4.6" },{ name:"Dr. Vikram Shah",        spec:"Dermatologist",       availability:"Next Available: Tomorrow",     fee:"₹500", location:"DermaCare, Linking Road",             rating:"⭐ 4.7" },{ name:"Dr. Pooja Gupta",        spec:"Dermatologist",       availability:"Available in 2 days",         fee:"₹800", location:"Apollo Skin, Anna Nagar",             rating:"⭐ 4.8" }],
  "Gastroenterologist":  [{ name:"Dr. Karan Bose",         spec:"Gastroenterologist",  availability:"Available Today",         fee:"₹500", location:"GI Clinic, Salt Lake City",          rating:"⭐ 4.7" },{ name:"Dr. Sunita Verma",       spec:"Gastroenterologist",  availability:"Next Available: Tomorrow",     fee:"₹800", location:"Fortis GI, Mulund",                   rating:"⭐ 4.6" },{ name:"Dr. Raju Krishnan",      spec:"Gastroenterologist",  availability:"Available in 2 days",         fee:"₹300", location:"City GI Hospital, T. Nagar",          rating:"⭐ 4.5" }],
  "Orthopedic Specialist":[{ name:"Dr. Anil Mathur",       spec:"Orthopedic Specialist",availability:"Available Today",        fee:"₹500", location:"Bone & Joint Clinic, Punjabi Bagh",  rating:"⭐ 4.8" },{ name:"Dr. Deepa Joshi",        spec:"Orthopedic Specialist",availability:"Next Available: Tomorrow",    fee:"₹300", location:"OrthoMax, FC Road",                   rating:"⭐ 4.6" },{ name:"Dr. Rajesh Tiwari",      spec:"Orthopedic Specialist",availability:"Available in 2 days",        fee:"₹800", location:"Apollo Ortho, Jubilee Hills",         rating:"⭐ 4.7" }],
  "Psychiatrist":        [{ name:"Dr. Nidhi Arora",        spec:"Psychiatrist",        availability:"Available Today",         fee:"₹800", location:"MindCare Centre, Banjara Hills",      rating:"⭐ 4.9" },{ name:"Dr. Sameer Kulkarni",    spec:"Psychiatrist",        availability:"Next Available: Tomorrow",     fee:"₹500", location:"Wellness Clinic, Koramangala",        rating:"⭐ 4.7" },{ name:"Dr. Asha Singh",         spec:"Psychiatrist",        availability:"Available in 2 days",         fee:"₹300", location:"NeuroMind, Connaught Place",          rating:"⭐ 4.6" }],
  "General Physician":   [{ name:"Dr. Rajiv Malhotra",     spec:"General Physician",   availability:"Available Today",         fee:"₹300", location:"Family Care Clinic, Sector 15",      rating:"⭐ 4.6" },{ name:"Dr. Usha Krishnamurthy", spec:"General Physician",   availability:"Next Available: Tomorrow",     fee:"₹500", location:"HealthFirst, Koramangala",           rating:"⭐ 4.7" },{ name:"Dr. Pawan Khanna",       spec:"General Physician",   availability:"Available in 2 days",         fee:"₹800", location:"Apollo Clinic, Bandra",              rating:"⭐ 4.8" }],
};

function getWellnessTips(symptom: string): string[] {
  return ["Drink 8+ glasses of water daily", "Get 7–8 hours of quality sleep", "Incorporate light stretching or walking", "Maintain a balanced, nutritious diet"];
}

function randomTime(): string {
  const h = [10,11,12,14,15,16,17,18][Math.floor(Math.random()*8)];
  const m = Math.random()>0.5?"00":"30";
  return `${h>12?h-12:h}:${m} ${h<12?"AM":"PM"}`;
}

export default function HealthChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  
  // States
  const [convHist, setConvHist] = useState<{role:string;content:string}[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  
  // Phase tracking
  const [phase, setPhase] = useState<"chat"|"flowchart"|"options"|"doctors"|"tips"|"booked">("chat");
  const [bookingDoc, setBookingDoc] = useState<Doctor|null>(null);
  const [isBooking, setIsBooking] = useState(false);
  
  // Modes
  const [useFallback, setFallback] = useState(false);
  const [wellnessMode, setWellnessMode] = useState(false);
  const [qIndex, setQIndex] = useState(0); // for fallback/wellness
  
  const bottomRef = useRef<HTMLDivElement>(null);

  const user = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("mediflow_user") || "{}") : {};
  const userName = user?.name || "there";

  useEffect(() => {
    setTyping(true);
    const t = setTimeout(() => {
      setTyping(false);
      const firstQ = `Hi ${userName}! 👋 I'm your MediFlow AI health assistant. Tell me — what's bothering you today, or how are you feeling overall?`;
      setMessages([{ role:"ai", text:firstQ }]);
      setConvHist([{ role:"assistant", content:firstQ }]);
    }, 900);
    return () => clearTimeout(t);
  }, [userName]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, typing, phase, bookingDoc]);

  /* ─── Save History ── */
  const saveToHistory = (ast: Assessment) => {
    try {
      const key = "mediflow_health_history";
      const prev = JSON.parse(localStorage.getItem(key) || "[]");
      prev.unshift({
        id: Date.now(),
        date: new Date().toISOString(),
        symptoms: answers[0] || "General checkup",
        severity: ast.severity || "Mild",
        riskLevel: ast.riskLevel,
        aiSummary: ast.aiSummary,
        suggestions: ast.suggestions || getWellnessTips("")
      });
      localStorage.setItem(key, JSON.stringify(prev));
      window.dispatchEvent(new Event("healthHistoryUpdated"));
    } catch {}
  };

  /* ─── Message Handler ── */
  const handleSend = async () => {
    const val = input.trim();
    if (!val || typing) return;
    setInput("");
    
    setMessages(p => [...p, { role:"user", text:val }]);
    const newAnswers = [...answers, val];
    setAnswers(newAnswers);
    const newHist = [...convHist, { role:"user", content:val }];
    setConvHist(newHist);
    setTyping(true);

    // 1. Check if first message is "healthy"
    if (newAnswers.length === 1 && /fine|good|healthy|great|well|no issue|nothing|okay|normal/i.test(val)) {
      setWellnessMode(true);
      setTimeout(() => {
        setTyping(false);
        setMessages(p => [...p, { role:"ai", text:"That's wonderful to hear! 😊 Let me do a quick wellness check to make sure everything is in order.\n\n" + WELLNESS_QUESTIONS[0] }]);
      }, 1000);
      return;
    }

    // 2. If in wellness mode
    if (wellnessMode) {
      const next = qIndex + 1;
      if (next < WELLNESS_QUESTIONS.length) {
        setQIndex(next);
        setTimeout(() => { setTyping(false); setMessages(p => [...p, { role:"ai", text:WELLNESS_QUESTIONS[next] }]); }, 1000);
      } else {
        setTimeout(() => {
          setTyping(false);
          const ast = {
            riskLevel: "Low Risk",
            aiSummary: "You appear to be in good health. Keep up your healthy habits!",
            suggestions: ["Stay hydrated", "Maintain regular sleep schedule", "Light exercise daily", "Regular health checkups"],
            severity: "None"
          };
          setAssessment(ast);
          saveToHistory(ast);
          setPhase("flowchart");
        }, 1500);
      }
      return;
    }

    // 3. Fallback flow
    if (useFallback) {
      const next = qIndex + 1;
      if (next < FALLBACK_QUESTIONS.length) {
        setQIndex(next);
        setTimeout(() => { setTyping(false); setMessages(p => [...p, { role:"ai", text:FALLBACK_QUESTIONS[next] }]); }, 1000);
      } else {
        setTimeout(() => {
          setTyping(false);
          const ast = {
            riskLevel: "Moderate Risk",
            aiSummary: "Based on your symptoms, this requires basic medical attention but doesn't seem like an emergency.",
            suggestions: ["Rest", "Hydrate", "Consult a doctor if it worsens"],
            severity: "Moderate"
          };
          setAssessment(ast);
          saveToHistory(ast);
          setPhase("flowchart");
        }, 1500);
      }
      return;
    }

    // 4. API flow
    try {
      const res = await fetch("http://localhost:5000/api/triage/chat", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ userMessage:val, conversationHistory:newHist, patientProfile:user }),
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) throw new Error("bad response");
      const data = await res.json();
      setTyping(false);
      setMessages(p => [...p, { role:"ai", text:data.aiMessage }]);
      setConvHist(p => [...p, { role:"assistant", content:data.aiMessage }]);
      
      if (data.isComplete) {
        const ast = data.assessment || { riskLevel:"Moderate Risk", aiSummary:data.aiMessage, suggestions:["Rest","Hydrate"], severity:"Moderate" };
        setAssessment(ast);
        saveToHistory(ast);
        setPhase("flowchart");
      }
    } catch {
      // Switch to fallback on fail
      setFallback(true);
      setQIndex(0);
      setTimeout(() => {
        setTyping(false);
        setMessages(p => [...p, { role:"ai", text:FALLBACK_QUESTIONS[0] }]);
      }, 500);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  /* ─── Doctor Flow ── */
  const handleShowDoctors = () => {
    setMessages(p => [...p, { role:"ai", text:"Here are some recommended doctors based on your symptoms:" }]);
    setPhase("doctors");
  };

  const handleJustTips = () => {
    const tips = assessment?.suggestions || getWellnessTips("");
    setMessages(p => [...p, { role:"ai", text:`Here are a few wellness tips for you:\n\n${tips.map((t,i)=>`${i+1}. ${t}`).join("\n")}` }]);
    setTimeout(() => {
      setMessages(p => [...p, { role:"ai", text:"Feel free to reach out anytime your symptoms change 🙂" }]);
      setPhase("tips");
    }, 1000);
  };

  const handleBook = (doc: Doctor) => {
    setIsBooking(true);
    setBookingDoc(doc);
    setPhase("booked");
    setMessages(p => [...p, { role:"ai", text:`Booking your appointment with ${doc.name}...` }]);
    
    setTimeout(() => {
      setMessages(p => [...p, { role:"ai", text:`✅ Confirmed! ${doc.name} — Today. A confirmation has been sent to your email.` }]);
      setIsBooking(false);
      
      // Save
      try {
        const key="mediflow_appointments";
        const prev=JSON.parse(localStorage.getItem(key)||"[]");
        prev.unshift({
          id: Date.now(),
          doctorName: doc.name, specialization: doc.spec, clinicName: doc.location, fee: doc.fee,
          dateTime: new Date().toDateString()+" "+randomTime(),
          status: "upcoming",
          bookedOn: new Date().toISOString()
        });
        localStorage.setItem(key, JSON.stringify(prev));
        window.dispatchEvent(new Event("appointmentUpdated"));
      } catch {}
    }, 1500);
  };

  const resetChat = () => {
    setMessages([]); setInput(""); setTyping(false); setPhase("chat");
    setConvHist([]); setAnswers([]); setAssessment(null);
    setBookingDoc(null); setIsBooking(false); setFallback(false); setWellnessMode(false); setQIndex(0);
    setTimeout(() => {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        const firstQ = `Hi ${userName}! 👋 I'm your MediFlow AI health assistant. Tell me — what's bothering you today, or how are you feeling overall?`;
        setMessages([{ role:"ai", text:firstQ }]);
        setConvHist([{ role:"assistant", content:firstQ }]);
      }, 900);
    }, 100);
  };

  const renderFlowchart = () => {
    if (!assessment) return null;
    const color = assessment.riskLevel.toLowerCase().includes("high") ? "bg-danger text-white border-danger" : 
                  assessment.riskLevel.toLowerCase().includes("moderate") ? "bg-warning text-white border-warning" : "bg-success text-white border-success";
    
    return (
      <div className="my-4 flex flex-col gap-3 animate-fadeUp">
        <div className="flex items-center justify-between bg-bgLight p-3 rounded-xl border border-bgSoft overflow-x-auto">
          <div className="flex items-center gap-2 whitespace-nowrap min-w-max px-2">
            <div className="bg-white border border-bgSoft px-3 py-1.5 rounded-lg text-xs font-semibold text-primary">Symptoms</div>
            <ArrowRight size={14} className="text-secondary"/>
            <div className="bg-white border border-bgSoft px-3 py-1.5 rounded-lg text-xs font-semibold text-primary">AI Analysis</div>
            <ArrowRight size={14} className="text-secondary"/>
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${color}`}>{assessment.riskLevel}</div>
            <ArrowRight size={14} className="text-secondary"/>
            <div className="bg-white border border-bgSoft px-3 py-1.5 rounded-lg text-xs font-semibold text-primary">Recommendation</div>
          </div>
        </div>
        
        {phase === "flowchart" && (
          <div className="bg-white border border-bgSoft rounded-xl p-4 mt-2">
            <p className="text-sm text-primary mb-4 font-medium leading-relaxed">Based on my assessment, here's what I recommend. Would you like me to find available doctors for you?</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleShowDoctors} className="bg-primary hover:bg-secondary transition-colors text-white text-xs font-bold px-4 py-2 rounded-full">Yes, find doctors 👨‍⚕️</button>
              <button onClick={handleJustTips} className="bg-bgLight hover:bg-bgSoft transition-colors text-primary text-xs font-bold px-4 py-2 rounded-full border border-bgSoft">No, just suggestions</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const disabled = typing || (phase !== "chat");
  const spec = matchSpec(answers[0]||"");
  const recommendedDoctors = DOCTOR_DB[spec] || DOCTOR_DB["General Physician"];

  return (
    <div className="flex flex-col h-full bg-[#f0f7fb]">
      {/* ─── Chat Area ─── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m,i) => (
          <div key={i} className={`flex ${m.role==="user"?"justify-end":"justify-start"}`}>
            {m.role==="ai" && <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0 self-end mr-2"><Bot size={16} className="text-white"/></div>}
            <div className={`max-w-[80%] px-5 py-3 text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap ${m.role==="ai"?"bg-[#9ecfe3] text-primary rounded-[18px] rounded-bl-sm font-medium":"bg-white text-primary rounded-[18px] rounded-br-sm border border-bgSoft"}`}>
              {m.text}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0"><Bot size={16} className="text-white"/></div>
            <div className="bg-white border border-bgSoft px-5 py-4 rounded-[18px] rounded-bl-sm flex gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce" style={{animationDelay:"0ms"}}/>
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce" style={{animationDelay:"150ms"}}/>
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-bounce" style={{animationDelay:"300ms"}}/>
            </div>
          </div>
        )}

        {/* Elements injected based on phase */}
        {(phase !== "chat") && renderFlowchart()}

        {phase === "doctors" && (
          <div className="ml-9 flex flex-col gap-3 animate-fadeUp">
            {recommendedDoctors.map((doc,i)=>(
              <div key={i} className="bg-white border border-bgSoft rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-primary text-base">{doc.name}</div>
                    <div className="text-secondary text-sm font-semibold">{doc.spec}</div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${doc.availability.includes("Today")?"bg-success/10 text-success":"bg-warning/10 text-warning"}`}>{doc.availability}</span>
                </div>
                <div className="flex gap-4 text-[13px] text-primary/60 mb-4">
                  <span>{doc.rating}</span><span>📍 {doc.location}</span><span>💰 {doc.fee}</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={()=>handleBook(doc)} className="bg-primary text-white text-sm font-bold px-4 py-2.5 rounded-lg flex-1 hover:bg-secondary transition-colors shadow-sm">Book Appointment</button>
                  <button className="bg-bgLight text-primary text-sm font-bold px-4 py-2.5 rounded-lg flex-1 border border-bgSoft hover:bg-white transition-colors">View Profile</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {(phase === "tips" || (phase === "booked" && !isBooking)) && (
          <div className="flex justify-center mt-5">
            <button onClick={resetChat} className="bg-white border border-bgSoft text-primary text-sm font-bold px-5 py-3 rounded-full flex items-center gap-2 shadow-sm hover:bg-bgLight transition-colors">
              <RotateCcw size={16}/> Start New Check
            </button>
          </div>
        )}

        <div ref={bottomRef}/>
      </div>

      {/* ─── Input Area ─── */}
      <div className="p-4 bg-[#f0f7fb] shrink-0 border-t border-bgSoft/50">
        <div className="flex gap-3 max-w-2xl mx-auto">
          <input 
            className={`flex-1 bg-white border border-bgSoft rounded-full px-5 py-3 text-[15px] outline-none transition-colors shadow-sm ${disabled ? "opacity-60 cursor-not-allowed" : "focus:border-secondary focus:ring-1 focus:ring-secondary"}`}
            placeholder={disabled ? (phase !== "chat" ? "Follow the prompts above..." : "MediFlow AI is typing...") : "Message triage..."}
            value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKey} disabled={disabled}
          />
          <button 
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors bg-white shadow-sm border border-bgSoft ${(disabled||!input.trim()) ? "text-primary/30 cursor-not-allowed" : "text-accent hover:text-primary hover:bg-bgLight"}`}
            onClick={handleSend} disabled={disabled||!input.trim()}
          >
            <Send size={20} className="mr-0.5 mt-0.5"/>
          </button>
        </div>
      </div>
    </div>
  );
}
