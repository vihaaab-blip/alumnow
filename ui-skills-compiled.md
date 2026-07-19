# UI Skills — Compiled Reference

> Sources:
> - `ui-skills` v0.2.3 by ibelick (ui-skills.com) — transitions-dev, mastering-animate-presence, animate, to-spring-or-not-to-spring, 12-principles-of-animation, interaction-design
> - `emilkowalski/skills` — apple-design (WWDC 2026), emil-design-eng, animation-vocabulary, review-animations
> - Combined by opencode

---

## 1. Apple's Eight Design Principles (WWDC 2026)

From *Principles of Great Design*, Apple WWDC 2026. Use these as the names you reason with:

1. **Purpose.** Make with intention; decide what *not* to build. Every feature asks for the user's time, attention, and trust — spend that budget only where it pays off.

2. **Agency.** Keep people in control: offer choices, don't force a single path. Back it with forgiveness — easy undo for slips, a confirmation dialog only for genuinely destructive, irreversible actions (use sparingly; overusing it trains people to click through).

3. **Responsibility.** Act in the user's interest. Privacy: ask at the right moment, only for what's needed, transparently. Safety: anticipate misuse and harm — especially with AI. Add previews, confirmations, disclaimers; cut a feature whose risk outweighs its value.

4. **Familiarity.** Build on what people already know. Use metaphors that honor their physics. Be consistent: things that look the same must behave the same and live in the same place. Only break a familiar pattern if you can prove it's better — then test it.

5. **Flexibility.** Design for different contexts, devices, and abilities. Adapt to the platform (iPhone = quick touch; desktop = deep workflows). Design inclusively. When no single layout fits everyone, let people personalize.

6. **Simplicity — not minimalism.** Strip the unnecessary so the core purpose shines. Be concise (plain language, fewer steps) and clear (hierarchy — order, spacing, contrast — so the most important thing is the most obvious). Sometimes *adding* context simplifies.

7. **Craft.** Uncompromising attention to detail builds trust. Beautiful typography, colors that adapt, clear iconography, responsive animations. Nothing is random — every spacing, timing, and alignment is a deliberate choice. Jittery scroll and broken layouts read as carelessness.

8. **Delight.** The result of getting the other seven right, not confetti tacked on top. Decide the emotion you want people to feel (calm, confident, excited) and reinforce it in every decision.

### Tactical Rules That Serve These

- **Feedback comes in four kinds:** status, completion, warning, error. Confirm meaningful actions, expose ongoing status, warn before problems, validate inline.
- **Wayfinding.** Every screen should answer: Where am I? Where can I go? How do I get out?
- **Grouping & mapping.** Proximity implies relationship; place a control near what it affects.
- **Specific labels beat generic ones.** "Progress", "Library" not "Home".

---

## 2. Emil Kowalski's Design Engineering Philosophy

### Core Philosophy

- **Taste is trained, not innate** — study why the best interfaces feel the way they do. Reverse engineer animations. Inspect interactions.
- **Unseen details compound** — "a thousand barely audible voices all singing in tune." Users don't notice the details; they just feel the result.
- **Beauty is leverage** — people select tools based on overall experience, not just functionality.

### The Animation Decision Framework

Before writing any animation code, answer in order:

#### 1. Should this animate at all?

| Frequency | Decision |
|-----------|----------|
| 100+/day (keyboard shortcuts, command palette) | **No animation. Ever.** |
| Tens/day (hover effects, list nav) | Remove or drastically reduce |
| Occasional (modals, drawers, toasts) | Standard animation |
| Rare/first-time (onboarding, celebrations) | Can add delight |

**Never animate keyboard-initiated actions.** Raycast has no open/close animation. That's the optimal experience.

#### 2. What is the purpose?

Valid purposes: spatial consistency, state indication, explanation, feedback, preventing jarring changes. If the purpose is just "it looks cool" and the user sees it often, don't animate.

#### 3. What easing should it use?

```
Entering or exiting? → ease-out (starts fast, feels responsive)
Moving/morphing on screen? → ease-in-out
Hover/color change? → ease
Constant motion (marquee, progress)? → linear
```

Custom curves only (built-in CSS easings are too weak):
```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);        /* Strong ease-out */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);    /* Strong ease-in-out */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);     /* iOS-like drawer */
```

