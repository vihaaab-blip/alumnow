"use client";
import { useSession } from "@/hooks/useSession";
import { useEffect, useState } from "react";

export function AdminSessionWarning() {
  const { data: session } = useSession();
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!(session as any)?.expires) return;
    const check = () => {
      const diffMs = new Date((session as any).expires as unknown as string).getTime() - Date.now();
      setMinutesLeft(Math.floor(diffMs / 60000));
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [session]);

  if (minutesLeft === null || minutesLeft > 5) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-[12px] border border-amber-500/30 bg-[#1A1A1A] px-4 py-3 text-sm text-amber-300 shadow-xl">
      Session expires in {Math.max(minutesLeft, 0)} min. Save your work.
    </div>
  );
}
