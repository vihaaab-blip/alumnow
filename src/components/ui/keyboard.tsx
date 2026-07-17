"use client";
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KeyboardCtx {
  pressedKeys: Set<string>;
  setPressed: (k: string) => void;
  setReleased: (k: string) => void;
  onKeyClick?: (keyCode: string) => void;
}

const Ctx = createContext<KeyboardCtx | null>(null);
const useKeys = () => useContext(Ctx)!;

let audioCtx: AudioContext | null = null;

function playClick() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(1000, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.015);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.03);
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.015, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const noise = audioCtx.createBufferSource();
    const ng = audioCtx.createGain();
    noise.buffer = buf;
    ng.gain.setValueAtTime(0.08, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
    noise.connect(ng);
    ng.connect(audioCtx.destination);
    noise.start(t);
  } catch {}
}

function playRelease() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.01);
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.015);
  } catch {}
}

export function Keyboard({ className, onKeyClick }: { className?: string; onKeyClick?: (keyCode: string) => void }) {
  const [pressedKeys, setKeys] = useState<Set<string>>(new Set());
  const setPressed = useCallback((k: string) => {
    playClick();
    setKeys((p) => new Set(p).add(k));
  }, []);
  const setReleased = useCallback((k: string) => {
    playRelease();
    setKeys((p) => { const n = new Set(p); n.delete(k); return n; });
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (!e.repeat) setPressed(e.code); };
    const up = (e: KeyboardEvent) => setReleased(e.code);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [setPressed, setReleased]);

  return (
    <Ctx.Provider value={{ pressedKeys, setPressed, setReleased, onKeyClick }}>
      <div className={cn("mx-auto w-fit scale-[0.55] sm:scale-[0.7] md:scale-[0.85] lg:scale-100 origin-top", className)}>
        <div className="rounded-xl bg-neutral-800 p-1.5 shadow-sm ring-1 shadow-black/5 ring-black/5">
          <Row>
            <KBtn keyCode="Backquote"><span>`</span></KBtn>
            {["1","2","3","4","5","6","7","8","9","0"].map((n) => <KBtn key={n} keyCode={`Digit${n}`}>{n}</KBtn>)}
            <KBtn keyCode="Minus">-</KBtn>
            <KBtn keyCode="Equal">=</KBtn>
            <KBtn keyCode="Backspace" className="w-14"><span>del</span></KBtn>
          </Row>
          <Row>
            <KBtn keyCode="Tab" className="w-14"><span>tab</span></KBtn>
            {["Q","W","E","R","T","Y","U","I","O","P"].map((l) => <KBtn key={l} keyCode={`Key${l}`}>{l}</KBtn>)}
            <KBtn keyCode="BracketLeft">[</KBtn>
            <KBtn keyCode="BracketRight">]</KBtn>
            <KBtn keyCode="Backslash">\</KBtn>
          </Row>
          <Row>
            <KBtn keyCode="CapsLock" className="w-[3.8rem]"><span>caps</span></KBtn>
            {["A","S","D","F","G","H","J","K","L"].map((l) => <KBtn key={l} keyCode={`Key${l}`}>{l}</KBtn>)}
            <KBtn keyCode="Semicolon">;</KBtn>
            <KBtn keyCode="Quote">'</KBtn>
            <KBtn keyCode="Enter" className="w-[3.85rem]"><span>return</span></KBtn>
          </Row>
          <Row>
            <KBtn keyCode="ShiftLeft" className="w-[5rem]"><span>shift</span></KBtn>
            {["Z","X","C","V","B","N","M"].map((l) => <KBtn key={l} keyCode={`Key${l}`}>{l}</KBtn>)}
            <KBtn keyCode="Comma">,</KBtn>
            <KBtn keyCode="Period">.</KBtn>
            <KBtn keyCode="Slash">/</KBtn>
            <KBtn keyCode="ShiftRight" className="w-[5rem]"><span>shift</span></KBtn>
          </Row>
          <Row>
            <KBtn keyCode="ControlLeft" className="w-11"><span>ctrl</span></KBtn>
            <KBtn keyCode="AltLeft" className="w-10"><span>alt</span></KBtn>
            <KBtn keyCode="MetaLeft" className="w-11"><span>⌘</span></KBtn>
            <KBtn keyCode="Space" className="w-[11rem]" />
            <KBtn keyCode="MetaRight" className="w-11"><span>⌘</span></KBtn>
            <KBtn keyCode="AltRight" className="w-10"><span>alt</span></KBtn>
          </Row>
        </div>
      </div>
    </Ctx.Provider>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="mb-[3px] flex gap-[3px]">{children}</div>;
}

function KBtn({ className, children, keyCode }: { className?: string; children?: ReactNode; keyCode?: string }) {
  const ctx = useKeys();
  const isPressed = keyCode != null && ctx.pressedKeys.has(keyCode);

  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => {
        if (!keyCode) return;
        ctx.setPressed(keyCode);
        ctx.onKeyClick?.(keyCode);
        setTimeout(() => ctx.setReleased(keyCode), 100);
      }}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-md bg-neutral-700 text-[9px] text-neutral-200 font-semibold shadow-[0px_1px_2px_0px_rgba(0,0,0,0.3),0px_1px_0px_0px_rgba(255,255,255,0.05)_inset] transition-all duration-75 select-none",
        isPressed && "scale-[0.92] bg-coral text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]",
        className
      )}
    >
      {children}
    </button>
  );
}
