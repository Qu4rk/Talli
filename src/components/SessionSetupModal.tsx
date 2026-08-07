"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Play, BookOpen, Calculator, FlaskConical, Landmark, Globe, Languages, Church, HeartPulse, Wrench, Music, Palette, Activity, Check, Zap, Sparkles, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp, CYPRUS_GRADES, CYPRUS_SECTIONS, CYPRUS_SUBJECTS, getCyprusClassLabel } from "@/context/AppContext";

interface SessionSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUBJECT_ICONS: Record<string, React.ReactNode> = {
  greek: <BookOpen size={18} />,
  math: <Calculator size={18} />,
  science: <FlaskConical size={18} />,
  history: <Landmark size={18} />,
  geography: <Globe size={18} />,
  english: <Languages size={18} />,
  religious: <Church size={18} />,
  health: <HeartPulse size={18} />,
  design_tech: <Wrench size={18} />,
  music: <Music size={18} />,
  art: <Palette size={18} />,
  pe: <Activity size={18} />,
};

const PRESET_QUICK_SESSIONS = [
  { id: "d1", gradeCode: "d", secNum: "1", subject: "Μαθηματικά", topic: "Κεφάλαιο 4: Κλάσματα", color: "bg-[#facc15]" },
  { id: "b3", gradeCode: "b", secNum: "3", subject: "Φυσικές Επιστήμες", topic: "Οικοσυστήματα & Ζώα", color: "bg-[#4ade80]" },
  { id: "a2", gradeCode: "a", secNum: "2", subject: "Ελληνικά (Γλώσσα & Λογοτεχνία)", topic: "Αλφάβητο & Αναγνωστικό", color: "bg-[#1ac2ff]" },
  { id: "e1", gradeCode: "e", secNum: "1", subject: "Ιστορία", topic: "Αρχαία Ελλάδα", color: "bg-[#c084fc]" },
];

