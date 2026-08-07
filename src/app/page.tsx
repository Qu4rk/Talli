"use client";

import React, { useEffect, useState } from "react";
import { Play, Clock, Trophy, Users, ArrowRight, Mic, Calendar, Activity, CheckCircle, Plus, Minus, Sparkles, BookOpen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import SessionSetupModal from "../components/SessionSetupModal";
import { useApp, getCyprusClassLabel, CYPRUS_CLASSES } from "@/context/AppContext";
import { triggerMiniPointConfetti } from "@/lib/confettiEffects";

function getGreekVocative(name: string): string {
  const firstName = name.trim().split(" ")[0];
  if (firstName.endsWith("ης") || firstName.endsWith("ας") || firstName.endsWith("ις")) {
    return firstName.slice(0, -1);
  }
  if (firstName.endsWith("ος")) {
    if (firstName === "Αλέξανδρος") return "Αλέξανδρε";
    if (firstName === "Φίλιππος") return "Φίλιππε";
    return firstName.slice(0, -1);
  }
  return firstName;
}

export default function HubScreen() {
  const router = useRouter();
  const { students, reports, activeClass, setActiveClass, activeSubject, lessonTopic, settings, isSetupModalOpen, setIsSetupModalOpen, updateStudentScore } = useApp();

  const [currentDateStr, setCurrentDateStr] = useState("");
  const [greetingText, setGreetingText] = useState("Good Morning");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Talli";
    const now = new Date();
    const formatted = now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    setCurrentDateStr(formatted);

    const hour = now.getHours();
    if (hour < 12) setGreetingText("Good Morning");
    else if (hour < 18) setGreetingText("Good Afternoon");
    else setGreetingText("Good Evening");
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const activeClassLabel = getCyprusClassLabel(activeClass);
  const classStudents = students.filter((s) => s.classId === activeClass);
  const sortedStudents = [...classStudents].sort((a, b) => b.score - a.score);
  const topPerformers = sortedStudents.slice(0, 3);
  const recentReports = reports.slice(0, 3);

  const totalClassPoints = classStudents.reduce((acc, s) => acc + s.score, 0);

  // Dynamic Spoken Vocative Examples based on active class roster
  const student1 = classStudents[0] || { id: 1, name: "Eleni M.", greekName: "Ελένη Μ." };
  const student2 = classStudents[1] || { id: 2, name: "Yiannis P.", greekName: "Γιάννης Π." };
  const student3 = classStudents[2] || { id: 3, name: "Maria K.", greekName: "Μαρία Κ." };
  const student4 = classStudents[3] || { id: 4, name: "Nikos L.", greekName: "Νίκος Λ." };

  const voc1 = getGreekVocative(student1.greekName || student1.name);
  const voc2 = getGreekVocative(student2.greekName || student2.name);
  const voc3 = getGreekVocative(student3.greekName || student3.name);
  const voc4 = getGreekVocative(student4.greekName || student4.name);

  const dynamicCues = [
    { text: `Μπράβο ${voc1}!`, studentId: student1.id, studentName: student1.name, delta: 1, badge: "+1 Point", bg: "bg-[#4ade80]" },
    { text: `Σταμάτα ${voc2}!`, studentId: student2.id, studentName: student2.name, delta: -1, badge: "-1 Point", bg: "bg-[#ff66a3]" },
    { text: `Πολύ ωραία ${voc3}!`, studentId: student3.id, studentName: student3.name, delta: 1, badge: "+1 Point", bg: "bg-[#4ade80]" },
    { text: `Έλα ρε ${voc4}, ησυχία!`, studentId: student4.id, studentName: student4.name, delta: -1, badge: "-1 Point", bg: "bg-[#ff66a3]" },
  ];

  const handleScoreChange = (studentId: number, delta: number, reason: string) => {
    updateStudentScore(studentId, delta, reason);
    if (delta > 0) {
      triggerMiniPointConfetti();
    }
    const student = students.find((s) => s.id === studentId);
    showToast(`${delta > 0 ? "+1 Point" : "-1 Point"} awarded to ${student?.name || "Student"}`);
  };



  return (
    <div className="flex flex-col min-h-screen text-black font-sans relative">
      {/* Unified Header */}
      <Header />

      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-8 z-50 bg-[#4ade80] text-black border-[3px] border-black p-3 shadow-[4px_4px_0_0_#000] font-black text-xs flex items-center gap-2 animate-bounce">
          <Sparkles size={16} /> {toastMessage}
        </div>
      )}

      {/* Main Content Dashboard */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-12 max-w-7xl mx-auto w-full relative z-10 space-y-8">
        
        {/* Top Greeting & Live Metric Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider bg-white px-3 py-1 border-2 border-black shadow-[2px_2px_0_0_#000] w-max mb-2">
              <Calendar size={13} /> {currentDateStr || "Today"}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-black tracking-tighter drop-shadow-[2px_2px_0_#ffffff]">
              {greetingText}, {settings.teacherName || "Jane"}.
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 bg-[#4ade80] text-black px-3 py-1.5 border-2 border-black shadow-[2px_2px_0_0_#000] text-xs font-black">
              <CheckCircle size={14} /> AI Speech Engine Online
            </span>
            <Link
              href="/students"
              className="flex items-center gap-1.5 bg-[#1ac2ff] text-black px-3 py-1.5 border-2 border-black shadow-[2px_2px_0_0_#000] text-xs font-black hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
            >
              <Users size={14} /> {classStudents.length} Enrolled ({activeClassLabel})
            </Link>
          </div>
        </div>

        {/* Compact Non-Overflowing Cyprus Class Selector Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-3 border-[2.5px] border-black shadow-[4px_4px_0_0_#000]">
          <span className="text-xs font-black uppercase tracking-wider text-black/80 flex items-center gap-1.5 shrink-0">
            <BookOpen size={14} /> Switch Active Class:
          </span>

          {/* Quick Pills for Active Classes */}
          {CYPRUS_CLASSES.filter((c) => {
            const count = students.filter((s) => s.classId === c.id).length;
            return count > 0 || c.id === activeClass;
          }).map((c) => {
            const isActive = activeClass === c.id;
            const count = students.filter((s) => s.classId === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setActiveClass(c.id)}
                className={`px-3 py-1 text-xs font-black border-2 border-black shadow-[2px_2px_0_0_#000] transition-all cursor-pointer ${
                  isActive ? "bg-[#ff66a3] text-black font-extrabold" : "bg-slate-100 text-black hover:bg-slate-200"
                }`}
              >
                {c.label} ({count})
              </button>
            );
          })}

          {/* Dropdown for All 36 Cyprus Classes */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[11px] font-bold text-black/60 uppercase">All Grades:</span>
            <select
              value={activeClass}
              onChange={(e) => setActiveClass(e.target.value)}
              className="bg-[#1ac2ff] text-black font-black text-xs px-2.5 py-1 border-2 border-black shadow-[2px_2px_0_0_#000] cursor-pointer outline-none"
            >
              {CYPRUS_CLASSES.map((c) => {
                const count = students.filter((s) => s.classId === c.id).length;
                return (
                  <option key={c.id} value={c.id}>
                    {c.label} ({count} {count === 1 ? "student" : "students"})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Primary Action Grid (Top Row) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Primary Action: Start Session (Neobrutalist Window Card) */}
          <div
            onClick={() => setIsSetupModalOpen(true)}
            className="col-span-1 lg:col-span-2 group cursor-pointer"
          >
            <div className="bg-[#ff66a3] border-[3px] border-black shadow-[8px_8px_0_0_#000000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0_0_#000000] transition-all overflow-hidden h-full flex flex-col justify-between">
              {/* Window Head */}
              <div className="bg-white border-b-[3px] border-black px-4 py-2 flex items-center justify-between text-black font-black text-xs uppercase tracking-widest">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500 border border-black"></span>
                  <span className="w-3 h-3 rounded-full bg-yellow-400 border border-black"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-400 border border-black"></span>
                  LAUNCHPAD // CYPRUS CLASSROOM TRACKING
                </span>
                <span>READY</span>
              </div>

              {/* Window Content */}
              <div className="p-8 md:p-10 text-black flex flex-col justify-between flex-1">
                <div>
                  <div className="inline-block bg-white text-black text-xs font-black px-3 py-1 border-2 border-black shadow-[2px_2px_0_0_#000] uppercase mb-3">
                    Active Target: {activeClassLabel} • {activeSubject}
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black text-black mb-3 tracking-tighter leading-none">
                    Start a Session.
                  </h2>
                  <p className="text-black font-bold text-base md:text-lg max-w-lg mb-6 leading-relaxed">
                    Launch real-time Greek speech recognition for {activeClassLabel}. Praise, corrections, and student participation will be tracked live.
                  </p>
                </div>
                
                <div className="flex items-center gap-3 bg-[#4ade80] text-black px-6 py-3.5 border-[3px] border-black shadow-[4px_4px_0_0_#000000] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-[2px_2px_0_0_#000000] transition-all w-max font-black text-lg cursor-pointer">
                  <Play fill="currentColor" size={22} />
                  Configure & Launch Session
                </div>
              </div>
            </div>
          </div>

          {/* Quick Config / Subject Card */}
          <div className="col-span-1 bg-[#1ac2ff] border-[3px] border-black shadow-[8px_8px_0_0_#000000] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0_0_#000000] transition-all overflow-hidden flex flex-col justify-between">
            <div className="bg-white border-b-[3px] border-black px-4 py-2 flex items-center justify-between text-black font-black text-xs uppercase tracking-widest">
              <span className="flex items-center gap-2">
                <Clock size={15} />
                CURRENT CLASS CONFIG
              </span>
            </div>

            <div className="p-6 md:p-8 text-black flex flex-col justify-between flex-1">
              <div>
                <div className="text-xs font-black uppercase text-black/70 tracking-wider mb-1">Active Section</div>
                <h3 className="text-3xl md:text-4xl font-black text-black mb-2 tracking-tight">
                  {activeClassLabel}
                </h3>

                <div className="text-xs font-black uppercase text-black/70 tracking-wider mt-4 mb-1">Subject & Topic</div>
                <div className="bg-white p-3 border-2 border-black shadow-[2px_2px_0_0_#000] space-y-1">
                  <div className="font-black text-base text-black">{activeSubject}</div>
                  <div className="text-xs text-black/80 font-bold truncate">📖 {lessonTopic}</div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between bg-white p-3 border-[2.5px] border-black shadow-[3px_3px_0_0_#000]">
                <div>
                  <div className="text-lg font-black text-black">+{totalClassPoints} PTS</div>
                  <div className="text-[10px] font-bold text-black/70 uppercase">Total Class Score</div>
                </div>
                <button
                  onClick={() => setIsSetupModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-black bg-[#facc15] border-2 border-black shadow-[1px_1px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
                >
                  Configure Session
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Secondary Widgets Row (3 Column Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Widget 1: Class Leaderboard */}
          <div className="bg-white border-[3px] border-black shadow-[8px_8px_0_0_#000000] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
                <span className="flex items-center gap-2 text-sm font-black text-black uppercase tracking-wider">
                  <Trophy size={18} className="text-[#facc15] stroke-black fill-[#facc15]" />
                  {activeClassLabel} Leaderboard
                </span>
                <Link href="/students" className="text-xs font-black text-black hover:underline flex items-center gap-1">
                  All ({classStudents.length}) <ArrowRight size={12} />
                </Link>
              </div>

              {topPerformers.length === 0 ? (
                <div className="text-xs font-bold text-black/50 italic py-6 text-center">
                  No students in {activeClassLabel} yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {topPerformers.map((student, idx) => {
                    const voc = getGreekVocative(student.greekName || student.name);
                    return (
                      <div key={student.id} className="flex items-center justify-between p-2.5 bg-slate-50 border-2 border-black shadow-[2px_2px_0_0_#000]">
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 flex items-center justify-center font-black text-xs border-2 border-black ${idx === 0 ? "bg-[#facc15]" : idx === 1 ? "bg-slate-200" : "bg-amber-600 text-white"}`}>
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="text-xs font-black text-black flex items-center gap-1">
                              {student.name} <span className="text-[10px] text-black/60 font-mono">({voc})</span>
                            </div>
                            <div className="text-[10px] font-bold text-black/60">{student.greekName || student.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black bg-[#4ade80] px-2 py-0.5 border border-black font-mono">
                            +{student.score}
                          </span>
                          <button
                            onClick={() => handleScoreChange(student.id, 1, "+1 Point Awarded")}
                            className="p-1 bg-[#4ade80] text-black border border-black shadow-[1px_1px_0_0_#000] hover:translate-x-[0.5px] hover:translate-y-[0.5px] transition-all cursor-pointer"
                            title="Quick Award +1"
                          >
                            <Plus size={12} strokeWidth={3} />
                          </button>
                          <button
                            onClick={() => handleScoreChange(student.id, -1, "-1 Point Deducted")}
                            className="p-1 bg-[#ff66a3] text-black border border-black shadow-[1px_1px_0_0_#000] hover:translate-x-[0.5px] hover:translate-y-[0.5px] transition-all cursor-pointer"
                            title="Quick Deduct -1"
                          >
                            <Minus size={12} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Link
              href="/students"
              className="mt-4 w-full text-center py-2 text-xs font-black bg-[#1ac2ff] text-black border-2 border-black shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              Manage Roster & Student Scores →
            </Link>
          </div>

          {/* Widget 2: Recent Sessions */}
          <div className="bg-[#facc15] border-[3px] border-black shadow-[8px_8px_0_0_#000000] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
                <span className="flex items-center gap-2 text-sm font-black text-black uppercase tracking-wider">
                  <Activity size={18} />
                  Recent Session History
                </span>
                <Link href="/reports" className="text-xs font-black text-black hover:underline flex items-center gap-1">
                  Reports ({reports.length}) <ArrowRight size={12} />
                </Link>
              </div>

              {recentReports.length === 0 ? (
                <div className="text-xs font-bold text-black/50 italic py-6 text-center">
                  No sessions completed yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentReports.map((report) => (
                    <div
                      key={report.id}
                      onClick={() => router.push("/reports")}
                      className="bg-white p-3 border-2 border-black shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-black text-black">{report.className}</span>
                        <span className="text-[10px] font-black bg-[#4ade80] px-1.5 py-0.5 border border-black font-mono">
                          {report.participationRate}% Positive
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-black/70">
                        <span>{report.date}</span>
                        <span>+{report.totalPoints} PTS • {report.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/reports"
              className="mt-4 w-full text-center py-2 text-xs font-black bg-white text-black border-2 border-black shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              View Analytics & Export Reports →
            </Link>
          </div>

          {/* Widget 3: Dynamic Voice Cue Reference Guide */}
          <div className="bg-[#c084fc] border-[3px] border-black shadow-[8px_8px_0_0_#000000] p-6 flex flex-col justify-between md:col-span-2 lg:col-span-1">
            <div>
              <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
                <span className="flex items-center gap-2 text-sm font-black text-black uppercase tracking-wider">
                  <Mic size={18} />
                  Voice Cue Cheat Sheet
                </span>
                <span className="text-[10px] font-black bg-white px-2 py-0.5 border border-black font-mono">
                  {activeClassLabel} Roster
                </span>
              </div>

              <div className="space-y-2 text-xs font-bold text-black">
                {dynamicCues.map((cue, idx) => (
                  <div key={idx} className="bg-white p-2 border-2 border-black shadow-[2px_2px_0_0_#000] flex justify-between items-center gap-2">
                    <span className="truncate flex-1 font-extrabold">&quot;{cue.text}&quot;</span>
                    <span className={`${cue.bg} text-black text-[10px] font-black px-2 py-0.5 border border-black shrink-0 font-mono`}>
                      {cue.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 bg-white p-2.5 border-2 border-black text-[11px] font-bold text-black/80 leading-snug">
              💡 <span className="font-black text-black">Pro Tip:</span> Speak vocatives directly (*&quot;{voc1}&quot;*, *&quot;{voc2}&quot;*, *&quot;{voc3}&quot;*). Talli automatically recognizes all variations!
            </div>
          </div>

        </div>

      </main>

      {/* Interactive Cyprus Session Setup Modal */}
      <SessionSetupModal isOpen={isSetupModalOpen} onClose={() => setIsSetupModalOpen(false)} />
    </div>
  );
}
