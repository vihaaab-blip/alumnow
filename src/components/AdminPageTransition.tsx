"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function AdminPageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [key, setKey] = useState(pathname);

  useEffect(() => { setKey(pathname); }, [pathname]);

  return (
    <div
      key={key}
      style={{ animation: "page-settle var(--dur-base) var(--ease-out-expo) both" }}
    >
      {children}
    </div>
  );
}
