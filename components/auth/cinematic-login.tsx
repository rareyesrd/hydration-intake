"use client";

import { useEffect } from "react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Droplets, ShieldCheck, Sparkles, Waves } from "lucide-react";

import { AuthLoadingScreen } from "@/components/auth/auth-loading-screen";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";

const messages = [
  "Hydrate like a professional.",
  "Your performance starts here.",
  "Track recovery. Build consistency.",
  "Water fuels champions."
];

export function CinematicLogin() {
  const { user, isLoading, isSigningIn, signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(next as Route);
    }
  }, [isLoading, next, router, user]);

  if (isLoading || user) {
    return <AuthLoadingScreen />;
  }

  return (
    <main className="relative grid min-h-screen overflow-hidden px-4 py-8 text-white lg:grid-cols-[1fr_0.82fr] lg:px-10">
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 18 }, (_, index) => (
          <motion.span
            key={index}
            className="absolute size-1.5 rounded-full bg-cyan-100/50"
            style={{
              left: `${8 + ((index * 17) % 84)}%`,
              top: `${12 + ((index * 23) % 76)}%`
            }}
            animate={{
              y: [-12, -42, -12],
              opacity: [0.12, 0.8, 0.12],
              scale: [0.8, 1.35, 0.8]
            }}
            transition={{
              duration: 4 + (index % 5),
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.14
            }}
          />
        ))}
      </div>

      <section className="relative flex flex-col justify-center py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-cyan-100 backdrop-blur-xl">
            <Sparkles className="size-4" />
            Athlete hydration intelligence
          </div>
          <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[0.92] sm:text-7xl lg:text-8xl">
            Hydrate like a professional.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
            Sign in with Google to sync your hydration cockpit, protect your
            progress, and turn recovery into a measurable training habit.
          </p>
        </motion.div>

        <motion.div
          className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-2"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.08
              }
            }
          }}
        >
          {messages.map((message) => (
            <motion.div
              key={message}
              className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl"
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0 }
              }}
            >
              <p className="text-lg font-black">{message}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="relative flex items-center justify-center">
        <motion.div
          className="w-full max-w-md overflow-hidden rounded-[32px] border border-white/12 bg-slate-950/55 p-6 shadow-[0_0_90px_rgba(34,211,238,0.18)] backdrop-blur-2xl"
          initial={{ opacity: 0, x: 28, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        >
          <div className="relative grid place-items-center py-8">
            <motion.div
              className="absolute size-56 rounded-full bg-cyan-300/15 blur-2xl"
              animate={{ scale: [1, 1.15, 1], opacity: [0.45, 0.85, 0.45] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="relative grid size-32 place-items-center rounded-full border border-cyan-200/25 bg-cyan-300/10">
              <Waves className="size-14 text-cyan-100" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-2xl bg-cyan-300 text-slate-950">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <p className="font-black">Secure Google session</p>
                  <p className="text-sm text-slate-400">
                    Your hydration records are scoped to your Google user ID.
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="button"
              className="h-14 w-full text-base"
              onClick={() => void signIn()}
              disabled={isSigningIn}
            >
              <Droplets />
              {isSigningIn ? "Connecting..." : "Continue with Google"}
            </Button>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
