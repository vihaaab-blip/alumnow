"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { Keyboard } from "@/components/ui/keyboard";

const KEY_CHAR: Record<string, string> = {
  KeyA: "a", KeyB: "b", KeyC: "c", KeyD: "d", KeyE: "e", KeyF: "f",
  KeyG: "g", KeyH: "h", KeyI: "i", KeyJ: "j", KeyK: "k", KeyL: "l",
  KeyM: "m", KeyN: "n", KeyO: "o", KeyP: "p", KeyQ: "q", KeyR: "r",
  KeyS: "s", KeyT: "t", KeyU: "u", KeyV: "v", KeyW: "w", KeyX: "x",
  KeyY: "y", KeyZ: "z",
  Digit0: "0", Digit1: "1", Digit2: "2", Digit3: "3", Digit4: "4",
  Digit5: "5", Digit6: "6", Digit7: "7", Digit8: "8", Digit9: "9",
  Space: " ", Minus: "-", Equal: "=",
  BracketLeft: "[", BracketRight: "]", Backslash: "\\",
  Semicolon: ";", Quote: "'",
  Comma: ",", Period: ".", Slash: "/",
  Backquote: "`",
};

const SHIFTED: Record<string, string> = {
  ...Object.fromEntries([...Array(26)].map((_, i) => [String.fromCharCode(65 + i), String.fromCharCode(65 + i)])),
  Digit1: "!", Digit2: "@", Digit3: "#", Digit4: "$", Digit5: "%",
  Digit6: "^", Digit7: "&", Digit8: "*", Digit9: "(", Digit0: ")",
  Minus: "_", Equal: "+",
  BracketLeft: "{", BracketRight: "}", Backslash: "|",
  Semicolon: ":", Quote: "\"",
  Comma: "<", Period: ">", Slash: "?",
  Backquote: "~",
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  value: string;
  onChange: (v: string) => void;
}

export function SearchOverlay({ open, onOpenChange, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(value);
  const shiftRef = useRef(false);
  const skipDebounce = useRef(true);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setInputValue(value);
      skipDebounce.current = true;
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, value]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("recent-searches");
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    if (skipDebounce.current) {
      skipDebounce.current = false;
      return;
    }
    const timer = setTimeout(() => {
      onChangeRef.current(inputValue);
    }, 400);
    return () => clearTimeout(timer);
  }, [inputValue]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Shift") shiftRef.current = e.type === "keydown";
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handler);
    window.addEventListener("keyup", handler);
    return () => { window.removeEventListener("keydown", handler); window.removeEventListener("keyup", handler); };
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

  const handleKeyClick = useCallback((keyCode: string) => {
    const input = inputRef.current;
    if (!input) return;

    if (keyCode === "Backspace") {
      const start = input.selectionStart ?? inputValue.length;
      const end = input.selectionEnd ?? start;
      if (start > 0 || end < inputValue.length) {
        const newVal = inputValue.slice(0, Math.max(0, start - (start === end ? 1 : 0))) + inputValue.slice(end);
        setInputValue(newVal);
        requestAnimationFrame(() => {
          input.focus();
          input.setSelectionRange(Math.max(0, start - (start === end ? 1 : 0)), Math.max(0, start - (start === end ? 1 : 0)));
        });
      }
      return;
    }

    if (keyCode === "Enter") {
      commit(inputValue);
      return;
    }

    let char: string | undefined;
    if (shiftRef.current) char = SHIFTED[keyCode];
    if (!char) char = KEY_CHAR[keyCode];
    if (!char) return;

    const start = input.selectionStart ?? inputValue.length;
    const end = input.selectionEnd ?? start;
    const newVal = inputValue.slice(0, start) + char + inputValue.slice(end);
    setInputValue(newVal);
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + char.length, start + char.length);
    });
  }, [inputValue, commit]);

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
            className="w-full max-w-4xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-2xl bg-[#1A1A1A] shadow-2xl ring-1 ring-white/5 overflow-hidden">
              <div className="flex items-center gap-3 px-4 h-14 border-b border-white/5">
                <Search size={16} className="text-white/25 shrink-0" />
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
              <div className="px-6 py-5 bg-gradient-to-b from-white/[0.03] to-transparent" onMouseDown={(e) => e.preventDefault()}>
                <div className="shadow-lg rounded-xl">
                  <Keyboard onKeyClick={handleKeyClick} />
                </div>
                {recentSearches.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5">
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
            </div>
            <p className="text-center text-xs text-white/60 mt-3">
              Click keys on the keyboard · Type on your keyboard · Enter to search · Esc to close
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
        <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-white/25 bg-white/5 px-1.5 py-0.5 rounded font-mono">
          <span>⌘</span>K
        </kbd>
      </div>
    </button>
  );
}