**Never use `ease-in` for UI** — it starts slow, feels sluggish. Use [easing.dev](https://easing.dev/) or [easings.co](https://easings.co/).

#### 4. How fast should it be?

| Element | Duration |
|---------|----------|
| Button press | 100–160ms |
| Tooltips, small popovers | 125–200ms |
| Dropdowns, selects | 150–250ms |
| Modals, drawers | 200–500ms |
| Marketing/explanatory | Can be longer |

**Rule: UI animations under 300ms.** A 180ms dropdown feels more responsive than a 400ms one.

#### 5. To Spring or Not to Spring

| Motion Type | Choice | Why |
|-------------|--------|-----|
| User-driven (drag, flick, gesture) | **Spring** | Survives interruption, preserves velocity |
| System-driven (state change) | **Easing** | Clear start/end, predictable |
| Progress/loading | **Linear** | 1:1 time/progress |
| High-frequency | **None** | Animation adds noise |

### Apple's Spring Parameters

| Interaction | Damping | Response |
|-------------|---------|----------|
| Move/reposition (e.g. PiP) | 1.0 | 0.4 |
| Rotation | 0.8 | 0.4 |
| Drawer/sheet | 0.8 | 0.3 |

```tsx
// Critically damped default (no overshoot)
animate(el, { y: 0 }, { type: 'spring', bounce: 0, duration: 0.4 });

// Momentum interaction — slight bounce
animate(el, { y: target }, { type: 'spring', bounce: 0.2, duration: 0.4 });
```

### Emil's Spring Config

```tsx
// Apple-style (recommended — easier to reason about)
{ type: "spring", duration: 0.5, bounce: 0.2 }

// Traditional physics (more control)
{ type: "spring", mass: 1, stiffness: 100, damping: 10 }
```

### Spring Facts

- **Damping ratio** — controls overshoot. 1.0 = critically damped (no bounce). < 1.0 = oscillates.
- **Response** — how quickly the value reaches the target (in seconds). Not "duration" — a spring has no fixed duration.
- Springs maintain velocity when interrupted. CSS keyframes restart from zero.
- Keep bounce subtle (0.1–0.3). Most UI shouldn't bounce.
- For gesture → spring: pass release velocity as spring initial velocity.
- `relativeVelocity = gestureVelocity / (targetValue - currentValue)`

---

## 3. Component Building Principles (Emil)

### Buttons must feel responsive
```css
.button {
  transition: transform 160ms ease-out;
}
.button:active {
  transform: scale(0.97);
}
```
Scale 0.95–0.98 on press. Never skip `:active` state.

### Never animate from scale(0)
Nothing appears from nothing. Start from `scale(0.9–0.97)` + opacity.
```css
/* Bad */
.entering { transform: scale(0); }
/* Good */
.entering { transform: scale(0.95); opacity: 0; }
```

### Make popovers origin-aware
Popovers scale from their **trigger**, not center. Modals stay centered (they're not anchored).
```css
.popover {
  transform-origin: var(--radix-popover-content-transform-origin);
}
```

### Tooltips: skip delay on subsequent hovers
```css
.tooltip[data-instant] {
  transition-duration: 0ms;
}
```

### Use transitions over keyframes for interruptible UI
Transitions retarget mid-animation. Keyframes restart from zero.
```css
/* Interruptible — good */
.toast { transition: transform 400ms ease; }
/* Not interruptible — avoid for dynamic UI */
@keyframes slideIn { from { transform: translateY(100%); } ... }
```

### Use blur to mask imperfect transitions
When a crossfade feels off, add `filter: blur(2px)` during transition. Blur blends the two states together, tricking the eye into seeing a single smooth transformation.
```css
.button-content.transitioning {
  filter: blur(2px);
  opacity: 0.7;
}
```

### CSS Transform Mastery
- `translateY(100%)` = element's own height. Use for drawers, toasts.
- `scale()` scales children too (unlike width/height).
- `transform-origin` — set to match where the trigger lives.

### clip-path for Animation
```css
.clip-reveal {
  clip-path: inset(0 100% 0 0);  /* hidden from right */
  transition: clip-path 200ms ease-out;
}
.active {
  clip-path: inset(0 0 0 0);     /* fully visible */
}
```

**Hold-to-delete pattern:** On `:active`, transition clip-path over 2s linear. On release, snap back 200ms ease-out.

### Gesture & Drag

- **Momentum-based dismissal:** If velocity > ~0.11, dismiss regardless of distance.
- **Damping at boundaries** — progressive resistance, not hard stops.
- **Pointer capture** once dragging starts.
- **Multi-touch protection** — ignore additional touch points.
- **Friction instead of hard stops** — allow past-boundary drag with increasing resistance.

### Asymmetric Enter/Exit Timing

Slow where the user is deciding (press: 2s linear), fast where the system is responding (release: 200ms ease-out).

```css
.overlay {
  transition: clip-path 200ms ease-out;   /* Release: fast */
}
.button:active .overlay {
  transition: clip-path 2s linear;        /* Press: slow & deliberate */
}
```

### Stagger
30–80ms between items. Never block interaction while stagger plays.
```css
.item:nth-child(1) { animation-delay: 0ms; }
.item:nth-child(2) { animation-delay: 50ms; }
.item:nth-child(3) { animation-delay: 100ms; }
```

### The Sonner Principles
1. **DX is key** — no hooks, no context. `toast()` from anywhere.
2. **Good defaults > options** — ship beautiful out of the box.
3. **Naming creates identity** — "Sonner" over "react-toast".
4. **Handle edge cases invisibly** — pause on tab hidden, pseudo-element gap fillers.
5. **Transitions, not keyframes, for dynamic UI.**
6. **Great docs** — interactive examples, ready-to-use code.

---

## 4. Performance Rules

### GPU-only properties
Only animate `transform` and `opacity` — they skip layout/paint, run on GPU.

### Framer Motion caveat
Shorthand props (`x`, `y`, `scale`) are **NOT** hardware-accelerated — they use `requestAnimationFrame` on the main thread.
```tsx
// NOT hardware accelerated
<motion.div animate={{ x: 100 }} />
// Hardware accelerated
<motion.div animate={{ transform: "translateX(100px)" }} />
```

### CSS beats JS under load
CSS animations run off the main thread. Use CSS for predetermined animations; JS for dynamic, interruptible.

### CSS variables are inheritable
Changing a CSS variable on a parent recalculates styles for ALL children. Update `transform` directly instead.
```js
// Bad: recalc storm
element.style.setProperty('--swipe-amount', `${distance}px`);
// Good
element.style.transform = `translateY(${distance}px)`;
```

### WAAPI for programmatic CSS animations
```js
element.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
  duration: 1000, fill: 'forwards',
  easing: 'cubic-bezier(0.77, 0, 0.175, 1)',
});
```

---

## 5. Animation Review Checklist

### The 10 Non-Negotiable Standards (from review-animations)

| # | Standard | Block if |
|---|----------|----------|
| 1 | **Justified motion** — every animation answers "why?" | "It looks cool" on frequent element |
| 2 | **Frequency-appropriate** — keyboard/high-frequency = no animation | Animation on keyboard action |
| 3 | **Responsive easing** — ease-out entering, custom curves | `ease-in` on UI |
| 4 | **Sub-300ms** — UI under 300ms | UI duration > 300ms without reason |
| 5 | **Origin & physicality** — popovers from trigger, never `scale(0)` | `scale(0)` or wrong origin |
| 6 | **Interruptibility** — transitions/springs for rapid/gesture | Keyframes on toasts/toggles |
| 7 | **GPU-only** — only `transform` + `opacity` | Layout properties or FM shorthand under load |
| 8 | **Accessibility** — `prefers-reduced-motion`, hover gated | Missing reduced-motion |
| 9 | **Asymmetric timing** — deliberate ≠ response speed | Symmetric on press-release |
| 10 | **Cohesion** — motion matches component personality | Mismatched motion personality |

### Aggressive Escalation Triggers (flag on sight)
- `transition: all`
- `scale(0)` or pure-fade entrances
- `ease-in` on any UI interaction
- Animation on keyboard shortcut or 100+/day action
- UI duration > 300ms
- `transform-origin: center` on trigger-anchored popover
- Keyframes on toasts/toggles
- Animating `width`/`height`/`margin`/`padding`/`top`/`left`
- FM `x`/`y`/`scale` under load
- CSS var on parent driving child transform
- Missing `prefers-reduced-motion` on movement
- Ungated `:hover` motion
- Symmetric enter/exit on hold interaction
- Everything-at-once entrance (needs stagger)

### Remedial Preference Hierarchy
1. **Delete** the animation
2. **Reduce** — shorter duration, smaller transform
3. **Fix easing** — `ease-in` → ease-out/custom
4. **Fix origin** — correct `transform-origin`, `scale(0)` → `scale(0.95)`+opacity
5. **Make interruptible** — keyframes → transitions/springs
6. **Move to GPU** — layout props → `transform`, full string over FM shorthand
7. **Asymmetric timing** — slow deliberate, snap response
8. **Polish** — blur for crossfades, stagger, `@starting-style`, springs
9. **Accessibility & cohesion**

### Review Output Format (required)
```markdown
| Before | After | Why |
| --- | --- | --- |
| `transition: all 300ms` | `transition: transform 200ms ease-out` | Specify exact properties |
| `transform: scale(0)` | `transform: scale(0.95); opacity: 0` | Nothing appears from nothing |
| `ease-in` on dropdown | custom curve ease-out | `ease-in` delays response |
```

---

## 6. Animation Vocabulary (Reverse Lookup)

### Entrances & Exits
| Vague description | Term |
|-------------------|------|
| "Fades in/out" | **Fade in / Fade out** |
| "Slides in from off-screen" | **Slide in** |
| "Grows from small to full" | **Scale in** |
| "Bounces into place" | **Pop in** |
| "Uncovered gradually" | **Reveal** (clip-path or mask) |

### Sequencing & Timing
| Term | Meaning |
|------|---------|
| **Stagger** | Items animate one after another with small delay |
| **Orchestration** | Coordinated timing of multiple animations |
| **Keyframes** | Defined points browser fills between |
| **Interpolation / Tween** | Generating in-between frames |

### Movement & Transforms
| Term | Meaning |
|------|---------|
| **Translate** | Move along X/Y axis |
| **Scale** | Make bigger/smaller |
| **Origin-aware animation** | Element animates from its trigger |
| **3D tilt / Flip** | Rotate in 3D space |
| **Perspective** | Strength of 3D effect |

### Transitions Between States
| Term | Meaning |
|------|---------|
| **Crossfade** | One fades out as other fades in |
| **Morph** | One shape turns into another (Dynamic Island) |
| **Shared element transition** | Element travels + transforms between positions |
| **Layout animation** | Size/position changes animate smoothly |
| **Direction-aware transition** | Content slides forward one way, back the opposite |

### Scroll Motion
| Term | Meaning |
|------|---------|
| **Scroll reveal** | Elements fade/slide in as they enter viewport |
| **Scroll-driven animation** | Progress tied to scroll position |
| **Parallax** | Layers move at different speeds |
| **Page transition** | Animation between routes |
| **View transition** | Browser morphs between two states/pages |

### Feedback & Interaction
| Term | Meaning |
|------|---------|
| **Press / Tap feedback** | Subtle scale-down on click |
| **Hold to confirm** | Progress fills while holding |
| **Drag** | Move element by grabbing it |
| **Swipe to dismiss** | Drag off-screen to close |
| **Rubber-banding** | Resistance + snap-back past boundary |
| **Shake / Wiggle** | Side-to-side for errors |
| **Ripple** | Circle expanding from tap point |

### Spring Animations
| Term | Meaning |
|------|---------|
| **Spring** | Physics-based (tension, mass, damping) |
| **Bounce** | Overshoots and settles |
| **Perceptual duration** | How long a spring *feels* finished |
| **Velocity** | Speed + direction preserved on interrupt |
| **Interruptible animation** | Smoothly redirected mid-flight |

### Polish & Effects
| Term | Meaning |
|------|---------|
| **Blur** | Soften element, mask imperfections |
| **Clip-path** | Clip to shape (reveals, masks, sliders) |
| **Mask** | Hide/reveal with soft edges (gradient) |
| **Line drawing** | SVG path that draws itself |
| **Text morph** | Character-by-character text change |
| **Skeleton / Shimmer** | Loading placeholder with moving sheen |
| **Number ticker** | Digits rolling/counting |

---

## 7. Apple's Fluid Interface Principles

### The Core Idea
> An interface is fluid when it behaves like the physical world: things respond instantly, move continuously, carry momentum, resist at boundaries, and can be redirected mid-motion.

### 1. Response — kill latency
- Respond on **pointer-down**, not on release.
- Audit debounces, artificial timers, 300ms tap delay.
- Feedback must be **continuous** during the interaction.

### 2. Direct Manipulation — 1:1 tracking
- Element stays glued to the finger, respects grab offset.
- Use Pointer Events + `setPointerCapture`.
- Track velocity/position history (last few `pointermove` events).

### 3. Interruptibility — the single most important principle
- Every animation must be interruptible and redirectable at any moment.
- Never lock out input during a transition.
- Always animate from the **presentation (current)** value.
- Avoid CSS transitions and keyframes for gesture-driven motion.
- Decompose 2D motion into **independent X and Y springs**.

### 4. Behavior over animation — use springs
A pre-scripted animation can't respond to new input. A spring can — new input just changes the target.

### 5. Velocity Handoff
When a gesture ends, the animation must continue at the finger's exact velocity.
```js
relativeVelocity = gestureVelocity / (targetValue - currentValue);
```

### 6. Momentum Projection
Use velocity to project the resting position, then snap to target nearest that point.
```js
function project(initialVelocity, decelerationRate = 0.998) {
  return (initialVelocity / 1000) * decelerationRate / (1 - decelerationRate);
}
```

### 7. Spatial Consistency
- Enter and exit along the same path.
- Anchor interactions to their source.
- Mirror easing on reversible transitions.

### 8. Rubber-banding (soft boundaries)
```js
function rubberband(overshoot, dimension, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}
```

### 9. Frame-level Smoothness
- Animate only compositor-friendly properties: `transform`, `opacity`.
- `requestAnimationFrame` is the web's display-synced clock.
- Keep per-frame positional change below perception threshold.

### 10. Materials & Depth — translucency conveys hierarchy
```css
.toolbar {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px) saturate(180%);
  border-top: 1px solid rgba(255, 255, 255, 0.4); /* light catching the material */
}
```
- Material weight encodes hierarchy: darker = structural, lighter = interactive.
- Never stack light translucent on another — legibility collapses.
- Bigger surfaces = thicker (stronger blur + deeper shadow).
- Dim to focus (modals), separate to keep flow (panels).
- Scroll edge effects, not hard dividers.
- Materialize, don't just fade — animate blur + scale together on enter/exit.

---

## 8. Modal & Dialog Motion

### Modal Open / Close (transitions.dev)
```css
--modal-open-dur: 250ms;
--modal-close-dur: 150ms;
--modal-scale: 0.96;
--modal-scale-close: 0.96;
--modal-ease: cubic-bezier(0.22, 1, 0.36, 1);
```
- Open: 250ms ease-out, scale 0.96→1
- Close: 150ms ease-in, scale 1→0.96
- Always include backdrop dim. Close state cleanup via `setTimeout`.
- Preserve `prefers-reduced-motion` guard.

### AnimatePresence Best Practices
| Rule | Description |
|------|-------------|
| `exit-requires-wrapper` | Conditional motion must be in `<AnimatePresence>` |
| `exit-prop-required` | Elements inside need `exit` prop |
| `exit-matches-initial` | Exit should mirror initial for symmetry |
| `mode-wait-doubles-duration` | mode="wait" nearly doubles duration |
| `mode-pop-layout-for-lists` | Use `mode="popLayout"` for list reordering |
| `nested-propagate-required` | Nested needs `propagate` prop |
| `presence-hook-in-child` | `useIsPresent` from child, not parent |
| `presence-safe-to-remove` | Always call `safeToRemove` after async work |

### Exit Animation Pattern
```tsx
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )}
</AnimatePresence>
```

---

## 9. CSS Transition Patterns (transitions.dev)

### 12 Drop-In Transitions

| # | Transition | Best For |
|---|-----------|----------|
| 1 | Card resize | Container width/height changes |
| 2 | Number pop-in | Digit updates with blur+slide |
| 3 | Notification badge | Slide badge onto trigger |
| 4 | Text states swap | Swap text with blur transition |
| 5 | Menu dropdown | Origin-aware dropdown from trigger |
| 6 | **Modal open/close** | Scale-up dialog, softer scale-down close |
| 7 | Panel reveal | Slide panel with cross-blur |
| 8 | Page side-by-side | List ↔ detail transitions |
| 9 | Icon swap | Cross-fade icons in same slot |
| 10 | Success check | Fade+rotate+bob+stroke-draw |
| 11 | Avatar group hover | Distance-falloff lift on hover |
| 12 | Error state shake | Cubic-bezier shake with auto-revert |

### Universal Install Block
```css
:root {
  --modal-open-dur: 250ms; --modal-close-dur: 150ms;
  --modal-scale: 0.96; --modal-scale-close: 0.96;
  --modal-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --dropdown-open-dur: 250ms; --dropdown-close-dur: 150ms;
  --dropdown-pre-scale: 0.97; --dropdown-closing-scale: 0.99;
  --dropdown-ease: cubic-bezier(0.22, 1, 0.36, 1);
}
```

### Common Mistakes
- Stripping close-state class cleanup (next open jumps from closing scale)
- Forgetting reflow (`void el.offsetWidth`) before replay
- Animating single container instead of inner pieces
- `transition: all` — enumerate exact properties
- Removing `prefers-reduced-motion` guard
- Hardcoding stroke-dasharray (use `path.getTotalLength()`)

---

## 10. Timing & Easing Reference

### Duration Table
| Duration | Use Case |
|----------|----------|
| 100–150ms | Instant feedback (button press, toggle) |
| 120–180ms | Hover/press feedback |
| 125–200ms | Tooltips, small popovers |
| 150–250ms | Dropdowns, selects |
| 180–260ms | Small state changes |
| 200–300ms | State changes (menu, modal enter) |
| 200–500ms | Modals, drawers (entrance) |
| 300–500ms | Layout changes (accordion) |
| 500–800ms | Entrance animations (page load) |

**Exit animations are faster than entrances** — use ~75% of enter duration.

### Recommended Easing Curves
```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);              /* Emil's strong ease-out */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);          /* Emil's strong in-out */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);           /* iOS-like drawer */
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);        /* Apple-style */
--ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);       /* Apple-style snappy */
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);         /* Confident */
```

**Never use:** built-in CSS easings (too weak), `ease-in` on UI, bounce/elastic curves.

---

## 11. Accessibility

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
/* Apple: cross-fade instead of slide/spring for reduced motion */
@media (prefers-reduced-motion: reduce) {
  .sheet { transition: opacity 200ms ease; transform: none !important; }
}
@media (prefers-reduced-transparency: reduce) {
  .toolbar { background: white; backdrop-filter: none; }
}
```

### Touch device hover
```css
@media (hover: hover) and (pointer: fine) {
  .element:hover { transform: scale(1.05); }
}
```

---

## 12. Quick Reference Card

| Situation | Technique | Duration | Easing |
|-----------|-----------|----------|--------|
| Dialog open | Scale 0.96→1 | 200–250ms | ease-out |
| Dialog close | Scale 1→0.96 | 150ms | ease-in |
| Button hover | Scale 1→1.02 | 120–150ms | ease-out |
| Button press | Scale 1→0.98 | 100–160ms | ease-out |
| Dropdown open | Scale from trigger | 150–250ms | ease-out |
| Dropdown close | Scale to trigger | 150ms | ease-in |
| Tooltip appear | Fade + scale 0.97→1 | 125–200ms | ease-out |
| Drag release | Spring | — | bounce:0.2, dur:0.4 |
| List stagger | 30–80ms per item | — | ease-out |
| Page transition | Crossfade + slide | 250–300ms | ease-in-out |
| Toast enter | Slide + fade | 200–400ms | ease-out |
| Toast exit | Fade | 150–200ms | ease-in |
| Progress bar | Width transition | — | linear |
| Keybard action | **No animation** | 0ms | — |

### Emil's Review Checklist (Quick)
| Issue | Fix |
|-------|-----|
| `transition: all` | `transition: transform 200ms ease-out` |
| `scale(0)` entry | `scale(0.95)` + `opacity: 0` |
| `ease-in` on UI | Custom ease-out curve |
| `transform-origin: center` on popover | Trigger location variable |
| Animation on keyboard action | Remove entirely |
| Duration > 300ms on UI | Reduce to 150–250ms |
| Hover without `@media (hover: hover)` | Add media query gate |
| Keyframes on rapidly-triggered element | CSS transitions |
| Framer Motion x/y under load | `transform: "translateX()"` |
| Same enter/exit speed | Exit faster than enter |
| Everything appears at once | Stagger 30–80ms |
