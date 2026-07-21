"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useEventStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function JumpControl({ max }: { max: number }) {
  const { jumpTo } = useEventStore();
  const [value, setValue] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const order = Number(value);
  const isValid =
    value.trim() !== "" &&
    Number.isInteger(order) &&
    order >= 1 &&
    order <= max;

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.14em] text-tertiary font-medium mb-3">
        Jump to Item
      </p>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          max={max}
          placeholder={`1 – ${max}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="Item number"
          className="tabular"
        />
        <Button
          variant="secondary"
          size="md"
          aria-label="Jump"
          disabled={!isValid}
          onClick={() => setConfirmOpen(true)}
        >
          <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={`Jump to item ${value}?`}
        description="This changes what's live on every connected display right now."
        confirmLabel="Jump Here"
        onConfirm={() => {
          if (isValid) {
            jumpTo(order);
            setValue("");
          }
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
