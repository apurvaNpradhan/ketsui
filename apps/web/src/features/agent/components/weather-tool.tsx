"use client";

import type { ToolCallMessagePartComponent } from "@assistant-ui/react";
import { defineToolkit } from "@assistant-ui/react";
import {
  CheckIcon,
  CloudSunIcon,
  DropletsIcon,
  Loader2Icon,
  MapPinIcon,
  ShieldAlertIcon,
  WindIcon,
  XIcon,
} from "lucide-react";

export type WeatherArgs = {
  city: string;
  unit: "celsius" | "fahrenheit";
};

export type WeatherResult = {
  city: string;
  country?: string | null;
  temperature?: number | null;
  unit: "celsius" | "fahrenheit";
  condition?: string | null;
  humidity?: number | null;
  wind_speed?: number | null;
  error?: string | null;
};

const unitLabel = (unit: WeatherArgs["unit"]) => (unit === "fahrenheit" ? "°F" : "°C");

export const WeatherToolUI: ToolCallMessagePartComponent<WeatherArgs, WeatherResult> = ({
  args,
  result,
  status,
  approval,
  respondToApproval,
}) => {
  if (approval && approval.approved === undefined && !approval.resolution) {
    return (
      <section
        aria-label="Weather permission request"
        className="w-full max-w-sm rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4"
      >
        <div className="flex items-start gap-3">
          <ShieldAlertIcon className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
          <div className="min-w-0">
            <p className="font-medium">Allow weather lookup?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ketsui wants to check the current weather in {args.city}.
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => respondToApproval({ approved: true })}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
          >
            <CheckIcon className="size-4" aria-hidden />
            Allow
          </button>
          <button
            type="button"
            onClick={() =>
              respondToApproval({
                approved: false,
                reason: "Weather lookup declined.",
              })
            }
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
          >
            <XIcon className="size-4" aria-hidden />
            Not now
          </button>
        </div>
      </section>
    );
  }

  if (approval?.approved === false) {
    return (
      <div className="rounded-xl border border-muted bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        Weather lookup declined.
      </div>
    );
  }

  if (status.type === "running") {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" aria-hidden />
        Checking the weather in {args.city}...
      </div>
    );
  }

  if (status.type === "incomplete" || result?.error) {
    return (
      <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {result?.error ?? `I couldn't get the weather for ${args.city}.`}
      </div>
    );
  }

  if (!result || result.temperature == null || !result.condition) return null;

  return (
    <section
      aria-label={`Weather in ${result.city}`}
      className="w-full max-w-sm rounded-2xl border bg-card p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <MapPinIcon className="size-4 text-muted-foreground" aria-hidden />
            {result.city}
            {result.country ? `, ${result.country}` : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{result.condition}</p>
        </div>
        <CloudSunIcon className="size-7 text-sky-500" aria-hidden />
      </div>

      <p className="mt-4 text-4xl font-semibold tracking-tight">
        {Math.round(result.temperature)}
        {unitLabel(result.unit)}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <DropletsIcon className="size-4" aria-hidden />
          <dt>Humidity</dt>
          <dd className="ml-auto text-foreground">{result.humidity}%</dd>
        </div>
        <div className="flex items-center gap-2">
          <WindIcon className="size-4" aria-hidden />
          <dt>Wind</dt>
          <dd className="ml-auto text-foreground">
            {Math.round(result.wind_speed ?? 0)} {result.unit === "fahrenheit" ? "mph" : "km/h"}
          </dd>
        </div>
      </dl>
    </section>
  );
};

export const agentToolkit = defineToolkit({
  get_weather: {
    type: "backend",

    display: "standalone",
    render: WeatherToolUI,
  },
});
