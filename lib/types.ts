// ============================================================
// CogniScan — Shared TypeScript Types
// ============================================================

// --- Scan Submission Payload ---
export interface SpeechData {
  recordedSeconds: number;
  /** base64-encoded audio blob (webm/opus) */
  audioBlob?: string;
  /** Transcript text (populated by backend after Whisper) */
  transcript?: string;
}

export interface VisionData {
  cameraEnabled: boolean;
  /** base64-encoded video frame (jpeg) captured from webcam */
  frameBlob?: string;
  /** Number of frames captured during session */
  frameCount?: number;
}

export interface MemoryData {
  selectedDay: string;
  selectedWords: string[];
  /** Time taken to complete memory tasks in seconds */
  completionTimeSec?: number;
}

export interface MotorData {
  tapCount: number;
  tapDurationSec: number;
  reactionTimeMs: number;
}

export interface ScanPayload {
  patientId?: string;
  timestamp: string;
  speech: SpeechData;
  vision: VisionData;
  memory: MemoryData;
  motor: MotorData;
}

// --- Analysis Response ---
export interface CategoryScore {
  name: string;
  score: number;       // 0-100
  maxScore: number;
  grade: "normal" | "mild" | "moderate" | "severe";
  details: string;
  indicators: string[];
}

export interface RiskFlag {
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  message: string;
}

export interface AnalysisResult {
  scanId: string;
  timestamp: string;
  overallScore: number;    // 0-100
  overallGrade: "normal" | "mild" | "moderate" | "severe";
  categories: {
    speech: CategoryScore;
    vision: CategoryScore;
    memory: CategoryScore;
    motor: CategoryScore;
  };
  riskFlags: RiskFlag[];
  recommendation: string;
  processingTimeMs: number;
}

// --- Patient / Dashboard Types ---
export interface Patient {
  id: string;
  name: string;
  age: number;
  email?: string;
  phone?: string;
  caregiverName?: string;
  caregiverPhone?: string;
  createdAt: string;
}

export interface ScanRecord {
  scanId: string;
  patientId: string;
  timestamp: string;
  overallScore: number;
  overallGrade: string;
  categories: AnalysisResult["categories"];
  riskFlags: RiskFlag[];
}

export interface AlertConfig {
  id: string;
  patientId: string;
  type: "sms" | "email" | "push";
  destination: string;
  threshold: number;  // Score below which alert fires
  enabled: boolean;
}
