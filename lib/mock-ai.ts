// ============================================================
// CogniScan — Mock AI Scoring Engine
//
// This module simulates the AI/ML analysis pipeline that would
// eventually be powered by:
//   - Whisper (speech transcription)
//   - Librosa (acoustic features: MFCCs, pitch, pause rate)
//   - wav2vec2 (speech embeddings)
//   - MediaPipe Face Mesh + DeepFace (facial biomarkers)
//   - scikit-learn (cognitive scoring fusion)
//
// For now, it uses rule-based heuristics on the raw scan data
// to produce clinically-inspired mock scores.
// ============================================================

import type {
  ScanPayload,
  AnalysisResult,
  CategoryScore,
  RiskFlag,
} from "@/lib/types";

const EXPECTED_WORDS = ["APPLE", "RIVER", "PENCIL"];
const CORRECT_DAY = new Date().toLocaleDateString("en-US", { weekday: "long" });

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

function gradeFromScore(score: number): CategoryScore["grade"] {
  if (score >= 80) return "normal";
  if (score >= 60) return "mild";
  if (score >= 40) return "moderate";
  return "severe";
}

// --- Speech Analysis (Mock Whisper + Librosa) ---
function analyzeSpeech(data: ScanPayload["speech"]): CategoryScore {
  const hasAudio = !!data.audioBlob;
  const duration = data.recordedSeconds;

  // Simulate: longer recordings → more data → better analysis
  let score = 50;
  if (hasAudio) score += 15;
  if (duration >= 10) score += 10;
  if (duration >= 20) score += 10;
  if (duration >= 25) score += 5;

  // Add some gaussian-like noise to simulate ML variance
  score += Math.round((Math.random() - 0.5) * 10);
  score = clamp(score, 20, 98);

  const indicators: string[] = [];
  if (duration < 10) indicators.push("Very short speech sample — may lack sufficient prosodic data");
  if (!hasAudio) indicators.push("No audio blob captured — acoustic analysis unavailable");
  if (score < 60) indicators.push("Possible speech disfluency patterns detected");
  if (score >= 80) indicators.push("Speech fluency and prosody within normal parameters");

  return {
    name: "Speech Analysis",
    score,
    maxScore: 100,
    grade: gradeFromScore(score),
    details: hasAudio
      ? `Analyzed ${duration}s of speech audio. Simulated MFCC extraction, pitch contour analysis, and pause-rate computation.`
      : `Text-only analysis based on ${duration}s recording duration. Acoustic features unavailable.`,
    indicators,
  };
}

// --- Vision Analysis (Mock MediaPipe + DeepFace) ---
function analyzeVision(data: ScanPayload["vision"]): CategoryScore {
  const hasFrame = !!data.frameBlob;
  const cameraOn = data.cameraEnabled;

  let score = 40;
  if (cameraOn) score += 20;
  if (hasFrame) score += 20;

  // Mock: simulate facial landmark analysis
  const gazeVariance = Math.random() * 5 + 1; // 1-6 degrees
  const blinkRate = Math.round(Math.random() * 20 + 8); // 8-28 blinks/min
  const emotionConfidence = Math.round(Math.random() * 40 + 60); // 60-100%

  if (gazeVariance < 3) score += 10;
  if (blinkRate >= 12 && blinkRate <= 20) score += 5;
  score += Math.round((Math.random() - 0.5) * 8);
  score = clamp(score, 15, 97);

  const indicators: string[] = [];
  if (!cameraOn) indicators.push("Camera not enabled — facial analysis skipped");
  if (hasFrame) {
    indicators.push(`Gaze stability: ${gazeVariance.toFixed(1)}° variance`);
    indicators.push(`Blink rate: ${blinkRate} blinks/min`);
    indicators.push(`Emotion detection confidence: ${emotionConfidence}%`);
  }
  if (score >= 80) indicators.push("Facial biomarkers within normal range");
  if (score < 50) indicators.push("Reduced facial expressivity detected");

  return {
    name: "Facial Analysis",
    score,
    maxScore: 100,
    grade: gradeFromScore(score),
    details: hasFrame
      ? `Processed webcam frame. Simulated 468-landmark Face Mesh extraction, blink tracking, and emotion classification via DeepFace.`
      : `No facial data captured. Vision module inactive.`,
    indicators,
  };
}

// --- Memory Analysis (Rule-based scoring) ---
function analyzeMemory(data: ScanPayload["memory"]): CategoryScore {
  const correctWords = data.selectedWords.filter(w => EXPECTED_WORDS.includes(w));
  const incorrectWords = data.selectedWords.filter(w => !EXPECTED_WORDS.includes(w));
  const dayCorrect = data.selectedDay.toLowerCase() === CORRECT_DAY.toLowerCase();

  let score = 0;
  // Word recall: 25 points each (max 75)
  score += correctWords.length * 25;
  // Penalty for false positives: -10 each
  score -= incorrectWords.length * 10;
  // Day orientation: 25 points
  if (dayCorrect) score += 25;
  else score += 5; // partial credit for attempting

  score += Math.round((Math.random() - 0.5) * 6);
  score = clamp(score, 5, 100);

  const indicators: string[] = [];
  indicators.push(`Word recall: ${correctWords.length}/${EXPECTED_WORDS.length} correct`);
  if (incorrectWords.length > 0) indicators.push(`False positives: ${incorrectWords.length} incorrect words selected`);
  indicators.push(`Orientation (day): ${dayCorrect ? "Correct" : "Incorrect"} (selected "${data.selectedDay}", expected "${CORRECT_DAY}")`);
  if (score < 50) indicators.push("Significant memory recall impairment indicated");

  return {
    name: "Memory & Orientation",
    score,
    maxScore: 100,
    grade: gradeFromScore(score),
    details: `Assessed delayed recall of ${EXPECTED_WORDS.length} target words and temporal orientation. Scoring based on MoCA-inspired rubric.`,
    indicators,
  };
}

