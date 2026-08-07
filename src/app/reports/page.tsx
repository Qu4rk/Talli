"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Download, FileText, X, Trophy, Sparkles, AlertCircle, HeartHandshake, Plus, PartyPopper, Award, Medal } from "lucide-react";
import Header from "@/components/Header";
import { useApp, SessionReport } from "@/context/AppContext";
import {
  triggerGrandCelebration,
  triggerGoldConfetti,
  triggerSilverConfetti,
  triggerBronzeConfetti,
} from "@/lib/confettiEffects";

export default function ReportsScreen() {
  const { reports, students, activeClass, setActiveClass, updateStudentScore } = useApp();
  const [selectedReport, setSelectedReport] = useState<SessionReport | null>(null);
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    document.title = "Reports | Talli";
  }, []);

  // Filter students by active class
  const classStudents = students.filter((s) => s.classId === activeClass);

  // Sorted Students for Rewards & Support Focus
  const sortedStudents = [...classStudents].sort((a, b) => b.score - a.score);
  const topStudents = sortedStudents.slice(0, 3);
  const remainingStudents = sortedStudents.filter((s) => !topStudents.some((t) => t.id === s.id));
  const lowestStudents = [...remainingStudents].sort((a, b) => a.score - b.score).slice(0, 3);

  const handleExportCSV = (report: SessionReport) => {
    const csvContent = `data:text/csv;charset=utf-8,Session ID,Date,Class,Duration,Total Points,Positive,Negative,Participation Rate\n${report.id},${report.date},${report.className},${report.duration},${report.totalPoints},${report.positiveCount},${report.negativeCount},${report.participationRate}%`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${report.id}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-screen text-white font-sans relative overflow-hidden">

      <Header />

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 max-w-7xl mx-auto w-full relative z-10">
        
        {/* Top Controls & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#ff66a3] border-[3px] border-black shadow-[4px_4px_0_0_#000000] text-black">
                <Trophy size={28} />
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-black drop-shadow-[2px_2px_0_#ffffff]">
                Student Rewards & Reports
              </h1>
            </div>
            <p className="text-slate-800 font-extrabold text-base">Celebrate top scoring achievers and identify students who need encouragement.</p>
          </div>

          {/* Class Roster Selector & Range Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white border-[3px] border-black p-1 shadow-[4px_4px_0_0_#000000] flex items-center gap-1 flex-wrap">
              {[
                { id: "d1", label: "Τάξη Δ'1" },
                { id: "b3", label: "Τάξη Β'3" },
                { id: "a2", label: "Τάξη Α'2" },
                { id: "e1", label: "Τάξη Ε'1" },
                { id: "st4", label: "Τάξη ΣΤ'4" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveClass(c.id)}
                  className={`px-3 py-1.5 text-xs font-black transition-all cursor-pointer ${
                    activeClass === c.id ? "bg-[#1ac2ff] text-black border-2 border-black shadow-[2px_2px_0_0_#000]" : "text-black hover:bg-slate-100"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="bg-white border-[3px] border-black p-1 shadow-[4px_4px_0_0_#000000] flex items-center gap-1">
              <Calendar size={16} className="text-black ml-2" />
              <button
                onClick={() => setDateFilter("all")}
                className={`px-3 py-1.5 text-xs font-black transition-all ${
                  dateFilter === "all" ? "bg-[#ff66a3] text-black border-2 border-black shadow-[2px_2px_0_0_#000]" : "text-black hover:bg-slate-100"
                }`}
              >
                All Time
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 1: REWARDS PODIUM (TOP 3 SCORERS WITH CONFETTI) */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-white font-black text-xl tracking-tight drop-shadow-[2px_2px_0_#000]">
              <Sparkles className="text-[#facc15]" size={24} />
              <span>Top 3 Student Achievers (Rewards List)</span>
            </div>
            <button
              onClick={(e) => triggerGrandCelebration(e)}
              className="flex items-center gap-2 bg-[#facc15] text-black px-4 py-2 border-[3px] border-black shadow-[4px_4px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] font-black text-xs transition-all cursor-pointer"
            >
              <PartyPopper size={16} /> Celebrate All Achievers!
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1st Place Gold */}
            {topStudents[0] && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#facc15] border-[3px] border-black shadow-[10px_10px_0_0_#000000] text-black overflow-hidden flex flex-col justify-between min-w-0"
              >
                <div className="bg-white border-b-[3px] border-black px-4 py-2 font-black text-xs uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Trophy size={16} className="text-[#facc15] stroke-black fill-[#facc15]" /> 1st PLACE // GOLD REWARD</span>
                  <Trophy size={16} className="text-[#facc15] stroke-black fill-[#facc15]" />
                </div>
                <div className="p-6">
                  <div className="text-4xl font-black text-black tracking-tighter mb-1">
                    {topStudents[0].score} <span className="text-sm">PTS</span>
                  </div>
                  <h3 className="text-2xl font-black text-black tracking-tight mb-2 truncate" title={topStudents[0].name}>{topStudents[0].name}</h3>
                  <p className="text-xs font-bold text-black/80 mb-6">Top performing contributor in class!</p>

                  <button
                    onClick={(e) => triggerGoldConfetti(e)}
                    className="w-full bg-white text-black py-2.5 border-[3px] border-black shadow-[3px_3px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <PartyPopper size={16} /> Celebrate 1st Place!
                  </button>
                </div>
              </motion.div>
            )}

            {/* 2nd Place Silver */}
            {topStudents[1] && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#e2e8f0] border-[3px] border-black shadow-[10px_10px_0_0_#000000] text-black overflow-hidden flex flex-col justify-between min-w-0"
              >
                <div className="bg-white border-b-[3px] border-black px-4 py-2 font-black text-xs uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Award size={16} className="text-slate-700 stroke-black fill-slate-300" /> 2nd PLACE // SILVER REWARD</span>
                  <Trophy size={16} className="text-slate-400 stroke-black fill-slate-300" />
                </div>
                <div className="p-6">
                  <div className="text-4xl font-black text-black tracking-tighter mb-1">
                    {topStudents[1].score} <span className="text-sm">PTS</span>
                  </div>
                  <h3 className="text-2xl font-black text-black tracking-tight mb-2 truncate" title={topStudents[1].name}>{topStudents[1].name}</h3>
                  <p className="text-xs font-bold text-black/80 mb-6">Consistent active participant!</p>

                  <button
                    onClick={(e) => triggerSilverConfetti(e)}
                    className="w-full bg-white text-black py-2.5 border-[3px] border-black shadow-[3px_3px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <PartyPopper size={16} /> Celebrate 2nd Place!
                  </button>
                </div>
              </motion.div>
            )}

            {/* 3rd Place Bronze */}
            {topStudents[2] && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#fb923c] border-[3px] border-black shadow-[10px_10px_0_0_#000000] text-black overflow-hidden flex flex-col justify-between min-w-0"
              >
                <div className="bg-white border-b-[3px] border-black px-4 py-2 font-black text-xs uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Medal size={16} className="text-amber-800 stroke-black fill-amber-600" /> 3rd PLACE // BRONZE REWARD</span>
                  <Trophy size={16} className="text-amber-700 stroke-black fill-amber-600" />
                </div>
                <div className="p-6">
                  <div className="text-4xl font-black text-black tracking-tighter mb-1">
                    {topStudents[2].score} <span className="text-sm">PTS</span>
                  </div>
                  <h3 className="text-2xl font-black text-black tracking-tight mb-2 truncate" title={topStudents[2].name}>{topStudents[2].name}</h3>
                  <p className="text-xs font-bold text-black/80 mb-6">Great effort & discussion leader!</p>

                  <button
                    onClick={(e) => triggerBronzeConfetti(e)}
                    className="w-full bg-white text-black py-2.5 border-[3px] border-black shadow-[3px_3px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <PartyPopper size={16} /> Celebrate 3rd Place!
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* SECTION 2: TEACHER FOCUS LIST (LOWEST SCORING STUDENTS NEEDING ENCOURAGEMENT) */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-white font-black text-xl tracking-tight mb-4 drop-shadow-[2px_2px_0_#000]">
            <AlertCircle className="text-[#ff66a3]" size={24} />
            <span>Students Needing Teacher Focus & Encouragement</span>
          </div>

          <div className="bg-[#ff66a3] border-[3px] border-black shadow-[10px_10px_0_0_#000000] text-black overflow-hidden">
            <div className="bg-white border-b-[3px] border-black px-4 py-2 font-black text-xs uppercase flex items-center justify-between">
              <span>TEACHER ACTION LIST // LOWEST SCORING ATTENTION GROUP</span>
              <span className="bg-[#facc15] px-2.5 py-0.5 border border-black font-black">
                {lowestStudents.length} Students Flagged
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {lowestStudents.length > 0 ? (
                lowestStudents.map((student) => (
                  <div key={student.id} className="bg-white border-[3px] border-black p-5 shadow-[4px_4px_0_0_#000] flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h4 className="text-xl font-black text-black truncate" title={student.name}>{student.name}</h4>
                        <span className="bg-rose-100 text-rose-700 font-black px-2 py-0.5 border border-black text-xs shrink-0">
                          {student.score} PTS
                        </span>
                      </div>
                      <div className="text-xs font-bold text-black/70 mb-4 flex items-center gap-1.5">
                        <HeartHandshake size={14} className="text-rose-600 shrink-0" />
                        <span>Action: Prompt in next session / 1-on-1 check-in</span>
                      </div>
                    </div>

                    <button
                      onClick={() => updateStudentScore(student.id, 2, "+2 Encouragement")}
                      className="w-full bg-[#4ade80] text-black py-2 border-2 border-black shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus size={16} strokeWidth={3} /> Give +2 Encouragement Boost
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center text-xs font-black italic text-black/70 py-4 bg-white border-2 border-black">
                  All active students in this class are currently on the top achievers podium!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: RECENT SESSION LOGS TABLE */}
        <div className="bg-white border-[3px] border-black shadow-[10px_10px_0_0_#000000] text-black overflow-hidden mb-8">
          <div className="bg-white border-b-[3px] border-black px-6 py-3 flex items-center justify-between font-black text-xs uppercase">
            <span>WINDOW // RECENT SESSION LOGS</span>
            <span className="bg-[#4ade80] px-3 py-1 border-2 border-black shadow-[2px_2px_0_0_#000]">
              {reports.length} Recorded Sessions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-[3px] border-black bg-[#facc15] text-xs font-black uppercase tracking-wider text-black">
                  <th className="p-4 pl-6">Session ID</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Class Roster</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Total Points</th>
                  <th className="p-4">Participation</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black text-sm font-bold">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-100 transition-colors">
                    <td className="p-4 pl-6 font-mono font-black">{report.id}</td>
                    <td className="p-4">{report.date}</td>
                    <td className="p-4">{report.className}</td>
                    <td className="p-4">{report.duration}</td>
                    <td className="p-4 font-black">+{report.totalPoints} pts</td>
                    <td className="p-4">
                      <span className="bg-[#4ade80] text-black font-black px-2.5 py-1 border-2 border-black shadow-[1px_1px_0_0_#000] text-xs">
                        {report.participationRate}% Positive
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="px-3 py-1.5 text-xs font-black bg-[#1ac2ff] text-black border-2 border-black shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                        >
                          View Detail
                        </button>
                        <button
                          onClick={() => handleExportCSV(report)}
                          className="p-1.5 bg-white text-black border-2 border-black shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                          title="Export CSV"
                        >
                          <Download size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Session Details Modal (Neobrutalist Window) */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#c084fc] border-[3px] border-black shadow-[12px_12px_0_0_#000000] max-w-lg w-full text-black overflow-hidden relative"
            >
              <div className="bg-white border-b-[3px] border-black px-4 py-2 flex items-center justify-between font-black text-xs uppercase">
                <span>WINDOW // SESSION BREAKDOWN</span>
                <button onClick={() => setSelectedReport(null)} className="hover:text-red-500">
                  <X size={18} strokeWidth={3} />
                </button>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-white border-[3px] border-black shadow-[3px_3px_0_0_#000] flex items-center justify-center font-black">
                    <FileText size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-black">{selectedReport.className}</h2>
                    <p className="text-xs text-black font-extrabold">{selectedReport.date} ({selectedReport.duration})</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white p-4 border-[3px] border-black shadow-[3px_3px_0_0_#000]">
                    <div className="text-xs font-black uppercase mb-1">Total Points</div>
                    <div className="text-2xl font-black text-black">+{selectedReport.totalPoints}</div>
                  </div>
                  <div className="bg-white p-4 border-[3px] border-black shadow-[3px_3px_0_0_#000]">
                    <div className="text-xs font-black uppercase mb-1">Positive / Negative</div>
                    <div className="text-2xl font-black text-black">{selectedReport.positiveCount} / {selectedReport.negativeCount}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t-[3px] border-black">
                  <button
                    onClick={(e) => triggerGrandCelebration(e)}
                    className="bg-[#facc15] text-black px-4 py-2 border-2 border-black shadow-[2px_2px_0_0_#000] font-black text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <PartyPopper size={16} /> Fire Confetti
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleExportCSV(selectedReport)}
                      className="bg-[#4ade80] text-black px-4 py-2 border-2 border-black shadow-[2px_2px_0_0_#000] font-black text-xs flex items-center gap-1.5"
                    >
                      <Download size={14} strokeWidth={2.5} /> CSV
                    </button>
                    <button
                      onClick={() => setSelectedReport(null)}
                      className="bg-white text-black px-4 py-2 border-2 border-black shadow-[2px_2px_0_0_#000] font-black text-xs"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
