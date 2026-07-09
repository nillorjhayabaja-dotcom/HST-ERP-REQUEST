"use client";

import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";

export function PortalBreadcrumb() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const humanize = (s: string) =>
    s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 px-4 py-2 text-xs text-muted-foreground border-b border-border/50 bg-muted/30"
    >
      <Link to={"/" as never} className="hover:text-foreground inline-flex items-center gap-1">
        <Home className="h-3 w-3" />
        <span className="sr-only">Home</span>
      </Link>
      {segments.map((seg, idx) => {
        const isLast = idx === segments.length - 1;
        return (
          <span key={idx} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            <span className={isLast ? "text-foreground font-medium" : ""}>{humanize(seg)}</span>
          </span>
        );
      })}
    </nav>
  );
}
