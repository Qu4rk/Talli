import { useEffect, useRef, useState, useCallback } from "react";
import { useMicVAD } from "@ricky0123/vad-react";
import { MicVAD } from "@ricky0123/vad-web";
import { float32ToWav } from "@/lib/audioUtils";

// Safely patch MicVAD instance factory & prototype once at module load to prevent React unmount crashes
if (typeof window !== "undefined" && MicVAD) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const micVadClass = MicVAD as any;
  if (micVadClass.new && !micVadClass._talliPatched) {
    const originalNew = micVadClass.new;
    micVadClass.new = async function (...args: unknown[]) {
      const instance = await originalNew.apply(this, args);
      if (instance && instance.destroy) {
        const origDestroy = instance.destroy;
        instance.destroy = async () => {
          try {
            if (instance._stream && instance._audioContext) {
              await origDestroy.call(instance);
            }
          } catch {
            // Suppress MicVAD null stream errors during React unmount
          }
        };
      }
      return instance;
    };
    micVadClass._talliPatched = true;
  }
}

export interface DetectionResult {
  detected?: boolean;
  studentName: string;
  studentId: number;
  delta: number;
  reason: string;
  confidence: number;
  triggerWord: string;
}

export interface DetectionItem {
  id: number;
  time: string;
  name: string;
  delta: string; // "+1" or "-1"
  text: string;
  confidence: number;
  studentId: number;
  triggerWord?: string;
}

export interface StudentRosterInfo {
  id: number;
  name: string;
  greekName?: string;
  classId: string;
}

interface UseClassroomListenerOptions {
  isListening: boolean;
  micPermission: "prompt" | "granted" | "denied";
  roster: StudentRosterInfo[];
  autoApproveThreshold: number;
  sensitivity?: number;
  openrouterModel?: string;
  onAutoApproved: (detection: DetectionItem) => void;
  onPendingDetection: (detection: DetectionItem) => void;
}

