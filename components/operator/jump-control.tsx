"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useEventStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/tv/section-label";

export function JumpControl({ max }: { max: number }) {
  const { jumpTo } = useEventStore();
  const [value, setValue] = useState("");

  const order = Number(value);
  const isValid = value.trim() !== "" && Number.isInteger(order) && order >= 1 && order <= max;

  return (
    <div>
      <SectionLabel>Jump to Item</SectionLabel>
      <div className="mt-3 flex items-center gap-2">
        <Input
          type="number"
          min={1}
          max={max}
          placeholder={`1–${max}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="tabular-nums"
        />
        <Button
          variant="secondary"
          size="md"
          aria-label="Jump"
          disabled={!isValid}
          onClick={() => {
            if (isValid) {
              jumpTo(order);
              setValue("");
            }
          }}
        >
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Button>
      </div>
    </div>
  );
}
