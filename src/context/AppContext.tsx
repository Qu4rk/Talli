"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Student {
  id: number;
  name: string;
  greekName?: string;
  initials: string;
  score: number;
  classId: string;
  tags?: string[];
  recentEvent?: { type: "positive" | "negative"; text: string } | null;
}

export interface SessionReport {
  id: string;
  date: string;
  className: string;
  duration: string;
  totalPoints: number;
  positiveCount: number;
  negativeCount: number;
  participationRate: number;
}

export interface AppSettings {
  selectedMic: string;
  autoApproveConfidence: number;
  sensitivity: number;
  noiseSuppression: boolean;
  teacherName: string;
  schoolName: string;
  openrouterModel: string;
}

export interface CyprusGrade {
  code: string;
  label: string;
  fullName: string;
}

export const CYPRUS_GRADES: CyprusGrade[] = [
  { code: "a", label: "Α'", fullName: "Δημοτικό Α' (1st Grade)" },
  { code: "b", label: "Β'", fullName: "Δημοτικό Β' (2nd Grade)" },
  { code: "g", label: "Γ'", fullName: "Δημοτικό Γ' (3rd Grade)" },
  { code: "d", label: "Δ'", fullName: "Δημοτικό Δ' (4th Grade)" },
  { code: "e", label: "Ε'", fullName: "Δημοτικό Ε' (5th Grade)" },
  { code: "st", label: "ΣΤ'", fullName: "Δημοτικό ΣΤ' (6th Grade)" },
];

export const CYPRUS_SECTIONS = ["1", "2", "3", "4", "5", "6"];

export interface CyprusClass {
  id: string;
  label: string;
  grade: string;
  section: string;
}

// Generate all 36 Cyprus Primary class & section combinations (A'1-A'6, B'1-B'6, ... ST'1-ST'6)
export const CYPRUS_CLASSES: CyprusClass[] = CYPRUS_GRADES.flatMap((g) =>
  CYPRUS_SECTIONS.map((sec) => ({
    id: `${g.code}${sec}`,
    label: `Τάξη ${g.label}${sec}`,
    grade: g.label,
    section: sec,
  }))
);

export function getCyprusClassLabel(classId: string): string {
  const found = CYPRUS_CLASSES.find((c) => c.id === classId);
  if (found) return found.label;
  
  // Dynamic fallback parser for custom class IDs like "b3" -> "Τάξη Β'3"
  const match = classId.match(/([a-z]+)(\d+)/i);
  if (match) {
    const gObj = CYPRUS_GRADES.find((g) => g.code === match[1]);
    const gradeLabel = gObj ? gObj.label : match[1].toUpperCase();
    return `Τάξη ${gradeLabel}${match[2]}`;
  }
  return `Τάξη ${classId.toUpperCase()}`;
}

export interface CyprusSubject {
  id: string;
  name: string;
  category: "Κορμός" | "Επιστήμες" | "Ανθρωπιστικά" | "Τέχνες & Τεχνολογία" | "Γλώσσες";
  color: string;
}

export const CYPRUS_SUBJECTS: CyprusSubject[] = [
  { id: "greek", name: "Ελληνικά (Γλώσσα & Λογοτεχνία)", category: "Κορμός", color: "#1ac2ff" },
  { id: "math", name: "Μαθηματικά", category: "Κορμός", color: "#facc15" },
  { id: "science", name: "Φυσικές Επιστήμες", category: "Επιστήμες", color: "#4ade80" },
  { id: "history", name: "Ιστορία", category: "Ανθρωπιστικά", color: "#c084fc" },
  { id: "geography", name: "Γεωγραφία / Πατριδογνωσία", category: "Ανθρωπιστικά", color: "#ff66a3" },
  { id: "english", name: "Αγγλικά (English)", category: "Γλώσσες", color: "#38bdf8" },
  { id: "religious", name: "Θρησκευτικά", category: "Ανθρωπιστικά", color: "#fbbf24" },
  { id: "health", name: "Αγωγή Υγείας & Ζωής", category: "Επιστήμες", color: "#f43f5e" },
  { id: "design_tech", name: "Σχεδιασμός & Τεχνολογία", category: "Τέχνες & Τεχνολογία", color: "#a855f7" },
  { id: "music", name: "Μουσική", category: "Τέχνες & Τεχνολογία", color: "#ec4899" },
  { id: "art", name: "Εικαστικά / Τέχνη", category: "Τέχνες & Τεχνολογία", color: "#f97316" },
  { id: "pe", name: "Φυσική Αγωγή (Γυμναστική)", category: "Τέχνες & Τεχνολογία", color: "#10b981" },
];

