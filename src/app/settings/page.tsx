"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Mic, Cpu, User, Check, Volume2, Save, Zap } from "lucide-react";
import Header from "@/components/Header";
import WavySlider from "@/components/WavySlider";
import { useApp } from "@/context/AppContext";

export default function SettingsScreen() {
  const { settings, updateSettings, micPermission, requestMicPermission } = useApp();

  const [micDevice, setMicDevice] = useState(settings.selectedMic);
  const [confidence, setConfidence] = useState(settings.autoApproveConfidence);
  const [sensitivity, setSensitivity] = useState(settings.sensitivity);
  const [ambientGain, setAmbientGain] = useState(-5);
  const [noiseSuppression, setNoiseSuppression] = useState(settings.noiseSuppression);
  const [teacherName, setTeacherName] = useState(settings.teacherName);
  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [selectedModel, setSelectedModel] = useState(settings.openrouterModel || "openai/gpt-4o-mini");

  const [isTestingMic, setIsTestingMic] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  useEffect(() => {
    document.title = "Settings | Talli";
  }, []);

  const [availableDevices, setAvailableDevices] = useState<{ id: string; label: string }[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSpeechDetected, setIsSpeechDetected] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  // Enumerate Connected Microphone Hardware Devices
  useEffect(() => {
    async function getDevices() {
      try {
        if (navigator.mediaDevices?.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioInputs = devices
            .filter((d) => d.kind === "audioinput")
            .map((d, idx) => ({
              id: d.deviceId,
              label: d.label || `Microphone ${idx + 1} (${d.deviceId ? d.deviceId.slice(0, 6) : "Default"})`,
            }));

          if (audioInputs.length > 0) {
            setAvailableDevices(audioInputs);
            // If current micDevice is default or empty, set to first real device ID
            if (!micDevice || micDevice === "Built-in Microphone (MacBook Pro)") {
              setMicDevice(audioInputs[0].id || audioInputs[0].label);
            }
          }
        }
      } catch (err) {
        console.warn("Could not enumerate audio devices:", err);
      }
    }

    getDevices();
  }, []);

  // Web Audio API Real-time Microphone Input Level Testing & AnalyserNode
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let micStream: MediaStream | null = null;
    let animId: number;

    async function startMicTest() {
      setMicError(null);
      try {
        const isRealDeviceId = micDevice && micDevice.length > 20 && !micDevice.includes(" ") && !micDevice.includes("(");

        try {
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: isRealDeviceId
              ? { deviceId: { exact: micDevice }, echoCancellation: noiseSuppression, noiseSuppression }
              : { echoCancellation: noiseSuppression, noiseSuppression },
          });
        } catch {
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: noiseSuppression, noiseSuppression },
          });
        }

        // Update device labels after permission grant
        if (navigator.mediaDevices?.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const audioInputs = devices
            .filter((d) => d.kind === "audioinput")
            .map((d, idx) => ({
              id: d.deviceId,
              label: d.label || `Microphone ${idx + 1}`,
            }));
          if (audioInputs.length > 0) {
            setAvailableDevices(audioInputs);
            // If current micDevice is still a generic label, switch to first real hardware ID
            if (!isRealDeviceId && audioInputs[0].id) {
              setMicDevice(audioInputs[0].id);
            }
          }
        }

        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtx = new AudioCtx();
        if (audioCtx.state === "suspended") {
          await audioCtx.resume();
        }
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;

        const source = audioCtx.createMediaStreamSource(micStream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateMeter = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);

          // Calculate RMS volume level
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          const normalizedLevel = Math.min(100, Math.round((average / 128) * 100));

          setAudioLevel(normalizedLevel);
          setIsSpeechDetected(normalizedLevel > (100 - sensitivity * 0.8));

          animId = requestAnimationFrame(updateMeter);
        };

        updateMeter();
      } catch (err) {
        console.warn("Microphone test error:", err);
        setMicError("Microphone access unavailable or blocked. Using simulated level meter.");
        
        // Fallback simulation loop if hardware mic is blocked
        let simVal = 0;
        const simInterval = setInterval(() => {
          simVal = Math.floor(20 + Math.random() * 60);
          setAudioLevel(simVal);
          setIsSpeechDetected(simVal > 40);
        }, 150);

        return () => clearInterval(simInterval);
      }
    }

    if (isTestingMic) {
      startMicTest();
    } else {
      setAudioLevel(0);
      setIsSpeechDetected(false);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (micStream) {
        micStream.getTracks().forEach((track) => track.stop());
      }
      if (audioCtx && audioCtx.state !== "closed") {
        audioCtx.close();
      }
    };
  }, [isTestingMic, micDevice, noiseSuppression, sensitivity]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      selectedMic: micDevice,
      autoApproveConfidence: confidence,
      sensitivity,
      noiseSuppression,
      teacherName,
      schoolName,
      openrouterModel: selectedModel,
    });
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  return (
    <div className="flex flex-col h-screen text-white font-sans relative overflow-hidden">

      <Header />

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 max-w-4xl mx-auto w-full relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#c084fc] border-[3px] border-black shadow-[4px_4px_0_0_#000000] text-black">
              <Settings size={28} />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-black drop-shadow-[2px_2px_0_#ffffff]">App Settings</h1>
              <p className="text-slate-800 font-extrabold text-base">Configure audio input, custom wavy AI sliders, and profile.</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-[#4ade80] text-black px-6 py-3 border-[3px] border-black shadow-[4px_4px_0_0_#000000] hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-[2.5px_2.5px_0_0_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none font-black text-sm transition-all"
          >
            <Save size={18} strokeWidth={2.5} />
            Save Preferences
          </button>
        </div>

        {/* Saved Toast Banner */}
        <AnimatePresence>
          {showSavedToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#4ade80] text-black border-[3px] border-black p-4 shadow-[4px_4px_0_0_#000000] font-black text-sm mb-6 flex items-center gap-2"
            >
              <Check size={18} strokeWidth={3} />
              Settings successfully updated and saved!
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSave} className="space-y-8 pb-12">
          
          {/* SECTION 1: Audio & Microphone (Neobrutalist Window) */}
          <div className="bg-[#1ac2ff] border-[3px] border-black shadow-[10px_10px_0_0_#000000] text-black overflow-hidden">
            <div className="bg-white border-b-[3px] border-black px-4 py-2 font-black text-xs uppercase flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Mic size={16} /> WINDOW // AUDIO HARDWARE
              </span>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-2">Microphone Input Device</label>
                <select
                  value={micDevice}
                  onChange={(e) => setMicDevice(e.target.value)}
                  className="w-full bg-white border-[3px] border-black p-3 text-sm text-black font-bold shadow-[3px_3px_0_0_#000] outline-none cursor-pointer"
                >
                  {availableDevices.length > 0 ? (
                    availableDevices.map((dev) => (
                      <option key={dev.id} value={dev.id}>
                        {dev.label}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Built-in Microphone (MacBook Pro)">Built-in Microphone (MacBook Pro)</option>
                      <option value="AirPods Pro (Bluetooth)">AirPods Pro (Bluetooth)</option>
                      <option value="External USB Array (Classroom Array)">External USB Array (Classroom Array)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Interactive Mic Test Meter */}
              <div className="bg-white p-5 border-[3px] border-black shadow-[4px_4px_0_0_#000]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-black">
                    <Volume2 size={16} />
                    Input Level Test (VAD Meter)
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (micPermission !== "granted") {
                        requestMicPermission().then(() => setIsTestingMic(true));
                      } else {
                        setIsTestingMic(!isTestingMic);
                      }
                    }}
                    className={`px-4 py-1.5 text-xs font-black border-2 border-black shadow-[2px_2px_0_0_#000] transition-all cursor-pointer ${
                      isTestingMic ? "bg-[#ff66a3] text-black" : "bg-[#4ade80] text-black hover:bg-emerald-300"
                    }`}
                  >
                    {isTestingMic ? "Stop Test" : micPermission !== "granted" ? "Grant Mic & Test" : "Test Mic"}
                  </button>
                </div>

                <div className="w-full bg-slate-100 h-5 border-2 border-black p-0.5 shadow-[2px_2px_0_0_#000] relative overflow-hidden">
                  <motion.div
                    animate={{ width: `${audioLevel}%` }}
                    transition={{ ease: "easeOut", duration: 0.08 }}
                    className={`h-full border border-black transition-colors ${
                      isSpeechDetected ? "bg-[#ff66a3]" : "bg-[#4ade80]"
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-black/80 font-bold mt-2">
                  <span>
                    {isTestingMic
                      ? `Live Audio Level: ${audioLevel}%`
                      : "Click 'Test Mic' to simulate voice detection levels."}
                  </span>
                  {isTestingMic && (
                    <span className={`px-1.5 py-0.5 border border-black font-black uppercase flex items-center gap-1 ${isSpeechDetected ? "bg-[#ff66a3] text-black" : "bg-slate-200 text-black"}`}>
                      {isSpeechDetected ? (
                        <>
                          <Volume2 size={12} className="animate-pulse" /> Voice Detected
                        </>
                      ) : (
                        "Listening..."
                      )}
                    </span>
                  )}
                </div>
                {micError && (
                  <div className="text-[10px] text-rose-600 font-extrabold mt-1">
                    {micError}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t-2 border-black">
                <div>
                  <div className="text-sm font-black text-black">AI Noise Suppression</div>
                  <div className="text-xs text-black/80 font-bold">Filter out ambient classroom chatter and background noise.</div>
                </div>
                <input
                  type="checkbox"
                  checked={noiseSuppression}
                  onChange={(e) => setNoiseSuppression(e.target.checked)}
                  className="w-6 h-6 accent-black border-2 border-black rounded-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: OpenRouter Model Harness & Custom Wavy Path Sliders */}
          <div className="bg-[#ff66a3] border-[3px] border-black shadow-[10px_10px_0_0_#000000] text-black overflow-hidden">
            <div className="bg-white border-b-[3px] border-black px-4 py-2 font-black text-xs uppercase flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Cpu size={16} /> WINDOW // OPENROUTER AI HARNESS & CONFIDENCE CONFIG
              </span>
              <span className="bg-[#4ade80] text-black text-[10px] font-mono font-black px-2 py-0.5 border border-black">
                OpenRouter Key Active
              </span>
            </div>

            <div className="p-8 space-y-8">
              
              {/* OpenRouter Model Selection Dropdown */}
              <div className="bg-white p-6 border-[3px] border-black shadow-[4px_4px_0_0_#000]">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider block">OpenRouter Intent Parsing AI Model</label>
                    <span className="text-[11px] font-extrabold text-black/70">Select the active LLM engine powering Greek classroom behavior & cue extraction</span>
                  </div>
                </div>

                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-slate-50 border-[3px] border-black p-3 text-xs text-black font-black shadow-[3px_3px_0_0_#000] outline-none cursor-pointer mt-2"
                >
                  <option value="openai/gpt-4o-mini">OpenAI: GPT-4o Mini (openai/gpt-4o-mini) — [Recommended Default]</option>
                  <option value="google/gemini-2.5-flash">Google: Gemini 2.5 Flash (google/gemini-2.5-flash) — [Ultra-Fast & Free]</option>
                  <option value="anthropic/claude-3.5-haiku">Anthropic: Claude 3.5 Haiku (anthropic/claude-3.5-haiku) — [High Precision]</option>
                  <option value="meta-llama/llama-3.3-70b-instruct">Meta: Llama 3.3 70B Instruct (meta-llama/llama-3.3-70b-instruct) — [Open Weights]</option>
                  <option value="mistralai/mistral-small-24b-instruct-2501">Mistral: Mistral Small 24B (mistralai/mistral-small-24b-instruct-2501)</option>
                </select>

                <div className="bg-[#facc15]/30 border-2 border-black p-3 mt-3 text-xs font-bold text-black flex items-center justify-between">
                  <span>Current Active Harness Target: <span className="font-mono font-black bg-white px-2 py-0.5 border border-black">{selectedModel}</span></span>
                  <span className="text-[10px] font-black uppercase text-purple-700">OpenRouter Engine Ready</span>
                </div>
              </div>

              {/* Slider 1: Cyan Wavy Path */}
              <div className="bg-white p-6 border-[3px] border-black shadow-[4px_4px_0_0_#000]">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider block">Auto-Approve Confidence Threshold</label>
                    <span className="text-[11px] font-extrabold text-black/70">Controls automatic point addition & deduction threshold</span>
                  </div>
                  <span className="text-sm font-black bg-[#1ac2ff] px-3 py-1 border-2 border-black shadow-[2px_2px_0_0_#000]">{confidence}%</span>
                </div>

                {/* Preset Threshold Quick Select */}
                <div className="flex items-center gap-2 my-3">
                  <span className="text-[10px] font-black uppercase text-black/60">Presets:</span>
                  {[
                    { label: "75% Relaxed", val: 75 },
                    { label: "85% Balanced", val: 85 },
                    { label: "92% Strict", val: 92 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setConfidence(preset.val)}
                      className={`px-2.5 py-1 text-[10px] font-black border border-black transition-all cursor-pointer ${
                        confidence === preset.val ? "bg-[#1ac2ff] text-black shadow-[1.5px_1.5px_0_0_#000]" : "bg-slate-100 text-black hover:bg-slate-200"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="flex justify-center my-2">
                  <WavySlider
                    min={60}
                    max={95}
                    step={0.5}
                    value={confidence}
                    onChange={(val) => setConfidence(val)}
                    color="#1ac2ff"
                    wavePattern={1}
                  />
                </div>

                <div className="bg-[#1ac2ff]/20 border-2 border-black p-3 mt-3 text-xs font-bold text-black flex items-start gap-2">
                  <Zap size={16} className="shrink-0 text-black mt-0.5" fill="#1ac2ff" />
                  <div>
                    <span className="font-black uppercase tracking-wide block mb-0.5">AUTOMATIC NO-TEACHER-INPUT APPROVAL ACTIVE</span>
                    AI detections with confidence <span className="font-black underline">&ge; {confidence}%</span> require <span className="font-black">zero teacher input</span> and automatically add or deduct student points instantly. Detections below {confidence}% go to Pending Verification for manual review.
                  </div>
                </div>
              </div>

              {/* Slider 2: Magenta Wavy Path */}
              <div className="bg-white p-6 border-[3px] border-black shadow-[4px_4px_0_0_#000]">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-black uppercase tracking-wider">VAD Mic Sensitivity</label>
                  <span className="text-sm font-black bg-[#BD1550] text-white px-3 py-1 border-2 border-black shadow-[2px_2px_0_0_#000]">{sensitivity}%</span>
                </div>
                <div className="flex justify-center">
                  <WavySlider
                    min={20}
                    max={100}
                    value={sensitivity}
                    onChange={(val) => setSensitivity(val)}
                    color="#BD1550"
                    wavePattern={2}
                  />
                </div>
                <div className="text-xs font-bold text-black/80 mt-1">
                  Controls minimum decibel threshold for voice activity detection.
                </div>
              </div>

              {/* Slider 3: Blue Wavy Path */}
              <div className="bg-white p-6 border-[3px] border-black shadow-[4px_4px_0_0_#000]">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-black uppercase tracking-wider">Ambient Noise Floor Gain</label>
                  <span className="text-sm font-black bg-[#00b4d8] text-white px-3 py-1 border-2 border-black shadow-[2px_2px_0_0_#000]">{ambientGain} dB</span>
                </div>
                <div className="flex justify-center">
                  <WavySlider
                    min={-10}
                    max={10}
                    step={0.1}
                    value={ambientGain}
                    onChange={(val) => setAmbientGain(val)}
                    color="#00b4d8"
                    wavePattern={3}
                  />
                </div>
                <div className="text-xs font-bold text-black/80 mt-1">
                  Fine-tunes the background noise cancellation curve in decibels.
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 3: Teacher & Profile (Neobrutalist Window) */}
          <div className="bg-[#facc15] border-[3px] border-black shadow-[10px_10px_0_0_#000000] text-black overflow-hidden">
            <div className="bg-white border-b-[3px] border-black px-4 py-2 font-black text-xs uppercase flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User size={16} /> WINDOW // PROFILE & CLASSROOM
              </span>
            </div>

            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-2">Teacher Display Name</label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full bg-white border-[3px] border-black p-3 text-sm text-black font-bold shadow-[3px_3px_0_0_#000] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider mb-2">School / Institution</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full bg-white border-[3px] border-black p-3 text-sm text-black font-bold shadow-[3px_3px_0_0_#000] outline-none"
                />
              </div>
            </div>
          </div>

        </form>
      </main>

    </div>
  );
}
