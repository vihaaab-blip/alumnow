"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import Link from "next/link";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?error=unauthorized");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[calc(100dvh-64px)]">
        <div className="w-[280px] flex-shrink-0 bg-[#0d0d0d] p-4 space-y-3">
          <Skeleton className="h-16 w-full bg-white/10 rounded-none" />
          <Skeleton className="h-10 w-full bg-white/10" />
          <Skeleton className="h-10 w-full bg-white/10" />
          <Skeleton className="h-10 w-full bg-white/10" />
          <Skeleton className="h-10 w-full bg-white/10" />
          <Skeleton className="h-10 w-full bg-white/10" />
          <Skeleton className="h-10 w-full bg-white/10" />
          <div className="mt-auto pt-8">
            <Skeleton className="h-10 w-full bg-white/10" />
          </div>
        </div>
        <div className="flex-1 p-10 space-y-4">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-8">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (session?.user?.role !== "admin") {
    return (
      <div className="flex min-h-[calc(100dvh-64px)] flex-col items-center justify-center px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 mb-6">
          <span className="text-3xl font-bold text-red-500">!</span>
        </div>
        <h1 className="text-4xl font-bold text-primary">Access Denied</h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          You don&apos;t have permission to access this area. Only admin users can view the admin dashboard.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-[10px] bg-accent px-8 py-3 text-sm font-semibold text-white hover:bg-accent-dark transition-colors"
        >
          Go Home
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
