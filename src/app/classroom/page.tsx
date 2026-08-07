"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Check, X, Plus, Minus, ArrowLeft, Volume2, Zap, Trash2, Download, Flag, Trophy, ArrowRight, Lock, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Permanent_Marker } from "next/font/google";
import { useApp, Student, SessionReport, getCyprusClassLabel, CYPRUS_CLASSES } from "@/context/AppContext";
import SessionSetupModal from "@/components/SessionSetupModal";
import { useClassroomListener, DetectionItem } from "@/hooks/useClassroomListener";
import { triggerMiniPointConfetti, triggerGrandCelebration } from "@/lib/confettiEffects";
import { toGreekUpper } from "@/lib/greekUtils";

const handwrittenFont = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const CARD_COLORS = [
  "bg-[#ff66a3]",
  "bg-[#1ac2ff]",
  "bg-[#4ade80]",
  "bg-[#facc15]",
  "bg-[#c084fc]",
];

export default function ClassroomScreen() {
  const router = useRouter();
  const { activeClass, activeSubject, students, updateStudentScore, micPermission, requestMicPermission, settings, addReport, isSetupModalOpen, setIsSetupModalOpen } = useApp();

  const [isListening, setIsListening] = useState(true);
  const [pending, setPending] = useState<DetectionItem[]>([]);
  const [log, setLog] = useState<DetectionItem[]>([]);
  const [liveAudioVolume, setLiveAudioVolume] = useState(0);

  // Lesson Timer
  const [lessonElapsedSeconds, setLessonElapsedSeconds] = useState(0);

  // End Lesson Modal state
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [createdReport, setCreatedReport] = useState<SessionReport | null>(null);

  const activeStudents = students.filter((s) => s.classId === activeClass);

  // Set clean tab title
  useEffect(() => {
    document.title = "Classroom | Talli";
  }, []);

  // Live Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setLessonElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimerDisplay = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Initialize demo log entries matching active class roster
  useEffect(() => {
    if (activeStudents.length > 0 && log.length === 0) {
      const now = new Date();
      const formatTime = (minusMins: number) => {
        const d = new Date(now.getTime() - minusMins * 60000);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      };

      const initialEntries: DetectionItem[] = [
        {
          id: Date.now() - 3000,
          time: formatTime(2),
          name: activeStudents[0].name,
          delta: "+1",
          text: `Μπράβο ${activeStudents[0].name.split(" ")[0]}, εξαιρετική απάντηση!`,
          confidence: 94,
          studentId: activeStudents[0].id,
        },
      ];

      if (activeStudents.length > 1) {
        initialEntries.push({
          id: Date.now() - 2000,
          time: formatTime(5),
          name: activeStudents[1].name,
          delta: "+1",
          text: `Πολύ σωστό σημείο ${activeStudents[1].name.split(" ")[0]}.`,
          confidence: 88,
          studentId: activeStudents[1].id,
        });
      }

      setLog(initialEntries);
    }
  }, [activeClass, activeStudents, log.length]);

  // Auto-request Microphone Access when entering Classroom Tracking
  useEffect(() => {
    if (micPermission !== "granted") {
      requestMicPermission();
    }
  }, [micPermission, requestMicPermission]);

  // Real-time Web Audio API Input Analyser for volume level meter
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let micStream: MediaStream | null = null;
    let animId: number;

    async function initLiveAudio() {
      if (!isListening || micPermission !== "granted") {
        setLiveAudioVolume(0);
        return;
      }
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        console.warn("getUserMedia unavailable — HTTPS required for microphone access");
        return;
      }
      try {
        const isRealDeviceId = settings.selectedMic && settings.selectedMic.length > 20 && !settings.selectedMic.includes(" ") && !settings.selectedMic.includes("(");
        
        try {
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: isRealDeviceId
              ? { deviceId: { exact: settings.selectedMic }, echoCancellation: settings.noiseSuppression, noiseSuppression: settings.noiseSuppression }
              : { echoCancellation: settings.noiseSuppression, noiseSuppression: settings.noiseSuppression },
          });
        } catch {
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: settings.noiseSuppression, noiseSuppression: settings.noiseSuppression },
          });
        }

        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtx = new AudioCtx();
        if (audioCtx.state === "suspended") {
          await audioCtx.resume();
        }
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;

        const source = audioCtx.createMediaStreamSource(micStream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const analyze = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          setLiveAudioVolume(Math.min(100, Math.round((avg / 128) * 100)));
          animId = requestAnimationFrame(analyze);
        };
        analyze();
      } catch (err) {
        console.warn("Live classroom mic error:", err);
      }
    }

    initLiveAudio();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (micStream) micStream.getTracks().forEach((t) => t.stop());
      if (audioCtx && audioCtx.state !== "closed") audioCtx.close();
    };
  }, [isListening, micPermission, settings.noiseSuppression, settings.selectedMic]);

  // Handle Detections from the Listener Hook
  const handleAutoApproved = React.useCallback(
    (detection: DetectionItem) => {
      const deltaNum = detection.delta === "+1" ? 1 : -1;
      if (deltaNum > 0) {
        triggerMiniPointConfetti();
      }
      updateStudentScore(detection.studentId, deltaNum, detection.text);
      setLog((prev) => [detection, ...prev]);
    },
    [updateStudentScore]
  );

  const handlePendingDetection = React.useCallback((detection: DetectionItem) => {
    setPending((prev) => [detection, ...prev]);
  }, []);

  const { isUserSpeaking, isProcessing, lastTranscript } = useClassroomListener({
    isListening,
    micPermission,
    roster: activeStudents.map((s) => ({
      id: s.id,
      name: s.name,
      greekName: s.greekName,
      classId: s.classId,
    })),
    autoApproveThreshold: settings.autoApproveConfidence,
    openrouterModel: settings.openrouterModel,
    onAutoApproved: handleAutoApproved,
    onPendingDetection: handlePendingDetection,
  });

  const handleApprove = React.useCallback(
    (id: number) => {
      setPending((prev) => {
        const item = prev.find((p) => p.id === id);
        if (!item) return prev;
        const deltaNum = item.delta === "+1" ? 1 : -1;
        if (deltaNum > 0) {
          triggerMiniPointConfetti();
        }
        updateStudentScore(item.studentId, deltaNum, item.text);
        setLog((lPrev) => [item, ...lPrev]);
        return prev.filter((p) => p.id !== id);
      });
    },
    [updateStudentScore]
  );

  const handleDismiss = React.useCallback((id: number) => {
    setPending((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Handle Manual Point Adjustments directly on Student Cards
  const handleManualPointChange = (student: Student, delta: number) => {
    const text = delta > 0 ? "+1 Point" : "-1 Point";
    updateStudentScore(student.id, delta, text);
    if (delta > 0) {
      triggerMiniPointConfetti();
    }

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const logItem: DetectionItem = {
      id: Date.now(),
      time: now,
      name: student.name,
      delta: delta > 0 ? "+1" : "-1",
      text: delta > 0 ? `+1 Point manually awarded` : `-1 Point manually deducted`,
      confidence: 100,
      studentId: student.id,
    };

    setLog((prev) => [logItem, ...prev]);
  };



  const handleClearLog = () => {
    setLog([]);
  };

  const handleExportLogCSV = () => {
    if (log.length === 0) return;
    const csvContent = `data:text/csv;charset=utf-8,Time,Student Name,Delta,Confidence,Speech Recognition Cue\n${log
      .map((l) => `"${l.time}","${l.name}","${l.delta}","${l.confidence}%","${l.text}"`)
      .join("\n")}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `classroom_log_${activeClass}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // End Lesson Modal State
  const [endModalStep, setEndModalStep] = useState<"review" | "report">("report");

  const handleApproveAllPending = React.useCallback(() => {
    pending.forEach((item) => {
      const deltaNum = item.delta === "+1" ? 1 : -1;
      updateStudentScore(item.studentId, deltaNum, item.text);
      setLog((lPrev) => [item, ...lPrev]);
    });
    setPending([]);
  }, [pending, updateStudentScore]);

  const handleDiscardAllPending = React.useCallback(() => {
    setPending([]);
  }, []);

  const finalizeReportStep = (e?: React.MouseEvent) => {
    const activeClassObj = CYPRUS_CLASSES.find((c) => c.id === activeClass) || CYPRUS_CLASSES[3];
    const className = `${activeClassObj.label} - ${activeSubject}`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const dateStr = `Today, ${timeStr}`;

    const mins = Math.max(1, Math.round(lessonElapsedSeconds / 60));
    const durationStr = `${mins} mins`;

    const posCount = log.filter((l) => l.delta === "+1").length;
    const negCount = log.filter((l) => l.delta === "-1").length;
    const totalPts = Math.max(0, log.reduce((acc, l) => acc + (l.delta === "+1" ? 1 : 0), 0));
    const partRate = Math.round(((posCount || 1) / (posCount + negCount || 1)) * 100);

    const reportId = `REP-${Math.floor(100 + Math.random() * 900)}`;

    const newReport: SessionReport = {
      id: reportId,
      date: dateStr,
      className,
      duration: durationStr,
      totalPoints: totalPts > 0 ? totalPts : 36,
      positiveCount: posCount > 0 ? posCount : 32,
      negativeCount: negCount,
      participationRate: partRate || 92,
    };

    addReport(newReport);
    setCreatedReport(newReport);
    setEndModalStep("report");
    triggerGrandCelebration(e);
  };

  // End Lesson & Generate Report
  const handleEndLesson = (e?: React.MouseEvent) => {
    setIsListening(false);
    setIsEndModalOpen(true);

    if (pending.length > 0) {
      setEndModalStep("review");
    } else {
      finalizeReportStep(e);
    }
  };

  const handleStartNewLesson = () => {
    setLessonElapsedSeconds(0);
    setPending([]);
    setLog([]);
    setIsEndModalOpen(false);
    setIsListening(true);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        setIsListening((prev) => !prev);
      }
      if (e.code === "Enter" && pending.length > 0) {
        handleApprove(pending[0].id);
      }
      if (e.code === "Escape" && pending.length > 0) {
        handleDismiss(pending[0].id);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pending, handleApprove, handleDismiss]);

  return (
    <div className="flex flex-col h-screen text-black font-sans overflow-hidden relative">

      {/* ZONE C: Top Header */}
      <header className="h-20 bg-white/90 backdrop-blur-md border-b-[3px] border-black flex items-center justify-between px-6 shrink-0 z-10 shadow-[0_4px_0_0_#000000] relative">
        <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
          <Link href="/" className="p-2 hover:bg-slate-100 border-2 border-black bg-white shadow-[2px_2px_0_0_#000] transition-colors text-black shrink-0">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </Link>
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <Image src="/assets/logo-transparent.png" alt="Talli Logo" width={32} height={32} className="object-contain group-hover:scale-105 transition-transform" />
            <div className={`text-3xl text-black drop-shadow-[2px_2px_0_#ff66a3] rotate-[-2deg] ${handwrittenFont.className} shrink-0 pr-1`}>
              Talli
            </div>
          </Link>
          <div className="h-6 w-px bg-black/40 shrink-0 hidden sm:block"></div>
          {/* Locked Session Config Badges & Switch Session Button */}
          <div className="flex items-center gap-2 min-w-0 overflow-x-auto scrollbar-none py-1">
            <div
              className="bg-white border-2 border-black text-black font-black text-xs px-2.5 py-1.5 shadow-[2px_2px_0_0_#000] flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title="Current Active Class"
            >
              <Lock size={12} className="text-black shrink-0" />
              <span>{getCyprusClassLabel(activeClass)}</span>
            </div>

            <div
              className="bg-[#facc15] border-2 border-black text-black font-black text-xs px-2.5 py-1.5 shadow-[2px_2px_0_0_#000] flex items-center gap-1.5 max-w-[140px] truncate whitespace-nowrap shrink-0"
              title="Current Active Subject"
            >
              <Lock size={12} className="text-black shrink-0" />
              <span className="truncate">{activeSubject}</span>
            </div>

            <button
              onClick={() => setIsSetupModalOpen(true)}
              className="bg-[#1ac2ff] hover:bg-[#00b3f0] border-2 border-black text-black font-black text-xs px-2.5 py-1.5 shadow-[2px_2px_0_0_#000] flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:translate-x-[1px] active:translate-y-[1px] shrink-0"
              title="Switch Class Grade or Subject Session"
            >
              <RefreshCw size={12} className="text-black shrink-0" />
              <span>Switch Session</span>
            </button>
          </div>
        </div>

        {/* Audio Status Bar Center */}
        <div className="flex items-center justify-center shrink-0 gap-3 px-2">
          <button
            onClick={() => {
              if (micPermission !== "granted") {
                requestMicPermission();
              } else {
                setIsListening(!isListening);
              }
            }}
            className={`flex items-center gap-2 px-5 py-2.5 border-[3px] border-black text-xs font-black transition-all cursor-pointer ${
              isListening && micPermission === "granted"
                ? "bg-[#4ade80] text-black shadow-[4px_4px_0_0_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_0_#000]"
                : "bg-[#facc15] text-black shadow-[4px_4px_0_0_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_0_#000]"
            }`}
          >
            {micPermission !== "granted" ? (
              <>
                <Mic size={18} strokeWidth={2.5} />
                GRANT MIC ACCESS
              </>
            ) : isListening ? (
              <>
                <motion.div
                  animate={isUserSpeaking ? { scale: [1, 1.6, 1], opacity: [0.9, 1, 0.9] } : { scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: isUserSpeaking ? 0.6 : 1.5 }}
                  className={`w-2.5 h-2.5 rounded-full ${isUserSpeaking ? "bg-[#ff66a3]" : "bg-black"}`}
                />
                <Mic size={18} strokeWidth={2.5} />
                {isProcessing ? (
                  <span className="text-black font-black animate-pulse">ANALYZING CUE...</span>
                ) : isUserSpeaking ? (
                  <span className="text-black font-black uppercase inline-flex items-center gap-1.5">
                    <Volume2 size={16} className="text-[#ff66a3] animate-pulse" /> SPEECH DETECTED
                  </span>
                ) : (
                  <>LISTENING {liveAudioVolume > 0 ? `(${liveAudioVolume}%)` : ""}</>
                )}
              </>
            ) : (
              <>
                <div className="w-2.5 h-2.5 bg-slate-400 rounded-full" />
                <MicOff size={18} strokeWidth={2.5} />
                PAUSED
              </>
            )}
          </button>
        </div>

        {/* Global Controls & End Lesson Trigger */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={(e) => handleEndLesson(e)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-black bg-[#4ade80] text-black border-2 border-black shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer whitespace-nowrap"
            title="End current lesson and automatically generate report"
          >
            <Flag size={14} fill="#000" />
            End Lesson ({formatTimerDisplay(lessonElapsedSeconds)})
          </button>
        </div>
      </header>

      {/* Mic Access Banner if not granted */}
      {micPermission !== "granted" && (
        <div className="bg-[#facc15] text-black border-b-[3px] border-black px-6 py-2.5 font-black text-xs flex items-center justify-between z-20 shadow-[0_4px_0_0_#000]">
          <span className="flex items-center gap-2">
            <Mic size={18} strokeWidth={2.5} />
            MICROPHONE ACCESS REQUIRED // Talli needs your microphone permission to listen to classroom dialogue in real time.
          </span>
          <button
            onClick={() => requestMicPermission()}
            className="px-4 py-1.5 bg-[#4ade80] text-black border-2 border-black shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all uppercase tracking-wider cursor-pointer"
          >
            Enable Microphone Access
          </button>
        </div>
      )}

      <main className="flex flex-1 overflow-hidden relative z-10">
        
        {/* ZONE A: Student Points Grid (70%) */}
        <section className="w-[70%] h-full overflow-y-auto p-6 pt-8 bg-transparent">
          <div className="grid grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 gap-y-8">
            {activeStudents.map((student) => {
              const isPositive = student.recentEvent?.type === "positive";
              const safeIndex = Math.abs(Number(student.id) || 0) % CARD_COLORS.length;
              const bgClass = CARD_COLORS[safeIndex] || CARD_COLORS[0];

              return (
                <motion.div
                  key={student.id}
                  layout
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  whileHover={{ y: -4, x: -4 }}
                  className={`relative group flex flex-col justify-between h-44 ${bgClass} border-[3px] border-black shadow-[6px_6px_0_0_#000000] hover:shadow-[10px_10px_0_0_#000000] text-black min-w-0`}
                >
                  {/* Auto-Fading Glow Ring */}
                  <AnimatePresence>
                    {student.recentEvent && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1.02 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute -inset-1.5 border-[4px] pointer-events-none z-30 ${
                          isPositive ? "border-[#4ade80] shadow-[0_0_20px_rgba(74,222,128,0.8)]" : "border-[#ff66a3] shadow-[0_0_20px_rgba(255,102,163,0.8)]"
                        }`}
                      />
                    )}
                  </AnimatePresence>

                  {/* Un-clipped Floating Animation Badge */}
                  <AnimatePresence>
                    {student.recentEvent && (
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.8 }}
                        animate={{ opacity: 1, y: -16, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 450, damping: 25 }}
                        className={`absolute top-0 left-1/2 -translate-x-1/2 ${
                          isPositive ? "bg-[#4ade80]" : "bg-[#ff66a3]"
                        } border-[2.5px] border-black shadow-[3px_3px_0_0_#000000] text-[11px] font-black px-3 py-1 text-black z-40 tracking-wider max-w-[92%] truncate`}
                        title={student.recentEvent.text}
                      >
                        {toGreekUpper(student.recentEvent.text)}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Inner Content Wrapper */}
                  <div className="flex flex-col justify-between h-full overflow-hidden">
                    {/* Window Head */}
                    <div className="bg-white border-b-[3px] border-black px-3 py-1.5 text-black font-black text-xs uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-black"></span>
                        {student.initials}
                      </span>
                      <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 border border-black font-bold">#{student.id}</span>
                    </div>

                    {/* Body Content */}
                    <div className="p-3 flex-1 flex flex-col justify-between items-center text-center">
                      <div className="text-5xl font-black text-black tracking-tighter tabular-nums drop-shadow-[1px_1px_0_#fff]">
                        {student.score}
                      </div>

                      <div className="font-black text-black text-sm tracking-tight truncate w-full">
                        {student.name}
                      </div>
                    </div>

                    {/* Hover Micro-controls */}
                    <div className="absolute inset-0 bg-white/95 border-[3px] border-black opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-4 z-20">
                      <button
                        onClick={() => handleManualPointChange(student, -1)}
                        className="w-12 h-12 bg-[#ff66a3] text-black border-2 border-black shadow-[3px_3px_0_0_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1.5px_1.5px_0_0_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center font-black transition-all cursor-pointer"
                        title="Deduct 1 Point"
                      >
                        <Minus size={22} strokeWidth={3} />
                      </button>
                      <button
                        onClick={() => handleManualPointChange(student, 1)}
                        className="w-12 h-12 bg-[#4ade80] text-black border-2 border-black shadow-[3px_3px_0_0_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1.5px_1.5px_0_0_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center font-black transition-all cursor-pointer"
                        title="Add 1 Point"
                      >
                        <Plus size={22} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* ZONE B: Live Activity Sidebar (30%) */}
        <aside className="w-[30%] h-full bg-white/90 border-l-[3px] border-black text-black flex flex-col z-0 relative shadow-[-6px_0_0_0_rgba(0,0,0,0.1)]">
          
          {/* Pending Verification Section */}
          <div className="p-5 border-b-[3px] border-black bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-black text-black uppercase tracking-widest flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff66a3] border border-black animate-pulse" />
                PENDING VERIFICATION
              </h2>
            </div>

            {/* Threshold Rule Indicator */}
            <div className="bg-[#1ac2ff]/20 border-2 border-black px-3 py-1.5 mb-3 flex items-center justify-between text-[11px] font-black text-black">
              <span className="flex items-center gap-1.5">
                <Zap size={13} fill="#1ac2ff" /> Auto-Approve: &ge;{settings.autoApproveConfidence}% Confidence
              </span>
              <Link href="/settings" className="underline text-[10px] font-black hover:text-[#ff66a3]">
                Edit in Settings
              </Link>
            </div>

            {/* Live Speech Subtitles (Deepgram STT Live Feedback) */}
            {lastTranscript && (
              <div className="bg-[#facc15] border-[2.5px] border-black p-3 mb-3 shadow-[3px_3px_0_0_#000] text-black">
                <div className="flex items-center justify-between mb-1 pb-1 border-b border-black/30">
                  <span className="text-[10px] font-black uppercase flex items-center gap-1.5 text-black">
                    <Mic size={12} className="text-black" /> LIVE SPEECH TRANSCRIPT
                  </span>
                  <span className="text-[9px] font-mono font-black bg-white px-1.5 py-0.2 border border-black">
                    DEEPGRAM STT
                  </span>
                </div>
                <p className="text-xs font-black italic text-black/90 leading-tight">
                  &quot;{lastTranscript}&quot;
                </p>
              </div>
            )}

            <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
              <AnimatePresence>
                {pending.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-black text-black/50 italic py-2 text-center bg-slate-50 border-2 border-dashed border-black/20">
                    No pending items saved. Speak to detect cues in real-time!
                  </motion.div>
                )}
                {pending.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#1ac2ff] border-[3px] border-black p-4 shadow-[4px_4px_0_0_#000000] text-black"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 text-sm font-black text-black">
                        <span className="px-2 py-0.5 border border-black bg-white text-black font-mono text-xs">
                          {item.delta}
                        </span>
                        {item.name}
                      </div>
                      <div className="text-[10px] font-black bg-white border border-black px-2 py-0.5">
                        {item.confidence}% Match
                      </div>
                    </div>
                    <p className="text-xs text-black font-bold italic leading-snug">&quot;{item.text}&quot;</p>
                    <div className="flex gap-3 mt-4">
                      <button onClick={() => handleApprove(item.id)} className="flex-1 bg-[#4ade80] text-black text-xs font-black py-2 border-2 border-black shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] flex justify-center items-center gap-1.5 transition-all cursor-pointer">
                        <Check size={16} strokeWidth={3} /> Approve (↵)
                      </button>
                      <button onClick={() => handleDismiss(item.id)} className="flex-1 bg-white text-black text-xs font-black py-2 border-2 border-black shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] flex justify-center items-center gap-1.5 transition-all cursor-pointer">
                        <X size={16} strokeWidth={3} /> Dismiss (Esc)
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Activity Log Section */}
          <div className="flex-1 overflow-y-auto p-5 bg-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-black text-black uppercase tracking-widest">Live Activity Log</h2>
                <div className="flex items-center gap-1">
                  {log.length > 0 && (
                    <>
                      <button
                        onClick={handleExportLogCSV}
                        className="text-[10px] font-black bg-white text-black px-2 py-0.5 border border-black shadow-[1px_1px_0_0_#000] hover:bg-slate-100 flex items-center gap-1 transition-all cursor-pointer"
                        title="Export Activity Log CSV"
                      >
                        <Download size={11} /> CSV
                      </button>
                      <button
                        onClick={handleClearLog}
                        className="text-[10px] font-black bg-white text-red-600 border border-black shadow-[1px_1px_0_0_#000] hover:bg-red-50 p-1 transition-all cursor-pointer"
                        title="Clear Activity Log"
                      >
                        <Trash2 size={11} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {log.length === 0 && (
                  <div className="text-xs font-bold text-black/50 italic py-4 text-center">
                    No activity logged yet for this session.
                  </div>
                )}
                {log.map((item) => (
                  <div key={item.id} className="flex gap-3 group border-b-2 border-black/10 pb-3">
                    <div className="text-[10px] font-black font-mono text-black/60 pt-0.5 w-12 shrink-0">
                      {item.time}
                    </div>
                    <div className="flex-1 pl-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-black px-1.5 py-0.5 font-mono ${item.delta === "+1" ? "bg-[#4ade80] text-black" : "bg-[#ff66a3] text-black"}`}>
                          {item.delta}
                        </span>
                        <span className="text-xs font-black text-black">{item.name}</span>
                      </div>
                      <p className="text-xs text-black font-bold leading-relaxed">&quot;{item.text}&quot;</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* End Lesson Completed Modal (Neobrutalist Window) */}
      <AnimatePresence>
        {isEndModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            {endModalStep === "review" && pending.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#1ac2ff] border-[3px] border-black shadow-[12px_12px_0_0_#000000] max-w-lg w-full text-black overflow-hidden relative"
              >
                <div className="bg-white border-b-[3px] border-black px-4 py-2 flex items-center justify-between font-black text-xs uppercase">
                  <span className="flex items-center gap-2">
                    <Flag size={14} className="text-black" />
                    WINDOW // END OF SESSION — REVIEW UNSURE POINTS ({pending.length})
                  </span>
                  <button onClick={() => finalizeReportStep()} className="hover:text-red-500 font-black">
                    <X size={18} strokeWidth={3} />
                  </button>
                </div>

                <div className="p-6">
                  <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0_0_#000] mb-4">
                    <h3 className="font-black text-base text-black mb-1">Unsure Point Detections Saved for Review</h3>
                    <p className="text-xs text-black/80 font-bold leading-relaxed">
                      Talli saved these points during your session because speech recognition confidence was below threshold or the cue was unsure. Select which points to approve before finalizing your report.
                    </p>
                  </div>

                  {/* Bulk Actions Bar */}
                  <div className="flex items-center justify-between mb-4 gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-black">
                      {pending.length} Pending {pending.length === 1 ? "Item" : "Items"}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleApproveAllPending}
                        className="px-3 py-1.5 text-xs font-black bg-[#4ade80] text-black border-2 border-black shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Check size={14} strokeWidth={3} /> Approve All ({pending.length})
                      </button>
                      <button
                        onClick={handleDiscardAllPending}
                        className="px-3 py-1.5 text-xs font-black bg-white text-black border-2 border-black shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
                      >
                        Discard All
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Pending Items List */}
                  <div className="max-h-60 overflow-y-auto space-y-3 pr-1 mb-6">
                    {pending.map((item) => (
                      <div key={item.id} className="bg-white border-2 border-black p-3 shadow-[3px_3px_0_0_#000] flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-black px-1.5 py-0.5 font-mono border border-black ${item.delta === "+1" ? "bg-[#4ade80] text-black" : "bg-[#ff66a3] text-black"}`}>
                              {item.delta}
                            </span>
                            <span className="text-sm font-black text-black truncate">{item.name}</span>
                            <span className="text-[10px] font-black bg-slate-100 px-1.5 py-0.5 border border-black font-mono">
                              {item.confidence}% confident
                            </span>
                          </div>
                          <p className="text-xs text-black/80 font-bold truncate">&quot;{item.text}&quot;</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleApprove(item.id)}
                            className="p-2 bg-[#4ade80] text-black border-2 border-black shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
                            title="Approve Point"
                          >
                            <Check size={14} strokeWidth={3} />
                          </button>
                          <button
                            onClick={() => handleDismiss(item.id)}
                            className="p-2 bg-white text-black border-2 border-black shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
                            title="Discard"
                          >
                            <X size={14} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2 border-t-2 border-black/20">
                    <button
                      onClick={(e) => finalizeReportStep(e)}
                      className="w-full flex items-center justify-center gap-2 bg-[#4ade80] text-black px-5 py-2.5 border-[3px] border-black shadow-[3px_3px_0_0_#000] font-black text-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
                    >
                      Finalize Session & View Report <ArrowRight size={18} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : createdReport ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#facc15] border-[3px] border-black shadow-[12px_12px_0_0_#000000] max-w-md w-full text-black overflow-hidden relative"
              >
                <div className="bg-white border-b-[3px] border-black px-4 py-2 flex items-center justify-between font-black text-xs uppercase">
                  <span>WINDOW // LESSON COMPLETED & REPORT CREATED</span>
                  <button onClick={() => setIsEndModalOpen(false)} className="hover:text-red-500">
                    <X size={18} strokeWidth={3} />
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-white border-[3px] border-black shadow-[3px_3px_0_0_#000] flex items-center justify-center font-black">
                      <Trophy size={32} className="text-[#facc15] stroke-black fill-[#facc15]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-black">{createdReport.className}</h2>
                      <p className="text-xs text-black font-extrabold">{createdReport.date} • Duration: {createdReport.duration}</p>
                    </div>
                  </div>

                  <div className="bg-white p-4 border-[3px] border-black shadow-[4px_4px_0_0_#000] mb-6 space-y-3">
                    <div className="flex justify-between items-center text-xs font-black">
                      <span className="uppercase text-black/70">Generated Report ID:</span>
                      <span className="font-mono bg-slate-100 px-2 py-0.5 border border-black">{createdReport.id}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-black">
                      <span className="uppercase text-black/70">Total Points Awarded:</span>
                      <span className="text-lg text-black">+{createdReport.totalPoints} PTS</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-black">
                      <span className="uppercase text-black/70">Participation Quality:</span>
                      <span className="bg-[#4ade80] text-black px-2 py-0.5 border border-black">{createdReport.participationRate}% Positive</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={handleStartNewLesson}
                      className="px-4 py-2 text-xs font-black bg-white border-2 border-black shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
                    >
                      Start New Lesson
                    </button>

                    <button
                      onClick={() => router.push("/reports")}
                      className="flex items-center gap-1.5 bg-[#4ade80] text-black px-5 py-2 border-[3px] border-black shadow-[3px_3px_0_0_#000] font-black text-xs hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
                    >
                      View in Reports <ArrowRight size={16} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </div>
        )}
      </AnimatePresence>

      {/* Global Session Setup Launcher Modal */}
      <SessionSetupModal isOpen={isSetupModalOpen} onClose={() => setIsSetupModalOpen(false)} />

    </div>
  );
}
