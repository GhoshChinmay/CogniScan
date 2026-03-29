// ============================================================
// POST /api/patients
// GET  /api/patients
// Mock patient management endpoint
// In production: PostgreSQL via Prisma/Drizzle
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import type { Patient, ScanRecord } from "@/lib/types";
import { getErrorMessage } from "@/lib/utils";

// In-memory mock database (replaced by PostgreSQL in production)
const mockPatients: Patient[] = [
  {
    id: "p_001",
    name: "Eleanor Vance",
    age: 72,
    email: "eleanor@example.com",
    phone: "+1-555-0101",
    caregiverName: "James Vance",
    caregiverPhone: "+1-555-0102",
    createdAt: "2026-01-15T10:30:00Z",
  },
  {
    id: "p_002",
    name: "Robert Chen",
    age: 68,
    email: "robert.chen@example.com",
    phone: "+1-555-0201",
    caregiverName: "Lisa Chen",
    caregiverPhone: "+1-555-0202",
    createdAt: "2026-02-03T14:15:00Z",
  },
  {
    id: "p_003",
    name: "Margaret Okafor",
    age: 75,
    email: "margaret.o@example.com",
    phone: "+1-555-0301",
    caregiverName: "David Okafor",
    caregiverPhone: "+1-555-0302",
    createdAt: "2026-03-10T09:00:00Z",
  },
];

const mockScans: ScanRecord[] = [
  {
    scanId: "scan_001", patientId: "p_001", timestamp: "2026-03-20T14:00:00Z",
    overallScore: 78, overallGrade: "mild",
    categories: {
      speech: { name: "Speech", score: 82, maxScore: 100, grade: "normal", details: "", indicators: [] },
      vision: { name: "Vision", score: 74, maxScore: 100, grade: "mild", details: "", indicators: [] },
      memory: { name: "Memory", score: 70, maxScore: 100, grade: "mild", details: "", indicators: [] },
      motor: { name: "Motor", score: 85, maxScore: 100, grade: "normal", details: "", indicators: [] },
    },
    riskFlags: [{ severity: "medium", category: "Memory", message: "Mild memory recall deficit" }],
  },
  {
    scanId: "scan_002", patientId: "p_001", timestamp: "2026-03-25T10:00:00Z",
    overallScore: 72, overallGrade: "mild",
    categories: {
      speech: { name: "Speech", score: 78, maxScore: 100, grade: "mild", details: "", indicators: [] },
      vision: { name: "Vision", score: 70, maxScore: 100, grade: "mild", details: "", indicators: [] },
      memory: { name: "Memory", score: 65, maxScore: 100, grade: "mild", details: "", indicators: [] },
      motor: { name: "Motor", score: 80, maxScore: 100, grade: "normal", details: "", indicators: [] },
    },
    riskFlags: [{ severity: "medium", category: "Memory", message: "Progressive memory decline trend" }],
  },
  {
    scanId: "scan_003", patientId: "p_002", timestamp: "2026-03-22T16:30:00Z",
    overallScore: 88, overallGrade: "normal",
    categories: {
      speech: { name: "Speech", score: 90, maxScore: 100, grade: "normal", details: "", indicators: [] },
      vision: { name: "Vision", score: 85, maxScore: 100, grade: "normal", details: "", indicators: [] },
      memory: { name: "Memory", score: 88, maxScore: 100, grade: "normal", details: "", indicators: [] },
      motor: { name: "Motor", score: 92, maxScore: 100, grade: "normal", details: "", indicators: [] },
    },
    riskFlags: [],
  },
  {
    scanId: "scan_004", patientId: "p_003", timestamp: "2026-03-18T11:00:00Z",
    overallScore: 45, overallGrade: "moderate",
    categories: {
      speech: { name: "Speech", score: 48, maxScore: 100, grade: "moderate", details: "", indicators: [] },
      vision: { name: "Vision", score: 42, maxScore: 100, grade: "moderate", details: "", indicators: [] },
      memory: { name: "Memory", score: 38, maxScore: 100, grade: "severe", details: "", indicators: [] },
      motor: { name: "Motor", score: 55, maxScore: 100, grade: "mild", details: "", indicators: [] },
    },
    riskFlags: [
      { severity: "critical", category: "Memory", message: "Severe memory impairment" },
      { severity: "high", category: "Overall", message: "Multi-domain decline — referral needed" },
    ],
  },
];

export async function GET() {
  // Return patients with their scan history
  const patientsWithScans = mockPatients.map(p => ({
    ...p,
    scans: mockScans.filter(s => s.patientId === p.id),
    latestScore: mockScans
      .filter(s => s.patientId === p.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]?.overallScore ?? null,
  }));

  return NextResponse.json({ patients: patientsWithScans });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newPatient: Patient = {
      id: `p_${Date.now()}`,
      name: body.name,
      age: body.age,
      email: body.email,
      phone: body.phone,
      caregiverName: body.caregiverName,
      caregiverPhone: body.caregiverPhone,
      createdAt: new Date().toISOString(),
    };
    mockPatients.push(newPatient);
    return NextResponse.json(newPatient, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error, "Unable to create patient") }, { status: 400 });
  }
}