interface AppContextType {
  activeClass: string;
  setActiveClass: (c: string) => void;
  activeSubject: string;
  setActiveSubject: (s: string) => void;
  lessonTopic: string;
  setLessonTopic: (t: string) => void;
  isSetupModalOpen: boolean;
  setIsSetupModalOpen: (open: boolean) => void;
  switchSession: (params: { classId: string; subject: string; topic?: string }) => void;
  students: Student[];
  addStudent: (s: Omit<Student, "id" | "score" | "recentEvent">) => void;
  updateStudentScore: (id: number, delta: number, eventText?: string) => void;
  updateStudentTags: (id: number, tags: string[]) => void;
  deleteStudent: (id: number) => void;
  reports: SessionReport[];
  addReport: (report: SessionReport) => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  micPermission: "prompt" | "granted" | "denied";
  hardwareMics: { id: string; label: string }[];
  requestMicPermission: () => Promise<boolean>;
}

const INITIAL_STUDENTS: Student[] = [
  // Class Δ'1 (Grade 4A)
  { id: 1, name: "Eleni M.", greekName: "Ελένη Μ.", initials: "EM", score: 14, classId: "d1", tags: ["Engaged", "Consistent"] },
  { id: 2, name: "Yiannis P.", greekName: "Γιάννης Π.", initials: "YP", score: 8, classId: "d1", tags: ["Consistent"] },
  { id: 3, name: "Maria K.", greekName: "Μαρία Κ.", initials: "MK", score: 21, classId: "d1", tags: ["Top Speaker", "Collaborative"] },
  { id: 4, name: "Andreas T.", greekName: "Ανδρέας Τ.", initials: "AT", score: 5, classId: "d1", tags: ["Engaged"] },
  { id: 5, name: "Sofia D.", greekName: "Σοφία Δ.", initials: "SD", score: 11, classId: "d1", tags: ["Collaborative", "Consistent"] },

  // Class Β'3 (Grade 2C)
  { id: 6, name: "Nikos L.", greekName: "Νίκος Λ.", initials: "NL", score: 12, classId: "b3", tags: ["Consistent"] },
  { id: 7, name: "Chloe S.", greekName: "Χλόη Σ.", initials: "CS", score: 19, classId: "b3", tags: ["Engaged", "Top Speaker"] },
  { id: 8, name: "Petros F.", greekName: "Πέτρος Φ.", initials: "PF", score: 15, classId: "b3", tags: ["Collaborative"] },
  { id: 9, name: "Anna V.", greekName: "Άννα Β.", initials: "AV", score: 25, classId: "b3", tags: ["Top Speaker", "Engaged"] },

  // Class Α'2 (Grade 1B)
  { id: 10, name: "Costas A.", greekName: "Κώστας Α.", initials: "CA", score: 9, classId: "a2", tags: ["Engaged"] },
  { id: 11, name: "Elena G.", greekName: "Έλενα Γ.", initials: "EG", score: 17, classId: "a2", tags: ["Top Speaker"] },
  { id: 12, name: "Michalis R.", greekName: "Μιχάλης Ρ.", initials: "MR", score: 14, classId: "a2", tags: ["Consistent"] },

  // Class Ε'1 (Grade 5A)
  { id: 13, name: "Alex K.", greekName: "Αλέξανδρος Κ.", initials: "AK", score: 18, classId: "e1", tags: ["Collaborative", "Consistent"] },
  { id: 14, name: "Beatrix L.", greekName: "Βεατρίκη Λ.", initials: "BL", score: 14, classId: "e1", tags: ["Engaged"] },
  { id: 15, name: "Clara S.", greekName: "Κλάρα Σ.", initials: "CS", score: 22, classId: "e1", tags: ["Top Speaker", "Engaged"] },

  // Class ΣΤ'4 (Grade 6D)
  { id: 16, name: "Filippos M.", greekName: "Φίλιππος Μ.", initials: "FM", score: 16, classId: "st4", tags: ["Consistent"] },
  { id: 17, name: "Ioanna Z.", greekName: "Ιωάννα Ζ.", initials: "IZ", score: 20, classId: "st4", tags: ["Top Speaker"] },
];

