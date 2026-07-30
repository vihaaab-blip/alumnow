"use client";
import { Toast, ToastProvider, ToastViewport, ToastTitle, ToastDescription, ToastClose } from "./Toast";

interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "error";
}

let toasts: ToastItem[] = [];
let listeners: Array<(toasts: ToastItem[]) => void> = [];

function notify() {
  listeners.forEach((l) => l([...toasts]));
}

export function toast({ title, description, variant = "default" }: Omit<ToastItem, "id">) {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { id, title, description, variant }];
  notify();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, 4000);
}

export function Toaster() {
  return (
    <ToastProvider>
      <ToastViewport />
      <ToastPrimitiveConsumer />
    </ToastProvider>
  );
}

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function ToastPrimitiveConsumer() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.push(setItems);
    return () => {
      listeners = listeners.filter((l) => l !== setItems);
    };
  }, []);

  return (
    <>
      {items.map((item) => (
        <Toast key={item.id} className={cn("animate-[toast-in_var(--dur-base)_var(--ease-out-expo)_both]", item.variant === "success" && "border-l-4 border-l-green-500", item.variant === "error" && "border-l-4 border-l-red-500")}>
          <div className="flex flex-col gap-1">
            {item.title && <ToastTitle>{item.title}</ToastTitle>}
            {item.description && <ToastDescription>{item.description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
    </>
  );
}
