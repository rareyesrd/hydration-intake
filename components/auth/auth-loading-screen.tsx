"use client";

import { motion } from "framer-motion";

export function AuthLoadingScreen() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-white">
      <div className="grid place-items-center gap-5 text-center">
        <motion.div
          className="size-24 rounded-full border border-cyan-200/20 bg-cyan-300/20 shadow-[0_0_80px_rgba(103,232,249,0.35)]"
          animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-100/70">
            Restoring session
          </p>
          <h1 className="mt-3 text-3xl font-black">Preparing your cockpit</h1>
        </div>
      </div>
    </main>
  );
}
