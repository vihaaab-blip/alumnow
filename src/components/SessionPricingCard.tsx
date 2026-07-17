"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useReducedMotion } from "@/lib/hooks/useReducedMotion";

const labels: Record<string, string> = {
  call_30: "30-minute 1:1",
  call_45: "45-minute 1:1",
  call_60: "60-minute 1:1",
  group_40: "40-minute group",
};

export function SessionPricingCard({
  alumniId,
  offerings,
  bookedCounts,
}: {
  alumniId: string;
  offerings: Array<{ id: string; type: string; pricePaise: number; maxParticipants: number; descriptionOneLiner: string | null }>;
  bookedCounts?: Record<string, number>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const reduced = useReducedMotion();

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-primary">Choose a session</h2>
      {offerings.map((offering) => {
        const isSelected = selectedId === offering.id;
        const isGroup = offering.type === "group_40";
        const count = bookedCounts?.[offering.id] ?? 0;
        const maxPax = offering.maxParticipants;

        return (
          <div
            key={offering.id}
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={`${labels[offering.type] ?? offering.type}${isGroup ? `, ${count} of ${maxPax} spots filled` : ""}`}
            onClick={() => setSelectedId(offering.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedId(offering.id);
              }
            }}
            className={`flex items-center justify-between gap-4 rounded-xl border bg-[#1A1A1A] border-white/5 p-4 ${
              isSelected
                ? "border-primary ring-2 ring-primary"
                : "border-border hover:border-primary/30"
            } ${reduced ? "" : "transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 cursor-pointer"}`}
          >
            <div>
              <h3 className="font-semibold text-primary">{labels[offering.type] ?? offering.type}</h3>
              <p className="text-sm text-muted-foreground">{offering.descriptionOneLiner}</p>
              {isGroup && (
                <p className="mt-1 text-xs text-accent">
                  {count} of {maxPax} spots filled
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="font-bold text-primary">
                \u20B9{Math.round(offering.pricePaise / 100).toLocaleString("en-IN")}
              </p>
              <Link
                href={{ pathname: "/book/new", query: { alumniId, offeringId: offering.id } }}
                prefetch={false}
              >
                <Button className="mt-2" variant="accent">
                  Book now
                </Button>
              </Link>
            </div>
          </div>
        );
      })}
    </section>
  );
}
