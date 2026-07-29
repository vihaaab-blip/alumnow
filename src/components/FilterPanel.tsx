"use client";
import { useState, useEffect } from "react";
import { SlidersHorizontal, X, ChevronDown, ChevronUp, Book, Globe, Star, BookOpen, Award, Calendar, GraduationCap, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AlumniFilters } from "@/types";

type Options = { universities: string[]; countries: string[]; courses: string[] };

const INITIAL: AlumniFilters = {};

const qsTierOptions = [
  { value: "top10", label: "Top 10" },
  { value: "top20", label: "Top 20" },
  { value: "top50", label: "Top 50" },
  { value: "top100", label: "Top 100" },
  { value: "top200", label: "Top 200" },
  { value: "unranked", label: "Unranked" },
];

const ratingOptions = [
  { value: "4", label: "4+ \u2605" },
  { value: "3", label: "3+ \u2605" },
  { value: "2", label: "2+ \u2605" },
];

const GRAD_YEAR_MIN = 2015;
const GRAD_YEAR_MAX = new Date().getFullYear();

function FilterSection({ title, count, defaultOpen = true, icon, children }: { title: string; count?: number; defaultOpen?: boolean; icon?: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/5 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-3 text-xs font-semibold uppercase tracking-wider text-white/40 hover:text-white transition-colors"
      >
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        <span className="flex items-center gap-1.5">
          {count != null && count > 0 && (
            <span className="text-[10px] font-bold text-coral bg-coral/10 px-1.5 py-0.5 rounded-full">{count}</span>
          )}
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pb-3">{children}</div>
      </div>
    </div>
  );
}

function ChipGroup({ options, selected, onChange }: { options: { value: string; label: string }[]; selected?: string[]; onChange: (vals: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected?.includes(opt.value) ?? false;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(active ? selected!.filter((v) => v !== opt.value) : [...(selected ?? []), opt.value])}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 hover:scale-105 ${active ? "chip-active" : "chip-inactive"}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function MultiSelectSearch({ options, selected, onChange, placeholder }: { options: string[]; selected: string[]; onChange: (vals: string[]) => void; placeholder: string }) {
  const [query, setQuery] = useState("");
  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()))
    : options;
  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };
  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/15 transition-all placeholder:text-white/25"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {filtered.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
          {filtered.map((opt) => {
            const active = selected.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 hover:scale-105 ${active ? "chip-active" : "chip-inactive"}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-white/25">{options.length === 0 ? "No options yet" : "No matches"}</p>
      )}
    </div>
  );
}

