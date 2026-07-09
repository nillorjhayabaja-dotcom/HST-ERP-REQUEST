import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type Action = { label: string; to?: string; onClick?: () => void; variant?: "default" | "outline" };

export function StatusPage({
  code,
  title,
  description,
  icon: Icon,
  actions,
  tone = "neutral",
}: {
  code: string;
  title: string;
  description: string;
  icon: LucideIcon;
  actions: Action[];
  tone?: "neutral" | "danger" | "warn";
}) {
  const toneClass =
    tone === "danger"
      ? "text-destructive bg-destructive/10"
      : tone === "warn"
        ? "text-gold bg-gold/10"
        : "text-primary bg-primary/10";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg text-center">
        <div className={`inline-flex h-20 w-20 items-center justify-center rounded-2xl ${toneClass} mb-6`}>
          <Icon className="h-10 w-10" />
        </div>
        <div className="text-6xl font-black tracking-tight text-foreground">{code}</div>
        <h1 className="mt-3 text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{description}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {actions.map((a, i) =>
            a.to ? (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <Button key={i} variant={a.variant ?? "default"} asChild>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Link to={a.to as any}>{a.label}</Link>
              </Button>
            ) : (
              <Button key={i} variant={a.variant ?? "default"} onClick={a.onClick}>
                {a.label}
              </Button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
