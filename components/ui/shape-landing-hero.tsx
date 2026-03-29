"use client";

import { motion } from "framer-motion";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";

function ElegantShape({ className, delay = 0, width = 400, height = 100, rotate = 0, gradient = "from-white/[0.08]" }: { className?: string; delay?: number; width?: number; height?: number; rotate?: number; gradient?: string; }) {
    return (
        <motion.div initial={{ opacity: 0, y: -150, rotate: rotate - 15 }} animate={{ opacity: 1, y: 0, rotate: rotate }} transition={{ duration: 2.4, delay, ease: [0.23, 0.86, 0.39, 0.96], opacity: { duration: 1.2 } }} className={cn("absolute", className)}>
            <motion.div animate={{ y: [0, 15, 0] }} transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }} style={{ width, height }} className="relative">
                <div className={cn("absolute inset-0 rounded-full", "bg-gradient-to-r to-transparent", gradient, "backdrop-blur-[2px] border-2 border-white/[0.15]", "shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]", "after:absolute after:inset-0 after:rounded-full", "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]")} />
            </motion.div>
        </motion.div>
    );
}

export function HeroGeometric({ badge = "Design Collective", title1 = "Elevate Your Digital Vision", title2 = "Crafting Exceptional Websites" }: { badge?: string; title1?: string; title2?: string; }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fadeUpVariants: any = {
        hidden: { opacity: 0, y: 30 },
        visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 1, delay: 0.5 + i * 0.2, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] } }),
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#050a0f]">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />
            <div className="absolute inset-0 overflow-hidden">
                <ElegantShape delay={0.3} width={600} height={140} rotate={12} gradient="from-cyan-500/[0.15]" className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]" />
                <ElegantShape delay={0.5} width={500} height={120} rotate={-15} gradient="from-blue-500/[0.15]" className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]" />
                <ElegantShape delay={0.4} width={300} height={80} rotate={-8} gradient="from-violet-500/[0.15]" className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]" />
            </div>
            <div className="relative z-10 container mx-auto px-4 md:px-6 mt-20">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div custom={0} variants={fadeUpVariants} initial="hidden" animate="visible" className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-[#00c8ff]/30 mb-8 md:mb-12">
                        <Circle className="h-2 w-2 fill-[#00c8ff]/80" />
                        <span className="text-sm text-white/80 tracking-wide">{badge}</span>
                    </motion.div>
                    <motion.div custom={1} variants={fadeUpVariants} initial="hidden" animate="visible">
                        <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold mb-6 md:mb-8 tracking-tight font-syne">
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">{title1}</span><br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00c8ff] via-[#7b5fff] to-[#ff6b6b]">{title2}</span>
                        </h1>
                    </motion.div>
                    <motion.div custom={2} variants={fadeUpVariants} initial="hidden" animate="visible">
                        <p className="text-base sm:text-lg md:text-xl text-[#a8c4d8] mb-12 leading-relaxed font-light tracking-wide max-w-2xl mx-auto px-4">
                            CogniScan uses multimodal AI to assess memory, speech patterns, and facial micro-expressions — delivering clinical-grade insights in under 10 minutes.
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <a href="#scan" className="px-8 py-4 rounded-xl bg-gradient-to-br from-[#00c8ff] to-[#7b5fff] text-white font-semibold shadow-[0_0_24px_rgba(0,200,255,0.28)] hover:shadow-[0_6px_32px_rgba(0,200,255,0.4)] transition-all hover:-translate-y-1">🧠 Start New Scan</a>
                        </div>
                    </motion.div>
                </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#050a0f] via-transparent to-[#050a0f]/80 pointer-events-none" />
        </div>
    );
}
