"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Mic, MicOff, Camera, Video, AlertTriangle, CheckCircle2, XCircle, TrendingDown, Brain, Activity, Eye, Hand } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, getErrorMessage } from "@/lib/utils";
import type { AnalysisResult, ScanPayload } from "@/lib/types";

// ============================================================
// Results Display Component
// ============================================================
function ResultsView({ results, onReset }: { results: AnalysisResult; onReset: () => void }) {
  const gradeColors: Record<string, string> = {
    normal: "text-[#00e5a0]",
    mild: "text-yellow-400",
    moderate: "text-orange-400",
    severe: "text-red-400",
  };
  const gradeLabels: Record<string, string> = {
    normal: "Normal",
    mild: "Mild Concern",
    moderate: "Moderate Risk",
    severe: "High Risk",
  };
  const gradeBg: Record<string, string> = {
    normal: "from-[#00e5a0]/20 to-[#00e5a0]/5",
    mild: "from-yellow-400/20 to-yellow-400/5",
    moderate: "from-orange-400/20 to-orange-400/5",
    severe: "from-red-400/20 to-red-400/5",
  };
  const categoryIcons: Record<string, React.ReactNode> = {
    speech: <Activity className="w-5 h-5" />,
    vision: <Eye className="w-5 h-5" />,
    memory: <Brain className="w-5 h-5" />,
    motor: <Hand className="w-5 h-5" />,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      {/* Overall Score Hero */}
      <div className={cn("p-8 rounded-2xl bg-gradient-to-br border text-center", gradeBg[results.overallGrade], results.overallGrade === "normal" ? "border-[#00e5a0]/30" : results.overallGrade === "mild" ? "border-yellow-400/30" : results.overallGrade === "moderate" ? "border-orange-400/30" : "border-red-400/30")}>
        <p className="text-sm text-[#a8c4d8] uppercase tracking-widest mb-2">Cognitive Score</p>
        <div className={cn("text-7xl font-black mb-2", gradeColors[results.overallGrade])}>{results.overallScore}</div>
        <div className={cn("text-xl font-semibold mb-4", gradeColors[results.overallGrade])}>{gradeLabels[results.overallGrade]}</div>
        <p className="text-[#a8c4d8] text-sm max-w-lg mx-auto">{results.recommendation}</p>
        <p className="text-[#5a7a99] text-xs mt-4">Scan ID: {results.scanId} • Processed in {results.processingTimeMs}ms</p>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(results.categories).map(([key, cat]) => (
          <div key={key} className="p-5 rounded-xl bg-[#0b1520] border border-[rgba(0,200,255,0.12)]">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn("p-2 rounded-lg", cat.grade === "normal" ? "bg-[#00e5a0]/10 text-[#00e5a0]" : cat.grade === "mild" ? "bg-yellow-400/10 text-yellow-400" : cat.grade === "moderate" ? "bg-orange-400/10 text-orange-400" : "bg-red-400/10 text-red-400")}>
                {categoryIcons[key]}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{cat.name}</h4>
                <p className="text-xs text-[#5a7a99]">{cat.grade.toUpperCase()}</p>
              </div>
              <div className={cn("text-2xl font-black", gradeColors[cat.grade])}>{cat.score}</div>
            </div>
            {/* Score bar */}
            <div className="h-2 rounded-full bg-[#0f1e2e] mb-3 overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-1000", cat.grade === "normal" ? "bg-[#00e5a0]" : cat.grade === "mild" ? "bg-yellow-400" : cat.grade === "moderate" ? "bg-orange-400" : "bg-red-400")} style={{ width: `${cat.score}%` }} />
            </div>
            <p className="text-xs text-[#a8c4d8] mb-2">{cat.details}</p>
            <ul className="space-y-1">
              {cat.indicators.map((ind, i) => (
                <li key={i} className="text-xs text-[#5a7a99] flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">•</span>{ind}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Risk Flags */}
      {results.riskFlags.length > 0 && (
        <div className="p-5 rounded-xl bg-red-500/5 border border-red-500/20">
          <h3 className="font-bold text-red-400 flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5" /> Risk Flags ({results.riskFlags.length})
          </h3>
          <ul className="space-y-2">
            {results.riskFlags.map((flag, i) => (
              <li key={i} className={cn("text-sm flex items-start gap-2", flag.severity === "critical" ? "text-red-400" : flag.severity === "high" ? "text-orange-400" : "text-yellow-400")}>
                <span className="mt-0.5 shrink-0">{flag.severity === "critical" ? <XCircle className="w-4 h-4" /> : flag.severity === "high" ? <AlertTriangle className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}</span>
                {flag.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-center pt-4">
        <button onClick={onReset} className="px-8 py-4 rounded-xl bg-gradient-to-br from-[#00c8ff] to-[#7b5fff] text-white font-semibold shadow-[0_0_24px_rgba(0,200,255,0.28)] hover:shadow-[0_6px_32px_rgba(0,200,255,0.4)] transition-all hover:-translate-y-1">🧠 Start New Scan</button>
      </div>
    </div>
  );
}

// ============================================================
// Main Scan Engine Component
// ============================================================
export function ScanEngine() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // --- Speech State ---
  const [isRecording, setIsRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [speechDone, setSpeechDone] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // --- Vision State ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [visionDone, setVisionDone] = useState(false);
  const [capturedFrame, setCapturedFrame] = useState<Blob | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // --- Memory State ---
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [memoryDone, setMemoryDone] = useState(false);
  const [memoryStartTime] = useState(Date.now());

  // --- Motor State ---
  const [tapCount, setTapCount] = useState(0);
  const [tapTimeLeft, setTapTimeLeft] = useState(10);
  const [isTapping, setIsTapping] = useState(false);
  const [rtState, setRtState] = useState<"idle" | "waiting" | "ready" | "done">("idle");
  const [rtStart, setRtStart] = useState(0);
  const [rtResult, setRtResult] = useState<number | null>(null);

  // --- Scanning Feedback State ---
  const [scanProgress, setScanProgress] = useState(0);
  const simulatedLandmarks = useMemo(() => 
    Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      x: 20 + Math.random() * 60,
      y: 15 + Math.random() * 70,
    })), []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setSpeechDone(true);
  }, []);

  // --- Recording Timer ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecSeconds((prev) => {
          if (prev >= 30) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, stopRecording]);

  // --- Fix camera visibility + cleanup ---
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [stream]);

  // --- Auto Capture Logic ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (stream && !capturedFrame && currentStep === 2) {
      setScanProgress(0);
      interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            handleCaptureFrame();
            clearInterval(interval);
            return 100;
          }
          return prev + 1.2; // 3-4 seconds
        });
      }, 50);
    } else if (capturedFrame) {
      setScanProgress(100);
    }
    return () => clearInterval(interval);
  }, [stream, capturedFrame, currentStep]);

  useEffect(() => {
    if (capturedFrame) setVisionDone(true);
  }, [capturedFrame]);

  // --- Tapping Timer ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTapping && tapTimeLeft > 0) {
      interval = setInterval(() => setTapTimeLeft((prev) => prev - 1), 1000);
    } else if (tapTimeLeft === 0) {
      setIsTapping(false);
    }
    return () => clearInterval(interval);
  }, [isTapping, tapTimeLeft]);

  // --- Analysis progress animation ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      setAnalysisProgress(0);
      interval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 95) return prev;
          return prev + Math.random() * 8 + 2;
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // ============================================================
  // Audio Recording (MediaRecorder API)
  // ============================================================
  const startRecording = useCallback(async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      const mediaRecorder = new MediaRecorder(audioStream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        audioStream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start(250); // chunk every 250ms
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecSeconds(0);
    } catch (err) {
      console.error("Mic access error:", err);
      alert("Microphone access is required for speech analysis. Please grant permission.");
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // ============================================================
  // Camera + Frame Capture
  // ============================================================
  const handleStartCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      setStream(mediaStream);
    } catch {
      alert("Camera access is required for facial analysis. Please ensure your browser has permission.");
    }
  };

  const handleCaptureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsCapturing(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) setCapturedFrame(blob);
        setIsCapturing(false);
      }, "image/jpeg", 0.85);
    }
  }, []);

  const handleStopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // ============================================================
  // Submit Scan to API
  // ============================================================
  const handleSubmitScan = async () => {
    handleStopCamera();
    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();

      // Build metadata
      const metadata: Omit<ScanPayload, "speech" | "vision"> & {
        speech: Omit<ScanPayload["speech"], "audioBlob">;
        vision: Omit<ScanPayload["vision"], "frameBlob">;
      } = {
        timestamp: new Date().toISOString(),
        speech: {
          recordedSeconds: recSeconds,
        },
        vision: {
          cameraEnabled: visionDone,
          frameCount: capturedFrame ? 1 : 0,
        },
        memory: {
          selectedDay,
          selectedWords,
          completionTimeSec: Math.round((Date.now() - memoryStartTime) / 1000),
        },
        motor: {
          tapCount,
          tapDurationSec: 10,
          reactionTimeMs: rtResult || 999,
        },
      };

      formData.append("metadata", JSON.stringify(metadata));

      // Attach audio blob if captured
      if (audioBlob) {
        formData.append("audio", audioBlob, "speech.webm");
      }

      // Attach video frame if captured
      if (capturedFrame) {
        formData.append("videoFrame", capturedFrame, "face.jpg");
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Analysis request failed");
      }

      const analysisResult: AnalysisResult = await response.json();
      setAnalysisProgress(100);

      // Small delay to show 100% progress
      await new Promise(r => setTimeout(r, 400));

      setResults(analysisResult);
      setCurrentStep(5);
    } catch (err: unknown) {
      console.error("Scan submission error:", err);
      setError(getErrorMessage(err, "Failed to analyze scan data. Please try again."));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setResults(null);
    setError(null);
    setIsRecording(false);
    setRecSeconds(0);
    setSpeechDone(false);
    setAudioBlob(null);
    setVisionDone(false);
    setCapturedFrame(null);
    setSelectedDay("");
    setSelectedWords([]);
    setMemoryDone(false);
    setTapCount(0);
    setTapTimeLeft(10);
    setIsTapping(false);
    setRtState("idle");
    setRtResult(null);
  };

  // ============================================================
  // Analyzing State
  // ============================================================
  if (isAnalyzing) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-8">
        <div className="relative">
          <div className="w-28 h-28 border-4 border-[#00c8ff]/20 rounded-full" />
          <div className="w-28 h-28 border-4 border-[#00c8ff] border-t-transparent rounded-full animate-spin absolute inset-0" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-[#00c8ff]">{Math.round(analysisProgress)}%</span>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-syne">Analyzing Cognitive Data...</h2>
          <div className="flex flex-col gap-1 text-sm text-[#5a7a99]">
            <span className={analysisProgress > 10 ? "text-[#00e5a0]" : ""}>
              {analysisProgress > 10 ? "✓" : "⏳"} Processing speech audio via Whisper...
            </span>
            <span className={analysisProgress > 30 ? "text-[#00e5a0]" : ""}>
              {analysisProgress > 30 ? "✓" : "⏳"} Extracting facial biomarkers via MediaPipe...
            </span>
            <span className={analysisProgress > 50 ? "text-[#00e5a0]" : ""}>
              {analysisProgress > 50 ? "✓" : "⏳"} Scoring memory & orientation tasks...
            </span>
            <span className={analysisProgress > 70 ? "text-[#00e5a0]" : ""}>
              {analysisProgress > 70 ? "✓" : "⏳"} Computing motor function metrics...
            </span>
            <span className={analysisProgress > 85 ? "text-[#00e5a0]" : ""}>
              {analysisProgress > 85 ? "✓" : "⏳"} Running multimodal fusion model...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // Error State
  // ============================================================
  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-8 rounded-2xl bg-red-500/5 border border-red-500/20 text-center space-y-4">
        <XCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-red-400">Analysis Failed</h2>
        <p className="text-[#a8c4d8]">{error}</p>
        <button onClick={handleReset} className="px-6 py-3 rounded-xl bg-[#0f1e2e] text-white font-semibold border border-[rgba(0,200,255,0.2)]">Try Again</button>
      </div>
    );
  }

  // ============================================================
  // Results State
  // ============================================================
  if (results) {
    return <ResultsView results={results} onReset={handleReset} />;
  }

  // ============================================================
  // Wizard Steps
  // ============================================================
  return (
    <div className="max-w-4xl mx-auto" id="scan">
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Step Indicator */}
      <div className="flex gap-2 mb-8 bg-[#0b1520] p-2 rounded-xl border border-[rgba(0,200,255,0.12)]">
        {["Speech", "Vision", "Memory", "Motor"].map((label, idx) => (
          <div key={label} className={cn(
            "flex-1 py-3 text-center rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all",
            currentStep === idx + 1 ? "bg-[#00c8ff]/10 text-white border border-[#00c8ff]/30" :
            currentStep > idx + 1 ? "text-[#00e5a0]" : "text-[#5a7a99]"
          )}>
            <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px]",
              currentStep > idx + 1 ? "bg-[#00e5a0]/20" : "bg-[#0f1e2e]"
            )}>
              {currentStep > idx + 1 ? "✓" : idx + 1}
            </span>
            {label}
          </div>
        ))}
      </div>

      {/* Step 1: Speech */}
      {currentStep === 1 && (
        <div className="space-y-6 text-center animate-in fade-in">
          <div className="p-6 rounded-xl bg-[#0f1e2e] text-[#a8c4d8]">
            <h3 className="font-bold text-white mb-2">Read the following passage aloud:</h3>
            <p className="italic text-lg leading-relaxed">&quot;The weather in the mountains can change very quickly. One moment the sun is shining brightly, and the next, dark clouds roll in from the west. Hikers must always be prepared for sudden storms, carrying rain gear and warm clothing even on the clearest days.&quot;</p>
          </div>

          <div className="space-y-3">
            <button onClick={toggleRecording} className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center mx-auto text-white transition-all",
              isRecording ? "bg-red-500 animate-pulse shadow-[0_0_30px_rgba(255,0,0,0.3)]" : "bg-gradient-to-br from-[#00c8ff] to-[#7b5fff] shadow-[0_0_20px_rgba(0,200,255,0.2)] hover:shadow-[0_0_30px_rgba(0,200,255,0.4)]"
            )}>
              {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
            <p className="text-sm text-[#5a7a99]">
              {isRecording ? `Recording... ${recSeconds}s / 30s` :
               audioBlob ? `✓ Audio captured (${recSeconds}s)` :
               "Tap to start recording"}
            </p>
            {/* Audio playback if recorded */}
            {audioBlob && !isRecording && (
              <audio controls src={URL.createObjectURL(audioBlob)} className="mx-auto mt-2 h-8" />
            )}
          </div>

          <div className="flex justify-end pt-4">
            <button onClick={() => setCurrentStep(2)} disabled={!speechDone} className="px-6 py-3 rounded-xl bg-[#00c8ff] text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-[0_0_16px_rgba(0,200,255,0.3)]">
              Next: Vision →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Vision */}
      {currentStep === 2 && (
        <div className="space-y-6 text-center animate-in fade-in">
          <p className="text-[#a8c4d8] mb-2">Enable your camera so we can analyze facial micro-expressions and gaze patterns.</p>

          <div className="h-[400px] bg-[#0b1520] rounded-2xl flex items-center justify-center border-2 border-[rgba(0,200,255,0.12)] overflow-hidden relative shadow-2xl">
            {stream ? (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="absolute inset-0 w-full h-full object-cover grayscale-[0.3] contrast-125" 
                />
                
                {/* Futurist Scanning Effects */}
                <AnimatePresence>
                  {!capturedFrame && (
                    <motion.div 
                      key="scanning-overlay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 pointer-events-none"
                    >
                      {/* Scanning Beam */}
                      <motion.div 
                        animate={{ top: ["5%", "95%", "5%"] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00c8ff] to-transparent z-20 shadow-[0_0_15px_rgba(0,200,255,0.8)]"
                      />

                      {/* Landmarks */}
                      {simulatedLandmarks.map((point) => (
                        <motion.div
                          key={point.id}
                          style={{ left: `${point.x}%`, top: `${point.y}%` }}
                          animate={{ 
                            opacity: [0.2, 0.8, 0.2],
                            scale: [1, 1.2, 1]
                          }}
                          transition={{ 
                            duration: 2 + Math.random() * 2, 
                            repeat: Infinity,
                            delay: Math.random() * 2
                          }}
                          className="absolute w-1 h-1 bg-[#00c8ff] rounded-full z-10"
                        />
                      ))}

                      {/* HUD Text */}
                      <div className="absolute top-4 left-4 font-mono text-[10px] text-[#00c8ff]/60 text-left space-y-1">
                        <div>ANALYZING_FACIAL_TOPOLOGY...</div>
                        <div>GAZE_STABILITY: CALIBRATING</div>
                        <div>BIOMARKER_EXTRACTION: {Math.round(scanProgress)}%</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Scan Progress Bar (HUD style) */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0f1e2e] z-30">
                   <motion.div 
                     className="h-full bg-[#00c8ff] shadow-[0_0_20px_rgba(0,200,255,0.6)]"
                     initial={{ width: "0%" }}
                     animate={{ width: `${scanProgress}%` }}
                   />
                </div>

                {/* Success Overlay */}
                <AnimatePresence>
                  {capturedFrame && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute inset-0 bg-[#00e5a0]/10 flex flex-col items-center justify-center backdrop-blur-[2px] z-40"
                    >
                      <div className="bg-[#0b1520]/90 border border-[#00e5a0]/30 p-4 rounded-2xl flex flex-col items-center gap-2 shadow-2xl">
                         <div className="w-12 h-12 rounded-full bg-[#00e5a0]/20 flex items-center justify-center">
                            <CheckCircle2 className="w-6 h-6 text-[#00e5a0]" />
                         </div>
                         <h4 className="font-bold text-[#00e5a0]">Facial Map Captured</h4>
                         <button onClick={() => { setCapturedFrame(null); setVisionDone(false); }} className="text-xs text-[#a8c4d8] hover:text-white underline mt-1">Retake Analysis</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#00c8ff]/10 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-[#00c8ff]" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold">Camera Access Required</h4>
                  <p className="text-xs text-[#5a7a99] max-w-[240px]">Facial micro-expression markers are critical for detecting early cognitive biomarkers.</p>
                </div>
                <button onClick={handleStartCamera} className="mt-2 px-8 py-3 bg-[#00c8ff] text-black font-bold rounded-xl flex items-center gap-2 hover:shadow-[0_0_20px_rgba(0,200,255,0.4)] transition-all">
                  <Video className="w-5 h-5" /> Enable Vision Sensor
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={() => { handleStopCamera(); setCurrentStep(1); }} className="px-6 py-3 rounded-xl bg-[#0f1e2e] text-white border border-[rgba(0,200,255,0.1)] hover:bg-[#0f1e2e]/80">← Back</button>
            <button onClick={() => setCurrentStep(3)} disabled={!visionDone} className="px-8 py-3 rounded-xl bg-[#00c8ff] text-black font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:shadow-[0_0_20px_rgba(0,200,255,0.3)]">Next: Memory Assessment →</button>
          </div>
        </div>
      )}

      {/* Step 3: Memory */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-6 bg-[#0b1520] rounded-2xl border border-[rgba(0,200,255,0.12)]">
            <h4 className="font-bold mb-2">Temporal Orientation</h4>
            <p className="text-sm text-[#5a7a99] mb-4">What day of the week is it today?</p>
            <div className="flex flex-wrap gap-2">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(d => (
                <button key={d} onClick={() => setSelectedDay(d)} className={cn(
                  "px-4 py-2 rounded-full border transition-all",
                  selectedDay === d ? "border-[#00c8ff] text-[#00c8ff] bg-[#00c8ff]/10" : "border-[#5a7a99]/30 text-[#a8c4d8] hover:border-[#5a7a99]"
                )}>{d}</button>
              ))}
            </div>
          </div>

          <div className="p-6 bg-[#0b1520] rounded-2xl border border-[rgba(0,200,255,0.12)]">
            <h4 className="font-bold mb-2">Delayed Word Recall</h4>
            <p className="text-sm text-[#5a7a99] mb-4">Select the 3 words that were shown to you at the beginning of the session:</p>
            <div className="flex flex-wrap gap-2">
              {["APPLE", "RIVER", "PENCIL", "CLOCK", "MOUNTAIN", "CHAIR", "GARDEN", "BRIDGE"].map(w => (
                <button key={w} onClick={() => {
                  setSelectedWords(p => p.includes(w) ? p.filter(x => x !== w) : [...p, w]);
                  setMemoryDone(true);
                }} className={cn(
                  "px-4 py-2 rounded-full border transition-all",
                  selectedWords.includes(w) ? "border-[#00c8ff] text-[#00c8ff] bg-[#00c8ff]/10" : "border-[#5a7a99]/30 text-[#a8c4d8] hover:border-[#5a7a99]"
                )}>{w}</button>
              ))}
            </div>
            <p className="text-xs text-[#5a7a99] mt-3">Selected: {selectedWords.length} words</p>
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={() => setCurrentStep(2)} className="px-6 py-3 rounded-xl bg-[#0f1e2e] text-white border border-[rgba(0,200,255,0.1)]">← Back</button>
            <button onClick={() => setCurrentStep(4)} disabled={!memoryDone || !selectedDay} className="px-6 py-3 rounded-xl bg-[#00c8ff] text-black font-bold disabled:opacity-50 transition-all hover:shadow-[0_0_16px_rgba(0,200,255,0.3)]">Next: Motor →</button>
          </div>
        </div>
      )}

      {/* Step 4: Motor */}
      {currentStep === 4 && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 bg-[#0b1520] rounded-2xl border border-[rgba(0,200,255,0.12)] text-center">
              <h4 className="font-bold mb-1">Rapid Finger Tapping</h4>
              <p className="text-xs text-[#5a7a99] mb-3">Tap as fast as you can for 10 seconds</p>
              <div
                onClick={() => {
                  if (!isTapping && tapTimeLeft === 10) setIsTapping(true);
                  if (isTapping && tapTimeLeft > 0) setTapCount(p => p + 1);
                }}
                className={cn(
                  "h-36 flex flex-col justify-center items-center border-2 rounded-xl cursor-pointer select-none transition-all",
                  isTapping ? "border-[#00c8ff] bg-[#00c8ff]/5" : tapTimeLeft === 0 ? "border-[#00e5a0] bg-[#00e5a0]/5" : "border-dashed border-[#5a7a99]"
                )}
              >
                <span className={cn("text-5xl font-black", tapTimeLeft === 0 ? "text-[#00e5a0]" : "text-[#00c8ff]")}>{tapCount}</span>
                <span className="text-xs text-[#a8c4d8] mt-1">
                  {isTapping ? `${tapTimeLeft}s remaining` : tapTimeLeft === 0 ? `✓ Done — ${tapCount} taps` : "Tap here to start"}
                </span>
              </div>
            </div>

            <div className="p-6 bg-[#0b1520] rounded-2xl border border-[rgba(0,200,255,0.12)] text-center">
              <h4 className="font-bold mb-1">Reaction Time</h4>
              <p className="text-xs text-[#5a7a99] mb-3">Click when the screen turns green</p>
              <div
                onClick={() => {
                  if (rtState === "idle") {
                    setRtState("waiting");
                    setTimeout(() => { setRtState("ready"); setRtStart(performance.now()); }, 1500 + Math.random() * 2000);
                  } else if (rtState === "ready") {
                    setRtResult(Math.round(performance.now() - rtStart));
                    setRtState("done");
                  }
                }}
                className={cn(
                  "h-36 flex flex-col items-center justify-center rounded-xl cursor-pointer font-bold select-none transition-all",
                  rtState === "idle" ? "bg-[#0f1e2e] text-[#a8c4d8]" :
                  rtState === "waiting" ? "bg-red-500/20 text-red-400" :
                  rtState === "ready" ? "bg-[#00e5a0]/30 text-[#00e5a0] animate-pulse" :
                  "bg-[#00c8ff]/20 text-[#00c8ff]"
                )}
              >
                <span className="text-2xl">
                  {rtState === "idle" && "Click to Start"}
                  {rtState === "waiting" && "Wait..."}
                  {rtState === "ready" && "TAP NOW!"}
                  {rtState === "done" && `${rtResult}ms`}
                </span>
                {rtState === "done" && <span className="text-xs mt-1 text-[#5a7a99]">✓ Reaction captured</span>}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={() => setCurrentStep(3)} className="px-6 py-3 rounded-xl bg-[#0f1e2e] text-white border border-[rgba(0,200,255,0.1)]">← Back</button>
            <button
              onClick={handleSubmitScan}
              disabled={tapTimeLeft > 0 || rtState !== "done"}
              className="px-8 py-3 bg-gradient-to-r from-[#00c8ff] to-[#7b5fff] text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-[0_6px_32px_rgba(0,200,255,0.4)] hover:-translate-y-0.5"
            >
              🧠 Analyze Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
