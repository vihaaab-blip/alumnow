"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Search, X, GraduationCap, Loader2 } from "lucide-react";
import { listAlumni } from "@/actions/alumni.actions";
import type { AlumniCardData } from "@/types";

const PREVIEW_LIMIT = 5;
const DEBOUNCE_MS = 250;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: string;
  onChange: (v: string) => void;
}

export function SearchOverlay({ open, onOpenChange, value, onChange }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(value);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [results, setResults] = useState<AlumniCardData[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    if (open) {
      setInputValue(value);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setResults([]);
    }
  }, [open, value]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("recent-searches");
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {}
  }, []);

  // Live preview: debounced fetch of the top few matching alumni as the user types.
  useEffect(() => {
    const term = inputValue.trim();
    if (!term) {
      setResults([]);
      setPreviewLoading(false);
      return;
    }
    setPreviewLoading(true);
    const id = ++requestId.current;
    const timer = setTimeout(() => {
      listAlumni({ search: term, pageSize: PREVIEW_LIMIT, sortBy: "relevance" })
        .then((res) => {
          if (requestId.current === id) setResults((res.items ?? []) as AlumniCardData[]);
        })
        .catch(() => { if (requestId.current === id) setResults([]); })
        .finally(() => { if (requestId.current === id) setPreviewLoading(false); });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [inputValue]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  const saveRecent = useCallback((v: string) => {
    if (!v.trim()) return;
    setRecentSearches((prev) => {
      const next = [v, ...prev.filter((s) => s !== v)].slice(0, 5);
      try { localStorage.setItem("recent-searches", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const commit = useCallback((v: string) => {
    saveRecent(v);
    onChange(v);
    onOpenChange(false);
  }, [onChange, onOpenChange, saveRecent]);

  const goToAlumnus = useCallback((alumnus: AlumniCardData) => {
    saveRecent(inputValue);
    onOpenChange(false);
    router.push(`/browse?search=${encodeURIComponent(alumnus.fullName)}`);
  }, [inputValue, onOpenChange, router, saveRecent]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm pt-[15vh]"
          onClick={() => onOpenChange(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-lg mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-2xl bg-[#1A1A1A] shadow-2xl ring-1 ring-white/5 overflow-hidden">
              <div className="flex items-center gap-3 px-4 h-14 border-b border-white/5">
                {previewLoading ? (
                  <Loader2 size={16} className="text-white/25 shrink-0 animate-spin" />
                ) : (
                  <Search size={16} className="text-white/25 shrink-0" />
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commit(inputValue);
                  }}
                  placeholder="Search alumni by name, university, course..."
                  className="flex-1 text-sm text-white placeholder:text-white/25 bg-transparent outline-none"
                />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/25 bg-white/5 px-1.5 py-0.5 rounded font-mono shrink-0">⏎</span>
                  <button
                    onClick={() => onOpenChange(false)}
                    className="p-1 rounded-md hover:bg-white/5 text-white/25 hover:text-white/50 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Live result preview */}
              {inputValue.trim() && (
                <div className="max-h-80 overflow-y-auto">
                  {results.length > 0 ? (
                    results.map((a) => {
                      const initials = a.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("");
                      return (
                        <button
                          key={a.id}
                          onClick={() => goToAlumnus(a)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5 transition-colors"
                        >
                          {a.profilePhotoUrl ? (
                            <img
                              src={a.profilePhotoUrl}
                              alt={a.fullName}
                              className="h-8 w-8 rounded-full object-cover border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] font-bold text-white/50">
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-white truncate">{a.fullName}</p>
                            <p className="text-[11px] text-white/35 truncate flex items-center gap-1">
                              <GraduationCap size={10} className="shrink-0" />
                              {a.universityName}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  ) : !previewLoading ? (
                    <p className="px-4 py-4 text-[12px] text-white/25">No alumni match &ldquo;{inputValue.trim()}&rdquo;</p>
                  ) : null}
                </div>
              )}

              {!inputValue.trim() && recentSearches.length > 0 && (
                <div className="px-4 py-4 border-t border-white/5">
                  <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider mb-2">Recent searches</p>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((s, i) => (
                      <button key={i}
                        onClick={() => { setInputValue(s); commit(s); }}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white/5 hover:bg-white/10 text-white/50 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="text-center text-xs text-white/40 mt-3">
              Type to see matching alumni · Enter to search · Esc to close
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Search alumni by name, university, or course"
      className="relative w-56 group cursor-pointer"
    >
      <div className="flex items-center gap-2 w-full pl-8 pr-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg transition-all duration-200 text-white/25 group-hover:border-white/20 group-hover:shadow-[0_0_16px_rgba(232,87,58,0.1)]">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25" />
        <span className="flex-1 text-left">Search alumni...</span>
      </div>
    </button>
  );
}