export function useClassroomListener({
  isListening,
  micPermission,
  roster,
  autoApproveThreshold,
  sensitivity = 70,
  openrouterModel,
  onAutoApproved,
  onPendingDetection,
}: UseClassroomListenerOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);

  // Store options in ref to keep callbacks stable
  const optionsRef = useRef({
    isListening,
    micPermission,
    roster,
    autoApproveThreshold,
    openrouterModel,
    onAutoApproved,
    onPendingDetection,
  });

  useEffect(() => {
    optionsRef.current = {
      isListening,
      micPermission,
      roster,
      autoApproveThreshold,
      openrouterModel,
      onAutoApproved,
      onPendingDetection,
    };
  }, [isListening, micPermission, roster, autoApproveThreshold, openrouterModel, onAutoApproved, onPendingDetection]);

  // Deduplication Cooldown Guard (prevents double points when continuous speech is sliced)
  const recentDetectionsRef = useRef<Map<string, number>>(new Map());

  const processDetectionItem = useCallback((d: DetectionResult, idx: number) => {
    const opts = optionsRef.current;
    const now = Date.now();

    // Key format: studentId_delta_triggerWord
    const dedupKey = `${d.studentId}_${d.delta}_${(d.triggerWord || "").toLowerCase().trim()}`;
    const lastTriggeredTime = recentDetectionsRef.current.get(dedupKey) || 0;

    // 4-second cooldown per student + trigger combination to prevent duplicate triggers during long talking
    if (now - lastTriggeredTime < 4000) {
      return;
    }
    recentDetectionsRef.current.set(dedupKey, now);

    // Lean Garbage Collection: Prune entries older than 10 seconds
    if (recentDetectionsRef.current.size > 15) {
      recentDetectionsRef.current.forEach((t, k) => {
        if (now - t > 10000) {
          recentDetectionsRef.current.delete(k);
        }
      });
    }

    const detectionItem: DetectionItem = {
      id: now + idx,
      time: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      name: d.studentName,
      delta: d.delta > 0 ? "+1" : "-1",
      text: d.reason,
      confidence: d.confidence,
      studentId: d.studentId,
      triggerWord: d.triggerWord,
    };

    if (detectionItem.confidence >= opts.autoApproveThreshold) {
      opts.onAutoApproved(detectionItem);
    } else {
      opts.onPendingDetection(detectionItem);
    }
  }, []);

  const handleSpeechEnd = useCallback(async (audio: Float32Array) => {
    const opts = optionsRef.current;
    if (!opts.isListening || opts.micPermission !== "granted") return;

    // Ignore extremely short audio clips (< 0.25s) to prevent false triggers on quiet coughs/paper rustles
    if (audio.length < 16000 * 0.25) return;

    // Hard 4.8-second max audio slice cap to process continuous teacher talking in real-time
    const maxSamples = Math.floor(16000 * 4.8);
    const slicedAudio = audio.length > maxSamples ? audio.slice(0, maxSamples) : audio;

    setIsProcessing(true);
    try {
      const wavBlob = float32ToWav(slicedAudio, 16000);
      const formData = new FormData();
      formData.append("audio", wavBlob, "speech.wav");
      formData.append("roster", JSON.stringify(opts.roster));

      const res = await fetch("/api/listen", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);

      const data = await res.json();
      if (data.transcript) {
        setLastTranscript(data.transcript);
      }

      const rawDetections: DetectionResult[] = data.detections || (data.detection?.detected ? [data.detection] : []);
      rawDetections.forEach((d, idx) => {
        processDetectionItem(d, idx);
      });
    } catch (err) {
      console.warn("Error processing speech chunk:", err);
    } finally {
      setIsProcessing(false);
    }
  }, [processDetectionItem]);

  const positiveSpeechThreshold = Math.max(0.4, Math.min(0.85, 0.85 - (sensitivity / 100) * 0.4));

  const vad = useMicVAD({
    startOnLoad: false,
    model: "v5",
    baseAssetPath: "/",
    onnxWASMBasePath: "/",
    positiveSpeechThreshold,
    negativeSpeechThreshold: 0.45,
    minSpeechMs: 320,
    redemptionMs: 400,
    submitUserSpeechOnPause: true,
    onSpeechEnd: handleSpeechEnd,
  });

  // Safely wrap vad.destroy to prevent synchronous MicVAD null stream errors during React unmounts
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vadObj = vad as any;
    if (vadObj && typeof vadObj.destroy === "function") {
      const origDestroy = vadObj.destroy.bind(vadObj);
      vadObj.destroy = () => {
        try {
          origDestroy();
        } catch {
          // Suppress null stream destroy error during React unmount
        }
      };
    }
  }, [vad]);

  // Start / Stop VAD dynamically based on isListening & micPermission
  useEffect(() => {
    // Suppress unhandled VAD destroy error when VAD stream is null during unmounts
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason?.message?.includes("MicVAD has null stream") ||
        event.reason?.message?.includes("processor adapter")
      ) {
        event.preventDefault();
      }
    };

    const handleError = (event: ErrorEvent) => {
      if (
        event.message?.includes("MicVAD has null stream") ||
        event.message?.includes("processor adapter")
      ) {
        event.preventDefault();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("unhandledrejection", handleRejection);
      window.addEventListener("error", handleError);
    }

    if (vad.errored) {
      console.warn("VAD Initialization Warning:", vad.errored);
    }

    try {
      if (isListening && micPermission === "granted") {
        if (!vad.loading && !vad.errored && !vad.listening) {
          vad.start().catch((err) => {
            if (!err?.message?.includes("null stream")) {
              console.warn("VAD start error:", err);
            }
          });
        }
      } else {
        if (!vad.loading && !vad.errored && vad.listening) {
          vad.pause().catch((err) => {
            if (!err?.message?.includes("null stream")) {
              console.warn("VAD pause error:", err);
            }
          });
        }
      }
    } catch (err) {
      console.warn("VAD toggle error:", err);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("unhandledrejection", handleRejection);
        window.removeEventListener("error", handleError);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, micPermission, vad.loading, vad.errored, vad.listening]);

  // Web Speech API Dual-Engine Listener
  useEffect(() => {
    if (!isListening || micPermission !== "granted") return;
    if (typeof window === "undefined") return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let recognition: any = null;
    try {
      recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "el-GR";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = async (event: any) => {
        const lastIdx = event.results.length - 1;
        const result = event.results[lastIdx];
        if (result.isFinal) {
          const text = result[0].transcript.trim();
          if (text.length > 0) {
            setLastTranscript(text);
            const opts = optionsRef.current;
            if (opts.roster.length === 0) return;

            setIsProcessing(true);
            try {
              const formData = new FormData();
              formData.append("text", text);
              formData.append("roster", JSON.stringify(opts.roster));

              const res = await fetch("/api/listen", {
                method: "POST",
                body: formData,
              });

              if (res.ok) {
                const data = await res.json();
                const rawDetections: DetectionResult[] = data.detections || (data.detection?.detected ? [data.detection] : []);
                rawDetections.forEach((d, idx) => {
                  processDetectionItem(d, idx);
                });
              }
            } catch (err) {
              console.warn("SpeechRecognition processing error:", err);
            } finally {
              setIsProcessing(false);
            }
          }
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (e: any) => {
        if (e.error !== "no-speech") {
          console.warn("Web Speech API error:", e.error);
        }
      };

      recognition.start();
    } catch (err) {
      console.warn("Could not start Web Speech API:", err);
    }

    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch {
          // Ignore cleanup errors
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, micPermission]);

  return {
    isUserSpeaking: vad.userSpeaking,
    isVADLoading: vad.loading,
    isVADErrored: vad.errored,
    isProcessing,
    lastTranscript,
  };
}
