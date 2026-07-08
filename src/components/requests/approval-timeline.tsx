import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  AlertCircle,
  LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export interface ApprovalStep {
  id: string;
  step_order: number;
  approver_name: string;
  approver_role: string;
  status: "pending" | "approved" | "rejected" | "skipped";
  action?: string;
  comment?: string;
  actioned_at?: string;
  duration?: string;
}

interface ApprovalTimelineProps {
  steps: ApprovalStep[];
  className?: string;
}

const stepIcons: Record<string, LucideIcon> = {
  approved: CheckCircle2,
  rejected: XCircle,
  pending: Clock,
  skipped: AlertCircle,
};

const stepColors: Record<string, string> = {
  approved: "text-emerald-600 border-emerald-300 bg-emerald-50",
  rejected: "text-red-600 border-red-300 bg-red-50",
  pending: "text-amber-600 border-amber-300 bg-amber-50",
  skipped: "text-gray-500 border-gray-300 bg-gray-50",
};

const stepIconBg: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  pending: "bg-amber-100 text-amber-700",
  skipped: "bg-gray-100 text-gray-500",
};

export function ApprovalTimeline({ steps, className }: ApprovalTimelineProps) {
  if (!steps || steps.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground py-4 text-center", className)}>
        No approval steps configured for this request.
      </div>
    );
  }

  return (
    <div className={cn("space-y-0", className)}>
      {steps.map((step, index) => {
        const Icon = stepIcons[step.status] || Clock;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="relative flex gap-4 pb-2">
            {/* Vertical connector line */}
            {!isLast && (
              <div className="absolute left-[19px] top-10 bottom-0 w-px bg-border" />
            )}

            {/* Icon */}
            <div
              className={cn(
                "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2",
                stepColors[step.status] || stepColors.pending
              )}
            >
              <Icon className="h-4 w-4" />
            </div>

            {/* Content */}
            <div className="flex-1 pb-4 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium truncate">
                    {step.approver_name}
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 shrink-0">
                    {step.approver_role}
                  </Badge>
                </div>
                <Badge
                  variant={
                    step.status === "approved"
                      ? "default"
                      : step.status === "rejected"
                      ? "destructive"
                      : "outline"
                  }
                  className="shrink-0 text-[10px] px-1.5 py-0 h-5 capitalize"
                >
                  {step.status}
                </Badge>
              </div>

              {step.comment && (
                <p className="mt-1 text-xs text-muted-foreground bg-muted/30 rounded-md px-2 py-1.5 italic">
                  "{step.comment}"
                </p>
              )}

              <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
                {step.actioned_at && (
                  <span>Actioned: {step.actioned_at}</span>
                )}
                {step.duration && (
                  <span>Duration: {step.duration}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}