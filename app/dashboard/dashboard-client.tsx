"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Brain, Users, Activity, AlertTriangle, TrendingUp, TrendingDown,
  Bell, ChevronRight, ArrowLeft, Shield,
  BarChart3, Clock, Phone, Mail, MessageSquare, Home
} from "lucide-react";
import Link from "next/link";

import { MagicCard } from "@/components/ui/magic-card";

// ============================================================
// Types (mirrors API response shapes)
// ============================================================
interface PatientScan {
  scanId: string;
  patientId: string;
  timestamp: string;
  overallScore: number;
  overallGrade: string;
  categories: Record<string, { name: string; score: number; maxScore: number; grade: string }>;
  riskFlags: Array<{ severity: string; category: string; message: string }>;
}

interface PatientData {
  id: string;
  name: string;
  age: number;
  email?: string;
  phone?: string;
  caregiverName?: string;
  caregiverPhone?: string;
  createdAt: string;
  scans: PatientScan[];
  latestScore: number | null;
}

interface AlertData {
  id: string;
  patientId: string;
  type: "sms" | "email" | "push";
  destination: string;
  threshold: number;
  enabled: boolean;
}

interface AlertHistoryEntry {
  alertId: string;
  triggeredAt: string;
  score: number;
  message: string;
}

// ============================================================
// Helper Components
// ============================================================
function ScoreBadge({ score, size = "sm" }: { score: number; size?: "sm" | "lg" }) {
  const color = score >= 80 ? "text-[#00e5a0] bg-[#00e5a0]/10 border-[#00e5a0]/30" :
                score >= 60 ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" :
                score >= 40 ? "text-orange-400 bg-orange-400/10 border-orange-400/30" :
                "text-red-400 bg-red-400/10 border-red-400/30";
  return (
    <span className={cn("font-black rounded-lg border inline-flex items-center justify-center", color,
      size === "lg" ? "text-3xl px-4 py-2" : "text-sm px-2 py-0.5"
    )}>{score}</span>
  );
}

function GradeLabel({ grade }: { grade: string }) {
  const styles: Record<string, string> = {
    normal: "text-[#00e5a0]",
    mild: "text-yellow-400",
    moderate: "text-orange-400",
    severe: "text-red-400",
  };
  const labels: Record<string, string> = {
    normal: "Normal",
    mild: "Mild",
    moderate: "Moderate",
    severe: "Severe",
  };
  return <span className={cn("text-xs font-semibold uppercase tracking-wider", styles[grade] || "text-[#5a7a99]")}>{labels[grade] || grade}</span>;
}

