// ============================================================
// POST /api/analyze
// Main scan analysis endpoint — accepts multipart form data
// with audio blob, video frame, and structured scan data.
//
// In production, this would proxy to FastAPI backend which runs:
//   - Whisper transcription
//   - Librosa feature extraction
//   - MediaPipe Face Mesh
//   - DeepFace emotion classification
//   - scikit-learn scoring fusion
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { runMockAnalysis } from "@/lib/mock-ai";
import type { ScanPayload } from "@/lib/types";
import { getErrorMessage } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let payload: ScanPayload;

    if (contentType.includes("multipart/form-data")) {
      // Handle multipart form data (audio/video blobs + JSON metadata)
      const formData = await request.formData();

      const metadataStr = formData.get("metadata") as string;
      if (!metadataStr) {
        return NextResponse.json(
          { error: "Missing 'metadata' field in form data" },
          { status: 400 }
        );
      }

      const metadata = JSON.parse(metadataStr);

      // Extract audio blob if present
      const audioFile = formData.get("audio") as File | null;
      let audioBase64: string | undefined;
      if (audioFile) {
        const buffer = await audioFile.arrayBuffer();
        audioBase64 = Buffer.from(buffer).toString("base64");
      }

      // Extract video frame if present
      const videoFrame = formData.get("videoFrame") as File | null;
      let frameBase64: string | undefined;
      if (videoFrame) {
        const buffer = await videoFrame.arrayBuffer();
        frameBase64 = Buffer.from(buffer).toString("base64");
      }

      payload = {
        ...metadata,
        speech: {
          ...metadata.speech,
          audioBlob: audioBase64,
        },
        vision: {
          ...metadata.vision,
          frameBlob: frameBase64,
        },
      };
    } else {
      // Handle plain JSON payload (no media blobs)
      payload = await request.json();
    }

    // Validate required fields
    if (!payload.speech || !payload.vision || !payload.memory || !payload.motor) {
      return NextResponse.json(
        { error: "Incomplete scan data. Missing one or more required categories." },
        { status: 400 }
      );
    }

    // Simulate processing delay (like real ML inference)
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    // Run mock AI analysis
    const result = runMockAnalysis(payload);

    // In production: save to PostgreSQL, trigger alerts if needed
    // await db.scans.create({ data: result });
    // await alertEngine.checkThresholds(result);

    return NextResponse.json(result, { status: 200 });

  } catch (error: unknown) {
    console.error("[/api/analyze] Error:", error);
    return NextResponse.json(
      { error: "Analysis failed", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "CogniScan Analysis Engine",
    version: "1.0.0-mock",
    capabilities: [
      "speech-analysis (mock: Whisper + Librosa)",
      "facial-analysis (mock: MediaPipe + DeepFace)",
      "memory-assessment (rule-based)",
      "motor-assessment (rule-based)",
      "multimodal-fusion (weighted ensemble)",
    ],
  });
}
