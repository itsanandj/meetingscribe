"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

/** The full transcript, folded away until the user opens it. */
export function TranscriptSection({ transcript }: { transcript: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <Card className="shadow-none">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Transcript</CardTitle>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              {open ? "Hide transcript" : "Show transcript"}
              <ChevronDown
                className={open ? "rotate-180 transition-transform" : "transition-transform"}
              />
            </Button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-7">{transcript}</p>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
