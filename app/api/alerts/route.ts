// ============================================================
// POST /api/alerts
// GET  /api/alerts
// Mock alert engine — simulates Twilio SMS, Firebase Push,
// and SendGrid email notifications
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import type { AlertConfig } from "@/lib/types";
import { getErrorMessage } from "@/lib/utils";

const mockAlerts: AlertConfig[] = [
  { id: "a_001", patientId: "p_001", type: "sms", destination: "+1-555-0102", threshold: 60, enabled: true },
  { id: "a_002", patientId: "p_001", type: "email", destination: "james.vance@example.com", threshold: 50, enabled: true },
  { id: "a_003", patientId: "p_003", type: "sms", destination: "+1-555-0302", threshold: 55, enabled: true },
  { id: "a_004", patientId: "p_003", type: "push", destination: "device_token_xyz", threshold: 45, enabled: false },
];

// Simulated alert log
const sentAlerts: Array<{ alertId: string; triggeredAt: string; score: number; message: string }> = [
  { alertId: "a_003", triggeredAt: "2026-03-18T11:05:00Z", score: 45, message: "⚠️ CogniScan Alert: Margaret Okafor scored 45/100. Multi-domain decline detected. Please schedule a clinical follow-up." },
];

export async function GET() {
  return NextResponse.json({
    alerts: mockAlerts,
    sentHistory: sentAlerts,
    providers: {
      sms: { provider: "Twilio", status: "mock" },
      email: { provider: "SendGrid", status: "mock" },
      push: { provider: "Firebase Cloud Messaging", status: "mock" },
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === "trigger") {
      // Simulate sending an alert
      const alert = mockAlerts.find(a => a.id === body.alertId);
      if (!alert) {
        return NextResponse.json({ error: "Alert config not found" }, { status: 404 });
      }

      const logEntry = {
        alertId: alert.id,
        triggeredAt: new Date().toISOString(),
        score: body.score ?? 0,
        message: `⚠️ CogniScan Alert via ${alert.type.toUpperCase()}: Patient score ${body.score}/100 is below threshold ${alert.threshold}. Immediate attention recommended.`,
      };

      sentAlerts.push(logEntry);

      // In production:
      // if (alert.type === 'sms') await twilioClient.messages.create(...)
      // if (alert.type === 'email') await sgMail.send(...)
      // if (alert.type === 'push') await admin.messaging().send(...)

      return NextResponse.json({
        success: true,
        provider: alert.type === "sms" ? "Twilio" : alert.type === "email" ? "SendGrid" : "Firebase",
        mock: true,
        logEntry,
      });
    }

    // Create new alert configuration
    const newAlert: AlertConfig = {
      id: `a_${Date.now()}`,
      patientId: body.patientId,
      type: body.type,
      destination: body.destination,
      threshold: body.threshold ?? 60,
      enabled: body.enabled ?? true,
    };

    mockAlerts.push(newAlert);
    return NextResponse.json(newAlert, { status: 201 });

  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error, "Unable to save alert configuration") }, { status: 400 });
  }
}
