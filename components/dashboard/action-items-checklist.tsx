"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { ActionItem } from "@/lib/meetings";
import { describeActionItem } from "@/lib/summary-text";
import { cn } from "@/lib/utils";
import { useId, useState } from "react";

// Ticks are only kept while the page is open; nothing is saved yet.
export function ActionItemsChecklist({ items }: { items: ActionItem[] }) {
  const id = useId();
  const [done, setDone] = useState<number[]>([]);

  const toggle = (index: number, checked: boolean) =>
    setDone((current) =>
      checked ? [...current, index] : current.filter((i) => i !== index),
    );

  return (
    <ul className="flex flex-col gap-4">
      {items.map((item, index) => {
        const checkboxId = `${id}-${index}`;
        const isDone = done.includes(index);
        const details = describeActionItem(item);

        return (
          <li key={index} className="flex items-start gap-3">
            <Checkbox
              id={checkboxId}
              checked={isDone}
              onCheckedChange={(checked) => toggle(index, checked === true)}
              className="mt-0.5"
            />
            <label htmlFor={checkboxId} className="flex flex-col gap-0.5">
              <span
                className={cn(
                  "text-sm leading-5",
                  isDone && "text-muted-foreground line-through",
                )}
              >
                {item.task}
              </span>
              {details && (
                <span className="text-xs text-muted-foreground">
                  {[item.owner, item.due && `Due ${item.due}`]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              )}
            </label>
          </li>
        );
      })}
    </ul>
  );
}
