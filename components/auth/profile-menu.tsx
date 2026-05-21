"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, UserRound } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";

export function ProfileMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) {
    return null;
  }

  const displayName = user.displayName ?? "Athlete";
  const firstName = displayName.split(" ")[0] ?? displayName;

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center gap-3 rounded-full border border-white/10 bg-white/10 py-1 pl-1 pr-4 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/15"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open user profile menu"
      >
        <Avatar photoURL={user.photoURL} displayName={displayName} />
        <span className="hidden sm:inline">Welcome back, {firstName}</span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="absolute right-0 z-30 mt-3 w-72 rounded-3xl border border-white/10 bg-slate-950/92 p-3 shadow-[0_0_60px_rgba(8,47,73,0.35)] backdrop-blur-2xl"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3">
              <Avatar photoURL={user.photoURL} displayName={displayName} />
              <div className="min-w-0">
                <p className="truncate font-bold text-white">{displayName}</p>
                <p className="truncate text-sm text-slate-400">{user.email}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="mt-2 w-full justify-start"
              onClick={() => void signOut()}
            >
              <LogOut />
              Sign out
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Avatar({
  photoURL,
  displayName
}: {
  photoURL: string | null;
  displayName: string;
}) {
  if (photoURL) {
    return (
      <Image
        src={photoURL}
        alt={`${displayName} avatar`}
        width={40}
        height={40}
        className="size-10 rounded-full object-cover"
      />
    );
  }

  return (
    <span className="grid size-10 place-items-center rounded-full bg-cyan-300 text-slate-950">
      <UserRound className="size-5" />
    </span>
  );
}
