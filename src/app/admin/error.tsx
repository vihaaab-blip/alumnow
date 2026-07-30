"use client";
import { Button } from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
        <AlertTriangle className="text-red-400" size={28} />
      </div>
      <h2 className="mt-6 text-2xl font-semibold text-white">Something broke in the admin panel</h2>
      <p className="mt-2 max-w-md text-sm text-white/40">{error.message || "An unexpected error occurred while loading this page."}</p>
      {error.digest && <p className="mt-1 text-xs text-white/20 font-mono">Digest: {error.digest}</p>}
      <Button className="mt-6" onClick={reset}>Try again</Button>
    </div>
  );
}
