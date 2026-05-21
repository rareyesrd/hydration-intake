import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center text-white">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">404</p>
        <h1 className="mt-4 text-4xl font-black">This route ran dry.</h1>
        <Button asChild className="mt-8">
          <Link href="/">Return to dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
