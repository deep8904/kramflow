"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./button";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-md px-6"
          onClick={onCancel}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby={description ? "confirm-dialog-description" : undefined}
            initial={{ opacity: 0, scale: 0.97, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-[380px] rounded-2xl bg-surface-1 border border-[var(--color-border-strong)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="confirm-dialog-title"
              className="text-[17px] font-semibold text-primary tracking-tight"
            >
              {title}
            </h2>
            {description && (
              <p
                id="confirm-dialog-description"
                className="text-[13px] text-secondary mt-2 leading-relaxed"
              >
                {description}
              </p>
            )}
            <div className="flex items-center gap-2.5 mt-6">
              <Button
                ref={confirmRef}
                variant={tone === "danger" ? "danger" : "primary"}
                size="md"
                className="flex-1"
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
              <Button
                variant="ghost"
                size="md"
                className="flex-1"
                onClick={onCancel}
              >
                {cancelLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useConfirmDialog<T = void>() {
  const [pending, setPending] = useState<T | null>(null);

  const request = useCallback((value: T) => setPending(value), []);
  const cancel = useCallback(() => setPending(null), []);

  return {
    isOpen: pending !== null,
    pending,
    request,
    cancel,
  };
}