export default function SessionSetupModal({ isOpen, onClose }: SessionSetupModalProps) {
  const router = useRouter();
  const { activeClass, setActiveClass, activeSubject, setActiveSubject, lessonTopic, setLessonTopic, requestMicPermission, micPermission } = useApp();

  const parseGradeCode = (classId: string) => {
    const match = classId.match(/([a-z]+)/i);
    return match ? match[1] : "d";
  };
  const parseSectionNum = (classId: string) => {
    const match = classId.match(/(\d+)/);
    return match ? match[1] : "1";
  };

  const [selectedGradeCode, setSelectedGradeCode] = useState(parseGradeCode(activeClass));
  const [selectedSectionNum, setSelectedSectionNum] = useState(parseSectionNum(activeClass));
  const [selectedSubjectName, setSelectedSubjectName] = useState(activeSubject);
  const [topicInput, setTopicInput] = useState(lessonTopic);

  const [subjectCategoryFilter, setSubjectCategoryFilter] = useState<string>("All");

  if (!isOpen) return null;

  const currentClassId = `${selectedGradeCode}${selectedSectionNum}`;
  const currentClassLabel = getCyprusClassLabel(currentClassId);

  const applyPreset = (preset: typeof PRESET_QUICK_SESSIONS[0]) => {
    setSelectedGradeCode(preset.gradeCode);
    setSelectedSectionNum(preset.secNum);
    setSelectedSubjectName(preset.subject);
    setTopicInput(preset.topic);
  };

  const handleLaunch = async () => {
    setActiveClass(currentClassId);
    setActiveSubject(selectedSubjectName);
    setLessonTopic(topicInput);

    if (micPermission !== "granted") {
      await requestMicPermission();
    }

    onClose();
    router.push("/classroom");
  };

  const filteredSubjects = CYPRUS_SUBJECTS.filter((sub) => {
    if (subjectCategoryFilter === "All") return true;
    return sub.category === subjectCategoryFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="bg-[#1ac2ff] border-[3.5px] border-black shadow-[16px_16px_0_0_#000000] max-w-3xl w-full text-black overflow-hidden relative my-6"
      >
        {/* Window Bar */}
        <div className="bg-white border-b-[3.5px] border-black px-4 py-2.5 flex items-center justify-between font-black text-xs uppercase tracking-wider">
          <span className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-black"></span>
            <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 border-2 border-black"></span>
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-black"></span>
            CYPRUS PRIMARY SCHOOL // SESSION SETUP LAUNCHPAD
          </span>
          <button onClick={onClose} className="p-1 hover:bg-rose-100 hover:text-red-600 border-2 border-black transition-colors bg-white">
            <X size={16} strokeWidth={3} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
          
          {/* Header Title */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 border-[3px] border-black shadow-[4px_4px_0_0_#000]">
            <div>
              <h2 className="text-2xl font-black text-black tracking-tight flex items-center gap-2">
                <Sparkles className="text-amber-500 fill-amber-400" size={24} /> Configure Lesson Session
              </h2>
              <p className="text-xs text-black/80 font-bold mt-0.5">Select Cyprus Primary School class grade, section number, and curriculum subject.</p>
            </div>
            <div className="bg-[#facc15] text-black font-black text-sm px-4 py-2 border-2 border-black shadow-[3px_3px_0_0_#000] flex items-center gap-2">
              <Zap size={16} fill="#000" /> {currentClassLabel} • {selectedSubjectName.split(" ")[0]}
            </div>
          </div>

          {/* QUICK PRESETS ROW */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider block mb-2 text-black flex items-center gap-1.5">
              <Zap size={14} fill="#000" /> 1-Click Quick Preset Sessions:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PRESET_QUICK_SESSIONS.map((preset) => {
                const isActive = currentClassId === preset.id && selectedSubjectName === preset.subject;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={`p-3 border-2 border-black text-left font-black text-xs transition-all cursor-pointer relative ${
                      preset.color
                    } ${
                      isActive
                        ? "shadow-[4px_4px_0_0_#000] translate-x-[-1px] translate-y-[-1px] ring-2 ring-black"
                        : "opacity-90 hover:opacity-100 hover:shadow-[3px_3px_0_0_#000]"
                    }`}
                  >
                    <div className="font-black text-sm">{getCyprusClassLabel(preset.id)}</div>
                    <div className="text-[11px] font-extrabold truncate text-black/90">{preset.subject.split(" ")[0]}</div>
                    <div className="text-[9px] font-bold text-black/70 truncate mt-1">📖 {preset.topic}</div>
                    {isActive && <Check size={16} strokeWidth={3} className="absolute top-2 right-2 text-black bg-white rounded-full p-0.5 border border-black" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* COMBINED CLASS & SECTION SELECTOR MATRIX */}
          <div className="bg-white p-5 border-[3px] border-black shadow-[4px_4px_0_0_#000] space-y-3">
            <label className="text-xs font-black uppercase tracking-wider block text-black flex items-center gap-1.5">
              <Layers size={16} /> Choose Grade (Τάξη) & Section Number (Τμήμα 1–6):
            </label>

            {/* Grade Tabs Row */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {CYPRUS_GRADES.map((g) => {
                const isSelectedGrade = selectedGradeCode === g.code;
                return (
                  <button
                    key={g.code}
                    type="button"
                    onClick={() => setSelectedGradeCode(g.code)}
                    className={`px-4 py-2 border-2 border-black font-black text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      isSelectedGrade
                        ? "bg-[#ff66a3] text-black shadow-[3px_3px_0_0_#000] translate-x-[-1px] translate-y-[-1px]"
                        : "bg-slate-100 text-black hover:bg-slate-200"
                    }`}
                  >
                    <span>{g.label}</span>
                    <span className="text-[10px] opacity-75">({g.fullName.split(" ")[1] || g.code})</span>
                  </button>
                );
              })}
            </div>

            {/* Direct Section Buttons for the Active Grade */}
            <div className="bg-slate-50 p-3 border-2 border-black flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-black text-black/70 uppercase">
                Section for {CYPRUS_GRADES.find((g) => g.code === selectedGradeCode)?.label}:
              </span>
              <div className="flex items-center gap-2 flex-wrap flex-1">
                {CYPRUS_SECTIONS.map((secNum) => {
                  const classIdCandidate = `${selectedGradeCode}${secNum}`;
                  const isSelected = selectedSectionNum === secNum;
                  return (
                    <button
                      key={secNum}
                      type="button"
                      onClick={() => setSelectedSectionNum(secNum)}
                      className={`px-4 py-2 border-2 border-black font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-[#1ac2ff] text-black shadow-[3px_3px_0_0_#000] translate-x-[-1px] translate-y-[-1px]"
                          : "bg-white text-black hover:bg-slate-100"
                      }`}
                    >
                      <span>{getCyprusClassLabel(classIdCandidate)}</span>
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SUBJECT SELECTOR WITH CATEGORY TABS */}
          <div className="bg-white p-5 border-[3px] border-black shadow-[4px_4px_0_0_#000] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black/10 pb-2">
              <label className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                <BookOpen size={16} /> Choose Cyprus Subject (Μάθημα ΥΠΑΝ):
              </label>

              {/* Subject Category Filter Tabs */}
              <div className="flex items-center gap-1">
                {["All", "Κορμός", "Επιστήμες", "Ανθρωπιστικά", "Τέχνες & Τεχνολογία"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSubjectCategoryFilter(cat)}
                    className={`px-2.5 py-1 text-[10px] font-black border border-black transition-all cursor-pointer ${
                      subjectCategoryFilter === cat
                        ? "bg-[#facc15] text-black shadow-[1.5px_1.5px_0_0_#000]"
                        : "bg-slate-100 text-black hover:bg-slate-200"
                    }`}
                  >
                    {cat === "All" ? "Όλα" : cat.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {filteredSubjects.map((sub) => {
                const isSelected = selectedSubjectName === sub.name;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSubjectName(sub.name)}
                    className={`p-2.5 border-2 border-black text-left font-black text-xs flex items-center gap-2.5 transition-all cursor-pointer relative ${
                      isSelected
                        ? "bg-[#4ade80] text-black shadow-[3px_3px_0_0_#000] translate-x-[-1px] translate-y-[-1px]"
                        : "bg-slate-50 text-black hover:bg-slate-100"
                    }`}
                  >
                    <div className="p-1.5 bg-white border border-black text-black shrink-0">
                      {SUBJECT_ICONS[sub.id] || <BookOpen size={16} />}
                    </div>
                    <div className="flex-1 truncate">
                      <div className="truncate font-black text-[11px]">{sub.name}</div>
                      <div className="text-[9px] font-bold text-black/60">{sub.category}</div>
                    </div>
                    {isSelected && <Check size={16} strokeWidth={3} className="shrink-0 text-black" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* LESSON TOPIC INPUT */}
          <div className="bg-white p-4 border-[3px] border-black shadow-[4px_4px_0_0_#000]">
            <label className="text-xs font-black uppercase tracking-wider block mb-1.5 text-black">
              Lesson Unit / Topic (Optional):
            </label>
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="e.g. Κεφάλαιο 4: Κλάσματα & Δεκαδικοί, Οδυσσέας στην Ιθάκη"
              className="w-full bg-slate-50 border-2 border-black p-2.5 text-xs text-black font-bold outline-none focus:bg-white shadow-[2px_2px_0_0_#000]"
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t-2 border-black/10">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white text-black font-black text-xs border-2 border-black shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer uppercase"
            >
              Cancel
            </button>
            <button
              onClick={handleLaunch}
              className="flex items-center gap-2.5 bg-[#4ade80] text-black px-7 py-3 border-[3.5px] border-black shadow-[5px_5px_0_0_#000000] hover:translate-x-[1.5px] hover:translate-y-[1.5px] font-black text-sm uppercase transition-all cursor-pointer"
            >
              <Play size={18} fill="#000" />
              Launch Classroom Session ({currentClassLabel})
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