// --- Motor Analysis (Tapping + Reaction Time) ---
function analyzeMotor(data: ScanPayload["motor"]): CategoryScore {
  const { tapCount, tapDurationSec, reactionTimeMs } = data;
  const tapsPerSecond = tapDurationSec > 0 ? tapCount / tapDurationSec : 0;

  let score = 0;

  // Tapping speed: healthy adults average 5-7 taps/sec
  if (tapsPerSecond >= 6) score += 40;
  else if (tapsPerSecond >= 4) score += 30;
  else if (tapsPerSecond >= 2) score += 20;
  else score += 10;

  // Reaction time: healthy adults 200-300ms
  if (reactionTimeMs <= 250) score += 40;
  else if (reactionTimeMs <= 350) score += 30;
  else if (reactionTimeMs <= 500) score += 20;
  else score += 10;

  // Consistency bonus
  if (tapsPerSecond >= 4 && reactionTimeMs <= 400) score += 15;

  score += Math.round((Math.random() - 0.5) * 6);
  score = clamp(score, 10, 98);

  const indicators: string[] = [];
  indicators.push(`Tapping rate: ${tapsPerSecond.toFixed(1)} taps/sec (${tapCount} in ${tapDurationSec}s)`);
  indicators.push(`Reaction time: ${reactionTimeMs}ms`);
  if (tapsPerSecond < 3) indicators.push("Reduced motor speed — potential fine motor impairment");
  if (reactionTimeMs > 500) indicators.push("Elevated reaction time — monitor psychomotor processing speed");
  if (score >= 80) indicators.push("Motor function within expected parameters");

  return {
    name: "Motor Function",
    score,
    maxScore: 100,
    grade: gradeFromScore(score),
    details: `Rapid alternating tapping and simple reaction time assessment. Compared against age-adjusted normative data.`,
    indicators,
  };
}

// --- Risk Flag Generation ---
function generateRiskFlags(categories: AnalysisResult["categories"]): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const cats = Object.values(categories);

  for (const cat of cats) {
    if (cat.grade === "severe") {
      flags.push({ severity: "critical", category: cat.name, message: `${cat.name}: Severe impairment detected (score: ${cat.score}/100)` });
    } else if (cat.grade === "moderate") {
      flags.push({ severity: "high", category: cat.name, message: `${cat.name}: Moderate deficit detected (score: ${cat.score}/100)` });
    } else if (cat.grade === "mild") {
      flags.push({ severity: "medium", category: cat.name, message: `${cat.name}: Mild concern observed (score: ${cat.score}/100)` });
    }
  }

  const avgScore = cats.reduce((s, c) => s + c.score, 0) / cats.length;
  if (avgScore < 50) {
    flags.push({ severity: "critical", category: "Overall", message: "Multi-domain cognitive decline detected. Clinical referral strongly recommended." });
  }

  return flags;
}

// --- Main Analysis Orchestrator ---
export function runMockAnalysis(payload: ScanPayload): AnalysisResult {
  const startTime = performance.now();

  const speech = analyzeSpeech(payload.speech);
  const vision = analyzeVision(payload.vision);
  const memory = analyzeMemory(payload.memory);
  const motor = analyzeMotor(payload.motor);

  const categories = { speech, vision, memory, motor };

  // Weighted overall score: speech 30%, vision 15%, memory 35%, motor 20%
  const overallScore = Math.round(
    speech.score * 0.30 +
    vision.score * 0.15 +
    memory.score * 0.35 +
    motor.score * 0.20
  );

  const riskFlags = generateRiskFlags(categories);

  let recommendation = "";
  if (overallScore >= 80) recommendation = "Cognitive function appears within normal limits. Recommend routine annual screening.";
  else if (overallScore >= 60) recommendation = "Mild cognitive concerns noted. Consider follow-up assessment in 3-6 months and lifestyle interventions.";
  else if (overallScore >= 40) recommendation = "Moderate cognitive decline indicators present. Clinical referral recommended for comprehensive neuropsychological evaluation.";
  else recommendation = "Significant cognitive impairment detected across multiple domains. Urgent clinical referral and comprehensive neurological workup strongly recommended.";

  return {
    scanId: `scan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    overallScore: clamp(overallScore, 5, 100),
    overallGrade: gradeFromScore(overallScore),
    categories,
    riskFlags,
    recommendation,
    processingTimeMs: Math.round(performance.now() - startTime),
  };
}
