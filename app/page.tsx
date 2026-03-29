import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { ScanEngine } from "@/components/ui/scan-engine";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050a0f] text-white selection:bg-[#00c8ff]/30">
      {/* Nav Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050a0f]/80 backdrop-blur-xl border-b border-[rgba(0,200,255,0.08)]">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg font-syne">
            🧠 CogniScan
          </Link>
          <div className="flex items-center gap-4">
            <a href="#scan" className="text-sm text-[#a8c4d8] hover:text-white transition-colors">Start Scan</a>
            <Link href="/dashboard" className="px-4 py-2 rounded-lg bg-[#0f1e2e] text-[#00c8ff] text-sm font-medium border border-[#00c8ff]/20 hover:bg-[#00c8ff]/10 transition-all">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <HeroGeometric 
        badge="AI-Powered Neurocognitive Screening"
        title1="Detect Cognitive"
        title2="Decline Early." 
      />

      <section className="container mx-auto px-4 py-24 border-t border-[rgba(0,200,255,0.1)] relative z-10 bg-[#050a0f]">
        <div className="max-w-3xl mx-auto text-center mb-16">
           <h2 className="text-3xl md:text-5xl font-bold font-syne tracking-tight mb-4">Start Assessment</h2>
           <p className="text-[#a8c4d8]">Complete all four modules to establish your cognitive baseline. Results are processed securely.</p>
        </div>

        <ScanEngine />
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgba(0,200,255,0.08)] bg-[#050a0f] py-8">
        <div className="container mx-auto px-4 text-center text-sm text-[#5a7a99]">
          <p>CogniScan © 2026 — AI-Powered Neurocognitive Screening</p>
          <p className="mt-1 text-xs">Built with Next.js • FastAPI • Whisper • MediaPipe • scikit-learn</p>
        </div>
      </footer>
    </main>
  );
}
