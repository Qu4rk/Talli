"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Search, Trash2, Award, Tag, X, UserPlus, Check, Sparkles, Crown, Trophy } from "lucide-react";
import Header from "@/components/Header";
import { useApp, Student, CYPRUS_GRADES } from "@/context/AppContext";

const CARD_COLORS = [
  "bg-[#ff66a3]", // Pink
  "bg-[#1ac2ff]", // Cyan
  "bg-[#4ade80]", // Green
  "bg-[#facc15]", // Yellow
  "bg-[#c084fc]", // Purple
];

const CORE_CATEGORIES = ["Top Speaker", "Engaged", "Consistent", "Collaborative"];

export default function StudentsScreen() {
  const { activeClass, setActiveClass, students, addStudent, updateStudentScore, updateStudentTags, deleteStudent } = useApp();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [newName, setNewName] = useState("");
  const [newGreekName, setNewGreekName] = useState("");
  const [newInitials, setNewInitials] = useState("");
  const [newTag, setNewTag] = useState("");

  const [customTag, setCustomTag] = useState("");

  useEffect(() => {
    document.title = "Students | Talli";
  }, []);

  const classStudents = students.filter((s) => s.classId === activeClass);

  // Compute clean available subcategory tags dynamically
  const extraTags = classStudents
    .flatMap((s) => s.tags || [])
    .filter((t) => !CORE_CATEGORIES.includes(t));

  const availableTags = Array.from(new Set([...CORE_CATEGORIES, ...extraTags]));

  const filteredStudents = classStudents.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.greekName && s.greekName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = !selectedTag || (s.tags && s.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const initials = newInitials.trim() || newName.trim().split(/\s+/).map((n) => n[0]).filter(Boolean).join("").toUpperCase().slice(0, 2);
    const tags = newTag.trim() ? [newTag.trim()] : undefined;

    addStudent({
      name: newName.trim(),
      greekName: newGreekName.trim() || newName.trim(),
      initials,
      classId: activeClass,
      tags,
    });

    setNewName("");
    setNewGreekName("");
    setNewInitials("");
    setNewTag("");
    setIsAddModalOpen(false);
  };

  // Average points for active category or overall class
  const classAvg = filteredStudents.length > 0
    ? Math.round(filteredStudents.reduce((acc, s) => acc + s.score, 0) / filteredStudents.length)
    : 0;

  // Category MVP: highest point scorer among currently filtered students
  const categoryMvp = filteredStudents.length > 0
    ? [...filteredStudents].sort((a, b) => b.score - a.score)[0]
    : null;

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
                <Users size={28} />
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-black drop-shadow-[2px_2px_0_#ffffff]">Students & Rosters</h1>
            </div>
            <p className="text-slate-800 font-extrabold text-base">Manage class rosters, track metrics, and reward category leaders.</p>
          </div>

          {/* Class Roster Selector & Add Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 border-[3px] border-black shadow-[4px_4px_0_0_#000] mb-6">
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Grade Level Tabs */}
              <div className="flex items-center bg-slate-100 border-2 border-black p-1">
                {CYPRUS_GRADES.map((g) => {
                  const isGradeActive = activeClass.startsWith(g.code);
                  return (
                    <button
                      key={g.code}
                      onClick={() => {
                        setActiveClass(`${g.code}1`);
                        setSelectedTag(null);
                      }}
                      className={`px-3 py-1 text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                        isGradeActive
                          ? "bg-[#ff66a3] text-black border-2 border-black shadow-[1.5px_1.5px_0_0_#000]"
                          : "text-black hover:bg-slate-200"
                      }`}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Section Chips for Active Grade */}
              <div className="flex items-center gap-1.5 bg-slate-50 border-2 border-black p-1">
                <span className="text-[10px] font-black uppercase text-black/60 px-1">Section:</span>
                {["1", "2", "3", "4", "5", "6"].map((sec) => {
                  const currentGradeCode = activeClass.replace(/[0-9]/g, "") || "d";
                  const targetId = `${currentGradeCode}${sec}`;
                  const isSecActive = activeClass === targetId;
                  return (
                    <button
                      key={sec}
                      onClick={() => {
                        setActiveClass(targetId);
                        setSelectedTag(null);
                      }}
                      className={`px-2.5 py-0.5 text-xs font-black transition-all cursor-pointer ${
                        isSecActive
                          ? "bg-[#1ac2ff] text-black border-2 border-black shadow-[1.5px_1.5px_0_0_#000]"
                          : "bg-white text-black hover:bg-slate-100 border border-black/40"
                      }`}
                    >
                      {sec}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-[#4ade80] text-black px-5 py-2 border-[3px] border-black shadow-[3px_3px_0_0_#000000] hover:translate-x-[1px] hover:translate-y-[1px] font-black text-xs transition-all cursor-pointer whitespace-nowrap ml-auto"
            >
              <UserPlus size={16} strokeWidth={2.5} />
              Add Student
            </button>
          </div>
        </div>

        {/* Class Overview Metric Cards (Neobrutalist Windows) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1ac2ff] border-[3px] border-black shadow-[8px_8px_0_0_#000000] text-black">
            <div className="bg-white border-b-[3px] border-black px-4 py-1.5 font-black text-xs uppercase tracking-wider flex justify-between items-center">
              <span className="whitespace-nowrap">METRIC // ENROLLMENT</span>
              <Users size={14} />
            </div>
            <div className="p-6">
              <div className="text-3xl font-black text-black">
                {filteredStudents.length} {selectedTag ? `in "${selectedTag}"` : "Students"}
              </div>
            </div>
          </div>

          <div className="bg-[#facc15] border-[3px] border-black shadow-[8px_8px_0_0_#000000] text-black">
            <div className="bg-white border-b-[3px] border-black px-4 py-1.5 font-black text-xs uppercase tracking-wider flex justify-between items-center">
              <span className="whitespace-nowrap truncate">METRIC // {selectedTag ? `${selectedTag.toUpperCase()} AVG` : "CLASS AVG"}</span>
              <Award size={14} className="shrink-0" />
            </div>
            <div className="p-6">
              <div className="text-3xl font-black text-black">{classAvg} Points</div>
            </div>
          </div>

          <div className="bg-[#c084fc] border-[3px] border-black shadow-[8px_8px_0_0_#000000] text-black min-w-0">
            <div className="bg-white border-b-[3px] border-black px-4 py-1.5 font-black text-xs uppercase tracking-wider flex justify-between items-center">
              <span className="whitespace-nowrap truncate">METRIC // {selectedTag ? `${selectedTag.toUpperCase()} MVP` : "OVERALL TOP MVP"}</span>
              <Sparkles size={14} className="shrink-0" />
            </div>
            <div className="p-6">
              <div className="text-3xl font-black text-black truncate">
                {categoryMvp ? `${categoryMvp.name} (${categoryMvp.score} PTS)` : "N/A"}
              </div>
            </div>
          </div>
        </div>

        {/* Search & Subcategory Tag Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80 shrink-0">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black" />
            <input
              type="text"
              placeholder="Search by student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-[3px] border-black shadow-[4px_4px_0_0_#000000] pl-11 pr-4 py-2.5 text-sm text-black placeholder-black/60 font-bold outline-none"
            />
          </div>

          {/* Subcategory Filter Pills - Smooth Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 min-w-0 flex-1 justify-start sm:justify-end scrollbar-thin">
            <span className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1 mr-1 whitespace-nowrap flex-shrink-0">
              <Tag size={14} /> Subcategories:
            </span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3.5 py-1.5 text-xs font-black border-2 border-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap flex-shrink-0 ${
                !selectedTag ? "bg-[#ff66a3] text-black shadow-[2.5px_2.5px_0_0_#000]" : "bg-white text-black hover:bg-slate-100"
              }`}
            >
              All
              <span className="bg-black text-white px-1.5 py-0.2 rounded-full text-[10px] font-mono">
                {classStudents.length}
              </span>
            </button>
            {availableTags.map((tag) => {
              const count = classStudents.filter((s) => s.tags && s.tags.includes(tag)).length;
              const isSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(isSelected ? null : tag)}
                  className={`px-3.5 py-1.5 text-xs font-black border-2 border-black transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap flex-shrink-0 ${
                    isSelected ? "bg-[#ff66a3] text-black shadow-[2.5px_2.5px_0_0_#000]" : "bg-white text-black hover:bg-slate-100"
                  }`}
                >
                  {tag}
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isSelected ? "bg-black text-white" : "bg-slate-200 text-black font-bold"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Students Grid (Neobrutalist Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredStudents.map((student) => {
              const safeIndex = Math.abs(Number(student.id) || 0) % CARD_COLORS.length;
              const bgClass = CARD_COLORS[safeIndex] || CARD_COLORS[0];
              const isMvp = categoryMvp && student.id === categoryMvp.id;

              return (
                <motion.div
                  key={student.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  whileHover={{ y: -4, x: -4 }}
                  onClick={() => setSelectedStudent(student)}
                  className={`${bgClass} border-[3px] border-black shadow-[8px_8px_0_0_#000000] hover:shadow-[10px_10px_0_0_#000000] cursor-pointer group text-black overflow-hidden flex flex-col justify-between relative min-w-0`}
                >
                  {/* Window Head */}
                  <div className="bg-white border-b-[3px] border-black px-3 py-1 text-black font-black text-xs uppercase flex items-center justify-between">
                    <span>ID #{student.id}</span>
                    <span className="font-mono">{student.initials}</span>
                  </div>

                  {/* Window Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between min-w-0">
                    <div className="min-w-0">
                      {/* Category MVP Crown Badge */}
                      {isMvp && (
                        <div className="bg-[#facc15] text-black text-[10px] font-black px-2 py-0.5 border-2 border-black shadow-[2px_2px_0_0_#000] uppercase tracking-wider mb-2.5 inline-flex items-center gap-1.5 max-w-full truncate animate-bounce">
                          <Crown size={12} className="text-black fill-black shrink-0" />
                          <span className="truncate">{selectedTag ? `${selectedTag} MVP` : "Class MVP"}</span>
                        </div>
                      )}

                      <div className="text-4xl font-black text-black tracking-tighter mb-2">
                        {student.score} <span className="text-xs font-black">PTS</span>
                      </div>

                      <h3 className="text-xl font-black text-black tracking-tight mb-2 truncate" title={student.name}>
                        {student.name}
                      </h3>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {student.tags && student.tags.length > 0 ? (
                          student.tags.map((t) => (
                            <span key={t} className="text-[10px] font-black bg-white text-black px-2 py-0.5 border-2 border-black shadow-[1px_1px_0_0_#000] truncate max-w-full">
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] font-bold text-black/60 italic">No tags</span>
                        )}
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t-[3px] border-black">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStudentScore(student.id, 1);
                          }}
                          className="w-8 h-8 bg-[#4ade80] text-black border-2 border-black shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_#000] flex items-center justify-center font-black transition-all"
                          title="Add Point"
                        >
                          <Plus size={16} strokeWidth={3} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStudentScore(student.id, -1);
                          }}
                          className="w-8 h-8 bg-white text-black border-2 border-black shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_#000] flex items-center justify-center font-black transition-all"
                          title="Deduct Point"
                        >
                          -
                        </button>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteStudent(student.id);
                        }}
                        className="p-1.5 text-black hover:text-red-600 transition-colors"
                        title="Delete Student"
                      >
                        <Trash2 size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </main>

      {/* Add Student Modal (Neobrutalist Window) */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1ac2ff] border-[3px] border-black shadow-[12px_12px_0_0_#000000] max-w-md w-full text-black overflow-hidden relative"
            >
              <div className="bg-white border-b-[3px] border-black px-4 py-2 flex items-center justify-between font-black text-xs uppercase">
                <span>WINDOW // ADD NEW STUDENT</span>
                <button onClick={() => setIsAddModalOpen(false)} className="hover:text-red-500">
                  <X size={18} strokeWidth={3} />
                </button>
              </div>

              <form onSubmit={handleCreateStudent} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider mb-1">Student Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alexandros K."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-white border-[3px] border-black p-3 text-sm text-black font-bold outline-none shadow-[3px_3px_0_0_#000]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider mb-1">Greek Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Αλέξανδρος Κ."
                    value={newGreekName}
                    onChange={(e) => setNewGreekName(e.target.value)}
                    className="w-full bg-white border-[3px] border-black p-3 text-sm text-black font-bold outline-none shadow-[3px_3px_0_0_#000]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider mb-1">Initials (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. AK"
                    maxLength={3}
                    value={newInitials}
                    onChange={(e) => setNewInitials(e.target.value)}
                    className="w-full bg-white border-[3px] border-black p-3 text-sm text-black font-bold outline-none shadow-[3px_3px_0_0_#000]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider mb-1">Initial Subcategory Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Top Speaker"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="w-full bg-white border-[3px] border-black p-3 text-sm text-black font-bold outline-none shadow-[3px_3px_0_0_#000]"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t-[3px] border-black">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 text-sm font-black text-black hover:underline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#4ade80] text-black px-6 py-2.5 border-[3px] border-black shadow-[3px_3px_0_0_#000] font-black text-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-2"
                  >
                    <Check size={18} strokeWidth={3} /> Save Student
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Student Details & Subcategory Manager Modal (Neobrutalist Window) */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#ff66a3] border-[3px] border-black shadow-[12px_12px_0_0_#000000] max-w-lg w-full text-black overflow-hidden relative"
            >
              <div className="bg-white border-b-[3px] border-black px-4 py-2 flex items-center justify-between font-black text-xs uppercase">
                <span>WINDOW // STUDENT PROFILE & SUBCATEGORIES</span>
                <button onClick={() => setSelectedStudent(null)} className="hover:text-red-500">
                  <X size={18} strokeWidth={3} />
                </button>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-white border-[3px] border-black shadow-[3px_3px_0_0_#000] flex items-center justify-center font-black text-2xl">
                    {selectedStudent.initials}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tight text-black">{selectedStudent.name}</h2>
                    <p className="text-sm font-extrabold text-black">{selectedStudent.score} Total Classroom Points</p>
                  </div>
                </div>

                {/* Category Leadership Honors */}
                {(() => {
                  const honors: string[] = [];
                  availableTags.forEach((tag) => {
                    const taggedStudents = classStudents.filter((s) => s.tags?.includes(tag));
                    if (taggedStudents.length > 0) {
                      const topInTag = [...taggedStudents].sort((a, b) => b.score - a.score)[0];
                      if (topInTag.id === selectedStudent.id) {
                        honors.push(tag);
                      }
                    }
                  });
                  if (honors.length === 0) return null;
                  return (
                    <div className="bg-[#facc15] border-[3px] border-black p-4 shadow-[4px_4px_0_0_#000] mb-5">
                      <div className="text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5 text-black">
                        <Crown size={14} className="text-black fill-black" /> CATEGORY LEADERSHIP HONORS
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {honors.map((h) => (
                          <span key={h} className="bg-white border-2 border-black px-2.5 py-1 text-xs font-black shadow-[1.5px_1.5px_0_0_#000] text-black whitespace-nowrap flex items-center gap-1">
                            <Trophy size={13} className="text-black" /> #1 in {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Subcategory Tags Management Section */}
                <div className="bg-white p-5 border-[3px] border-black shadow-[4px_4px_0_0_#000] mb-5">
                  <div className="text-xs font-black uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>SUBCATEGORY TAGS</span>
                    <Tag size={14} />
                  </div>

                  {/* Active Tags Pills */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedStudent.tags && selectedStudent.tags.length > 0 ? (
                      selectedStudent.tags.map((t) => (
                        <span key={t} className="text-xs font-black bg-[#1ac2ff] text-black px-2.5 py-1 border-2 border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5 whitespace-nowrap">
                          {t}
                          <button
                            type="button"
                            onClick={() => {
                              const newTags = selectedStudent.tags?.filter((item) => item !== t) || [];
                              updateStudentTags(selectedStudent.id, newTags);
                              setSelectedStudent({ ...selectedStudent, tags: newTags });
                            }}
                            className="hover:text-red-600 transition-colors cursor-pointer"
                            title={`Remove tag ${t}`}
                          >
                            <X size={13} strokeWidth={3} />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-bold text-black/60 italic">No subcategory tags assigned yet.</span>
                    )}
                  </div>

                  {/* Add Tag Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!customTag.trim() || !selectedStudent) return;
                      const current = selectedStudent.tags || [];
                      if (!current.includes(customTag.trim())) {
                        const updated = [...current, customTag.trim()];
                        updateStudentTags(selectedStudent.id, updated);
                        setSelectedStudent({ ...selectedStudent, tags: updated });
                      }
                      setCustomTag("");
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Add subcategory tag (e.g. Top Speaker)..."
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      className="flex-1 bg-slate-50 border-2 border-black px-3 py-1.5 text-xs text-black font-bold outline-none shadow-[2px_2px_0_0_#000]"
                    />
                    <button
                      type="submit"
                      className="bg-[#4ade80] text-black px-3 py-1.5 border-2 border-black shadow-[2px_2px_0_0_#000] font-black text-xs hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <Plus size={14} strokeWidth={3} /> Add
                    </button>
                  </form>
                </div>

                <div className="bg-white p-5 border-[3px] border-black shadow-[4px_4px_0_0_#000] mb-6">
                  <div className="text-xs font-black uppercase tracking-wider mb-1">Recent Activity Log</div>
                  <div className="text-sm font-bold text-black italic">
                    &quot;Great explanation on question 3, Eleni!&quot; — +1 Point (Yesterday 10:14 AM)
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="bg-[#4ade80] text-black px-6 py-2 border-[3px] border-black shadow-[3px_3px_0_0_#000] font-black text-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer whitespace-nowrap"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
