"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Plus, X, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { setRecurringSlots, setOneOffSlots, deleteSlot } from "@/actions/availability.actions";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface Slot {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface AvailabilityEditorProps {
  recurringSlots: { id: string; dayOfWeek: number; startTime: string; endTime: string }[];
  oneOffSlots: { id: string; specificDate: string; startTime: string; endTime: string }[];
}

export function AvailabilityEditor({ recurringSlots: initialRecurring, oneOffSlots }: AvailabilityEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [recurring, setRecurring] = useState<Slot[]>(
    initialRecurring.map((s) => ({ id: s.id, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime }))
  );
  const [newOneOff, setNewOneOff] = useState({ specificDate: "", startTime: "10:00", endTime: "11:00" });

  function addDaySlot(day: number) {
    setRecurring([...recurring, { dayOfWeek: day, startTime: "10:00", endTime: "11:00" }]);
  }

  function removeRecurring(index: number) {
    setRecurring(recurring.filter((_, i) => i !== index));
  }

  function updateRecurring(index: number, field: keyof Slot, value: string | number) {
    setRecurring(recurring.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }

  function getSlotsForDay(day: number) {
    return recurring.filter((s) => s.dayOfWeek === day);
  }

  async function handleSaveRecurring() {
    setSaving(true);
    const result = await setRecurringSlots(recurring.map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime })));
    setSaving(false);
    if (result.success) {
      toast.success("Availability saved");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to save availability");
    }
  }

  async function handleAddOneOff() {
    if (!newOneOff.specificDate) return;
    setSaving(true);
    const result = await setOneOffSlots([newOneOff]);
    setSaving(false);
    if (result.success) {
      toast.success("One-off slot added");
      setNewOneOff({ specificDate: "", startTime: "10:00", endTime: "11:00" });
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to add slot");
    }
  }

  async function handleDeleteSlot(slotId: string) {
    const result = await deleteSlot(slotId);
    if (result.success) {
      toast.success("Slot deleted");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to delete slot");
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-primary">Recurring weekly availability</h2>
        <p className="mt-1 text-sm text-muted-foreground">Set your regular weekly schedule. These repeat every week.</p>

        <div className="mt-6 space-y-4">
          {DAYS.map((day, dayIdx) => {
            const daySlots = getSlotsForDay(dayIdx);
            return (
              <div key={day} className="flex items-start gap-4 border-b border-border pb-4 last:border-0">
                <div className="w-24 shrink-0 pt-2">
                  <p className="text-sm font-medium text-primary">{day.slice(0, 3)}</p>
                </div>
                <div className="flex flex-1 flex-wrap gap-3">
                  {daySlots.map((slot, slotIdx) => {
                    const globalIdx = recurring.indexOf(slot);
                    return (
                      <div key={slotIdx} className="flex items-center gap-2 rounded-[10px] border border-border bg-muted/30 px-3 py-2">
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateRecurring(globalIdx, "startTime", e.target.value)}
                          className="w-20 rounded-md border border-border bg-[#1A1A1A] px-2 py-1 text-xs outline-none focus:border-primary"
                        />
                        <span className="text-xs text-muted-foreground">to</span>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateRecurring(globalIdx, "endTime", e.target.value)}
                          className="w-20 rounded-md border border-border bg-[#1A1A1A] px-2 py-1 text-xs outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => removeRecurring(globalIdx)}
                          className="ml-1 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => addDaySlot(dayIdx)}
                    className="inline-flex items-center gap-1 rounded-[10px] border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Plus size={14} />
                    Add slot
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSaveRecurring} variant="primary" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save recurring schedule
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-primary">One-off slots</h2>
        <p className="mt-1 text-sm text-muted-foreground">Add specific date slots for special availability.</p>

        <div className="mt-4 flex flex-wrap gap-3">
          {oneOffSlots.length > 0 && (
            <div className="mb-4 flex w-full flex-wrap gap-2">
              {oneOffSlots.map((slot) => {
                const displayDate = new Date(slot.specificDate).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                });
                return (
                  <Badge key={slot.id} className="flex items-center gap-2 bg-accent/10 pr-1">
                    {displayDate} {slot.startTime}-{slot.endTime}
                    <button
                      type="button"
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="ml-1 rounded-full p-0.5 transition-colors hover:bg-destructive/20"
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-4 border-t border-border pt-5">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</label>
            <input
              type="date"
              value={newOneOff.specificDate}
              onChange={(e) => setNewOneOff({ ...newOneOff, specificDate: e.target.value })}
              className="h-11 rounded-[10px] border border-border bg-[#1A1A1A] px-3.5 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Start</label>
            <input
              type="time"
              value={newOneOff.startTime}
              onChange={(e) => setNewOneOff({ ...newOneOff, startTime: e.target.value })}
              className="h-11 rounded-[10px] border border-border bg-[#1A1A1A] px-3.5 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">End</label>
            <input
              type="time"
              value={newOneOff.endTime}
              onChange={(e) => setNewOneOff({ ...newOneOff, endTime: e.target.value })}
              className="h-11 rounded-[10px] border border-border bg-[#1A1A1A] px-3.5 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <Button onClick={handleAddOneOff} variant="outline" disabled={saving || !newOneOff.specificDate}>
            <Plus className="mr-1 h-4 w-4" />
            Add one-off
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
