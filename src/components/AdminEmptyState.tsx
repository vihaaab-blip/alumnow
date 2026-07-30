import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function AdminEmptyState({ icon: Icon, title, description, actionLabel, onAction }: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-[stagger-in_var(--dur-slow)_var(--ease-out-expo)_both]">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.06]">
        <div className="absolute inset-0 rounded-2xl bg-coral/10 blur-xl" />
        <Icon size={26} className="relative text-white/30" />
      </div>
      <h3 className="mt-5 text-base font-semibold text-white">{title}</h3>
      <p className="mt-1.5 max-w-xs text-sm text-white/35">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