function StatCard({ icon, label, value, trend }: { icon: React.ReactNode; label: string; value: string | number; trend?: "up" | "down" | null }) {
  return (
    <MagicCard
      className="p-5 border-[rgba(0,200,255,0.12)] bg-[#0b1520]/80"
      gradientColor="rgba(0, 200, 255, 0.15)"
      gradientSize={150}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-[#00c8ff]/10 text-[#00c8ff]">{icon}</div>
        <span className="text-sm text-[#5a7a99]">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-2xl font-black">{value}</span>
        {trend === "up" && <TrendingUp className="w-4 h-4 text-[#00e5a0]" />}
        {trend === "down" && <TrendingDown className="w-4 h-4 text-red-400" />}
      </div>
    </MagicCard>
  );
}

// ============================================================
// Main Dashboard Client
// ============================================================
export function DashboardClient() {
  const [patients, setPatients] = useState<PatientData[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [sentHistory, setSentHistory] = useState<AlertHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [activeTab, setActiveTab] = useState<"patients" | "alerts">("patients");

  useEffect(() => {
    async function fetchData() {
      try {
        const [pRes, aRes] = await Promise.all([
          fetch("/api/patients"),
          fetch("/api/alerts"),
        ]);
        const pData = await pRes.json();
        const aData = await aRes.json();
        setPatients(pData.patients || []);
        setAlerts(aData.alerts || []);
        setSentHistory(aData.sentHistory || []);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#00c8ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // --- Patient Detail View ---
  if (selectedPatient) {
    const p = selectedPatient;
    const patientAlerts = alerts.filter(a => a.patientId === p.id);
    const sortedScans = [...p.scans].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const latestScan = sortedScans[0];
    const scoreTrend = sortedScans.length >= 2 ? (sortedScans[0].overallScore > sortedScans[1].overallScore ? "up" : "down") : null;

    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <button onClick={() => setSelectedPatient(null)} className="flex items-center gap-2 text-[#00c8ff] mb-6 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Patients
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-syne">{p.name}</h1>
            <p className="text-[#5a7a99]">Age {p.age} • Patient since {new Date(p.createdAt).toLocaleDateString()}</p>
          </div>
          {p.latestScore !== null && <ScoreBadge score={p.latestScore} size="lg" />}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<BarChart3 className="w-5 h-5" />} label="Total Scans" value={p.scans.length} />
          <StatCard icon={<Activity className="w-5 h-5" />} label="Latest Score" value={p.latestScore ?? "—"} trend={scoreTrend} />
          <StatCard icon={<Bell className="w-5 h-5" />} label="Active Alerts" value={patientAlerts.filter(a => a.enabled).length} />
          <StatCard icon={<Clock className="w-5 h-5" />} label="Last Scan" value={latestScan ? new Date(latestScan.timestamp).toLocaleDateString() : "—"} />
        </div>

        {/* Caregiver Info */}
        {(p.caregiverName || p.caregiverPhone) && (
          <div className="p-4 rounded-xl bg-[#0b1520] border border-[rgba(0,200,255,0.12)] mb-8 flex items-center gap-4">
            <Shield className="w-5 h-5 text-[#7b5fff]" />
            <div>
              <span className="text-sm text-[#5a7a99]">Caregiver: </span>
              <span className="font-semibold">{p.caregiverName}</span>
              {p.caregiverPhone && <span className="text-[#5a7a99] ml-2">({p.caregiverPhone})</span>}
            </div>
          </div>
        )}

        {/* Scan History */}
        <h2 className="text-xl font-bold font-syne mb-4">Scan History</h2>
        <div className="space-y-3 mb-8">
          {sortedScans.length === 0 ? (
            <p className="text-[#5a7a99] text-center py-8">No scans recorded yet.</p>
          ) : sortedScans.map(scan => (
            <div key={scan.scanId} className="p-4 rounded-xl bg-[#0b1520] border border-[rgba(0,200,255,0.12)] flex items-center gap-4">
              <ScoreBadge score={scan.overallScore} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <GradeLabel grade={scan.overallGrade} />
                  <span className="text-xs text-[#5a7a99]">{new Date(scan.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex gap-3 mt-1">
                  {Object.entries(scan.categories).map(([key, cat]) => (
                    <span key={key} className="text-xs text-[#5a7a99]">{cat.name}: <span className="text-white">{cat.score}</span></span>
                  ))}
                </div>
              </div>
              {scan.riskFlags.length > 0 && (
                <div className="flex items-center gap-1 text-red-400 text-xs">
                  <AlertTriangle className="w-3 h-3" /> {scan.riskFlags.length} flag{scan.riskFlags.length > 1 ? "s" : ""}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Score Trend (simple visual) */}
        {sortedScans.length >= 2 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold font-syne mb-4">Score Trend</h2>
            <div className="p-4 rounded-xl bg-[#0b1520] border border-[rgba(0,200,255,0.12)]">
              <div className="flex items-end gap-2 h-32">
                {[...sortedScans].reverse().map((scan) => (
                  <div key={scan.scanId} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-[#5a7a99]">{scan.overallScore}</span>
                    <div className={cn("w-full rounded-t-lg transition-all", scan.overallScore >= 80 ? "bg-[#00e5a0]" : scan.overallScore >= 60 ? "bg-yellow-400" : scan.overallScore >= 40 ? "bg-orange-400" : "bg-red-400")} style={{ height: `${scan.overallScore}%` }} />
                    <span className="text-[8px] text-[#5a7a99]">{new Date(scan.timestamp).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Patient Alerts Config */}
        <h2 className="text-xl font-bold font-syne mb-4">Alert Configuration</h2>
        <div className="space-y-3">
          {patientAlerts.length === 0 ? (
            <p className="text-[#5a7a99] text-center py-4">No alerts configured.</p>
          ) : patientAlerts.map(alert => (
            <div key={alert.id} className="p-4 rounded-xl bg-[#0b1520] border border-[rgba(0,200,255,0.12)] flex items-center gap-4">
              <div className={cn("p-2 rounded-lg", alert.type === "sms" ? "bg-green-500/10 text-green-400" : alert.type === "email" ? "bg-blue-400/10 text-blue-400" : "bg-purple-400/10 text-purple-400")}>
                {alert.type === "sms" ? <Phone className="w-4 h-4" /> : alert.type === "email" ? <Mail className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{alert.type.toUpperCase()} Alert</p>
                <p className="text-xs text-[#5a7a99]">{alert.destination} • Threshold: {alert.threshold}</p>
              </div>
              <span className={cn("text-xs px-2 py-1 rounded-full", alert.enabled ? "bg-[#00e5a0]/10 text-[#00e5a0]" : "bg-[#5a7a99]/10 text-[#5a7a99]")}>
                {alert.enabled ? "Active" : "Paused"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- Main Dashboard View ---
  const totalScans = patients.reduce((acc, p) => acc + p.scans.length, 0);
  const avgScore = patients.filter(p => p.latestScore !== null).length > 0
    ? Math.round(patients.filter(p => p.latestScore !== null).reduce((acc, p) => acc + (p.latestScore ?? 0), 0) / patients.filter(p => p.latestScore !== null).length)
    : 0;
  const criticalPatients = patients.filter(p => p.latestScore !== null && p.latestScore < 50);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Nav Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-[#00c8ff]" />
          <div>
            <h1 className="text-2xl font-bold font-syne">CogniScan Dashboard</h1>
            <p className="text-sm text-[#5a7a99]">Caregiver Control Panel</p>
          </div>
        </div>
        <Link href="/" className="px-4 py-2 rounded-lg bg-[#0f1e2e] text-[#a8c4d8] text-sm flex items-center gap-2 hover:bg-[#0f1e2e]/80 border border-[rgba(0,200,255,0.1)]">
          <Home className="w-4 h-4" /> Home
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Users className="w-5 h-5" />} label="Total Patients" value={patients.length} />
        <StatCard icon={<BarChart3 className="w-5 h-5" />} label="Total Scans" value={totalScans} />
        <StatCard icon={<Activity className="w-5 h-5" />} label="Avg Score" value={avgScore} />
        <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Critical" value={criticalPatients.length} trend={criticalPatients.length > 0 ? "down" : null} />
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab("patients")} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", activeTab === "patients" ? "bg-[#00c8ff]/10 text-[#00c8ff] border border-[#00c8ff]/30" : "bg-[#0b1520] text-[#5a7a99] border border-transparent hover:text-white")}>
          <Users className="w-4 h-4 inline mr-1.5" /> Patients ({patients.length})
        </button>
        <button onClick={() => setActiveTab("alerts")} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", activeTab === "alerts" ? "bg-[#00c8ff]/10 text-[#00c8ff] border border-[#00c8ff]/30" : "bg-[#0b1520] text-[#5a7a99] border border-transparent hover:text-white")}>
          <Bell className="w-4 h-4 inline mr-1.5" /> Alerts ({alerts.length})
        </button>
      </div>

      {/* Patient List */}
      {activeTab === "patients" && (
        <div className="space-y-3">
          {patients.map(patient => (
            <button key={patient.id} onClick={() => setSelectedPatient(patient)} className="w-full p-5 rounded-xl bg-[#0b1520] border border-[rgba(0,200,255,0.12)] flex items-center gap-4 text-left hover:border-[#00c8ff]/30 transition-all group">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00c8ff]/20 to-[#7b5fff]/20 flex items-center justify-center text-lg font-bold text-[#00c8ff]">
                {patient.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold group-hover:text-[#00c8ff] transition-colors">{patient.name}</h3>
                <p className="text-xs text-[#5a7a99]">Age {patient.age} • {patient.scans.length} scan{patient.scans.length !== 1 ? "s" : ""} • Caregiver: {patient.caregiverName || "—"}</p>
              </div>
              {patient.latestScore !== null && <ScoreBadge score={patient.latestScore} />}
              <ChevronRight className="w-4 h-4 text-[#5a7a99] group-hover:text-[#00c8ff] transition-colors" />
            </button>
          ))}
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === "alerts" && (
        <div className="space-y-6">
          <div>
            <h3 className="font-bold font-syne mb-3">Alert Configurations</h3>
            <div className="space-y-2">
              {alerts.map(alert => {
                const patient = patients.find(p => p.id === alert.patientId);
                return (
                  <div key={alert.id} className="p-4 rounded-xl bg-[#0b1520] border border-[rgba(0,200,255,0.12)] flex items-center gap-4">
                    <div className={cn("p-2 rounded-lg", alert.type === "sms" ? "bg-green-500/10 text-green-400" : alert.type === "email" ? "bg-blue-400/10 text-blue-400" : "bg-purple-400/10 text-purple-400")}>
                      {alert.type === "sms" ? <Phone className="w-4 h-4" /> : alert.type === "email" ? <Mail className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{patient?.name || alert.patientId} — {alert.type.toUpperCase()}</p>
                      <p className="text-xs text-[#5a7a99]">{alert.destination} • Fires below score {alert.threshold}</p>
                    </div>
                    <span className={cn("text-xs px-2 py-1 rounded-full", alert.enabled ? "bg-[#00e5a0]/10 text-[#00e5a0]" : "bg-[#5a7a99]/10 text-[#5a7a99]")}>
                      {alert.enabled ? "Active" : "Paused"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {sentHistory.length > 0 && (
            <div>
              <h3 className="font-bold font-syne mb-3">Sent Alert History</h3>
              <div className="space-y-2">
                {sentHistory.map((entry, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-red-500/5 border border-red-500/15 flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-red-300">{entry.message}</p>
                      <p className="text-xs text-[#5a7a99] mt-1">{new Date(entry.triggeredAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
