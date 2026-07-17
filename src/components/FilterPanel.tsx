"use client";
import { useState, useEffect, useRef } from "react";
import { SlidersHorizontal, X, ChevronDown, ChevronUp, Book, Globe, Languages, Star, BookOpen, Award, DollarSign, Calendar, GraduationCap, Video, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { AlumniFilters } from "@/types";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

type Options = { universities: string[]; countries: string[]; courses: string[] };

const qsTierOptions = [
  { value: "top10", label: "Top 10" },
  { value: "top20", label: "Top 20" },
  { value: "top50", label: "Top 50" },
  { value: "top100", label: "Top 100" },
  { value: "top200", label: "Top 200" },
  { value: "unranked", label: "Unranked" },
];

const languageOptions = [
  { value: "English", label: "English" },
  { value: "Hindi", label: "Hindi" },
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Mandarin", label: "Mandarin" },
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

function PillGroup<T extends string>({ options, selected, onChange }: { options: { value: T; label: string }[]; selected: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt, index) => (
        <button
          key={`${opt.value}-${index}`}
          onClick={() => onChange(opt.value)}
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

  const [uniInput, setUniInput] = useState(filters.university ?? "");
  const [courseInput, setCourseInput] = useState(filters.course ?? "");
  const [countryInput, setCountryInput] = useState("");

  const debouncedUni = useDebounce(uniInput, 300);
  const debouncedCourse = useDebounce(courseInput, 300);
  const debouncedCountryInput = useDebounce(countryInput, 300);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    onChangeRef.current({ university: debouncedUni || undefined });
  }, [debouncedUni]);

  useEffect(() => {
    onChangeRef.current({ course: debouncedCourse || undefined });
  }, [debouncedCourse]);

  useEffect(() => {
    setUniInput(filters.university ?? "");
  }, [filters.university]);

  useEffect(() => {
    setCourseInput(filters.course ?? "");
  }, [filters.course]);

  const countryList = options.countries.map((c) => ({ value: c, label: c }));
  const filteredCountries = debouncedCountryInput.trim()
    ? countryList.filter((c) => c.label.toLowerCase().includes(debouncedCountryInput.toLowerCase()))
    : countryList;

  const activeCount = [
    filters.university,
    filters.country,
    filters.course,
    filters.studyLevel && filters.studyLevel !== "both" ? filters.studyLevel : null,
    (filters.sessionType && filters.sessionType !== "both") ? filters.sessionType : null,
    filters.gradYearMin || filters.gradYearMax ? "grad" : null,
    filters.qsTiers?.length ? `qs-${filters.qsTiers.length}` : null,
    (filters.availability && filters.availability !== "any") ? filters.availability : null,
    filters.priceMin || filters.priceMax ? "price" : null,
    filters.languages?.length ? `lang-${filters.languages.length}` : null,
    filters.minRating ? "rating" : null,
  ].filter(Boolean).length;

  const content = (
    <div className="rounded-2xl border border-white/5 bg-[#1A1A1A] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Filters</h2>
            {resultCount != null && (
              <p className="text-xs text-white/50 mt-0.5">{resultCount} result{resultCount !== 1 ? "s" : ""}</p>
            )}
          </div>
          {activeCount > 0 && (
            <button onClick={onClear} className="text-xs font-semibold text-coral hover:underline transition-all">
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Filter sections */}
      <div className="px-5">
        {/* University */}
        <FilterSection title="University" count={filters.university ? 1 : 0} icon={<Book size={14} />}>
          <input
            type="text"
            placeholder="Search universities..."
            className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/15 transition-all placeholder:text-white/25"
            value={uniInput}
            onChange={(e) => setUniInput(e.target.value)}
          />
        </FilterSection>

        {/* Country */}
        <FilterSection title="Country" count={filters.country ? 1 : 0} icon={<Globe size={14} />}>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Search countries..."
              className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/15 transition-all placeholder:text-white/25"
              value={countryInput}
              onChange={(e) => setCountryInput(e.target.value)}
            />
            {filteredCountries.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {filteredCountries.map((c) => {
                  const active = filters.country === c.value;
                  return (
                    <button
                      key={c.value}
                      onClick={() => onChange({ country: active ? undefined : c.value })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 hover:scale-105 ${active ? "chip-active" : "chip-inactive"}`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-white/25">No countries match</p>
            )}
          </div>
        </FilterSection>

        {/* Language */}
        <FilterSection title="Language" count={filters.languages?.length} icon={<Languages size={14} />}>
          <ChipGroup options={languageOptions} selected={filters.languages} onChange={(vals) => onChange({ languages: vals.length > 0 ? vals : undefined })} />
        </FilterSection>

        {/* Minimum Rating */}
        <FilterSection title="Minimum Rating" count={filters.minRating ? 1 : 0} icon={<Star size={14} />}>
          <PillGroup options={ratingOptions} selected={filters.minRating ?? ""} onChange={(v) => onChange({ minRating: v || undefined })} />
        </FilterSection>

        {/* Course */}
        <FilterSection title="Course" count={filters.course ? 1 : 0} icon={<BookOpen size={14} />}>
          <input
            type="text"
            placeholder="Search courses..."
            className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/15 transition-all placeholder:text-white/25"
            value={courseInput}
            onChange={(e) => setCourseInput(e.target.value)}
          />
        </FilterSection>

        {/* QS Ranking */}
        <FilterSection title="QS Ranking" count={filters.qsTiers?.length} icon={<Award size={14} />}>
          <ChipGroup options={qsTierOptions} selected={filters.qsTiers} onChange={(vals) => onChange({ qsTiers: vals.length > 0 ? vals : undefined })} />
        </FilterSection>

        {/* Price Range */}
        <FilterSection title="Price Range" count={filters.priceMin || filters.priceMax ? 1 : 0} icon={<DollarSign size={14} />}>
          <DualRangeSlider
            min={0}
            max={10000}
            value={filters.priceMin != null || filters.priceMax != null ? [filters.priceMin ?? 0, filters.priceMax ?? 10000] : undefined}
            onChange={(val) => onChange({ priceMin: val?.[0], priceMax: val?.[1] })}
          />
        </FilterSection>

        {/* Graduation Year */}
        <FilterSection title="Graduation Year" count={filters.gradYearMin || filters.gradYearMax ? 1 : 0} icon={<Calendar size={14} />}>
          <DualRangeSlider
            min={GRAD_YEAR_MIN}
            max={GRAD_YEAR_MAX}
            value={filters.gradYearMin || filters.gradYearMax ? [filters.gradYearMin ?? GRAD_YEAR_MIN, filters.gradYearMax ?? GRAD_YEAR_MAX] : undefined}
            onChange={(val) => onChange({ gradYearMin: val?.[0], gradYearMax: val?.[1] })}
          />
        </FilterSection>

        {/* Study Level */}
        <FilterSection title="Study Level" icon={<GraduationCap size={14} />}>
          <PillGroup
            options={[
              { value: undefined as any, label: "All" },
              { value: "undergraduate" as const, label: "Undergrad" },
              { value: "postgraduate" as const, label: "Postgrad" },
            ]}
            selected={filters.studyLevel ?? "both"}
            onChange={(v) => onChange({ studyLevel: v === "both" ? undefined : v })}
          />
        </FilterSection>

        {/* Session Type */}
        <FilterSection title="Session Type" icon={<Video size={14} />}>
          <PillGroup
            options={[
              { value: "both" as const, label: "All" },
              { value: "1:1" as const, label: "1-on-1" },
              { value: "group" as const, label: "Group" },
            ]}
            selected={filters.sessionType ?? "both"}
            onChange={(v) => onChange({ sessionType: v === "both" ? undefined : v })}
          />
        </FilterSection>

        {/* Availability */}
        <FilterSection title="Availability" icon={<Clock size={14} />}>
          <PillGroup
            options={[
              { value: "any" as const, label: "Any" },
              { value: "this_week" as const, label: "This week" },
              { value: "this_month" as const, label: "This month" },
            ]}
            selected={filters.availability ?? "any"}
            onChange={(v) => onChange({ availability: v === "any" ? undefined : v })}
          />
        </FilterSection>
      </div>

      {/* Apply button */}
      <div className="px-5 py-4">
        <Button
          className="w-full rounded-lg"
          onClick={() => { if (drawerOpen) setDrawerOpen(false); }}
        >
          Apply Filters
        </Button>
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
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
      <div className="hidden lg:block">{content}</div>
    </>
  );
}
