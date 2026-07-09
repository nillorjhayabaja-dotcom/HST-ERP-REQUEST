"use client";

import { useState, useEffect } from "react";
import { UserCog, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ALL_ROLES, PORTALS, ROLE_TO_PORTAL } from "@/lib/roles/role-config";
import { ROLE_LABELS } from "@/lib/rbac";

/**
 * DEV-only floating role switcher.
 * Renders nothing in production builds.
 */
export function RoleSwitcher() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    try {
      setCurrent(window.localStorage.getItem("hst_mock_role"));
    } catch {
      // ignore
    }
  }, []);

  if (!import.meta.env.DEV) return null;

  const applyRole = (role: string | null) => {
    try {
      if (role) window.localStorage.setItem("hst_mock_role", role);
      else window.localStorage.removeItem("hst_mock_role");
    } catch {
      // ignore
    }
    setCurrent(role);
    queryClient.invalidateQueries();
    if (role) {
      const portal = ROLE_TO_PORTAL[role];
      const dashboard = portal ? PORTALS[portal].dashboardRoute : "/";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigate({ to: dashboard as any, replace: true });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      navigate({ to: "/" as any, replace: true });
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[60]">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant={current ? "default" : "outline"}
            className="shadow-lg gap-2 rounded-full"
          >
            <UserCog className="h-4 w-4" />
            <span className="text-xs">
              {current ? `Mock: ${ROLE_LABELS[current] ?? current}` : "Dev · Role"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 max-h-96 overflow-y-auto">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Simulate Role (dev only)
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {ALL_ROLES.map((role) => (
            <DropdownMenuItem
              key={role}
              onClick={() => applyRole(role)}
              className={current === role ? "bg-accent" : ""}
            >
              {ROLE_LABELS[role] ?? role}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => applyRole(null)} className="text-destructive">
            <X className="h-3 w-3 mr-2" /> Clear override
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
