import type { Metadata } from "next";
import { DashboardClient } from "./dashboard-client";

export const metadata: Metadata = {
  title: "CogniScan — Caregiver Dashboard",
  description: "Monitor patient cognitive health, view scan histories, and manage alerts.",
};

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#050a0f] text-white">
      <DashboardClient />
    </main>
  );
}
