"use client";
import { useState, useRef } from "react";
import { updatePlatformStat, updateUpiSettings, updatePlatformSetting } from "@/actions/admin.actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toaster";

const STAT_KEYS = ["alumni_count", "universities_count", "sessions_completed"] as const;

export function AdminPlatformSettings({ initialUpi, initialStats, initialQrCode }: {
  initialUpi: string
  initialStats: Record<string, number>
  initialQrCode: string | null
}) {
  const [upi, setUpi] = useState(initialUpi);
  const [stats, setStats] = useState<Record<string, number>>(initialStats);
  const [qrCode, setQrCode] = useState<string | null>(initialQrCode);
  const [saving, setSaving] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSaveUpi = async () => {
    setSaving("upi");
    try {
      await updateUpiSettings(upi);
      toast({ title: "UPI settings saved", variant: "success" });
    } catch {
      toast({ title: "Failed to save UPI settings", variant: "error" });
    } finally {
      setSaving(null);
    }
  };

  const handleStatBlur = async (key: string, value: string) => {
    const num = Number(value);
    if (isNaN(num)) return;
    try {
      await updatePlatformStat(key, num);
      setStats((prev) => ({ ...prev, [key]: num }));
      toast({ title: `${key.replaceAll("_", " ")} updated`, variant: "success" });
    } catch {
      toast({ title: `Failed to update ${key}`, variant: "error" });
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setQrCode(base64);
      try {
        await updatePlatformSetting("upi_qr_code", base64);
        toast({ title: "QR code uploaded", variant: "success" });
      } catch {
        toast({ title: "Failed to upload QR code", variant: "error" });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQr = async () => {
    setQrCode(null);
    try {
      await updatePlatformSetting("upi_qr_code", "");
      toast({ title: "QR code removed", variant: "success" });
    } catch {
      toast({ title: "Failed to remove QR code", variant: "error" });
    }
  };

  return (
    <div className="max-w-xl space-y-8">
      <div className="rounded-2xl border border-border bg-[#1A1A1A] p-6">
        <h2 className="font-semibold text-primary">Payment settings</h2>
        <label className="mt-4 block text-sm font-semibold">
          UPI ID
          <Input value={upi} onChange={(e) => setUpi(e.target.value)} className="mt-2" />
        </label>
        <Button className="mt-4" disabled={saving === "upi"} onClick={handleSaveUpi}>
          {saving === "upi" ? "Saving..." : "Save UPI settings"}
        </Button>
      </div>

      <div className="rounded-2xl border border-border bg-[#1A1A1A] p-6">
        <h2 className="font-semibold text-primary">UPI QR Code</h2>
        {qrCode && (
          <div className="mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCode} alt="UPI QR Code" className="h-40 w-40 rounded-lg border border-border object-cover" loading="lazy" />
            <Button variant="outline" size="sm" className="mt-2" onClick={handleRemoveQr}>Remove QR</Button>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleQrUpload} className="mt-4 block text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white" />
      </div>

      <div className="rounded-2xl border border-border bg-[#1A1A1A] p-6">
        <h2 className="font-semibold text-primary">Platform stats</h2>
        {STAT_KEYS.map((key) => (
          <label key={key} className="mt-4 block text-sm font-semibold">
            {key.replaceAll("_", " ")}
            <Input
              type="number"
              className="mt-2"
              defaultValue={stats[key]?.toString() || "0"}
              onBlur={(e) => handleStatBlur(key, e.target.value)}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
