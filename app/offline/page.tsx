"use client";

import { motion } from "framer-motion";
import { CloudOff, Droplets, RefreshCcw } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <main className="app-shell grid min-h-[100dvh] place-items-center px-4 py-10 text-white">
      <motion.div
        className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/[0.06] p-8 text-center backdrop-blur-2xl"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <CloudOff className="mx-auto size-12 text-cyan-200" />
        <h1 className="mt-4 text-3xl font-black">You are offline</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Hydration Coach stays available. Log water locally and we will sync when your
          connection returns.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button type="button" onClick={() => window.location.reload()}>
            <RefreshCcw />
            Try again
          </Button>
          <Button type="button" variant="secondary" asChild>
            <Link href="/dashboard">
              <Droplets />
              Open dashboard
            </Link>
          </Button>
        </div>
      </motion.div>
    </main>
  );
}
