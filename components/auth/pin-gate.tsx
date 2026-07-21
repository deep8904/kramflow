"use client";

import { useEffect, useRef, useState } from "react";
import { Delete } from "lucide-react";
import { useAuth } from "./auth-context";
import { cn } from "@/lib/utils";

const PIN_LENGTH = 4;
const KEYPAD_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
];

export function PinGate({ children }: { children: React.ReactNode }) {
  const { status, unlock } = useAuth();

  if (status === "checking") {
    return <div className="h-screen w-screen bg-background" />;
  }

  if (status === "unlocked") {
    return <>{children}</>;
  }

  return <PinScreen onUnlock={unlock} />;
}

function PinScreen({ onUnlock }: { onUnlock: () => void }) {
  const [digits, setDigits] = useState("");
  const [error, setError] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function submitPin(pin: string) {
    setVerifying(true);
    setError(false);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data: { ok: boolean } = await res.json();
      if (data.ok) {
        onUnlock();
        return;
      }
    } catch {
      // fall through to error state
    }
    setError(true);
    setDigits("");
    setVerifying(false);
  }

  function setDigitsAndMaybeSubmit(next: string) {
    setError(false);
    setDigits(next);
    if (next.length === PIN_LENGTH) submitPin(next);
  }

  function appendDigit(d: string) {
    if (verifying || digits.length >= PIN_LENGTH) return;
    setDigitsAndMaybeSubmit(digits + d);
  }

  function backspace() {
    if (verifying) return;
    setDigits((prev) => prev.slice(0, -1));
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background px-6">
      {/* Subtle grid texture overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
        aria-hidden="true"
      />

      <div className="flex flex-col items-center w-full max-w-[280px] relative">
        {/* Wordmark */}
        <div className="flex items-center gap-2.5 mb-12">
          <span className="h-1.5 w-1.5 rounded-full bg-status-green live-pulse" aria-hidden="true" />
          <p className="text-[11px] uppercase tracking-[0.18em] text-tertiary font-medium">
            KramFlow
          </p>
        </div>

        <h1 className="text-[2.5rem] font-semibold tracking-[-0.025em] text-primary leading-none text-center">
          Enter PIN
        </h1>
        <p className="text-caption text-tertiary mt-2 text-center">
          Operator access required
        </p>

        {/* PIN dots — hidden real input drives them */}
        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={PIN_LENGTH}
          autoComplete="off"
          value={digits}
          disabled={verifying}
          aria-label="4-digit PIN"
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH);
            setDigitsAndMaybeSubmit(next);
          }}
          className="sr-only"
        />

        <button
          type="button"
          onClick={() => inputRef.current?.focus()}
          className="flex items-center gap-4 mt-10 cursor-text"
          aria-hidden="true"
          tabIndex={-1}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-3 w-3 rounded-full transition-all duration-150",
                i < digits.length
                  ? error
                    ? "bg-status-red scale-100"
                    : "bg-primary scale-100"
                  : "bg-surface-3 scale-100",
                error && i < digits.length && "animate-[slide-up_200ms_ease]"
              )}
            />
          ))}
        </button>

        <p
          className={cn(
            "text-caption mt-3 h-5 transition-all duration-200",
            error ? "text-status-red opacity-100" : "opacity-0"
          )}
          role="alert"
        >
          Incorrect PIN
        </p>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 mt-6 w-full">
          {KEYPAD_ROWS.flat().map((d) => (
            <KeypadButton key={d} onClick={() => appendDigit(d)} disabled={verifying}>
              {d}
            </KeypadButton>
          ))}
          <span />
          <KeypadButton onClick={() => appendDigit("0")} disabled={verifying}>
            0
          </KeypadButton>
          <KeypadButton onClick={backspace} disabled={verifying} aria-label="Backspace">
            <Delete className="h-4 w-4" strokeWidth={1.5} />
          </KeypadButton>
        </div>
      </div>
    </div>
  );
}

function KeypadButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "h-[62px] w-full rounded-xl bg-surface-1 border border-[var(--color-border)]",
        "hover:bg-surface-2 hover:border-[var(--color-border-strong)]",
        "active:scale-95 text-[1.25rem] font-medium text-primary",
        "flex items-center justify-center transition-all duration-100 cursor-pointer",
        "disabled:opacity-30 disabled:cursor-not-allowed",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