function PillGroup<T extends string>({ options, selected, onChange }: { options: { value: T; label: string }[]; selected: T | ""; onChange: (v: T | undefined) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt, index) => (
        <button
          key={`${opt.value}-${index}`}
          onClick={() => onChange(opt.value === selected ? undefined : opt.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 hover:scale-105 ${selected === opt.value ? "chip-active" : "chip-inactive"}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function DualRangeSlider({ min, max, value, onChange }: { min: number; max: number; value: [number, number] | undefined; onChange: (v: [number, number] | undefined) => void }) {
  const [local, setLocal] = useState<[number, number]>(value ?? [min, max]);
  const [minVal, maxVal] = local;
  const active = value != null;

  const updateMin = (v: number) => {
    const next: [number, number] = [Math.min(v, maxVal - 1), maxVal];
    setLocal(next);
    if (next[0] !== min || next[1] !== max) onChange(next);
    else onChange(undefined);
  };
  const updateMax = (v: number) => {
    const next: [number, number] = [minVal, Math.max(v, minVal + 1)];
    setLocal(next);
    if (next[0] !== min || next[1] !== max) onChange(next);
    else onChange(undefined);
  };

  useEffect(() => {
    setLocal(value ?? [min, max]);
  }, [value, min, max]);

  const range = max - min;
  const leftPct = ((minVal - min) / range) * 100;
  const rightPct = ((max - maxVal) / range) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-white/50">
          {minVal} – {maxVal}
        </span>
        {active && (
          <button
            onClick={() => { setLocal([min, max]); onChange(undefined); }}
            className="text-[11px] text-coral hover:underline font-medium"
          >
            Reset
          </button>
        )}
      </div>
      <div className="dual-slider">
        <div className="track" style={{ left: `${leftPct}%`, right: `${rightPct}%` }} />
        <input type="range" min={min} max={max} value={minVal} onChange={(e) => updateMin(Number(e.target.value))} />
        <input type="range" min={min} max={max} value={maxVal} onChange={(e) => updateMax(Number(e.target.value))} />
      </div>
    </div>
  );
}

function countActive(d: AlumniFilters) {
  return [
    d.universities?.length ? "uni" : null,
    d.countries?.length ? "country" : null,
    d.courses?.length ? "course" : null,
    d.studyLevel,
    d.gradYearMin || d.gradYearMax ? "grad" : null,
    d.qsTiers?.length ? `qs-${d.qsTiers.length}` : null,
    (d.availability && d.availability !== "any") ? d.availability : null,
    d.minRating ? "rating" : null,
    d.topMentorOnly ? "topMentor" : null,
  ].filter(Boolean).length;
}

export function FilterPanel({
  filters,
  options,
  onChange,
  onClear,
  resultCount,
}: {
  filters: AlumniFilters;
  options: Options;
  onChange: (next: Partial<AlumniFilters>) => void;
  onClear: () => void;
  resultCount?: number;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [draft, setDraft] = useState<AlumniFilters>({ ...filters });

  useEffect(() => {
    setDraft({ ...filters });
  }, [filters]);

  const updateDraft = (partial: Partial<AlumniFilters>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
  };

  const handleApply = () => {
    onChange({
      courses: draft.courses,
      universities: draft.universities,
      topMentorOnly: draft.topMentorOnly,
      countries: draft.countries,
      minRating: draft.minRating,
      qsTiers: draft.qsTiers,
      gradYearMin: draft.gradYearMin,
      gradYearMax: draft.gradYearMax,
      studyLevel: draft.studyLevel,
      availability: draft.availability,
      search: draft.search,
    });
    setDrawerOpen(false);
  };

  const handleClearAll = () => {
    setDraft({ ...INITIAL });
    onClear();
    setDrawerOpen(false);
  };

  const activeCount = countActive(filters);

  const content = (
    <div className="overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-coral/12 text-coral">
              <SlidersHorizontal size={13} />
            </span>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-white">Filters</h2>
              {resultCount != null && (
                <p className="text-xs text-white/50 mt-0.5">{resultCount} result{resultCount !== 1 ? "s" : ""}</p>
              )}
            </div>
          </div>
          {activeCount > 0 && (
            <button onClick={handleClearAll} className="text-xs font-semibold text-coral hover:underline transition-all">
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Filter sections */}
      <div className="px-5">
        {/* Course — primary filter, must be first */}
        <FilterSection title="Course" count={draft.courses?.length} icon={<BookOpen size={14} />}>
          <MultiSelectSearch
            options={options.courses}
            selected={draft.courses ?? []}
            onChange={(vals) => updateDraft({ courses: vals.length > 0 ? vals : undefined })}
            placeholder="Filter courses..."
          />
        </FilterSection>

        {/* University */}
        <FilterSection title="University" count={draft.universities?.length} icon={<Book size={14} />}>
          <MultiSelectSearch
            options={options.universities}
            selected={draft.universities ?? []}
            onChange={(vals) => updateDraft({ universities: vals.length > 0 ? vals : undefined })}
            placeholder="Filter universities..."
          />
        </FilterSection>

        {/* Top Mentor */}
        <FilterSection title="Top Mentor" defaultOpen={true} icon={<Award size={14} className="text-[#e8573a]" />}>
          <button
            onClick={() => updateDraft({ topMentorOnly: draft.topMentorOnly ? undefined : true })}
            className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all ${
              draft.topMentorOnly
                ? "text-white"
                : "text-white/40 hover:text-white/60"
            }`}
            style={{
              background: draft.topMentorOnly
                ? "linear-gradient(90deg, rgba(232,87,58,0.15) 0%, rgba(232,87,58,0.06) 100%)"
                : "rgba(255,255,255,0.03)",
              border: `1px solid ${draft.topMentorOnly ? "rgba(232,87,58,0.3)" : "rgba(255,255,255,0.06)"}`,
            }}
          >
            <span
              className="inline-flex items-center justify-center h-5 w-5 rounded-full shrink-0"
              style={{
                background: draft.topMentorOnly
                  ? "linear-gradient(90deg, #FF7A57 0%, #E8573A 100%)"
                  : "rgba(255,255,255,0.08)",
              }}
            >
              <Award size={10} className="text-white" />
            </span>
            Top Mentor only
            <span className="ml-auto text-[10px] text-white/20">90%+ response · 4.8★ · 10+ sessions</span>
          </button>
        </FilterSection>

        {/* Country */}
        <FilterSection title="Country" count={draft.countries?.length} icon={<Globe size={14} />}>
          <MultiSelectSearch
            options={options.countries}
            selected={draft.countries ?? []}
            onChange={(vals) => updateDraft({ countries: vals.length > 0 ? vals : undefined })}
            placeholder="Filter countries..."
          />
        </FilterSection>

        {/* Minimum Rating */}
        <FilterSection title="Minimum Rating" count={draft.minRating ? 1 : 0} icon={<Star size={14} />}>
          <PillGroup options={ratingOptions} selected={draft.minRating ?? ""} onChange={(v) => updateDraft({ minRating: v })} />
        </FilterSection>

        {/* QS Ranking */}
        <FilterSection title="QS Ranking" count={draft.qsTiers?.length} icon={<Award size={14} />}>
          <ChipGroup options={qsTierOptions} selected={draft.qsTiers} onChange={(vals) => updateDraft({ qsTiers: vals.length > 0 ? vals : undefined })} />
        </FilterSection>

        {/* Graduation Year */}
        <FilterSection title="Graduation Year" count={draft.gradYearMin || draft.gradYearMax ? 1 : 0} icon={<Calendar size={14} />}>
          <DualRangeSlider
            min={GRAD_YEAR_MIN}
            max={GRAD_YEAR_MAX}
            value={draft.gradYearMin || draft.gradYearMax ? [draft.gradYearMin ?? GRAD_YEAR_MIN, draft.gradYearMax ?? GRAD_YEAR_MAX] : undefined}
            onChange={(val) => updateDraft({ gradYearMin: val?.[0], gradYearMax: val?.[1] })}
          />
        </FilterSection>

        {/* Study Level */}
        <FilterSection title="Study Level" icon={<GraduationCap size={14} />}>
          <PillGroup
            options={[
              { value: "undergraduate" as const, label: "Undergrad" },
              { value: "postgraduate" as const, label: "Postgrad" },
            ]}
            selected={draft.studyLevel ?? ""}
            onChange={(v) => updateDraft({ studyLevel: v })}
          />
        </FilterSection>

        {/* Availability */}
        <FilterSection title="Availability" icon={<Clock size={14} />}>
          <PillGroup
            options={[
              { value: "this_week" as const, label: "This week" },
              { value: "this_month" as const, label: "This month" },
            ]}
            selected={draft.availability ?? ""}
            onChange={(v) => updateDraft({ availability: v })}
          />
        </FilterSection>
      </div>

      {/* Apply + Clear All buttons */}
      <div className="px-5 py-4 space-y-2">
        <Button className="w-full rounded-lg" onClick={handleApply}>
          Apply Filters
        </Button>
        {activeCount > 0 && (
          <button
            onClick={handleClearAll}
            className="w-full text-center text-xs font-medium text-white/40 hover:text-white/70 transition-colors py-1"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-[#1A1A1A] text-sm font-medium text-white hover:bg-white/5 transition-all"
        >
          <SlidersHorizontal size={15} />
          Filters
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-coral px-1.5 py-0.5 text-[10px] font-bold text-white">{activeCount}</span>
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-[#0D0D0D] p-4 shadow-2xl animate-slide-up">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="font-semibold text-white">Filters</h2>
              <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            {content}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block rounded-[16px] border border-white/[0.06] bg-white/[0.02]">{content}</div>
    </>
  );
}