"use client";

// Bryntum Scheduler (trial build, aliased as @bryntum/scheduler in package.json). Read-only.
import "@bryntum/scheduler/scheduler.css";
import { BryntumScheduler } from "@bryntum/scheduler-react";
import { useEffect, useMemo, useState } from "react";
import type { Batch } from "./payouts-view";
import { money } from "@/lib/sway";

const DAY = 86_400_000;

export default function Timeline({ batches }: { batches: Batch[] }) {
  const [themed, setThemed] = useState(false);

  // Bryntum themes are global :root variable sets, so one is picked at load: dark when the site
  // theme (data-theme) or the OS asks for it. Changing theme afterwards needs a reload.
  useEffect(() => {
    const t = document.querySelector("[data-theme]")?.getAttribute("data-theme");
    const dark = t === "dark" || (t !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    (dark ? import("@bryntum/scheduler/svalbard-dark.css") : import("@bryntum/scheduler/svalbard-light.css")).then(() => setThemed(true));
  }, []);

  const config = useMemo(() => {
    const min = Math.min(...batches.map((b) => b.start.getTime()));
    const max = Math.max(...batches.map((b) => b.end.getTime()));
    const publishers = [...new Set(batches.map((b) => b.publisher))].sort();
    return {
      readOnly: true,
      startDate: new Date(Math.floor(min / DAY) * DAY - DAY),
      endDate: new Date(Math.ceil(max / DAY) * DAY + 2 * DAY),
      viewPreset: "dayAndWeek",
      rowHeight: 56,
      eventStyle: "filled" as const,
      columns: [{ text: "Publisher", field: "name", width: 220 }],
      resources: publishers.map((name) => ({ id: name, name })),
      events: batches.map((b) => ({ id: b.id, resourceId: b.publisher, startDate: b.start, endDate: b.end, name: money(b.amount) })),
      eventRenderer: ({ eventRecord }: { eventRecord: { name: string } }) => eventRecord.name,
    };
  }, [batches]);

  if (!themed) return null;
  return (
    <div className="ops-sched" role="region" aria-label="Payout batches by publisher over time. A table with the same data follows.">
      <BryntumScheduler {...config} />
    </div>
  );
}
