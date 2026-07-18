"use client";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.user) setSession(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  return (
    <NextAuthSessionProvider session={session} refetchInterval={5 * 60} refetchOnWindowFocus>
      {children}
    </NextAuthSessionProvider>
  );
}