const INITIAL_REPORTS: SessionReport[] = [
  { id: "REP-901", date: "Today, 10:00 AM", className: "Τάξη Δ'1 - Μαθηματικά", duration: "45 mins", totalPoints: 48, positiveCount: 44, negativeCount: 4, participationRate: 92 },
  { id: "REP-902", date: "Yesterday, 2:15 PM", className: "Τάξη Β'3 - Φυσικές Επιστήμες", duration: "50 mins", totalPoints: 36, positiveCount: 32, negativeCount: 4, participationRate: 85 },
  { id: "REP-903", date: "Aug 4, 11:30 AM", className: "Τάξη Α'2 - Ελληνικά", duration: "40 mins", totalPoints: 52, positiveCount: 50, negativeCount: 2, participationRate: 95 },
];

const INITIAL_SETTINGS: AppSettings = {
  selectedMic: "Built-in Microphone (MacBook Pro)",
  autoApproveConfidence: 85,
  sensitivity: 70,
  noiseSuppression: true,
  teacherName: "Jane Doe",
  schoolName: "Δημοτικό Σχολείο Λευκωσίας",
  openrouterModel: "openai/gpt-4o-mini",
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeClass, setActiveClassState] = useState("d1");
  const [activeSubject, setActiveSubject] = useState("Μαθηματικά");
  const [lessonTopic, setLessonTopic] = useState("Κεφάλαιο 4: Κλάσματα & Δεκαδικοί");
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [reports, setReports] = useState<SessionReport[]>(INITIAL_REPORTS);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);

  // Hydrate state from localStorage on initial client mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedStudents = localStorage.getItem("talli_students");
      if (savedStudents) setStudents(JSON.parse(savedStudents));

      const savedReports = localStorage.getItem("talli_reports");
      if (savedReports) setReports(JSON.parse(savedReports));

      const savedSettings = localStorage.getItem("talli_settings");
      if (savedSettings) setSettings(JSON.parse(savedSettings));

      const savedClass = localStorage.getItem("talli_activeClass");
      if (savedClass) setActiveClassState(savedClass);

      const savedSubject = localStorage.getItem("talli_activeSubject");
      if (savedSubject) setActiveSubject(savedSubject);

      const savedTopic = localStorage.getItem("talli_lessonTopic");
      if (savedTopic) setLessonTopic(savedTopic);
    } catch (e) {
      console.warn("Could not load Talli state from localStorage:", e);
    }
  }, []);

  // Sync state to localStorage whenever students, reports, or settings change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("talli_students", JSON.stringify(students));
    } catch {
      // Ignore storage quota errors
    }
  }, [students]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("talli_reports", JSON.stringify(reports));
    } catch {
      // Ignore storage quota errors
    }
  }, [reports]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("talli_settings", JSON.stringify(settings));
    } catch {
      // Ignore storage quota errors
    }
  }, [settings]);

  const setActiveClass = (targetClassId: string) => {
    setActiveClassState(targetClassId);
    if (typeof window !== "undefined") {
      try { localStorage.setItem("talli_activeClass", targetClassId); } catch {
        // Ignore storage errors
      }
    }

    // Auto-seed default student roster with guaranteed unique IDs if selected class section has no students yet
    setStudents((prev) => {
      const existing = prev.filter((s) => s.classId === targetClassId);
      if (existing.length > 0) return prev;

      const validIds = prev.map((s) => Number(s.id)).filter((id) => !isNaN(id));
      const maxId = validIds.length > 0 ? Math.max(...validIds) : 100;

      const newClassStudents: Student[] = [
        { id: maxId + 1, name: "Eleni M.", greekName: "Ελένη Μ.", initials: "EM", score: 10, classId: targetClassId, tags: ["Engaged", "Consistent"] },
        { id: maxId + 2, name: "Yiannis P.", greekName: "Γιάννης Π.", initials: "YP", score: 8, classId: targetClassId, tags: ["Consistent"] },
        { id: maxId + 3, name: "Maria K.", greekName: "Μαρία Κ.", initials: "MK", score: 16, classId: targetClassId, tags: ["Top Speaker", "Collaborative"] },
        { id: maxId + 4, name: "Andreas T.", greekName: "Ανδρέας Τ.", initials: "AT", score: 7, classId: targetClassId, tags: ["Engaged"] },
      ];
      return [...prev, ...newClassStudents];
    });
  };

  const switchSession = ({ classId, subject, topic }: { classId: string; subject: string; topic?: string }) => {
    setActiveClass(classId);
    setActiveSubject(subject);
    if (topic !== undefined) {
      setLessonTopic(topic);
    }
  };

  const addReport = (newReport: SessionReport) => {
    setReports((prev) => [newReport, ...prev]);
  };

  const [micPermission, setMicPermission] = useState<"prompt" | "granted" | "denied">("prompt");
  const [hardwareMics, setHardwareMics] = useState<{ id: string; label: string }[]>([]);

  const requestMicPermission = async (): Promise<boolean> => {
    try {
      if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
        setMicPermission("denied");
        return false;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      setMicPermission("granted");

      // Enumerate hardware devices so exact labels populate
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter((d) => d.kind === "audioinput")
        .map((d, idx) => ({
          id: d.deviceId,
          label: d.label || `Microphone ${idx + 1}`,
        }));
      setHardwareMics(audioInputs);

      // Stop stream after permission request
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err) {
      console.warn("Microphone access denied or error:", err);
      setMicPermission("denied");
      return false;
    }
  };

  const addStudent = (newStudentData: Omit<Student, "id" | "score" | "recentEvent">) => {
    const validIds = students.map((s) => Number(s.id)).filter((id) => !isNaN(id));
    const newId = validIds.length > 0 ? Math.max(...validIds) + 1 : 1;
    const newStudent: Student = {
      ...newStudentData,
      id: newId,
      score: 0,
      recentEvent: null,
    };
    setStudents((prev) => [...prev, newStudent]);
  };

  const updateStudentScore = (id: number, delta: number, eventText?: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              score: Math.max(0, s.score + delta),
              recentEvent: {
                type: delta > 0 ? "positive" : "negative",
                text: eventText || (delta > 0 ? `+${delta} PTS` : `${delta} PTS`),
              },
            }
          : s
      )
    );

    // Auto-clear recentEvent after 2000ms so green/red outline & badge fade away smoothly
    setTimeout(() => {
      setStudents((prev) =>
        prev.map((s) => (s.id === id ? { ...s, recentEvent: null } : s))
      );
    }, 2000);
  };

  const updateStudentTags = (id: number, tags: string[]) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, tags } : s))
    );
  };

  const deleteStudent = (id: number) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <AppContext.Provider
      value={{
        activeClass,
        setActiveClass,
        activeSubject,
        setActiveSubject,
        lessonTopic,
        setLessonTopic,
        isSetupModalOpen,
        setIsSetupModalOpen,
        switchSession,
        students,
        addStudent,
        updateStudentScore,
        updateStudentTags,
        deleteStudent,
        reports,
        addReport,
        settings,
        updateSettings,
        micPermission,
        hardwareMics,
        requestMicPermission,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};
